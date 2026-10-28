from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.products.models import Product, ProductVariant, PriceHistory


class Command(BaseCommand):
    help = 'Seeds initial baseline price history records for products and variants that lack historical tracking.'

    def handle(self, *args, **options):
        products = Product.objects.all()
        created_prod_records = 0
        created_var_records = 0

        for product in products:
            # Check if this product has any price history records
            if not PriceHistory.objects.filter(product=product, variant__isnull=True).exists():
                PriceHistory.objects.create(
                    product=product,
                    variant=None,
                    price=product.price,
                    compare_at_price=product.compare_at_price,
                    currency='INR',
                    change_reason='INITIAL',
                    effective_from=product.created_at or timezone.now()
                )
                created_prod_records += 1

            # Also seed for any variants
            for variant in product.variants.all():
                if not PriceHistory.objects.filter(product=product, variant=variant).exists():
                    PriceHistory.objects.create(
                        product=product,
                        variant=variant,
                        price=variant.price,
                        compare_at_price=variant.compare_at_price,
                        currency='INR',
                        change_reason='INITIAL',
                        effective_from=variant.created_at or product.created_at or timezone.now()
                    )
                    created_var_records += 1

        self.stdout.write(self.style.SUCCESS(
            f"Successfully seeded price history: {created_prod_records} product baseline records and {created_var_records} variant records created."
        ))
