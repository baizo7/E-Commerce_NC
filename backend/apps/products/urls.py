from django.urls import path
from apps.products.views import (
    CategoryListView,
    CategoryDetailView,
    AdminCategoryListCreateView,
    AdminCategoryDetailView,
    ProductListView,
    ProductDetailView,
    ProductReviewCreateView,
    VendorProductListCreateView,
    VendorProductDetailView,
    ProductImageUploadView,
    AdminProductListView,
    AdminProductModerationView
)

urlpatterns = [
    # Categories
    path('categories/', CategoryListView.as_view(), name='category_list'),
    path('categories/<slug:slug>/', CategoryDetailView.as_view(), name='category_detail'),

    # Products (Public)
    path('products/', ProductListView.as_view(), name='product_list'),
    path('products/<slug:slug>/', ProductDetailView.as_view(), name='product_detail'),
    path('products/<slug:slug>/reviews/', ProductReviewCreateView.as_view(), name='product_review_create'),

    # Vendor Products
    path('vendor/products/', VendorProductListCreateView.as_view(), name='vendor_product_list_create'),
    path('vendor/products/<int:id>/', VendorProductDetailView.as_view(), name='vendor_product_detail'),
    path('products/upload-image/', ProductImageUploadView.as_view(), name='product_image_upload'),

    # Admin Products & Categories
    path('admin/categories/', AdminCategoryListCreateView.as_view(), name='admin_category_list_create'),
    path('admin/categories/<int:id>/', AdminCategoryDetailView.as_view(), name='admin_category_detail'),
    path('admin/products/', AdminProductListView.as_view(), name='admin_product_list'),
    path('admin/products/<int:id>/moderate/', AdminProductModerationView.as_view(), name='admin_product_moderate'),
]
