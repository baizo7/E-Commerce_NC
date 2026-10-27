from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from apps.accounts.views import (
    CustomTokenObtainPairView,
    RegisterView,
    UserProfileView,
    ChangePasswordView,
    VendorPublicListView,
    VendorPublicDetailView,
    VendorSelfProfileView,
    AdminVendorListView,
    AdminVendorUpdateStatusView
)

urlpatterns = [
    # Auth
    path('auth/register/', RegisterView.as_view(), name='auth_register'),
    path('auth/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', UserProfileView.as_view(), name='user_profile'),
    path('auth/change-password/', ChangePasswordView.as_view(), name='change_password'),

    # Public Vendors
    path('vendors/', VendorPublicListView.as_view(), name='vendor_public_list'),
    path('vendors/<slug:slug>/', VendorPublicDetailView.as_view(), name='vendor_public_detail'),

    # Vendor Portal
    path('vendor/profile/', VendorSelfProfileView.as_view(), name='vendor_self_profile'),

    # Admin Portal
    path('admin/vendors/', AdminVendorListView.as_view(), name='admin_vendor_list'),
    path('admin/vendors/<int:id>/status/', AdminVendorUpdateStatusView.as_view(), name='admin_vendor_status_update'),
]
