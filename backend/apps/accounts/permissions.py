from rest_framework import permissions

class IsAdminUserRole(permissions.BasePermission):
    """
    Allows access only to Admin users or superusers.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.role == 'ADMIN' or request.user.is_superuser or request.user.is_staff)
        )


class IsVendorUser(permissions.BasePermission):
    """
    Allows access to users with role VENDOR (or ADMIN) who have an associated vendor profile.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.role in ['VENDOR', 'ADMIN']) and
            hasattr(request.user, 'vendor_profile')
        )


class IsVendorOwnerOrReadOnly(permissions.BasePermission):
    """
    Object-level permission to allow vendors to only edit their own products/orders.
    """
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.role == 'ADMIN' or request.user.is_superuser:
            return True
        if hasattr(obj, 'vendor'):
            return obj.vendor.user == request.user
        if hasattr(obj, 'user'):
            return obj.user == request.user
        return False
