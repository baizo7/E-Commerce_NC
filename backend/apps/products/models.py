from django.db import models
from django.utils import timezone
from django.utils.text import slugify
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal
from apps.accounts.models import User, VendorProfile

class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=120, unique=True, blank=True)
    description = models.TextField(blank=True)
    image_url = models.CharField(max_length=500, blank=True)
    icon = models.CharField(max_length=50, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['name']

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name)
            slug = base_slug
            counter = 1
            while Category.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Product(models.Model):
    vendor = models.ForeignKey(VendorProfile, on_delete=models.CASCADE, related_name='products')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=280, unique=True, blank=True)
    description = models.TextField()
    short_description = models.CharField(max_length=300, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    compare_at_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    sku = models.CharField(max_length=100, blank=True)
    inventory_count = models.PositiveIntegerField(default=10)
    low_stock_threshold = models.PositiveIntegerField(default=5)
    is_active = models.BooleanField(default=True)
    is_approved = models.BooleanField(default=True) # Admin product moderation
    is_featured = models.BooleanField(default=False)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=5.00)
    review_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['is_active', 'is_approved', '-created_at'], name='prod_act_appr_date_idx'),
            models.Index(fields=['category', 'is_active', 'is_approved'], name='prod_cat_act_appr_idx'),
            models.Index(fields=['is_active', 'is_approved', 'price'], name='prod_act_appr_price_idx'),
            models.Index(fields=['vendor', 'is_active'], name='prod_vendor_act_idx'),
            models.Index(fields=['is_featured'], name='prod_feat_idx'),
            models.Index(fields=['slug'], name='prod_slug_idx'),
        ]

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        old_price = None
        old_compare = None
        if not is_new:
            try:
                orig = Product.objects.get(pk=self.pk)
                old_price = orig.price
                old_compare = orig.compare_at_price
            except Product.DoesNotExist:
                pass

        if not self.slug:
            base_slug = slugify(self.title)
            slug = base_slug
            counter = 1
            while Product.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

        # Record price history upon creation or price change
        if is_new or (old_price is not None and (old_price != self.price or old_compare != self.compare_at_price)):
            reason = 'INITIAL' if is_new else getattr(self, '_change_reason', 'MANUAL_UPDATE')
            PriceHistory.objects.create(
                product=self,
                price=self.price,
                compare_at_price=self.compare_at_price,
                change_reason=reason,
                effective_from=timezone.now()
            )

    @property
    def primary_image(self):
        img = self.images.filter(is_primary=True).first()
        if not img:
            img = self.images.first()
        return img.image_url if img else ''

    @property
    def is_in_stock(self):
        return self.inventory_count > 0

    @property
    def is_low_stock(self):
        return 0 < self.inventory_count <= self.low_stock_threshold

    def __str__(self):
        return f"{self.title} ({self.vendor.store_name})"


class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image_url = models.CharField(max_length=500)
    alt_text = models.CharField(max_length=200, blank=True)
    is_primary = models.BooleanField(default=False)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['sort_order', 'id']

    def __str__(self):
        return f"Image for {self.product.title}"


class Review(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews')
    rating = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)], default=5)
    title = models.CharField(max_length=150, blank=True)
    comment = models.TextField()
    is_verified_purchase = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ('product', 'customer')

    def save(self, *args, **kwargs):
        # Auto-verify purchase status against completed orders
        if not self.is_verified_purchase and self.customer_id and self.product_id:
            try:
                from apps.orders.models import OrderItem
                has_bought = OrderItem.objects.filter(
                    order__customer_id=self.customer_id,
                    product_id=self.product_id,
                    order__status__in=['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED']
                ).exists()
                if has_bought:
                    self.is_verified_purchase = True
            except Exception:
                pass

        super().save(*args, **kwargs)
        # Update product aggregate rating
        reviews = self.product.reviews.all()
        if reviews.exists():
            avg_rating = sum(r.rating for r in reviews) / reviews.count()
            self.product.rating = round(avg_rating, 2)
            self.product.review_count = reviews.count()
            self.product.save(update_fields=['rating', 'review_count'])

    def __str__(self):
        return f"{self.rating}* by {self.customer.email} for {self.product.title}"


class ProductVariant(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variants')
    title = models.CharField(max_length=100) # e.g. "Space Gray / 256GB", "Red / XL"
    sku = models.CharField(max_length=100, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    compare_at_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    inventory_count = models.PositiveIntegerField(default=10)
    attributes = models.JSONField(default=dict, blank=True) # {"Color": "Black", "Size": "XL"}
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['id']

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        old_price = None
        old_compare = None
        if not is_new:
            try:
                orig = ProductVariant.objects.get(pk=self.pk)
                old_price = orig.price
                old_compare = orig.compare_at_price
            except ProductVariant.DoesNotExist:
                pass

        super().save(*args, **kwargs)

        if is_new or (old_price is not None and (old_price != self.price or old_compare != self.compare_at_price)):
            reason = 'INITIAL' if is_new else getattr(self, '_change_reason', 'MANUAL_UPDATE')
            PriceHistory.objects.create(
                product=self.product,
                variant=self,
                price=self.price,
                compare_at_price=self.compare_at_price,
                change_reason=reason,
                effective_from=timezone.now()
            )

    def __str__(self):
        return f"{self.product.title} - {self.title}"


class WishlistItem(models.Model):
    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='wishlist_items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='wishlisted_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('customer', 'product')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.customer.email} -> {self.product.title}"


class PlatformBanner(models.Model):
    BANNER_TYPES = (
        ('PROMO', 'Promotion'),
        ('INFO', 'Informational'),
        ('WARNING', 'Alert / Notice'),
    )
    title = models.CharField(max_length=150)
    message = models.TextField()
    link_url = models.CharField(max_length=300, blank=True)
    banner_type = models.CharField(max_length=20, choices=BANNER_TYPES, default='PROMO')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.banner_type}] {self.title}"


class PriceHistory(models.Model):
    """
    Audit log of product and variant price changes over time (Feature B).
    Enables authentic historical price tracking, 30-day moving averages,
    and inflation/discount disclosure without hallucinated baseline figures.
    """
    REASON_CHOICES = (
        ('INITIAL', 'Initial Product Listing'),
        ('MANUAL_UPDATE', 'Vendor Manual Update'),
        ('BULK_CSV', 'Bulk CSV Catalog Import'),
        ('PROMO_START', 'Promotional Campaign Start'),
        ('PROMO_END', 'Promotional Campaign End'),
    )

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='price_history')
    variant = models.ForeignKey('products.ProductVariant', on_delete=models.CASCADE, null=True, blank=True, related_name='price_history')
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    compare_at_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=10, default='INR')
    change_reason = models.CharField(max_length=30, choices=REASON_CHOICES, default='MANUAL_UPDATE')
    effective_from = models.DateTimeField(default=timezone.now, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-effective_from']
        indexes = [
            models.Index(fields=['product', '-effective_from'], name='ph_prod_date_idx'),
            models.Index(fields=['variant', '-effective_from'], name='ph_var_date_idx'),
        ]

    def __str__(self):
        target = f"{self.product.title}" if not self.variant else f"{self.product.title} ({self.variant.title})"
        return f"{target} -> ₹{self.price} ({self.change_reason} @ {self.effective_from.strftime('%Y-%m-%d')})"


