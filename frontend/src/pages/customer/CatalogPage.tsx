import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, SlidersHorizontal, RefreshCw, X } from 'lucide-react';
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
        setVendors(vends);
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
        setProducts(prods);
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
    <div className="space-y-8">
      {/* Page Header */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Marketplace Catalog</h1>
        <p className="text-sm text-slate-500 mt-1">
          Browse vetted goods directly from independent creators and certified vendors.
        </p>

        {/* Search bar inside header */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search products by title, keywords, or vendor..."
              value={search}
              onChange={(e) => updateParam('search', e.target.value || null)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-indigo-500 outline-none transition"
            />
            {search && (
              <button
                onClick={() => updateParam('search', null)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Sort Selector */}
            <select
              value={sort}
              onChange={(e) => updateParam('sort', e.target.value)}
              className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 transition cursor-pointer"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>

            {/* In-Stock Toggle */}
            <button
              onClick={() => updateParam('in_stock', inStockOnly ? null : 'true')}
              className={`px-3.5 py-2.5 text-sm font-semibold rounded-xl border transition ${
                inStockOnly
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              In Stock Only
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Filter Sidebar */}
        <aside className="space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                Filters
              </span>
              {(selectedCategory || selectedVendor || search || inStockOnly) && (
                <button
                  onClick={clearAllFilters}
                  className="text-xs text-rose-600 font-semibold hover:underline"
                >
                  Reset All
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Categories</h4>
              <div className="space-y-1">
                <button
                  onClick={() => updateParam('category', null)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition ${
                    !selectedCategory ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => updateParam('category', cat.slug)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition flex items-center justify-between ${
                      selectedCategory === cat.slug
                        ? 'bg-indigo-50 text-indigo-700 font-bold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{cat.name}</span>
                    {cat.product_count !== undefined && (
                      <span className="text-[10px] text-slate-400">({cat.product_count})</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Vendor Filter */}
            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Merchants / Stores</h4>
              <div className="space-y-1 max-h-56 overflow-y-auto">
                <button
                  onClick={() => updateParam('vendor', null)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition ${
                    !selectedVendor ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  All Vendors
                </button>
                {vendors.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => updateParam('vendor', v.slug)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition truncate ${
                      selectedVendor === v.slug
                        ? 'bg-indigo-50 text-indigo-700 font-bold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {v.store_name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Product Grid Area */}
        <main className="lg:col-span-3">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse bg-white border border-slate-200 rounded-2xl h-80"></div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">No Products Found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                We couldn't find any products matching your active filters. Try adjusting your search or clearing filters.
              </p>
              <button
                onClick={clearAllFilters}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div>
              <div className="text-xs text-slate-500 mb-4 font-medium">
                Showing <span className="font-bold text-slate-800">{products.length}</span> marketplace products
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
