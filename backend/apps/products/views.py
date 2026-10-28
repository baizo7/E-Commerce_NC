from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.conf import settings
from django.db.models import Q
from django.http import HttpResponse
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
import os
import uuid
import csv
import io
from apps.products.models import Category, Product, ProductImage, Review, ProductVariant, WishlistItem, PlatformBanner
from apps.products.serializers import (
    CategorySerializer,
    ProductListSerializer,
    ProductDetailSerializer,
    ProductCreateUpdateSerializer,
    ReviewSerializer,
    ProductVariantSerializer,
    WishlistItemSerializer,
    PlatformBannerSerializer
)
from apps.accounts.services import AuditService
from apps.accounts.permissions import IsVendorUser, IsAdminUserRole, IsVendorOwnerOrReadOnly

class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None

    @method_decorator(cache_page(60 * 5))
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)


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
        ).select_related('vendor', 'category').prefetch_related('images', 'reviews__customer', 'price_history')


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
        if status_param is not None and status_param != '':
            is_approved = status_param.lower() in ['true', '1']
            qs = qs.filter(is_approved=is_approved)
        vendor_id = self.request.query_params.get('vendor_id') or self.request.query_params.get('vendor')
        if vendor_id:
            qs = qs.filter(Q(vendor__id__iexact=vendor_id) | Q(vendor__slug=vendor_id))
        category_id = self.request.query_params.get('category_id') or self.request.query_params.get('category')
        if category_id:
            qs = qs.filter(Q(category__id__iexact=category_id) | Q(category__slug=category_id))
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(title__icontains=search) |
                Q(vendor__store_name__icontains=search) |
                Q(category__name__icontains=search)
            )
        return qs


class AdminProductBulkModerationView(APIView):
    permission_classes = [IsAdminUserRole]

    def post(self, request):
        ids = request.data.get('product_ids', [])
        action = request.data.get('action')
        if not ids or not isinstance(ids, list):
            return Response({'error': 'product_ids list required'}, status=status.HTTP_400_BAD_REQUEST)

        qs = Product.objects.filter(id__in=ids)
        if action == 'approve':
            count = qs.update(is_approved=True)
        elif action == 'delist':
            count = qs.update(is_approved=False)
        elif action == 'feature':
            count = qs.update(is_featured=True)
        elif action == 'unfeature':
            count = qs.update(is_featured=False)
        else:
            return Response({'error': 'Invalid action. Supported: approve, delist, feature, unfeature.'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'message': f'Successfully updated {count} product(s).', 'updated_count': count})


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
        try:
            file_url = default_storage.url(saved_path)
        except Exception:
            media_url = getattr(settings, 'MEDIA_URL', '/media/')
            file_url = f"{media_url.rstrip('/')}/{saved_path.lstrip('/')}"

        return Response({
            'message': 'Product image uploaded successfully.',
            'image_url': file_url
        }, status=status.HTTP_200_OK)


class CategoryImageUploadView(APIView):
    """
    POST /api/v1/categories/upload-image/
    Uploads a category cover image directly from administrator's local system,
    validates file format and size, stores in media/categories/,
    and returns {"image_url": "/media/categories/..."}
    """
    permission_classes = [IsAdminUserRole]
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

        ext = os.path.splitext(file_obj.name)[1].lower() or '.jpg'
        filename = f"categories/cat_{uuid.uuid4().hex[:8]}{ext}"

        saved_path = default_storage.save(filename, ContentFile(file_obj.read()))
        try:
            file_url = default_storage.url(saved_path)
        except Exception:
            media_url = getattr(settings, 'MEDIA_URL', '/media/')
            file_url = f"{media_url.rstrip('/')}/{saved_path.lstrip('/')}"

        return Response({
            'message': 'Category image uploaded successfully.',
            'image_url': file_url
        }, status=status.HTTP_200_OK)


# Product Variants
class ProductVariantListCreateView(generics.ListCreateAPIView):
    serializer_class = ProductVariantSerializer
    permission_classes = [IsVendorUser]

    def get_queryset(self):
        product_id = self.kwargs.get('product_id')
        vendor = self.request.user.vendor_profile
        return ProductVariant.objects.filter(product_id=product_id, product__vendor=vendor)

    def perform_create(self, serializer):
        product_id = self.kwargs.get('product_id')
        vendor = self.request.user.vendor_profile
        product = generics.get_object_or_404(Product, id=product_id, vendor=vendor)
        serializer.save(product=product)


class ProductVariantDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProductVariantSerializer
    permission_classes = [IsVendorUser]

    def get_queryset(self):
        vendor = self.request.user.vendor_profile
        return ProductVariant.objects.filter(product__vendor=vendor)


# Wishlist
class WishlistListView(generics.ListAPIView):
    serializer_class = WishlistItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        return WishlistItem.objects.filter(customer=self.request.user).select_related('product', 'product__vendor', 'product__category')


