from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction
from datetime import timedelta

from apps.orders.models import Order
from apps.products.models import Product

class Command(BaseCommand):
    help = 'Releases stock and cancels orders in PENDING_PAYMENT state older than the timeout threshold (v1.1 Section 6.4).'

    def add_arguments(self, parser):
        parser.add_argument(
            '--timeout-minutes',
            type=int,
            default=30,
            help='Age threshold in minutes for pending payment orders (default: 30)'
        )

    def handle(self, *args, **options):
        timeout_minutes = options['timeout_minutes']
        cutoff_time = timezone.now() - timedelta(minutes=timeout_minutes)

        expired_orders = Order.objects.filter(
            status='PENDING_PAYMENT',
            created_at__lte=cutoff_time
        ).prefetch_related('items__product', 'vendor_orders')

        count = expired_orders.count()
        if count == 0:
            self.stdout.write(self.style.SUCCESS(f"No expired pending payment orders found (older than {timeout_minutes} mins)."))
            return

        self.stdout.write(f"Found {count} expired pending order(s). Releasing reserved stock...")

        restored_items_count = 0
        with transaction.atomic():
            for order in expired_orders:
                # 1. Restore stock under row locks
                for item in order.items.all():
                    if item.product:
                        product = Product.objects.select_for_update().get(id=item.product.id)
                        product.inventory_count += item.quantity
                        product.save(update_fields=['inventory_count'])
                        restored_items_count += item.quantity

                # 2. Transition order to PAYMENT_FAILED
                order.status = 'PAYMENT_FAILED'
                order.payment_status = 'FAILED'
                order.save(update_fields=['status', 'payment_status', 'updated_at'])

                # 3. Cancel sub-orders
                for vo in order.vendor_orders.all():
                    vo.status = 'CANCELLED'
                    vo.save(update_fields=['status', 'updated_at'])

                self.stdout.write(f"  Cancelled order {order.order_number} and released inventory.")

        self.stdout.write(self.style.SUCCESS(
            f"Successfully cancelled {count} expired order(s) and restored {restored_items_count} item unit(s) to inventory."
        ))
