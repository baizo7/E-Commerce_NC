from django.contrib import admin
from apps.orders.models import Cart, CartItem, Order, VendorOrder, OrderItem

class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0

@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ('customer', 'total_items', 'subtotal', 'updated_at')
    inlines = [CartItemInline]

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('product', 'product_title', 'product_sku', 'vendor', 'price', 'quantity', 'subtotal')

class VendorOrderInline(admin.TabularInline):
    model = VendorOrder
    extra = 0
    readonly_fields = ('vendor', 'subtotal', 'commission_rate', 'commission_amount', 'net_vendor_amount')

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('order_number', 'customer', 'grand_total', 'status', 'payment_status', 'created_at')
    list_filter = ('status', 'payment_status', 'created_at')
    search_fields = ('order_number', 'customer__email', 'shipping_name')
    inlines = [VendorOrderInline, OrderItemInline]

@admin.register(VendorOrder)
class VendorOrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'order', 'vendor', 'subtotal', 'commission_amount', 'net_vendor_amount', 'status', 'tracking_number')
    list_filter = ('status', 'created_at')
    search_fields = ('order__order_number', 'vendor__store_name', 'tracking_number')
    inlines = [OrderItemInline]
