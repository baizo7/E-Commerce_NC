from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password
from apps.accounts.models import User, VendorProfile

class VendorProfileSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = VendorProfile
        fields = [
            'id', 'user', 'user_email', 'store_name', 'slug', 'description',
            'logo_url', 'banner_url', 'business_email', 'business_phone',
            'business_address', 'tax_id', 'status', 'commission_rate',
            'rating', 'total_sales', 'created_at', 'updated_at', 'product_count'
        ]
        read_only_fields = ['id', 'user', 'slug', 'status', 'commission_rate', 'total_sales', 'rating', 'created_at', 'updated_at']

    def get_product_count(self, obj):
        return obj.products.filter(is_active=True).count()


class VendorPublicSerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = VendorProfile
        fields = [
            'id', 'store_name', 'slug', 'description', 'logo_url', 'banner_url',
            'business_email', 'business_phone', 'rating', 'product_count', 'created_at'
        ]

    def get_product_count(self, obj):
        return obj.products.filter(is_active=True, is_approved=True).count()


class UserSerializer(serializers.ModelSerializer):
    vendor_profile = VendorProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'role', 'phone', 'avatar_url', 'address', 'city', 'country',
            'postal_code', 'vendor_profile', 'date_joined'
        ]
        read_only_fields = ['id', 'role', 'date_joined']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    role = serializers.ChoiceField(choices=User.ROLE_CHOICES, default='CUSTOMER')
    store_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    store_description = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'password', 'first_name', 'last_name', 'role', 'store_name', 'store_description', 'phone']
        extra_kwargs = {
            'username': {'required': False},
            'first_name': {'required': False},
            'last_name': {'required': False},
        }

    def validate(self, attrs):
        if not attrs.get('username'):
            attrs['username'] = attrs['email']
        if attrs.get('role') == 'VENDOR' and not attrs.get('store_name'):
            raise serializers.ValidationError({"store_name": "Store name is required for vendor registration."})
        return attrs

    def create(self, validated_data):
        store_name = validated_data.pop('store_name', None)
        store_description = validated_data.pop('store_description', '')
        password = validated_data.pop('password')
        role = validated_data.get('role', 'CUSTOMER')

        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()

        if role == 'VENDOR' and store_name:
            VendorProfile.objects.create(
                user=user,
                store_name=store_name,
                description=store_description,
                business_email=user.email,
                business_phone=user.phone,
                status='APPROVED', # auto-approved for frictionless demo/MVP
                commission_rate=10.00
            )

        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = UserSerializer(self.user).data
        return data


class AdminVendorStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = VendorProfile
        fields = ['status', 'commission_rate']
