import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, TrendingUp, Percent, ArrowLeft, Download, ShieldCheck } from 'lucide-react';
import { vendorService } from '../../services/api';
import { VendorAnalytics, VendorOrder } from '../../types';
import { OrderStatusBadge } from '../../components/OrderStatusBadge';

export const VendorEarningsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<VendorAnalytics | null>(null);
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [aData, oRes] = await Promise.all([
          vendorService.getAnalytics(),
          vendorService.getMyOrders(),
        ]);
        setAnalytics(aData);
        const list = (oRes as any).results || oRes;
        setOrders(list);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-400">Loading payout ledger...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/vendor/dashboard" className="hover:text-indigo-600 flex items-center gap-1 font-semibold">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Vendor Dashboard
        </Link>
      </div>

      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Financial & Payout Ledger</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time audit of gross sales receipts, marketplace commission fee deductions, and net vendor payouts.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold block">Gross Sales Realized</span>
          <span className="text-3xl font-black text-slate-900 mt-1 block">
            ${(analytics?.gross_sales || 0).toFixed(2)}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">Customer gross payments</span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold block">Platform Commission Fee (10-12%)</span>
          <span className="text-3xl font-black text-rose-600 mt-1 block">
            -${(analytics?.commission_paid || 0).toFixed(2)}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">Hosting, payment escrow & support</span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm">
          <span className="text-xs text-slate-500 font-semibold block">Net Vendor Payout (Earned)</span>
          <span className="text-3xl font-black text-emerald-600 mt-1 block">
            ${(analytics?.net_earnings || 0).toFixed(2)}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">Available for ACH / Direct bank transfer</span>
        </div>
      </div>

      {/* Itemized Sub-Order Ledger Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-900 text-sm">Disbursement & Settlement History</h2>
          <span className="text-xs text-slate-500">{orders.length} Transaction Records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Order Ref</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Gross Sale</th>
                <th className="py-3 px-4">Commission Rate</th>
                <th className="py-3 px-4">Commission Fee</th>
                <th className="py-3 px-4 font-bold text-emerald-700">Net Vendor Payout</th>
                <th className="py-3 px-4">Fulfillment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((ord) => (
                <tr key={ord.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3 px-4 text-slate-500">
                    {new Date(ord.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    {ord.order_number}
                  </td>
                  <td className="py-3 px-4 text-slate-600 truncate max-w-xs">{ord.customer_email}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">${Number(ord.subtotal).toFixed(2)}</td>
                  <td className="py-3 px-4 text-slate-600">{Number(ord.commission_rate)}%</td>
                  <td className="py-3 px-4 text-rose-600 font-medium">-${Number(ord.commission_amount).toFixed(2)}</td>
                  <td className="py-3 px-4 font-extrabold text-emerald-600 text-sm">
                    ${Number(ord.net_vendor_amount).toFixed(2)}
                  </td>
                  <td className="py-3 px-4">
                    <OrderStatusBadge status={ord.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
