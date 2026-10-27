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
  ExternalLink,
  ChevronRight,
  HelpCircle
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
    shipping_phone: user?.phone || '+91 98765 43210',
    shipping_address: user?.address || '742 Evergreen Terrace',
    shipping_city: user?.city || 'Springfield',
    shipping_state: 'OR',
    shipping_postal_code: user?.postal_code || '97477',
    shipping_country: 'India',
    payment_method: 'RAZORPAY',
  });

  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  if (!cart?.items?.length && !activeOrder) {
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

  // Dynamically inject Razorpay Standard Checkout SDK
  const loadRazorpaySDK = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => {
        console.error('Failed to load Razorpay SDK');
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  // Launch Authentic Razorpay Modal
  const launchRazorpayModal = async (order: Order) => {
    const rzpData = order.razorpay_payload;
    if (!rzpData) {
      setErrorMessage('Razorpay payload missing from order. Please try again.');
      return;
    }

    const loaded = await loadRazorpaySDK();
    if (!loaded || !(window as any).Razorpay) {
      setErrorMessage('Unable to connect to Razorpay Payment Gateway. Please check your internet connection or ad-blocker.');
      return;
    }

    const options: any = {
      key: rzpData.key_id,
      amount: rzpData.amount_in_subunits,
      currency: rzpData.currency || 'INR',
      name: 'NexaMarket Marketplace',
      description: `Order #${order.order_number}`,
      image: 'https://cdn-icons-png.flaticon.com/512/3081/3081559.png',
      order_id: rzpData.razorpay_order_id,
      prefill: {
        name: formData.shipping_name,
        email: formData.shipping_email,
        contact: formData.shipping_phone,
      },
      notes: {
        order_number: order.order_number,
      },
      theme: {
        color: '#4f46e5',
      },
      // Successful authorization handler
      handler: async (response: any) => {
        setVerifying(true);
        setErrorMessage(null);
        try {
          await orderService.verifyRazorpayPayment({
            razorpay_order_id: response.razorpay_order_id || rzpData.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          await refreshCart();
          navigate(`/order-success/${order.order_number}`, { state: { order } });
        } catch (verifyErr: any) {
          console.error('Verification error:', verifyErr);
          setErrorMessage(
            verifyErr.response?.data?.error ||
              'Payment signature verification failed. Please contact platform support.'
          );
        } finally {
          setVerifying(false);
        }
      },
      modal: {
        ondismiss: () => {
          setActiveOrder(order);
          setErrorMessage(
            'Payment window was closed before completing transaction. Your items remain reserved. Click "Re-open Razorpay" to complete payment.'
          );
        },
      },
    };

    try {
      const rzpInstance = new (window as any).Razorpay(options);

      // Register official Razorpay payment.failed listener
      rzpInstance.on('payment.failed', async (response: any) => {
        console.error('Razorpay payment failure event:', response.error);
        const errDesc = response.error?.description || response.error?.reason || 'Transaction declined';
        setErrorMessage(`Bank Payment Failed: ${errDesc} (Code: ${response.error?.code || 'UNKNOWN'})`);
        setActiveOrder(order);

        try {
          await orderService.recordRazorpayFailure({
            razorpay_order_id: rzpData.razorpay_order_id,
            error_code: response.error?.code,
            error_description: response.error?.description,
            error_source: response.error?.source,
            error_step: response.error?.step,
            error_reason: response.error?.reason,
          });
        } catch (reportErr) {
          console.warn('Could not report failure to backend:', reportErr);
        }
      });

      rzpInstance.open();
    } catch (launchErr: any) {
      console.error('Failed to trigger Razorpay modal:', launchErr);
      setErrorMessage(`Razorpay Gateway initialization error: ${launchErr.message}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    try {
      if (formData.payment_method === 'RAZORPAY') {
        const order = await orderService.checkout(formData);
        setActiveOrder(order);
        await launchRazorpayModal(order);
      } else {
        // Cash on delivery
        const order = await orderService.checkout(formData);
        await refreshCart();
        navigate(`/order-success/${order.order_number}`, { state: { order } });
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      setErrorMessage(
        err.response?.data?.error ||
          'Failed to place order. Please check stock availability and address fields.'
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
          Production Payment Gateway with Atomic Stock Reservation and Bank-Grade Cryptographic Verification.
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold">Payment Status Notice</h4>
            <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Re-open Gateway Action for Pending Orders */}
      {activeOrder && activeOrder.razorpay_payload && (
        <div className="p-5 rounded-2xl bg-indigo-50/90 border-2 border-indigo-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-600" />
              Order #{activeOrder.order_number} is Pending Payment
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Stock reserved for this order. Complete payment through the Razorpay gateway to generate merchant package dispatches.
            </p>
          </div>

          <button
            type="button"
            disabled={verifying}
            onClick={() => launchRazorpayModal(activeOrder)}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-200 flex items-center gap-2 transition disabled:opacity-50"
          >
            {verifying ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Verifying Signature...
              </>
            ) : (
              <>
                <ExternalLink className="w-4 h-4" />
                Re-open Razorpay Gateway
              </>
            )}
          </button>
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
              <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                PCI-DSS Level 1 Encrypted
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: Razorpay Gateway */}
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
                      <span className="text-[10px] bg-indigo-600 text-white font-bold px-1.5 py-0.5 rounded">
                        Production Live & Test
                      </span>
                    </span>
                    <span className="text-xs text-slate-500 mt-1.5 block leading-relaxed">
                      Credit/Debit Cards, UPI (GPay/PhonePe), Netbanking (50+ Banks), and Wallets.
                    </span>
                  </div>
                  <Zap className={`w-5 h-5 ${formData.payment_method === 'RAZORPAY' ? 'text-indigo-600' : 'text-slate-400'}`} />
                </div>
              </label>

              {/* Option 2: Cash on Delivery */}
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
                    <span className="text-xs text-slate-500 mt-1.5 block leading-relaxed">
                      Pay upon delivery arrival to merchant couriers.
                    </span>
                  </div>
                  <Truck className={`w-5 h-5 ${formData.payment_method === 'CASH_ON_DELIVERY' ? 'text-indigo-600' : 'text-slate-400'}`} />
                </div>
              </label>
            </div>

            {formData.payment_method === 'RAZORPAY' && (
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-start gap-2.5 text-xs text-slate-600">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <p>
                  Clicking <strong>"Proceed to Payment"</strong> opens the secure Razorpay Gateway modal. Card numbers, UPI PINs, and bank logins are handled directly through bank servers and never touch marketplace disks.
                </p>
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

            {cart?.vendors_involved && cart.vendors_involved.length > 0 && (
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
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 transition disabled:opacity-50 text-sm"
            >
              <Lock className="w-4 h-4" />
              {submitting
                ? 'Reserving Stock & Initializing Gateway...'
                : verifying
                ? 'Verifying Cryptographic Signature...'
                : formData.payment_method === 'RAZORPAY'
                ? `Proceed to Payment ($${grandTotal.toFixed(2)})`
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
