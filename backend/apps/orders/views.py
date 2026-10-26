from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import transaction
from django.utils import timezone
from decimal import Decimal
import uuid

from apps.orders.models import Cart, CartItem, Order, VendorOrder, OrderItem
from apps.products.models import Product
from apps.accounts.models import VendorProfile
from apps.orders.serializers import (
    CartSerializer,
    CartItemSerializer,
    OrderSerializer,
    VendorOrderSerializer,
    CheckoutSerializer
)
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

        # Atomic transaction with product row locking to prevent race conditions
        with transaction.atomic():
            product_ids = [item.product_id for item in cart_items]
            # Lock rows
            locked_products = {
                p.id: p for p in Product.objects.select_for_update().filter(id__in=product_ids)
            }

            # 1. Validate stock availability
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

            # 3. Create Master Order
            order = Order.objects.create(
                customer=request.user,
                total_items_amount=total_items_amount,
                shipping_amount=shipping_amount,
                tax_amount=tax_amount,
                grand_total=grand_total,
                status='CONFIRMED',
                payment_status='PAID',
                payment_method=data.get('payment_method', 'CREDIT_CARD'),
                payment_id=f"PAY-{uuid.uuid4().hex[:10].upper()}",
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
                    status='PROCESSING'
                )

                # Update vendor platform metrics
                vendor.total_sales += vendor_subtotal
                vendor.save(update_fields=['total_sales'])

                # Create line items & decrement stock
                for item in items:
                    prod = locked_products[item.product_id]
                    # Stock decrement
                    prod.inventory_count -= item.quantity
                    prod.save(update_fields=['inventory_count'])

                    # OrderItem snapshot
                    OrderItem.objects.create(
                        order=order,
                        vendor_order=vendor_order,
                        product=prod,
                        vendor=vendor,
                        product_title=prod.title,
                        product_sku=prod.sku,
                        price=prod.price,
                        quantity=item.quantity,
                        subtotal=prod.price * item.quantity,
                        image_url=prod.primary_image
                    )

            # 6. Clear user cart
            cart.items.all().delete()

        # Return the created order
        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


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

        # Check if all vendor orders of the parent order are SHIPPED/DELIVERED
        parent_order = vendor_order.order
        all_sub_orders = parent_order.vendor_orders.all()
        if all(sub.status == 'DELIVERED' for sub in all_sub_orders):
            parent_order.status = 'DELIVERED'
            parent_order.save(update_fields=['status'])
        elif any(sub.status in ['SHIPPED', 'DELIVERED'] for sub in all_sub_orders):
            parent_order.status = 'SHIPPED'
            parent_order.save(update_fields=['status'])

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
