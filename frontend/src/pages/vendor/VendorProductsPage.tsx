import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Check, X, AlertTriangle, Package, ChevronRight } from 'lucide-react';
import { vendorService } from '../../services/api';
import { Product, unwrapResults } from '../../types';
import { VendorProductModal } from './VendorProductModal';
import { VendorSubNav } from '../../components/VendorSubNav';

export const VendorProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await vendorService.getMyProducts({ search: searchTerm });
      const list = unwrapResults<Product>(res);
      setProducts(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [searchTerm]);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this product listing? This cannot be undone.')) return;
    try {
      await vendorService.deleteProduct(id);
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert('Failed to delete product.');
    }
  };

  const handleQuickStockChange = async (product: Product, delta: number) => {
    const newStock = Math.max(0, product.inventory_count + delta);
    setUpdatingId(product.id);
    try {
      await vendorService.quickUpdateProduct(product.id, { inventory_count: newStock });
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, inventory_count: newStock, is_in_stock: newStock > 0 } : p))
      );
    } catch (err) {
      console.error('Failed to update stock:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleActive = async (product: Product) => {
    setUpdatingId(product.id);
    const newActive = !product.is_active;
    try {
      await vendorService.quickUpdateProduct(product.id, { is_active: newActive });
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, is_active: newActive } : p))
      );
    } catch (err) {
      console.error('Failed to toggle status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <VendorSubNav />

      {/* Header Banner */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-black uppercase tracking-widest text-[#fcb424]">Inventory Management</span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0a0500] uppercase tracking-tight mt-1">
            Product Catalog & Stock
          </h1>
          <p className="text-xs text-[#504e4a] mt-1 font-medium">
            Manage your autonomous product listings, adjust selling prices, upload local photos, and track inventory.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingProduct(null);
            setIsModalOpen(true);
          }}
          className="px-6 py-3 bg-[#ffcd05] hover:bg-[#fcb424] text-[#0a0500] font-black uppercase tracking-wider text-xs rounded-full shadow-md hover:shadow-lg flex items-center gap-2 transition flex-shrink-0"
        >
          <Plus className="w-4 h-4 text-[#0a0500]" /> Add New Product
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="max-w-md relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Filter products by title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-4 py-2.5 bg-white border border-neutral-200 rounded-full text-xs outline-none focus:border-[#0a0500] transition shadow-sm"
        />
      </div>

      {/* Products Table */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-16 text-center text-xs text-slate-400">Loading catalog...</div>
        ) : products.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <Package className="w-10 h-10 text-neutral-300 mx-auto" />
            <p className="text-xs text-[#504e4a] font-medium">No items found in your store catalog.</p>
            <button
              onClick={() => {
                setEditingProduct(null);
                setIsModalOpen(true);
              }}
              className="px-6 py-2.5 bg-[#0a0500] text-white font-black uppercase tracking-wider text-xs rounded-full"
            >
              Add Your First Product
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-[#0a0500] uppercase font-black tracking-wider text-[11px] border-b border-neutral-200">
                <tr>
                  <th className="py-4 px-5">Item</th>
                  <th className="py-4 px-5">SKU</th>
                  <th className="py-4 px-5">Price</th>
                  <th className="py-4 px-5">Stock (Quick Edit)</th>
                  <th className="py-4 px-5">Approval</th>
                  <th className="py-4 px-5">Store State</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-50/70 transition">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3.5">
                        <img
                          src={p.primary_image || 'https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=120&q=80'}
                          alt={p.title}
                          className="w-12 h-14 rounded-xl object-cover border border-neutral-200 flex-shrink-0 bg-neutral-100"
                        />
                        <div>
                          <span className="font-bold text-sm text-[#0a0500] block truncate max-w-xs">{p.title}</span>
                          <span className="text-[11px] text-slate-400 font-medium">{p.category_name || 'General Goods'}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-5 font-mono text-slate-500 font-bold">{p.sku || '—'}</td>

                    <td className="py-4 px-5">
                      <span className="font-black text-sm text-[#0a0500]">${Number(p.price).toFixed(2)}</span>
                      {p.compare_at_price && (
                        <span className="text-[10px] text-slate-400 line-through block">
                          ${Number(p.compare_at_price).toFixed(2)}
                        </span>
                      )}
                    </td>

                    {/* Quick Inventory Adjuster */}
                    <td className="py-4 px-5">
                      <div className="inline-flex items-center border border-neutral-200 rounded-full bg-neutral-50 overflow-hidden shadow-sm">
                        <button
                          onClick={() => handleQuickStockChange(p, -1)}
                          disabled={updatingId === p.id || p.inventory_count <= 0}
                          className="w-7 h-7 flex items-center justify-center text-slate-700 hover:bg-neutral-200 font-bold transition disabled:opacity-30"
                          title="Decrease stock by 1"
                        >
                          -
                        </button>
                        <span className="w-10 text-center font-black text-[#0a0500] text-xs">
                          {p.inventory_count}
                        </span>
                        <button
                          onClick={() => handleQuickStockChange(p, 1)}
                          disabled={updatingId === p.id}
                          className="w-7 h-7 flex items-center justify-center text-slate-700 hover:bg-neutral-200 font-bold transition disabled:opacity-30"
                          title="Increase stock by 1"
                        >
                          +
                        </button>
                      </div>

                      {p.inventory_count === 0 ? (
                        <span className="text-[10px] font-black text-rose-600 block mt-1 uppercase">Out of Stock</span>
                      ) : p.inventory_count <= (p.low_stock_threshold || 5) ? (
                        <span className="text-[10px] font-black text-amber-600 block mt-1 uppercase">Low Stock</span>
                      ) : null}
                    </td>

                    {/* Admin Moderation Badge */}
                    <td className="py-4 px-5">
                      {p.is_approved ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold text-[10px] uppercase">
                          Approved
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 font-bold text-[10px] uppercase">
                          Pending Audit
                        </span>
                      )}
                    </td>

                    {/* Interactive Active / Inactive Toggle */}
                    <td className="py-4 px-5">
                      <button
                        onClick={() => handleToggleActive(p)}
                        disabled={updatingId === p.id}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase transition ${
                          p.is_active
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                        }`}
                        title="Click to toggle active listing state"
                      >
                        {p.is_active ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        <span>{p.is_active ? 'Live' : 'Paused'}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setEditingProduct(p);
                            setIsModalOpen(true);
                          }}
                          className="p-2 rounded-xl text-slate-600 hover:text-[#0a0500] hover:bg-neutral-100 transition"
                          title="Edit Full Listing"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Delete Listing"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <VendorProductModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProduct(null);
        }}
        onSuccess={fetchProducts}
        productToEdit={editingProduct}
      />
    </div>
  );
};
