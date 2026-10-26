import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Truck, ArrowLeft, CheckCircle2, Clock, Package, ExternalLink, X } from 'lucide-react';
import { vendorService } from '../../services/api';
import { VendorOrder } from '../../types';
import { OrderStatusBadge } from '../../components/OrderStatusBadge';

export const VendorOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  // Fulfillment Modal State
  const [fulfillingOrder, setFulfillingOrder] = useState<VendorOrder | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('FedEx Express');
  const [newStatus, setNewStatus] = useState('SHIPPED');
  const [submitting, setSubmitting] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await vendorService.getMyOrders({ status: statusFilter || undefined });
      const list = (res as any).results || res;
      setOrders(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleOpenFulfill = (ord: VendorOrder) => {
    setFulfillingOrder(ord);
    setTrackingNumber(ord.tracking_number || '');
    setCarrier(ord.carrier || 'FedEx Express');
    setNewStatus(ord.status === 'PROCESSING' ? 'SHIPPED' : ord.status);
  };

  const handleFulfillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fulfillingOrder) return;
    setSubmitting(true);
    try {
      await vendorService.updateOrderStatus(fulfillingOrder.id, {
        status: newStatus,
        tracking_number: trackingNumber,
        carrier,
      });
      setFulfillingOrder(null);
      fetchOrders();
    } catch (err) {
      console.error(err);
      alert('Failed to update shipment status.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/vendor/dashboard" className="hover:text-indigo-600 flex items-center gap-1 font-semibold">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Vendor Dashboard
        </Link>
      </div>

      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Fulfillment & Shipments</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Process orders assigned to your store, generate tracking tags, and verify delivery.
          </p>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          {['', 'PROCESSING', 'SHIPPED', 'DELIVERED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {st === '' ? 'All Orders' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading sub-orders...</div>
        ) : orders.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-xs text-slate-400">
            No orders found under selected filter.
          </div>
        ) : (
          orders.map((ord) => (
            <div
              key={ord.id}
              className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm space-y-4"
            >
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-sm text-slate-900">
                    Parent Order: {ord.order_number}
                  </span>
                  <span className="text-slate-300">|</span>
                  <span className="text-xs text-slate-500">
                    Buyer: <strong>{ord.customer_email}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <OrderStatusBadge status={ord.status} />
                  <button
                    onClick={() => handleOpenFulfill(ord)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
                  >
                    Update Fulfillment &rarr;
                  </button>
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Items in this sub-order */}
                <div className="md:col-span-2 space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                    Ordered Line Items:
                  </span>
                  <div className="divide-y divide-slate-100">
                    {ord.items?.map((item) => (
                      <div key={item.id} className="py-2 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.image_url || 'https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=100&q=80'}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                          />
                          <div>
                            <span className="font-semibold text-slate-900 block truncate max-w-sm">{item.product_title}</span>
                            <span className="text-slate-400">Qty: {item.quantity} &times; ${Number(item.price).toFixed(2)}</span>
                          </div>
                        </div>
                        <span className="font-bold text-slate-900">${Number(item.subtotal).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  {ord.tracking_number && (
                    <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 text-xs text-sky-800 flex items-center gap-2 mt-2">
                      <Truck className="w-4 h-4 text-sky-600" />
                      <span>
                        Dispatched via <strong>{ord.carrier}</strong> &middot; Tracking: <strong className="font-mono">{ord.tracking_number}</strong>
                      </span>
                    </div>
                  )}
                </div>

                {/* Destination & Net Payout breakdown */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3 text-xs">
                  <div>
                    <span className="font-bold text-slate-700 block mb-1">Shipping Destination</span>
                    <p className="font-semibold text-slate-900">{ord.shipping_name}</p>
                    <p className="text-slate-600">{ord.shipping_address}, {ord.shipping_city}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-200 space-y-1">
                    <span className="font-bold text-slate-700 block mb-1">Sub-Order Financials</span>
                    <div className="flex justify-between text-slate-600">
                      <span>Package Subtotal:</span>
                      <span className="font-bold text-slate-900">${Number(ord.subtotal).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-rose-600">
                      <span>Platform Commission ({Number(ord.commission_rate)}%):</span>
                      <span>-${Number(ord.commission_amount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700 font-bold pt-1 border-t border-slate-200 text-sm">
                      <span>Net Vendor Payout:</span>
                      <span>${Number(ord.net_vendor_amount).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Fulfillment Modal */}
      {fulfillingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">Update Shipment & Fulfillment</h3>
              <button onClick={() => setFulfillingOrder(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFulfillSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Fulfillment Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-semibold"
                >
                  <option value="PROCESSING">Processing (Preparing in Warehouse)</option>
                  <option value="SHIPPED">Shipped (Dispatched to Courier)</option>
                  <option value="DELIVERED">Delivered (Handed to Customer)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Courier Carrier</label>
                <select
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                >
                  <option value="FedEx Express">FedEx Express</option>
                  <option value="UPS Ground">UPS Ground</option>
                  <option value="DHL Express">DHL Express</option>
                  <option value="USPS Priority Mail">USPS Priority Mail</option>
                  <option value="BlueDart Logistics">BlueDart Logistics</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tracking Number / Barcode</label>
                <input
                  type="text"
                  placeholder="e.g. FDX-9988776655"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setFulfillingOrder(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow transition disabled:opacity-50"
                >
                  {submitting ? 'Updating...' : 'Save & Notify Buyer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
