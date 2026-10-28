from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from decimal import Decimal
from apps.accounts.models import User, VendorProfile
from apps.products.models import Category, Product

class ProductTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.vendor_user = User.objects.create_user(
            email='seller@test.com',
            username='seller',
            password='Password@123',
            role='VENDOR'
        )
        self.vendor = VendorProfile.objects.create(
            user=self.vendor_user,
            store_name='Seller Shop',
            status='APPROVED'
        )
        self.category = Category.objects.create(name='Tech & Gadgets', slug='tech-gadgets')
        self.product = Product.objects.create(
            vendor=self.vendor,
            category=self.category,
            title='Wireless Mouse',
            price=Decimal('29.99'),
            inventory_count=15,
            is_active=True,
            is_approved=True
        )

    def test_public_product_list(self):
        response = self.client.get('/api/products/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Results might be paginated
        results = response.data.get('results', response.data)
        self.assertTrue(len(results) >= 1)
        self.assertEqual(results[0]['title'], 'Wireless Mouse')

    def test_vendor_create_product(self):
        self.client.force_authenticate(user=self.vendor_user)
        response = self.client.post('/api/vendor/products/', {
            'category': self.category.id,
            'title': 'Mechanical NumPad',
            'description': 'Compact mechanical numpad with hot-swappable switches',
            'short_description': 'Compact numpad',
            'price': '49.99',
            'inventory_count': 10,
            'image_urls': ['https://example.com/numpad.jpg']
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Product.objects.filter(title='Mechanical NumPad').exists())

    def test_vendor_cannot_modify_other_vendor_product(self):
        other_vendor_user = User.objects.create_user(
            email='other@test.com',
            username='other',
            password='Password@123',
            role='VENDOR'
        )
        VendorProfile.objects.create(
            user=other_vendor_user,
            store_name='Other Shop',
            status='APPROVED'
        )
        self.client.force_authenticate(user=other_vendor_user)
        response = self.client.patch(f'/api/vendor/products/{self.product.id}/', {
            'title': 'Hacked Title'
        })
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_celery_csv_import_task(self):
        from apps.products.tasks import process_csv_import_async

        csv_content = (
            "title,price,compare_at_price,inventory_count,category,sku,description\n"
            "Async Monitor 27,299.99,349.99,15,Tech & Gadgets,SKU-MON-27,High refresh rate monitor\n"
            "Async Ergonomic Arm,69.50,,25,Tech & Gadgets,SKU-ARM-01,Heavy duty gas spring desk arm\n"
        )
        res = process_csv_import_async(self.vendor.id, csv_content)
        self.assertEqual(res['status'], 'success')
        self.assertEqual(res['created_count'], 2)
        self.assertTrue(Product.objects.filter(title='Async Monitor 27').exists())
        self.assertTrue(Product.objects.filter(title='Async Ergonomic Arm').exists())

    def test_category_cached_endpoint(self):
        response = self.client.get('/api/categories/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data) >= 1)

    def test_price_history_tracking_on_create_and_update(self):
        from apps.products.models import PriceHistory, ProductVariant

        # 1. Product creation should have logged an INITIAL PriceHistory record
        initial_history = PriceHistory.objects.filter(product=self.product, variant__isnull=True)
        self.assertTrue(initial_history.exists())
        self.assertEqual(initial_history.first().price, Decimal('29.99'))
        self.assertEqual(initial_history.first().change_reason, 'INITIAL')

        # 2. Updating price should log a MANUAL_UPDATE PriceHistory record
        self.product.price = Decimal('24.99')
        self.product.compare_at_price = Decimal('29.99')
        self.product.save()

        records = PriceHistory.objects.filter(product=self.product, variant__isnull=True).order_by('-effective_from')
        self.assertEqual(records.count(), 2)
        latest = records.first()
        self.assertEqual(latest.price, Decimal('24.99'))
        self.assertEqual(latest.compare_at_price, Decimal('29.99'))
        self.assertEqual(latest.change_reason, 'MANUAL_UPDATE')

        # 3. Product Variant price tracking
        variant = ProductVariant.objects.create(
            product=self.product,
            title='Pro Edition',
            price=Decimal('39.99'),
            compare_at_price=Decimal('49.99')
        )
        var_history = PriceHistory.objects.filter(product=self.product, variant=variant)
        self.assertTrue(var_history.exists())
        self.assertEqual(var_history.first().price, Decimal('39.99'))

    def test_review_verified_purchase_auto_detection(self):
        from apps.products.models import Review
        from apps.orders.models import Order, VendorOrder, OrderItem

        buyer = User.objects.create_user(email='buyer@test.com', username='buyer', password='Password@123', role='CUSTOMER')
        non_buyer = User.objects.create_user(email='stranger@test.com', username='stranger', password='Password@123', role='CUSTOMER')

        # Create paid order for buyer
        order = Order.objects.create(
            customer=buyer,
            total_items_amount=Decimal('29.99'),
            grand_total=Decimal('29.99'),
            status='PAID',
            shipping_name='Buyer',
            shipping_email='buyer@test.com',
            shipping_phone='1234567890',
            shipping_address='123 St',
            shipping_city='City',
            shipping_postal_code='12345'
        )
        vo = VendorOrder.objects.create(
            order=order,
            vendor=self.vendor,
            subtotal=Decimal('29.99'),
            commission_rate=Decimal('10.00'),
            commission_amount=Decimal('3.00'),
            net_vendor_amount=Decimal('26.99'),
            status='PROCESSING'
        )
        OrderItem.objects.create(
            order=order,
            vendor_order=vo,
            product=self.product,
            vendor=self.vendor,
            product_title=self.product.title,
            price=self.product.price,
            quantity=1,
            subtotal=Decimal('29.99')
        )

        # Buyer review should auto-flag as is_verified_purchase=True
        buyer_review = Review.objects.create(
            product=self.product,
            customer=buyer,
            rating=5,
            title='Authentic review',
            comment='Verified buyer review'
        )
        self.assertTrue(buyer_review.is_verified_purchase)

        # Non-buyer review should remain is_verified_purchase=False
        stranger_review = Review.objects.create(
            product=self.product,
            customer=non_buyer,
            rating=4,
            title='Casual comment',
            comment='Have not bought it yet'
        )
        self.assertFalse(stranger_review.is_verified_purchase)

    def test_seed_price_history_management_command(self):
        from django.core.management import call_command
        from apps.products.models import PriceHistory

        PriceHistory.objects.all().delete()
        self.assertEqual(PriceHistory.objects.count(), 0)

        call_command('seed_price_history')
        self.assertGreater(PriceHistory.objects.count(), 0)
        self.assertTrue(PriceHistory.objects.filter(product=self.product, change_reason='INITIAL').exists())
