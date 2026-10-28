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
  Store,
  Truck,
  CheckCircle2,
  ExternalLink
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
      console.error('Failed to load vendor analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Modern Shop | Vendor Dashboard';
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
        <div className="bg-[#0a0500] text-white rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden text-center space-y-6 border border-neutral-800">
          <div className="w-16 h-16 rounded-2xl bg-[#ffcd05] text-[#0a0500] flex items-center justify-center mx-auto shadow-lg">
            <Store className="w-8 h-8" />
          </div>
          <div className="space-y-2 max-w-xl mx-auto">
            <span className="text-xs font-black uppercase tracking-widest text-[#fcb424] block">Modern Shop Merchant Network</span>
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white">
              Launch Your Modern Shop Storefront
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

  // 7-day velocity totals for header summary
  const sevenDayTotals = analytics?.daily_trends?.reduce(
    (acc, day) => ({
      revenue: acc.revenue + day.revenue,
      orders: acc.orders + day.order_count,
    }),
    { revenue: 0, orders: 0 }
  ) || { revenue: 0, orders: 0 };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
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
      <div className="bg-[#0a0500] text-white rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border border-neutral-800">
        <div className="absolute right-0 top-0 w-80 h-80 bg-[#ffcd05]/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="space-y-2.5 relative z-10 max-w-xl">
          <div className="flex items-center gap-2.5">
            <span className="px-3 py-0.5 rounded-full bg-[#ffcd05] text-[#0a0500] text-[10px] font-black uppercase tracking-wider shadow-sm">
              Modern Shop Merchant Portal
            </span>
            <div className="flex items-center gap-1 text-[#ffcd05] text-xs font-bold">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>{Number(analytics?.rating || 5.0).toFixed(1)} Rating</span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white leading-tight">
            {analytics?.store_name || 'Modern Shop Vendor Store'}
          </h1>
          <p className="text-xs text-neutral-300 leading-relaxed">
            Manage your Modern Shop storefront, upload local high-res product photos, assign parcel tracking, and review net bank disbursements.
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

      {/* 4 KPI Stats Cards */}
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

      {/* 7-day sales and dispatch performance */}
      <div className="bg-white border border-neutral-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-100 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0a0500] text-[#ffcd05] flex items-center justify-center shadow-sm">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#fcb424]">
                  Visual Velocity
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[9px] font-black uppercase tracking-wider">
                  Live 7-Day Performance
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-[#0a0500] uppercase tracking-tight">
                7-Day Sales & Order Trajectory
              </h2>
            </div>
          </div>

          {/* Quick 7-Day Overview Chips */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="px-3.5 py-1.5 rounded-xl bg-neutral-50 border border-neutral-200/80 text-xs">
              <span className="text-[10px] text-slate-400 font-black uppercase block">7D Net Revenue:</span>
              <span className="font-black text-emerald-700">${sevenDayTotals.revenue.toFixed(2)}</span>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-neutral-50 border border-neutral-200/80 text-xs">
              <span className="text-[10px] text-slate-400 font-black uppercase block">7D Packages:</span>
              <span className="font-black text-[#0a0500]">{sevenDayTotals.orders} packages</span>
            </div>
          </div>
        </div>

        {/* Bar Chart Visualization Canvas - Solid Flat Colors, No Gradients */}
        {analytics?.daily_trends && analytics.daily_trends.length > 0 ? (
          <div className="space-y-6">
            {/* Chart Area with Generous Height */}
            <div className="relative pt-6 pb-2 px-4 bg-neutral-50/60 rounded-2xl border border-neutral-200/80">
              {/* Background Guideline markers */}
              <div className="absolute inset-x-4 top-8 bottom-12 flex flex-col justify-between pointer-events-none opacity-40">
                <div className="border-b border-dashed border-neutral-300 w-full"></div>
                <div className="border-b border-dashed border-neutral-200 w-full"></div>
                <div className="border-b border-dashed border-neutral-200 w-full"></div>
              </div>

              {/* Bars Row */}
              <div className="h-60 sm:h-72 flex items-end justify-between gap-3 sm:gap-6 relative z-10 px-2 sm:px-6">
                {(() => {
                  const maxRev = Math.max(...analytics.daily_trends.map((d) => d.revenue), 10);
                  return analytics.daily_trends.map((day, idx) => {
                    const heightPercent = Math.max(Math.round((day.revenue / maxRev) * 100), 8);
                    const isToday = idx === analytics.daily_trends!.length - 1;
                    return (
                      <div
                        key={idx}
                        className="flex-1 flex flex-col items-center gap-2 group h-full justify-end relative"
                      >
                        {/* Hover Tooltip - Floating Above Bar with High Z-Index */}
                        <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none absolute -top-14 bg-[#0a0500] text-white text-[11px] font-bold px-3 py-2 rounded-xl shadow-2xl whitespace-nowrap z-30 border border-neutral-700">
                          <div className="text-[10px] text-[#ffcd05] font-black uppercase tracking-wider mb-0.5">
                            {day.date}
                          </div>
                          <div>
                            Net Payout: <strong className="text-emerald-400">${day.revenue.toFixed(2)}</strong> (
                            {day.order_count} packages)
                          </div>
                        </div>

                        {/* Interactive Bar Pillar - Solid Flat Colors */}
                        <div className="w-full max-w-[56px] bg-neutral-200/60 rounded-t-xl overflow-hidden flex flex-col justify-end h-full shadow-xs group-hover:bg-neutral-200 transition">
                          <div
                            style={{ height: `${heightPercent}%` }}
                            className={`w-full rounded-t-xl transition-all duration-300 ${
                              isToday
                                ? 'bg-[#ffcd05] hover:bg-[#e6b800]'
                                : 'bg-[#0a0500] hover:bg-neutral-800'
                            }`}
                          ></div>
                        </div>

                        {/* Date Label */}
                        <div className="text-center mt-1">
                          <span
                            className={`text-[11px] font-black tracking-wider uppercase block truncate ${
                              isToday ? 'text-[#0a0500]' : 'text-slate-500'
                            }`}
                          >
                            {day.short_date}
                          </span>
                          {isToday && (
                            <span className="text-[9px] font-black text-[#0a0500] bg-[#ffcd05] px-1.5 py-0.5 rounded-full uppercase block mt-0.5 font-mono">
                              Today
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Legend and Helper Details */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#504e4a] pt-1 px-1">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-md bg-[#0a0500]"></span>
                  <span className="font-bold text-[#0a0500]">Settled Payouts (Previous Days)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-md bg-[#ffcd05]"></span>
                  <span className="font-bold text-[#0a0500]">Today's Volume</span>
                </div>
              </div>
              <span className="text-slate-400 text-[11px] font-medium">
                Hover over individual pillars for package quantities and revenue breakdown
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 text-[#504e4a] text-xs">
            Performance curve will calibrate automatically as transactions process.
          </div>
        )}
      </div>

      {/* Product performance and warehouse fulfillment */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Performing Catalog Items Leaderboard */}
        <div className="bg-white border border-neutral-200/90 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-[#fcb424] flex items-center justify-center shadow-xs">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#fcb424]">Top Sellers</span>
                  <h2 className="text-base font-black text-[#0a0500] uppercase tracking-tight">
                    Product Leaderboard
                  </h2>
                </div>
              </div>
              <Link
                to="/vendor/products"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-neutral-200 text-[11px] font-black uppercase tracking-wider text-[#0a0500] hover:bg-neutral-50 transition"
              >
                <span>Catalog</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="mt-5 space-y-3">
              {analytics?.top_products && analytics.top_products.length > 0 ? (
                analytics.top_products.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-neutral-50 hover:bg-neutral-100/80 transition border border-neutral-100"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span
                        className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 ${
                          idx === 0
                            ? 'bg-[#ffcd05] text-[#0a0500] shadow-xs'
                            : idx === 1
                            ? 'bg-neutral-300 text-neutral-800'
                            : idx === 2
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-neutral-200 text-slate-600'
                        }`}
                      >
                        #{idx + 1}
                      </span>
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt=""
                          className="w-11 h-11 rounded-xl object-cover flex-shrink-0 border border-neutral-200 bg-white"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-xl bg-neutral-200 flex items-center justify-center text-slate-400 flex-shrink-0">
                          <ShoppingBag className="w-5 h-5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-black text-[#0a0500] truncate">{item.title}</p>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                          {item.units_sold} unit{item.units_sold > 1 ? 's' : ''} sold
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-emerald-700 whitespace-nowrap bg-white px-2.5 py-1 rounded-lg border border-neutral-200 shadow-2xs">
                      ${item.revenue.toFixed(2)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-[#504e4a] text-xs space-y-3">
                  <p>No products sold yet.</p>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#0a0500] text-[#ffcd05] font-black text-xs uppercase tracking-wider rounded-full shadow-sm hover:bg-neutral-800 transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>List First Item</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-100 flex items-center justify-between text-xs text-slate-400">
            <span>Ranked by gross sales volume</span>
            <span className="font-black text-[#0a0500]">{analytics?.total_products || 0} Total in Catalog</span>
          </div>
        </div>

        {/* Warehouse Fulfillment & Logistics Pipeline */}
        <div className="bg-white border border-neutral-200/90 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-[#fcb424] flex items-center justify-center shadow-xs">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#fcb424]">
                    Warehouse Logistics
                  </span>
                  <h2 className="text-base font-black text-[#0a0500] uppercase tracking-tight">
                    Fulfillment Pipeline
                  </h2>
                </div>
              </div>
              <Link
                to="/vendor/orders"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-neutral-200 text-[11px] font-black uppercase tracking-wider text-[#0a0500] hover:bg-neutral-50 transition"
              >
                <span>Orders Queue</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between text-xs p-3.5 rounded-2xl bg-neutral-50 border border-neutral-100">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-[#0a0500]">Completed Shipments</span>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-black uppercase border border-emerald-200">
                  {analytics?.completed_orders || 0} Delivered
                </span>
              </div>

              <div className="flex items-center justify-between text-xs p-3.5 rounded-2xl bg-neutral-50 border border-neutral-100">
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span className="font-bold text-[#0a0500]">Awaiting Dispatch</span>
                </div>
                <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-900 text-[10px] font-black uppercase border border-amber-200">
                  {analytics?.pending_fulfillment || 0} Pending
                </span>
              </div>

              <div className="flex items-center justify-between text-xs p-3.5 rounded-2xl bg-neutral-50 border border-neutral-100">
                <div className="flex items-center gap-2.5">
                  <Package className="w-4 h-4 text-neutral-600" />
                  <span className="font-bold text-[#0a0500]">Warehouse Stock Health</span>
                </div>
                <span className="px-3 py-1 rounded-full bg-white border border-neutral-200 text-[10px] font-black text-[#0a0500] shadow-2xs">
                  {Math.max(0, (analytics?.total_products || 0) - lowStockCount)} Healthy / {lowStockCount} Alert
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-100 flex items-center justify-between text-xs text-slate-400">
            <span>Parcel Logistics & Tracking</span>
            <Link
              to="/vendor/orders"
              className="font-black text-[#0a0500] hover:text-[#fcb424] flex items-center gap-1"
            >
              <span>Manage Shipments</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent buyer orders table */}
      <div className="bg-white border border-neutral-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-100 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-neutral-100 text-[#0a0500] flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#fcb424]">Recent Buyer Activity</span>
              <h2 className="text-base font-black text-[#0a0500] uppercase tracking-tight mt-0.5">
                Recent Customer Sub-Orders
              </h2>
            </div>
          </div>
          <Link
            to="/vendor/orders"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0a0500] text-white hover:bg-neutral-800 text-xs font-black uppercase tracking-wider transition self-start sm:self-auto"
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
                    <td className="py-3.5 px-4 text-[#504e4a] font-medium">{ord.customer_email}</td>
                    <td className="py-3.5 px-4 font-black text-[#0a0500]">${ord.subtotal.toFixed(2)}</td>
                    <td className="py-3.5 px-4 font-black text-emerald-700">${ord.net_amount.toFixed(2)}</td>
                    <td className="py-3.5 px-4">
                      <OrderStatusBadge status={ord.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to="/vendor/orders"
                        className="px-3.5 py-1.5 text-[11px] font-black uppercase tracking-wider bg-neutral-100 hover:bg-[#ffcd05] text-[#0a0500] rounded-full transition inline-flex items-center gap-1"
                      >
                        <span>Dispatch</span>
                        <ArrowRight className="w-3 h-3" />
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