class WishlistToggleView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        product_id = request.data.get('product_id')
        if not product_id:
            return Response({'error': 'product_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        product = generics.get_object_or_404(Product, id=product_id, is_active=True, is_approved=True)
        existing = WishlistItem.objects.filter(customer=request.user, product=product).first()
        if existing:
            existing.delete()
            return Response({
                'wishlisted': False,
                'message': f"Removed '{product.title}' from your wishlist.",
                'product_id': product.id
            }, status=status.HTTP_200_OK)
        else:
            WishlistItem.objects.create(customer=request.user, product=product)
            return Response({
                'wishlisted': True,
                'message': f"Added '{product.title}' to your wishlist.",
                'product_id': product.id
            }, status=status.HTTP_201_CREATED)


# Platform Banners
class PublicActiveBannerListView(generics.ListAPIView):
    serializer_class = PlatformBannerSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None

    @method_decorator(cache_page(60 * 5))
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    def get_queryset(self):
        return PlatformBanner.objects.filter(is_active=True).order_by('-created_at')


class AdminBannerListCreateView(generics.ListCreateAPIView):
    serializer_class = PlatformBannerSerializer
    permission_classes = [IsAdminUserRole]
    queryset = PlatformBanner.objects.all().order_by('-created_at')


class AdminBannerDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PlatformBannerSerializer
    permission_classes = [IsAdminUserRole]
    queryset = PlatformBanner.objects.all()
    lookup_field = 'id'


# Vendor CSV Bulk Import & Export
class VendorProductCsvExportView(APIView):
    permission_classes = [IsVendorUser]

    def get(self, request):
        vendor = request.user.vendor_profile
        products = Product.objects.filter(vendor=vendor).select_related('category')

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="products_{vendor.slug}.csv"'

        writer = csv.writer(response)
        writer.writerow(['id', 'title', 'category', 'price', 'compare_at_price', 'sku', 'inventory_count', 'low_stock_threshold', 'is_active', 'description', 'short_description'])

        for p in products:
            writer.writerow([
                p.id,
                p.title,
                p.category.name if p.category else '',
                p.price,
                p.compare_at_price or '',
                p.sku or '',
                p.inventory_count,
                p.low_stock_threshold,
                'TRUE' if p.is_active else 'FALSE',
                p.description,
                p.short_description or ''
            ])

        return response


class VendorProductCsvImportView(APIView):
    permission_classes = [IsVendorUser]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        vendor = request.user.vendor_profile
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'error': 'No CSV file provided.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            content = file_obj.read().decode('utf-8-sig')
            # Check for asynchronous background processing parameter
            if request.query_params.get('async') == 'true' or request.data.get('async') == 'true':
                try:
                    from apps.products.tasks import process_csv_import_async
                    task = process_csv_import_async.delay(vendor.id, content)
                    return Response({
                        'status': 'queued',
                        'task_id': task.id,
                        'message': 'Bulk catalog CSV import queued for background processing.'
                    }, status=status.HTTP_202_ACCEPTED)
                except Exception as celery_err:
                    logger.warning("Celery queue unavailable for CSV import: %s. Falling back to synchronous.", celery_err)

            reader = csv.DictReader(io.StringIO(content))
        except Exception as e:
            return Response({'error': f"Failed to parse CSV file: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

        created_count = 0
        updated_count = 0
        errors = []

        from decimal import Decimal

        for row_idx, row in enumerate(reader, start=2):
            title = row.get('title', '').strip()
            if not title:
                continue

            price_str = row.get('price', '').strip()
            try:
                price = Decimal(price_str)
            except Exception:
                errors.append(f"Row {row_idx}: Invalid price '{price_str}' for '{title}'")
                continue

            compare_at_str = row.get('compare_at_price', '').strip()
            compare_at = Decimal(compare_at_str) if compare_at_str else None

            inv_str = row.get('inventory_count', '10').strip()
            inv = int(inv_str) if inv_str.isdigit() else 10

            category_name = row.get('category', '').strip()
            category = None
            if category_name:
                category, _ = Category.objects.get_or_create(
                    name=category_name,
                    defaults={'slug': category_name.lower().replace(' ', '-')}
                )

            prod_id = row.get('id', '').strip()
            if prod_id and prod_id.isdigit():
                existing = Product.objects.filter(id=int(prod_id), vendor=vendor).first()
                if existing:
                    existing.title = title
                    existing.price = price
                    existing.compare_at_price = compare_at
                    existing.inventory_count = inv
                    existing.category = category
                    if row.get('sku'):
                        existing.sku = row.get('sku').strip()
                    if row.get('description'):
                        existing.description = row.get('description').strip()
                    if row.get('short_description'):
                        existing.short_description = row.get('short_description').strip()
                    existing._change_reason = 'BULK_CSV'
                    existing.save()
                    updated_count += 1
                    continue

            new_prod = Product(
                vendor=vendor,
                title=title,
                category=category,
                price=price,
                compare_at_price=compare_at,
                inventory_count=inv,
                sku=row.get('sku', '').strip(),
                description=row.get('description', title).strip(),
                short_description=row.get('short_description', '').strip(),
                is_active=True,
                is_approved=True
            )
            new_prod._change_reason = 'BULK_CSV'
            new_prod.save()
            created_count += 1

        return Response({
            'message': f"CSV processed: {created_count} products created, {updated_count} updated.",
            'created_count': created_count,
            'updated_count': updated_count,
            'errors': errors
        }, status=status.HTTP_200_OK)

