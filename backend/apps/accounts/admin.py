from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from apps.accounts.models import User, VendorProfile

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('email', 'username', 'role', 'first_name', 'last_name', 'is_staff')
    list_filter = ('role', 'is_staff', 'is_superuser', 'is_active')
    search_fields = ('email', 'username', 'first_name', 'last_name')
    ordering = ('email',)
    fieldsets = UserAdmin.fieldsets + (
        ('Custom Profile', {'fields': ('role', 'phone', 'avatar_url', 'address', 'city', 'country', 'postal_code')}),
    )

@admin.register(VendorProfile)
class VendorProfileAdmin(admin.ModelAdmin):
    list_display = ('store_name', 'user', 'status', 'commission_rate', 'total_sales', 'rating', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('store_name', 'user__email', 'business_email')
    prepopulated_fields = {'slug': ('store_name',)}
