from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import transaction
from django.utils import timezone
from django.conf import settings
from decimal import Decimal
import uuid
import json

from apps.orders.models import Cart, CartItem, Order, VendorOrder, OrderItem, Payment, EmailLog, Coupon, PayoutRequest, Dispute
from apps.products.models import Product, ProductVariant
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
    ContactInquirySerializer,
    CouponSerializer,
    PayoutRequestSerializer,
    DisputeSerializer
)
from apps.orders.services import RazorpayService, StripeService, EmailService
from apps.accounts.permissions import IsVendorUser, IsAdminUserRole
from apps.accounts.services import AuditService

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
        variant_id = request.data.get('variant_id')
        quantity = int(request.data.get('quantity', 1))

        if not product_id:
            return Response({'error': 'product_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            product = Product.objects.get(id=product_id, is_active=True, is_approved=True)
        except Product.DoesNotExist:
            return Response({'error': 'Product does not exist or is not available'}, status=status.HTTP_404_NOT_FOUND)

        variant = None
        if variant_id:
            try:
                variant = ProductVariant.objects.get(id=variant_id, product=product, is_active=True)
            except ProductVariant.DoesNotExist:
                return Response({'error': 'Selected variant does not exist'}, status=status.HTTP_404_NOT_FOUND)

        avail_stock = variant.inventory_count if variant else product.inventory_count
        if avail_stock < quantity:
            item_name = f"{product.title} ({variant.title})" if variant else product.title
            return Response({
                'error': f'Only {avail_stock} items in stock for "{item_name}".'
            }, status=status.HTTP_400_BAD_REQUEST)

        cart_item, created = CartItem.objects.get_or_create(cart=cart, product=product, variant=variant)
        if not created:
            new_qty = cart_item.quantity + quantity
            if new_qty > avail_stock:
                return Response({
                    'error': f'Cannot add {quantity} more. Current in cart: {cart_item.quantity}. In stock: {avail_stock}.'
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

        cart_items = list(cart.items.select_related('product', 'variant').all())
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

                avail_stock = item.variant.inventory_count if item.variant else product.inventory_count
                if avail_stock < item.quantity:
                    item_label = f"{product.title} ({item.variant.title})" if item.variant else product.title
                    return Response({
                        'error': f'Insufficient stock for "{item_label}". Requested: {item.quantity}, Available: {avail_stock}.'
                    }, status=status.HTTP_400_BAD_REQUEST)

            # 2. Calculate totals with optional coupon discount
            total_items_amount = sum((item.variant.price if item.variant else item.product.price) * item.quantity for item in cart_items)
            shipping_amount = Decimal('0.00') if total_items_amount >= Decimal('100.00') else Decimal('10.00')
            tax_amount = round(total_items_amount * Decimal('0.05'), 2) # 5% tax

            # Process Coupon
            coupon_code = data.get('coupon_code', '').strip().upper()
            applied_coupon = None
            discount_amount = Decimal('0.00')
            if coupon_code:
                coupon = Coupon.objects.filter(code=coupon_code, is_active=True).first()
                if coupon:
                    discount_amount = coupon.calculate_discount(total_items_amount)
                    applied_coupon = coupon
                    coupon.usage_count += 1
                    coupon.save(update_fields=['usage_count'])

            grand_total = max(Decimal('0.00'), total_items_amount + shipping_amount + tax_amount - discount_amount)

            initial_status = 'PAID' if is_instant_simulated else 'PENDING_PAYMENT'
            initial_payment_status = 'PAID' if is_instant_simulated else 'PENDING'

            # 3. Create Master Order
            order = Order.objects.create(
                customer=request.user,
                total_items_amount=total_items_amount,
                shipping_amount=shipping_amount,
                tax_amount=tax_amount,
                discount_amount=discount_amount,
                grand_total=grand_total,
                coupon=applied_coupon,
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
                vendor_subtotal = sum((i.variant.price if i.variant else i.product.price) * i.quantity for i in items)
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

                    if item.variant:
                        item.variant.inventory_count = max(0, item.variant.inventory_count - item.quantity)
                        item.variant.save(update_fields=['inventory_count'])

                    # Check for low-stock automated alert
                    if prod.inventory_count <= prod.low_stock_threshold:
                        try:
                            EmailService.send_low_stock_alert_async(prod)
                        except Exception:
                            pass

                    item_unit_price = item.variant.price if item.variant else prod.price
                    # OrderItem snapshot with price, tax, and commission rates
                    OrderItem.objects.create(
                        order=order,
                        vendor_order=vendor_order,
                        product=prod,
                        variant=item.variant,
                        variant_title=item.variant.title if item.variant else '',
                        vendor=vendor,
                        product_title=prod.title,
                        product_sku=item.variant.sku if item.variant and item.variant.sku else prod.sku,
                        price=item_unit_price,
                        tax_rate=Decimal('5.00'),
                        commission_rate=commission_rate,
                        quantity=item.quantity,
                        subtotal=item_unit_price * item.quantity,
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


# Coupon Validation View
class CouponApplyView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        code = request.data.get('code', '').strip().upper()
        try:
            subtotal = Decimal(str(request.data.get('subtotal', 0)))
        except Exception:
            subtotal = Decimal('0.00')

        if not code:
            return Response({'error': 'Coupon code is required.'}, status=status.HTTP_400_BAD_REQUEST)

        coupon = Coupon.objects.filter(code=code, is_active=True).first()
        if not coupon:
            return Response({'error': f"Coupon '{code}' is invalid or expired."}, status=status.HTTP_400_BAD_REQUEST)

        if coupon.min_purchase_amount and subtotal < coupon.min_purchase_amount:
            return Response({'error': f"Minimum cart subtotal of ${coupon.min_purchase_amount} required to use coupon '{code}'."}, status=status.HTTP_400_BAD_REQUEST)

        discount = coupon.calculate_discount(subtotal)
        if discount <= Decimal('0.00'):
            return Response({'error': f"Coupon '{code}' could not be applied to this cart subtotal."}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            'valid': True,
            'code': coupon.code,
            'discount_type': coupon.discount_type,
            'discount_amount': float(discount),
            'new_subtotal': float(max(Decimal('0.00'), subtotal - discount))
        }, status=status.HTTP_200_OK)


# Customer Order Cancellation
class OrderCancelView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, order_number):
        order = Order.objects.filter(order_number=order_number).first()
        if not order:
            return Response({'error': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        if order.customer != request.user and not request.user.is_admin_role:
            return Response({'error': 'Unauthorized to cancel this order.'}, status=status.HTTP_403_FORBIDDEN)

        if not order.can_transition_to('CANCELLED'):
            return Response({'error': f"Order #{order_number} cannot be cancelled in status '{order.status}'."}, status=status.HTTP_400_BAD_REQUEST)

        reason = request.data.get('reason', 'Customer requested cancellation')

        with transaction.atomic():
            # Restock inventory
            for item in order.items.select_related('product', 'variant'):
                if item.product:
                    item.product.inventory_count += item.quantity
                    item.product.save(update_fields=['inventory_count'])
                if item.variant:
                    item.variant.inventory_count += item.quantity
                    item.variant.save(update_fields=['inventory_count'])

            order.status = 'CANCELLED'
            order.cancellation_reason = reason
            order.cancelled_at = timezone.now()
            order.save(update_fields=['status', 'cancellation_reason', 'cancelled_at', 'updated_at'])

            for vo in order.vendor_orders.all():
                if vo.can_transition_to('CANCELLED'):
                    vo.status = 'CANCELLED'
                    vo.save(update_fields=['status', 'updated_at'])

        AuditService.log(request, "ORDER_CANCELLED", "Order", order.order_number, {'reason': reason})

        return Response({
            'message': f"Order #{order_number} has been cancelled and items restored to inventory.",
            'order': OrderSerializer(order).data
        }, status=status.HTTP_200_OK)


# Customer Dispute Creation
class OrderDisputeCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, order_number):
        order = Order.objects.filter(order_number=order_number, customer=request.user).first()
        if not order:
            return Response({'error': 'Order not found or unauthorized.'}, status=status.HTTP_404_NOT_FOUND)

        vendor_order_id = request.data.get('vendor_order_id')
        vendor_order = None
        if vendor_order_id:
            vendor_order = order.vendor_orders.filter(id=vendor_order_id).first()
            if not vendor_order:
                return Response({'error': 'Invalid vendor package reference.'}, status=status.HTTP_400_BAD_REQUEST)
            vendor = vendor_order.vendor
        else:
            first_vo = order.vendor_orders.first()
            vendor = first_vo.vendor if first_vo else None

        if not vendor:
            return Response({'error': 'Unable to identify vendor for dispute.'}, status=status.HTTP_400_BAD_REQUEST)

        reason = request.data.get('reason', 'NOT_AS_DESCRIBED')
        customer_notes = request.data.get('customer_notes', '').strip()
        if not customer_notes:
            return Response({'error': 'Customer explanation/notes are required.'}, status=status.HTTP_400_BAD_REQUEST)

        amount = Decimal(str(request.data.get('amount', vendor_order.subtotal if vendor_order else order.grand_total)))

        dispute = Dispute.objects.create(
            order=order,
            vendor_order=vendor_order,
            customer=request.user,
            vendor=vendor,
            reason=reason,
            amount=amount,
            customer_notes=customer_notes,
            status='OPEN'
        )

        AuditService.log(request, "DISPUTE_FILED", "Dispute", dispute.id, {'order_number': order.order_number, 'amount': str(amount)})

        return Response({
            'message': 'Dispute filed successfully. Our mediation team will review your case.',
            'dispute': DisputeSerializer(dispute).data
        }, status=status.HTTP_201_CREATED)


# Vendor Dispute Views
class VendorDisputeListView(generics.ListAPIView):
    serializer_class = DisputeSerializer
    permission_classes = [IsVendorUser]

    def get_queryset(self):
        return Dispute.objects.filter(vendor=self.request.user.vendor_profile).order_by('-created_at')


class VendorDisputeReplyView(APIView):
    permission_classes = [IsVendorUser]

    def post(self, request, pk):
        dispute = Dispute.objects.filter(id=pk, vendor=request.user.vendor_profile).first()
        if not dispute:
            return Response({'error': 'Dispute not found.'}, status=status.HTTP_404_NOT_FOUND)

        reply = request.data.get('vendor_reply', '').strip()
        if not reply:
            return Response({'error': 'Reply text is required.'}, status=status.HTTP_400_BAD_REQUEST)

        dispute.vendor_reply = reply
        if dispute.status == 'OPEN':
            dispute.status = 'UNDER_REVIEW'
        dispute.save(update_fields=['vendor_reply', 'status'])

        return Response({'message': 'Reply submitted.', 'dispute': DisputeSerializer(dispute).data})


# Admin Dispute Views
class AdminDisputeListView(generics.ListAPIView):
    serializer_class = DisputeSerializer
    permission_classes = [IsAdminUserRole]

    def get_queryset(self):
        qs = Dispute.objects.all().select_related('order', 'customer', 'vendor').order_by('-created_at')
        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param.upper())
        return qs


class AdminDisputeResolveView(APIView):
    permission_classes = [IsAdminUserRole]

    def post(self, request, pk):
        dispute = Dispute.objects.filter(id=pk).first()
        if not dispute:
            return Response({'error': 'Dispute not found.'}, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get('action', '').upper() # 'REFUND' or 'REJECT'
        decision_notes = request.data.get('decision_notes', '').strip()

        refund_details = None
        if action == 'REFUND':
            dispute.status = 'RESOLVED_REFUNDED'
            dispute.resolved_at = timezone.now()
            dispute.admin_decision = decision_notes or 'Claim approved. Full/partial refund initiated via gateway.'
            dispute.save()

            # Attempt automated gateway refund
            try:
                refund_details = RazorpayService.initiate_refund(
                    order=dispute.order,
                    amount=dispute.amount,
                    reason=f"Dispute #{dispute.id} resolution"
                )
            except Exception as e:
                refund_details = {'warning': f"Gateway refund could not be auto-processed: {str(e)}"}

        elif action == 'REJECT':
            dispute.status = 'REJECTED'
            dispute.resolved_at = timezone.now()
            dispute.admin_decision = decision_notes or 'Claim denied following merchant proof review.'
            dispute.save()
        else:
            return Response({'error': "Action must be 'REFUND' or 'REJECT'."}, status=status.HTTP_400_BAD_REQUEST)

        AuditService.log(request, f"DISPUTE_{dispute.status}", "Dispute", dispute.id, {'action': action, 'decision': decision_notes})

        return Response({
            'message': f"Dispute #{dispute.id} resolved with status {dispute.status}.",
            'dispute': DisputeSerializer(dispute).data,
            'refund_details': refund_details
        }, status=status.HTTP_200_OK)


# Vendor Payout Requests
class VendorPayoutRequestListCreateView(APIView):
    permission_classes = [IsVendorUser]

    def get(self, request):
        vendor = request.user.vendor_profile
        requests = PayoutRequest.objects.filter(vendor=vendor).order_by('-created_at')
        return Response(PayoutRequestSerializer(requests, many=True).data)

    def post(self, request):
        vendor = request.user.vendor_profile
        try:
            amount = Decimal(str(request.data.get('amount', 0)))
        except Exception:
            return Response({'error': 'Invalid payout amount.'}, status=status.HTTP_400_BAD_REQUEST)

        if amount <= Decimal('0.00'):
            return Response({'error': 'Payout amount must be greater than zero.'}, status=status.HTTP_400_BAD_REQUEST)

        # Check total net earnings vs already disbursed / pending
        bank_name = request.data.get('bank_name', vendor.bank_name)
        bank_account = request.data.get('bank_account_number', vendor.bank_account_number)

        payout = PayoutRequest.objects.create(
            vendor=vendor,
            amount=amount,
            bank_name=bank_name,
            bank_account_number=bank_account,
            status='PENDING'
        )

        AuditService.log(request, "PAYOUT_REQUESTED", "PayoutRequest", payout.id, {'amount': str(amount)})

        return Response({
            'message': 'Payout request submitted to platform administration.',
            'payout': PayoutRequestSerializer(payout).data
        }, status=status.HTTP_201_CREATED)


# Admin Payout Requests
class AdminPayoutRequestListView(generics.ListAPIView):
    serializer_class = PayoutRequestSerializer
    permission_classes = [IsAdminUserRole]

    def get_queryset(self):
        qs = PayoutRequest.objects.all().select_related('vendor').order_by('-created_at')
        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param.upper())
        return qs


class AdminPayoutRequestActionView(APIView):
    permission_classes = [IsAdminUserRole]

    def patch(self, request, pk):
        payout = PayoutRequest.objects.filter(id=pk).first()
        if not payout:
            return Response({'error': 'Payout request not found.'}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status', '').upper()
        if new_status not in ['APPROVED', 'REJECTED', 'PROCESSED']:
            return Response({'error': 'Invalid status.'}, status=status.HTTP_400_BAD_REQUEST)

        reference = request.data.get('reference', '').strip()
        admin_notes = request.data.get('admin_notes', '').strip()

        payout.status = new_status
        if reference:
            payout.reference = reference
        if admin_notes:
            payout.admin_notes = admin_notes
        if new_status == 'PROCESSED':
            payout.processed_at = timezone.now()
        payout.save()

        AuditService.log(request, f"PAYOUT_{new_status}", "PayoutRequest", payout.id, {'status': new_status, 'reference': reference})

        return Response({
            'message': f"Payout request #{payout.id} updated to {new_status}.",
            'payout': PayoutRequestSerializer(payout).data
        }, status=status.HTTP_200_OK)



