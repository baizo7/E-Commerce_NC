from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework_simplejwt.views import TokenObtainPairView
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.conf import settings
import os
import uuid
from apps.accounts.models import User, VendorProfile
from apps.accounts.serializers import (
    UserSerializer,
    RegisterSerializer,
    CustomTokenObtainPairSerializer,
    VendorProfileSerializer,
    VendorPublicSerializer,
    AdminVendorStatusSerializer,
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
        except Exception as e:
            print(f"[RegisterView] Could not dispatch welcome email: {e}")

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

        if old_status != vendor.status:
            try:
                from apps.orders.services import EmailService
                EmailService.send_vendor_status_updated(vendor, old_status, vendor.status)
            except Exception as e:
                print(f"[AdminVendorUpdateStatusView Warning] Email dispatch failed: {e}")

        return Response(VendorProfileSerializer(vendor).data)
