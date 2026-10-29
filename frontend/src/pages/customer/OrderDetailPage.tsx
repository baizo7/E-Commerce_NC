import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Store,
  Truck,
  ShieldCheck,
  Clock,
  AlertTriangle,
  XCircle,
  HelpCircle,
  CheckCircle2,
  X
} from 'lucide-react';
import { orderService } from '../../services/api';
import { Order } from '../../types';
import { OrderStatusBadge } from '../../components/OrderStatusBadge';

export const OrderDetailPage: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Cancellation State
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('Changed my mind');
  const [cancelling, setCancelling] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Dispute / Claim State
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState('DAMAGED_ITEM');
  const [disputeNotes, setDisputeNotes] = useState('');
  const [selectedVendorOrderId, setSelectedVendorOrderId] = useState<number | undefined>(undefined);
  const [disputing, setDisputing] = useState(false);
  const [disputeSuccess, setDisputeSuccess] = useState<string | null>(null);
  const [disputeError, setDisputeError] = useState<string | null>(null);

  const fetchOrder = async () => {
    if (!orderNumber) return;
    try {
      setLoading(true);
      const data = await orderService.getOrderDetail(orderNumber);
      setOrder(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderNumber]);

  const handleCancelOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    try {
      setCancelling(true);
      setCancelError(null);
      await orderService.cancelOrder(order.order_number, cancelReason);
      setCancelSuccess('Order cancelled and reserved stock restored successfully.');
      setIsCancelModalOpen(false);
      await fetchOrder();
    } catch (err: any) {
      setCancelError(err.response?.data?.error || 'Could not cancel order.');
    } finally {
      setCancelling(false);
    }
  };

  const handleCreateDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    try {
      setDisputing(true);
      setDisputeError(null);
      await orderService.createDispute(order.order_number, {
        vendor_order_id: selectedVendorOrderId,
        reason: disputeReason,
        customer_notes: disputeNotes,
        amount: Number(order.grand_total),
      });
      setDisputeSuccess('Dispute claim filed. Support and merchant will review.');
      setIsDisputeModalOpen(false);
      setDisputeNotes('');
      await fetchOrder();
    } catch (err: any) {
      setDisputeError(err.response?.data?.error || 'Failed to file dispute.');
    } finally {
      setDisputing(false);
    }
  };

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
        <Link to="/orders" className="mt-4 inline-block text-amber-600 font-semibold text-sm">
          &larr; Back to Orders
        </Link>
      </div>
    );
  }

  const canCancel = order.status === 'PENDING_PAYMENT' || order.status === 'PROCESSING';
  const canDispute = order.status !== 'CANCELLED';

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/orders" className="hover:text-[#0a0500] flex items-center gap-1 font-semibold">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to My Orders
        </Link>
        <span>/</span>
        <span className="font-mono text-slate-800 font-bold">{order.order_number}</span>
      </div>

      {cancelSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{cancelSuccess}</span>
        </div>
      )}

      {disputeSuccess && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>{disputeSuccess}</span>
        </div>
      )}

      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <span className="text-xs text-slate-400 font-medium">Order Reference</span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#0a0500] font-mono mt-0.5">
              {order.order_number}
            </h1>
            <span className="text-xs text-slate-500">
              Placed on {new Date(order.created_at).toLocaleString()}
            </span>
            {order.cancellation_reason && (
              <p className="text-xs text-rose-600 font-semibold mt-1">
                Cancelled Reason: {order.cancellation_reason}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <OrderStatusBadge status={order.status} />
            <span className="text-2xl font-black text-[#0a0500]">
              ₹{Number(order.grand_total).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Action Toolbar (Cancel / Return Dispute) */}
        <div className="flex flex-wrap items-center justify-end gap-3 pb-2 border-b border-slate-100">
          {canCancel && (
            <button
              onClick={() => setIsCancelModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition border border-rose-200"
            >
              <XCircle className="w-4 h-4" />
              Cancel Order
            </button>
          )}

          {canDispute && (
            <button
              onClick={() => setIsDisputeModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition border border-slate-200"
            >
              <HelpCircle className="w-4 h-4 text-slate-600" />
              File Dispute / Return Claim
            </button>
          )}
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
                    <Store className="w-4 h-4 text-amber-500" />
                    <span className="font-bold text-sm text-slate-900">{vo.vendor_name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <OrderStatusBadge status={vo.status} />
                    <span className="font-bold text-sm text-slate-900">₹{Number(vo.subtotal).toFixed(2)}</span>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  {vo.tracking_number ? (
                    <div className="flex items-center gap-2 text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200">
                      <Truck className="w-4 h-4 text-amber-500" />
                      <span>Carrier: <strong>{vo.carrier || 'Standard'}</strong></span>
                      <span className="text-slate-300">|</span>
                      <span>Tracking Code: <strong className="font-mono text-slate-900">{vo.tracking_number}</strong></span>
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
                            {item.variant_title && (
                              <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold mt-0.5">
                                Variant: {item.variant_title}
                              </span>
                            )}
                            <span className="text-slate-400 block mt-0.5">Qty: {item.quantity} &times; ₹{Number(item.price).toFixed(2)}</span>
                          </div>
                        </div>
                        <span className="font-bold text-slate-900">₹{Number(item.subtotal).toFixed(2)}</span>
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
              <span className="font-semibold text-slate-900">₹{Number(order.total_items_amount).toFixed(2)}</span>
            </div>
            {order.discount_amount && Number(order.discount_amount) > 0 && (
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>Coupon Discount ({order.coupon_code}):</span>
                <span>-₹{Number(order.discount_amount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Combined Shipping:</span>
              <span className="font-semibold text-slate-900">₹{Number(order.shipping_amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Sales Tax (5%):</span>
              <span className="font-semibold text-slate-900">₹{Number(order.tax_amount).toFixed(2)}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm text-slate-900">
              <span>Total Paid:</span>
              <span className="text-[#0a0500] font-black">₹{Number(order.grand_total).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Order Modal */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Cancel Order #{order.order_number}
              </h3>
              <button onClick={() => setIsCancelModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            {cancelError && (
              <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                {cancelError}
              </p>
            )}

            <form onSubmit={handleCancelOrder} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason for cancellation:</label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                >
                  <option value="Changed my mind">Changed my mind</option>
                  <option value="Ordered by mistake">Ordered by mistake</option>
                  <option value="Incorrect shipping address">Incorrect shipping address</option>
                  <option value="Found a better price elsewhere">Found a better price elsewhere</option>
                  <option value="Other">Other reason</option>
                </select>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                Cancelling this order will release reserved stock back into merchant inventory and update status immediately.
              </p>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCancelModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold hover:bg-slate-50"
                >
                  Keep Order
                </button>
                <button
                  type="submit"
                  disabled={cancelling}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-xs disabled:opacity-50"
                >
                  {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* File Dispute Modal */}
      {isDisputeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-amber-500" />
                File Return / Dispute Claim
              </h3>
              <button onClick={() => setIsDisputeModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            {disputeError && (
              <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                {disputeError}
              </p>
            )}

            <form onSubmit={handleCreateDispute} className="space-y-3 text-xs">
              {order.vendor_orders && order.vendor_orders.length > 1 && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Specific Merchant Package (Optional):</label>
                  <select
                    value={selectedVendorOrderId || ''}
                    onChange={(e) => setSelectedVendorOrderId(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  >
                    <option value="">Entire Order</option>
                    {order.vendor_orders.map((vo) => (
                      <option key={vo.id} value={vo.id}>
                        {vo.vendor_name} (₹{Number(vo.subtotal).toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Claim Reason:</label>
                <select
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                >
                  <option value="DAMAGED_ITEM">Item arrived damaged or broken</option>
                  <option value="WRONG_ITEM">Received incorrect product or variant</option>
                  <option value="NOT_RECEIVED">Package not received / lost in transit</option>
                  <option value="DEFECTIVE">Product defective / not functioning</option>
                  <option value="OTHER">Other issue</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description / Notes:</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Please describe the issue in detail so our support and merchant can assist..."
                  value={disputeNotes}
                  onChange={(e) => setDisputeNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDisputeModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={disputing}
                  className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white rounded-xl font-bold shadow-xs disabled:opacity-50"
                >
                  {disputing ? 'Submitting Claim...' : 'Submit Claim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
