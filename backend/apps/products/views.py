from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.conf import settings
from django.db.models import Q
import os
import uuid
from apps.products.models import Category, Product, ProductImage, Review
from apps.products.serializers import (
    CategorySerializer,
    ProductListSerializer,
    ProductDetailSerializer,
    ProductCreateUpdateSerializer,
    ReviewSerializer
)
from apps.accounts.permissions import IsVendorUser, IsAdminUserRole, IsVendorOwnerOrReadOnly

class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None


class CategoryDetailView(generics.RetrieveAPIView):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    lookup_field = 'slug'
    permission_classes = [permissions.AllowAny]


class AdminCategoryListCreateView(generics.ListCreateAPIView):
    queryset = Category.objects.all().order_by('name')
    serializer_class = CategorySerializer
    permission_classes = [IsAdminUserRole]
    pagination_class = None


class AdminCategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    lookup_field = 'id'
    permission_classes = [IsAdminUserRole]


class ProductListView(generics.ListAPIView):
    serializer_class = ProductListSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = Product.objects.filter(
            is_active=True,
            is_approved=True,
            vendor__status='APPROVED'
        ).select_related('vendor', 'category').prefetch_related('images')

        # Filters
        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(Q(category__slug=category) | Q(category__id__iexact=category))

        vendor = self.request.query_params.get('vendor')
        if vendor:
            qs = qs.filter(Q(vendor__slug=vendor) | Q(vendor__id__iexact=vendor))

        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search) |
                Q(vendor__store_name__icontains=search) |
                Q(category__name__icontains=search)
            )

        min_price = self.request.query_params.get('min_price')
        if min_price:
            try:
                qs = qs.filter(price__gte=float(min_price))
            except ValueError:
                pass

        max_price = self.request.query_params.get('max_price')
        if max_price:
            try:
                qs = qs.filter(price__lte=float(max_price))
            except ValueError:
                pass

        in_stock = self.request.query_params.get('in_stock')
        if in_stock in ['true', '1', 'True']:
            qs = qs.filter(inventory_count__gt=0)

        featured = self.request.query_params.get('featured')
        if featured in ['true', '1', 'True']:
            qs = qs.filter(is_featured=True)

        # Sorting
        sort = self.request.query_params.get('sort', 'newest')
        if sort == 'price_asc':
            qs = qs.order_by('price')
        elif sort == 'price_desc':
            qs = qs.order_by('-price')
        elif sort == 'rating':
            qs = qs.order_by('-rating', '-review_count')
        else: # newest
            qs = qs.order_by('-created_at')

        return qs


class ProductDetailView(generics.RetrieveAPIView):
    serializer_class = ProductDetailSerializer
    lookup_field = 'slug'
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Product.objects.filter(
            is_active=True,
            is_approved=True,
            vendor__status='APPROVED'
        ).select_related('vendor', 'category').prefetch_related('images', 'reviews__customer')


class ProductReviewCreateView(generics.CreateAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        slug = self.kwargs.get('slug')
        try:
            product = Product.objects.get(slug=slug)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

        if Review.objects.filter(product=product, customer=request.user).exists():
            return Response({'error': 'You have already reviewed this product'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(customer=request.user, product=product)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class VendorProductListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsVendorUser]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ProductCreateUpdateSerializer
        return ProductListSerializer

    def get_queryset(self):
        vendor = self.request.user.vendor_profile
        qs = Product.objects.filter(vendor=vendor).select_related('category').prefetch_related('images').order_by('-created_at')
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(title__icontains=search)
        return qs


class VendorProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsVendorUser, IsVendorOwnerOrReadOnly]
    lookup_field = 'id'

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return ProductCreateUpdateSerializer
        return ProductDetailSerializer

    def get_queryset(self):
        vendor = self.request.user.vendor_profile
        return Product.objects.filter(vendor=vendor).prefetch_related('images', 'category')


class AdminProductListView(generics.ListAPIView):
    serializer_class = ProductListSerializer
    permission_classes = [IsAdminUserRole]

    def get_queryset(self):
        qs = Product.objects.all().select_related('vendor', 'category').prefetch_related('images').order_by('-created_at')
        status_param = self.request.query_params.get('is_approved')
        if status_param is not None:
            is_approved = status_param.lower() in ['true', '1']
            qs = qs.filter(is_approved=is_approved)
        vendor_id = self.request.query_params.get('vendor_id')
        if vendor_id:
            qs = qs.filter(vendor_id=vendor_id)
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(Q(title__icontains=search) | Q(vendor__store_name__icontains=search))
        return qs


class AdminProductModerationView(APIView):
    permission_classes = [IsAdminUserRole]

    def patch(self, request, id):
        try:
            product = Product.objects.get(id=id)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

        is_approved = request.data.get('is_approved')
        is_featured = request.data.get('is_featured')
        is_active = request.data.get('is_active')

        if is_approved is not None:
            product.is_approved = is_approved
        if is_featured is not None:
            product.is_featured = is_featured
        if is_active is not None:
            product.is_active = is_active

        product.save()
        return Response(ProductDetailSerializer(product).data)


class ProductImageUploadView(APIView):
    """
    POST /api/v1/products/upload-image/
    Uploads a product image directly from vendor's local system,
    validates file format and size, stores in media/products/,
    and returns {"image_url": "/media/products/..."}
    """
    permission_classes = [IsVendorUser]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        file_obj = request.FILES.get('image')
        if not file_obj:
            return Response({'error': 'No image file provided.'}, status=status.HTTP_400_BAD_REQUEST)

        content_type = getattr(file_obj, 'content_type', '').lower()
        allowed_types = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg']
        if content_type not in allowed_types:
            return Response(
                {'error': 'Invalid image format. Please upload JPEG, PNG, WEBP, or GIF.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        max_size = 5 * 1024 * 1024
        if file_obj.size > max_size:
            return Response(
                {'error': 'Image file is too large. Maximum allowed size is 5MB.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        vendor = request.user.vendor_profile
        ext = os.path.splitext(file_obj.name)[1].lower() or '.jpg'
        filename = f"products/prod_{vendor.id}_{uuid.uuid4().hex[:8]}{ext}"

        saved_path = default_storage.save(filename, ContentFile(file_obj.read()))
        media_url = getattr(settings, 'MEDIA_URL', '/media/')
        relative_url = f"{media_url.rstrip('/')}/{saved_path.lstrip('/')}"

        return Response({
            'message': 'Product image uploaded successfully.',
            'image_url': relative_url
        }, status=status.HTTP_200_OK)
