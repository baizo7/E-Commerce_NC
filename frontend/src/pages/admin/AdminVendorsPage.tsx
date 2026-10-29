import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  Percent,
  Edit3,
  X,
  Store,
  ExternalLink,
  Building2,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  ShieldCheck,
  Eye,
  AlertTriangle
} from 'lucide-react';
import { adminService } from '../../services/api';
import { VendorProfile, unwrapResults } from '../../types';
import { OrderStatusBadge } from '../../components/OrderStatusBadge';
import { AdminSubNav } from '../../components/AdminSubNav';

export const AdminVendorsPage: React.FC = () => {
  const [vendors, setVendors] = useState<VendorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Dossier Modal
  const [dossierVendor, setDossierVendor] = useState<VendorProfile | null>(null);

  // Rate Editing State
  const [editingVendor, setEditingVendor] = useState<VendorProfile | null>(null);
  const [newCommissionRate, setNewCommissionRate] = useState('10.00');

  // Reason Modal for Rejection / Suspension
  const [actionModal, setActionModal] = useState<{
    vendor: VendorProfile;
    targetStatus: 'SUSPENDED' | 'REJECTED';
  } | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const res = await adminService.getVendors({
        status: statusFilter || undefined,
        search: searchTerm || undefined,
      });
      const list = unwrapResults<VendorProfile>(res);
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

  const handleUpdateStatus = async (vendorId: number, status: string, reason: string = '') => {
    try {
      await adminService.updateVendorStatus(vendorId, { status, reason });
      fetchVendors();
    } catch (err) {
      console.error(err);
      alert('Failed to update vendor status.');
    }
  };

  const submitActionWithReason = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionModal) return;
    setActionSubmitting(true);
    try {
      await handleUpdateStatus(actionModal.vendor.id, actionModal.targetStatus, actionReason);
      setActionModal(null);
      setActionReason('');
    } finally {
      setActionSubmitting(false);
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
    <div className="max-w-7xl mx-auto space-y-8">
      <AdminSubNav />

      {/* Header Banner */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-black uppercase tracking-widest text-[#fcb424] block">
            Merchant Network Control
          </span>
          <h1 className="text-2xl font-black text-[#0a0500] uppercase tracking-tight mt-0.5">
            Merchant Directory & Moderation
          </h1>
          <p className="text-xs text-[#504e4a] mt-0.5">
            Approve onboarding applications, monitor store performance, inspect bank settlement credentials, and configure commission rates.
          </p>
        </div>

        {/* Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: '', label: 'All Stores' },
            { id: 'PENDING', label: 'Pending Review' },
            { id: 'APPROVED', label: 'Approved' },
            { id: 'SUSPENDED', label: 'Suspended' },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`px-3.5 py-1.5 text-xs font-black uppercase tracking-wider rounded-full border transition ${
                statusFilter === st.id
                  ? 'bg-[#0a0500] text-white border-[#0a0500] shadow-sm'
                  : 'bg-neutral-50 text-[#504e4a] border-neutral-200 hover:bg-neutral-100 hover:text-[#0a0500]'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-md relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by store name or specialty..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-neutral-200 rounded-full text-xs focus:border-[#0a0500] outline-none shadow-xs"
        />
      </div>

      {/* Vendors Table */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-16 text-center text-xs text-slate-400">Loading merchant directory...</div>
        ) : vendors.length === 0 ? (
          <div className="p-16 text-center text-xs text-[#504e4a]">
            No merchants found matching your filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-[#0a0500] uppercase font-black tracking-wider text-[10px] border-b border-neutral-200">
                <tr>
                  <th className="py-3 px-4">Merchant Store</th>
                  <th className="py-3 px-4">Business Contact</th>
                  <th className="py-3 px-4">GMV Volume</th>
                  <th className="py-3 px-4">Fee Rate</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {vendors.map((v) => (
                  <tr key={v.id} className="hover:bg-neutral-50/70 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={v.logo_url || 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=100&q=80'}
                          alt=""
                          className="w-10 h-10 rounded-xl object-cover border border-neutral-200 flex-shrink-0"
                        />
                        <div>
                          <span className="font-bold text-[#0a0500] block truncate max-w-xs">{v.store_name}</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-slate-400 font-medium">
                              ★ {Number(v.rating).toFixed(1)} &middot; {v.product_count ?? 0} items
                            </span>
                            {v.slug && (
                              <Link
                                to={`/vendors/${v.slug}`}
                                target="_blank"
                                className="text-[10px] font-bold text-[#fcb424] hover:underline inline-flex items-center gap-0.5"
                              >
                                <span>Store</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-[#504e4a]">
                      <span className="block font-medium">{v.business_email || v.user_email}</span>
                      {v.business_phone && <span className="text-[11px] text-slate-400 block">{v.business_phone}</span>}
                    </td>

                    <td className="py-3 px-4 font-black text-[#0a0500] text-sm">
                      ₹{Number(v.total_sales).toFixed(2)}
                    </td>

                    <td className="py-3 px-4">
                      <button
                        onClick={() => {
                          setEditingVendor(v);
                          setNewCommissionRate(Number(v.commission_rate).toFixed(2));
                        }}
                        className="inline-flex items-center gap-1 font-bold text-[#0a0500] hover:text-[#fcb424] px-2.5 py-1 rounded-full bg-neutral-100 hover:bg-neutral-200 transition"
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
                        <button
                          onClick={() => setDossierVendor(v)}
                          className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider bg-neutral-100 hover:bg-neutral-200 text-[#0a0500] rounded-full transition flex items-center gap-1"
                          title="Inspect Store Dossier"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Dossier</span>
                        </button>

                        {v.status !== 'APPROVED' && (
                          <button
                            onClick={() => handleUpdateStatus(v.id, 'APPROVED')}
                            className="px-3 py-1 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-full font-black text-[11px] uppercase tracking-wider transition"
                          >
                            Approve
                          </button>
                        )}
                        {v.status !== 'SUSPENDED' && (
                          <button
                            onClick={() => {
                              setActionModal({ vendor: v, targetStatus: 'SUSPENDED' });
                              setActionReason('');
                            }}
                            className="px-3 py-1 bg-amber-50 text-amber-800 hover:bg-amber-100 rounded-full font-black text-[11px] uppercase tracking-wider transition"
                          >
                            Suspend
                          </button>
                        )}
                        {v.status !== 'REJECTED' && (
                          <button
                            onClick={() => {
                              setActionModal({ vendor: v, targetStatus: 'REJECTED' });
                              setActionReason('');
                            }}
                            className="px-3 py-1 bg-rose-50 text-rose-800 hover:bg-rose-100 rounded-full font-black text-[11px] uppercase tracking-wider transition"
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

      {/* Full Merchant Dossier Modal */}
      {dossierVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative space-y-6 my-8">
            <button
              onClick={() => setDossierVendor(null)}
              className="absolute right-5 top-5 p-2 rounded-full hover:bg-neutral-100 text-slate-400 hover:text-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Banner preview */}
            <div className="h-32 rounded-2xl overflow-hidden bg-neutral-900 relative">
              <img
                src={dossierVendor.banner_url || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80'}
                alt=""
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
              <div className="absolute bottom-3 left-4 flex items-center gap-3">
                <img
                  src={dossierVendor.logo_url || 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=100&q=80'}
                  alt=""
                  className="w-12 h-12 rounded-xl object-cover border-2 border-white bg-white"
                />
                <div>
                  <h3 className="text-white font-black text-lg uppercase tracking-tight leading-tight">
                    {dossierVendor.store_name}
                  </h3>
                  <span className="text-[11px] text-neutral-300">
                    Status: <strong className="text-[#ffcd05]">{dossierVendor.status}</strong> &middot; Fee: {Number(dossierVendor.commission_rate).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-neutral-50 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Business Contacts
                </span>
                <div className="flex items-center gap-2 text-slate-700">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{dossierVendor.business_email || dossierVendor.user_email}</span>
                </div>
                {dossierVendor.business_phone && (
                  <div className="flex items-center gap-2 text-slate-700">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{dossierVendor.business_phone}</span>
                  </div>
                )}
                {dossierVendor.tax_id && (
                  <div className="flex items-center gap-2 text-slate-700">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Tax ID: {dossierVendor.tax_id}</span>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-xl bg-neutral-50 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Fulfillment Hub Address
                </span>
                <div className="flex items-start gap-2 text-slate-700">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                  <span>{dossierVendor.business_address || 'Standard fulfillment depot on file'}</span>
                </div>
              </div>
            </div>

            {/* Bank Disbursement Account Details */}
            <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200/60 space-y-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#fcb424]" />
                <h4 className="font-black text-[#0a0500] text-xs uppercase tracking-wider">
                  Bank Settlement Credentials
                </h4>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Bank Name</span>
                  <span className="font-bold text-[#0a0500]">{dossierVendor.bank_name || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Beneficiary</span>
                  <span className="font-bold text-[#0a0500]">{dossierVendor.bank_account_holder || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Account Number</span>
                  <span className="font-mono font-bold text-[#0a0500]">{dossierVendor.bank_account_number || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Routing / IFSC</span>
                  <span className="font-mono font-bold text-[#0a0500]">{dossierVendor.bank_routing_code || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Store Bio */}
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                Store Craftsmanship & Bio
              </span>
              <p className="text-xs text-[#504e4a] leading-relaxed bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                {dossierVendor.description || 'No store biography provided.'}
              </p>
            </div>

            <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
              {dossierVendor.slug ? (
                <Link
                  to={`/vendors/${dossierVendor.slug}`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0a0500] hover:text-[#fcb424] transition"
                >
                  <span>Open Public Storefront &rarr;</span>
                </Link>
              ) : <div />}

              <button
                onClick={() => setDossierVendor(null)}
                className="px-6 py-2.5 bg-[#0a0500] text-white text-xs font-black uppercase tracking-wider rounded-full shadow-xs hover:bg-neutral-800 transition"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Moderation Rationale Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h3 className="font-black text-[#0a0500] text-sm uppercase tracking-wide">
                  {actionModal.targetStatus === 'SUSPENDED' ? 'Suspend Merchant Store' : 'Reject Merchant Application'}
                </h3>
              </div>
              <button onClick={() => setActionModal(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#504e4a]">
              Please specify the administrative rationale for <strong>{actionModal.vendor.store_name}</strong>. This note will be automatically emailed to the merchant.
            </p>

            <form onSubmit={submitActionWithReason} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Reason / Administrative Note *
                </label>
                <textarea
                  required
                  rows={3}
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="e.g. Incomplete tax registration documentation / Quality guideline violation..."
                  className="w-full px-3.5 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-[#0a0500] focus:bg-white transition resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActionModal(null)}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 hover:bg-neutral-100 rounded-full"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionSubmitting}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider rounded-full shadow-md transition disabled:opacity-50"
                >
                  {actionSubmitting ? 'Updating...' : `Confirm ${actionModal.targetStatus}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Commission Modal */}
      {editingVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <h3 className="font-black text-[#0a0500] text-sm uppercase tracking-wide">
                Configure Platform Commission
              </h3>
              <button onClick={() => setEditingVendor(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[#504e4a]">
              Set the platform commission percentage deducted from <strong>{editingVendor.store_name}</strong>'s gross sales.
            </p>

            <form onSubmit={handleUpdateCommission} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Commission Rate (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="50"
                    required
                    value={newCommissionRate}
                    onChange={(e) => setNewCommissionRate(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-[#0a0500] focus:bg-white font-black"
                  />
                  <Percent className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingVendor(null)}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 hover:bg-neutral-100 rounded-full"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0a0500] hover:bg-neutral-800 text-white font-black text-xs uppercase tracking-wider rounded-full shadow-md transition"
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
