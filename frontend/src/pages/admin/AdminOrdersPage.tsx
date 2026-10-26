import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search, Package, Store, Eye, X } from 'lucide-react';
import { adminService } from '../../services/api';
import { Order } from '../../types';
import { OrderStatusBadge } from '../../components/OrderStatusBadge';

export const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [inspectOrder, setInspectOrder] = useState<Order | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await adminService.getAllOrders({
        search: searchTerm || undefined,
        status: statusFilter || undefined,
      });
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
  }, [searchTerm, statusFilter]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/admin/dashboard" className="hover:text-indigo-600 flex items-center gap-1 font-semibold">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Admin Dashboard
        </Link>
      </div>

      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Global Marketplace Orders Audit</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor end-to-end transactional checkout pipelines, payment verification, and multi-vendor fulfillment splits.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-2">
          {['', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {st === '' ? 'All' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <div className="max-w-md relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by order reference number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:border-indigo-500 outline-none"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading platform orders...</div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No orders found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Order Ref</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Vendor Sub-Orders</th>
                  <th className="py-3 px-4">Grand Total</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Overall Status</th>
                  <th className="py-3 px-4 text-right">Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {ord.order_number}
                      <span className="block font-sans text-[10px] text-slate-400 font-normal">
                        {new Date(ord.created_at).toLocaleDateString()}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800 block truncate max-w-xs">{ord.shipping_name}</span>
                      <span className="text-[11px] text-slate-500 truncate max-w-xs block">{ord.customer_email}</span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {ord.vendor_orders?.map((vo) => (
                          <span
                            key={vo.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-semibold text-slate-700"
                          >
                            <Store className="w-2.5 h-2.5 text-indigo-500" />
                            {vo.vendor_name} (${Number(vo.subtotal).toFixed(2)})
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-black text-slate-900 text-sm">
                      ${Number(ord.grand_total).toFixed(2)}
                    </td>

                    <td className="py-3 px-4">
                      <OrderStatusBadge status={ord.payment_status} />
                      <span className="block text-[10px] text-slate-400 mt-0.5">{ord.payment_method}</span>
                    </td>

                    <td className="py-3 px-4">
                      <OrderStatusBadge status={ord.status} />
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setInspectOrder(ord)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition"
                        title="Inspect Order Breakdown"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect Modal */}
      {inspectOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-6 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs text-slate-400 font-medium">Order Inspection</span>
                <h3 className="font-mono font-bold text-slate-900 text-lg">{inspectOrder.order_number}</h3>
              </div>
              <button onClick={() => setInspectOrder(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Split breakdown */}
            <div className="space-y-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">
                Independent Vendor Sub-Orders ({inspectOrder.vendor_orders?.length || 0})
              </h4>
              <div className="space-y-3">
                {inspectOrder.vendor_orders?.map((vo) => (
                  <div key={vo.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                    <div className="flex justify-between items-center font-bold text-slate-900">
                      <span className="flex items-center gap-1.5">
                        <Store className="w-3.5 h-3.5 text-indigo-600" />
                        {vo.vendor_name}
                      </span>
                      <OrderStatusBadge status={vo.status} />
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 text-[11px]">
                      <div>
                        <span className="text-slate-400 block">Gross Subtotal:</span>
                        <span className="font-bold text-slate-800">${Number(vo.subtotal).toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Platform Fee ({Number(vo.commission_rate)}%):</span>
                        <span className="font-bold text-rose-600">-${Number(vo.commission_amount).toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Net Vendor Payout:</span>
                        <span className="font-bold text-emerald-600">${Number(vo.net_vendor_amount).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setInspectOrder(null)}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
