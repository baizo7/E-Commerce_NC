import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Trash2, ArrowRight, Store, ShieldCheck, ChevronRight, Lock, RotateCcw, Tag, CheckCircle2, AlertCircle } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { orderService } from '../../services/api';

export const CartPage: React.FC = () => {
  const { cart, loading, updateQuantity, removeItem, clearCart, cartSubtotal, cartCount } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError(null);
    setCouponSuccess(null);
    try {
      const res = await orderService.applyCoupon(couponCode.trim(), cartSubtotal);
      if (res.valid) {
        setDiscountAmount(res.discount_amount);
        setAppliedCoupon(res.code);
        setCouponSuccess(`Coupon ${res.code} applied! Saved $${res.discount_amount.toFixed(2)}`);
        sessionStorage.setItem('modernshop_coupon', res.code);
      }
    } catch (err: any) {
      setDiscountAmount(0);
      setAppliedCoupon(null);
      setCouponError(err.response?.data?.error || 'Invalid or expired coupon code.');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setDiscountAmount(0);
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponSuccess(null);
    setCouponError(null);
    sessionStorage.removeItem('modernshop_coupon');
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-24 text-center px-4">
        <div className="w-16 h-16 bg-[#ffcd05]/20 text-[#0a0500] rounded-full flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-[#0a0500] uppercase tracking-wide">Your Shopping Bag is Waiting</h2>
        <p className="text-sm text-[#504e4a] mt-2 mb-8">
          Please sign in to access your saved items and proceed to secure checkout.
        </p>
        <Link
          to="/login"
          className="inline-block px-8 py-3.5 bg-[#0a0500] hover:bg-neutral-800 text-white font-black uppercase tracking-wider text-xs rounded-full shadow-md transition"
        >
          Sign In to Continue
        </Link>
      </div>
    );
  }

  if (cartCount === 0 || !cart?.items?.length) {
    return (
      <div className="max-w-md mx-auto py-24 text-center px-4">
        <div className="w-16 h-16 bg-neutral-100 text-neutral-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-[#0a0500] uppercase tracking-wide">Your Shopping Bag is Empty</h2>
        <p className="text-sm text-[#504e4a] mt-2 mb-8">
          Explore our curated collections from independent designers and certified vendors.
        </p>
        <Link
          to="/products"
          className="inline-block px-8 py-3.5 bg-[#ffcd05] hover:bg-[#fcb424] text-[#0a0500] font-black uppercase tracking-wider text-xs rounded-full shadow-md transition"
        >
          Explore Shop
        </Link>
      </div>
    );
  }

  // Group cart items by Vendor
  const itemsByVendor: { [vendorId: number]: { vendorName: string; vendorSlug?: string; items: typeof cart.items } } = {};
  cart.items.forEach((item) => {
    const vId = typeof item.product.vendor === 'object' ? item.product.vendor.id : item.product.vendor;
    const vName = item.product.vendor_name || 'Independent Vendor';
    const vSlug = item.product.vendor_slug;
    if (!itemsByVendor[vId]) {
      itemsByVendor[vId] = { vendorName: vName, vendorSlug: vSlug, items: [] };
    }
    itemsByVendor[vId].items.push(item);
  });

  const discountedSubtotal = Math.max(0, cartSubtotal - discountAmount);
  const shippingEstimate = discountedSubtotal >= 100 || cartSubtotal >= 100 ? 0 : 10.0;
  const taxEstimate = +(discountedSubtotal * 0.05).toFixed(2);
  const grandTotal = +(discountedSubtotal + shippingEstimate + taxEstimate).toFixed(2);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10">
      {/* Modern Shop Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
        <Link to="/" className="hover:text-[#0a0500] transition">
          Home
        </Link>
        <ChevronRight className="w-3 h-3 text-slate-300" />
        <Link to="/products" className="hover:text-[#0a0500] transition">
          Shop
        </Link>
        <ChevronRight className="w-3 h-3 text-slate-300" />
        <span className="text-[#0a0500]">Shopping Bag</span>
      </nav>

      {/* Cart Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-neutral-200">
        <div>
          <span className="text-xs font-black uppercase tracking-widest text-[#fcb424]">Cart Overview</span>
          <h1 className="text-3xl sm:text-4xl font-black text-[#0a0500] uppercase tracking-tight mt-1">
            Shopping Bag
          </h1>
          <p className="text-xs text-[#504e4a] mt-1 font-medium">
            {cartCount} item{cartCount > 1 ? 's' : ''} across {Object.keys(itemsByVendor).length} merchant package{Object.keys(itemsByVendor).length > 1 ? 's' : ''}
          </p>
        </div>

        <button
          onClick={clearCart}
          className="text-xs font-black uppercase tracking-wider text-rose-600 hover:text-rose-700 flex items-center gap-1.5 self-start sm:self-auto py-2"
        >
          <Trash2 className="w-3.5 h-3.5" /> Empty Bag
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        {/* Left Column: Items grouped by Vendor */}
        <div className="lg:col-span-2 space-y-6">
          {Object.entries(itemsByVendor).map(([vId, group]) => (
            <div key={vId} className="bg-white border border-neutral-200/90 rounded-2xl overflow-hidden shadow-sm">
              {/* Vendor Package Banner */}
              <div className="bg-neutral-50 px-6 py-3.5 border-b border-neutral-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-[#fcb424]" />
                  <span className="text-xs font-black uppercase tracking-wider text-[#0a0500]">
                    Package: {group.vendorSlug ? (
                      <Link to={`/vendors/${group.vendorSlug}`} className="hover:underline">
                        {group.vendorName}
                      </Link>
                    ) : (
                      group.vendorName
                    )}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {group.items.length} item{group.items.length > 1 ? 's' : ''}
                </span>
              </div>

              {/* Items List */}
              <div className="divide-y divide-neutral-100">
                {group.items.map((item) => (
                  <div key={item.id} className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
                    <img
                      src={item.product.primary_image || 'https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=200&q=80'}
                      alt={item.product.title}
                      className="w-20 h-24 rounded-xl object-cover border border-neutral-100 flex-shrink-0 bg-neutral-50"
                    />

                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/products/${item.product.slug}`}
                        className="font-bold text-sm text-[#0a0500] hover:text-[#fcb424] transition truncate block"
                      >
                        {item.product.title}
                      </Link>
                      {item.variant && (
                        <div className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200/80 text-[11px] font-bold">
                          <span>Variant: {item.variant.title}</span>
                          {item.variant.sku && <span className="text-slate-400">({item.variant.sku})</span>}
                        </div>
                      )}
                      <div className="text-xs font-medium text-slate-500 mt-1">
                        ₹{Number(item.variant?.price || item.product.price).toFixed(2)} each
                      </div>
                      {item.product.inventory_count <= (item.product.low_stock_threshold || 5) && (
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 mt-1 block">
                          Only {item.product.inventory_count} remaining in stock
                        </span>
                      )}
                    </div>

                    {/* Quantity controls & Line Total */}
                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="inline-flex items-center border border-neutral-200 rounded-full bg-neutral-50 overflow-hidden shadow-sm">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={loading}
                          className="w-8 h-8 flex items-center justify-center text-slate-700 hover:bg-neutral-200 transition font-bold"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-xs font-black text-[#0a0500]">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={loading || item.quantity >= item.product.inventory_count}
                          className="w-8 h-8 flex items-center justify-center text-slate-700 hover:bg-neutral-200 transition font-bold disabled:opacity-30"
                        >
                          +
                        </button>
                      </div>

                      <span className="font-black text-sm text-[#0a0500] min-w-[70px] text-right">
                        ₹{Number(item.subtotal).toFixed(2)}
                      </span>

                      <button
                        onClick={() => removeItem(item.id)}
                        disabled={loading}
                        className="p-1.5 text-neutral-400 hover:text-rose-600 rounded-lg transition"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Order Summary (Modern Shop card) */}
        <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 sticky top-24">
          <h3 className="font-black text-[#0a0500] uppercase text-sm tracking-wider pb-3 border-b border-neutral-100">
            Order Summary
          </h3>

          <div className="space-y-3 text-xs text-[#504e4a]">
            <div className="flex justify-between">
              <span>Items Subtotal</span>
              <span className="font-bold text-[#0a0500]">₹{cartSubtotal.toFixed(2)}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>Promo Discount ({appliedCoupon})</span>
                <span>-₹{discountAmount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span>Combined Shipping</span>
              <span>{shippingEstimate === 0 ? <strong className="text-emerald-700 font-bold uppercase">FREE</strong> : `₹${shippingEstimate.toFixed(2)}`}</span>
            </div>

            <div className="flex justify-between">
              <span>Estimated Sales Tax (5%)</span>
              <span className="font-bold text-[#0a0500]">₹{taxEstimate.toFixed(2)}</span>
            </div>

            <div className="pt-4 border-t border-neutral-200 flex justify-between items-baseline">
              <span className="font-black uppercase tracking-wider text-sm text-[#0a0500]">Grand Total</span>
              <span className="text-2xl font-black text-[#0a0500]">₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Coupon Code Section */}
          <div className="pt-2 border-t border-neutral-100">
            <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 block mb-1.5">
              Have a Promo Code?
            </label>
            {appliedCoupon ? (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                <div className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{appliedCoupon} (-₹{discountAmount.toFixed(2)})</span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="text-xs text-slate-400 hover:text-rose-600 font-bold ml-2"
                >
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="space-y-1.5">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. MODERN20"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="w-full pl-9 pr-3 py-2 text-xs uppercase bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:border-amber-400 outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={couponLoading || !couponCode.trim()}
                    className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition disabled:opacity-50"
                  >
                    Apply
                  </button>
                </div>
                {couponError && (
                  <p className="text-[11px] text-rose-600 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    {couponError}
                  </p>
                )}
                {couponSuccess && (
                  <p className="text-[11px] text-emerald-600 flex items-center gap-1 mt-1">
                    <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                    {couponSuccess}
                  </p>
                )}
              </form>
            )}
          </div>

          {shippingEstimate > 0 ? (
            <div className="p-3.5 bg-amber-50 rounded-xl text-xs text-amber-900 border border-amber-200/60 leading-relaxed">
              Add <strong>₹{(100 - cartSubtotal).toFixed(2)}</strong> more to your bag to enjoy <strong>Free Shipping</strong>!
            </div>
          ) : (
            <div className="p-3.5 bg-emerald-50 rounded-xl text-xs text-emerald-900 border border-emerald-200/60 font-semibold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>You've unlocked Free Worldwide Shipping!</span>
            </div>
          )}

          <button
            onClick={() => navigate('/checkout')}
            className="w-full py-4 bg-[#ffcd05] hover:bg-[#fcb424] text-[#0a0500] font-black uppercase tracking-wider text-xs rounded-full shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="pt-3 border-t border-neutral-100 space-y-2 text-[11px] text-slate-500">
            <div className="flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Encrypted 256-bit SSL Secure Checkout</span>
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>30-Day Hassle-Free Returns Guarantee</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
