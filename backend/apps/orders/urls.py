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
    AdminDisburseVendorOrderView,
    CouponApplyView,
    OrderCancelView,
    OrderDisputeCreateView,
    VendorDisputeListView,
    VendorDisputeReplyView,
    AdminDisputeListView,
    AdminDisputeResolveView,
    VendorPayoutRequestListCreateView,
    AdminPayoutRequestListView,
    AdminPayoutRequestActionView
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

    # Customer Orders & Coupons & Disputes
    path('orders/coupons/apply/', CouponApplyView.as_view(), name='coupon_apply'),
    path('orders/', CustomerOrderListView.as_view(), name='customer_order_list'),
    path('orders/<str:order_number>/', CustomerOrderDetailView.as_view(), name='customer_order_detail'),
    path('orders/<str:order_number>/cancel/', OrderCancelView.as_view(), name='order_cancel'),
    path('orders/<str:order_number>/dispute/', OrderDisputeCreateView.as_view(), name='order_dispute_create'),

    # Vendor Orders & Payouts & Disputes
    path('vendor/orders/', VendorOrderListView.as_view(), name='vendor_order_list'),
    path('vendor/orders/<int:id>/', VendorOrderDetailView.as_view(), name='vendor_order_detail'),
    path('vendor/orders/<int:id>/status/', VendorOrderStatusUpdateView.as_view(), name='vendor_order_status_update'),
    path('vendor/payout-requests/', VendorPayoutRequestListCreateView.as_view(), name='vendor_payout_requests'),
    path('vendor/disputes/', VendorDisputeListView.as_view(), name='vendor_disputes'),
    path('vendor/disputes/<int:pk>/reply/', VendorDisputeReplyView.as_view(), name='vendor_dispute_reply'),

    # Admin Orders & Disputes & Payouts
    path('admin/orders/', AdminOrderListView.as_view(), name='admin_order_list'),
    path('admin/orders/<str:order_number>/', AdminOrderDetailView.as_view(), name='admin_order_detail'),
    path('admin/vendor-orders/<int:id>/disburse/', AdminDisburseVendorOrderView.as_view(), name='admin_vendor_order_disburse'),
    path('admin/disputes/', AdminDisputeListView.as_view(), name='admin_disputes'),
    path('admin/disputes/<int:pk>/resolve/', AdminDisputeResolveView.as_view(), name='admin_dispute_resolve'),
    path('admin/payout-requests/', AdminPayoutRequestListView.as_view(), name='admin_payout_requests'),
    path('admin/payout-requests/<int:pk>/', AdminPayoutRequestActionView.as_view(), name='admin_payout_request_action'),
]
