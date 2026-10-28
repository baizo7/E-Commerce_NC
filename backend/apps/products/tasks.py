import csv
import io
import logging
from decimal import Decimal
from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=2, default_retry_delay=30)
def process_csv_import_async(self, vendor_id: int, csv_content: str):
    """
    Celery task to asynchronously parse and import bulk catalog items from CSV.
    Prevents large CSV imports from exhausting web server request worker threads.
    """
    from apps.accounts.models import VendorProfile as Vendor
    from apps.products.models import Product, Category

    try:
        vendor = Vendor.objects.get(id=vendor_id)
    except Vendor.DoesNotExist:
        logger.error(f"Vendor ID {vendor_id} not found for CSV import.")
        return {'status': 'error', 'message': 'Vendor not found'}

    try:
        reader = csv.DictReader(io.StringIO(csv_content))
    except Exception as e:
        logger.error(f"Failed to parse CSV content for vendor {vendor_id}: {e}")
        return {'status': 'error', 'message': str(e)}

    created_count = 0
    updated_count = 0
    errors = []

    for row_idx, row in enumerate(reader, start=2):
        title = row.get('title', '').strip()
        if not title:
            continue

        price_str = row.get('price', '').strip()
        try:
            price = Decimal(price_str)
        except Exception:
            errors.append(f"Row {row_idx}: Invalid price '{price_str}' for '{title}'")
            continue

        compare_at_str = row.get('compare_at_price', '').strip()
        compare_at = Decimal(compare_at_str) if compare_at_str else None

        inv_str = row.get('inventory_count', '10').strip()
        inv = int(inv_str) if inv_str.isdigit() else 10

        category_name = row.get('category', '').strip()
        category = None
        if category_name:
            category, _ = Category.objects.get_or_create(
                name=category_name,
                defaults={'slug': category_name.lower().replace(' ', '-')}
            )

        prod_id = row.get('id', '').strip()
        if prod_id and prod_id.isdigit():
            existing = Product.objects.filter(id=int(prod_id), vendor=vendor).first()
            if existing:
                existing.title = title
                existing.price = price
                existing.compare_at_price = compare_at
                existing.inventory_count = inv
                existing.category = category
                if row.get('sku'):
                    existing.sku = row.get('sku').strip()
                if row.get('description'):
                    existing.description = row.get('description').strip()
                if row.get('short_description'):
                    existing.short_description = row.get('short_description').strip()
                existing.save()
                updated_count += 1
                continue

        Product.objects.create(
            vendor=vendor,
            title=title,
            category=category,
            price=price,
            compare_at_price=compare_at,
            inventory_count=inv,
            sku=row.get('sku', '').strip(),
            description=row.get('description', title).strip(),
            short_description=row.get('short_description', '').strip(),
            is_active=True,
            is_approved=True,
        )
        created_count += 1

    summary = {
        'status': 'success',
        'created_count': created_count,
        'updated_count': updated_count,
        'errors_count': len(errors),
        'errors': errors[:50]
    }
    logger.info(f"Vendor #{vendor_id} CSV import completed: {created_count} created, {updated_count} updated.")
    return summary
