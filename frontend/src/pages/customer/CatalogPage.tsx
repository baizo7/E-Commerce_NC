import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Filter, SlidersHorizontal, RefreshCw, X, ChevronRight, Store, Check } from 'lucide-react';
import { productService, vendorService } from '../../services/api';
import { Product, Category, VendorProfile } from '../../types';
import { ProductCard } from '../../components/ProductCard';

export const CatalogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [vendors, setVendors] = useState<VendorProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state from URL query params
  const search = searchParams.get('search') || '';
  const selectedCategory = searchParams.get('category') || '';
  const selectedVendor = searchParams.get('vendor') || '';
  const sort = searchParams.get('sort') || 'newest';
  const inStockOnly = searchParams.get('in_stock') === 'true';

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [cats, vendsRes] = await Promise.all([
          productService.getCategories(),
          vendorService.getPublicVendors(),
        ]);
        setCategories(cats);
        const vends = (vendsRes as any).results || vendsRes;
        setVendors(Array.isArray(vends) ? vends : []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchMetadata();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params: any = {};
        if (search) params.search = search;
        if (selectedCategory) params.category = selectedCategory;
        if (selectedVendor) params.vendor = selectedVendor;
        if (sort) params.sort = sort;
        if (inStockOnly) params.in_stock = true;

        const res = await productService.getProducts(params);
        const prods = (res as any).results || res;
        setProducts(Array.isArray(prods) ? prods : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [searchParams]);

  const updateParam = (key: string, value: string | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  return (
    <div className="space-y-10">
      {/* Blocksy Modern Shop Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-950 text-white p-8 sm:p-14 shadow-xl">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=80"
            alt="Shop Banner"
            className="w-full h-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-amber-400">
            <Link to="/" className="hover:underline text-white">HOME</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            <span>SHOP COLLECTION</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase">
            Take Your Adventure To The Next Level
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
            Discover high-performance backpacks, everyday essentials, and artisan goods curated from verified independent merchants.
          </p>
        </div>
      </div>

      {/* Main Grid: Sidebar Filters + Products */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filter Column */}
        <aside className="space-y-6">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-amber-500" />
                <h3 className="font-black text-xs uppercase tracking-wider text-slate-900">Filters</h3>
              </div>
              {(search || selectedCategory || selectedVendor || inStockOnly) && (
                <button
                  onClick={clearAllFilters}
                  className="text-[11px] font-bold text-amber-600 hover:text-amber-700 underline"
                >
                  Reset All
                </button>
              )}
            </div>

            {/* Keyword Search */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">
                Keyword Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => updateParam('search', e.target.value || null)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-amber-400 transition"
                />
              </div>
            </div>

            {/* Categories */}
            <div>
              <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">
                Product Categories
              </h4>
              <div className="space-y-1">
                <button
                  onClick={() => updateParam('category', null)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between ${
                    !selectedCategory ? 'bg-amber-400 text-slate-950' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>All Categories</span>
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => updateParam('category', cat.slug)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between ${
                      selectedCategory === cat.slug
                        ? 'bg-amber-400 text-slate-950'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{cat.name}</span>
                    {cat.product_count !== undefined && (
                      <span className="text-[10px] text-slate-400 font-normal">({cat.product_count})</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Verified Vendors */}
            {vendors.length > 0 && (
              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">
                  Merchant Stores
                </h4>
                <div className="space-y-1">
                  <button
                    onClick={() => updateParam('vendor', null)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition ${
                      !selectedVendor ? 'bg-amber-400 text-slate-950' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    All Stores
                  </button>
                  {vendors.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => updateParam('vendor', v.slug)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between ${
                        selectedVendor === v.slug
                          ? 'bg-amber-400 text-slate-950'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate">{v.store_name}</span>
                      <Store className="w-3 h-3 text-slate-400 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* In-Stock Filter Toggle */}
            <div className="pt-4 border-t border-slate-100">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => updateParam('in_stock', e.target.checked ? 'true' : null)}
                  className="rounded text-amber-500 focus:ring-amber-400"
                />
                <span>In-Stock Items Only</span>
              </label>
            </div>
          </div>
        </aside>

        {/* Products Main Grid Column */}
        <main className="lg:col-span-3 space-y-6">
          {/* Top Sort & Count Bar */}
          <div className="bg-white border border-slate-200/90 rounded-2xl px-6 py-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <span className="text-xs text-slate-500 font-semibold">
              Showing <span className="text-slate-950 font-black">{products.length}</span> results
            </span>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sort by:</span>
              <select
                value={sort}
                onChange={(e) => updateParam('sort', e.target.value)}
                className="px-3 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-400 text-slate-800"
              >
                <option value="newest">Latest Arrivals</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Average Rating</option>
              </select>
            </div>
          </div>

          {/* Product Grid Area */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse bg-slate-200 rounded-2xl h-80"></div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center space-y-3">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="font-black text-slate-950 text-lg uppercase">No Products Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No items match your active filters. Try resetting keyword or store filters.
              </p>
              <button
                onClick={clearAllFilters}
                className="px-6 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
