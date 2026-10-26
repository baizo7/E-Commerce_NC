from django.contrib import admin
from apps.products.models import Category, Product, ProductImage, Review

class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'is_active', 'created_at')
    search_fields = ('name', 'description')
    prepopulated_fields = {'slug': ('name',)}

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('title', 'vendor', 'category', 'price', 'inventory_count', 'is_in_stock', 'is_approved', 'is_active', 'is_featured')
    list_filter = ('is_approved', 'is_active', 'is_featured', 'category', 'vendor')
    search_fields = ('title', 'sku', 'vendor__store_name')
    prepopulated_fields = {'slug': ('title',)}
    inlines = [ProductImageInline]

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('product', 'customer', 'rating', 'created_at')
    list_filter = ('rating', 'created_at')
    search_fields = ('product__title', 'customer__email', 'comment')
