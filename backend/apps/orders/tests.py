from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from decimal import Decimal
from apps.accounts.models import User, VendorProfile
from apps.products.models import Category, Product
from apps.orders.models import Order, VendorOrder

class OrderCheckoutTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.customer = User.objects.create_user(
            email='shopper@test.com',
            username='shopper',
            password='Password@123',
            role='CUSTOMER'
        )

        # Vendor 1
        v1_user = User.objects.create_user(email='v1@test.com', username='v1', password='Password@123', role='VENDOR')
        self.v1 = VendorProfile.objects.create(user=v1_user, store_name='Store One', commission_rate=Decimal('10.00'), status='APPROVED')

        # Vendor 2
        v2_user = User.objects.create_user(email='v2@test.com', username='v2', password='Password@123', role='VENDOR')
        self.v2 = VendorProfile.objects.create(user=v2_user, store_name='Store Two', commission_rate=Decimal('15.00'), status='APPROVED')

        self.cat = Category.objects.create(name='General', slug='general')

        self.p1 = Product.objects.create(
            vendor=self.v1,
            category=self.cat,
            title='Keyboard One',
            price=Decimal('100.00'),
            inventory_count=5,
            is_active=True,
            is_approved=True
        )

        self.p2 = Product.objects.create(
            vendor=self.v2,
            category=self.cat,
            title='Ceramic Mug Two',
            price=Decimal('20.00'),
            inventory_count=10,
            is_active=True,
            is_approved=True
        )

    def test_multi_vendor_order_split_and_inventory_decrement(self):
        self.client.force_authenticate(user=self.customer)

        # 1. Add item from Vendor 1 to cart
        res1 = self.client.post('/api/cart/', {'product_id': self.p1.id, 'quantity': 2})
        self.assertEqual(res1.status_code, status.HTTP_200_OK)

        # 2. Add item from Vendor 2 to cart
        res2 = self.client.post('/api/cart/', {'product_id': self.p2.id, 'quantity': 3})
        self.assertEqual(res2.status_code, status.HTTP_200_OK)

        # 3. Checkout
        checkout_payload = {
            'shipping_name': 'Shopper Jane',
            'shipping_email': 'shopper@test.com',
            'shipping_phone': '+1 (555) 000-1111',
            'shipping_address': '123 Market St',
            'shipping_city': 'Seattle',
            'shipping_state': 'WA',
            'shipping_postal_code': '98101',
            'shipping_country': 'United States',
            'payment_method': 'CREDIT_CARD'
        }
        res_checkout = self.client.post('/api/orders/checkout/', checkout_payload)
        self.assertEqual(res_checkout.status_code, status.HTTP_201_CREATED)

        order_data = res_checkout.data
        order_number = order_data['order_number']
        order = Order.objects.get(order_number=order_number)

        # Subtotal: (2 * 100) + (3 * 20) = 200 + 60 = 260.00
        self.assertEqual(order.total_items_amount, Decimal('260.00'))

        # Verify Multi-Vendor Split: exactly 2 VendorOrders created!
        vendor_orders = order.vendor_orders.all()
        self.assertEqual(vendor_orders.count(), 2)

        # Verify Vendor 1 sub-order & commission
        vo1 = vendor_orders.filter(vendor=self.v1).first()
        self.assertIsNotNone(vo1)
        self.assertEqual(vo1.subtotal, Decimal('200.00'))
        self.assertEqual(vo1.commission_amount, Decimal('20.00')) # 10%
        self.assertEqual(vo1.net_vendor_amount, Decimal('180.00'))

        # Verify Vendor 2 sub-order & commission
        vo2 = vendor_orders.filter(vendor=self.v2).first()
        self.assertIsNotNone(vo2)
        self.assertEqual(vo2.subtotal, Decimal('60.00'))
        self.assertEqual(vo2.commission_amount, Decimal('9.00')) # 15% of 60
        self.assertEqual(vo2.net_vendor_amount, Decimal('51.00'))

        # Verify atomic stock decrement
        self.p1.refresh_from_db()
        self.p2.refresh_from_db()
        self.assertEqual(self.p1.inventory_count, 3) # 5 - 2 = 3
        self.assertEqual(self.p2.inventory_count, 7) # 10 - 3 = 7

    def test_insufficient_stock_prevents_order(self):
        self.client.force_authenticate(user=self.customer)
        # Attempt to add more than stock
        res = self.client.post('/api/cart/', {'product_id': self.p1.id, 'quantity': 10})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('stock', res.data['error'].lower())
