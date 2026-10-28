from decimal import Decimal
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from datetime import timedelta

from apps.accounts.models import User, VendorProfile
from apps.products.models import Category, Product, Review, PriceHistory
from apps.shopping_assistant.models import ChatSession, ChatMessage
from apps.shopping_assistant.services.discount_service import DiscountFinderService
from apps.shopping_assistant.services.price_history_service import PriceHistoryService
from apps.shopping_assistant.services.review_confidence_service import ReviewConfidenceService
from apps.shopping_assistant.services.recommendation_service import AffordableRankerService


class ShoppingAssistantEngineTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.vendor_user = User.objects.create_user(
            email='techvendor@test.com',
            username='techvendor',
            password='Password@123',
            role='VENDOR'
        )
        self.vendor = VendorProfile.objects.create(
            user=self.vendor_user,
            store_name='ElectroTech Hub',
            status='APPROVED'
        )
        self.category = Category.objects.create(name='Electronics & Audio', slug='electronics-audio')

        # Product 1: Great discount (₹1,000 down from ₹1,500 = 33% off)
        self.p_discounted = Product.objects.create(
            vendor=self.vendor,
            category=self.category,
            title='Wireless Noise Cancelling Earbuds',
            price=Decimal('1000.00'),
            compare_at_price=Decimal('1500.00'),
            inventory_count=20,
            is_active=True,
            is_approved=True
        )

        # Product 2: Highly rated (many reviews)
        self.p_top_rated = Product.objects.create(
            vendor=self.vendor,
            category=self.category,
            title='Pro Studio Monitor Headphones',
            price=Decimal('4500.00'),
            compare_at_price=None,
            inventory_count=10,
            is_active=True,
            is_approved=True
        )

        # Product 3: Single review (small sample bias test)
        self.p_one_review = Product.objects.create(
            vendor=self.vendor,
            category=self.category,
            title='Generic Audio Cable',
            price=Decimal('150.00'),
            compare_at_price=None,
            inventory_count=50,
            is_active=True,
            is_approved=True
        )

        # Create simulated reviews
        customer1 = User.objects.create_user(email='c1@test.com', username='c1', password='Password@123')
        customer2 = User.objects.create_user(email='c2@test.com', username='c2', password='Password@123')

        Review.objects.create(product=self.p_one_review, customer=customer1, rating=5, comment='Good')

        # Multiple reviews for top rated product
        for i in range(10):
            u = User.objects.create_user(email=f'aud_{i}@test.com', username=f'aud_{i}', password='Password@123')
            Review.objects.create(product=self.p_top_rated, customer=u, rating=5 if i < 8 else 4, comment='Superb sound!')

    def test_discount_finder_service(self):
        discounts = DiscountFinderService.find_discounts(min_discount_percent=20)
        self.assertTrue(len(discounts) >= 1)
        found = next((p for p in discounts if p['id'] == self.p_discounted.id), None)
        self.assertIsNotNone(found)
        self.assertEqual(found['discount_percent'], 33)
        self.assertEqual(found['savings_amount'], 500.00)

    def test_price_history_analysis_and_disclosure(self):
        # Product listed recently should disclose insufficient 30-day history
        analysis = PriceHistoryService.analyze_product_price(self.p_discounted.slug)
        self.assertIn('has_sufficient_history', analysis)
        self.assertEqual(analysis['current_price'], 1000.00)

        # Simulate older price record
        PriceHistory.objects.create(
            product=self.p_discounted,
            price=Decimal('1200.00'),
            change_reason='INITIAL',
            effective_from=timezone.now() - timedelta(days=40)
        )
        updated_analysis = PriceHistoryService.analyze_product_price(self.p_discounted.slug)
        self.assertTrue(updated_analysis['has_sufficient_history'])
        self.assertEqual(updated_analysis['trend'], 'CHEAPER')

    def test_bayesian_review_confidence_ranking(self):
        # Generic cable has 1 review of 5.0 (raw rating = 5.0)
        # Studio headphones have 10 reviews averaging 4.8
        # Bayesian scoring should rank studio headphones higher than the 1-review cable!
        top_items = ReviewConfidenceService.find_top_rated(min_rating=4.0)
        self.assertTrue(len(top_items) >= 2)

        # Studio headphones should have higher bayesian score than the 1-review cable
        headphones = next(p for p in top_items if p['id'] == self.p_top_rated.id)
        cable = next(p for p in top_items if p['id'] == self.p_one_review.id)
        self.assertGreater(headphones['bayesian_score'], cable['bayesian_score'])

    def test_affordable_recommendation_hard_and_soft_constraints(self):
        # Budget max 2,000 should exclude 4,500 headphones
        results = AffordableRankerService.recommend(budget_max=2000.0, prioritize='balanced')
        self.assertTrue(len(results) >= 1)
        for r in results:
            self.assertLessEqual(r['current_price'], 2000.0)

    def test_chat_api_endpoint_flow(self):
        res = self.client.post('/api/v1/assistant/chat/', {
            'message': 'Find me the best discounts on electronics'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.data
        self.assertIn('session_token', data)
        self.assertIn('message', data)
        self.assertEqual(data['intent'], 'DISCOUNT_FINDER')
        self.assertTrue(len(data['suggested_products']) >= 1)

        # Test history retention
        token = data['session_token']
        hist_res = self.client.get(f'/api/v1/assistant/chat/history/?session_token={token}')
        self.assertEqual(hist_res.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(hist_res.data['messages']), 2) # User + Assistant

        # Clear history
        del_res = self.client.delete(f'/api/v1/assistant/chat/history/?session_token={token}')
        self.assertEqual(del_res.status_code, status.HTTP_200_OK)
        check_res = self.client.get(f'/api/v1/assistant/chat/history/?session_token={token}')
        self.assertEqual(len(check_res.data['messages']), 0)
