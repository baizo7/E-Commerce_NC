import React, { useState, useEffect } from 'react';
import { Truck, CheckCircle2, Clock, Package, ExternalLink, X, Printer, Store, AlertCircle } from 'lucide-react';
import { vendorService } from '../../services/api';
import { VendorOrder, unwrapResults } from '../../types';
import { OrderStatusBadge } from '../../components/OrderStatusBadge';
import { VendorSubNav } from '../../components/VendorSubNav';
import { useAuth } from '../../context/AuthContext';

export const VendorOrdersPage: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  // Fulfillment Modal State
  const [fulfillingOrder, setFulfillingOrder] = useState<VendorOrder | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('FedEx Express');
  const [newStatus, setNewStatus] = useState('SHIPPED');
  const [submitting, setSubmitting] = useState(false);

  // Packing Slip Modal State
  const [packingSlipOrder, setPackingSlipOrder] = useState<VendorOrder | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await vendorService.getMyOrders({ status: statusFilter || undefined });
      const list = unwrapResults<VendorOrder>(res);
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

  const getCarrierTrackingUrl = (carrierName?: string, trackingNum?: string) => {
    if (!trackingNum) return '#';
    const c = (carrierName || '').toLowerCase();
    if (c.includes('fedex')) return `https://www.fedex.com/fedextrack/?trknbr=${trackingNum}`;
    if (c.includes('ups')) return `https://www.ups.com/track?tracknum=${trackingNum}`;
    if (c.includes('dhl')) return `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNum}`;
    if (c.includes('bluedart')) return `https://www.bluedart.com/tracking?trackNumber=${trackingNum}`;
    if (c.includes('india post')) return `https://www.indiapost.gov.in/_layouts/15/dpt.cpt.tracking/trackconsignment.aspx`;
    return `https://www.google.com/search?q=${encodeURIComponent(`${carrierName || 'Courier'} tracking ${trackingNum}`)}`;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <VendorSubNav />

      {/* Header Banner */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-black uppercase tracking-widest text-[#fcb424]">Order Fulfillment</span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0a0500] uppercase tracking-tight mt-1">
            Shipments & Customer Dispatches
          </h1>
          <p className="text-xs text-[#504e4a] mt-1 font-medium">
            Manage your autonomous store packages, assign carrier tracking tags, print customer packing slips, and confirm delivery.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
          {['', 'PROCESSING', 'SHIPPED', 'DELIVERED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition ${
                statusFilter === st
                  ? 'bg-[#0a0500] text-white shadow-sm font-black'
                  : 'bg-neutral-100 text-neutral-600 hover:text-[#0a0500] hover:bg-neutral-200'
              }`}
            >
              {st === '' ? 'All Packages' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-6">
        {loading ? (
          <div className="p-16 text-center text-xs text-slate-400">Loading sub-orders...</div>
        ) : orders.length === 0 ? (
          <div className="bg-white border border-neutral-200 rounded-2xl p-16 text-center space-y-3">
            <Package className="w-10 h-10 text-neutral-300 mx-auto" />
            <p className="text-xs text-[#504e4a] font-medium">No order packages matching this filter status.</p>
          </div>
        ) : (
          orders.map((ord) => (
            <div
              key={ord.id}
              className="bg-white border border-neutral-200/90 rounded-2xl overflow-hidden shadow-sm space-y-4"
            >
              {/* Package Header */}
              <div className="bg-neutral-50 px-6 py-4 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="font-black text-sm text-[#0a0500] tracking-tight">
                    Order #{ord.order_number}
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="text-xs text-[#504e4a]">
                    Customer: <strong className="text-[#0a0500]">{ord.customer_email}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <OrderStatusBadge status={ord.status} />

                  <button
                    onClick={() => setPackingSlipOrder(ord)}
                    className="px-3.5 py-1.5 border border-neutral-300 hover:border-[#0a0500] text-[#0a0500] font-bold text-xs rounded-full transition flex items-center gap-1.5"
                    title="Generate and print customer packing slip"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Packing Slip</span>
                  </button>

                  <button
                    onClick={() => handleOpenFulfill(ord)}
                    className="px-4 py-1.5 bg-[#ffcd05] hover:bg-[#fcb424] text-[#0a0500] text-xs font-black uppercase tracking-wider rounded-full shadow-sm transition"
                  >
                    Update Dispatch &rarr;
                  </button>
                </div>
              </div>

              {/* Package Body */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Items in this sub-order */}
                <div className="md:col-span-2 space-y-4">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400 block">
                    Assigned Package Items
                  </span>

                  <div className="divide-y divide-neutral-100">
                    {ord.items?.map((item) => (
                      <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3.5">
                          <img
                            src={item.image_url || 'https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=100&q=80'}
                            alt=""
                            className="w-12 h-14 rounded-xl object-cover border border-neutral-200 flex-shrink-0 bg-neutral-100"
                          />
                          <div>
                            <span className="font-bold text-sm text-[#0a0500] block truncate max-w-sm">
                              {item.product_title}
                            </span>
                            <span className="text-slate-500 font-medium">
                              Qty: {item.quantity} &times; ₹{Number(item.price).toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <span className="font-black text-sm text-[#0a0500]">₹{Number(item.subtotal).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  {ord.tracking_number && (
                    <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200/80 text-xs text-amber-900 flex flex-wrap items-center justify-between gap-3 mt-3">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-[#fcb424]" />
                        <span>
                          Dispatched via <strong>{ord.carrier}</strong> · Tracking:{' '}
                          <strong className="font-mono">{ord.tracking_number}</strong>
                        </span>
                      </div>
                      <a
                        href={getCarrierTrackingUrl(ord.carrier, ord.tracking_number)}
                        target="_blank"
                        rel="noreferrer"
                        className="font-bold text-amber-950 underline hover:text-black flex items-center gap-1"
                      >
                        <span>Carrier Portal</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>

                {/* Destination & Net Payout breakdown */}
                <div className="bg-neutral-50 p-5 rounded-2xl border border-neutral-200/80 space-y-4 text-xs">
                  <div>
                    <span className="font-black uppercase tracking-wider text-slate-400 block mb-1 text-[10px]">
                      Customer Destination
                    </span>
                    <p className="font-bold text-[#0a0500] text-sm">{ord.shipping_name}</p>
                    <p className="text-[#504e4a] mt-0.5 leading-relaxed">
                      {ord.shipping_address}, {ord.shipping_city}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-neutral-200 space-y-2 text-[#504e4a]">
                    <span className="font-black uppercase tracking-wider text-slate-400 block mb-1 text-[10px]">
                      Package Settlement
                    </span>
                    <div className="flex justify-between">
                      <span>Gross Package Value:</span>
                      <strong className="text-[#0a0500]">₹{Number(ord.subtotal).toFixed(2)}</strong>
                    </div>
                    <div className="flex justify-between text-rose-600">
                      <span>Platform Commission ({Number(ord.commission_rate).toFixed(0)}%):</span>
                      <strong>-₹{Number(ord.commission_amount).toFixed(2)}</strong>
                    </div>
                    <div className="pt-2 border-t border-neutral-200 flex justify-between items-baseline">
                      <span className="font-black uppercase tracking-wider text-[#0a0500]">Your Net Payout:</span>
                      <span className="text-base font-black text-emerald-700">
                        ₹{Number(ord.net_vendor_amount).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Fulfillment Status & Carrier Modal */}
      {fulfillingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-neutral-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50">
              <h3 className="font-black text-[#0a0500] uppercase text-sm tracking-tight">
                Update Package Dispatch
              </h3>
              <button
                onClick={() => setFulfillingOrder(null)}
                className="w-8 h-8 rounded-full bg-neutral-200/60 hover:bg-neutral-300 text-slate-700 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFulfillSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Shipment Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-[#0a0500] focus:bg-white font-bold transition"
                >
                  <option value="PROCESSING">Processing / Packing</option>
                  <option value="SHIPPED">Shipped / Dispatched</option>
                  <option value="DELIVERED">Delivered to Customer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Logistics Carrier
                </label>
                <select
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-[#0a0500] focus:bg-white font-medium transition"
                >
                  <option value="FedEx Express">FedEx Express</option>
                  <option value="UPS Ground">UPS Ground</option>
                  <option value="DHL Express">DHL Express</option>
                  <option value="BlueDart Logistics">BlueDart Logistics</option>
                  <option value="India Post EMS">India Post EMS</option>
                  <option value="USPS Priority">USPS Priority Mail</option>
                  <option value="Independent Merchant Fleet">Independent Merchant Fleet</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Carrier Tracking Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. 794839201948"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-[#0a0500] focus:bg-white font-mono transition"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 leading-relaxed">
                Marking status as <strong>SHIPPED</strong> triggers an automatic email alert to the buyer with live tracking details.
              </div>

              <div className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setFulfillingOrder(null)}
                  className="px-5 py-2.5 rounded-full border border-neutral-200 text-xs font-bold uppercase tracking-wider text-slate-600 hover:bg-neutral-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-[#ffcd05] hover:bg-[#fcb424] text-[#0a0500] font-black uppercase tracking-wider text-xs rounded-full shadow transition disabled:opacity-50"
                >
                  {submitting ? 'Updating...' : 'Save & Notify Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Packing Slip Modal */}
      {packingSlipOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-neutral-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal action bar (hidden during print) */}
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50 print:hidden">
              <span className="font-black text-sm uppercase tracking-wide text-[#0a0500]">
                Customer Packing Slip Preview
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-[#0a0500] hover:bg-neutral-800 text-white font-black uppercase tracking-wider text-xs rounded-full shadow flex items-center gap-1.5 transition"
                >
                  <Printer className="w-3.5 h-3.5 text-[#ffcd05]" />
                  <span>Print Slip</span>
                </button>
                <button
                  onClick={() => setPackingSlipOrder(null)}
                  className="w-8 h-8 rounded-full bg-neutral-200/60 hover:bg-neutral-300 text-slate-700 flex items-center justify-center transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Packing Slip Content */}
            <div className="p-8 sm:p-12 space-y-8 bg-white text-slate-900 font-sans" id="printable-packing-slip">
              {/* Slip Header */}
              <div className="flex items-start justify-between border-b-2 border-neutral-900 pb-6">
                <div>
                  <h2 className="text-2xl font-black text-[#0a0500] uppercase tracking-tight">
                    {user?.vendor_profile?.store_name || 'Verified Merchant Store'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Official Fulfillment Dispatch Slip</p>
                  <p className="text-xs text-slate-500">Contact: {user?.vendor_profile?.business_email || user?.email}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Order Reference</span>
                  <span className="text-lg font-black font-mono text-[#0a0500]">#{packingSlipOrder.order_number}</span>
                  <span className="text-xs text-slate-500 block mt-1">
                    Date: {new Date(packingSlipOrder.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Destination & Carrier details */}
              <div className="grid grid-cols-2 gap-8 text-xs">
                <div>
                  <span className="font-black uppercase tracking-wider text-slate-400 block mb-1">Deliver To:</span>
                  <p className="font-bold text-sm text-[#0a0500]">{packingSlipOrder.shipping_name}</p>
                  <p className="text-slate-600 mt-0.5">{packingSlipOrder.shipping_address}</p>
                  <p className="text-slate-600">{packingSlipOrder.shipping_city}</p>
                  <p className="text-slate-500 mt-1">Email: {packingSlipOrder.customer_email}</p>
                </div>

                <div>
                  <span className="font-black uppercase tracking-wider text-slate-400 block mb-1">Shipment Information:</span>
                  <p className="text-slate-700"><strong>Carrier:</strong> {packingSlipOrder.carrier || 'Standard Courier'}</p>
                  <p className="text-slate-700 mt-0.5">
                    <strong>Tracking Code:</strong> <span className="font-mono">{packingSlipOrder.tracking_number || 'N/A'}</span>
                  </p>
                  <p className="text-slate-700 mt-0.5">
                    <strong>Fulfillment Status:</strong> <span className="font-bold uppercase">{packingSlipOrder.status}</span>
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-neutral-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-100 text-slate-800 font-black uppercase text-[10px] border-b border-neutral-200">
                    <tr>
                      <th className="py-3 px-4">Item Description</th>
                      <th className="py-3 px-4 text-center">Quantity</th>
                      <th className="py-3 px-4 text-right">Unit Price</th>
                      <th className="py-3 px-4 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {packingSlipOrder.items?.map((item) => (
                      <tr key={item.id}>
                        <td className="py-3 px-4 font-bold text-slate-900">{item.product_title}</td>
                        <td className="py-3 px-4 text-center font-bold">{item.quantity}</td>
                        <td className="py-3 px-4 text-right">₹{Number(item.price).toFixed(2)}</td>
                        <td className="py-3 px-4 text-right font-black">₹{Number(item.subtotal).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary & Thank You Note */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-neutral-200 text-xs">
                <div className="text-slate-500 max-w-sm">
                  Thank you for supporting verified independent creators! All items are covered by 30-day buyer protection guarantees.
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-600 block">Package Subtotal:</span>
                  <span className="text-xl font-black text-[#0a0500]">₹{Number(packingSlipOrder.subtotal).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
