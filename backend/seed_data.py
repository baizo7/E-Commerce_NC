import os
import django
import sys
from decimal import Decimal

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'marketplace_core.settings')
django.setup()

from apps.accounts.models import User, VendorProfile, UserAddress
from apps.products.models import Category, Product, ProductImage, Review, ProductVariant, PlatformBanner
from apps.orders.models import Order, VendorOrder, OrderItem, Cart, CartItem, Coupon

def run_seed():
    print("🌱 Seeding Modern Shop Database with demo data...")

    # 1. Admin Account
    admin_user = User.objects.filter(email='sanjaisam63@gmail.com').first()
    if not admin_user:
        admin_user = User.objects.create_superuser(
            email='sanjaisam63@gmail.com',
            username='sanjaisam63@gmail.com',
            password='Admin@123',
            first_name='Super',
            last_name='Admin',
            role='ADMIN'
        )
        print("✓ Admin user created: sanjaisam63@gmail.com / Admin@123")
    else:
        admin_user.role = 'ADMIN'
        admin_user.is_staff = True
        admin_user.is_superuser = True
        admin_user.save()
        print("✓ Admin user verified: sanjaisam63@gmail.com")

    # 2. Create Customers
    customer1, _ = User.objects.get_or_create(
        email='customer@example.com',
        defaults={
            'username': 'customer1',
            'first_name': 'Sarah',
            'last_name': 'Jenkins',
            'role': 'CUSTOMER',
            'phone': '+1 (555) 234-5678',
            'address': '742 Evergreen Terrace',
            'city': 'Springfield',
            'postal_code': '97477',
        }
    )
    customer1.set_password('Customer@123')
    customer1.save()

    customer2, _ = User.objects.get_or_create(
        email='david@example.com',
        defaults={
            'username': 'david',
            'first_name': 'David',
            'last_name': 'Miller',
            'role': 'CUSTOMER',
            'phone': '+1 (555) 876-5432',
            'address': '123 Market Street',
            'city': 'San Francisco',
            'postal_code': '94105',
        }
    )
    customer2.set_password('Customer@123')
    customer2.save()
    print("✓ Customer users created: customer@example.com / Customer@123")

    # 3. Create Vendors & Vendor Profiles
    # Vendor 1: TechNova Electronics
    v1_user, _ = User.objects.get_or_create(
        email='vendor@example.com',
        defaults={
            'username': 'technova_vendor',
            'first_name': 'Alex',
            'last_name': 'Chen',
            'role': 'VENDOR',
            'phone': '+1 (555) 111-2233',
        }
    )
    v1_user.set_password('Vendor@123')
    v1_user.save()

    v1_profile, _ = VendorProfile.objects.get_or_create(
        user=v1_user,
        defaults={
            'store_name': 'TechNova Electronics',
            'description': 'Premium cutting-edge audio, computing accessories, and smart devices engineered for modern creators.',
            'logo_url': 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=300&q=80',
            'banner_url': 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
            'business_email': 'contact@technova.io',
            'business_phone': '+1 (555) 111-2233',
            'business_address': '500 Innovation Way, Silicon Valley, CA 94025',
            'status': 'APPROVED',
            'commission_rate': Decimal('10.00'),
            'rating': Decimal('4.90'),
        }
    )

    # Vendor 2: Artisan Living & Home
    v2_user, _ = User.objects.get_or_create(
        email='vendor2@example.com',
        defaults={
            'username': 'artisan_vendor',
            'first_name': 'Elena',
            'last_name': 'Rostova',
            'role': 'VENDOR',
            'phone': '+1 (555) 333-4455',
        }
    )
    v2_user.set_password('Vendor@123')
    v2_user.save()

    v2_profile, _ = VendorProfile.objects.get_or_create(
        user=v2_user,
        defaults={
            'store_name': 'Artisan Living & Home',
            'description': 'Handcrafted ceramic stoneware, minimalist interior decor, and sustainable timber furniture made with passion.',
            'logo_url': 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=300&q=80',
            'banner_url': 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
            'business_email': 'studio@artisanliving.com',
            'business_phone': '+1 (555) 333-4455',
            'business_address': '42 Craft Lane, Portland, OR 97201',
            'status': 'APPROVED',
            'commission_rate': Decimal('12.00'),
            'rating': Decimal('4.85'),
        }
    )

    # Vendor 3: Aura Apparel & Style
    v3_user, _ = User.objects.get_or_create(
        email='vendor3@example.com',
        defaults={
            'username': 'aura_vendor',
            'first_name': 'Marcus',
            'last_name': 'Sterling',
            'role': 'VENDOR',
            'phone': '+1 (555) 777-8899',
        }
    )
    v3_user.set_password('Vendor@123')
    v3_user.save()

    v3_profile, _ = VendorProfile.objects.get_or_create(
        user=v3_user,
        defaults={
            'store_name': 'Aura Apparel & Style',
            'description': 'Contemporary streetwear, organic cotton essentials, and timeless minimalist tailoring.',
            'logo_url': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=300&q=80',
            'banner_url': 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1200&q=80',
            'business_email': 'orders@aurastyle.com',
            'business_phone': '+1 (555) 777-8899',
            'business_address': '88 Soho Square, New York, NY 10012',
            'status': 'APPROVED',
            'commission_rate': Decimal('10.00'),
            'rating': Decimal('4.78'),
        }
    )
    print("✓ Vendors created: TechNova, Artisan Living, Aura Apparel")

    # 4. Categories
    categories_data = [
        {
            'name': 'Electronics & Audio',
            'description': 'High-fidelity headphones, mechanical keyboards, ergonomic accessories, and smart devices.',
            'image_url': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
            'icon': 'Headphones'
        },
        {
            'name': 'Home & Living',
            'description': 'Architectural lighting, ceramic homeware, handcrafted rugs, and organic linens.',
            'image_url': 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80',
            'icon': 'Home'
        },
        {
            'name': 'Fashion & Apparel',
            'description': 'Designer outerwear, heavy cotton tees, relaxed trousers, and curated accessories.',
            'image_url': 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=600&q=80',
            'icon': 'Shirt'
        },
        {
            'name': 'Fitness & Outdoors',
            'description': 'Performance activewear, hydration gear, trail backpacks, and recovery tech.',
            'image_url': 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80',
            'icon': 'Activity'
        },
    ]

    cats = {}
    for c_data in categories_data:
        cat, _ = Category.objects.get_or_create(
            name=c_data['name'],
            defaults=c_data
        )
        cats[cat.name] = cat
    print(f"✓ {len(cats)} Product categories created")

    # 5. Products Catalog
    products_seed = [
        # TechNova Products
        {
            'vendor': v1_profile,
            'category': cats['Electronics & Audio'],
            'title': 'NovaPro Wireless ANC Studio Headphones',
            'price': Decimal('249.99'),
            'compare_at_price': Decimal('299.99'),
            'sku': 'TN-HP-001',
            'inventory_count': 35,
            'low_stock_threshold': 5,
            'is_featured': True,
            'rating': Decimal('4.92'),
            'review_count': 18,
            'short_description': 'Studio-grade hybrid active noise cancellation with 45-hour battery life and custom planar magnetic drivers.',
            'description': 'Immerse yourself in acoustic perfection. The NovaPro Wireless ANC Studio Headphones feature custom-tuned 40mm planar drivers delivering ultra-low distortion, deep sub-bass, and crystal-clear highs. Equipped with 6 beamforming microphones for crystal-clear calls and transparency mode.',
            'images': [
                'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=800&q=80',
            ]
        },
        {
            'vendor': v1_profile,
            'category': cats['Electronics & Audio'],
            'title': 'Apex Stealth Mechanical Keyboard (RGB)',
            'price': Decimal('159.00'),
            'compare_at_price': Decimal('189.00'),
            'sku': 'TN-KB-002',
            'inventory_count': 22,
            'low_stock_threshold': 4,
            'is_featured': True,
            'rating': Decimal('4.88'),
            'review_count': 12,
            'short_description': 'Hot-swappable custom linear switches, CNC aluminum chassis, and gasket-mounted sound dampening.',
            'description': 'Engineered for typing bliss and lightning gaming latency. The Apex Stealth features pre-lubed mechanical switches, double-shot PBT keycaps, per-key RGB backlighting, and triple connectivity (Bluetooth 5.2, 2.4GHz low-latency wireless, and USB-C).',
            'images': [
                'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=800&q=80',
            ]
        },
        {
            'vendor': v1_profile,
            'category': cats['Electronics & Audio'],
            'title': 'Quantum Ultra-Fast Wireless Charging Dock',
            'price': Decimal('69.99'),
            'compare_at_price': Decimal('89.99'),
            'sku': 'TN-WC-003',
            'inventory_count': 4, # Low stock trigger!
            'low_stock_threshold': 5,
            'is_featured': False,
            'rating': Decimal('4.75'),
            'review_count': 8,
            'short_description': '3-in-1 magnetic fast charging dock for smartphone, smart watch, and wireless earbuds.',
            'description': 'Declutter your desk or nightstand. Built with aerospace-grade anodized aluminum and Qi2 fast-charging coils, this dock powers your entire daily carry simultaneously with intelligent thermal protection.',
            'images': [
                'https://images.unsplash.com/photo-1622445262464-84b1456045b6?auto=format&fit=crop&w=800&q=80',
            ]
        },

        # Artisan Living & Home
        {
            'vendor': v2_profile,
            'category': cats['Home & Living'],
            'title': 'Kyoto Hand-Thrown Ceramic Dining Set (16-Piece)',
            'price': Decimal('189.50'),
            'compare_at_price': Decimal('225.00'),
            'sku': 'AL-CS-101',
            'inventory_count': 14,
            'low_stock_threshold': 3,
            'is_featured': True,
            'rating': Decimal('4.95'),
            'review_count': 15,
            'short_description': 'Artisanal speckled stoneware finished with reactive matte glaze. Dishwasher and microwave safe.',
            'description': 'Elevate your everyday dining ritual. Each plate, bowl, and mug in the Kyoto Collection is wheel-thrown by master potters using natural clay. Features an organic matte textured rim with smooth glazed eating surfaces.',
            'images': [
                'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
            ]
        },
        {
            'vendor': v2_profile,
            'category': cats['Home & Living'],
            'title': 'Nordic Solid Oak & Ribbed Glass Table Lamp',
            'price': Decimal('115.00'),
            'compare_at_price': Decimal('140.00'),
            'sku': 'AL-LP-102',
            'inventory_count': 18,
            'low_stock_threshold': 5,
            'is_featured': True,
            'rating': Decimal('4.82'),
            'review_count': 9,
            'short_description': 'Sculptural accent lighting with warm ambient dimming and hand-turned sustainably sourced oak.',
            'description': 'Bask in a soft, welcoming glow. The Nordic Table Lamp merges organic timber architecture with tactile fluted glass shade. Includes a woven fabric power cord with brass tactile rotary dimmer.',
            'images': [
                'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80',
            ]
        },
        {
            'vendor': v2_profile,
            'category': cats['Home & Living'],
            'title': 'Santal & Amber Botanical Soy Wax Candle',
            'price': Decimal('32.00'),
            'compare_at_price': Decimal('38.00'),
            'sku': 'AL-CD-103',
            'inventory_count': 45,
            'low_stock_threshold': 10,
            'is_featured': False,
            'rating': Decimal('4.90'),
            'review_count': 24,
            'short_description': 'Hand-poured 100% natural soy wax infused with essential oils of sandalwood, warm amber, and smoked cedar.',
            'description': '65 hours of clean burning warmth. Encased in a reusable amber glass apothecary vessel with a crackling wooden wick.',
            'images': [
                'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=800&q=80',
            ]
        },

        # Aura Apparel & Style
        {
            'vendor': v3_profile,
            'category': cats['Fashion & Apparel'],
            'title': 'Heavyweight Organic French Terry Hoodie',
            'price': Decimal('89.00'),
            'compare_at_price': Decimal('110.00'),
            'sku': 'AA-HD-201',
            'inventory_count': 28,
            'low_stock_threshold': 5,
            'is_featured': True,
            'rating': Decimal('4.86'),
            'review_count': 31,
            'short_description': '480 GSM custom milled organic cotton with relaxed drop-shoulder silhouette and double-layered hood.',
            'description': 'The quintessential modern luxury hoodie. Pre-shrunk, garment-dyed in muted earth tones, and finished with sturdy flatlock stitching designed to last a lifetime.',
            'images': [
                'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=800&q=80',
            ]
        },
        {
            'vendor': v3_profile,
            'category': cats['Fashion & Apparel'],
            'title': 'Full-Grain Italian Leather Minimalist Weekender Bag',
            'price': Decimal('275.00'),
            'compare_at_price': Decimal('340.00'),
            'sku': 'AA-BG-202',
            'inventory_count': 9,
            'low_stock_threshold': 3,
            'is_featured': True,
            'rating': Decimal('4.94'),
            'review_count': 16,
            'short_description': 'Vegetable-tanned full grain calfskin with solid brass hardware and dedicated shoe compartment.',
            'description': 'Crafted in Tuscany. Designed to age with a rich, personalized patina. Complies with all major international carry-on airline dimensions, featuring water-resistant twill lining and detachable padded shoulder strap.',
            'images': [
                'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
            ]
        },

        # Fitness & Outdoors
        {
            'vendor': v1_profile,
            'category': cats['Fitness & Outdoors'],
            'title': 'Vortex Pulse Smart Hydration Steel Flask',
            'price': Decimal('54.00'),
            'compare_at_price': Decimal('65.00'),
            'sku': 'TN-FL-301',
            'inventory_count': 30,
            'low_stock_threshold': 5,
            'is_featured': False,
            'rating': Decimal('4.70'),
            'review_count': 7,
            'short_description': 'Vacuum insulated triple-wall stainless steel with integrated LED temperature and hydration tracker.',
            'description': 'Keeps beverages icy cold for 36 hours or piping hot for 18 hours. Bluetooth synced to health apps to remind you when to hydrate.',
            'images': [
                'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80',
            ]
        }
    ]

    created_products = []
    for p_info in products_seed:
        images = p_info.pop('images')
        prod, created = Product.objects.get_or_create(
            sku=p_info['sku'],
            defaults=p_info
        )
        if created or not prod.images.exists():
            for i, img_url in enumerate(images):
                ProductImage.objects.create(
                    product=prod,
                    image_url=img_url,
                    is_primary=(i == 0),
                    sort_order=i
                )
        created_products.append(prod)

    print(f"✓ {len(created_products)} Products created with images")

    # 6. Add Reviews
    reviews_seed = [
        (created_products[0], customer1, 5, "Incredible studio sound quality", "The active noise cancellation is better than my Sony WH-1000XM5. Highly recommended!"),
        (created_products[0], customer2, 5, "Super comfortable for all-day coding", "Battery lasts the entire week without needing a top-up."),
        (created_products[3], customer1, 5, "Stunning craftsmanship", "You can tell these are hand-thrown. The weight and glaze texture in person are breathtaking."),
        (created_products[6], customer2, 5, "Best hoodie I own", "Thick, ultra-soft French terry. Fits perfectly oversized."),
    ]
    for p, c, r, t, comment in reviews_seed:
        Review.objects.get_or_create(
            product=p,
            customer=c,
            defaults={'rating': r, 'title': t, 'comment': comment}
        )
    print("✓ Customer product reviews created")

    # 7. Create Demo Multi-Vendor Orders for Analytics & Dashboard
    Order.objects.all().delete()
    VendorOrder.objects.all().delete()
    OrderItem.objects.all().delete()

    # Order 1: Contains items from TechNova AND Artisan Living (Demonstrates order splitting!)
    order1 = Order.objects.create(
        order_number='ORD-20261025-TN01',
        customer=customer1,
        total_items_amount=Decimal('439.49'), # 249.99 + 189.50
        shipping_amount=Decimal('0.00'),
        tax_amount=Decimal('21.97'),
        grand_total=Decimal('461.46'),
        status='SHIPPED',
        payment_status='PAID',
        payment_method='CREDIT_CARD',
        payment_id='PAY-SIM-789012',
        shipping_name='Sarah Jenkins',
        shipping_email='customer@example.com',
        shipping_phone='+1 (555) 234-5678',
        shipping_address='742 Evergreen Terrace',
        shipping_city='Springfield',
        shipping_state='OR',
        shipping_postal_code='97477',
    )

    # Sub-order for Vendor 1 (TechNova)
    vo1_1 = VendorOrder.objects.create(
        order=order1,
        vendor=v1_profile,
        subtotal=Decimal('249.99'),
        commission_rate=Decimal('10.00'),
        commission_amount=Decimal('25.00'),
        net_vendor_amount=Decimal('224.99'),
        status='SHIPPED',
        tracking_number='FDX-9988776655',
        carrier='FedEx Express'
    )
    v1_profile.total_sales = Decimal(str(v1_profile.total_sales or 0)) + Decimal('249.99')
    v1_profile.save()

    OrderItem.objects.create(
        order=order1,
        vendor_order=vo1_1,
        product=created_products[0],
        vendor=v1_profile,
        product_title=created_products[0].title,
        product_sku=created_products[0].sku,
        price=created_products[0].price,
        quantity=1,
        subtotal=created_products[0].price,
        image_url=created_products[0].primary_image
    )

    # Sub-order for Vendor 2 (Artisan Living)
    vo1_2 = VendorOrder.objects.create(
        order=order1,
        vendor=v2_profile,
        subtotal=Decimal('189.50'),
        commission_rate=Decimal('12.00'),
        commission_amount=Decimal('22.74'),
        net_vendor_amount=Decimal('166.76'),
        status='SHIPPED',
        tracking_number='UPS-1Z99999999',
        carrier='UPS Ground'
    )
    v2_profile.total_sales = Decimal(str(v2_profile.total_sales or 0)) + Decimal('189.50')
    v2_profile.save()

    OrderItem.objects.create(
        order=order1,
        vendor_order=vo1_2,
        product=created_products[3],
        vendor=v2_profile,
        product_title=created_products[3].title,
        product_sku=created_products[3].sku,
        price=created_products[3].price,
        quantity=1,
        subtotal=created_products[3].price,
        image_url=created_products[3].primary_image
    )

    # Order 2: Aura Apparel Order
    order2 = Order.objects.create(
        order_number='ORD-20261026-AA02',
        customer=customer2,
        total_items_amount=Decimal('364.00'), # 89.00 + 275.00
        shipping_amount=Decimal('0.00'),
        tax_amount=Decimal('18.20'),
        grand_total=Decimal('382.20'),
        status='PROCESSING',
        payment_status='PAID',
        payment_method='UPI',
        payment_id='PAY-UPI-443322',
        shipping_name='David Miller',
        shipping_email='david@example.com',
        shipping_phone='+1 (555) 876-5432',
        shipping_address='123 Market Street',
        shipping_city='San Francisco',
        shipping_state='CA',
        shipping_postal_code='94105',
    )

    vo2_1 = VendorOrder.objects.create(
        order=order2,
        vendor=v3_profile,
        subtotal=Decimal('364.00'),
        commission_rate=Decimal('10.00'),
        commission_amount=Decimal('36.40'),
        net_vendor_amount=Decimal('327.60'),
        status='PROCESSING'
    )
    v3_profile.total_sales = Decimal(str(v3_profile.total_sales or 0)) + Decimal('364.00')
    v3_profile.save()

    OrderItem.objects.create(
        order=order2,
        vendor_order=vo2_1,
        product=created_products[6],
        vendor=v3_profile,
        product_title=created_products[6].title,
        product_sku=created_products[6].sku,
        price=created_products[6].price,
        quantity=1,
        subtotal=created_products[6].price,
        image_url=created_products[6].primary_image
    )

    OrderItem.objects.create(
        order=order2,
        vendor_order=vo2_1,
        product=created_products[7],
        vendor=v3_profile,
        product_title=created_products[7].title,
        product_sku=created_products[7].sku,
        price=created_products[7].price,
        quantity=1,
        subtotal=created_products[7].price,
        image_url=created_products[7].primary_image
    )

    # 8. Setup Customer Cart item
    cart1, _ = Cart.objects.get_or_create(customer=customer1)
    cart1.items.all().delete()
    CartItem.objects.create(cart=cart1, product=created_products[1], quantity=1)

    # 9. Create Promotional Coupons
    Coupon.objects.get_or_create(
        code='MODERN20',
        defaults={
            'discount_type': 'PERCENTAGE',
            'value': Decimal('20.00'),
            'min_purchase_amount': Decimal('50.00'),
            'max_discount_amount': Decimal('50.00'),
            'is_active': True,
        }
    )
    Coupon.objects.get_or_create(
        code='SAVE15',
        defaults={
            'discount_type': 'FIXED',
            'value': Decimal('15.00'),
            'min_purchase_amount': Decimal('40.00'),
            'is_active': True,
        }
    )

    # 10. Create Customer Saved Addresses
    UserAddress.objects.get_or_create(
        user=customer1,
        title='Home',
        defaults={
            'recipient_name': 'Sarah Jenkins',
            'phone': '+1 (555) 234-5678',
            'street_address': '742 Evergreen Terrace',
            'city': 'Springfield',
            'state': 'OR',
            'postal_code': '97477',
            'country': 'United States',
            'is_default': True
        }
    )
    UserAddress.objects.get_or_create(
        user=customer1,
        title='Studio Office',
        defaults={
            'recipient_name': 'Sarah Jenkins (Work)',
            'phone': '+1 (555) 888-9999',
            'street_address': '450 Mission Street, Suite 300',
            'city': 'San Francisco',
            'state': 'CA',
            'postal_code': '94105',
            'country': 'United States',
            'is_default': False
        }
    )

    # 11. Create Sample Product Variants
    if created_products:
        p0 = created_products[0]
        ProductVariant.objects.get_or_create(
            product=p0,
            title='Midnight Black / 256GB',
            defaults={
                'sku': f"{p0.sku}-BLK-256",
                'price': p0.price,
                'compare_at_price': Decimal('399.00'),
                'inventory_count': 15,
                'attributes': {'Color': 'Midnight Black', 'Storage': '256GB'}
            }
        )
        ProductVariant.objects.get_or_create(
            product=p0,
            title='Silver Titanium / 512GB',
            defaults={
                'sku': f"{p0.sku}-SLV-512",
                'price': Decimal('379.00'),
                'compare_at_price': Decimal('429.00'),
                'inventory_count': 8,
                'attributes': {'Color': 'Silver Titanium', 'Storage': '512GB'}
            }
        )

    # 12. Create Active Announcement Banner
    PlatformBanner.objects.get_or_create(
        title='Mid-Season Flash Sale',
        defaults={
            'message': 'Use code MODERN20 at checkout for 20% off all orders over $50! Free worldwide shipping over $100.',
            'link_url': '/products',
            'banner_type': 'PROMO',
            'is_active': True
        }
    )

    print("✓ Sample multi-vendor split orders, coupons, addresses, and variants initialized")
    print("✨ Database seed completed successfully!")

if __name__ == '__main__':
    run_seed()
