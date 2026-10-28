import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ShoppingBag,
  Star,
  Store,
  Sparkles,
  Truck,
  ShieldCheck,
  RefreshCw,
  Clock,
  Compass,
  Award
} from 'lucide-react';
import { productService, vendorService } from '../../services/api';
import { Product, Category, VendorProfile, unwrapResults } from '../../types';
import { ProductCard } from '../../components/ProductCard';

export const HomePage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [topVendors, setTopVendors] = useState<VendorProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cats, prodsRes, vendorsRes] = await Promise.all([
          productService.getCategories(),
          productService.getProducts(),
          vendorService.getPublicVendors(),
        ]);
        setCategories(unwrapResults<Category>(cats));
        const prods = unwrapResults<Product>(prodsRes);
        setFeaturedProducts(prods.slice(0, 4));
        setPopularProducts(prods.slice(4, 8).length > 0 ? prods.slice(4, 8) : prods.slice(0, 4));

        const vendors = unwrapResults<VendorProfile>(vendorsRes);
        setTopVendors(vendors.slice(0, 3));
      } catch (err) {
        console.error('Failed to load modern shop home data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-24">
      {/* 1. Hero Section (Exact Blocksy Modern Shop Layout) */}
      <section className="relative rounded-3xl overflow-hidden min-h-[550px] lg:min-h-[620px] flex items-center bg-slate-950 text-white shadow-2xl">
        {/* Background Image with Warm Gradient Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1800&q=80"
            alt="Modern Lifestyle and Backpack"
            className="w-full h-full object-cover object-center opacity-45 transform scale-105 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/70 to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-12 py-20 lg:py-28 w-full">
          <div className="max-w-2xl space-y-6">
            <span className="inline-block px-3.5 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-[11px] uppercase tracking-widest shadow-md">
              NEW SEASON ARRIVALS
            </span>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] text-white">
              Full Set Of Great Features To Make You Look Fresh
            </h1>

            <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed max-w-xl">
              Discover handcrafted goods, functional everyday gear, and design-forward essentials sourced directly from verified independent creators.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-3">
              <Link
                to="/products"
                className="px-8 py-4 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-widest shadow-lg shadow-amber-400/25 flex items-center gap-2 transition transform active:scale-95"
              >
                See Collection
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/vendors"
                className="px-6 py-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider border border-white/20 backdrop-blur-sm transition"
              >
                Explore Stores
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Athlete / Creator Spotlight Quote (Blocksy Modern Shop: Landon Peters) */}
      <section className="bg-slate-50 border border-slate-200/90 rounded-3xl p-8 sm:p-12">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 items-center">
          <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-2">
            <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-md border-2 border-white">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80"
                alt="Landon Peters"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-900">Landon Peters</h4>
              <span className="text-[11px] font-bold text-amber-600 block">Athlete & Maker</span>
            </div>
          </div>

          <div className="md:col-span-3 space-y-3 text-center md:text-left">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">
              SPORTSMAN / CHAMPION / BACKPACK
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Engineered For Movement & Durability
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Crafted from weather-resistant materials with ergonomic support. Field-tested for daily city commutes, long-haul travel, and weekend trails.
            </p>
            <div className="pt-1">
              <Link to="/products" className="text-xs font-black uppercase tracking-wider text-slate-950 hover:text-amber-600 inline-flex items-center gap-1.5 transition">
                Find Out More &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Category Showcase */}
      <section className="space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight uppercase">
            Curated Categories
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Explore collections designed for work, travel, and mindful living.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {/* Category Card 1 */}
          <Link
            to="/products?category=electronics-audio"
            className="group relative rounded-3xl overflow-hidden aspect-[4/3] bg-slate-900 shadow-md hover:shadow-2xl transition-all duration-500"
          >
            <img
              src="https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=800&q=80"
              alt="Everyday Carry & Tech"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent flex flex-col justify-end p-6 sm:p-8">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-1">
                EVERYDAY CARRY
              </span>
              <h3 className="text-xl font-extrabold text-white group-hover:text-amber-400 transition-colors">
                Everyday Tech & Audio
              </h3>
              <p className="text-xs text-slate-300 mt-1 line-clamp-1">
                Studio-grade wireless headphones, mechanical keyboards, and charging gear.
              </p>
            </div>
          </Link>

          {/* Category Card 2 */}
          <Link
            to="/products?category=home-living"
            className="group relative rounded-3xl overflow-hidden aspect-[4/3] bg-slate-900 shadow-md hover:shadow-2xl transition-all duration-500"
          >
            <img
              src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80"
              alt="Handcrafted Home & Living"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent flex flex-col justify-end p-6 sm:p-8">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-1">
                HANDCRAFTED LIVING
              </span>
              <h3 className="text-xl font-extrabold text-white group-hover:text-amber-400 transition-colors">
                Artisan Home & Living
              </h3>
              <p className="text-xs text-slate-300 mt-1 line-clamp-1">
                Hand-thrown stoneware dining sets, solid oak lighting, and soy candles.
              </p>
            </div>
          </Link>

          {/* Category Card 3 */}
          <Link
            to="/products?category=fashion-apparel"
            className="group relative rounded-3xl overflow-hidden aspect-[4/3] bg-slate-900 shadow-md hover:shadow-2xl transition-all duration-500"
          >
            <img
              src="https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=800&q=80"
              alt="Streetwear & Tailoring"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent flex flex-col justify-end p-6 sm:p-8">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-1">
                ORGANIC APPAREL
              </span>
              <h3 className="text-xl font-extrabold text-white group-hover:text-amber-400 transition-colors">
                Organic Casual Wear
              </h3>
              <p className="text-xs text-slate-300 mt-1 line-clamp-1">
                Heavyweight French terry hoodies, tailored trousers, and leather bags.
              </p>
            </div>
          </Link>
        </div>
      </section>

      {/* 4. Featured Products Section */}
      <section className="space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight uppercase">
            Featured Products
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Handpicked platform favorites with proven quality and verified reviews.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-80"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 5. Deal of the Day Promo Banner (Blocksy Modern Shop: "Deal of the Day! 70% OFF") */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 text-white shadow-2xl p-8 sm:p-14 border border-amber-500/20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-5">
            <span className="inline-block px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-widest">
              HOT DISCOUNT – 70% OFF
            </span>

            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              Deal of the Day!
            </h2>

            <p className="text-sm text-slate-300 max-w-lg leading-relaxed">
              Limited seasonal promotions from our verified merchants. All discounts are cross-referenced with real past pricing for genuine savings.
            </p>

            <div className="pt-2">
              <Link
                to="/products"
                className="px-8 py-4 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-widest shadow-lg shadow-amber-400/20 inline-flex items-center gap-2 transition transform active:scale-95"
              >
                Grab The Deal Now
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="flex items-center justify-center lg:justify-end">
            <div className="relative text-center p-8 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md">
              <span className="text-7xl sm:text-9xl font-black text-amber-400 leading-none tracking-tighter">
                70%
              </span>
              <p className="text-xs uppercase tracking-widest font-extrabold text-white mt-2">
                Verified discounts on featured merchant catalog
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Popular Products Section */}
      <section className="space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight uppercase">
            Popular Backpacks & Gear
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Top-rated essentials and customer favorites this season.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-80"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 7. Testimonials */}
      <section className="bg-slate-50 border border-slate-200/90 rounded-3xl p-8 sm:p-14 space-y-10">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight uppercase">
            Our Happy Clients!
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Real experiences from verified buyers across the marketplace.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Testimonial 1 */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400" />
              ))}
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed italic">
              "Ordering from different makers in a single cart was effortless. Shipments were dispatched promptly with clear per-vendor tracking updates."
            </p>
            <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
              <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
                  alt="Jason Wong"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-900">Jason Wong</h4>
                <span className="text-[10px] text-slate-400 block font-medium">Verified Buyer</span>
              </div>
            </div>
          </div>

          {/* Testimonial 2 */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400" />
              ))}
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed italic">
              "The craftsmanship on the dining set and headphones exceeded expectations. It's rare to find independent studios with this level of polish."
            </p>
            <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
              <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
                <img
                  src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80"
                  alt="Sarah Jenkins"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-900">Sarah Jenkins</h4>
                <span className="text-[10px] text-slate-400 block font-medium">Verified Customer</span>
              </div>
            </div>
          </div>

          {/* Testimonial 3 */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400" />
              ))}
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed italic">
              "Hands down the cleanest marketplace experience. Transparent buyer protection, responsive sellers, and honest prices."
            </p>
            <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
              <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
                <img
                  src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80"
                  alt="Alex Rivera"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-900">Alex Rivera</h4>
                <span className="text-[10px] text-slate-400 block font-medium">Adventurer & Creator</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Verified Vendor Stores Spotlight */}
      {topVendors.length > 0 && (
        <section className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-600">
                VERIFIED VENDOR COMMUNITY
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight uppercase">
                Meet The Makers & Merchants
              </h2>
            </div>
            <Link
              to="/vendors"
              className="text-xs font-black uppercase tracking-wider text-slate-900 hover:text-amber-600 flex items-center gap-1 transition"
            >
              Explore All Stores <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {topVendors.map((vendor) => (
              <Link
                key={vendor.id}
                to={`/vendors/${vendor.slug}`}
                className="group bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-xs hover:shadow-xl hover:border-amber-400 transition-all flex flex-col"
              >
                <div className="h-32 bg-slate-900 relative overflow-hidden">
                  <img
                    src={vendor.banner_url || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80'}
                    alt={vendor.store_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                  />
                  <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center gap-1 text-[11px] font-black text-slate-900 shadow">
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                    <span>{Number(vendor.rating || 5.0).toFixed(1)}</span>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div className="flex items-center gap-3 -mt-9 mb-3">
                    <div className="w-12 h-12 rounded-xl border-2 border-white shadow-md bg-white overflow-hidden flex-shrink-0">
                      <img
                        src={vendor.logo_url || 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=200&q=80'}
                        alt={vendor.store_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm group-hover:text-amber-600 transition-colors">
                        {vendor.store_name}
                      </h3>
                      <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">
                        Verified Partner
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {vendor.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-400 text-[11px]">{vendor.product_count ?? 3} items listed</span>
                    <span className="text-slate-950 group-hover:text-amber-600 group-hover:translate-x-0.5 transition flex items-center gap-1">
                      Visit Store &rarr;
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
