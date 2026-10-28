from django.urls import path
from apps.orders.views import (
    CartView,
    CartItemDetailView,
    CartClearView,
    CheckoutView,
    RazorpayCreateOrderView,
    RazorpayVerifyPaymentView,
    RazorpayPaymentFailView,
    RazorpayRefundView,
    RazorpayWebhookView,
    StripeCreateIntentView,
    EmailLogListView,
    SendTestEmailView,
    EmailResendView,
    ContactInquiryView,
    CustomerOrderListView,
    CustomerOrderDetailView,
    VendorOrderListView,
    VendorOrderDetailView,
    VendorOrderStatusUpdateView,
    AdminOrderListView,
    AdminOrderDetailView,
    AdminDisburseVendorOrderView
)

urlpatterns = [
    # Cart
    path('cart/', CartView.as_view(), name='cart_view'),
    path('cart/items/<int:id>/', CartItemDetailView.as_view(), name='cart_item_detail'),
    path('cart/clear/', CartClearView.as_view(), name='cart_clear'),

    # Checkout
    path('orders/checkout/', CheckoutView.as_view(), name='order_checkout'),
    path('checkout/', CheckoutView.as_view(), name='checkout_alias'),

    # Production Razorpay Payments
    path('payments/razorpay/create/', RazorpayCreateOrderView.as_view(), name='razorpay_create'),
    path('payments/razorpay/verify/', RazorpayVerifyPaymentView.as_view(), name='razorpay_verify'),
    path('payments/razorpay/fail/', RazorpayPaymentFailView.as_view(), name='razorpay_fail'),
    path('payments/razorpay/refund/', RazorpayRefundView.as_view(), name='razorpay_refund'),
    path('payments/razorpay/webhook/', RazorpayWebhookView.as_view(), name='razorpay_webhook'),

    # Production Stripe Payments
    path('payments/stripe/create-intent/', StripeCreateIntentView.as_view(), name='stripe_create_intent'),

    # Email Service & Audit Log (Diagnostic & Notification Center)
    path('emails/', EmailLogListView.as_view(), name='email_list'),
    path('emails/send-test/', SendTestEmailView.as_view(), name='email_send_test'),
    path('emails/<int:id>/resend/', EmailResendView.as_view(), name='email_resend'),
    path('contact/', ContactInquiryView.as_view(), name='contact_inquiry'),

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
    path('admin/vendor-orders/<int:id>/disburse/', AdminDisburseVendorOrderView.as_view(), name='admin_vendor_order_disburse'),
]
