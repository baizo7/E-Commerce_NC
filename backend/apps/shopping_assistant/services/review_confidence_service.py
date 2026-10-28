from decimal import Decimal
from typing import List, Dict, Any, Optional
from django.db.models import Avg, Count, Q
from apps.products.models import Product, Review


class ReviewConfidenceService:
    """
    Deterministic engine for Feature C (Highly Rated Product Finder).
    Computes Bayesian Weighted Ratings to eliminate small-sample bias,
    incorporates verified buyer indicators, and extracts review sentiment summaries.
    """

    CONFIDENCE_THRESHOLD_M = 5  # Minimum reviews before full trust
    GLOBAL_CATEGORY_MEAN_C = 4.20  # Marketplace baseline rating

    @classmethod
    def calculate_bayesian_score(cls, raw_rating: float, review_count: int, category_mean: float = 4.20) -> float:
        v = review_count
        m = cls.CONFIDENCE_THRESHOLD_M
        c = category_mean
        r = raw_rating
        if v == 0:
            return round(c * 0.8, 2)
        score = (v / (v + m)) * r + (m / (v + m)) * c
        return round(score, 2)

    @classmethod
    def find_top_rated(
        cls,
        category_slug: Optional[str] = None,
        min_rating: float = 4.0,
        min_reviews: int = 1,
        query: Optional[str] = None,
        limit: int = 6
    ) -> List[Dict[str, Any]]:
        qs = Product.objects.filter(
            is_active=True,
            is_approved=True,
            vendor__status='APPROVED',
            rating__gte=Decimal(str(min_rating)),
            review_count__gte=min_reviews
        ).select_related('vendor', 'category').prefetch_related('reviews__customer')

        if category_slug:
            qs = qs.filter(Q(category__slug=category_slug) | Q(category__name__icontains=category_slug))

        if query:
            qs = qs.filter(
                Q(title__icontains=query) |
                Q(description__icontains=query)
            )

        products = list(qs[: limit * 3])
        results = []

        for prod in products:
            raw_rating = float(prod.rating)
            reviews_list = list(prod.reviews.all())
            v_count = len(reviews_list)

            # Calculate verified buyer percentage
            verified_count = sum(1 for r in reviews_list if r.is_verified_purchase)
            verified_pct = round((verified_count / v_count) * 100) if v_count > 0 else 0

            # Bayesian score
            bayesian = cls.calculate_bayesian_score(raw_rating, v_count)

            # Extract recent review comments
            recent_comments = [
                {
                    'customer_name': f"{r.customer.first_name} {r.customer.last_name[:1]}." if r.customer.first_name else 'Shopper',
                    'rating': r.rating,
                    'title': r.title,
                    'comment': r.comment[:140],
                    'is_verified': r.is_verified_purchase
                }
                for r in reviews_list[:3]
            ]

            results.append({
                'id': prod.id,
                'title': prod.title,
                'slug': prod.slug,
                'category_name': prod.category.name if prod.category else '',
                'vendor_name': prod.vendor.store_name,
                'price': float(prod.price),
                'current_price': float(prod.price),
                'compare_at_price': float(prod.compare_at_price) if prod.compare_at_price else None,
                'primary_image': prod.primary_image,
                'raw_rating': raw_rating,
                'review_count': v_count,
                'bayesian_score': bayesian,
                'verified_buyer_pct': verified_pct,
                'recent_reviews': recent_comments,
                'pdp_url': f"/products/{prod.slug}"
            })

        # Sort by Bayesian confidence score descending
        results.sort(key=lambda x: x['bayesian_score'], reverse=True)
        return results[:limit]
