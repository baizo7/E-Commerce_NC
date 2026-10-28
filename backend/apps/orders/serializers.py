from rest_framework import serializers
from apps.orders.models import Cart, CartItem, Order, VendorOrder, OrderItem, Payment, EmailLog, Coupon, PayoutRequest, Dispute
from apps.products.models import ProductVariant
from apps.products.serializers import ProductListSerializer, ProductVariantSerializer

class CartItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)
    variant = ProductVariantSerializer(read_only=True)
    variant_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = CartItem
        fields = ['id', 'product', 'product_id', 'variant', 'variant_id', 'quantity', 'subtotal']


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
            'id', 'product', 'product_title', 'variant', 'variant_title', 'product_sku', 'vendor',
            'vendor_name', 'price', 'tax_rate', 'commission_rate', 'quantity', 'subtotal', 'image_url'
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
            'is_disbursed', 'disbursed_at', 'disbursement_reference',
            'items', 'created_at', 'updated_at'
        ]


class PaymentSerializer(serializers.ModelSerializer):
    order_number = serializers.CharField(source='order.order_number', read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id', 'order', 'order_number', 'razorpay_order_id',
            'razorpay_payment_id', 'amount', 'amount_in_subunits',
            'currency', 'status', 'is_verified', 'created_at'
        ]


class OrderSerializer(serializers.ModelSerializer):
    vendor_orders = VendorOrderSerializer(many=True, read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)
    payments = PaymentSerializer(many=True, read_only=True)
    customer_email = serializers.EmailField(source='customer.email', read_only=True)
    coupon_code = serializers.CharField(source='coupon.code', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'customer', 'customer_email',
            'total_items_amount', 'shipping_amount', 'tax_amount', 'discount_amount', 'grand_total',
            'coupon', 'coupon_code', 'status', 'payment_status', 'payment_method', 'payment_id',
            'shipping_name', 'shipping_email', 'shipping_phone',
            'shipping_address', 'shipping_city', 'shipping_state',
            'shipping_postal_code', 'shipping_country',
            'cancellation_reason', 'cancelled_at',
            'vendor_orders', 'items', 'payments', 'created_at', 'updated_at'
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
        choices=['RAZORPAY', 'CREDIT_CARD', 'UPI', 'CASH_ON_DELIVERY'],
        default='RAZORPAY'
    )
    coupon_code = serializers.CharField(max_length=50, required=False, allow_blank=True)


class CouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = [
            'id', 'code', 'discount_type', 'value', 'min_purchase_amount',
            'max_discount_amount', 'is_active', 'usage_count', 'max_uses',
            'valid_from', 'valid_until'
        ]


class PayoutRequestSerializer(serializers.ModelSerializer):
    store_name = serializers.CharField(source='vendor.store_name', read_only=True)
    vendor_slug = serializers.CharField(source='vendor.slug', read_only=True)

    class Meta:
        model = PayoutRequest
        fields = [
            'id', 'vendor', 'store_name', 'vendor_slug', 'amount',
            'bank_name', 'bank_account_number', 'status', 'admin_notes',
            'reference', 'created_at', 'processed_at'
        ]
        read_only_fields = ['id', 'vendor', 'store_name', 'vendor_slug', 'created_at']


class DisputeSerializer(serializers.ModelSerializer):
    order_number = serializers.CharField(source='order.order_number', read_only=True)
    customer_email = serializers.CharField(source='customer.email', read_only=True)
    vendor_name = serializers.CharField(source='vendor.store_name', read_only=True)

    class Meta:
        model = Dispute
        fields = [
            'id', 'order', 'order_number', 'vendor_order', 'customer',
            'customer_email', 'vendor', 'vendor_name', 'reason', 'amount',
            'customer_notes', 'vendor_reply', 'admin_decision', 'status',
            'created_at', 'resolved_at'
        ]
        read_only_fields = ['id', 'order', 'customer', 'vendor', 'order_number', 'customer_email', 'vendor_name', 'created_at']



class RazorpayCreateOrderSerializer(serializers.Serializer):
    order_number = serializers.CharField(max_length=50)


class RazorpayVerifyPaymentSerializer(serializers.Serializer):
    razorpay_order_id = serializers.CharField(max_length=100)
    razorpay_payment_id = serializers.CharField(max_length=100)
    razorpay_signature = serializers.CharField(max_length=255)


class RazorpayPaymentFailSerializer(serializers.Serializer):
    razorpay_order_id = serializers.CharField(max_length=100)
    error_code = serializers.CharField(max_length=100, required=False, allow_blank=True)
    error_description = serializers.CharField(required=False, allow_blank=True)
    error_source = serializers.CharField(max_length=100, required=False, allow_blank=True)
    error_step = serializers.CharField(max_length=100, required=False, allow_blank=True)
    error_reason = serializers.CharField(max_length=100, required=False, allow_blank=True)


class RazorpayRefundSerializer(serializers.Serializer):
    order_number = serializers.CharField(max_length=50)
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    reason = serializers.CharField(max_length=255, default='Customer cancellation / return')


class EmailLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailLog
        fields = [
            'id', 'recipient', 'subject', 'body_text', 'body_html',
            'status', 'error_message', 'email_type', 'order', 'created_at'
        ]


class SendTestEmailSerializer(serializers.Serializer):
    to_email = serializers.EmailField()


class ContactInquirySerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=30, required=False, allow_blank=True)
    subject = serializers.CharField(max_length=255)
    message = serializers.CharField()
    query_type = serializers.ChoiceField(
        choices=['VENDOR_QUERY', 'CUSTOMER_SUPPORT', 'ORDER_ISSUE', 'GENERAL'],
        default='GENERAL'
    )



