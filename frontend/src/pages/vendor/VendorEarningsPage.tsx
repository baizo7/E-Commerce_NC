import React, { useState, useEffect } from 'react';
import { IndianRupee, Download, ShieldCheck, ArrowRight, TrendingUp, CreditCard, Plus, X, CheckCircle2, Clock } from 'lucide-react';
import { vendorService } from '../../services/api';
import { VendorAnalytics, VendorOrder, PayoutRequest, unwrapResults } from '../../types';
import { OrderStatusBadge } from '../../components/OrderStatusBadge';
import { VendorSubNav } from '../../components/VendorSubNav';

export const VendorEarningsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<VendorAnalytics | null>(null);
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Request Payout Modal State
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutNotes, setPayoutNotes] = useState('');
  const [requestingPayout, setRequestingPayout] = useState(false);
  const [payoutSuccess, setPayoutSuccess] = useState<string | null>(null);
  const [payoutError, setPayoutError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [aData, oRes, pData] = await Promise.all([
        vendorService.getAnalytics(),
        vendorService.getMyOrders(),
        vendorService.getPayoutRequests().catch(() => []),
      ]);
      setAnalytics(aData);
      const list = unwrapResults<VendorOrder>(oRes);
      setOrders(list);
      setPayoutRequests(pData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(payoutAmount);
    if (!amountNum || amountNum <= 0) return;
    try {
      setRequestingPayout(true);
      setPayoutError(null);
      await vendorService.requestPayout({
        amount: amountNum,
        notes: payoutNotes,
      });
      setPayoutSuccess(`Payout request for ₹${amountNum.toFixed(2)} submitted successfully.`);
      setIsPayoutModalOpen(false);
      setPayoutAmount('');
      setPayoutNotes('');
      await fetchData();
    } catch (err: any) {
      setPayoutError(err.response?.data?.error || 'Failed to submit payout request.');
    } finally {
      setRequestingPayout(false);
    }
  };

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/v1/vendor/export-csv/', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to export CSV');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vendor_settlement_ledger_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
      alert('Failed to download CSV export. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="h-14 bg-slate-200 rounded-2xl"></div>
        <div className="h-64 bg-slate-200 rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <VendorSubNav />

      {/* Header Banner */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-black uppercase tracking-widest text-[#fcb424]">Financial Settlements</span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0a0500] uppercase tracking-tight mt-1">
            Financial & Payout Ledger
          </h1>
          <p className="text-xs text-[#504e4a] mt-1 font-medium">
            Real-time accounting of customer payments, platform commission deductions, and net payouts available for disbursement.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setPayoutError(null);
              setIsPayoutModalOpen(true);
            }}
            className="px-6 py-3 bg-[#ffcd05] hover:bg-[#fcb424] text-[#0a0500] font-black uppercase tracking-wider text-xs rounded-full shadow-md hover:shadow-lg flex items-center gap-2 transition flex-shrink-0"
          >
            <CreditCard className="w-4 h-4 text-[#0a0500]" />
            Request Payout
          </button>

          <button
            onClick={handleExportCsv}
            disabled={exporting}
            className="px-6 py-3 bg-[#0a0500] hover:bg-neutral-800 text-white font-black uppercase tracking-wider text-xs rounded-full shadow-md flex items-center gap-2 transition disabled:opacity-50 flex-shrink-0"
          >
            <Download className="w-4 h-4 text-[#ffcd05]" />
            <span>{exporting ? 'Generating CSV...' : 'Export Ledger (.CSV)'}</span>
          </button>
        </div>
      </div>

      {payoutSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{payoutSuccess}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 shadow-sm space-y-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
            Gross Sales Realized
          </span>
          <span className="text-3xl font-black text-[#0a0500] block">
            ₹{(analytics?.gross_sales || 0).toFixed(2)}
          </span>
          <span className="text-xs text-slate-500 block">Gross revenue before platform commission</span>
        </div>

        <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 shadow-sm space-y-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
            Platform Commission Fee (10%)
          </span>
          <span className="text-3xl font-black text-rose-600 block">
            -₹{(analytics?.commission_paid || 0).toFixed(2)}
          </span>
          <span className="text-xs text-slate-500 block">Payment gateway hosting & escrow fees</span>
        </div>

        <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 shadow-sm space-y-2 border-l-4 border-l-emerald-500">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
            Net Vendor Earnings
          </span>
          <span className="text-3xl font-black text-emerald-700 block">
            ₹{(analytics?.net_earnings || 0).toFixed(2)}
          </span>
          <span className="text-xs text-slate-500 block">Available for bank ACH / Wire transfer</span>
        </div>
      </div>

      {/* Itemized Sub-Order Ledger Table */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
          <h2 className="font-black text-[#0a0500] uppercase text-xs tracking-wider">
            Disbursement & Settlement History
          </h2>
          <span className="text-xs font-bold text-slate-500">{orders.length} Package Transactions</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 text-[#0a0500] uppercase font-black tracking-wider text-[11px] border-b border-neutral-200">
              <tr>
                <th className="py-4 px-5">Date</th>
                <th className="py-4 px-5">Order Ref</th>
                <th className="py-4 px-5">Customer Email</th>
                <th className="py-4 px-5">Gross Sale</th>
                <th className="py-4 px-5">Commission Rate</th>
                <th className="py-4 px-5">Commission Fee</th>
                <th className="py-4 px-5 font-black text-emerald-700">Net Vendor Payout</th>
                <th className="py-4 px-5">Fulfillment Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-slate-400">
                    No transaction records in this ledger yet.
                  </td>
                </tr>
              ) : (
                orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-neutral-50/70 transition">
                    <td className="py-4 px-5 text-slate-500 font-medium">
                      {new Date(ord.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-5 font-mono font-bold text-[#0a0500]">
                      #{ord.order_number}
                    </td>
                    <td className="py-4 px-5 text-[#504e4a] truncate max-w-xs">{ord.customer_email}</td>
                    <td className="py-4 px-5 font-black text-[#0a0500]">₹{Number(ord.subtotal).toFixed(2)}</td>
                    <td className="py-4 px-5 text-slate-600 font-bold">{Number(ord.commission_rate)}%</td>
                    <td className="py-4 px-5 text-rose-600 font-bold">-₹{Number(ord.commission_amount).toFixed(2)}</td>
                    <td className="py-4 px-5 font-black text-emerald-700 text-sm">
                      ₹{Number(ord.net_vendor_amount).toFixed(2)}
                    </td>
                    <td className="py-4 px-5">
                      <OrderStatusBadge status={ord.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payout Requests History Section */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
          <h2 className="font-black text-[#0a0500] uppercase text-xs tracking-wider">
            Withdrawal & Payout Requests ({payoutRequests.length})
          </h2>
          <span className="text-xs text-slate-500 font-medium">Platform Escrow Disbursements</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 text-[#0a0500] uppercase font-black tracking-wider text-[11px] border-b border-neutral-200">
              <tr>
                <th className="py-4 px-5">Requested Date</th>
                <th className="py-4 px-5">Withdrawal Amount</th>
                <th className="py-4 px-5">Status</th>
                <th className="py-4 px-5">Processed Date</th>
                <th className="py-4 px-5">Notes / Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {payoutRequests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-xs text-slate-400">
                    No payout requests submitted yet. Click "Request Payout" above to initiate a disbursement.
                  </td>
                </tr>
              ) : (
                payoutRequests.map((pr) => (
                  <tr key={pr.id} className="hover:bg-neutral-50/70 transition">
                    <td className="py-4 px-5 text-slate-500 font-medium">
                      {new Date(pr.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-5 font-black text-slate-950 text-sm">
                      ₹{Number(pr.amount).toFixed(2)}
                    </td>
                    <td className="py-4 px-5">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          pr.status === 'PROCESSED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : pr.status === 'APPROVED'
                            ? 'bg-blue-100 text-blue-800'
                            : pr.status === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {pr.status}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-slate-500">
                      {pr.processed_at ? new Date(pr.processed_at).toLocaleString() : '—'}
                    </td>
                    <td className="py-4 px-5 text-slate-600 truncate max-w-xs">
                      {pr.admin_notes || pr.notes || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Request Payout Modal */}
      {isPayoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-amber-500" />
                Request Merchant Payout
              </h3>
              <button
                onClick={() => setIsPayoutModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {payoutError && (
              <p className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {payoutError}
              </p>
            )}

            <form onSubmit={handleRequestPayout} className="space-y-4 text-xs">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <span className="text-[11px] font-bold text-slate-500 block uppercase">Available Net Earnings:</span>
                <span className="text-2xl font-black text-emerald-700 block">
                  ₹{(analytics?.net_earnings || 0).toFixed(2)}
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Withdrawal Amount (₹):</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  max={analytics?.net_earnings || 999999}
                  required
                  placeholder="e.g. 500.00"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-950 focus:bg-white text-sm font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notes / Bank Transfer Instructions:</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Please disburse to verified bank account ending in 1234"
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPayoutModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={requestingPayout || !payoutAmount}
                  className="px-5 py-2 bg-slate-950 hover:bg-slate-800 text-white rounded-xl font-bold shadow-xs disabled:opacity-50"
                >
                  {requestingPayout ? 'Submitting Request...' : 'Submit Withdrawal Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
