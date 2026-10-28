import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Search,
  Store,
  Eye,
  X,
  Download,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  RotateCcw,
  ShieldCheck,
  Building,
  CreditCard,
  User,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { adminService } from '../../services/api';
import { Order, VendorOrder } from '../../types';
import { OrderStatusBadge } from '../../components/OrderStatusBadge';
import { AdminSubNav } from '../../components/AdminSubNav';

export const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [settlementFilter, setSettlementFilter] = useState<'ALL' | 'SETTLED' | 'PENDING'>('ALL');
  const [exporting, setExporting] = useState(false);

  // Inspection Modal
  const [inspectOrder, setInspectOrder] = useState<Order | null>(null);

  // Disbursement Prompt Modal
  const [disburseModal, setDisburseModal] = useState<{
    vendorOrder: VendorOrder;
    reference: string;
    submitting: boolean;
  } | null>(null);

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
    const timer = setTimeout(() => {
      fetchOrders();
    }, 200);
    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter]);

  // Financial KPIs
  const stats = useMemo(() => {
    const totalOrders = orders.length;
    let gmv = 0;
    let commission = 0;
    let pendingDisbursements = 0;
    let settledDisbursements = 0;

    orders.forEach((o) => {
      gmv += Number(o.grand_total || 0);
      o.vendor_orders?.forEach((vo) => {
        commission += Number(vo.commission_amount || 0);
        if (vo.is_disbursed) {
          settledDisbursements++;
        } else {
          pendingDisbursements++;
        }
      });
    });

    return { totalOrders, gmv, commission, pendingDisbursements, settledDisbursements };
  }, [orders]);

  // Filter orders by settlement status if active
  const filteredOrders = useMemo(() => {
    if (settlementFilter === 'ALL') return orders;
    return orders.filter((o) => {
      const allDisbursed = o.vendor_orders?.every((vo) => vo.is_disbursed);
      if (settlementFilter === 'SETTLED') return allDisbursed;
      return !allDisbursed;
    });
  }, [orders, settlementFilter]);

  // Export Master Financial Ledger CSV
  const handleExportLedger = async () => {
    try {
      setExporting(true);
      const token = localStorage.getItem('access_token');
      const res = await fetch('/api/v1/analytics/admin/export-csv/', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Failed to generate export');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `marketplace_master_ledger_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Ledger export error:', err);
      alert('Failed to export financial ledger.');
    } finally {
      setExporting(false);
    }
  };

  // Disburse Sub-Order Settlement
  const handleConfirmDisburse = async () => {
    if (!disburseModal) return;
    setDisburseModal((prev) => prev ? { ...prev, submitting: true } : null);

    try {
      const res = await adminService.disburseVendorOrder(
        disburseModal.vendorOrder.id,
        disburseModal.reference
      );

      // Update local orders state
      setOrders((prev) =>
        prev.map((ord) => ({
          ...ord,
          vendor_orders: ord.vendor_orders?.map((vo) =>
            vo.id === disburseModal.vendorOrder.id
              ? {
                  ...vo,
                  is_disbursed: true,
                  disbursed_at: new Date().toISOString(),
                  disbursement_reference: disburseModal.reference || 'DISBURSED_MANUAL',
                }
              : vo
          ),
        }))
      );

      // Update active inspect modal if open
      if (inspectOrder) {
        setInspectOrder((prev) =>
          prev
            ? {
                ...prev,
                vendor_orders: prev.vendor_orders?.map((vo) =>
                  vo.id === disburseModal.vendorOrder.id
                    ? {
                        ...vo,
                        is_disbursed: true,
                        disbursed_at: new Date().toISOString(),
                        disbursement_reference: disburseModal.reference || 'DISBURSED_MANUAL',
                      }
                    : vo
                ),
              }
            : null
        );
      }

      setDisburseModal(null);
    } catch (err) {
      console.error('Disbursement failure:', err);
      alert('Failed to record disbursement reconciliation.');
      setDisburseModal((prev) => prev ? { ...prev, submitting: false } : null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* Unified Admin SubNav */}
      <AdminSubNav />

      {/* Header Banner */}
      <div className="bg-[#0a0500] text-white rounded-3xl p-8 relative overflow-hidden shadow-xl border border-neutral-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#ffcd05]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-700/80 text-[#ffcd05] text-[11px] font-black uppercase tracking-wider">
              <FileText className="w-3.5 h-3.5" />
              <span>Multi-Vendor Settlement & Order Reconciliation</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Orders & Settlement Ledger
            </h1>
            <p className="text-neutral-400 text-sm max-w-2xl font-medium leading-relaxed">
              Audit platform checkout flows, track multi-vendor fulfillment splits, disburse escrow funds to merchants, and download platform master ledger reports.
            </p>
          </div>

          {/* Export Ledger Button */}
          <button
            onClick={handleExportLedger}
            disabled={exporting}
            className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-[#ffcd05] hover:bg-[#e5b804] text-[#0a0500] font-black text-xs uppercase tracking-wider transition shadow-lg self-start md:self-center disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{exporting ? 'Compiling Ledger...' : 'Export Master CSV Ledger'}</span>
          </button>
        </div>
      </div>

      {/* Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200/90 rounded-2xl p-5 shadow-sm">
          <span className="text-[10px] font-black uppercase text-neutral-400 tracking-wider block">
            Platform Orders
          </span>
          <div className="text-2xl font-black text-neutral-900 mt-1">{stats.totalOrders}</div>
          <span className="text-[11px] text-neutral-500 font-medium mt-0.5 block">Audit volume in range</span>
        </div>

        <div className="bg-white border border-neutral-200/90 rounded-2xl p-5 shadow-sm">
          <span className="text-[10px] font-black uppercase text-neutral-400 tracking-wider block">
            Platform Gross GMV
          </span>
          <div className="text-2xl font-black text-neutral-900 mt-1">${stats.gmv.toFixed(2)}</div>
          <span className="text-[11px] text-emerald-600 font-bold mt-0.5 block">Customer checkout payments</span>
        </div>

        <div className="bg-white border border-neutral-200/90 rounded-2xl p-5 shadow-sm">
          <span className="text-[10px] font-black uppercase text-neutral-400 tracking-wider block">
            Commission Retained
          </span>
          <div className="text-2xl font-black text-amber-600 mt-1">${stats.commission.toFixed(2)}</div>
          <span className="text-[11px] text-neutral-500 font-medium mt-0.5 block">Platform marketplace fees</span>
        </div>

        <div className="bg-white border border-neutral-200/90 rounded-2xl p-5 shadow-sm">
          <span className="text-[10px] font-black uppercase text-neutral-400 tracking-wider block">
            Disbursement Escrow
          </span>
          <div className="text-2xl font-black text-neutral-900 mt-1 flex items-baseline gap-2">
            <span className="text-amber-600">{stats.pendingDisbursements}</span>
            <span className="text-xs text-neutral-400 font-semibold">pending</span>
            <span className="text-sm font-semibold text-neutral-400">/</span>
            <span className="text-emerald-600">{stats.settledDisbursements}</span>
            <span className="text-xs text-neutral-400 font-semibold">settled</span>
          </div>
          <span className="text-[11px] text-neutral-500 font-medium mt-0.5 block">Vendor payout sub-orders</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
          {/* Search Input */}
          <div className="md:col-span-6 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by order ref (#ORD-...), customer name, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 hover:bg-neutral-100/70 focus:bg-white border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-900 placeholder-neutral-400 focus:border-[#0a0500] outline-none transition"
            />
          </div>

          {/* Fulfillment Status Filter */}
          <div className="md:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-2.5 px-3 bg-neutral-50 hover:bg-neutral-100/70 border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-800 outline-none focus:border-[#0a0500] transition"
            >
              <option value="">All Fulfillment Statuses</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="PROCESSING">PROCESSING</option>
              <option value="SHIPPED">SHIPPED</option>
              <option value="DELIVERED">DELIVERED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          {/* Settlement Status Filter */}
          <div className="md:col-span-3 flex items-center bg-neutral-100 p-1 rounded-xl">
            {(['ALL', 'SETTLED', 'PENDING'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setSettlementFilter(st)}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition ${
                  settlementFilter === st
                    ? 'bg-[#0a0500] text-white shadow-sm font-black'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {st === 'ALL' ? 'All' : st === 'SETTLED' ? 'Settled' : 'In Escrow'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-neutral-200/90 rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-16 text-center">
            <div className="w-8 h-8 border-2 border-[#0a0500] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">Loading marketplace orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <FileText className="w-12 h-12 text-neutral-300 mx-auto" />
            <h3 className="font-bold text-neutral-800 text-base">No orders found</h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              No orders matched your search or settlement filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-500 uppercase font-black text-[10px] tracking-wider border-b border-neutral-100">
                <tr>
                  <th className="py-4 px-4">Order Reference</th>
                  <th className="py-4 px-4">Customer Details</th>
                  <th className="py-4 px-4">Vendor Sub-Orders & Splits</th>
                  <th className="py-4 px-4">Total Amount</th>
                  <th className="py-4 px-4">Payment</th>
                  <th className="py-4 px-4">Fulfillment</th>
                  <th className="py-4 px-4">Settlement</th>
                  <th className="py-4 px-4 text-right">Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredOrders.map((ord) => {
                  const allDisbursed = ord.vendor_orders?.every((vo) => vo.is_disbursed);
                  return (
                    <tr key={ord.id} className="hover:bg-neutral-50/70 transition">
                      {/* Order Number & Date */}
                      <td className="py-3.5 px-4 font-mono font-bold text-neutral-900">
                        {ord.order_number}
                        <span className="block font-sans text-[10px] text-neutral-400 font-semibold mt-0.5">
                          {new Date(ord.created_at).toLocaleDateString()}
                        </span>
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-neutral-900 block truncate max-w-xs">
                          {ord.shipping_name || 'Customer'}
                        </span>
                        <span className="text-[11px] text-neutral-500 truncate max-w-xs block">
                          {ord.customer_email}
                        </span>
                      </td>

                      {/* Vendor Sub-Orders */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1.5 max-w-sm">
                          {ord.vendor_orders?.map((vo) => (
                            <span
                              key={vo.id}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${
                                vo.is_disbursed
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-neutral-100 text-neutral-800 border-neutral-200'
                              }`}
                            >
                              <Store className="w-2.5 h-2.5 text-neutral-500" />
                              <span className="font-black truncate max-w-[100px]">{vo.vendor_name}</span>
                              <span className="text-neutral-500 font-semibold">${Number(vo.subtotal).toFixed(2)}</span>
                              {vo.is_disbursed ? (
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                              ) : (
                                <Clock className="w-3 h-3 text-amber-500 flex-shrink-0" />
                              )}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Grand Total */}
                      <td className="py-3.5 px-4 font-black text-neutral-900 text-sm">
                        ${Number(ord.grand_total).toFixed(2)}
                      </td>

                      {/* Payment */}
                      <td className="py-3.5 px-4">
                        <OrderStatusBadge status={ord.payment_status} />
                        <span className="block text-[10px] text-neutral-400 font-medium mt-0.5 uppercase tracking-wider">
                          {ord.payment_method}
                        </span>
                      </td>

                      {/* Overall Status */}
                      <td className="py-3.5 px-4">
                        <OrderStatusBadge status={ord.status} />
                      </td>

                      {/* Settlement Badge */}
                      <td className="py-3.5 px-4">
                        {allDisbursed ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-black text-[10px] uppercase tracking-wider border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Settled
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 font-black text-[10px] uppercase tracking-wider border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            In Escrow
                          </span>
                        )}
                      </td>

                      {/* Audit Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setInspectOrder(ord)}
                          className="p-2 rounded-xl text-neutral-500 hover:text-[#0a0500] hover:bg-neutral-100 transition inline-flex items-center gap-1 font-bold text-xs"
                          title="Audit order splits & settlements"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Audit</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Deep Order Inspection & Settlement Modal */}
      {inspectOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0500]/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-neutral-200 space-y-6 my-8 animate-fadeIn">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-neutral-100">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                  Transactional Audit & Split Settlement
                </span>
                <h3 className="font-mono font-black text-neutral-900 text-2xl mt-0.5">
                  {inspectOrder.order_number}
                </h3>
                <span className="text-xs text-neutral-500 font-medium">
                  Placed on {new Date(inspectOrder.created_at).toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => setInspectOrder(null)}
                className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer & Shipping Dossier */}
            <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200/80 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block">
                  Customer Information
                </span>
                <div className="font-bold text-neutral-900">{inspectOrder.shipping_name}</div>
                <div className="text-neutral-600">{inspectOrder.customer_email}</div>
                <div className="text-neutral-500">{inspectOrder.shipping_phone}</div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block">
                  Delivery Destination
                </span>
                <div className="text-neutral-800 font-medium leading-relaxed">
                  {inspectOrder.shipping_address}, {inspectOrder.shipping_city}{' '}
                  {inspectOrder.shipping_state} {inspectOrder.shipping_postal_code}
                </div>
                <div className="text-[11px] text-neutral-500 pt-1">
                  Payment: <span className="font-bold text-neutral-800">{inspectOrder.payment_method}</span> (Status: {inspectOrder.payment_status})
                </div>
              </div>
            </div>

            {/* Independent Vendor Sub-Orders Breakdown */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-xs uppercase tracking-wider text-neutral-500">
                  Vendor Sub-Orders & Disbursement Ledger ({inspectOrder.vendor_orders?.length || 0})
                </h4>
              </div>

              <div className="space-y-4">
                {inspectOrder.vendor_orders?.map((vo) => (
                  <div
                    key={vo.id}
                    className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-sm space-y-4 text-xs"
                  >
                    {/* Sub-order header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-100">
                      <div className="flex items-center gap-2">
                        <Store className="w-4 h-4 text-neutral-600" />
                        <span className="font-black text-neutral-900 text-sm">{vo.vendor_name}</span>
                        <OrderStatusBadge status={vo.status} />
                      </div>

                      {/* Disbursement Badge or Button */}
                      <div>
                        {vo.is_disbursed ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-black text-[11px] uppercase tracking-wider">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Disbursed</span>
                            {vo.disbursement_reference && (
                              <span className="font-mono text-neutral-500 lowercase text-[10px]">
                                ({vo.disbursement_reference})
                              </span>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() =>
                              setDisburseModal({
                                vendorOrder: vo,
                                reference: '',
                                submitting: false,
                              })
                            }
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#0a0500] hover:bg-neutral-800 text-[#ffcd05] font-black text-[11px] uppercase tracking-wider transition shadow-sm"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>Disburse ${Number(vo.net_vendor_amount).toFixed(2)}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Financial split metrics */}
                    <div className="grid grid-cols-3 gap-3 p-3 bg-neutral-50 rounded-xl border border-neutral-100 text-center">
                      <div>
                        <span className="text-[10px] font-black uppercase text-neutral-400 block tracking-wider">
                          Gross Subtotal
                        </span>
                        <span className="font-black text-neutral-900 text-sm mt-0.5 block">
                          ${Number(vo.subtotal).toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase text-neutral-400 block tracking-wider">
                          Platform Fee ({Number(vo.commission_rate)}%)
                        </span>
                        <span className="font-black text-amber-600 text-sm mt-0.5 block">
                          -${Number(vo.commission_amount).toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase text-neutral-400 block tracking-wider">
                          Net Merchant Payout
                        </span>
                        <span className="font-black text-emerald-700 text-sm mt-0.5 block">
                          ${Number(vo.net_vendor_amount).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Items inside this sub-order */}
                    {vo.items && vo.items.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-black uppercase text-neutral-400 block tracking-wider">
                          Sub-Order Line Items:
                        </span>
                        <div className="divide-y divide-neutral-100 bg-neutral-50 rounded-xl p-2 border border-neutral-100">
                          {vo.items.map((it) => (
                            <div key={it.id} className="py-1.5 px-2 flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-neutral-900">{it.product_title}</span>
                                <span className="text-neutral-400">× {it.quantity}</span>
                              </div>
                              <span className="font-black text-neutral-900">${Number(it.subtotal).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
              <div className="text-xs">
                <span className="text-neutral-400 font-semibold">Grand Total: </span>
                <span className="font-black text-neutral-900 text-base">
                  ${Number(inspectOrder.grand_total).toFixed(2)}
                </span>
              </div>

              <button
                onClick={() => setInspectOrder(null)}
                className="px-5 py-2.5 bg-[#0a0500] text-white text-xs font-black uppercase tracking-wider rounded-full hover:bg-neutral-800 transition"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disburse Confirmation Prompt Modal */}
      {disburseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0500]/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 space-y-5 animate-fadeIn">
            <div className="flex items-start justify-between pb-3 border-b border-neutral-100">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 block">
                  Merchant Payout Disbursement
                </span>
                <h3 className="font-black text-neutral-900 text-lg mt-0.5">
                  Disburse to {disburseModal.vendorOrder.vendor_name}
                </h3>
              </div>
              <button
                onClick={() => setDisburseModal(null)}
                className="p-1 text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200/80 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-neutral-500">Sub-Order ID:</span>
                <span className="font-mono font-bold text-neutral-900">#{disburseModal.vendorOrder.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Gross Subtotal:</span>
                <span className="font-bold text-neutral-800">
                  ${Number(disburseModal.vendorOrder.subtotal).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Platform Fee Retained:</span>
                <span className="font-bold text-rose-600">
                  -${Number(disburseModal.vendorOrder.commission_amount).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-neutral-200 text-sm font-black">
                <span className="text-neutral-900">Net Disbursement:</span>
                <span className="text-emerald-700">
                  ${Number(disburseModal.vendorOrder.net_vendor_amount).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-neutral-600 block">
                Banking / Transfer Reference (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. UTR-982402194, ACH-4912, Bank Txn ID"
                value={disburseModal.reference}
                onChange={(e) =>
                  setDisburseModal((prev) =>
                    prev ? { ...prev, reference: e.target.value } : null
                  )
                }
                className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-900 outline-none focus:border-[#0a0500]"
              />
              <p className="text-[10px] text-neutral-400">
                Recording a reference allows merchants and platform auditors to reconcile the bank transfer.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDisburseModal(null)}
                className="px-4 py-2 rounded-full border border-neutral-200 text-neutral-600 text-xs font-bold uppercase tracking-wider hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={disburseModal.submitting}
                onClick={handleConfirmDisburse}
                className="px-5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider transition shadow-sm disabled:opacity-50"
              >
                {disburseModal.submitting ? 'Reconciling...' : 'Confirm & Mark Disbursed'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};