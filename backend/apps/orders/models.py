from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError
import uuid
from apps.accounts.models import User, VendorProfile
from apps.products.models import Product

class Cart(models.Model):
    customer = models.OneToOneField(User, on_delete=models.CASCADE, related_name='cart')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Cart of {self.customer.email}"

    @property
    def total_items(self):
        return sum(item.quantity for item in self.items.all())

    @property
    def subtotal(self):
        return sum(item.subtotal for item in self.items.all())


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('cart', 'product')

    @property
    def subtotal(self):
        return self.product.price * self.quantity

    def __str__(self):
        return f"{self.quantity}x {self.product.title}"


class Order(models.Model):
    """
    Parent customer order adhering to the v1.1 state machine:
    PENDING_PAYMENT -> PAID -> PROCESSING -> SHIPPED -> DELIVERED
    (with CANCELLED and PAYMENT_FAILED)
    """
    STATUS_CHOICES = (
        ('PENDING_PAYMENT', 'Pending Payment'),
        ('PAID', 'Paid'),
        ('CONFIRMED', 'Confirmed'), # Backwards compatibility alias
        ('PROCESSING', 'Processing'),
        ('SHIPPED', 'Shipped'),
        ('DELIVERED', 'Delivered'),
        ('CANCELLED', 'Cancelled'),
        ('PAYMENT_FAILED', 'Payment Failed'),
    )

    PAYMENT_STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('PAID', 'Paid'),
        ('FAILED', 'Failed'),
        ('REFUNDED', 'Refunded'),
    )

    # Valid transitions map for state machine integrity (Section 6.4)
    VALID_TRANSITIONS = {
        'PENDING_PAYMENT': {'PAID', 'CONFIRMED', 'CANCELLED', 'PAYMENT_FAILED'},
        'CONFIRMED': {'PAID', 'PROCESSING', 'CANCELLED'},
        'PAID': {'PROCESSING', 'CANCELLED'},
        'PROCESSING': {'SHIPPED', 'CANCELLED'},
        'SHIPPED': {'DELIVERED'},
        'DELIVERED': set(),
        'CANCELLED': set(),
        'PAYMENT_FAILED': set(),
    }

    order_number = models.CharField(max_length=50, unique=True, editable=False)
    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    
    total_items_amount = models.DecimalField(max_digits=10, decimal_places=2)
    shipping_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    grand_total = models.DecimalField(max_digits=10, decimal_places=2)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING_PAYMENT')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='PENDING')
    payment_method = models.CharField(max_length=50, default='RAZORPAY')
    payment_id = models.CharField(max_length=100, blank=True)

    # Shipping details
    shipping_name = models.CharField(max_length=150)
    shipping_email = models.EmailField()
    shipping_phone = models.CharField(max_length=30)
    shipping_address = models.TextField()
    shipping_city = models.CharField(max_length=100)
    shipping_state = models.CharField(max_length=100, blank=True)
    shipping_postal_code = models.CharField(max_length=20)
    shipping_country = models.CharField(max_length=100, default='United States')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def can_transition_to(self, new_status):
        if self.status == new_status:
            return True
        allowed = self.VALID_TRANSITIONS.get(self.status, set())
        return new_status in allowed

    def transition_to(self, new_status):
        if not self.can_transition_to(new_status):
            raise ValidationError(f"Invalid state transition from {self.status} to {new_status}.")
        self.status = new_status
        if new_status == 'PAID' or new_status == 'CONFIRMED':
            self.payment_status = 'PAID'
        elif new_status == 'PAYMENT_FAILED':
            self.payment_status = 'FAILED'
        self.save(update_fields=['status', 'payment_status', 'updated_at'])

    def save(self, *args, **kwargs):
        if not self.order_number:
            date_prefix = timezone.now().strftime('%Y%m%d')
            unique_suffix = uuid.uuid4().hex[:6].upper()
            self.order_number = f"ORD-{date_prefix}-{unique_suffix}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Order #{self.order_number} ({self.customer.email}) [{self.status}]"


