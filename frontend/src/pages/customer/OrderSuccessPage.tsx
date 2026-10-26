import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { CheckCircle2, Package, Store, ArrowRight, Truck, ShieldCheck } from 'lucide-react';
import { orderService } from '../../services/api';
import { Order } from '../../types';
import { OrderStatusBadge } from '../../components/OrderStatusBadge';

export const OrderSuccessPage: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const location = useLocation();
  const [order, setOrder] = useState<Order | null>((location.state as any)?.order || null);
  const [loading, setLoading] = useState<boolean>(!order);

  useEffect(() => {
    if (!order && orderNumber) {
      const fetchOrder = async () => {
        try {
          const data = await orderService.getOrderDetail(orderNumber);
          setOrder(data);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchOrder();
    }
  }, [orderNumber, order]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center animate-pulse space-y-4">
        <div className="w-16 h-16 bg-slate-200 rounded-full mx-auto"></div>
        <div className="h-6 bg-slate-200 rounded w-1/2 mx-auto"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <h2 className="text-xl font-bold text-slate-800">Order Information Unavailable</h2>
        <Link to="/orders" className="mt-4 inline-block text-indigo-600 font-semibold text-sm">
          View My Orders &rarr;
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-4">
      {/* Success Hero Banner */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-8 sm:p-10 text-center shadow-sm">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm shadow-emerald-50">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Payment & Stock Confirmed</span>
        <h1 className="text-3xl font-extrabold text-slate-900 mt-1">Thank You for Your Order!</h1>
        <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">
          Order reference <span className="font-mono font-bold text-indigo-600">{order.order_number}</span> has been processed. A confirmation has been routed to <strong>{order.shipping_email}</strong>.
        </p>

        <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/orders"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow transition"
          >
            Track in My Orders
          </Link>
          <Link
            to="/products"
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition"
          >
            Continue Shopping
          </Link>
        </div>
      </div>

      {/* Multi-Vendor Sub-Orders Breakdown */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Multi-Vendor Package Dispatches
            </h2>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            The platform has split your order into {order.vendor_orders?.length || 0} distinct merchant shipments:
          </p>
        </div>

        <div className="space-y-4">
          {order.vendor_orders?.map((vo) => (
            <div
              key={vo.id}
              className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50"
            >
              <div className="bg-white px-5 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-indigo-600" />
                  <span className="font-bold text-sm text-slate-900">{vo.vendor_name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <OrderStatusBadge status={vo.status} />
                  <span className="font-bold text-sm text-slate-900">${Number(vo.subtotal).toFixed(2)}</span>
                </div>
              </div>

              <div className="p-4 space-y-3">
                {vo.tracking_number && (
                  <div className="flex items-center gap-2 text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200/80">
                    <Truck className="w-4 h-4 text-indigo-500" />
                    <span>
                      Tracking: <strong className="font-mono">{vo.tracking_number}</strong> ({vo.carrier || 'Standard Courier'})
                    </span>
                  </div>
                )}

                <div className="divide-y divide-slate-100">
                  {vo.items?.map((item) => (
                    <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.image_url || 'https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=100&q=80'}
                          alt={item.product_title}
                          className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                        />
                        <div>
                          <span className="font-semibold text-slate-800 block truncate max-w-xs">{item.product_title}</span>
                          <span className="text-slate-400">Qty: {item.quantity} &times; ${Number(item.price).toFixed(2)}</span>
                        </div>
                      </div>
                      <span className="font-bold text-slate-900">${Number(item.subtotal).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Shipping address recap */}
        <div className="pt-4 border-t border-slate-100 text-xs text-slate-600 flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <span className="font-bold text-slate-800 block mb-1">Delivering To:</span>
            <p>{order.shipping_name}</p>
            <p>{order.shipping_address}, {order.shipping_city}, {order.shipping_postal_code}</p>
            <p>{order.shipping_country}</p>
          </div>

          <div className="text-right">
            <span className="font-bold text-slate-800 block mb-1">Payment Method:</span>
            <p>{order.payment_method}</p>
            <p className="text-emerald-600 font-semibold mt-1">Status: {order.payment_status}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
