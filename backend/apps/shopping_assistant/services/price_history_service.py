from decimal import Decimal
from datetime import timedelta
from typing import Dict, Any, Optional
from django.utils import timezone
from apps.products.models import Product, ProductVariant, PriceHistory


class PriceHistoryService:
    """
    Analyze product price trends over time.
    Compares current prices against 30-day averages and previous month milestones.
    """

    @classmethod
    def analyze_product_price(
        cls,
        product_slug_or_id: str,
        variant_id: Optional[int] = None,
        days: int = 30
    ) -> Dict[str, Any]:
        now = timezone.now()
        thirty_days_ago = now - timedelta(days=days)

        # Lookup product by ID, slug, or title search
        prod = None
        if str(product_slug_or_id).isdigit():
            prod = Product.objects.select_related('vendor', 'category').filter(id=int(product_slug_or_id)).first()
        if not prod:
            prod = Product.objects.select_related('vendor', 'category').filter(slug=product_slug_or_id).first()
        if not prod:
            prod = Product.objects.select_related('vendor', 'category').filter(title__icontains=product_slug_or_id).first()
        if not prod:
            prod = Product.objects.select_related('vendor', 'category').filter(slug__icontains=product_slug_or_id).first()

        if not prod:
            return {'error': f"Product '{product_slug_or_id}' not found."}

        variant = None
        current_price = prod.price
        if variant_id:
            variant = ProductVariant.objects.filter(id=variant_id, product=prod).first()
            if variant:
                current_price = variant.price

        history_qs = PriceHistory.objects.filter(
            product=prod,
            variant=variant
        ).order_by('effective_from')

        total_records = history_qs.count()
        earliest_record = history_qs.first()
        earliest_date = earliest_record.effective_from if earliest_record else prod.created_at

        # Check if we have records older than 30 days
        has_sufficient_history = (earliest_date <= thirty_days_ago)

        # Filter records in the 30-day window
        window_records = list(history_qs.filter(effective_from__gte=thirty_days_ago))

        # Calculate time-weighted average or arithmetic average of recorded prices
        if window_records:
            avg_price = sum(r.price for r in window_records) / Decimal(str(len(window_records)))
        else:
            avg_price = current_price

        # Same-day last month record
        same_day_record = history_qs.filter(effective_from__lte=thirty_days_ago).last()
        last_month_price = same_day_record.price if same_day_record else (earliest_record.price if earliest_record else current_price)

        diff_vs_avg = current_price - avg_price
        pct_vs_avg = round(((current_price - avg_price) / avg_price) * 100, 1) if avg_price > 0 else 0

        diff_vs_last_month = current_price - last_month_price
        pct_vs_last_month = round(((current_price - last_month_price) / last_month_price) * 100, 1) if last_month_price > 0 else 0

        trend = 'STABLE'
        if diff_vs_last_month < -Decimal('0.50') or diff_vs_avg < -Decimal('0.50'):
            trend = 'CHEAPER'
        elif diff_vs_last_month > Decimal('0.50') or diff_vs_avg > Decimal('0.50'):
            trend = 'MORE_EXPENSIVE'

        return {
            'product_id': prod.id,
            'title': prod.title,
            'slug': prod.slug,
            'variant_id': variant.id if variant else None,
            'variant_title': variant.title if variant else None,
            'current_price': float(current_price),
            'currency': 'INR',
            'has_sufficient_history': has_sufficient_history,
            'tracking_start_date': earliest_date.strftime('%Y-%m-%d'),
            'records_analyzed': total_records,
            'trend': trend,
            'thirty_day_avg_price': float(round(avg_price, 2)),
            'diff_vs_thirty_day_avg': float(round(diff_vs_avg, 2)),
            'pct_vs_thirty_day_avg': float(pct_vs_avg),
            'last_month_same_day_price': float(last_month_price),
            'diff_vs_last_month_same_day': float(round(diff_vs_last_month, 2)),
            'pct_vs_last_month_same_day': float(pct_vs_last_month),
            'history_disclosure': (
                "Verified 30-day price trend available."
                if has_sufficient_history else
                f"Price tracking began on {earliest_date.strftime('%d %b %Y')}. Historical records are under 30 days old; comparison is relative to earliest recorded listing price."
            ),
            'recent_price_points': [
                {
                    'price': float(r.price),
                    'date': r.effective_from.strftime('%Y-%m-%d'),
                    'reason': r.change_reason
                }
                for r in history_qs.order_by('-effective_from')[:10]
            ]
        }