class VendorOrder(models.Model):
    """
    Sub-order representing a single vendor's slice of a multi-vendor order.
    Enables independent vendor fulfillment, status tracking, and commission calculations.
    """
    STATUS_CHOICES = (
        ('PENDING', 'Pending Payment'),
        ('PROCESSING', 'Processing'),
        ('SHIPPED', 'Shipped'),
        ('DELIVERED', 'Delivered'),
        ('CANCELLED', 'Cancelled'),
    )

    VALID_TRANSITIONS = {
        'PENDING': {'PROCESSING', 'CANCELLED'},
        'PROCESSING': {'SHIPPED', 'CANCELLED'},
        'SHIPPED': {'DELIVERED'},
        'DELIVERED': set(),
        'CANCELLED': set(),
    }

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='vendor_orders')
    vendor = models.ForeignKey(VendorProfile, on_delete=models.CASCADE, related_name='vendor_orders')
    
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    commission_rate = models.DecimalField(max_digits=5, decimal_places=2) # e.g. 10.00
    commission_amount = models.DecimalField(max_digits=10, decimal_places=2)
    net_vendor_amount = models.DecimalField(max_digits=10, decimal_places=2) # payout to vendor

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PROCESSING')
    tracking_number = models.CharField(max_length=100, blank=True)
    carrier = models.CharField(max_length=100, blank=True)
    shipped_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)

    is_disbursed = models.BooleanField(default=False)
    disbursed_at = models.DateTimeField(null=True, blank=True)
    disbursement_reference = models.CharField(max_length=120, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def can_transition_to(self, new_status):
        if self.status == new_status:
            return True
        allowed = self.VALID_TRANSITIONS.get(self.status, set())
        return new_status in allowed

    def __str__(self):
        return f"{self.vendor.store_name} Sub-Order for {self.order.order_number} (${self.subtotal})"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    vendor_order = models.ForeignKey(VendorOrder, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True, related_name='order_items')
    vendor = models.ForeignKey(VendorProfile, on_delete=models.CASCADE)

    # Historical product snapshots (Section 7.1)
    product_title = models.CharField(max_length=255)
    product_sku = models.CharField(max_length=100, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=5.00) # 5% tax snapshot
    commission_rate = models.DecimalField(max_digits=5, decimal_places=2, default=10.00) # snapshot
    quantity = models.PositiveIntegerField(default=1)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    image_url = models.CharField(max_length=500, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.quantity}x {self.product_title} @ ${self.price}"


class Payment(models.Model):
    """
    Razorpay transactional payment audit record (Section 7 in report v1.1).
    Ensures verifiable transaction signatures and idempotent webhook processing.
    """
    STATUS_CHOICES = (
        ('CREATED', 'Created'),
        ('CAPTURED', 'Captured'),
        ('FAILED', 'Failed'),
        ('REFUNDED', 'Refunded'),
    )

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='payments')
    razorpay_order_id = models.CharField(max_length=100, unique=True)
    razorpay_payment_id = models.CharField(max_length=100, blank=True, null=True, unique=True)
    razorpay_signature = models.CharField(max_length=255, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    amount_in_subunits = models.PositiveIntegerField() # In paise (e.g. 50000 = 500.00 INR)
    currency = models.CharField(max_length=10, default='INR')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='CREATED')
    is_verified = models.BooleanField(default=False)
    raw_response = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Payment {self.razorpay_order_id} [{self.status}] (Verified: {self.is_verified})"


class EmailLog(models.Model):
    """
    Audit log of all platform outbound emails (Customer, Vendor, Admin).
    Provides in-app notification tracking, delivery status, and verification.
    """
    STATUS_CHOICES = (
        ('SENT', 'Sent'),
        ('FAILED', 'Failed'),
    )

    recipient = models.EmailField()
    subject = models.CharField(max_length=255)
    body_text = models.TextField()
    body_html = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='SENT')
    error_message = models.TextField(blank=True)
    email_type = models.CharField(max_length=50, default='ORDER_CONFIRMATION')
    order = models.ForeignKey(Order, on_delete=models.SET_NULL, null=True, blank=True, related_name='email_logs')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.status}] {self.recipient} - {self.subject}"

