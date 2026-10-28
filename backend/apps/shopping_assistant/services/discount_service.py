from decimal import Decimal
from typing import List, Dict, Any, Optional
from django.db.models import F, Q
from django.utils import timezone
from apps.products.models import Product, Category
from apps.orders.models import Coupon


class DiscountFinderService:
    """
    Deterministic engine for Feature A (Discount Finder).
    Retrieves authentic verified discounts using compare_at_price and active coupons.
    Never invents baseline figures or promotes out-of-stock items.
    """

    @classmethod
    def find_discounts(
        cls,
        category_slug: Optional[str] = None,
        max_price: Optional[float] = None,
        min_discount_percent: Optional[float] = None,
        query: Optional[str] = None,
        limit: int = 6
    ) -> List[Dict[str, Any]]:
        qs = Product.objects.filter(
            is_active=True,
            is_approved=True,
            vendor__status='APPROVED',
            inventory_count__gt=0,
            compare_at_price__gt=F('price') # True genuine discount
        ).select_related('vendor', 'category').prefetch_related('images')

        if category_slug:
            qs = qs.filter(Q(category__slug=category_slug) | Q(category__name__icontains=category_slug))

        if query:
            qs = qs.filter(
                Q(title__icontains=query) |
                Q(description__icontains=query) |
                Q(category__name__icontains=query)
            )

        if max_price is not None:
            qs = qs.filter(price__lte=Decimal(str(max_price)))

        # Retrieve candidate items
        candidates = list(qs[: limit * 3])
        results = []

        # Check for active coupons
        now = timezone.now()
        active_coupons = list(Coupon.objects.filter(
            is_active=True,
            valid_from__lte=now
        ).filter(Q(valid_until__isnull=True) | Q(valid_until__gte=now)))

        for prod in candidates:
            price = Decimal(str(prod.price))
            compare_at = Decimal(str(prod.compare_at_price))
            savings = compare_at - price
            pct = round((savings / compare_at) * 100)

            if min_discount_percent and pct < min_discount_percent:
                continue

            # Applicable coupon check
            best_coupon = None
            if active_coupons:
                for c in active_coupons:
                    if price >= c.min_purchase_amount:
                        disc_val = c.calculate_discount(price)
                        if disc_val > 0:
                            best_coupon = {
                                'code': c.code,
                                'discount_type': c.discount_type,
                                'value': float(c.value),
                                'coupon_savings': float(disc_val)
                            }
                            break

            results.append({
                'id': prod.id,
                'title': prod.title,
                'slug': prod.slug,
                'category_name': prod.category.name if prod.category else '',
                'vendor_name': prod.vendor.store_name,
                'current_price': float(price),
                'compare_at_price': float(compare_at),
                'savings_amount': float(savings),
                'discount_percent': int(pct),
                'inventory_count': prod.inventory_count,
                'rating': float(prod.rating),
                'review_count': prod.review_count,
                'primary_image': prod.primary_image,
                'applicable_coupon': best_coupon,
                'pdp_url': f"/products/{prod.slug}"
            })

            if len(results) >= limit:
                break

        # Sort by biggest discount percentage first
        results.sort(key=lambda x: x['discount_percent'], reverse=True)
        return results
