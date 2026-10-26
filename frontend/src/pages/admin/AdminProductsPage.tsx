import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search, Check, X, Star, ShieldCheck, Store } from 'lucide-react';
import { adminService } from '../../services/api';
import { Product } from '../../types';

export const AdminProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await adminService.getAllProducts({ search: searchTerm || undefined });
      const list = (res as any).results || res;
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

  const handleToggle = async (
    productId: number,
    field: 'is_approved' | 'is_featured' | 'is_active',
    currentVal: boolean
  ) => {
    try {
      await adminService.moderateProduct(productId, { [field]: !currentVal });
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert('Failed to update product status.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/admin/dashboard" className="hover:text-indigo-600 flex items-center gap-1 font-semibold">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Admin Dashboard
        </Link>
      </div>

      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Catalog Quality Moderation</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit product listings across all registered vendors. Approve or delist items from the public marketplace.
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="max-w-md relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search catalog by title or vendor name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:border-indigo-500 outline-none"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading catalog...</div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No products found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Merchant</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Price / Stock</th>
                  <th className="py-3 px-4">Moderation Approval</th>
                  <th className="py-3 px-4">Featured Item</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.primary_image || 'https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=100&q=80'}
                          alt=""
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                        />
                        <div>
                          <span className="font-bold text-slate-900 block truncate max-w-xs">{p.title}</span>
                          <span className="text-[11px] text-slate-400">Rating: {Number(p.rating || 5).toFixed(1)}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-700">
                      {p.vendor_name || 'Vendor'}
                    </td>

                    <td className="py-3 px-4 text-slate-600">{p.category_name || 'General'}</td>

                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900">${Number(p.price).toFixed(2)}</span>
                      <span className="text-[11px] text-slate-400 block">{p.inventory_count} in stock</span>
                    </td>

                    <td className="py-3 px-4">
                      {p.is_approved ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                          Approved
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold text-[10px]">
                          Pending Review
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {p.is_featured ? (
                        <span className="inline-flex items-center gap-1 text-amber-600 font-bold">
                          <Star className="w-3.5 h-3.5 fill-current" /> Featured
                        </span>
                      ) : (
                        <span className="text-slate-400">Standard</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggle(p.id, 'is_approved', p.is_approved)}
                          className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition ${
                            p.is_approved
                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {p.is_approved ? 'Delist' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleToggle(p.id, 'is_featured', p.is_featured)}
                          className={`p-1.5 rounded-lg transition ${
                            p.is_featured
                              ? 'bg-amber-100 text-amber-800'
                              : 'text-slate-400 hover:bg-slate-100'
                          }`}
                          title="Toggle Featured on Homepage"
                        >
                          <Star className="w-4 h-4" />
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
    </div>
  );
};
