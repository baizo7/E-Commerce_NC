import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  Package,
  Clock,
  AlertTriangle,
  Plus,
  Star,
  ArrowRight,
  TrendingUp,
  Settings,
  ShieldCheck,
  BarChart3,
  Trophy,
  ShoppingBag,
  Store
} from 'lucide-react';
import { vendorService } from '../../services/api';
import { VendorAnalytics } from '../../types';
import { VendorProductModal } from './VendorProductModal';
import { OrderStatusBadge } from '../../components/OrderStatusBadge';
import { VendorSubNav } from '../../components/VendorSubNav';
import { useAuth } from '../../context/AuthContext';

export const VendorDashboardPage: React.FC = () => {
  const { user, isVendor, refreshUser } = useAuth();
  const [analytics, setAnalytics] = useState<VendorAnalytics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [activating, setActivating] = useState<boolean>(false);

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
    if (isVendor) {
      fetchAnalytics();
    } else {
      setLoading(false);
    }
  }, [isVendor]);

  const handleActivateStore = async () => {
    setActivating(true);
    try {
      await vendorService.activateStore();
      await refreshUser();
      await fetchAnalytics();
    } catch (err) {
      console.error(err);
    } finally {
      setActivating(false);
    }
  };

  if (!isVendor) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 space-y-8">
        <div className="bg-[#0a0500] text-white rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-[#ffcd05] text-[#0a0500] flex items-center justify-center mx-auto shadow-lg">
            <Store className="w-8 h-8" />
          </div>
          <div className="space-y-2 max-w-xl mx-auto">
            <span className="text-xs font-black uppercase tracking-widest text-[#fcb424] block">Merchant Network</span>
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white">
              Launch Your Merchant Storefront
            </h1>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Join our certified collective of independent makers, ateliers, and technical brands. Fulfill customer orders with verified escrow protection, upload local product photos, and receive bank disbursements.
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleActivateStore}
              disabled={activating}
              className="px-8 py-4 bg-[#ffcd05] hover:bg-[#fcb424] text-[#0a0500] font-black uppercase tracking-wider text-xs rounded-full shadow-lg transition flex items-center gap-2 disabled:opacity-50"
            >
              <Store className="w-4 h-4 text-[#0a0500]" />
              <span>{activating ? 'Provisioning Storefront...' : 'Activate Storefront in 1-Click'}</span>
            </button>
            <Link
              to="/vendors"
              className="px-8 py-4 bg-neutral-800 hover:bg-neutral-700 text-white font-bold uppercase tracking-wider text-xs rounded-full border border-neutral-700 transition"
            >
              Browse Active Merchants
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 py-6 animate-pulse">
        <div className="h-14 bg-slate-200 rounded-2xl"></div>
        <div className="h-48 bg-slate-200 rounded-3xl"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  const lowStockCount = (analytics?.low_stock_count || 0) + (analytics?.out_of_stock_count || 0);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <VendorSubNav />

      {/* Low Stock Urgent Alert Banner */}
      {lowStockCount > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex flex-wrap items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-[#fcb424] flex-shrink-0" />
            <span>
              <strong>Inventory Warning:</strong> You have {lowStockCount} product{lowStockCount > 1 ? 's' : ''} either low in stock or sold out in your warehouse.
            </span>
          </div>
          <Link
            to="/vendor/products"
            className="text-[#0a0500] hover:underline font-black uppercase tracking-wider text-[11px] flex items-center gap-1"
          >
            <span>Restock Inventory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Vendor Store Header Card */}
      <div className="bg-[#0a0500] text-white rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="absolute right-0 top-0 w-80 h-80 bg-[#ffcd05]/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="space-y-2.5 relative z-10 max-w-xl">
          <div className="flex items-center gap-2.5">
            <span className="px-3 py-0.5 rounded-full bg-[#ffcd05] text-[#0a0500] text-[10px] font-black uppercase tracking-wider shadow-sm">
              Verified Merchant Portal
            </span>
            <div className="flex items-center gap-1 text-[#ffcd05] text-xs font-bold">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>{Number(analytics?.rating || 5.0).toFixed(1)} Rating</span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white leading-tight">
            {analytics?.store_name || 'Vendor Store'}
          </h1>
          <p className="text-xs text-neutral-300 leading-relaxed">
            Manage your autonomous catalog, upload local high-res product photos, assign parcel tracking, and review net bank disbursements.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3.5 bg-[#ffcd05] hover:bg-[#fcb424] text-[#0a0500] font-black uppercase tracking-wider text-xs rounded-full shadow-md hover:shadow-lg flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4 text-[#0a0500]" />
            <span>List Product</span>
          </button>

          <Link
            to="/vendor/orders"
            className="px-6 py-3.5 bg-neutral-800 hover:bg-neutral-700 text-white font-bold uppercase tracking-wider text-xs rounded-full border border-neutral-700 transition"
          >
            Fulfill Orders
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Gross Sales */}
        <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-[#0a0500] flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">Gross Sales</span>
            <span className="text-2xl font-black text-[#0a0500] mt-0.5 block">
              ${(analytics?.gross_sales || 0).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Net Vendor Payout */}
        <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">Net Payouts</span>
            <span className="text-2xl font-black text-emerald-700 mt-0.5 block">
              ${(analytics?.net_earnings || 0).toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              Commission: ${(analytics?.commission_paid || 0).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Pending Shipments */}
        <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">Pending Dispatch</span>
            <span className="text-2xl font-black text-[#0a0500] mt-0.5 block">
              {analytics?.pending_fulfillment || 0}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              {analytics?.total_orders || 0} total packages
            </span>
          </div>
        </div>

        {/* Product Inventory Status */}
        <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">Low / Out of Stock</span>
            <span className="text-2xl font-black text-rose-700 mt-0.5 block">
              {lowStockCount}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              {analytics?.total_products || 0} active catalog items
            </span>
          </div>
        </div>
      </div>

      {/* Analytics Insights & Leaderboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Performance Curve */}
        <div className="lg:col-span-2 bg-white border border-neutral-200/90 rounded-2xl p-6 sm:p-7 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-[#fcb424] flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#fcb424]">Visual Velocity</span>
                <h2 className="text-sm font-black text-[#0a0500] uppercase tracking-tight">
                  7-Day Sales & Order Trajectory
                </h2>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-neutral-100 text-[10px] font-black uppercase tracking-wider text-[#504e4a]">
              Real-Time
            </span>
          </div>

          {/* Bar Chart Visualization */}
          {analytics?.daily_trends && analytics.daily_trends.length > 0 ? (
            <div className="space-y-4">
              <div className="h-44 flex items-end justify-between gap-2 sm:gap-4 pt-6 px-2 border-b border-neutral-100">
                {(() => {
                  const maxRev = Math.max(...analytics.daily_trends.map(d => d.revenue), 10);
                  return analytics.daily_trends.map((day, idx) => {
                    const heightPercent = Math.max(Math.round((day.revenue / maxRev) * 100), 12);
                    const isToday = idx === analytics.daily_trends!.length - 1;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                        {/* Hover Tooltip */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-[#0a0500] text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap pointer-events-none mb-1">
                          ${day.revenue.toFixed(2)} ({day.order_count} ord)
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

              <div className="flex items-center justify-between text-[11px] text-[#504e4a] pt-1">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#ffcd05]"></span>
                  <span className="font-bold text-[#0a0500]">Net Settled Payouts</span>
                </div>
                <span>Hover over bars for package quantities and revenue breakdown</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-[#504e4a] text-xs">
              Performance curve will calibrate automatically as transactions process.
            </div>
          )}
        </div>

        {/* Top Performing Catalog Items Leaderboard */}
        <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 sm:p-7 shadow-sm space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-[#fcb424] flex items-center justify-center">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#fcb424]">Top Sellers</span>
                  <h2 className="text-sm font-black text-[#0a0500] uppercase tracking-tight">
                    Product Leaderboard
                  </h2>
                </div>
              </div>
              <Link
                to="/vendor/products"
                className="text-[10px] font-black uppercase tracking-wider text-[#0a0500] hover:text-[#fcb424]"
              >
                Catalog &rarr;
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {analytics?.top_products && analytics.top_products.length > 0 ? (
                analytics.top_products.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-neutral-50 hover:bg-neutral-100/80 transition">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 ${
                        idx === 0 ? 'bg-[#ffcd05] text-[#0a0500]' : 'bg-neutral-200 text-slate-600'
                      }`}>
                        #{idx + 1}
                      </span>
                      {item.image_url ? (
                        <img src={item.image_url} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0 border border-neutral-200" />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-neutral-200 flex items-center justify-center text-slate-400 flex-shrink-0">
                          <ShoppingBag className="w-4 h-4" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#0a0500] truncate">{item.title}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{item.units_sold} unit{item.units_sold > 1 ? 's' : ''} sold</p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-emerald-700 whitespace-nowrap">
                      ${item.revenue.toFixed(2)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-[#504e4a] text-xs space-y-2">
                  <p>No products sold yet.</p>
                  <Link
                    to="/vendor/products"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#ffcd05] text-[#0a0500] font-black text-[11px] uppercase rounded-full shadow-xs hover:bg-[#fcb424]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    List First Item
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Ranked by gross sales</span>
            <span className="font-bold text-[#0a0500]">{analytics?.total_products || 0} Total in Catalog</span>
          </div>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#fcb424]">Recent Buyer Activity</span>
            <h2 className="text-base font-black text-[#0a0500] uppercase tracking-tight mt-0.5">
              Recent Customer Sub-Orders
            </h2>
          </div>
          <Link
            to="/vendor/orders"
            className="text-xs font-black uppercase tracking-wider text-[#0a0500] hover:text-[#fcb424] flex items-center gap-1 transition"
          >
            <span>All Packages</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {analytics?.recent_orders && analytics.recent_orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-[#0a0500] uppercase font-black tracking-wider text-[10px] border-y border-neutral-200">
                <tr>
                  <th className="py-3 px-4">Master Order</th>
                  <th className="py-3 px-4">Customer Email</th>
                  <th className="py-3 px-4">Package Gross</th>
                  <th className="py-3 px-4">Net Payout</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Fulfillment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {analytics.recent_orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-neutral-50/70 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#0a0500]">
                      #{ord.order_number}
                    </td>
                    <td className="py-3.5 px-4 text-[#504e4a]">{ord.customer_email}</td>
                    <td className="py-3.5 px-4 font-black text-[#0a0500]">${ord.subtotal.toFixed(2)}</td>
                    <td className="py-3.5 px-4 font-black text-emerald-700">${ord.net_amount.toFixed(2)}</td>
                    <td className="py-3.5 px-4">
                      <OrderStatusBadge status={ord.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to="/vendor/orders"
                        className="px-3.5 py-1 text-[11px] font-black uppercase tracking-wider bg-neutral-100 hover:bg-[#ffcd05] text-[#0a0500] rounded-full transition"
                      >
                        Dispatch &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-[#504e4a] text-xs font-medium">
            No customer orders assigned to this store yet.
          </div>
        )}
      </div>

      {/* Product Modal */}
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
