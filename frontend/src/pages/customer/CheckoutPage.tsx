import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  CreditCard,
  Truck,
  ArrowRight,
  Store,
  Lock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { orderService } from '../../services/api';

export const CheckoutPage: React.FC = () => {
  const { cart, cartSubtotal, cartCount, refreshCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    shipping_name: user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : '',
    shipping_email: user?.email || '',
    shipping_phone: user?.phone || '+1 (555) 234-5678',
    shipping_address: user?.address || '742 Evergreen Terrace',
    shipping_city: user?.city || 'Springfield',
    shipping_state: 'OR',
    shipping_postal_code: user?.postal_code || '97477',
    shipping_country: 'United States',
    payment_method: 'CREDIT_CARD',
  });

  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('123');

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!cart?.items?.length) {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <h2 className="text-xl font-bold text-slate-800">Your cart is empty</h2>
        <Link to="/products" className="mt-4 inline-block text-indigo-600 font-semibold text-sm">
          Browse items &rarr;
        </Link>
      </div>
    );
  }

  const shippingEstimate = cartSubtotal >= 100 ? 0 : 10.0;
  const taxEstimate = +(cartSubtotal * 0.05).toFixed(2);
  const grandTotal = +(cartSubtotal + shippingEstimate + taxEstimate).toFixed(2);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const order = await orderService.checkout(formData);
      await refreshCart();
      navigate(`/order-success/${order.order_number}`, { state: { order } });
    } catch (err: any) {
      console.error(err);
      setErrorMessage(
        err.response?.data?.error ||
          'Failed to place order. Please review your shipping details and stock availability.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Checkout</h1>
        <p className="text-sm text-slate-500 mt-1">
          Unified multi-vendor fulfillment with atomic inventory reservation.
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600 mt-0.5" />
          <div>
            <h4 className="font-bold">Order Placement Error</h4>
            <p className="text-xs text-rose-700 mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Shipping & Payment details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping Address */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Truck className="w-5 h-5 text-indigo-600" />
              <h2 className="font-bold text-slate-900 text-base">Shipping Destination</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.shipping_name}
                  onChange={(e) => setFormData({ ...formData, shipping_name: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.shipping_email}
                  onChange={(e) => setFormData({ ...formData, shipping_email: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Street Address</label>
                <input
                  type="text"
                  required
                  value={formData.shipping_address}
                  onChange={(e) => setFormData({ ...formData, shipping_address: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  required
                  value={formData.shipping_city}
                  onChange={(e) => setFormData({ ...formData, shipping_city: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">State / Province</label>
                <input
                  type="text"
                  value={formData.shipping_state}
                  onChange={(e) => setFormData({ ...formData, shipping_state: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Postal / ZIP Code</label>
                <input
                  type="text"
                  required
                  value={formData.shipping_postal_code}
                  onChange={(e) => setFormData({ ...formData, shipping_postal_code: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={formData.shipping_phone}
                  onChange={(e) => setFormData({ ...formData, shipping_phone: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <CreditCard className="w-5 h-5 text-indigo-600" />
              <h2 className="font-bold text-slate-900 text-base">Payment Method</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label
                className={`p-3.5 border rounded-xl cursor-pointer flex flex-col justify-between transition ${
                  formData.payment_method === 'CREDIT_CARD'
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 font-bold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="payment_method"
                  value="CREDIT_CARD"
                  checked={formData.payment_method === 'CREDIT_CARD'}
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                  className="sr-only"
                />
                <span className="text-xs">Credit / Debit Card</span>
                <span className="text-[10px] text-slate-500 mt-1">Visa, Mastercard, Amex</span>
              </label>

              <label
                className={`p-3.5 border rounded-xl cursor-pointer flex flex-col justify-between transition ${
                  formData.payment_method === 'UPI'
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 font-bold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="payment_method"
                  value="UPI"
                  checked={formData.payment_method === 'UPI'}
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                  className="sr-only"
                />
                <span className="text-xs">Instant UPI / QR</span>
                <span className="text-[10px] text-slate-500 mt-1">Direct Bank Escrow</span>
              </label>

              <label
                className={`p-3.5 border rounded-xl cursor-pointer flex flex-col justify-between transition ${
                  formData.payment_method === 'CASH_ON_DELIVERY'
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 font-bold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="payment_method"
                  value="CASH_ON_DELIVERY"
                  checked={formData.payment_method === 'CASH_ON_DELIVERY'}
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                  className="sr-only"
                />
                <span className="text-xs">Cash on Delivery</span>
                <span className="text-[10px] text-slate-500 mt-1">Pay on Arrival</span>
              </label>
            </div>

            {formData.payment_method === 'CREDIT_CARD' && (
              <div className="pt-3 space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Demo Card Number</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Expires</label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">CVC / CVV</label>
                    <input
                      type="text"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none font-mono"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Multi-Vendor Order Breakdown & Place Order */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Multi-Vendor Fulfillment</h3>
            <p className="text-xs text-slate-500">
              Your order contains items from the following independent stores and will be automatically split into individual merchant sub-orders:
            </p>

            {cart.vendors_involved && cart.vendors_involved.length > 0 && (
              <div className="space-y-2 pt-2">
                {cart.vendors_involved.map((v) => (
                  <div
                    key={v.id}
                    className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Store className="w-3.5 h-3.5 text-indigo-600" />
                      <span className="font-semibold text-slate-800">{v.store_name}</span>
                    </div>
                    <span className="font-bold text-slate-900">${v.subtotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-semibold text-slate-900">${cartSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Combined Shipping</span>
                <span>{shippingEstimate === 0 ? <strong className="text-emerald-600">FREE</strong> : `$${shippingEstimate.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (5%)</span>
                <span className="font-semibold text-slate-900">${taxEstimate.toFixed(2)}</span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-between items-baseline text-sm">
                <span className="font-bold text-slate-900">Total to Pay</span>
                <span className="text-2xl font-extrabold text-indigo-600">${grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              {submitting ? 'Reserving Stock & Processing...' : `Place Order ($${grandTotal.toFixed(2)})`}
            </button>

            <div className="flex items-center justify-center gap-2 text-xs text-slate-400 pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Transactional Atomic Inventory Guarantee</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
