from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum, Count, Avg, F
from django.utils import timezone
from datetime import timedelta

from apps.accounts.permissions import IsVendorUser, IsAdminUserRole
from apps.accounts.models import User, VendorProfile
from apps.products.models import Product, Category
from apps.orders.models import Order, VendorOrder, OrderItem

class VendorDashboardStatsView(APIView):
    permission_classes = [IsVendorUser]

    def get(self, request):
        vendor = request.user.vendor_profile
        vendor_orders = VendorOrder.objects.filter(vendor=vendor)

        gross_sales = vendor_orders.aggregate(total=Sum('subtotal'))['total'] or 0.0
        net_earnings = vendor_orders.aggregate(total=Sum('net_vendor_amount'))['total'] or 0.0
        platform_commission_paid = vendor_orders.aggregate(total=Sum('commission_amount'))['total'] or 0.0
        total_orders_count = vendor_orders.count()
        pending_fulfillment_count = vendor_orders.filter(status__in=['PENDING', 'PROCESSING']).count()
        completed_orders_count = vendor_orders.filter(status='DELIVERED').count()

        products = Product.objects.filter(vendor=vendor)
        total_products = products.count()
        low_stock_products = products.filter(inventory_count__lte=F('low_stock_threshold'), inventory_count__gt=0).count()
        out_of_stock_products = products.filter(inventory_count=0).count()

        # Recent 5 sub-orders
        recent_orders_qs = vendor_orders.select_related('order').order_by('-created_at')[:5]
        recent_orders = [
            {
                'id': vo.id,
                'order_number': vo.order.order_number,
                'customer_email': vo.order.customer.email,
                'subtotal': float(vo.subtotal),
                'net_amount': float(vo.net_vendor_amount),
                'status': vo.status,
                'created_at': vo.created_at,
            }
            for vo in recent_orders_qs
        ]

        return Response({
            'gross_sales': float(gross_sales),
            'net_earnings': float(net_earnings),
            'commission_paid': float(platform_commission_paid),
            'total_orders': total_orders_count,
            'pending_fulfillment': pending_fulfillment_count,
            'completed_orders': completed_orders_count,
            'total_products': total_products,
            'low_stock_count': low_stock_products,
            'out_of_stock_count': out_of_stock_products,
            'store_name': vendor.store_name,
            'rating': float(vendor.rating),
            'recent_orders': recent_orders,
        })


class AdminDashboardStatsView(APIView):
    permission_classes = [IsAdminUserRole]

    def get(self, request):
        orders = Order.objects.all()
        vendor_orders = VendorOrder.objects.all()

        total_gmv = orders.aggregate(total=Sum('grand_total'))['total'] or 0.0
        total_platform_commission = vendor_orders.aggregate(total=Sum('commission_amount'))['total'] or 0.0
        total_orders_count = orders.count()

        total_vendors = VendorProfile.objects.count()
        pending_vendors = VendorProfile.objects.filter(status='PENDING').count()
        approved_vendors = VendorProfile.objects.filter(status='APPROVED').count()

        total_customers = User.objects.filter(role='CUSTOMER').count()

        products = Product.objects.all()
        total_products = products.count()
        pending_products = products.filter(is_approved=False).count()

        # Top vendors
        top_vendors_qs = VendorProfile.objects.filter(status='APPROVED').order_by('-total_sales')[:5]
        top_vendors = [
            {
                'id': v.id,
                'store_name': v.store_name,
                'total_sales': float(v.total_sales),
                'rating': float(v.rating),
                'status': v.status
            }
            for v in top_vendors_qs
        ]

        # Recent orders
        recent_orders_qs = orders.order_by('-created_at')[:6]
        recent_orders = [
            {
                'id': o.id,
                'order_number': o.order_number,
                'customer_email': o.customer.email,
                'grand_total': float(o.grand_total),
                'status': o.status,
                'payment_status': o.payment_status,
                'created_at': o.created_at,
            }
            for o in recent_orders_qs
        ]

        return Response({
            'total_gmv': float(total_gmv),
            'total_commission': float(total_platform_commission),
            'total_orders': total_orders_count,
            'total_vendors': total_vendors,
            'pending_vendors': pending_vendors,
            'approved_vendors': approved_vendors,
            'total_customers': total_customers,
            'total_products': total_products,
            'pending_products': pending_products,
            'top_vendors': top_vendors,
            'recent_orders': recent_orders,
        })
