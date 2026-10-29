import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Store, ArrowRight, Clock, Truck, Search, IndianRupee, Filter, RefreshCw } from 'lucide-react';
import { orderService } from '../../services/api';
import { Order, unwrapResults } from '../../types';
import { OrderStatusBadge } from '../../components/OrderStatusBadge';

export const CustomerOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await orderService.getCustomerOrders();
      setOrders(unwrapResults<Order>(res));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Filter orders
  const filteredOrders = orders.filter((ord) => {
    const matchesStatus =
      statusFilter === 'ALL' ||
      ord.status.toUpperCase() === statusFilter.toUpperCase() ||
      (statusFilter === 'ACTIVE' && ['CONFIRMED', 'PROCESSING', 'PAID', 'PENDING_PAYMENT'].includes(ord.status.toUpperCase()));

    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      ord.order_number.toLowerCase().includes(term) ||
      ord.vendor_orders?.some((vo) => vo.vendor_name?.toLowerCase().includes(term)) ||
      ord.items?.some((it) => it.product_title?.toLowerCase().includes(term));

    return matchesStatus && matchesSearch;
  });

  // Analytics Metrics
  const totalSpent = orders.reduce((sum, o) => sum + Number(o.grand_total || 0), 0);
  const activeShipmentsCount = orders.filter((o) =>
    ['PAID', 'CONFIRMED', 'PROCESSING', 'SHIPPED'].includes(o.status.toUpperCase())
  ).length;

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-4 py-8 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-slate-200 rounded-2xl"></div>
          ))}
        </div>
        <div className="h-40 bg-slate-200 rounded-2xl"></div>
        <div className="h-40 bg-slate-200 rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Purchase History</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Track multi-vendor orders, package dispatch status, and carrier tracking codes.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs shadow-sm transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Orders
        </button>
      </div>

      {/* Metrics Row */}
      {orders.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Total Orders Placed</span>
              <span className="text-base font-extrabold text-slate-900">{orders.length} orders</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Active Shipments</span>
              <span className="text-base font-extrabold text-amber-600">{activeShipmentsCount} in progress</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Lifetime Spent</span>
              <span className="text-base font-extrabold text-emerald-600">₹{totalSpent.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      {orders.length > 0 && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by order #, store name, or product..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-500 transition"
            />
          </div>

          {/* Status Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {[
              { label: 'All Orders', value: 'ALL' },
              { label: 'Active', value: 'ACTIVE' },
              { label: 'Paid / Confirmed', value: 'PAID' },
              { label: 'Shipped', value: 'SHIPPED' },
              { label: 'Delivered', value: 'DELIVERED' },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`px-3 py-1.5 rounded-xl font-semibold transition ${
                  statusFilter === f.value
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-slate-900 text-lg">No Orders Yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto mb-6">
            You haven't placed any orders yet. Discover curated goods from verified independent marketplace sellers.
          </p>
          <Link
            to="/products"
            className="px-5 py-2.5 bg-indigo-600 text-white font-semibold text-xs rounded-xl hover:bg-indigo-700 transition"
          >
            Start Shopping
          </Link>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 text-xs space-y-3">
          <p>No orders found matching your active search or status filter.</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('ALL');
            }}
            className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-semibold hover:bg-indigo-100 transition"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((ord) => (
            <div
              key={ord.id}
              className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm hover:border-indigo-300 transition space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[11px] text-slate-400 font-medium">Order Number</span>
                  <div className="font-mono font-bold text-slate-900 text-sm">{ord.order_number}</div>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 font-medium">Date Placed</span>
                  <div className="text-xs font-semibold text-slate-700">
                    {new Date(ord.created_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 font-medium">Total Billed</span>
                  <div className="font-extrabold text-indigo-600 text-sm">
                    ₹{Number(ord.grand_total).toFixed(2)}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <OrderStatusBadge status={ord.status} />
                  <Link
                    to={`/orders/${ord.order_number}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-xl text-xs transition"
                  >
                    View Order Details
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Multi-Vendor Packages Breakdown */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Vendor Shipments:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ord.vendor_orders?.map((vo) => (
                    <div
                      key={vo.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <Store className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                        <span className="font-semibold text-slate-800 truncate">{vo.vendor_name}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {vo.tracking_number && (
                          <span className="font-mono text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded font-bold">
                            {vo.carrier || 'Tracking'}
                          </span>
                        )}
                        <OrderStatusBadge status={vo.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
