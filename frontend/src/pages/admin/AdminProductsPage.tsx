import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Search,
  CheckCircle2,
  AlertCircle,
  Star,
  Eye,
  X,
  ExternalLink,
  Store,
  Tag,
  CheckSquare,
  Square,
  RotateCcw,
  Sparkles,
  Layers,
  ShoppingBag,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import { adminService, productService } from '../../services/api';
import { Product, Category, VendorProfile, unwrapResults } from '../../types';
import { AdminSubNav } from '../../components/AdminSubNav';

export const AdminProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [vendors, setVendors] = useState<VendorProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'APPROVED' | 'PENDING'>('ALL');
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Bulk actions
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkProcessing, setBulkProcessing] = useState(false);

  // Inspector Modal
  const [inspectProduct, setInspectProduct] = useState<Product | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Load Categories & Vendors once
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [catsRes, vendsRes] = await Promise.all([
          productService.getCategories(),
          adminService.getVendors(),
        ]);
        setCategories(unwrapResults<Category>(catsRes));
        setVendors(unwrapResults<VendorProfile>(vendsRes));
      } catch (err) {
        console.error('Failed to load filter metadata:', err);
      }
    };
    loadMetadata();
  }, []);

  // Fetch products whenever filters change
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (statusFilter === 'APPROVED') params.is_approved = 'true';
      if (statusFilter === 'PENDING') params.is_approved = 'false';
      if (selectedVendor) params.vendor = selectedVendor;
      if (selectedCategory) params.category = selectedCategory;

      const res = await adminService.getAllProducts(params);
      const list = unwrapResults<Product>(res);
      setProducts(list);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchProducts();
    }, 200);
    return () => clearTimeout(timeout);
  }, [searchTerm, statusFilter, selectedVendor, selectedCategory]);

  // Derived KPI Stats
  const stats = useMemo(() => {
    const total = products.length;
    const approved = products.filter((p) => p.is_approved).length;
    const pending = products.filter((p) => !p.is_approved).length;
    const featured = products.filter((p) => p.is_featured).length;
    return { total, approved, pending, featured };
  }, [products]);

  // Single Item Moderation
  const handleToggle = async (
    productId: number,
    field: 'is_approved' | 'is_featured' | 'is_active',
    currentVal: boolean
  ) => {
    try {
      const updated = await adminService.moderateProduct(productId, { [field]: !currentVal });
      setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, ...updated } : p)));
      if (inspectProduct && inspectProduct.id === productId) {
        setInspectProduct((prev) => (prev ? { ...prev, ...updated } : null));
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update product moderation state.');
    }
  };

  // Bulk Selection Handlers
  const handleSelectAll = () => {
    if (selectedIds.length === products.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map((p) => p.id));
    }
  };

  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkAction = async (action: 'approve' | 'delist' | 'feature' | 'unfeature') => {
    if (selectedIds.length === 0) return;
    setBulkProcessing(true);
    try {
      await adminService.bulkModerateProducts(selectedIds, action);
      await fetchProducts();
      setSelectedIds([]);
    } catch (err) {
      console.error('Bulk moderation failed:', err);
      alert('Bulk moderation operation failed.');
    } finally {
      setBulkProcessing(false);
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setSelectedVendor('');
    setSelectedCategory('');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* Unified Admin SubNav */}
      <AdminSubNav />

      {/* Page Header */}
      <div className="bg-[#0a0500] text-white rounded-3xl p-8 relative overflow-hidden shadow-xl border border-neutral-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#ffcd05]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-700/80 text-[#ffcd05] text-[11px] font-black uppercase tracking-wider">
              <Package className="w-3.5 h-3.5" />
              <span>Catalog Governance & Quality Control</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Marketplace Catalog Moderation
            </h1>
            <p className="text-neutral-400 text-sm max-w-2xl font-medium leading-relaxed">
              Audit multi-vendor product listings, enforce marketplace photography standards, approve newly created items, or feature high-performing products.
            </p>
          </div>

          {/* Quick Counter Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-3.5 text-center min-w-[90px]">
              <span className="text-[10px] font-black uppercase text-neutral-400 block tracking-wider">Total</span>
              <span className="text-xl font-black text-white">{stats.total}</span>
            </div>
            <div className="bg-neutral-900/90 border border-emerald-900/50 rounded-2xl p-3.5 text-center min-w-[90px]">
              <span className="text-[10px] font-black uppercase text-emerald-400 block tracking-wider">Live</span>
              <span className="text-xl font-black text-emerald-400">{stats.approved}</span>
            </div>
            <div className={`border rounded-2xl p-3.5 text-center min-w-[90px] ${
              stats.pending > 0
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                : 'bg-neutral-900/90 border-neutral-800 text-neutral-400'
            }`}>
              <span className="text-[10px] font-black uppercase block tracking-wider">Pending</span>
              <span className={`text-xl font-black ${stats.pending > 0 ? 'text-[#ffcd05]' : 'text-neutral-300'}`}>
                {stats.pending}
              </span>
            </div>
            <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-3.5 text-center min-w-[90px]">
              <span className="text-[10px] font-black uppercase text-amber-400 block tracking-wider">Featured</span>
              <span className="text-xl font-black text-amber-400">{stats.featured}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
          {/* Search Input */}
          <div className="md:col-span-5 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by title, SKU, or merchant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 hover:bg-neutral-100/70 focus:bg-white border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-900 placeholder-neutral-400 focus:border-[#0a0500] outline-none transition"
            />
          </div>

          {/* Status Tabs */}
          <div className="md:col-span-3 flex items-center bg-neutral-100 p-1 rounded-xl">
            {(['ALL', 'APPROVED', 'PENDING'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition ${
                  statusFilter === st
                    ? 'bg-[#0a0500] text-white shadow-sm font-black'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {st === 'ALL' ? 'All' : st === 'APPROVED' ? 'Approved' : 'Pending'}
              </button>
            ))}
          </div>

          {/* Vendor Dropdown */}
          <div className="md:col-span-2">
            <select
              value={selectedVendor}
              onChange={(e) => setSelectedVendor(e.target.value)}
              className="w-full py-2.5 px-3 bg-neutral-50 hover:bg-neutral-100/70 border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-800 outline-none focus:border-[#0a0500] transition"
            >
              <option value="">All Merchants</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.slug}>
                  {v.store_name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Dropdown */}
          <div className="md:col-span-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full py-2.5 px-3 bg-neutral-50 hover:bg-neutral-100/70 border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-800 outline-none focus:border-[#0a0500] transition"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Badges & Reset */}
        {(searchTerm || statusFilter !== 'ALL' || selectedVendor || selectedCategory) && (
          <div className="flex items-center justify-between pt-3 border-t border-neutral-100 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-neutral-400 font-bold uppercase text-[10px] tracking-wider">Active Filters:</span>
              {searchTerm && (
                <span className="px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-800 font-semibold text-[11px] flex items-center gap-1">
                  Query: "{searchTerm}"
                  <button onClick={() => setSearchTerm('')}><X className="w-3 h-3 hover:text-rose-600" /></button>
                </span>
              )}
              {statusFilter !== 'ALL' && (
                <span className="px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-800 font-semibold text-[11px] flex items-center gap-1">
                  Status: {statusFilter}
                  <button onClick={() => setStatusFilter('ALL')}><X className="w-3 h-3 hover:text-rose-600" /></button>
                </span>
              )}
              {selectedVendor && (
                <span className="px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-800 font-semibold text-[11px] flex items-center gap-1">
                  Merchant: {vendors.find((v) => v.slug === selectedVendor)?.store_name || selectedVendor}
                  <button onClick={() => setSelectedVendor('')}><X className="w-3 h-3 hover:text-rose-600" /></button>
                </span>
              )}
              {selectedCategory && (
                <span className="px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-800 font-semibold text-[11px] flex items-center gap-1">
                  Category: {categories.find((c) => c.slug === selectedCategory)?.name || selectedCategory}
                  <button onClick={() => setSelectedCategory('')}><X className="w-3 h-3 hover:text-rose-600" /></button>
                </span>
              )}
            </div>

            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-neutral-500 hover:text-[#0a0500] font-bold text-[11px] uppercase tracking-wider"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear All</span>
            </button>
          </div>
        )}
      </div>

      {/* Bulk Action Sticky Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-[#0a0500] text-white rounded-2xl p-4 shadow-lg border border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-xl bg-[#ffcd05] text-[#0a0500] font-black text-xs flex items-center justify-center">
              {selectedIds.length}
            </span>
            <span className="text-xs font-bold text-neutral-200">
              product{selectedIds.length > 1 ? 's' : ''} selected across the active view
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              disabled={bulkProcessing}
              onClick={() => handleBulkAction('approve')}
              className="px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] uppercase tracking-wider transition disabled:opacity-50"
            >
              Approve Selected
            </button>
            <button
              disabled={bulkProcessing}
              onClick={() => handleBulkAction('delist')}
              className="px-3.5 py-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] uppercase tracking-wider transition disabled:opacity-50"
            >
              Delist Selected
            </button>
            <button
              disabled={bulkProcessing}
              onClick={() => handleBulkAction('feature')}
              className="px-3.5 py-1.5 rounded-full bg-amber-500 hover:bg-amber-600 text-[#0a0500] font-black text-[11px] uppercase tracking-wider transition disabled:opacity-50"
            >
              Feature
            </button>
            <button
              disabled={bulkProcessing}
              onClick={() => handleBulkAction('unfeature')}
              className="px-3.5 py-1.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-[11px] uppercase tracking-wider transition disabled:opacity-50"
            >
              Unfeature
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 text-neutral-400 hover:text-white font-semibold text-[11px]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Catalog Table */}
      <div className="bg-white border border-neutral-200/90 rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-16 text-center">
            <div className="w-8 h-8 border-2 border-[#0a0500] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">Loading catalog items...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <Package className="w-12 h-12 text-neutral-300 mx-auto" />
            <h3 className="font-bold text-neutral-800 text-base">No products match your criteria</h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              Try relaxing your search terms or clearing vendor/category filters to view items.
            </p>
            <button
              onClick={resetFilters}
              className="px-4 py-2 rounded-full bg-[#0a0500] text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-500 uppercase font-black text-[10px] tracking-wider border-b border-neutral-100">
                <tr>
                  <th className="py-4 px-4 w-10">
                    <button
                      onClick={handleSelectAll}
                      className="text-neutral-500 hover:text-[#0a0500] transition"
                      title="Select all products"
                    >
                      {selectedIds.length === products.length && products.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-[#0a0500]" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-4 px-4">Product Details</th>
                  <th className="py-4 px-4">Merchant</th>
                  <th className="py-4 px-4">Category</th>
                  <th className="py-4 px-4">Pricing & Stock</th>
                  <th className="py-4 px-4">Moderation Status</th>
                  <th className="py-4 px-4">Featured</th>
                  <th className="py-4 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {products.map((p) => {
                  const isSelected = selectedIds.includes(p.id);
                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-neutral-50/70 transition ${
                        isSelected ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleSelect(p.id)}
                          className="text-neutral-400 hover:text-[#0a0500] transition"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#0a0500]" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Product details */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              p.primary_image ||
                              'https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=120&q=80'
                            }
                            alt=""
                            className="w-12 h-12 rounded-xl object-cover border border-neutral-200 flex-shrink-0 bg-neutral-100"
                          />
                          <div className="min-w-0">
                            <span className="font-bold text-neutral-900 block truncate max-w-xs text-xs">
                              {p.title}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-neutral-400">
                              <span className="flex items-center gap-1 font-semibold text-neutral-600">
                                <Star className="w-3 h-3 text-[#ffcd05] fill-current" />
                                {Number(p.rating || 5).toFixed(1)}
                              </span>
                              <span>•</span>
                              <span>{p.review_count || 0} reviews</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Merchant */}
                      <td className="py-3.5 px-4 font-semibold text-neutral-700">
                        <div className="flex items-center gap-1.5">
                          <Store className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                          <span className="truncate max-w-[140px] font-bold text-neutral-900">
                            {p.vendor_name || 'Vendor'}
                          </span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-700 font-bold text-[10px] uppercase tracking-wider">
                          <Tag className="w-2.5 h-2.5 text-neutral-400" />
                          {p.category_name || 'General'}
                        </span>
                      </td>

                      {/* Price & Stock */}
                      <td className="py-3.5 px-4">
                        <div className="font-black text-neutral-900 text-sm">
                          ₹{Number(p.price).toFixed(2)}
                        </div>
                        <div className="text-[11px] mt-0.5">
                          {p.inventory_count > 5 ? (
                            <span className="text-emerald-700 font-semibold">{p.inventory_count} in stock</span>
                          ) : p.inventory_count > 0 ? (
                            <span className="text-amber-700 font-bold">Only {p.inventory_count} left</span>
                          ) : (
                            <span className="text-rose-600 font-bold uppercase text-[10px]">Out of stock</span>
                          )}
                        </div>
                      </td>

                      {/* Moderation Status */}
                      <td className="py-3.5 px-4">
                        {p.is_approved ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-black text-[10px] uppercase tracking-wider">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Live & Approved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200/80 font-black text-[10px] uppercase tracking-wider">
                            <AlertCircle className="w-3 h-3 text-amber-600" />
                            Pending Review
                          </span>
                        )}
                      </td>

                      {/* Featured Item */}
                      <td className="py-3.5 px-4">
                        {p.is_featured ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-black text-[10px] uppercase tracking-wider">
                            <Star className="w-3 h-3 text-amber-600 fill-current" />
                            Featured
                          </span>
                        ) : (
                          <span className="text-neutral-400 font-semibold text-[11px]">Standard</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Inspect Modal Button */}
                          <button
                            onClick={() => {
                              setInspectProduct(p);
                              setActiveImageIndex(0);
                            }}
                            className="p-1.5 rounded-lg text-neutral-500 hover:text-[#0a0500] hover:bg-neutral-100 transition"
                            title="Inspect Product Dossier"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Quick Moderation Toggle */}
                          <button
                            onClick={() => handleToggle(p.id, 'is_approved', p.is_approved)}
                            className={`px-3 py-1 rounded-full font-black text-[10px] uppercase tracking-wider transition ${
                              p.is_approved
                                ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/70'
                                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                            }`}
                          >
                            {p.is_approved ? 'Delist' : 'Approve'}
                          </button>

                          {/* Featured Toggle */}
                          <button
                            onClick={() => handleToggle(p.id, 'is_featured', p.is_featured)}
                            className={`p-1.5 rounded-lg transition ${
                              p.is_featured
                                ? 'bg-amber-100 text-amber-800'
                                : 'text-neutral-400 hover:text-[#0a0500] hover:bg-neutral-100'
                            }`}
                            title={p.is_featured ? 'Remove from Featured' : 'Mark as Featured on Homepage'}
                          >
                            <Star className="w-4 h-4 fill-current" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Deep Product Inspector Modal */}
      {inspectProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0500]/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-neutral-200 space-y-6 my-8 animate-fadeIn">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-neutral-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                    Product Quality Inspection
                  </span>
                  {inspectProduct.is_approved ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[9px] font-black uppercase">
                      Approved
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[9px] font-black uppercase">
                      Pending
                    </span>
                  )}
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
                  {inspectProduct.title}
                </h3>
              </div>
              <button
                onClick={() => setInspectProduct(null)}
                className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dossier Body */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Product Imagery */}
              <div className="md:col-span-5 space-y-3">
                <div className="aspect-square rounded-2xl overflow-hidden border border-neutral-200 bg-neutral-100 flex items-center justify-center">
                  <img
                    src={
                      inspectProduct.images && inspectProduct.images.length > 0
                        ? inspectProduct.images[activeImageIndex]?.image_url
                        : inspectProduct.primary_image ||
                          'https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=500&q=80'
                    }
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Thumbnails if multiple */}
                {inspectProduct.images && inspectProduct.images.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {inspectProduct.images.map((img, idx) => (
                      <button
                        key={img.id}
                        onClick={() => setActiveImageIndex(idx)}
                        className={`w-12 h-12 rounded-xl overflow-hidden border-2 flex-shrink-0 transition ${
                          activeImageIndex === idx ? 'border-[#0a0500]' : 'border-neutral-200 opacity-60'
                        }`}
                      >
                        <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}

                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/80 text-xs space-y-1">
                  <div className="flex justify-between text-neutral-500">
                    <span>SKU:</span>
                    <span className="font-mono font-bold text-neutral-800">{inspectProduct.sku || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-neutral-500">
                    <span>Created:</span>
                    <span className="font-semibold text-neutral-800">
                      {inspectProduct.created_at ? new Date(inspectProduct.created_at).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Product Dossier Details */}
              <div className="md:col-span-7 space-y-4">
                {/* Merchant & Category */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/80">
                    <span className="text-[10px] font-black uppercase text-neutral-400 block tracking-wider">Merchant</span>
                    <span className="font-bold text-xs text-neutral-900 block truncate mt-0.5">
                      {inspectProduct.vendor_name || 'Vendor'}
                    </span>
                  </div>
                  <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/80">
                    <span className="text-[10px] font-black uppercase text-neutral-400 block tracking-wider">Category</span>
                    <span className="font-bold text-xs text-neutral-900 block truncate mt-0.5">
                      {inspectProduct.category_name || 'General'}
                    </span>
                  </div>
                </div>

                {/* Pricing & Stock Card */}
                <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase text-neutral-400 block tracking-wider">List Price</span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-2xl font-black text-neutral-900">
                        ₹{Number(inspectProduct.price).toFixed(2)}
                      </span>
                      {inspectProduct.compare_at_price && (
                        <span className="text-xs text-neutral-400 line-through">
                          ₹{Number(inspectProduct.compare_at_price).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-black uppercase text-neutral-400 block tracking-wider">Inventory</span>
                    <span className="text-lg font-black text-neutral-900 mt-0.5 block">
                      {inspectProduct.inventory_count} units
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase text-neutral-400 block tracking-wider">Description</span>
                  <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/80 text-xs text-neutral-700 leading-relaxed max-h-40 overflow-y-auto">
                    {inspectProduct.description || inspectProduct.short_description || 'No description provided by merchant.'}
                  </div>
                </div>

                {/* Moderation Controls Inside Modal */}
                <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggle(inspectProduct.id, 'is_approved', inspectProduct.is_approved)}
                      className={`px-4 py-2 rounded-full font-black text-xs uppercase tracking-wider transition ${
                        inspectProduct.is_approved
                          ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                      }`}
                    >
                      {inspectProduct.is_approved ? 'Delist from Marketplace' : 'Approve Listing'}
                    </button>

                    <button
                      onClick={() => handleToggle(inspectProduct.id, 'is_featured', inspectProduct.is_featured)}
                      className={`px-3 py-2 rounded-full font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition ${
                        inspectProduct.is_featured
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                      }`}
                    >
                      <Star className="w-3.5 h-3.5 fill-current text-amber-500" />
                      <span>{inspectProduct.is_featured ? 'Featured' : 'Make Featured'}</span>
                    </button>
                  </div>

                  {inspectProduct.is_approved && (
                    <Link
                      to={`/products/${inspectProduct.slug}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-xs font-bold text-neutral-600 hover:text-[#0a0500]"
                    >
                      <span>Public Page</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-neutral-100 flex justify-end">
              <button
                onClick={() => setInspectProduct(null)}
                className="px-5 py-2.5 bg-[#0a0500] text-white text-xs font-black uppercase tracking-wider rounded-full hover:bg-neutral-800 transition"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};