import React, { useState, useEffect } from 'react';
import { DollarSign, Download, ShieldCheck, ArrowRight, TrendingUp } from 'lucide-react';
import { vendorService } from '../../services/api';
import { VendorAnalytics, VendorOrder, unwrapResults } from '../../types';
import { OrderStatusBadge } from '../../components/OrderStatusBadge';
import { VendorSubNav } from '../../components/VendorSubNav';

export const VendorEarningsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<VendorAnalytics | null>(null);
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [aData, oRes] = await Promise.all([
          vendorService.getAnalytics(),
          vendorService.getMyOrders(),
        ]);
        setAnalytics(aData);
        const list = unwrapResults<VendorOrder>(oRes);
        setOrders(list);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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

        <button
          onClick={handleExportCsv}
          disabled={exporting}
          className="px-6 py-3 bg-[#0a0500] hover:bg-neutral-800 text-white font-black uppercase tracking-wider text-xs rounded-full shadow-md flex items-center gap-2 transition disabled:opacity-50 flex-shrink-0"
        >
          <Download className="w-4 h-4 text-[#ffcd05]" />
          <span>{exporting ? 'Generating CSV...' : 'Export Ledger (.CSV)'}</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 shadow-sm space-y-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
            Gross Sales Realized
          </span>
          <span className="text-3xl font-black text-[#0a0500] block">
            ${(analytics?.gross_sales || 0).toFixed(2)}
          </span>
          <span className="text-xs text-slate-500 block">Gross revenue before platform commission</span>
        </div>

        <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 shadow-sm space-y-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
            Platform Commission Fee (10%)
          </span>
          <span className="text-3xl font-black text-rose-600 block">
            -${(analytics?.commission_paid || 0).toFixed(2)}
          </span>
          <span className="text-xs text-slate-500 block">Payment gateway hosting & escrow fees</span>
        </div>

        <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 shadow-sm space-y-2 border-l-4 border-l-emerald-500">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
            Net Vendor Earnings
          </span>
          <span className="text-3xl font-black text-emerald-700 block">
            ${(analytics?.net_earnings || 0).toFixed(2)}
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
                    <td className="py-4 px-5 font-black text-[#0a0500]">${Number(ord.subtotal).toFixed(2)}</td>
                    <td className="py-4 px-5 text-slate-600 font-bold">{Number(ord.commission_rate)}%</td>
                    <td className="py-4 px-5 text-rose-600 font-bold">-${Number(ord.commission_amount).toFixed(2)}</td>
                    <td className="py-4 px-5 font-black text-emerald-700 text-sm">
                      ${Number(ord.net_vendor_amount).toFixed(2)}
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
    </div>
  );
};
