from rest_framework import serializers
from apps.products.models import Category, Product, ProductImage, Review
from apps.accounts.serializers import VendorPublicSerializer

class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'image_url', 'icon', 'is_active', 'product_count']

    def get_product_count(self, obj):
        return obj.products.filter(is_active=True, is_approved=True).count()


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image_url', 'alt_text', 'is_primary', 'sort_order']


class ReviewSerializer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = ['id', 'product', 'customer', 'customer_name', 'rating', 'title', 'comment', 'created_at']
        read_only_fields = ['id', 'customer', 'customer_name', 'created_at']

    def get_customer_name(self, obj):
        name = f"{obj.customer.first_name} {obj.customer.last_name}".strip()
        return name if name else obj.customer.email.split('@')[0]


class ProductListSerializer(serializers.ModelSerializer):
    vendor_name = serializers.CharField(source='vendor.store_name', read_only=True)
    vendor_slug = serializers.CharField(source='vendor.slug', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True, default='')
    primary_image = serializers.ReadOnlyField()
    is_in_stock = serializers.ReadOnlyField()

    class Meta:
        model = Product
        fields = [
            'id', 'title', 'slug', 'short_description', 'price', 'compare_at_price',
            'inventory_count', 'is_in_stock', 'rating', 'review_count',
            'is_featured', 'is_active', 'is_approved', 'primary_image',
            'vendor', 'vendor_name', 'vendor_slug', 'category', 'category_name', 'created_at'
        ]


class ProductDetailSerializer(serializers.ModelSerializer):
    vendor = VendorPublicSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    reviews = ReviewSerializer(many=True, read_only=True)
    primary_image = serializers.ReadOnlyField()
    is_in_stock = serializers.ReadOnlyField()
    is_low_stock = serializers.ReadOnlyField()

    class Meta:
        model = Product
        fields = [
            'id', 'title', 'slug', 'description', 'short_description',
            'price', 'compare_at_price', 'sku', 'inventory_count',
            'low_stock_threshold', 'is_in_stock', 'is_low_stock',
            'rating', 'review_count', 'is_featured', 'is_active',
            'is_approved', 'primary_image', 'images', 'vendor',
            'category', 'reviews', 'created_at', 'updated_at'
        ]


class ProductCreateUpdateSerializer(serializers.ModelSerializer):
    image_urls = serializers.ListField(
        child=serializers.URLField(),
        write_only=True,
        required=False,
        default=list
    )

    class Meta:
        model = Product
        fields = [
            'id', 'category', 'title', 'description', 'short_description',
            'price', 'compare_at_price', 'sku', 'inventory_count',
            'low_stock_threshold', 'is_active', 'image_urls'
        ]

    def create(self, validated_data):
        image_urls = validated_data.pop('image_urls', [])
        # Assign current authenticated vendor
        request = self.context.get('request')
        vendor = request.user.vendor_profile
        product = Product.objects.create(vendor=vendor, **validated_data)

        for i, url in enumerate(image_urls):
            ProductImage.objects.create(
                product=product,
                image_url=url,
                is_primary=(i == 0),
                sort_order=i
            )

        return product

    def update(self, instance, validated_data):
        image_urls = validated_data.pop('image_urls', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if image_urls is not None and len(image_urls) > 0:
            instance.images.all().delete()
            for i, url in enumerate(image_urls):
                ProductImage.objects.create(
                    product=instance,
                    image_url=url,
                    is_primary=(i == 0),
                    sort_order=i
                )

        return instance
