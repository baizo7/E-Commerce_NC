import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  TrendingUp,
  Store,
  Users,
  Package,
  DollarSign,
  ArrowRight,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { adminService } from '../../services/api';
import { AdminAnalytics } from '../../types';
import { OrderStatusBadge } from '../../components/OrderStatusBadge';

export const AdminDashboardPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await adminService.getAnalytics();
        setAnalytics(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 py-6 animate-pulse">
        <div className="h-24 bg-slate-200 rounded-3xl"></div>
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
      {/* Admin Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            Marketplace Command Center
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Platform Administration
          </h1>
          <p className="text-xs text-slate-400 max-w-xl">
            Audit gross platform transaction volumes, moderate merchant onboarding, oversee catalog quality, and monitor platform commission revenues.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/vendors"
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-sm transition"
          >
            Moderate Vendors ({analytics?.pending_vendors || 0} Pending)
          </Link>
          <Link
            to="/admin/products"
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl border border-white/20 transition"
          >
            Review Products
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total GMV */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold block">Gross Merchandise Value (GMV)</span>
            <span className="text-2xl font-black text-slate-900 mt-0.5 block">
              ${(analytics?.total_gmv || 0).toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-400">Total customer spend</span>
          </div>
        </div>

        {/* Platform Commission Revenue */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold block">Platform Commission Earned</span>
            <span className="text-2xl font-black text-emerald-600 mt-0.5 block">
              ${(analytics?.total_commission || 0).toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-400">Net platform revenue</span>
          </div>
        </div>

        {/* Registered Vendors */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold block">Active Merchants</span>
            <span className="text-2xl font-black text-slate-900 mt-0.5 block">
              {analytics?.approved_vendors || 0}
            </span>
            <span className="text-[10px] text-amber-600 font-semibold">
              {analytics?.pending_vendors || 0} pending applications
            </span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-semibold block">Total Orders Processed</span>
            <span className="text-2xl font-black text-slate-900 mt-0.5 block">
              {analytics?.total_orders || 0}
            </span>
            <span className="text-[10px] text-slate-400">
              {analytics?.total_customers || 0} registered buyers
            </span>
          </div>
        </div>
      </div>

      {/* Admin Subnav */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
        <Link
          to="/admin/dashboard"
          className="px-4 py-2 bg-indigo-50 text-indigo-700 font-bold rounded-xl text-xs"
        >
          Executive Overview
        </Link>
        <Link
          to="/admin/vendors"
          className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-semibold rounded-xl text-xs transition"
        >
          Vendor Approvals
        </Link>
        <Link
          to="/admin/products"
          className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-semibold rounded-xl text-xs transition"
        >
          Catalog Moderation
        </Link>
        <Link
          to="/admin/categories"
          className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-semibold rounded-xl text-xs transition"
        >
          Category Architecture
        </Link>
        <Link
          to="/admin/orders"
          className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-semibold rounded-xl text-xs transition"
        >
          Global Orders Audit
        </Link>
      </div>

      {/* Top Performing Vendors & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Vendors */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900 text-sm">Top Performing Vendors by GMV</h2>
            <Link to="/admin/vendors" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
              Manage All &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {analytics?.top_vendors && analytics.top_vendors.length > 0 ? (
              analytics.top_vendors.map((v, idx) => (
                <div
                  key={v.id}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[11px]">
                      #{idx + 1}
                    </span>
                    <div>
                      <span className="font-bold text-slate-900 block">{v.store_name}</span>
                      <span className="text-slate-400">Rating: {Number(v.rating).toFixed(1)} &middot; {v.status}</span>
                    </div>
                  </div>
                  <span className="font-black text-slate-900 text-sm">${Number(v.total_sales).toFixed(2)}</span>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs">No vendor sales recorded yet.</div>
            )}
          </div>
        </div>

        {/* Recent Platform Orders */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900 text-sm">Recent Platform Transactions</h2>
            <Link to="/admin/orders" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
              All Orders &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {analytics?.recent_orders && analytics.recent_orders.length > 0 ? (
              analytics.recent_orders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-mono font-bold text-slate-900 block">{ord.order_number}</span>
                    <span className="text-slate-500 truncate max-w-xs block">{ord.customer_email}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-slate-900 block">${ord.grand_total.toFixed(2)}</span>
                    <OrderStatusBadge status={ord.status} />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs">No orders placed yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
