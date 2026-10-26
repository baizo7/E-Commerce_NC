from rest_framework import serializers
from apps.orders.models import Cart, CartItem, Order, VendorOrder, OrderItem
from apps.products.serializers import ProductListSerializer

class CartItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = CartItem
        fields = ['id', 'product', 'product_id', 'quantity', 'subtotal']


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_items = serializers.ReadOnlyField()
    subtotal = serializers.ReadOnlyField()
    vendors_involved = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ['id', 'items', 'total_items', 'subtotal', 'vendors_involved', 'updated_at']

    def get_vendors_involved(self, obj):
        vendors = {}
        for item in obj.items.select_related('product__vendor'):
            v = item.product.vendor
            if v.id not in vendors:
                vendors[v.id] = {
                    'id': v.id,
                    'store_name': v.store_name,
                    'slug': v.slug,
                    'items_count': 0,
                    'subtotal': 0.0
                }
            vendors[v.id]['items_count'] += item.quantity
            vendors[v.id]['subtotal'] += float(item.subtotal)
        return list(vendors.values())


class OrderItemSerializer(serializers.ModelSerializer):
    vendor_name = serializers.CharField(source='vendor.store_name', read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            'id', 'product', 'product_title', 'product_sku', 'vendor',
            'vendor_name', 'price', 'quantity', 'subtotal', 'image_url'
        ]


class VendorOrderSerializer(serializers.ModelSerializer):
    vendor_name = serializers.CharField(source='vendor.store_name', read_only=True)
    vendor_slug = serializers.CharField(source='vendor.slug', read_only=True)
    order_number = serializers.CharField(source='order.order_number', read_only=True)
    customer_email = serializers.CharField(source='order.customer.email', read_only=True)
    shipping_name = serializers.CharField(source='order.shipping_name', read_only=True)
    shipping_city = serializers.CharField(source='order.shipping_city', read_only=True)
    shipping_address = serializers.CharField(source='order.shipping_address', read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = VendorOrder
        fields = [
            'id', 'order', 'order_number', 'vendor', 'vendor_name', 'vendor_slug',
            'customer_email', 'shipping_name', 'shipping_city', 'shipping_address',
            'subtotal', 'commission_rate', 'commission_amount', 'net_vendor_amount',
            'status', 'tracking_number', 'carrier', 'shipped_at', 'delivered_at',
            'items', 'created_at', 'updated_at'
        ]


class OrderSerializer(serializers.ModelSerializer):
    vendor_orders = VendorOrderSerializer(many=True, read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)
    customer_email = serializers.EmailField(source='customer.email', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'customer', 'customer_email',
            'total_items_amount', 'shipping_amount', 'tax_amount', 'grand_total',
            'status', 'payment_status', 'payment_method', 'payment_id',
            'shipping_name', 'shipping_email', 'shipping_phone',
            'shipping_address', 'shipping_city', 'shipping_state',
            'shipping_postal_code', 'shipping_country',
            'vendor_orders', 'items', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'order_number', 'customer', 'total_items_amount',
            'grand_total', 'status', 'created_at', 'updated_at'
        ]


class CheckoutSerializer(serializers.Serializer):
    shipping_name = serializers.CharField(max_length=150)
    shipping_email = serializers.EmailField()
    shipping_phone = serializers.CharField(max_length=30)
    shipping_address = serializers.CharField()
    shipping_city = serializers.CharField(max_length=100)
    shipping_state = serializers.CharField(max_length=100, required=False, allow_blank=True)
    shipping_postal_code = serializers.CharField(max_length=20)
    shipping_country = serializers.CharField(max_length=100, default='United States')
    payment_method = serializers.ChoiceField(
        choices=['CREDIT_CARD', 'UPI', 'CASH_ON_DELIVERY', 'SIMULATED_GATEWAY'],
        default='CREDIT_CARD'
    )
