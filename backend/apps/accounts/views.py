from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from apps.accounts.models import User, VendorProfile
from apps.accounts.serializers import (
    UserSerializer,
    RegisterSerializer,
    CustomTokenObtainPairSerializer,
    VendorProfileSerializer,
    VendorPublicSerializer,
    AdminVendorStatusSerializer
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
        serializer = self.get_serializer(vendor, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(VendorProfileSerializer(vendor).data)
