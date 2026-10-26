import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search, CheckCircle, XCircle, AlertCircle, Percent, Edit3, X } from 'lucide-react';
import { adminService } from '../../services/api';
import { VendorProfile } from '../../types';
import { OrderStatusBadge } from '../../components/OrderStatusBadge';

export const AdminVendorsPage: React.FC = () => {
  const [vendors, setVendors] = useState<VendorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Rate Editing State
  const [editingVendor, setEditingVendor] = useState<VendorProfile | null>(null);
  const [newCommissionRate, setNewCommissionRate] = useState('10.00');

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const res = await adminService.getVendors({
        status: statusFilter || undefined,
        search: searchTerm || undefined,
      });
      const list = (res as any).results || res;
      setVendors(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [statusFilter, searchTerm]);

  const handleUpdateStatus = async (vendorId: number, status: string) => {
    try {
      await adminService.updateVendorStatus(vendorId, { status });
      fetchVendors();
    } catch (err) {
      console.error(err);
      alert('Failed to update vendor status.');
    }
  };

  const handleUpdateCommission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVendor) return;
    try {
      await adminService.updateVendorStatus(editingVendor.id, {
        status: editingVendor.status,
        commission_rate: parseFloat(newCommissionRate),
      });
      setEditingVendor(null);
      fetchVendors();
    } catch (err) {
      console.error(err);
      alert('Failed to update commission rate.');
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
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Vendor Management & Moderation</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Approve onboarding applications, monitor store performance, and configure tiered platform fee rates.
          </p>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          {['', 'PENDING', 'APPROVED', 'SUSPENDED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {st === '' ? 'All Vendors' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <div className="max-w-md relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by store name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:border-indigo-500 outline-none"
        />
      </div>

      {/* Vendors Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading vendors...</div>
        ) : vendors.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No vendors found matching filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Merchant Store</th>
                  <th className="py-3 px-4">Contact Email</th>
                  <th className="py-3 px-4">Total GMV Sold</th>
                  <th className="py-3 px-4">Platform Fee</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vendors.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={v.logo_url || 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=100&q=80'}
                          alt=""
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                        />
                        <div>
                          <span className="font-bold text-slate-900 block truncate max-w-xs">{v.store_name}</span>
                          <span className="text-[11px] text-slate-400">Rating: {Number(v.rating).toFixed(1)} &middot; {v.product_count ?? 0} items</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-600">{v.business_email || v.user_email}</td>

                    <td className="py-3 px-4 font-bold text-slate-900">${Number(v.total_sales).toFixed(2)}</td>

                    <td className="py-3 px-4">
                      <button
                        onClick={() => {
                          setEditingVendor(v);
                          setNewCommissionRate(Number(v.commission_rate).toFixed(2));
                        }}
                        className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-indigo-600 p-1 rounded hover:bg-slate-100"
                        title="Click to adjust commission rate"
                      >
                        <span>{Number(v.commission_rate).toFixed(1)}%</span>
                        <Edit3 className="w-3 h-3 text-slate-400" />
                      </button>
                    </td>

                    <td className="py-3 px-4">
                      <OrderStatusBadge status={v.status} />
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {v.status !== 'APPROVED' && (
                          <button
                            onClick={() => handleUpdateStatus(v.id, 'APPROVED')}
                            className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg font-semibold text-[11px] transition"
                          >
                            Approve
                          </button>
                        )}
                        {v.status !== 'SUSPENDED' && (
                          <button
                            onClick={() => handleUpdateStatus(v.id, 'SUSPENDED')}
                            className="px-2.5 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg font-semibold text-[11px] transition"
                          >
                            Suspend
                          </button>
                        )}
                        {v.status !== 'REJECTED' && (
                          <button
                            onClick={() => handleUpdateStatus(v.id, 'REJECTED')}
                            className="px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg font-semibold text-[11px] transition"
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Commission Modal */}
      {editingVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Configure Platform Fee</h3>
              <button onClick={() => setEditingVendor(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Set the platform commission percentage deducted from {editingVendor.store_name}'s gross sales.
            </p>

            <form onSubmit={handleUpdateCommission} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Commission Rate (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="50"
                    required
                    value={newCommissionRate}
                    onChange={(e) => setNewCommissionRate(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-bold"
                  />
                  <Percent className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingVendor(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 text-white font-semibold text-xs rounded-xl shadow hover:bg-indigo-700"
                >
                  Save Rate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
