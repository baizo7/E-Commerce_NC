from django.urls import path
from apps.analytics.views import VendorDashboardStatsView, AdminDashboardStatsView

urlpatterns = [
    path('vendor/analytics/', VendorDashboardStatsView.as_view(), name='vendor_analytics'),
    path('admin/analytics/', AdminDashboardStatsView.as_view(), name='admin_analytics'),
]
