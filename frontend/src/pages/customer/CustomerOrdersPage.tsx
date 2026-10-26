import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Store, ArrowRight, Clock, Truck } from 'lucide-react';
import { orderService } from '../../services/api';
import { Order } from '../../types';
import { OrderStatusBadge } from '../../components/OrderStatusBadge';

export const CustomerOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await orderService.getCustomerOrders();
        const list = (res as any).results || res;
        setOrders(list);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4 py-8 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/4"></div>
        <div className="h-32 bg-slate-200 rounded-2xl"></div>
        <div className="h-32 bg-slate-200 rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Purchase History</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Track fulfillment progress across independent vendor shipments
          </p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-slate-900 text-lg">No Orders Yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto mb-6">
            You haven't placed any orders yet. Discover curated goods from our verified marketplace vendors.
          </p>
          <Link
            to="/products"
            className="px-5 py-2.5 bg-indigo-600 text-white font-semibold text-xs rounded-xl hover:bg-indigo-700 transition"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((ord) => (
            <div
              key={ord.id}
              className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm hover:border-indigo-200 transition space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <span className="text-xs text-slate-400 font-medium">Order Reference</span>
                  <div className="font-mono font-bold text-slate-900 text-sm">{ord.order_number}</div>
                </div>

                <div>
                  <span className="text-xs text-slate-400 font-medium">Date Placed</span>
                  <div className="text-xs font-semibold text-slate-700">
                    {new Date(ord.created_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                </div>

                <div>
                  <span className="text-xs text-slate-400 font-medium">Total Amount</span>
                  <div className="font-extrabold text-indigo-600 text-sm">
                    ${Number(ord.grand_total).toFixed(2)}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <OrderStatusBadge status={ord.status} />
                  <Link
                    to={`/orders/${ord.order_number}`}
                    className="p-2 text-slate-400 hover:text-indigo-600 transition"
                    title="View Order Details"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Vendor Sub-Orders Summary */}
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
                      <OrderStatusBadge status={vo.status} />
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
