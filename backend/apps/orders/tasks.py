import logging
from celery import shared_task
from django.utils import timezone
from django.db import transaction
from datetime import timedelta

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_order_confirmation_async(self, order_number: str):
    """
    Celery task to asynchronously dispatch customer order confirmation email with HTML receipt.
    """
    from apps.orders.models import Order
    from apps.orders.services import EmailService
    try:
        order = Order.objects.prefetch_related('items__product', 'items__vendor').get(order_number=order_number)
        EmailService.send_order_confirmation(order)
        return True
    except Order.DoesNotExist:
        logger.error(f"Order #{order_number} not found for order confirmation email.")
        return False
    except Exception as exc:
        logger.warning(f"Error sending order confirmation for #{order_number}: {exc}. Retrying...")
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_vendor_order_notification_async(self, vendor_order_id: int):
    """
    Celery task to asynchronously dispatch vendor order notification email.
    """
    from apps.orders.models import VendorOrder
    from apps.orders.services import EmailService
    try:
        vendor_order = VendorOrder.objects.select_related('vendor', 'order').get(id=vendor_order_id)
        EmailService.send_vendor_order_notification(vendor_order)
        return True
    except VendorOrder.DoesNotExist:
        logger.error(f"VendorOrder ID {vendor_order_id} not found.")
        return False
    except Exception as exc:
        logger.warning(f"Error notifying vendor for VendorOrder {vendor_order_id}: {exc}. Retrying...")
        raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_low_stock_alert_async(self, product_id: int):
    """
    Celery task to asynchronously notify vendor of inventory dropping below threshold.
    """
    from apps.products.models import Product
    from apps.orders.services import EmailService
    try:
        product = Product.objects.select_related('vendor').get(id=product_id)
        EmailService.send_low_stock_alert(product)
        return True
    except Product.DoesNotExist:
        logger.error(f"Product ID {product_id} not found for low stock alert.")
        return False
    except Exception as exc:
        logger.warning(f"Error sending low stock alert for product {product_id}: {exc}. Retrying...")
        raise self.retry(exc=exc)


@shared_task
def release_expired_orders_async(timeout_minutes: int = 30):
    """
    Scheduled Celery task that reclaims held inventory for uncompleted checkout orders
    that have stayed in PENDING_PAYMENT status for longer than the timeout period.
    """
    from apps.orders.models import Order
    from apps.products.models import Product

    cutoff_time = timezone.now() - timedelta(minutes=timeout_minutes)
    expired_orders = Order.objects.filter(
        status='PENDING_PAYMENT',
        created_at__lte=cutoff_time
    ).prefetch_related('items__product', 'vendor_orders')

    count = expired_orders.count()
    if count == 0:
        return {'cancelled_orders': 0, 'restored_items': 0}

    logger.info(f"Releasing stock for {count} expired order(s)...")
    restored_items_count = 0

    with transaction.atomic():
        for order in expired_orders:
            for item in order.items.all():
                if item.product:
                    product = Product.objects.select_for_update().get(id=item.product.id)
                    product.inventory_count += item.quantity
                    product.save(update_fields=['inventory_count'])
                    restored_items_count += item.quantity

            order.status = 'PAYMENT_FAILED'
            order.payment_status = 'FAILED'
            order.save(update_fields=['status', 'payment_status', 'updated_at'])

            for vo in order.vendor_orders.all():
                vo.status = 'CANCELLED'
                vo.save(update_fields=['status', 'updated_at'])

    logger.info(f"Successfully cancelled {count} expired order(s) and restored {restored_items_count} item unit(s).")
    return {'cancelled_orders': count, 'restored_items': restored_items_count}
