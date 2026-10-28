from decimal import Decimal
from typing import List, Dict, Any, Optional
from django.db.models import Q
from apps.products.models import Product
from apps.shopping_assistant.services.review_confidence_service import ReviewConfidenceService


class AffordableRankerService:
    """
    Ranks products within a customer's budget by balancing price savings,
    customer ratings, and merchant reliability.
    """

    WEIGHT_PRESETS = {
        'balanced': {'afford': 0.35, 'quality': 0.35, 'discount': 0.20, 'vendor': 0.10},
        'affordability': {'afford': 0.55, 'quality': 0.25, 'discount': 0.15, 'vendor': 0.05},
        'rating': {'afford': 0.20, 'quality': 0.55, 'discount': 0.15, 'vendor': 0.10},
        'discount': {'afford': 0.20, 'quality': 0.20, 'discount': 0.50, 'vendor': 0.10},
    }

    @classmethod
    def recommend(
        cls,
        budget_max: float,
        query: Optional[str] = None,
        category_slug: Optional[str] = None,
        prioritize: str = 'balanced',
        limit: int = 4
    ) -> List[Dict[str, Any]]:
        weights = cls.WEIGHT_PRESETS.get(prioritize, cls.WEIGHT_PRESETS['balanced'])
        budget_dec = Decimal(str(budget_max))

        # Stage 1: Hard Constraint Filter
        qs = Product.objects.filter(
            is_active=True,
            is_approved=True,
            vendor__status='APPROVED',
            inventory_count__gt=0,
            price__lte=budget_dec
        ).select_related('vendor', 'category').prefetch_related('reviews__customer')

        if category_slug:
            qs = qs.filter(Q(category__slug=category_slug) | Q(category__name__icontains=category_slug))

        if query and query.strip():
            terms = [t.strip() for t in query.split() if len(t.strip()) > 1 and not t.isdigit()]
            if terms:
                term_filter = Q()
                for t in terms:
                    term_filter |= Q(title__icontains=t) | Q(description__icontains=t) | Q(category__name__icontains=t)
                qs = qs.filter(term_filter)

        candidates = list(qs[: limit * 5])
        if not candidates:
            return []

        # Find min price in candidate pool for normalization
        prices = [float(p.price) for p in candidates]
        min_p = min(prices)
        price_range = max(1.0, float(budget_max) - min_p)

        scored_items = []
        for p in candidates:
            price_val = float(p.price)
            compare_val = float(p.compare_at_price) if p.compare_at_price else price_val
            discount_pct = max(0, round(((compare_val - price_val) / compare_val) * 100)) if compare_val > price_val else 0

            # 1. Normalized Affordability [0, 1] (Lower price gets higher score)
            s_afford = max(0.0, min(1.0, 1.0 - ((price_val - min_p) / price_range)))

            # 2. Normalized Bayesian Quality [0, 1]
            bayesian = ReviewConfidenceService.calculate_bayesian_score(float(p.rating), p.review_count)
            s_quality = max(0.0, min(1.0, (bayesian - 1.0) / 4.0))

            # 3. Normalized Discount Depth [0, 1] (50%+ discount = 1.0)
            s_discount = min(1.0, discount_pct / 50.0)

            # 4. Normalized Vendor Trust [0, 1]
            vendor_rating = float(p.vendor.rating) if hasattr(p.vendor, 'rating') else 4.0
            s_vendor = max(0.0, min(1.0, (vendor_rating - 1.0) / 4.0))

            total_score = (
                weights['afford'] * s_afford +
                weights['quality'] * s_quality +
                weights['discount'] * s_discount +
                weights['vendor'] * s_vendor
            )

            # Generate natural language explainability reasoning
            reasons = []
            under_budget_pct = round(((budget_max - price_val) / budget_max) * 100)
            if under_budget_pct > 0:
                reasons.append(f"{under_budget_pct}% below budget")
            if bayesian >= 4.2:
                reasons.append(f"{bayesian:.1f}★ buyer rating ({p.review_count} reviews)")
            if discount_pct > 0:
                reasons.append(f"{discount_pct}% active savings")

            reason_str = ", ".join(reasons) if reasons else "Good balance of price and customer satisfaction"

            scored_items.append({
                'id': p.id,
                'title': p.title,
                'slug': p.slug,
                'category_name': p.category.name if p.category else '',
                'vendor_name': p.vendor.store_name,
                'current_price': price_val,
                'compare_at_price': compare_val if compare_val > price_val else None,
                'discount_percent': discount_pct,
                'inventory_count': p.inventory_count,
                'raw_rating': float(p.rating),
                'review_count': p.review_count,
                'bayesian_score': bayesian,
                'composite_score': round(total_score, 3),
                'recommendation_reason': reason_str,
                'primary_image': p.primary_image,
                'pdp_url': f"/products/{p.slug}"
            })

        # Sort by total composite score descending
        scored_items.sort(key=lambda x: x['composite_score'], reverse=True)
        return scored_items[:limit]
