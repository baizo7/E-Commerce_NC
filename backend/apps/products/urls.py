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
    AdminProductModerationView,
    AdminProductBulkModerationView,
    CategoryImageUploadView,
    ProductVariantListCreateView,
    ProductVariantDetailView,
    WishlistListView,
    WishlistToggleView,
    PublicActiveBannerListView,
    AdminBannerListCreateView,
    AdminBannerDetailView,
    VendorProductCsvExportView,
    VendorProductCsvImportView
)

urlpatterns = [
    # Categories
    path('categories/', CategoryListView.as_view(), name='category_list'),
    path('categories/upload-image/', CategoryImageUploadView.as_view(), name='category_image_upload_public'),
    path('categories/<slug:slug>/', CategoryDetailView.as_view(), name='category_detail'),

    # Products (Public)
    path('products/', ProductListView.as_view(), name='product_list'),
    # Specific / nested product routes MUST precede <slug:slug>
    path('products/upload-image/', ProductImageUploadView.as_view(), name='product_image_upload'),
    path('products/wishlist/', WishlistListView.as_view(), name='products_wishlist_list'),
    path('products/wishlist/toggle/', WishlistToggleView.as_view(), name='products_wishlist_toggle'),
    path('products/banners/active/', PublicActiveBannerListView.as_view(), name='products_banners_active'),
    path('products/admin/banners/', AdminBannerListCreateView.as_view(), name='products_admin_banners'),
    path('products/admin/banners/<int:id>/', AdminBannerDetailView.as_view(), name='products_admin_banner_detail'),
    path('products/vendor/products/export-csv/', VendorProductCsvExportView.as_view(), name='products_vendor_products_export_csv'),
    path('products/vendor/products/import-csv/', VendorProductCsvImportView.as_view(), name='products_vendor_products_import_csv'),

    path('products/<slug:slug>/', ProductDetailView.as_view(), name='product_detail'),
    path('products/<slug:slug>/reviews/', ProductReviewCreateView.as_view(), name='product_review_create'),

    # Vendor Products
    path('vendor/products/', VendorProductListCreateView.as_view(), name='vendor_product_list_create'),
    path('vendor/products/upload-image/', ProductImageUploadView.as_view(), name='vendor_product_image_upload'),
    path('vendor/products/export-csv/', VendorProductCsvExportView.as_view(), name='vendor_products_export_csv'),
    path('vendor/products/import-csv/', VendorProductCsvImportView.as_view(), name='vendor_products_import_csv'),
    path('vendor/products/<int:id>/', VendorProductDetailView.as_view(), name='vendor_product_detail'),
    path('vendor/products/<int:product_id>/variants/', ProductVariantListCreateView.as_view(), name='product_variants'),
    path('vendor/variants/<int:pk>/', ProductVariantDetailView.as_view(), name='product_variant_detail'),

    # Wishlist
    path('wishlist/', WishlistListView.as_view(), name='wishlist_list'),
    path('wishlist/toggle/', WishlistToggleView.as_view(), name='wishlist_toggle'),

    # Banners
    path('banners/active/', PublicActiveBannerListView.as_view(), name='banners_active'),
    path('admin/banners/', AdminBannerListCreateView.as_view(), name='admin_banners'),
    path('admin/banners/<int:id>/', AdminBannerDetailView.as_view(), name='admin_banner_detail'),

    # Admin Products & Categories
    path('admin/categories/', AdminCategoryListCreateView.as_view(), name='admin_category_list_create'),
    path('admin/categories/upload-image/', CategoryImageUploadView.as_view(), name='admin_category_image_upload'),
    path('admin/categories/<int:id>/', AdminCategoryDetailView.as_view(), name='admin_category_detail'),
    path('admin/products/', AdminProductListView.as_view(), name='admin_product_list'),
    path('admin/products/bulk-moderate/', AdminProductBulkModerationView.as_view(), name='admin_product_bulk_moderate'),
    path('admin/products/<int:id>/moderate/', AdminProductModerationView.as_view(), name='admin_product_moderate'),
]
