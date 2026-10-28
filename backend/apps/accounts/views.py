from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework_simplejwt.views import TokenObtainPairView
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.conf import settings
import logging
import os
import uuid

logger = logging.getLogger(__name__)
from apps.accounts.models import User, VendorProfile
from apps.accounts.serializers import (
    UserSerializer,
    RegisterSerializer,
    CustomTokenObtainPairSerializer,
    VendorProfileSerializer,
    VendorPublicSerializer,
    AdminVendorStatusSerializer,
    AdminUserDetailSerializer,
    ChangePasswordSerializer
)
from apps.accounts.permissions import IsAdminUserRole, IsVendorUser

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        try:
            from apps.orders.services import EmailService
            EmailService.send_welcome_email(user)
        except Exception as exc:
            logger.warning("Could not dispatch welcome email to %s: %s", user.email, exc)

        return Response(
            {
                "message": "User registered successfully",
                "user": UserSerializer(user).data
            },
            status=status.HTTP_201_CREATED
        )


class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    """
    POST /api/v1/auth/change-password/
    Allows authenticated users (customers, vendors, admins) to securely change their password.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        current_password = serializer.validated_data['current_password']
        new_password = serializer.validated_data['new_password']

        if not user.check_password(current_password):
            return Response(
                {'error': 'Current password does not match.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(new_password)
        user.save()
        return Response(
            {'message': 'Password has been updated successfully.'},
            status=status.HTTP_200_OK
        )


class AvatarUploadView(APIView):
    """
    POST /api/v1/auth/avatar/
    Uploads a user avatar image directly from the user's local system,
    validates file type and size, stores it in MEDIA_ROOT/avatars/,
    and updates the user's avatar_url.

    DELETE /api/v1/auth/avatar/
    Removes user's avatar image.
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        file_obj = request.FILES.get('avatar')
        if not file_obj:
            return Response({'error': 'No image file provided.'}, status=status.HTTP_400_BAD_REQUEST)

        # Validate content type
        content_type = getattr(file_obj, 'content_type', '').lower()
        allowed_types = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg']
        if content_type not in allowed_types:
            return Response(
                {'error': 'Invalid image format. Please upload JPEG, PNG, WEBP, or GIF.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate max size (5 MB)
        max_size = 5 * 1024 * 1024
        if file_obj.size > max_size:
            return Response(
                {'error': 'Image file is too large. Maximum allowed size is 5MB.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Determine extension and unique filename
        ext = os.path.splitext(file_obj.name)[1].lower()
        if not ext:
            ext = '.jpg'
        filename = f"avatars/user_{request.user.id}_{uuid.uuid4().hex[:8]}{ext}"

        # Save to media storage
        saved_path = default_storage.save(filename, ContentFile(file_obj.read()))
        media_url = getattr(settings, 'MEDIA_URL', '/media/')
        avatar_relative_url = f"{media_url.rstrip('/')}/{saved_path.lstrip('/')}"

        # Update user record
        user = request.user
        user.avatar_url = avatar_relative_url
        user.save(update_fields=['avatar_url'])

        return Response({
            'message': 'Avatar uploaded successfully.',
            'avatar_url': user.avatar_url,
            'user': UserSerializer(user).data
        }, status=status.HTTP_200_OK)

    def delete(self, request):
        user = request.user
        user.avatar_url = ''
        user.save(update_fields=['avatar_url'])
        return Response({
            'message': 'Avatar removed successfully.',
            'avatar_url': '',
            'user': UserSerializer(user).data
        }, status=status.HTTP_200_OK)



class VendorPublicListView(generics.ListAPIView):
    serializer_class = VendorPublicSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = VendorProfile.objects.filter(status='APPROVED')
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(store_name__icontains=search)
        return qs


class VendorPublicDetailView(generics.RetrieveAPIView):
    queryset = VendorProfile.objects.filter(status='APPROVED')
    serializer_class = VendorPublicSerializer
    lookup_field = 'slug'
    permission_classes = [permissions.AllowAny]


class VendorSelfProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = VendorProfileSerializer
    permission_classes = [IsVendorUser]

    def get_object(self):
        return self.request.user.vendor_profile


class VendorActivateView(APIView):
    """
    POST /api/v1/auth/vendor/activate/
    Allows an authenticated user to instantly activate their merchant store profile.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        store_name = request.data.get('store_name') or f"{user.first_name or user.username}'s Modern Atelier"
        store_description = request.data.get('description') or "Independent creator storefront curated with care."

        vendor, created = VendorProfile.objects.get_or_create(
            user=user,
            defaults={
                'store_name': store_name,
                'description': store_description,
                'business_email': user.email,
                'business_phone': user.phone or '+1 (555) 000-1122',
                'status': 'APPROVED',
                'commission_rate': 10.00,
            }
        )
        if user.role != 'ADMIN':
            user.role = 'VENDOR'
            user.save(update_fields=['role'])

        return Response({
            'message': 'Vendor storefront activated successfully!',
            'vendor': VendorProfileSerializer(vendor).data,
            'user': UserSerializer(user).data
        }, status=status.HTTP_200_OK)


class VendorBrandingUploadView(APIView):
    """
    POST /api/v1/auth/vendor/branding/
    Uploads a store logo or banner image directly from local files,
    validates format and size, stores in media/stores/,
    and updates VendorProfile.logo_url or banner_url.
    """
    permission_classes = [IsVendorUser]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        file_obj = request.FILES.get('file')
        asset_type = request.data.get('type', 'logo').lower() # 'logo' or 'banner'

        if not file_obj:
            return Response({'error': 'No image file provided.'}, status=status.HTTP_400_BAD_REQUEST)

        if asset_type not in ['logo', 'banner']:
            return Response({'error': 'type must be either "logo" or "banner".'}, status=status.HTTP_400_BAD_REQUEST)

        # Validate content type
        content_type = getattr(file_obj, 'content_type', '').lower()
        allowed_types = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg']
        if content_type not in allowed_types:
            return Response(
                {'error': 'Invalid image format. Please upload JPEG, PNG, WEBP, or GIF.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate max size (5 MB)
        max_size = 5 * 1024 * 1024
        if file_obj.size > max_size:
            return Response(
                {'error': 'Image file is too large. Maximum allowed size is 5MB.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        vendor = request.user.vendor_profile
        ext = os.path.splitext(file_obj.name)[1].lower() or '.jpg'
        filename = f"stores/store_{vendor.id}_{asset_type}_{uuid.uuid4().hex[:8]}{ext}"

        saved_path = default_storage.save(filename, ContentFile(file_obj.read()))
        media_url = getattr(settings, 'MEDIA_URL', '/media/')
        relative_url = f"{media_url.rstrip('/')}/{saved_path.lstrip('/')}"

        if asset_type == 'logo':
            vendor.logo_url = relative_url
            vendor.save(update_fields=['logo_url', 'updated_at'])
        else:
            vendor.banner_url = relative_url
            vendor.save(update_fields=['banner_url', 'updated_at'])

        return Response({
            'message': f'Store {asset_type} uploaded successfully.',
            'url': relative_url,
            'vendor': VendorProfileSerializer(vendor).data
        }, status=status.HTTP_200_OK)


class AdminVendorListView(generics.ListAPIView):
    serializer_class = VendorProfileSerializer
    permission_classes = [IsAdminUserRole]

    def get_queryset(self):
        qs = VendorProfile.objects.all().select_related('user').order_by('-created_at')
        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param.upper())
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(store_name__icontains=search)
        return qs


class AdminVendorUpdateStatusView(generics.UpdateAPIView):
    queryset = VendorProfile.objects.all()
    serializer_class = AdminVendorStatusSerializer
    permission_classes = [IsAdminUserRole]
    lookup_field = 'id'

    def update(self, request, *args, **kwargs):
        vendor = self.get_object()
        old_status = vendor.status
        serializer = self.get_serializer(vendor, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        reason = request.data.get('reason', '')
        if old_status != vendor.status:
            try:
                from apps.orders.services import EmailService
                EmailService.send_vendor_status_updated(vendor, old_status, vendor.status, reason=reason)
            except Exception as exc:
                logger.warning("Vendor status update notification failed for %s: %s", vendor.store_name, exc)

        return Response(VendorProfileSerializer(vendor).data)


class AdminUserListView(generics.ListAPIView):
    serializer_class = AdminUserDetailSerializer
    permission_classes = [IsAdminUserRole]

    def get_queryset(self):
        from django.db.models import Q
        qs = User.objects.all().prefetch_related('orders').select_related('vendor_profile').order_by('-date_joined')
        role_param = self.request.query_params.get('role')
        if role_param:
            qs = qs.filter(role=role_param.upper())
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(email__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(phone__icontains=search)
            )
        return qs


class AdminUserRoleUpdateView(APIView):
    permission_classes = [IsAdminUserRole]

    def patch(self, request, id):
        user = User.objects.filter(id=id).first()
        if not user:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        new_role = request.data.get('role', '').upper()
        if new_role not in ['CUSTOMER', 'VENDOR', 'ADMIN']:
            return Response({'error': 'Invalid role choice.'}, status=status.HTTP_400_BAD_REQUEST)

        user.role = new_role
        if new_role == 'ADMIN':
            user.is_staff = True
        elif new_role == 'VENDOR' and not hasattr(user, 'vendor_profile'):
            VendorProfile.objects.create(
                user=user,
                store_name=f"{user.first_name or user.username}'s Store",
                business_email=user.email,
                business_phone=user.phone or '+1 (555) 000-1122',
                status='APPROVED',
                commission_rate=10.00
            )
        user.save()

        return Response({
            'message': f"User role updated to {new_role} successfully.",
            'user': AdminUserDetailSerializer(user).data
        }, status=status.HTTP_200_OK)
