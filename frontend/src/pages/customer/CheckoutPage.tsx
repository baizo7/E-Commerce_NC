import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  CreditCard,
  Truck,
  Store,
  Lock,
  AlertCircle,
  Zap,
  RefreshCw,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { orderService } from '../../services/api';
import { Order } from '../../types';
import { RazorpaySandboxModal } from '../../components/RazorpaySandboxModal';

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
  const [isSandboxModalOpen, setIsSandboxModalOpen] = useState(false);

  if (!cart?.items?.length && !activeOrder) {
    return (
      <div className="max-w-md mx-auto py-24 text-center px-4">
        <h2 className="text-2xl font-black text-[#0a0500] uppercase tracking-wide">Your Bag is Empty</h2>
        <p className="text-sm text-[#504e4a] mt-2">Select items from our verified merchants before checking out.</p>
        <Link
          to="/products"
          className="mt-6 inline-block px-8 py-3.5 bg-[#0a0500] hover:bg-neutral-800 text-white font-black uppercase tracking-wider text-xs rounded-full shadow-md transition"
        >
          Return to Shop
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
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => {
        console.warn('Failed to load Razorpay SDK from CDN');
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  const handleSandboxSuccess = async (simulatedPaymentId: string) => {
    if (!activeOrder) return;
    setVerifying(true);
    setErrorMessage(null);
    try {
      await orderService.verifyRazorpayPayment({
        razorpay_order_id: activeOrder.razorpay_payload?.razorpay_order_id || '',
        razorpay_payment_id: simulatedPaymentId,
        razorpay_signature: 'simulated_valid_signature',
      });
      setIsSandboxModalOpen(false);
      await refreshCart();
      navigate(`/order-success/${activeOrder.order_number}`, { state: { order: activeOrder } });
    } catch (err: any) {
      console.error('Sandbox verification error:', err);
      setErrorMessage(err.response?.data?.error || 'Verification failed. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleSandboxFailure = async (errorReason: string) => {
    if (!activeOrder) return;
    try {
      await orderService.recordRazorpayFailure({
        razorpay_order_id: activeOrder.razorpay_payload?.razorpay_order_id || '',
        error_code: 'DECLINED_BY_BANK',
        error_description: errorReason,
        error_source: 'issuing_bank',
        error_step: 'payment_authorization',
        error_reason: 'insufficient_funds',
      });
    } catch (err) {
      console.warn('Could not record failure:', err);
    }
    setIsSandboxModalOpen(false);
    setErrorMessage(`Payment Declined: ${errorReason}`);
  };

  // Launch Authentic Razorpay Modal with Seamless Sandbox Fallback
  const launchPayment = async (order: Order) => {
    setActiveOrder(order);
    const rzpData = order.razorpay_payload;
    if (!rzpData) {
      setErrorMessage('Razorpay payload missing from order. Please try again.');
      return;
    }

    const isSandboxEnv =
      rzpData.is_sandbox ||
      rzpData.razorpay_order_id.startsWith('order_test_') ||
      rzpData.key_id.includes('placeholder') ||
      rzpData.key_id.includes('test_');

    if (isSandboxEnv) {
      setIsSandboxModalOpen(true);
      return;
    }

    const loaded = await loadRazorpaySDK();
    if (!loaded || !window.Razorpay) {
      setIsSandboxModalOpen(true);
      return;
    }

    const options: any = {
      key: rzpData.key_id,
      amount: rzpData.amount_in_subunits,
      currency: rzpData.currency || 'INR',
      name: 'Modern Shop Marketplace',
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
        color: '#0a0500',
      },
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
            'Payment window was closed before completing transaction. Your items remain reserved. Click "Re-open Gateway" to complete payment.'
          );
        },
      },
    };

    try {
      const rzpInstance = new window.Razorpay(options);

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
      console.warn('Razorpay SDK modal error, switching to interactive sandbox modal:', launchErr);
      setIsSandboxModalOpen(true);
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
        await launchPayment(order);
      } else {
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10">
      {/* Sandbox Payment Modal */}
      {activeOrder && (
        <RazorpaySandboxModal
          order={activeOrder}
          isOpen={isSandboxModalOpen}
          onClose={() => setIsSandboxModalOpen(false)}
          onSuccess={handleSandboxSuccess}
          onFailure={handleSandboxFailure}
        />
      )}

      {/* Modern Shop Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
        <Link to="/" className="hover:text-[#0a0500] transition">
          Home
        </Link>
        <ChevronRight className="w-3 h-3 text-slate-300" />
        <Link to="/cart" className="hover:text-[#0a0500] transition">
          Shopping Bag
        </Link>
        <ChevronRight className="w-3 h-3 text-slate-300" />
        <span className="text-[#0a0500]">Checkout</span>
      </nav>

      {/* Header */}
      <div>
        <span className="text-xs font-black uppercase tracking-widest text-[#fcb424]">Fast & Secure</span>
        <h1 className="text-3xl sm:text-4xl font-black text-[#0a0500] uppercase tracking-tight mt-1">
          Finalize Your Order
        </h1>
        <p className="text-xs text-[#504e4a] mt-1 font-medium">
          Bank-grade encryption, verified multi-vendor fulfillment, and buyer protection.
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold">Payment Notice</h4>
            <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Re-open Gateway Action for Pending Orders */}
      {activeOrder && activeOrder.razorpay_payload && (
        <div className="p-6 rounded-2xl bg-amber-50 border-2 border-amber-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-black text-[#0a0500] uppercase text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#fcb424]" />
              Order #{activeOrder.order_number} Awaiting Payment
            </h3>
            <p className="text-xs text-[#504e4a] mt-1">
              Your items have been safely reserved. Complete payment to initiate merchant dispatch.
            </p>
          </div>

          <button
            type="button"
            disabled={verifying}
            onClick={() => launchPayment(activeOrder)}
            className="px-6 py-3 bg-[#0a0500] hover:bg-neutral-800 text-white font-black uppercase tracking-wider text-xs rounded-full shadow-md flex items-center gap-2 transition disabled:opacity-50"
          >
            {verifying ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-[#ffcd05]" />
                Verifying Signature...
              </>
            ) : (
              <>
                <ExternalLink className="w-4 h-4 text-[#ffcd05]" />
                Re-open Payment Gateway
              </>
            )}
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        {/* Left Column: Shipping & Payment details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Shipping Address */}
          <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-2.5 pb-4 border-b border-neutral-100">
              <Truck className="w-5 h-5 text-[#fcb424]" />
              <h2 className="font-black text-[#0a0500] uppercase text-sm tracking-wider">Shipping Address</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Recipient Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.shipping_name}
                  onChange={(e) => setFormData({ ...formData, shipping_name: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-[#0a0500] focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.shipping_email}
                  onChange={(e) => setFormData({ ...formData, shipping_email: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-[#0a0500] focus:bg-white transition"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Street Address</label>
                <input
                  type="text"
                  required
                  value={formData.shipping_address}
                  onChange={(e) => setFormData({ ...formData, shipping_address: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-[#0a0500] focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">City</label>
                <input
                  type="text"
                  required
                  value={formData.shipping_city}
                  onChange={(e) => setFormData({ ...formData, shipping_city: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-[#0a0500] focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">State / Region</label>
                <input
                  type="text"
                  value={formData.shipping_state}
                  onChange={(e) => setFormData({ ...formData, shipping_state: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-[#0a0500] focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Postal / ZIP Code</label>
                <input
                  type="text"
                  required
                  value={formData.shipping_postal_code}
                  onChange={(e) => setFormData({ ...formData, shipping_postal_code: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-[#0a0500] focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={formData.shipping_phone}
                  onChange={(e) => setFormData({ ...formData, shipping_phone: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-[#0a0500] focus:bg-white transition"
                />
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-5 h-5 text-[#fcb424]" />
                <h2 className="font-black text-[#0a0500] uppercase text-sm tracking-wider">Select Payment Method</h2>
              </div>
              <span className="text-[10px] bg-emerald-50 text-emerald-800 font-black uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                PCI-DSS Encrypted
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option 1: Razorpay Gateway */}
              <label
                className={`p-5 border-2 rounded-2xl cursor-pointer flex flex-col justify-between transition relative ${
                  formData.payment_method === 'RAZORPAY'
                    ? 'border-[#0a0500] bg-neutral-50 shadow-sm'
                    : 'border-neutral-200 hover:border-neutral-300 bg-white'
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
                    <span className="text-xs font-black uppercase tracking-wider text-[#0a0500] flex items-center gap-2">
                      Online Gateway
                      <span className="text-[9px] bg-[#ffcd05] text-[#0a0500] font-black px-2 py-0.5 rounded">
                        RECOMMENDED
                      </span>
                    </span>
                    <span className="text-xs text-[#504e4a] mt-2 block leading-relaxed">
                      Instant checkout with Credit/Debit Cards, UPI (GPay/PhonePe), Netbanking, and Wallets.
                    </span>
                  </div>
                  <Zap className={`w-5 h-5 flex-shrink-0 ${formData.payment_method === 'RAZORPAY' ? 'text-[#fcb424]' : 'text-neutral-300'}`} />
                </div>
              </label>

              {/* Option 2: Cash on Delivery */}
              <label
                className={`p-5 border-2 rounded-2xl cursor-pointer flex flex-col justify-between transition ${
                  formData.payment_method === 'CASH_ON_DELIVERY'
                    ? 'border-[#0a0500] bg-neutral-50 shadow-sm'
                    : 'border-neutral-200 hover:border-neutral-300 bg-white'
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
                    <span className="text-xs font-black uppercase tracking-wider text-[#0a0500]">
                      Cash On Delivery
                    </span>
                    <span className="text-xs text-[#504e4a] mt-2 block leading-relaxed">
                      Pay cash directly to the courier agent upon arrival of your package.
                    </span>
                  </div>
                  <Truck className={`w-5 h-5 flex-shrink-0 ${formData.payment_method === 'CASH_ON_DELIVERY' ? 'text-[#fcb424]' : 'text-neutral-300'}`} />
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary & Checkout Trigger */}
        <div className="space-y-6">
          <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 sticky top-24">
            <h3 className="font-black text-[#0a0500] uppercase text-sm tracking-wider pb-3 border-b border-neutral-100">
              Order Breakdown
            </h3>

            {cart?.vendors_involved && cart.vendors_involved.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Merchant Packages:</span>
                {cart.vendors_involved.map((v) => (
                  <div
                    key={v.id}
                    className="p-3 bg-neutral-50 border border-neutral-100 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Store className="w-3.5 h-3.5 text-[#fcb424]" />
                      <span className="font-bold text-[#0a0500]">{v.store_name}</span>
                    </div>
                    <span className="font-black text-[#0a0500]">${v.subtotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-4 border-t border-neutral-100 space-y-3 text-xs text-[#504e4a]">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-bold text-[#0a0500]">${cartSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{shippingEstimate === 0 ? <strong className="text-emerald-700 font-bold uppercase">FREE</strong> : `$${shippingEstimate.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (5%)</span>
                <span className="font-bold text-[#0a0500]">${taxEstimate.toFixed(2)}</span>
              </div>
              <div className="pt-4 border-t border-neutral-200 flex justify-between items-baseline">
                <span className="font-black uppercase tracking-wider text-sm text-[#0a0500]">Total Due</span>
                <span className="text-2xl font-black text-[#0a0500]">${grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || verifying}
              className="w-full py-4 bg-[#ffcd05] hover:bg-[#fcb424] text-[#0a0500] font-black uppercase tracking-wider text-xs rounded-full shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Lock className="w-4 h-4 text-[#0a0500]" />
              {submitting
                ? 'Reserving Stock & Initializing...'
                : verifying
                ? 'Verifying Security Signature...'
                : formData.payment_method === 'RAZORPAY'
                ? `Proceed to Payment ($${grandTotal.toFixed(2)})`
                : `Place Order ($${grandTotal.toFixed(2)})`}
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Direct Bank Escrow & Atomic Stock Allocation</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
