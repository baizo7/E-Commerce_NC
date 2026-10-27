import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  Store,
  ShieldCheck,
  TrendingUp,
  Headphones,
  Home,
  Shirt,
  Activity,
  Star
} from 'lucide-react';
import { productService, vendorService } from '../../services/api';
import { Product, Category, VendorProfile } from '../../types';
import { ProductCard } from '../../components/ProductCard';

export const HomePage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [topVendors, setTopVendors] = useState<VendorProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cats, prodsRes, vendorsRes] = await Promise.all([
          productService.getCategories(),
          productService.getProducts({ featured: true }),
          vendorService.getPublicVendors(),
        ]);
        setCategories(cats);
        const prods = (prodsRes as any).results || prodsRes;
        setFeaturedProducts(prods.slice(0, 8));
        const vendors = (vendorsRes as any).results || vendorsRes;
        setTopVendors(vendors.slice(0, 3));
      } catch (err) {
        console.error('Failed to load home page data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getCategoryIcon = (name: string) => {
    if (name.includes('Audio') || name.includes('Electronics')) return <Headphones className="w-5 h-5" />;
    if (name.includes('Home')) return <Home className="w-5 h-5" />;
    if (name.includes('Fashion')) return <Shirt className="w-5 h-5" />;
    return <Activity className="w-5 h-5" />;
  };

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.25),transparent_50%)]"></div>
        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-20 lg:py-28 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-400/30 text-indigo-300 text-xs font-semibold backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Multi-Vendor Architecture &middot; Direct from Makers</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
              Curated goods from world-class <span className="bg-gradient-to-r from-indigo-400 to-sky-300 bg-clip-text text-transparent">independent vendors</span>.
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-xl font-normal leading-relaxed">
              Explore thousands of artisanal, tech, and apparel items from verified merchants. Enjoy unified checkout, atomic inventory locking, and end-to-end multi-vendor tracking.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                to="/products"
                className="px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition transform active:scale-95"
              >
                Browse Marketplace
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/register?role=vendor"
                className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/20 backdrop-blur-sm transition"
              >
                Become a Vendor
              </Link>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 aspect-[4/3]">
              <img
                src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80"
                alt="Multi-vendor storefront display"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-6">
                <div className="bg-white/15 backdrop-blur-md rounded-xl p-4 border border-white/20 w-full text-white">
                  <div className="flex items-center justify-between text-xs font-semibold mb-1 text-indigo-300">
                    <span>Multi-Vendor Order Splitting</span>
                    <span>100% Guaranteed</span>
                  </div>
                  <p className="text-sm font-medium">Shop items from multiple independent stores in a single seamless transaction.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Explore Categories</h2>
            <p className="text-sm text-slate-500 mt-1">Discover handcrafted goods and premium equipment</p>
          </div>
          <Link to="/products" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/products?category=${cat.slug}`}
              className="group relative rounded-2xl overflow-hidden bg-white border border-slate-200/80 p-5 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between h-44"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                {getCategoryIcon(cat.name)}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {cat.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{cat.description}</p>
                <span className="text-[11px] font-semibold text-indigo-600 mt-2 block">
                  {cat.product_count ?? 'Browse items'} &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Marketplace Products */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-amber-100 text-amber-700">
                <TrendingUp className="w-4 h-4" />
              </span>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Featured Marketplace Finds</h2>
            </div>
            <p className="text-sm text-slate-500 mt-1">Top-rated items hand-picked across our registered vendors</p>
          </div>
          <Link to="/products" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
            All Products <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white border border-slate-200 rounded-2xl h-80"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Top Verified Vendors Spotlight */}
      {topVendors.length > 0 && (
        <section className="bg-slate-100/70 border border-slate-200/80 rounded-3xl p-8 sm:p-10">
          <div className="max-w-3xl mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold mb-3">
              <Store className="w-3.5 h-3.5" />
              Verified Vendor Network
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Meet the Makers & Merchants Behind the Marketplace
            </h2>
            <p className="text-slate-600 text-sm mt-1.5 leading-relaxed">
              Every vendor operates an autonomous storefront with independent fulfillment, direct-to-consumer inventory, and transparent seller feedback ratings.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {topVendors.map((vendor) => (
              <Link
                key={vendor.id}
                to={`/vendors/${vendor.slug}`}
                className="group bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all flex flex-col"
              >
                <div className="h-32 bg-slate-200 relative overflow-hidden">
                  <img
                    src={vendor.banner_url || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80'}
                    alt={vendor.store_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center gap-1 text-xs font-bold text-slate-800 shadow">
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                    <span>{Number(vendor.rating || 5.0).toFixed(1)}</span>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center gap-3 -mt-10 mb-3">
                    <div className="w-14 h-14 rounded-xl border-2 border-white shadow-md bg-white overflow-hidden flex-shrink-0">
                      <img
                        src={vendor.logo_url || 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=200&q=80'}
                        alt={vendor.store_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {vendor.store_name}
                      </h3>
                      <span className="text-[11px] text-slate-500 font-medium">Verified Partner</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed flex-1">
                    {vendor.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">{vendor.product_count ?? 'Multiple'} items listed</span>
                    <span className="font-semibold text-indigo-600 group-hover:translate-x-0.5 transition-transform">
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
