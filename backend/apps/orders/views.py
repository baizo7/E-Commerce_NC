from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import transaction
from django.utils import timezone
from django.conf import settings
from decimal import Decimal
import uuid
import json

from apps.orders.models import Cart, CartItem, Order, VendorOrder, OrderItem, Payment, EmailLog
from apps.products.models import Product
from apps.accounts.models import VendorProfile
from apps.orders.serializers import (
    CartSerializer,
    CartItemSerializer,
    OrderSerializer,
    VendorOrderSerializer,
    CheckoutSerializer,
    PaymentSerializer,
    RazorpayCreateOrderSerializer,
    RazorpayVerifyPaymentSerializer,
    RazorpayPaymentFailSerializer,
    RazorpayRefundSerializer,
    EmailLogSerializer,
    SendTestEmailSerializer,
    ContactInquirySerializer
)
from apps.orders.services import RazorpayService, StripeService, EmailService
from apps.accounts.permissions import IsVendorUser, IsAdminUserRole

class CartView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_or_create_cart(self, user):
        cart, _ = Cart.objects.get_or_create(customer=user)
        return cart

    def get(self, request):
        cart = self.get_or_create_cart(request.user)
        serializer = CartSerializer(cart)
        return Response(serializer.data)

    def post(self, request):
        """
        Add or update quantity of product in cart
        """
        cart = self.get_or_create_cart(request.user)
        product_id = request.data.get('product_id')
        quantity = int(request.data.get('quantity', 1))

        if not product_id:
            return Response({'error': 'product_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            product = Product.objects.get(id=product_id, is_active=True, is_approved=True)
        except Product.DoesNotExist:
            return Response({'error': 'Product does not exist or is not available'}, status=status.HTTP_404_NOT_FOUND)

        if product.inventory_count < quantity:
            return Response({
                'error': f'Only {product.inventory_count} items in stock for "{product.title}".'
            }, status=status.HTTP_400_BAD_REQUEST)

        cart_item, created = CartItem.objects.get_or_create(cart=cart, product=product)
        if not created:
            new_qty = cart_item.quantity + quantity
            if new_qty > product.inventory_count:
                return Response({
                    'error': f'Cannot add {quantity} more. Current in cart: {cart_item.quantity}. In stock: {product.inventory_count}.'
                }, status=status.HTTP_400_BAD_REQUEST)
            cart_item.quantity = new_qty
        else:
            cart_item.quantity = quantity
        cart_item.save()

        return Response(CartSerializer(cart).data, status=status.HTTP_200_OK)


class CartItemDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, id):
        try:
            cart_item = CartItem.objects.get(id=id, cart__customer=request.user)
        except CartItem.DoesNotExist:
            return Response({'error': 'Cart item not found'}, status=status.HTTP_404_NOT_FOUND)

        quantity = int(request.data.get('quantity', 1))
        if quantity <= 0:
            cart_item.delete()
        else:
            if cart_item.product.inventory_count < quantity:
                return Response({
                    'error': f'Only {cart_item.product.inventory_count} in stock.'
                }, status=status.HTTP_400_BAD_REQUEST)
            cart_item.quantity = quantity
            cart_item.save()

        return Response(CartSerializer(cart_item.cart).data)

    def delete(self, request, id):
        try:
            cart_item = CartItem.objects.get(id=id, cart__customer=request.user)
            cart = cart_item.cart
            cart_item.delete()
            return Response(CartSerializer(cart).data)
        except CartItem.DoesNotExist:
            return Response({'error': 'Cart item not found'}, status=status.HTTP_404_NOT_FOUND)


class CartClearView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        cart, _ = Cart.objects.get_or_create(customer=request.user)
        cart.items.all().delete()
        return Response(CartSerializer(cart).data)


class CheckoutView(APIView):
    """
    Transactional Checkout with Concurrency Locking & Multi-Vendor Order Splitting.
    Adheres to v1.1 order state machine:
    - Creates order in PENDING_PAYMENT or PAID
    - Atomically locks inventory rows using select_for_update()
    - Splits order into autonomous VendorOrder instances
    - Generates Razorpay payment payload
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            cart = Cart.objects.prefetch_related('items__product').get(customer=request.user)
        except Cart.DoesNotExist:
            return Response({'error': 'Cart is empty'}, status=status.HTTP_400_BAD_REQUEST)

        cart_items = list(cart.items.all())
        if not cart_items:
            return Response({'error': 'Cart is empty'}, status=status.HTTP_400_BAD_REQUEST)

        payment_method = data.get('payment_method', 'RAZORPAY')
        is_instant_simulated = payment_method in ['CREDIT_CARD', 'UPI', 'CASH_ON_DELIVERY']

        # Atomic transaction with product row locking to prevent race conditions
        with transaction.atomic():
            product_ids = [item.product_id for item in cart_items]
            locked_products = {
                p.id: p for p in Product.objects.select_for_update().filter(id__in=product_ids)
            }

            # 1. Validate stock availability under row lock
            for item in cart_items:
                product = locked_products.get(item.product_id)
                if not product or not product.is_active or not product.is_approved:
                    return Response({
                        'error': f'Product "{item.product.title}" is no longer available.'
                    }, status=status.HTTP_400_BAD_REQUEST)

                if product.inventory_count < item.quantity:
                    return Response({
                        'error': f'Insufficient stock for "{product.title}". Requested: {item.quantity}, Available: {product.inventory_count}.'
                    }, status=status.HTTP_400_BAD_REQUEST)

            # 2. Calculate totals
            total_items_amount = sum(item.product.price * item.quantity for item in cart_items)
            shipping_amount = Decimal('0.00') if total_items_amount >= Decimal('100.00') else Decimal('10.00')
            tax_amount = round(total_items_amount * Decimal('0.05'), 2) # 5% tax
            grand_total = total_items_amount + shipping_amount + tax_amount

            initial_status = 'PAID' if is_instant_simulated else 'PENDING_PAYMENT'
            initial_payment_status = 'PAID' if is_instant_simulated else 'PENDING'

            # 3. Create Master Order
            order = Order.objects.create(
                customer=request.user,
                total_items_amount=total_items_amount,
                shipping_amount=shipping_amount,
                tax_amount=tax_amount,
                grand_total=grand_total,
                status=initial_status,
                payment_status=initial_payment_status,
                payment_method=payment_method,
                payment_id=f"PAY-{uuid.uuid4().hex[:10].upper()}" if is_instant_simulated else '',
                shipping_name=data['shipping_name'],
                shipping_email=data['shipping_email'],
                shipping_phone=data['shipping_phone'],
                shipping_address=data['shipping_address'],
                shipping_city=data['shipping_city'],
                shipping_state=data.get('shipping_state', ''),
                shipping_postal_code=data['shipping_postal_code'],
                shipping_country=data.get('shipping_country', 'United States'),
            )

            # 4. Group items by vendor for Multi-Vendor Splitting
            vendor_items_map = {}
            for item in cart_items:
                v_id = item.product.vendor_id
                if v_id not in vendor_items_map:
                    vendor_items_map[v_id] = []
                vendor_items_map[v_id].append(item)

            # 5. Create VendorOrder & OrderItem for each vendor
            for vendor_id, items in vendor_items_map.items():
                vendor = VendorProfile.objects.select_for_update().get(id=vendor_id)
                vendor_subtotal = sum(i.product.price * i.quantity for i in items)
                commission_rate = vendor.commission_rate
                commission_amount = round(vendor_subtotal * (commission_rate / Decimal('100.00')), 2)
                net_vendor_amount = vendor_subtotal - commission_amount

                # Create Vendor Sub-Order
                vendor_order = VendorOrder.objects.create(
                    order=order,
                    vendor=vendor,
                    subtotal=vendor_subtotal,
                    commission_rate=commission_rate,
                    commission_amount=commission_amount,
                    net_vendor_amount=net_vendor_amount,
                    status='PROCESSING' if is_instant_simulated else 'PENDING'
                )

                if is_instant_simulated:
                    vendor.total_sales += vendor_subtotal
                    vendor.save(update_fields=['total_sales'])

                # Create line items & decrement stock
                for item in items:
                    prod = locked_products[item.product_id]
                    # Stock decrement under lock (Section 6.2 & 6.4)
                    prod.inventory_count -= item.quantity
                    prod.save(update_fields=['inventory_count'])

                    # OrderItem snapshot with price, tax, and commission rates
                    OrderItem.objects.create(
                        order=order,
                        vendor_order=vendor_order,
                        product=prod,
                        vendor=vendor,
                        product_title=prod.title,
                        product_sku=prod.sku,
                        price=prod.price,
                        tax_rate=Decimal('5.00'),
                        commission_rate=commission_rate,
                        quantity=item.quantity,
                        subtotal=prod.price * item.quantity,
                        image_url=prod.primary_image
                    )

            # 6. Clear user cart
            cart.items.all().delete()

        # 7. Initialize Razorpay Payment Order if selected
        razorpay_payload = None
        if payment_method == 'RAZORPAY':
            razorpay_payload = RazorpayService.create_payment_order(order)
        elif is_instant_simulated:
            EmailService.send_order_confirmation(order)

        response_data = OrderSerializer(order).data
        if razorpay_payload:
            response_data['razorpay_payload'] = razorpay_payload

        return Response(response_data, status=status.HTTP_201_CREATED)


class RazorpayCreateOrderView(APIView):
    """
    POST /payments/razorpay/create/
    Creates a Razorpay payment order for an existing Order in PENDING_PAYMENT status.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = RazorpayCreateOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order_number = serializer.validated_data['order_number']

        try:
            order = Order.objects.get(order_number=order_number, customer=request.user)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        if order.status not in ['PENDING_PAYMENT', 'CONFIRMED']:
            return Response({
                'error': f'Order is already in {order.status} state. No payment required.'
            }, status=status.HTTP_400_BAD_REQUEST)

        payload = RazorpayService.create_payment_order(order)
        return Response(payload, status=status.HTTP_200_OK)


class RazorpayVerifyPaymentView(APIView):
    """
    POST /payments/razorpay/verify/
    Verifies Razorpay signature server-side.
    Marks order as PAID only after cryptographic HMAC validation.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = RazorpayVerifyPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            payment = RazorpayService.confirm_payment(
                razorpay_order_id=data['razorpay_order_id'],
                razorpay_payment_id=data['razorpay_payment_id'],
                razorpay_signature=data['razorpay_signature']
            )
            return Response({
                'message': 'Payment verified successfully.',
                'order_number': payment.order.order_number,
                'status': payment.order.status,
                'payment': PaymentSerializer(payment).data,
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class RazorpayPaymentFailView(APIView):
    """
    POST /payments/razorpay/fail/
    Directly logs customer gateway failure from payment.failed SDK listener.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = RazorpayPaymentFailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        payment = RazorpayService.record_payment_failure(data['razorpay_order_id'], data)
        if not payment:
            return Response({'error': 'Payment record not found.'}, status=status.HTTP_404_NOT_FOUND)

        return Response({
            'message': 'Payment failure recorded.',
            'order_number': payment.order.order_number,
            'status': payment.order.status
        }, status=status.HTTP_200_OK)


class RazorpayRefundView(APIView):
    """
    POST /payments/razorpay/refund/
    Initiates an official refund through the Razorpay gateway API.
    Authorized for Admins and Vendors.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = RazorpayRefundSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            order = Order.objects.get(order_number=data['order_number'])
        except Order.DoesNotExist:
            return Response({'error': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        if not (request.user.is_staff or request.user.role == 'ADMIN'):
            return Response({'error': 'Only administrators can initiate refunds.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            refund_res = RazorpayService.initiate_refund(
                order=order,
                amount=data.get('amount'),
                reason=data.get('reason', 'Administrative cancellation / refund')
            )
            return Response({
                'message': 'Refund initiated successfully via Razorpay.',
                'refund': refund_res
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class StripeCreateIntentView(APIView):
    """
    POST /payments/stripe/create-intent/
    Generates a production Stripe PaymentIntent for the given order.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        order_number = request.data.get('order_number')
        try:
            order = Order.objects.get(order_number=order_number, customer=request.user)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            intent_data = StripeService.create_payment_intent(order)
            return Response(intent_data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class RazorpayWebhookView(APIView):
    """
    POST /payments/razorpay/webhook/
    Verified webhook handler for asynchronous Razorpay event notifications.
    Ensures payment status integrity even if customer closes browser prematurely.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        raw_body = request.body
        signature = request.headers.get('X-Razorpay-Signature', '')
        webhook_secret = settings.RAZORPAY_WEBHOOK_SECRET

        # Verify cryptographic signature if secret is configured
        if webhook_secret:
            import hmac
            import hashlib
            expected_sig = hmac.new(
                webhook_secret.encode('utf-8'),
                raw_body,
                hashlib.sha256
            ).hexdigest()
            if not hmac.compare_digest(expected_sig, signature):
                return Response({'error': 'Invalid webhook signature'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            event_data = json.loads(raw_body.decode('utf-8'))
            event_name = event_data.get('event')
            payload = event_data.get('payload', {}).get('payment', {}).get('entity', {})
            rzp_order_id = payload.get('order_id')
            rzp_payment_id = payload.get('id')

            if event_name in ['payment.captured', 'order.paid'] and rzp_order_id:
                try:
                    payment = Payment.objects.get(razorpay_order_id=rzp_order_id)
                    if not payment.is_verified:
                        payment.razorpay_payment_id = rzp_payment_id
                        payment.status = 'CAPTURED'
                        payment.is_verified = True
                        payment.save()
                        order = payment.order
                        if order.status == 'PENDING_PAYMENT':
                            order.transition_to('PAID')
                            EmailService.send_order_confirmation(order)
                except Payment.DoesNotExist:
                    pass

            elif event_name == 'payment.failed' and rzp_order_id:
                try:
                    payment = Payment.objects.get(razorpay_order_id=rzp_order_id)
                    payment.status = 'FAILED'
                    payment.raw_response = {**payment.raw_response, 'webhook_failure': event_data}
                    payment.save(update_fields=['status', 'raw_response', 'updated_at'])
                    if payment.order.status == 'PENDING_PAYMENT':
                        payment.order.transition_to('PAYMENT_FAILED')
                except Payment.DoesNotExist:
                    pass

            elif event_name in ['refund.processed', 'refund.created']:
                refund_entity = event_data.get('payload', {}).get('refund', {}).get('entity', {})
                pay_id = refund_entity.get('payment_id') or payload.get('id')
                if pay_id:
                    try:
                        payment = Payment.objects.get(razorpay_payment_id=pay_id)
                        payment.status = 'REFUNDED'
                        payment.raw_response = {**payment.raw_response, 'webhook_refund': event_data}
                        payment.save(update_fields=['status', 'raw_response', 'updated_at'])
                    except Payment.DoesNotExist:
                        pass

            return Response({'status': 'ok'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class CustomerOrderListView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(customer=self.request.user).prefetch_related('vendor_orders__vendor', 'items').order_by('-created_at')


class CustomerOrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    lookup_field = 'order_number'
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(customer=self.request.user).prefetch_related('vendor_orders__items', 'items')


class VendorOrderListView(generics.ListAPIView):
    serializer_class = VendorOrderSerializer
    permission_classes = [IsVendorUser]

    def get_queryset(self):
        vendor = self.request.user.vendor_profile
        qs = VendorOrder.objects.filter(vendor=vendor).select_related('order').prefetch_related('items').order_by('-created_at')
        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param.upper())
        return qs


class VendorOrderDetailView(generics.RetrieveAPIView):
    serializer_class = VendorOrderSerializer
    lookup_field = 'id'
    permission_classes = [IsVendorUser]

    def get_queryset(self):
        vendor = self.request.user.vendor_profile
        return VendorOrder.objects.filter(vendor=vendor).select_related('order').prefetch_related('items')


class VendorOrderStatusUpdateView(APIView):
    permission_classes = [IsVendorUser]

    def patch(self, request, id):
        vendor = request.user.vendor_profile
        try:
            vendor_order = VendorOrder.objects.get(id=id, vendor=vendor)
        except VendorOrder.DoesNotExist:
            return Response({'error': 'Vendor order not found'}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status')
        tracking_number = request.data.get('tracking_number')
        carrier = request.data.get('carrier')

        if new_status:
            if not vendor_order.can_transition_to(new_status):
                return Response({
                    'error': f'Invalid state transition from {vendor_order.status} to {new_status}.'
                }, status=status.HTTP_400_BAD_REQUEST)

            vendor_order.status = new_status
            if new_status == 'SHIPPED':
                vendor_order.shipped_at = timezone.now()
            elif new_status == 'DELIVERED':
                vendor_order.delivered_at = timezone.now()

        if tracking_number is not None:
            vendor_order.tracking_number = tracking_number
        if carrier is not None:
            vendor_order.carrier = carrier

        vendor_order.save()

        # Notify customer with parcel tracking details
        if new_status == 'SHIPPED':
            EmailService.send_order_shipped_notification(vendor_order)

        # Update parent order if all sub-orders reached milestone
        parent_order = vendor_order.order
        all_sub_orders = parent_order.vendor_orders.all()
        if all(sub.status == 'DELIVERED' for sub in all_sub_orders):
            if parent_order.can_transition_to('DELIVERED'):
                parent_order.transition_to('DELIVERED')
        elif any(sub.status in ['SHIPPED', 'DELIVERED'] for sub in all_sub_orders):
            if parent_order.can_transition_to('SHIPPED'):
                parent_order.transition_to('SHIPPED')

        return Response(VendorOrderSerializer(vendor_order).data)


class AdminOrderListView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAdminUserRole]

    def get_queryset(self):
        qs = Order.objects.all().prefetch_related('vendor_orders__vendor', 'items').order_by('-created_at')
        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param.upper())
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(order_number__icontains=search)
        return qs


class AdminOrderDetailView(generics.RetrieveAPIView):
    queryset = Order.objects.all().prefetch_related('vendor_orders__items', 'items')
    serializer_class = OrderSerializer
    lookup_field = 'order_number'
    permission_classes = [IsAdminUserRole]


class EmailLogListView(generics.ListAPIView):
    """
    GET /api/v1/emails/
    Returns outbound email audit trail logs.
    Admins see all emails; customers and vendors see their own communications.
    """
    serializer_class = EmailLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or getattr(user, 'role', '') == 'ADMIN':
            return EmailLog.objects.all()
        return EmailLog.objects.filter(recipient=user.email)


class SendTestEmailView(APIView):
    """
    POST /api/v1/emails/send-test/
    Sends a live diagnostic test email to verify SMTP configuration and network connectivity.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = SendTestEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        to_email = serializer.validated_data['to_email']

        result = EmailService.send_test_email(to_email)
        return Response(result, status=status.HTTP_200_OK if result['success'] else status.HTTP_500_INTERNAL_SERVER_ERROR)


class EmailResendView(APIView):
    """
    POST /api/v1/emails/<int:id>/resend/
    Attempts re-dispatch of a previously logged email.
    """
    permission_classes = [IsAdminUserRole]

    def post(self, request, id):
        try:
            log = EmailLog.objects.get(id=id)
        except EmailLog.DoesNotExist:
            return Response({'error': 'Email record not found.'}, status=status.HTTP_404_NOT_FOUND)

        success = EmailService._dispatch(
            recipient=log.recipient,
            subject=log.subject,
            body_text=log.body_text,
            body_html=log.body_html,
            email_type=log.email_type,
            order=log.order
        )
        return Response({'success': success, 'message': 'Email re-dispatched.'})


class ContactInquiryView(APIView):
    """
    POST /contact/
    Processes customer and vendor inquiries, routes to admin (sanjaisam63@gmail.com),
    and sends an auto-acknowledgement email to the user.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ContactInquirySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = EmailService.send_support_query(serializer.validated_data)
        return Response({
            'message': 'Your inquiry has been successfully routed to the platform administrator.',
            'details': result
        }, status=status.HTTP_200_OK)


class AdminDisburseVendorOrderView(APIView):
    """
    POST /api/v1/admin/vendor-orders/<int:id>/disburse/
    Marks a vendor sub-order as paid/disbursed, records the transaction reference,
    and timestamps the settlement.
    """
    permission_classes = [IsAdminUserRole]

    def post(self, request, id):
        vo = VendorOrder.objects.filter(id=id).first()
        if not vo:
            return Response({'error': 'Vendor sub-order not found.'}, status=status.HTTP_404_NOT_FOUND)

        reference = request.data.get('reference', '').strip()
        vo.is_disbursed = True
        vo.disbursed_at = timezone.now()
        if reference:
            vo.disbursement_reference = reference
        vo.save(update_fields=['is_disbursed', 'disbursed_at', 'disbursement_reference', 'updated_at'])

        return Response({
            'message': f"Vendor sub-order #{vo.id} marked as disbursed.",
            'id': vo.id,
            'is_disbursed': vo.is_disbursed,
            'disbursed_at': vo.disbursed_at,
            'disbursement_reference': vo.disbursement_reference,
        }, status=status.HTTP_200_OK)


