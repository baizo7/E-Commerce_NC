from django.urls import path
from apps.analytics.views import VendorDashboardStatsView, AdminDashboardStatsView, VendorExportCsvView, AdminExportCsvView

urlpatterns = [
    path('vendor/analytics/', VendorDashboardStatsView.as_view(), name='vendor_analytics'),
    path('vendor/export-csv/', VendorExportCsvView.as_view(), name='vendor_export_csv'),
    path('admin/analytics/', AdminDashboardStatsView.as_view(), name='admin_analytics'),
    path('admin/export-csv/', AdminExportCsvView.as_view(), name='admin_export_csv'),
]
