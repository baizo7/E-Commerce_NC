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
