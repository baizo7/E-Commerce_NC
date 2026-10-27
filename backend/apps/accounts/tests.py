from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from apps.accounts.models import User, VendorProfile

class AccountTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_superuser(
            email='admin@test.com',
            username='admin_test',
            password='Password@123',
            role='ADMIN'
        )
        self.customer = User.objects.create_user(
            email='customer@test.com',
            username='customer_test',
            password='Password@123',
            role='CUSTOMER'
        )

    def test_customer_registration(self):
        response = self.client.post('/api/auth/register/', {
            'email': 'newcustomer@test.com',
            'password': 'StrongPassword@123',
            'first_name': 'Jane',
            'last_name': 'Doe',
            'role': 'CUSTOMER'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email='newcustomer@test.com').exists())

    def test_vendor_registration(self):
        response = self.client.post('/api/auth/register/', {
            'email': 'newvendor@test.com',
            'password': 'StrongPassword@123',
            'first_name': 'Mark',
            'last_name': 'Vendor',
            'role': 'VENDOR',
            'store_name': 'Mark Vintage Store',
            'store_description': 'Finest curated vintage goods'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        vendor = VendorProfile.objects.filter(store_name='Mark Vintage Store').first()
        self.assertIsNotNone(vendor)
        self.assertEqual(vendor.status, 'APPROVED')

    def test_jwt_login(self):
        response = self.client.post('/api/auth/token/', {
            'email': 'customer@test.com',
            'password': 'Password@123'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('user', response.data)
        self.assertEqual(response.data['user']['email'], 'customer@test.com')

    def test_admin_vendor_moderation(self):
        vendor_user = User.objects.create_user(
            email='modvendor@test.com',
            username='modvendor',
            password='Password@123',
            role='VENDOR'
        )
        profile = VendorProfile.objects.create(
            user=vendor_user,
            store_name='Pending Store',
            status='PENDING'
        )
        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(f'/api/admin/vendors/{profile.id}/status/', {
            'status': 'APPROVED',
            'commission_rate': 12.50
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        profile.refresh_from_db()
        self.assertEqual(profile.status, 'APPROVED')
        self.assertEqual(float(profile.commission_rate), 12.50)

    def test_customer_profile_update(self):
        self.client.force_authenticate(user=self.customer)
        response = self.client.patch('/api/auth/me/', {
            'first_name': 'UpdatedFirst',
            'last_name': 'UpdatedLast',
            'phone': '+1 555-9988',
            'address': '100 Silicon Blvd',
            'city': 'San Jose',
            'postal_code': '95112'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.customer.refresh_from_db()
        self.assertEqual(self.customer.first_name, 'UpdatedFirst')
        self.assertEqual(self.customer.phone, '+1 555-9988')
        self.assertEqual(self.customer.city, 'San Jose')

    def test_customer_change_password(self):
        self.client.force_authenticate(user=self.customer)
        # Test wrong current password
        bad_response = self.client.post('/api/auth/change-password/', {
            'current_password': 'WrongPassword@999',
            'new_password': 'NewStrongPassword@2026'
        })
        self.assertEqual(bad_response.status_code, status.HTTP_400_BAD_REQUEST)

        # Test valid password change
        ok_response = self.client.post('/api/auth/change-password/', {
            'current_password': 'Password@123',
            'new_password': 'NewStrongPassword@2026'
        })
        self.assertEqual(ok_response.status_code, status.HTTP_200_OK)
        self.customer.refresh_from_db()
        self.assertTrue(self.customer.check_password('NewStrongPassword@2026'))

    def test_customer_avatar_upload_and_delete(self):
        from django.core.files.uploadedfile import SimpleUploadedFile
        from PIL import Image
        import io

        self.client.force_authenticate(user=self.customer)
        img = Image.new('RGB', (80, 80), color='indigo')
        byte_arr = io.BytesIO()
        img.save(byte_arr, format='JPEG')
        byte_arr.seek(0)

        uploaded_file = SimpleUploadedFile(
            "avatar.jpg",
            byte_arr.read(),
            content_type="image/jpeg"
        )

        response = self.client.post('/api/auth/avatar/', {'avatar': uploaded_file}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('avatar_url', response.data)
        self.customer.refresh_from_db()
        self.assertTrue(self.customer.avatar_url.startswith('/media/avatars/'))

        del_response = self.client.delete('/api/auth/avatar/')
        self.assertEqual(del_response.status_code, status.HTTP_200_OK)
        self.customer.refresh_from_db()
        self.assertEqual(self.customer.avatar_url, '')


