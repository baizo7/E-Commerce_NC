import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Search,
  CheckCircle2,
  XCircle,
  HelpCircle,
  DollarSign,
  User,
  Store,
  Clock,
  X,
  ExternalLink
} from 'lucide-react';
import { adminService } from '../../services/api';
import { Dispute } from '../../types';
import { AdminSubNav } from '../../components/AdminSubNav';

export const AdminDisputesPage: React.FC = () => {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Resolution Modal State
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [resolutionStatus, setResolutionStatus] = useState<'RESOLVED_REFUNDED' | 'REJECTED' | 'UNDER_REVIEW'>('RESOLVED_REFUNDED');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolving, setResolving] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter !== 'ALL') {
        params.status = statusFilter;
      }
      const data = await adminService.getDisputes(params);
      setDisputes(data);
    } catch (err) {
      console.error('Failed to load disputes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, [statusFilter]);

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDispute) return;
    try {
      setResolving(true);
      setActionError(null);
      const actionType =
        resolutionStatus === 'RESOLVED_REFUNDED'
          ? 'REFUND'
          : resolutionStatus === 'REJECTED'
          ? 'REJECT'
          : 'UNDER_REVIEW';

      const res = await adminService.resolveDispute(selectedDispute.id, {
        action: actionType,
        decision_notes: resolutionNotes,
      });
      setActionSuccess(`Dispute #${selectedDispute.id} updated: ${res.message}`);
      setSelectedDispute(null);
      setResolutionNotes('');
      await fetchDisputes();
    } catch (err: any) {
      setActionError(err.response?.data?.error || 'Failed to update dispute status.');
    } finally {
      setResolving(false);
    }
  };

  const filteredDisputes = disputes.filter((d) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      d.order_number?.toLowerCase().includes(term) ||
      d.customer_email?.toLowerCase().includes(term) ||
      d.customer_notes?.toLowerCase().includes(term) ||
      d.reason?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <AdminSubNav />

      {/* Header Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-black uppercase tracking-widest text-[#fcb424]">Buyer Protection & Moderation</span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-950 uppercase tracking-tight mt-1 flex items-center gap-2.5">
            <AlertTriangle className="w-7 h-7 text-amber-500" />
            Dispute & Claim Resolution
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Review customer claims, merchant responses, and programmatically issue instant Razorpay refunds or dismiss claims.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
            {disputes.length} Total Claims
          </span>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Controls & Status Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {['ALL', 'OPEN', 'UNDER_REVIEW', 'RESOLVED_REFUNDED', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition uppercase tracking-wider ${
                statusFilter === st
                  ? 'bg-slate-950 text-amber-400 shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search order or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-full text-xs outline-none focus:border-slate-950 shadow-xs"
          />
        </div>
      </div>

      {/* Disputes Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-900 uppercase font-black tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-4 px-5">Claim ID</th>
                <th className="py-4 px-5">Order Ref</th>
                <th className="py-4 px-5">Customer</th>
                <th className="py-4 px-5">Reason</th>
                <th className="py-4 px-5">Claim Amount</th>
                <th className="py-4 px-5">Status</th>
                <th className="py-4 px-5">Filed Date</th>
                <th className="py-4 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Loading dispute cases...
                  </td>
                </tr>
              ) : filteredDisputes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No disputes match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredDisputes.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-4 px-5 font-mono font-bold text-slate-900">
                      #{d.id}
                    </td>
                    <td className="py-4 px-5 font-mono font-bold text-slate-900">
                      {d.order_number}
                    </td>
                    <td className="py-4 px-5 text-slate-600 truncate max-w-xs">
                      {d.customer_email}
                    </td>
                    <td className="py-4 px-5">
                      <span className="px-2 py-0.5 rounded bg-slate-100 font-bold text-[10px] uppercase text-slate-700">
                        {d.reason?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-5 font-black text-slate-900 text-sm">
                      ₹{Number(d.amount || 0).toFixed(2)}
                    </td>
                    <td className="py-4 px-5">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          d.status === 'RESOLVED_REFUNDED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : d.status === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800'
                            : d.status === 'UNDER_REVIEW'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {d.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-slate-500">
                      {new Date(d.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <button
                        onClick={() => {
                          setSelectedDispute(d);
                          setResolutionStatus(d.status === 'OPEN' ? 'RESOLVED_REFUNDED' : d.status as any);
                          setResolutionNotes(d.admin_decision || d.resolution_notes || '');
                        }}
                        className="px-3.5 py-1.5 bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition shadow-xs"
                      >
                        Review & Resolve
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review & Resolve Modal */}
      {selectedDispute && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Resolve Dispute #{selectedDispute.id} (Order #{selectedDispute.order_number})
              </h3>
              <button
                onClick={() => setSelectedDispute(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {actionError && (
              <p className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
                {actionError}
              </p>
            )}

            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex justify-between">
                  <span className="font-bold text-slate-500 uppercase">Customer Claim:</span>
                  <span className="font-black text-slate-900">₹{Number(selectedDispute.amount || 0).toFixed(2)}</span>
                </div>
                <p className="text-slate-800 font-medium leading-relaxed">
                  "{selectedDispute.customer_notes}"
                </p>
                <p className="text-[11px] text-slate-400">Filed by {selectedDispute.customer_email}</p>
              </div>

              {selectedDispute.vendor_reply && (
                <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200/80 space-y-1">
                  <span className="font-bold text-amber-900 uppercase">Merchant Response:</span>
                  <p className="text-slate-800 font-medium leading-relaxed">
                    "{selectedDispute.vendor_reply}"
                  </p>
                </div>
              )}
            </div>

            <form onSubmit={handleResolveSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Resolution Outcome:</label>
                <select
                  value={resolutionStatus}
                  onChange={(e) => setResolutionStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-900"
                >
                  <option value="RESOLVED_REFUNDED">Approve & Issue Programmatic Razorpay Refund</option>
                  <option value="UNDER_REVIEW">Keep Under Review / Request Information</option>
                  <option value="REJECTED">Reject / Dismiss Buyer Claim</option>
                </select>
                {resolutionStatus === 'RESOLVED_REFUNDED' && (
                  <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                    ✓ Programmatic refund of ₹{Number(selectedDispute.amount || 0).toFixed(2)} will be dispatched to original payment method via Razorpay API.
                  </p>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Administrative Notes / Message to Customer:</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explain resolution decision to buyer and merchant..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedDispute(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resolving}
                  className="px-5 py-2 bg-slate-950 hover:bg-slate-800 text-white rounded-xl font-bold shadow-xs disabled:opacity-50"
                >
                  {resolving ? 'Executing Action...' : 'Save Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
