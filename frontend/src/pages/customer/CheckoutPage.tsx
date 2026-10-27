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
  AlertCircle,
  QrCode,
  Zap,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { orderService } from '../../services/api';
import { Order } from '../../types';

export const CheckoutPage: React.FC = () => {
  const { cart, cartSubtotal, refreshCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    shipping_name: user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : 'Jane Customer',
    shipping_email: user?.email || 'customer@example.com',
    shipping_phone: user?.phone || '+1 (555) 234-5678',
    shipping_address: user?.address || '742 Evergreen Terrace',
    shipping_city: user?.city || 'Springfield',
    shipping_state: 'OR',
    shipping_postal_code: user?.postal_code || '97477',
    shipping_country: 'United States',
    payment_method: 'RAZORPAY',
  });

  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('123');

  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingRazorpayOrder, setPendingRazorpayOrder] = useState<Order | null>(null);

  if (!cart?.items?.length) {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <h2 className="text-xl font-bold text-slate-800">Your cart is empty</h2>
        <p className="text-xs text-slate-500 mt-1">Discover vendor products and add items to begin checkout.</p>
        <Link to="/products" className="mt-4 inline-block text-indigo-600 font-semibold text-sm">
          Browse items &rarr;
        </Link>
      </div>
    );
  }

  const shippingEstimate = cartSubtotal >= 100 ? 0 : 10.0;
  const taxEstimate = +(cartSubtotal * 0.05).toFixed(2);
  const grandTotal = +(cartSubtotal + shippingEstimate + taxEstimate).toFixed(2);

  const loadRazorpaySDK = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSimulatedVerification = async (order: Order, rzpPayload: any) => {
    setVerifying(true);
    setErrorMessage(null);
    try {
      const mockPaymentId = `pay_sim_${Date.now()}`;
      await orderService.verifyRazorpayPayment({
        razorpay_order_id: rzpPayload.razorpay_order_id,
        razorpay_payment_id: mockPaymentId,
        razorpay_signature: 'simulated_valid_signature',
      });
      await refreshCart();
      navigate(`/order-success/${order.order_number}`, { state: { order } });
    } catch (err: any) {
      console.error('Simulated verification error:', err);
      setErrorMessage(err.response?.data?.error || 'Verification failed. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const order = await orderService.checkout(formData);

      if (formData.payment_method === 'RAZORPAY') {
        const rzpData = order.razorpay_payload;
        if (!rzpData) {
          throw new Error('Missing Razorpay payment configuration from server.');
        }

        const isLoaded = await loadRazorpaySDK();

        if (isLoaded && (window as any).Razorpay && !rzpData.razorpay_order_id.startsWith('order_test_')) {
          const options = {
            key: rzpData.key_id,
            amount: rzpData.amount_in_subunits,
            currency: rzpData.currency || 'INR',
            name: 'Nexacraft Multi-Vendor Marketplace',
            description: `Payment for Order #${order.order_number}`,
            order_id: rzpData.razorpay_order_id,
            prefill: {
              name: formData.shipping_name,
              email: formData.shipping_email,
              contact: formData.shipping_phone,
            },
            theme: {
              color: '#4f46e5',
            },
            handler: async (response: any) => {
              try {
                setVerifying(true);
                await orderService.verifyRazorpayPayment({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                });
                await refreshCart();
                navigate(`/order-success/${order.order_number}`, { state: { order } });
              } catch (verifyErr: any) {
                setErrorMessage(verifyErr.response?.data?.error || 'Razorpay signature validation failed.');
              } finally {
                setVerifying(false);
              }
            },
            modal: {
              ondismiss: () => {
                setPendingRazorpayOrder(order);
                setErrorMessage('Payment window was closed before completion. You can retry verification below.');
              },
            },
          };

          try {
            const rzp = new (window as any).Razorpay(options);
            rzp.open();
          } catch (launchErr) {
            console.warn('Razorpay open failed, offering simulated test completion:', launchErr);
            setPendingRazorpayOrder(order);
          }
        } else {
          // Razorpay sandbox simulation mode (standard for local dev & test keys)
          setPendingRazorpayOrder(order);
        }
      } else {
        // Direct credit card, UPI, or Cash on Delivery (simulated instant confirmation)
        await refreshCart();
        navigate(`/order-success/${order.order_number}`, { state: { order } });
      }
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
          Unified multi-vendor fulfillment with atomic inventory reservation and payment processing.
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold">Notice</h4>
            <p className="text-xs text-rose-700 mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Razorpay Test Mode Verification Modal / Action Banner */}
      {pendingRazorpayOrder && (
        <div className="p-6 rounded-2xl bg-indigo-50/80 border-2 border-indigo-200 shadow-sm space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Razorpay Test Mode Order Ready</h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Order <span className="font-mono font-semibold text-indigo-700">#{pendingRazorpayOrder.order_number}</span> is in <span className="font-semibold text-amber-600">PENDING_PAYMENT</span> state awaiting cryptographic confirmation.
                </p>
              </div>
            </div>
            <span className="text-xs bg-indigo-100 text-indigo-800 font-semibold px-3 py-1 rounded-full">
              Razorpay ID: {pendingRazorpayOrder.razorpay_payload?.razorpay_order_id}
            </span>
          </div>

          <div className="p-4 bg-white rounded-xl border border-indigo-100 flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs text-slate-600 space-y-1">
              <div><strong>Payable Amount:</strong> ₹{pendingRazorpayOrder.grand_total} (converted to minor subunits)</div>
              <div><strong>Security:</strong> Server-side HMAC SHA256 validation enforced</div>
            </div>

            <button
              type="button"
              disabled={verifying}
              onClick={() => handleSimulatedVerification(pendingRazorpayOrder, pendingRazorpayOrder.razorpay_payload)}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow flex items-center gap-2 transition disabled:opacity-50"
            >
              {verifying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Verifying Cryptographic Signature...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Simulate Razorpay Payment Success & Verify
                </>
              )}
            </button>
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

          {/* Payment Method Selector */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600" />
                <h2 className="font-bold text-slate-900 text-base">Payment Method</h2>
              </div>
              <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2.5 py-0.5 rounded-full">
                Plan v1.1 Razorpay Gateway
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: Razorpay (Recommended) */}
              <label
                className={`p-4 border-2 rounded-xl cursor-pointer flex flex-col justify-between transition relative ${
                  formData.payment_method === 'RAZORPAY'
                    ? 'border-indigo-600 bg-indigo-50/60 text-indigo-950 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="payment_method"
                  value="RAZORPAY"
                  checked={formData.payment_method === 'RAZORPAY'}
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                  className="sr-only"
                />
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-sm font-bold block flex items-center gap-1.5">
                      Razorpay Gateway
                      <span className="text-[10px] bg-indigo-600 text-white font-bold px-1.5 py-0.5 rounded">Recommended</span>
                    </span>
                    <span className="text-xs text-slate-500 mt-1 block">
                      Card, Netbanking, UPI, Wallets (v1.1 Core Integration)
                    </span>
                  </div>
                  <Zap className={`w-5 h-5 ${formData.payment_method === 'RAZORPAY' ? 'text-indigo-600' : 'text-slate-400'}`} />
                </div>
              </label>

              {/* Option 2: Direct Card Simulation */}
              <label
                className={`p-4 border-2 rounded-xl cursor-pointer flex flex-col justify-between transition ${
                  formData.payment_method === 'CREDIT_CARD'
                    ? 'border-indigo-600 bg-indigo-50/60 text-indigo-950 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
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
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-sm font-bold block">Credit / Debit Card</span>
                    <span className="text-xs text-slate-500 mt-1 block">Visa, Mastercard, Amex (Direct Simulation)</span>
                  </div>
                  <CreditCard className={`w-5 h-5 ${formData.payment_method === 'CREDIT_CARD' ? 'text-indigo-600' : 'text-slate-400'}`} />
                </div>
              </label>

              {/* Option 3: UPI */}
              <label
                className={`p-4 border-2 rounded-xl cursor-pointer flex flex-col justify-between transition ${
                  formData.payment_method === 'UPI'
                    ? 'border-indigo-600 bg-indigo-50/60 text-indigo-950 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
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
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-sm font-bold block">Instant UPI / QR</span>
                    <span className="text-xs text-slate-500 mt-1 block">Direct Bank Escrow</span>
                  </div>
                  <QrCode className={`w-5 h-5 ${formData.payment_method === 'UPI' ? 'text-indigo-600' : 'text-slate-400'}`} />
                </div>
              </label>

              {/* Option 4: Cash on Delivery */}
              <label
                className={`p-4 border-2 rounded-xl cursor-pointer flex flex-col justify-between transition ${
                  formData.payment_method === 'CASH_ON_DELIVERY'
                    ? 'border-indigo-600 bg-indigo-50/60 text-indigo-950 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
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
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-sm font-bold block">Cash on Delivery</span>
                    <span className="text-xs text-slate-500 mt-1 block">Pay on Delivery Arrival</span>
                  </div>
                  <Truck className={`w-5 h-5 ${formData.payment_method === 'CASH_ON_DELIVERY' ? 'text-indigo-600' : 'text-slate-400'}`} />
                </div>
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
              disabled={submitting || verifying}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              {submitting
                ? 'Reserving Stock & Initializing...'
                : verifying
                ? 'Verifying Payment...'
                : formData.payment_method === 'RAZORPAY'
                ? `Proceed to Razorpay ($${grandTotal.toFixed(2)})`
                : `Place Order ($${grandTotal.toFixed(2)})`}
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
