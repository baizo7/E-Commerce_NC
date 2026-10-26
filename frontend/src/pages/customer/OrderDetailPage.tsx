import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Store, Truck, ShieldCheck, Clock } from 'lucide-react';
import { orderService } from '../../services/api';
import { Order } from '../../types';
import { OrderStatusBadge } from '../../components/OrderStatusBadge';

export const OrderDetailPage: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!orderNumber) return;
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
  }, [orderNumber]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-10 space-y-4 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/4"></div>
        <div className="h-48 bg-slate-200 rounded-2xl"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <h2 className="text-xl font-bold text-slate-800">Order Not Found</h2>
        <Link to="/orders" className="mt-4 inline-block text-indigo-600 font-semibold text-sm">
          &larr; Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/orders" className="hover:text-indigo-600 flex items-center gap-1 font-semibold">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to My Orders
        </Link>
        <span>/</span>
        <span className="font-mono text-slate-800 font-bold">{order.order_number}</span>
      </div>

      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <span className="text-xs text-slate-400 font-medium">Order Reference</span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono mt-0.5">
              {order.order_number}
            </h1>
            <span className="text-xs text-slate-500">
              Placed on {new Date(order.created_at).toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <OrderStatusBadge status={order.status} />
            <span className="text-2xl font-black text-indigo-600">${Number(order.grand_total).toFixed(2)}</span>
          </div>
        </div>

        {/* Multi-Vendor Packages Section */}
        <div className="space-y-6">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Independent Vendor Fulfillment Shipments ({order.vendor_orders?.length || 0})
          </h2>

          <div className="space-y-4">
            {order.vendor_orders?.map((vo) => (
              <div key={vo.id} className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/40">
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
                  {vo.tracking_number ? (
                    <div className="flex items-center gap-2 text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200">
                      <Truck className="w-4 h-4 text-indigo-600" />
                      <span>Carrier: <strong>{vo.carrier || 'Standard'}</strong></span>
                      <span className="text-slate-300">|</span>
                      <span>Tracking Code: <strong className="font-mono text-indigo-600">{vo.tracking_number}</strong></span>
                      {vo.shipped_at && (
                        <span className="text-slate-400 text-[11px] ml-auto">
                          Shipped {new Date(vo.shipped_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-slate-500 bg-white p-3 rounded-xl border border-slate-200">
                      <Clock className="w-4 h-4 text-amber-500" />
                      <span>The vendor is currently preparing and packaging this shipment.</span>
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
                            <span className="font-semibold text-slate-800 block">{item.product_title}</span>
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
        </div>

        {/* Address and Financials Breakdown */}
        <div className="pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-600">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <span className="font-bold text-slate-800 block mb-1">Shipping Details</span>
            <p className="font-semibold text-slate-900">{order.shipping_name}</p>
            <p>{order.shipping_address}</p>
            <p>{order.shipping_city}, {order.shipping_state} {order.shipping_postal_code}</p>
            <p>{order.shipping_country}</p>
            <p className="mt-1 text-slate-500">Contact: {order.shipping_phone}</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-1.5">
            <span className="font-bold text-slate-800 block mb-2">Financial Breakdown</span>
            <div className="flex justify-between">
              <span>Items Subtotal:</span>
              <span className="font-semibold text-slate-900">${Number(order.total_items_amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Combined Shipping:</span>
              <span className="font-semibold text-slate-900">${Number(order.shipping_amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Sales Tax (5%):</span>
              <span className="font-semibold text-slate-900">${Number(order.tax_amount).toFixed(2)}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm text-slate-900">
              <span>Total Paid:</span>
              <span className="text-indigo-600 font-extrabold">${Number(order.grand_total).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
