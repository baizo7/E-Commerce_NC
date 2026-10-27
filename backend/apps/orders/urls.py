from django.urls import path
from apps.orders.views import (
    CartView,
    CartItemDetailView,
    CartClearView,
    CheckoutView,
    RazorpayCreateOrderView,
    RazorpayVerifyPaymentView,
    RazorpayWebhookView,
    CustomerOrderListView,
    CustomerOrderDetailView,
    VendorOrderListView,
    VendorOrderDetailView,
    VendorOrderStatusUpdateView,
    AdminOrderListView,
    AdminOrderDetailView
)

urlpatterns = [
    # Cart
    path('cart/', CartView.as_view(), name='cart_view'),
    path('cart/items/<int:id>/', CartItemDetailView.as_view(), name='cart_item_detail'),
    path('cart/clear/', CartClearView.as_view(), name='cart_clear'),

    # Checkout
    path('orders/checkout/', CheckoutView.as_view(), name='order_checkout'),
    path('checkout/', CheckoutView.as_view(), name='checkout_alias'),

    # Razorpay Payments (Section 8 in v1.1 Report)
    path('payments/razorpay/create/', RazorpayCreateOrderView.as_view(), name='razorpay_create'),
    path('payments/razorpay/verify/', RazorpayVerifyPaymentView.as_view(), name='razorpay_verify'),
    path('payments/razorpay/webhook/', RazorpayWebhookView.as_view(), name='razorpay_webhook'),

    # Customer Orders
    path('orders/', CustomerOrderListView.as_view(), name='customer_order_list'),
    path('orders/<str:order_number>/', CustomerOrderDetailView.as_view(), name='customer_order_detail'),

    # Vendor Orders
    path('vendor/orders/', VendorOrderListView.as_view(), name='vendor_order_list'),
    path('vendor/orders/<int:id>/', VendorOrderDetailView.as_view(), name='vendor_order_detail'),
    path('vendor/orders/<int:id>/status/', VendorOrderStatusUpdateView.as_view(), name='vendor_order_status_update'),

    # Admin Orders
    path('admin/orders/', AdminOrderListView.as_view(), name='admin_order_list'),
    path('admin/orders/<str:order_number>/', AdminOrderDetailView.as_view(), name='admin_order_detail'),
]
