import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  Package,
  Clock,
  AlertTriangle,
  Plus,
  Store,
  Star,
  ArrowRight,
  TrendingUp,
  Percent
} from 'lucide-react';
import { vendorService } from '../../services/api';
import { VendorAnalytics } from '../../types';
import { VendorProductModal } from './VendorProductModal';
import { OrderStatusBadge } from '../../components/OrderStatusBadge';

export const VendorDashboardPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<VendorAnalytics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const fetchAnalytics = async () => {
    try {
      const data = await vendorService.getAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 py-6 animate-pulse">
        <div className="h-20 bg-slate-200 rounded-3xl"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Vendor Store Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
              Vendor Management Portal
            </span>
            <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>{Number(analytics?.rating || 5.0).toFixed(1)} Rating</span>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {analytics?.store_name || 'Vendor Store'}
          </h1>
          <p className="text-xs text-slate-400 max-w-lg">
            Manage your autonomous product listings, review real-time buyer order splits, track shipments, and review net payouts.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
          <Link
            to="/vendor/orders"
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl border border-white/20 backdrop-blur-sm transition"
          >
            Fulfill Orders
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Gross Sales */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold block">Gross Sales</span>
            <span className="text-2xl font-black text-slate-900 mt-0.5 block">
              ${(analytics?.gross_sales || 0).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Net Vendor Payout */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold block">Net Payout (After Fee)</span>
            <span className="text-2xl font-black text-emerald-600 mt-0.5 block">
              ${(analytics?.net_earnings || 0).toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-400">
              Fee paid: ${(analytics?.commission_paid || 0).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Pending Shipments */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold block">Pending Fulfillment</span>
            <span className="text-2xl font-black text-slate-900 mt-0.5 block">
              {analytics?.pending_fulfillment || 0}
            </span>
            <span className="text-[10px] text-slate-400">
              {analytics?.total_orders || 0} total sub-orders
            </span>
          </div>
        </div>

        {/* Product Inventory Status */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold block">Low / Out of Stock</span>
            <span className="text-2xl font-black text-slate-900 mt-0.5 block">
              {(analytics?.low_stock_count || 0) + (analytics?.out_of_stock_count || 0)}
            </span>
            <span className="text-[10px] text-slate-400">
              {analytics?.total_products || 0} active catalog items
            </span>
          </div>
        </div>
      </div>

      {/* Quick Navigation Tabs for Vendor */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
        <Link
          to="/vendor/dashboard"
          className="px-4 py-2 bg-indigo-50 text-indigo-700 font-bold rounded-xl text-xs"
        >
          Overview & Metrics
        </Link>
        <Link
          to="/vendor/products"
          className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-semibold rounded-xl text-xs transition"
        >
          Product Catalog ({analytics?.total_products || 0})
        </Link>
        <Link
          to="/vendor/orders"
          className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-semibold rounded-xl text-xs transition"
        >
          Customer Shipments ({analytics?.pending_fulfillment || 0} pending)
        </Link>
        <Link
          to="/vendor/earnings"
          className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-semibold rounded-xl text-xs transition"
        >
          Payouts & Ledger
        </Link>
      </div>

      {/* Recent Orders Section */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Recent Customer Sub-Orders</h2>
          <Link to="/vendor/orders" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
            All Orders <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {analytics?.recent_orders && analytics.recent_orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-y border-slate-100">
                <tr>
                  <th className="py-3 px-4">Parent Order</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Gross Subtotal</th>
                  <th className="py-3 px-4">Your Net Payout</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {analytics.recent_orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {ord.order_number}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{ord.customer_email}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">${ord.subtotal.toFixed(2)}</td>
                    <td className="py-3 px-4 font-bold text-emerald-600">${ord.net_amount.toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <OrderStatusBadge status={ord.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to="/vendor/orders"
                        className="px-2.5 py-1 text-[11px] font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                      >
                        Fulfill &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400 text-xs">
            No recent orders allocated to this vendor yet.
          </div>
        )}
      </div>

      {/* Modal */}
      <VendorProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          fetchAnalytics();
        }}
      />
    </div>
  );
};
