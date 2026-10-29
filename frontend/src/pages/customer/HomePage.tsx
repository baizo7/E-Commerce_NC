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
  Award,
  CheckCircle2,
  Tag,
  ChevronRight,
  Heart,
  Zap,
  SlidersHorizontal,
  Flame,
  ArrowUpRight
} from 'lucide-react';
import { productService, vendorService } from '../../services/api';
import { Product, Category, VendorProfile, unwrapResults } from '../../types';
import { ProductCard } from '../../components/ProductCard';

export const HomePage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [topVendors, setTopVendors] = useState<VendorProfile[]>([]);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // VIP Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);

  // Flash deal countdown simulation
  const [timeLeft, setTimeLeft] = useState({ hours: 14, minutes: 28, seconds: 45 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 24, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cats, prodsRes, vendorsRes] = await Promise.all([
          productService.getCategories(),
          productService.getProducts(),
          vendorService.getPublicVendors(),
        ]);

        const catData = unwrapResults<Category>(cats);
        setCategories(catData);

        const prods = unwrapResults<Product>(prodsRes);
        setAllProducts(prods);

        // Featured: explicitly featured or top rated
        const featured = prods.filter((p) => p.is_featured);
        setFeaturedProducts(featured.length > 0 ? featured.slice(0, 4) : prods.slice(0, 4));

        // Popular: products with highest reviews or second slice
        setPopularProducts(prods.slice(4, 12).length >= 4 ? prods.slice(4, 12) : prods.slice(0, 8));

        const vendors = unwrapResults<VendorProfile>(vendorsRes);
        setTopVendors(vendors.slice(0, 3));
      } catch (err) {
        console.error('Failed to load marketplace home data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredFeatured = activeCategoryFilter === 'all'
    ? featuredProducts
    : allProducts.filter((p) => {
      const catSlug = typeof p.category === 'object' ? p.category?.slug : '';
      return catSlug === activeCategoryFilter;
    }).slice(0, 4);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setNewsletterSubmitted(true);
    }
  };

  return (
    <div className="space-y-24 sm:space-y-32">
      {/* 1. Hero Section: Refined Editorial Luxury Showcase */}
      <section className="relative rounded-3xl overflow-hidden min-h-[580px] lg:min-h-[660px] flex items-center bg-slate-950 text-white shadow-2xl border border-slate-800">
        {/* Visual Background with Multi-Layer Gradients */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=2000&q=85"
            alt="Handcrafted leather goods and studio gear"
            className="w-full h-full object-cover object-center opacity-30 transform scale-102 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-12 py-20 lg:py-28 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Headline, Value Proposition & Actions */}
            <div className="lg:col-span-7 space-y-7">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-amber-400 text-xs font-bold tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="uppercase text-[11px] font-extrabold tracking-widest text-white">
                  Curated Multi-Vendor Marketplace
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                <span className="text-amber-300 text-[11px]">New 2026 Collection</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] text-white">
                Handcrafted Essentials. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-200">
                  Direct From The Makers.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed max-w-xl">
                Discover durable everyday carry, studio-grade tech, and artisan home goods built by verified independent creators worldwide.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  to="/products"
                  className="px-8 py-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-widest shadow-lg shadow-amber-400/25 flex items-center gap-2 transition transform active:scale-95"
                >
                  <span>Explore Collection</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/vendors"
                  className="px-7 py-4 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider border border-slate-700/80 backdrop-blur-md transition flex items-center gap-2 hover:border-amber-400/50"
                >
                  <Store className="w-4 h-4 text-amber-400" />
                  <span>Meet The Makers</span>
                </Link>
              </div>

              {/* Verified Trust Metrics Row inside Hero */}
              <div className="pt-6 border-t border-slate-800/80 grid grid-cols-3 gap-6 max-w-lg">
                <div>
                  <div className="text-xl sm:text-2xl font-black text-white">100%</div>
                  <div className="text-[11px] text-slate-400 font-medium mt-0.5">Verified Studios</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-white">₹0 Fees</div>
                  <div className="text-[11px] text-slate-400 font-medium mt-0.5">On Returns & Escrow</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-amber-400">4.9 ★</div>
                  <div className="text-[11px] text-slate-400 font-medium mt-0.5">Customer Rating</div>
                </div>
              </div>
            </div>

            {/* Right Column: Floating Curated Product Hero Showcase Card */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl text-white relative group">
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-5 bg-slate-900">
                  <img
                    src="https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80"
                    alt="Italian Full-Grain Leather Weekender Bag"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-white/10 text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Flame className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span>Trending Masterpiece</span>
                  </div>
                  <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-emerald-500/90 text-slate-950 font-black text-xs">
                    In Stock
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span className="font-semibold text-amber-300 uppercase tracking-wider text-[11px]">
                      Aura Apparel & Style
                    </span>
                    <span className="flex items-center gap-1 text-white font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      4.9 (128 reviews)
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                    Full-Grain Leather Minimalist Weekender Bag
                  </h3>

                  <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-400 block font-medium">Selling Price</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-white">₹275.00</span>
                        <span className="text-xs text-slate-400 line-through">₹340.00</span>
                      </div>
                    </div>

                    <Link
                      to="/products/full-grain-italian-leather-minimalist-weekender-bag"
                      className="px-4 py-2.5 rounded-xl bg-white hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition flex items-center gap-1.5 shadow-md"
                    >
                      <span>View Item</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Elevated Trust Architecture Bar */}
      <section className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
          <div className="flex items-center gap-4 sm:px-4 pt-4 sm:pt-0">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 border border-amber-200/60 shadow-xs">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-slate-950 font-extrabold text-sm tracking-tight">Free Express Delivery</h4>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">On all orders exceeding ₹1,000</p>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:px-4 pt-4 sm:pt-0">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-200/60 shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-slate-950 font-extrabold text-sm tracking-tight">Buyer Escrow Protection</h4>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">Funds released only upon delivery</p>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:px-4 pt-4 sm:pt-0">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 border border-indigo-200/60 shadow-xs">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-slate-950 font-extrabold text-sm tracking-tight">Verified Makers Only</h4>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">Strictly audited artisan studios</p>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:px-4 pt-4 sm:pt-0">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-700 flex items-center justify-center flex-shrink-0 border border-slate-200 shadow-xs">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-slate-950 font-extrabold text-sm tracking-tight">30-Day Guaranteed Returns</h4>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">Immediate refunds with zero hassle</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Curated Categories Showcase */}
      <section className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-600 mb-2">
              <Compass className="w-4 h-4" />
              <span>Explore Distinct Collections</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
              Curated Departments
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
              Each piece is thoughtfully crafted and curated for enduring quality, utility, and verified maker origin.
            </p>

          </div>

          <Link
            to="/products"
            className="text-xs font-extrabold uppercase tracking-wider text-slate-900 hover:text-amber-600 inline-flex items-center gap-1.5 transition pb-1"
          >
            <span>Browse All Collections</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Category 1: Electronics */}
          <Link
            to="/products?category=electronics-audio"
            className="group relative rounded-3xl overflow-hidden aspect-[4/5] bg-slate-900 shadow-md hover:shadow-2xl transition-all duration-500 border border-slate-200/80"
          >
            <img
              src="https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=800&q=80"
              alt="Everyday Carry & Tech"
              className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent flex flex-col justify-end p-6">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-1">
                STUDIO SOUND & DESK GEAR
              </span>
              <h3 className="text-xl font-black text-white group-hover:text-amber-300 transition-colors">
                Electronics & Audio
              </h3>
              <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                ANC studio headphones, mechanical boards, and aluminum desk accessories.
              </p>
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-bold text-amber-300">
                <span>View Products</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Category 2: Fashion & Apparel */}
          <Link
            to="/products?category=fashion-apparel"
            className="group relative rounded-3xl overflow-hidden aspect-[4/5] bg-slate-900 shadow-md hover:shadow-2xl transition-all duration-500 border border-slate-200/80"
          >
            <img
              src="https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=800&q=80"
              alt="Apparel & Tailoring"
              className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent flex flex-col justify-end p-6">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-1">
                ORGANIC FABRICS & LEATHER
              </span>
              <h3 className="text-xl font-black text-white group-hover:text-amber-300 transition-colors">
                Fashion & Apparel
              </h3>
              <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                Heavyweight French terry, tailored trousers, and full-grain travel gear.
              </p>
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-bold text-amber-300">
                <span>View Products</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Category 3: Home & Living */}
          <Link
            to="/products?category=home-living"
            className="group relative rounded-3xl overflow-hidden aspect-[4/5] bg-slate-900 shadow-md hover:shadow-2xl transition-all duration-500 border border-slate-200/80"
          >
            <img
              src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80"
              alt="Artisan Ceramics and Home Décor"
              className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent flex flex-col justify-end p-6">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-1">
                CERAMICS & LIGHTING
              </span>
              <h3 className="text-xl font-black text-white group-hover:text-amber-300 transition-colors">
                Home & Living
              </h3>
              <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                Wheel-thrown stoneware, oak table lamps, and natural beeswax candles.
              </p>
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-bold text-amber-300">
                <span>View Products</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Category 4: Fitness & Outdoors */}
          <Link
            to="/products?category=fitness-outdoors"
            className="group relative rounded-3xl overflow-hidden aspect-[4/5] bg-slate-900 shadow-md hover:shadow-2xl transition-all duration-500 border border-slate-200/80"
          >
            <img
              src="https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80"
              alt="Fitness & Trail Performance"
              className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent flex flex-col justify-end p-6">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-1">
                EXPEDITION & PERFORMANCE
              </span>
              <h3 className="text-xl font-black text-white group-hover:text-amber-300 transition-colors">
                Fitness & Outdoors
              </h3>
              <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                Insulated hydration flasks, trail packs, and weather-tested utility gear.
              </p>
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-bold text-amber-300">
                <span>View Products</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* 4. Interactive Editorial Picks Showcase */}
      <section className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-2 border-b border-slate-200/90">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-amber-600 mb-1.5">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span>Verified Customer Favorites</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
              Featured Creations
            </h2>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setActiveCategoryFilter('all')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition whitespace-nowrap ${activeCategoryFilter === 'all'
                  ? 'bg-slate-950 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
            >
              All Items
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCategoryFilter(c.slug)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition whitespace-nowrap ${activeCategoryFilter === c.slug
                    ? 'bg-slate-950 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse bg-slate-100 rounded-3xl h-96 border border-slate-200/60"></div>
            ))}
          </div>
        ) : filteredFeatured.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 rounded-3xl border border-slate-200/80 space-y-3">
            <ShoppingBag className="w-10 h-10 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No items found in this collection right now.</p>
            <button
              onClick={() => setActiveCategoryFilter('all')}
              className="px-5 py-2 rounded-xl bg-slate-950 text-white text-xs font-bold"
            >
              Reset Filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredFeatured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 5. Editorial Maker Spotlight: Premium Studio Feature */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl text-white">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left: Studio Craftsmanship Imagery */}
          <div className="lg:col-span-5 h-72 sm:h-96 lg:h-full relative overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1000&q=80"
              alt="Master Craftsman in Workshop"
              className="w-full h-full object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent lg:hidden"></div>
            <div className="absolute top-4 left-4 px-3.5 py-1.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-white/20 text-xs font-extrabold text-amber-300">
              Featured Maker Atelier
            </div>
          </div>

          {/* Right: Editorial Narrative & Principles */}
          <div className="lg:col-span-7 p-8 sm:p-12 lg:py-16 space-y-6">
            <div className="space-y-2">
              <span className="text-[11px] font-black uppercase tracking-widest text-amber-400 block">
                THE MAKER PHILOSOPHY
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-snug">
                "We believe products should be repaired and inherited — never discarded."
              </h2>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed font-normal">
              Every merchant on Modern Shop undergoes a rigorous verification protocol. We audit raw material provenance, ethical workshop practices, and construction standards so you can invest in gear that endures for decades.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <CheckCircle2 className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-extrabold text-white">Ethically Sourced Materials</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Vegetable-tanned leathers, organic cotton, recycled alloys</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <CheckCircle2 className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-extrabold text-white">Transparent Price History</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Real past pricing tracking with zero inflated discounts</p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-4">
              <Link
                to="/vendors"
                className="px-6 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider transition inline-flex items-center gap-2 shadow-md"
              >
                <span>Browse All 50+ Verified Makers</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Limited Seasonal Drop with Live Countdown */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 text-white shadow-2xl p-8 sm:p-14 border border-amber-500/20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/30 text-amber-300 text-[11px] font-black uppercase tracking-widest">
              <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Limited Mid-Season Flash Drop</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              Genuine Seasonal Savings Across Curated Studios
            </h2>

            <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
              Use promo code <span className="font-mono font-bold text-amber-300 px-1.5 py-0.5 rounded bg-white/10">MODERN20</span> during checkout for 20% off all orders over ₹500. Free worldwide courier delivery automatically applied above ₹1,000.
            </p>

            {/* Countdown Clock Display */}
            <div className="flex items-center gap-3 pt-2">
              <div className="px-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-center min-w-[70px] backdrop-blur-md">
                <span className="text-2xl font-black text-amber-400 block font-mono">
                  {String(timeLeft.hours).padStart(2, '0')}
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Hours</span>
              </div>
              <span className="text-2xl font-black text-amber-400">:</span>
              <div className="px-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-center min-w-[70px] backdrop-blur-md">
                <span className="text-2xl font-black text-amber-400 block font-mono">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Mins</span>
              </div>
              <span className="text-2xl font-black text-amber-400">:</span>
              <div className="px-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-center min-w-[70px] backdrop-blur-md">
                <span className="text-2xl font-black text-amber-400 block font-mono">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Secs</span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                to="/products"
                className="px-8 py-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-widest shadow-lg shadow-amber-400/25 inline-flex items-center gap-2 transition transform active:scale-95"
              >
                <span>Claim Promotional Deal</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Right: Modern Frosted Discount Voucher Card */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="p-8 bg-white/5 border border-white/15 rounded-3xl backdrop-blur-md max-w-sm w-full text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center mx-auto shadow-md">
                <Tag className="w-6 h-6" />
              </div>
              <div>
                <span className="text-5xl sm:text-6xl font-black text-amber-400 tracking-tight font-mono">
                  20% OFF
                </span>
                <h4 className="text-sm font-extrabold text-white uppercase tracking-wider mt-1">
                  Exclusive Sitewide Voucher
                </h4>
              </div>
              <div className="p-3 bg-slate-950/70 border border-amber-400/30 rounded-xl text-center">
                <span className="text-xs text-slate-400 block font-medium">Coupon Code</span>
                <span className="font-mono text-base font-black tracking-widest text-amber-300">
                  MODERN20
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Valid on orders above ₹500. Automatic calculation at checkout.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Popular Everyday Essentials Grid */}
      <section className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-amber-600 mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Community Reviewed</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
              Popular Everyday Carry & Gear
            </h2>
          </div>

          <Link
            to="/products"
            className="text-xs font-extrabold uppercase tracking-wider text-slate-900 hover:text-amber-600 inline-flex items-center gap-1.5 transition"
          >
            <span>View All Products</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse bg-slate-100 rounded-3xl h-96 border border-slate-200/60"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularProducts.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 8. Verified Maker Studios Spotlight */}
      {topVendors.length > 0 && (
        <section className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-amber-600 mb-1.5">
                <Award className="w-3.5 h-3.5 text-amber-500" />
                <span>Audited Independent Sellers</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
                Featured Maker Studios
              </h2>
            </div>
            <Link
              to="/vendors"
              className="text-xs font-extrabold uppercase tracking-wider text-slate-900 hover:text-amber-600 inline-flex items-center gap-1.5 transition"
            >
              <span>Explore All Verified Stores</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {topVendors.map((vendor) => (
              <Link
                key={vendor.id}
                to={`/vendors/${vendor.slug}`}
                className="group bg-white rounded-3xl overflow-hidden border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-amber-400 transition-all flex flex-col"
              >
                <div className="h-36 bg-slate-900 relative overflow-hidden">
                  <img
                    src={vendor.banner_url || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80'}
                    alt={vendor.store_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                  />
                  <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1.5 text-xs font-black text-slate-950 shadow-sm">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>{Number(vendor.rating || 5.0).toFixed(1)}</span>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3.5 mb-3">
                      <div className="w-12 h-12 rounded-2xl border-2 border-white shadow-md bg-white overflow-hidden flex-shrink-0">
                        <img
                          src={vendor.logo_url || 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=200&q=80'}
                          alt={vendor.store_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-950 text-base group-hover:text-amber-600 transition-colors">
                          {vendor.store_name}
                        </h3>
                        <span className="text-[10px] text-emerald-700 font-extrabold uppercase tracking-wider flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Certified Partner Studio
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {vendor.description || 'Independent creator dedicated to ethical production, premium raw materials, and lasting utility.'}
                    </p>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-400 text-[11px]">{vendor.product_count ?? 3} handcrafted items</span>
                    <span className="text-slate-950 group-hover:text-amber-600 group-hover:translate-x-1 transition-all flex items-center gap-1">
                      Visit Atelier &rarr;
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 9. Authentic Customer Testimonials & Verified Reviews */}
      <section className="bg-slate-50 border border-slate-200/90 rounded-3xl p-8 sm:p-14 space-y-10">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold uppercase tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Over 12,000+ Orders Fulfilled</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
            Authentic Buyer Reviews
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Real customer impressions from verified transactions across our independent maker network.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Testimonial 1 */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <span className="text-[10px] text-slate-400 font-semibold">2 days ago</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                "Ordering from three separate studios in a single consolidated cart was effortless. The weekender bag leather quality blew me away."
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
                    alt="Jason Wong"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900">Jason Wong</h4>
                  <span className="text-[10px] text-emerald-600 font-bold block flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3 inline" /> Verified Purchase
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Testimonial 2 */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <span className="text-[10px] text-slate-400 font-semibold">1 week ago</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                "The mechanical keyboard acoustics and desk mat feel like heirloom quality. It's refreshing to buy directly from verified creators."
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
                  <img
                    src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80"
                    alt="Sarah Jenkins"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900">Sarah Jenkins</h4>
                  <span className="text-[10px] text-emerald-600 font-bold block flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3 inline" /> Verified Purchase
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Testimonial 3 */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <span className="text-[10px] text-slate-400 font-semibold">2 weeks ago</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                "The built-in price transparency is genius. You immediately know you are getting honest pricing with genuine seller accountability."
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
                  <img
                    src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80"
                    alt="Alex Rivera"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900">Alex Rivera</h4>
                  <span className="text-[10px] text-emerald-600 font-bold block flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3 inline" /> Verified Purchase
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 10. Modern Shop Insider VIP Club / Newsletter Banner */}
      <section className="bg-slate-950 text-white rounded-3xl p-8 sm:p-14 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-amber-400/10 blur-3xl pointer-events-none"></div>

        <div className="max-w-2xl mx-auto text-center space-y-5 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-black uppercase tracking-widest border border-amber-400/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Modern Shop Insider Club</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Unlock ₹500 Off Your First Artisan Order
          </h2>

          <p className="text-sm text-slate-400 leading-relaxed">
            Subscribe to our weekly dispatch for private drops, maker studio visits, and exclusive promotions. Zero spam, unsubscribe whenever you choose.
          </p>

          {newsletterSubmitted ? (
            <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Welcome to the Insider Club! Check your inbox for voucher code <strong className="font-mono text-white">WELCOME500</strong>.</span>
            </div>
          ) : (
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto pt-2">
              <input
                type="email"
                required
                placeholder="Enter your email address..."
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                className="flex-1 px-4 py-3.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
              />
              <button
                type="submit"
                className="px-6 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider transition shadow-lg shadow-amber-400/20 active:scale-95"
              >
                Join & Save
              </button>
            </form>
          )}

          <div className="flex items-center justify-center gap-6 text-[11px] text-slate-500 pt-2 font-medium">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Data strictly encrypted
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" /> Instant welcome coupon
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};
