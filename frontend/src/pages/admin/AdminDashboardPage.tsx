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
  AlertTriangle,
  BarChart3,
  Trophy,
  FolderTree,
  FileSpreadsheet,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { adminService } from '../../services/api';
import { AdminAnalytics } from '../../types';
import { OrderStatusBadge } from '../../components/OrderStatusBadge';
import { AdminSubNav } from '../../components/AdminSubNav';

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
      <div className="max-w-7xl mx-auto space-y-6 py-6 animate-pulse">
        <div className="h-16 bg-slate-200 rounded-2xl"></div>
        <div className="h-44 bg-slate-200 rounded-3xl"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  const pendingMerchants = analytics?.pending_vendors || 0;
  const pendingProducts = analytics?.pending_products || 0;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <AdminSubNav />

      {/* Urgent Action Queue Banner */}
      {(pendingMerchants > 0 || pendingProducts > 0) && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex flex-wrap items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#ffcd05] text-[#0a0500] flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <span className="font-black text-[#0a0500] uppercase text-[11px] block">
                Administrative Moderation Queue
              </span>
              <span>
                You have {pendingMerchants > 0 && <strong>{pendingMerchants} merchant application{pendingMerchants > 1 ? 's' : ''}</strong>}
                {pendingMerchants > 0 && pendingProducts > 0 && ' and '}
                {pendingProducts > 0 && <strong>{pendingProducts} catalog product{pendingProducts > 1 ? 's' : ''}</strong>} awaiting quality review.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {pendingMerchants > 0 && (
              <Link
                to="/admin/vendors"
                className="px-4 py-2 bg-[#0a0500] text-white hover:bg-neutral-800 text-[11px] font-black uppercase tracking-wider rounded-full shadow-xs transition"
              >
                Review Merchants &rarr;
              </Link>
            )}
            {pendingProducts > 0 && (
              <Link
                to="/admin/products"
                className="px-4 py-2 bg-[#ffcd05] text-[#0a0500] hover:bg-[#fcb424] text-[11px] font-black uppercase tracking-wider rounded-full shadow-xs transition"
              >
                Moderate Catalog &rarr;
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Executive Command Header Card */}
      <div className="bg-[#0a0500] text-white rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="absolute right-0 top-0 w-96 h-96 bg-[#ffcd05]/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="space-y-2.5 relative z-10 max-w-2xl">
          <div className="flex items-center gap-2.5">
            <span className="px-3 py-0.5 rounded-full bg-[#ffcd05] text-[#0a0500] text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-[#0a0500]" />
              Platform Command Center
            </span>
            <span className="text-neutral-400 text-xs font-semibold">
              Live Production Operations
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white leading-tight">
            Marketplace Administration
          </h1>
          <p className="text-xs text-neutral-300 leading-relaxed">
            Audit multi-vendor gross merchandise value, manage tiered merchant fee structures, approve autonomous catalog listings, and disburse platform settlement funds.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <Link
            to="/admin/vendors"
            className="px-6 py-3.5 bg-[#ffcd05] hover:bg-[#fcb424] text-[#0a0500] font-black uppercase tracking-wider text-xs rounded-full shadow-md hover:shadow-lg transition flex items-center gap-2"
          >
            <Store className="w-4 h-4 text-[#0a0500]" />
            <span>Merchants ({analytics?.approved_vendors || 0})</span>
          </Link>

          <a
            href={adminService.exportLedgerCsvUrl()}
            download
            className="px-6 py-3.5 bg-neutral-800 hover:bg-neutral-700 text-white font-bold uppercase tracking-wider text-xs rounded-full border border-neutral-700 transition flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#ffcd05]" />
            <span>Export Financial Ledger</span>
          </a>
        </div>
      </div>

      {/* 4 KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total GMV */}
        <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-[#0a0500] flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">Gross Platform GMV</span>
            <span className="text-2xl font-black text-[#0a0500] mt-0.5 block">
              ${(analytics?.total_gmv || 0).toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Customer checkout volume</span>
          </div>
        </div>

        {/* Platform Commission Earned */}
        <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">Platform Commission</span>
            <span className="text-2xl font-black text-emerald-700 mt-0.5 block">
              ${(analytics?.total_commission || 0).toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Net platform revenue</span>
          </div>
        </div>

        {/* Registered Merchants */}
        <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">Active Merchants</span>
            <span className="text-2xl font-black text-[#0a0500] mt-0.5 block">
              {analytics?.approved_vendors || 0}
            </span>
            <span className="text-[10px] text-amber-600 font-bold">
              {analytics?.pending_vendors || 0} pending review
            </span>
          </div>
        </div>

        {/* Total Orders Processed */}
        <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center flex-shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">Orders Processed</span>
            <span className="text-2xl font-black text-[#0a0500] mt-0.5 block">
              {analytics?.total_orders || 0}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              {analytics?.total_customers || 0} buyers cataloged
            </span>
          </div>
        </div>
      </div>

      {/* Analytics Insights: 7-Day Performance Velocity Curve & Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day GMV & Commission Velocity Curve */}
        <div className="lg:col-span-2 bg-white border border-neutral-200/90 rounded-2xl p-6 sm:p-7 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-[#fcb424] flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#fcb424]">Marketplace Velocity</span>
                <h2 className="text-sm font-black text-[#0a0500] uppercase tracking-tight">
                  7-Day Platform GMV & Revenue Trajectory
                </h2>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-neutral-100 text-[10px] font-black uppercase tracking-wider text-[#504e4a]">
              Real-Time Platform Data
            </span>
          </div>

          {/* Bar Chart Visualization */}
          {analytics?.daily_trends && analytics.daily_trends.length > 0 ? (
            <div className="space-y-4">
              <div className="h-48 flex items-end justify-between gap-2 sm:gap-4 pt-6 px-2 border-b border-neutral-100">
                {(() => {
                  const maxGmv = Math.max(...analytics.daily_trends.map(d => d.gmv), 50);
                  return analytics.daily_trends.map((day, idx) => {
                    const heightPercent = Math.max(Math.round((day.gmv / maxGmv) * 100), 10);
                    const isToday = idx === analytics.daily_trends!.length - 1;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                        {/* Hover Tooltip */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-[#0a0500] text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap pointer-events-none mb-1 z-20">
                          GMV: ${day.gmv.toFixed(2)} | Fee: ${day.commission.toFixed(2)} ({day.orders_count} ord)
                        </div>

                        {/* Bar */}
                        <div className="w-full max-w-[42px] bg-neutral-100 rounded-t-xl overflow-hidden flex flex-col justify-end h-full">
                          <div
                            style={{ height: `${heightPercent}%` }}
                            className={`w-full rounded-t-xl transition-all duration-500 ${
                              isToday
                                ? 'bg-gradient-to-t from-[#0a0500] to-[#fcb424]'
                                : 'bg-gradient-to-t from-neutral-300 to-[#ffcd05] group-hover:from-neutral-800 group-hover:to-[#ffcd05]'
                            }`}
                          ></div>
                        </div>

                        {/* Date Label */}
                        <span className={`text-[10px] font-black tracking-wider uppercase truncate ${
                          isToday ? 'text-[#0a0500]' : 'text-slate-400'
                        }`}>
                          {day.short_date}
                        </span>
                      </div>
                    );
                  });
                })()}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#504e4a] pt-1">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#0a0500]"></span>
                    <span className="font-bold text-[#0a0500]">Gross Platform Volume</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#ffcd05]"></span>
                    <span className="font-bold text-[#0a0500]">Commission Split</span>
                  </div>
                </div>
                <span>Hover over bars for daily transaction breakdowns</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-[#504e4a] text-xs">
              Performance curve will calibrate automatically as transactions process.
            </div>
          )}
        </div>

        {/* Top Performing Vendors Leaderboard */}
        <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 sm:p-7 shadow-sm space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-[#fcb424] flex items-center justify-center">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#fcb424]">Top Merchants</span>
                  <h2 className="text-sm font-black text-[#0a0500] uppercase tracking-tight">
                    Merchant Leaderboard
                  </h2>
                </div>
              </div>
              <Link
                to="/admin/vendors"
                className="text-[10px] font-black uppercase tracking-wider text-[#0a0500] hover:text-[#fcb424]"
              >
                All &rarr;
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {analytics?.top_vendors && analytics.top_vendors.length > 0 ? (
                analytics.top_vendors.map((v, idx) => (
                  <div key={v.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100/80 transition">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 ${
                        idx === 0 ? 'bg-[#ffcd05] text-[#0a0500]' : 'bg-neutral-200 text-slate-600'
                      }`}>
                        #{idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#0a0500] truncate">{v.store_name}</p>
                        <p className="text-[10px] text-slate-400 font-medium">Rating: {Number(v.rating).toFixed(1)} &middot; {v.status}</p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-[#0a0500] whitespace-nowrap">
                      ${v.total_sales.toFixed(2)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-[#504e4a] text-xs">
                  No vendor sales recorded yet.
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Ranked by gross sales</span>
            <span className="font-bold text-[#0a0500]">{analytics?.total_vendors || 0} Total Merchants</span>
          </div>
        </div>
      </div>

      {/* Category Breakdown & Recent Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Architecture Distribution */}
        <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 sm:p-7 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-[#fcb424]" />
              <h2 className="text-sm font-black text-[#0a0500] uppercase tracking-tight">
                Taxonomy Distribution
              </h2>
            </div>
            <Link to="/admin/categories" className="text-[10px] font-black uppercase text-[#0a0500] hover:text-[#fcb424]">
              Manage &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {analytics?.category_distribution && analytics.category_distribution.length > 0 ? (
              analytics.category_distribution.map((c) => (
                <div key={c.id} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-neutral-50">
                  <span className="font-bold text-[#0a0500]">{c.name}</span>
                  <span className="px-2 py-0.5 rounded-full bg-white border border-neutral-200 text-[10px] font-black text-[#504e4a]">
                    {c.product_count} Items
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-xs text-slate-400">No categories cataloged yet.</div>
            )}
          </div>
        </div>

        {/* Recent Transactions Table */}
        <div className="lg:col-span-2 bg-white border border-neutral-200/90 rounded-2xl p-6 sm:p-7 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#fcb424]" />
              <h2 className="text-sm font-black text-[#0a0500] uppercase tracking-tight">
                Recent Global Platform Transactions
              </h2>
            </div>
            <Link
              to="/admin/orders"
              className="text-xs font-black uppercase tracking-wider text-[#0a0500] hover:text-[#fcb424] flex items-center gap-1"
            >
              <span>All Orders</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {analytics?.recent_orders && analytics.recent_orders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 text-[#0a0500] uppercase font-black tracking-wider text-[10px] border-y border-neutral-200">
                  <tr>
                    <th className="py-2.5 px-3">Order Ref</th>
                    <th className="py-2.5 px-3">Customer Email</th>
                    <th className="py-2.5 px-3">Total Amount</th>
                    <th className="py-2.5 px-3">Payment</th>
                    <th className="py-2.5 px-3">Fulfillment</th>
                    <th className="py-2.5 px-3 text-right">Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {analytics.recent_orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-neutral-50/70 transition">
                      <td className="py-3 px-3 font-mono font-bold text-[#0a0500]">
                        #{ord.order_number}
                      </td>
                      <td className="py-3 px-3 text-[#504e4a] truncate max-w-[150px]">{ord.customer_email}</td>
                      <td className="py-3 px-3 font-black text-[#0a0500]">${ord.grand_total.toFixed(2)}</td>
                      <td className="py-3 px-3">
                        <OrderStatusBadge status={ord.payment_status} />
                      </td>
                      <td className="py-3 px-3">
                        <OrderStatusBadge status={ord.status} />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link
                          to="/admin/orders"
                          className="px-3 py-1 text-[11px] font-black uppercase tracking-wider bg-neutral-100 hover:bg-[#ffcd05] text-[#0a0500] rounded-full transition"
                        >
                          Audit &rarr;
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-slate-400">No platform orders placed yet.</div>
          )}
        </div>
      </div>
    </div>
  );
};
