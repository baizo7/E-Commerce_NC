import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, ArrowRight, Store, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

export const CartPage: React.FC = () => {
  const { cart, loading, updateQuantity, removeItem, clearCart, cartSubtotal, cartCount } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ShoppingCart className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Your Cart is Waiting</h2>
        <p className="text-sm text-slate-500 mt-2 mb-6">
          Please sign in to view your multi-vendor shopping cart and complete your checkout.
        </p>
        <Link
          to="/login"
          className="inline-block px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl text-sm shadow hover:bg-indigo-700 transition"
        >
          Sign In to Continue
        </Link>
      </div>
    );
  }

  if (cartCount === 0 || !cart?.items?.length) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
        <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ShoppingCart className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Your Cart is Empty</h2>
        <p className="text-sm text-slate-500 mt-2 mb-6">
          Discover unique products from independent vendors across the marketplace.
        </p>
        <Link
          to="/products"
          className="inline-block px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl text-sm shadow hover:bg-indigo-700 transition"
        >
          Start Browsing Catalog
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

  const shippingEstimate = cartSubtotal >= 100 ? 0 : 10.0;
  const taxEstimate = +(cartSubtotal * 0.05).toFixed(2);
  const grandTotal = +(cartSubtotal + shippingEstimate + taxEstimate).toFixed(2);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Shopping Cart</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {cartCount} item{cartCount > 1 ? 's' : ''} from {Object.keys(itemsByVendor).length} merchant{Object.keys(itemsByVendor).length > 1 ? 's' : ''}
          </p>
        </div>

        <button
          onClick={clearCart}
          className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1.5 p-2"
        >
          <Trash2 className="w-3.5 h-3.5" /> Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Items grouped by Vendor */}
        <div className="lg:col-span-2 space-y-6">
          {Object.entries(itemsByVendor).map(([vId, group]) => (
            <div key={vId} className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
              {/* Vendor Package Banner */}
              <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-800">
                    Package from: <span className="text-indigo-600">{group.vendorName}</span>
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-slate-500">
                  {group.items.length} item{group.items.length > 1 ? 's' : ''}
                </span>
              </div>

              {/* Items List */}
              <div className="divide-y divide-slate-100">
                {group.items.map((item) => (
                  <div key={item.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <img
                      src={item.product.primary_image || 'https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=200&q=80'}
                      alt={item.product.title}
                      className="w-20 h-20 rounded-xl object-cover border border-slate-100 flex-shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/products/${item.product.slug}`}
                        className="font-semibold text-sm text-slate-900 hover:text-indigo-600 transition truncate block"
                      >
                        {item.product.title}
                      </Link>
                      <div className="text-xs text-slate-500 mt-0.5">
                        ${Number(item.product.price).toFixed(2)} each
                      </div>
                      {item.product.inventory_count <= (item.product.low_stock_threshold || 5) && (
                        <span className="text-[11px] font-medium text-amber-600">
                          Low stock: only {item.product.inventory_count} remaining
                        </span>
                      )}
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={loading}
                          className="px-2.5 py-1 text-xs font-bold hover:bg-slate-200 transition"
                        >
                          -
                        </button>
                        <span className="px-3 py-1 text-xs font-bold text-slate-900">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={loading || item.quantity >= item.product.inventory_count}
                          className="px-2.5 py-1 text-xs font-bold hover:bg-slate-200 transition disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>

                      <span className="font-bold text-sm text-slate-900 min-w-[70px] text-right">
                        ${Number(item.subtotal).toFixed(2)}
                      </span>

                      <button
                        onClick={() => removeItem(item.id)}
                        disabled={loading}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
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

        {/* Right Column: Order Summary */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-5 sticky top-24">
          <h3 className="font-bold text-slate-900 text-base">Order Summary</h3>

          <div className="space-y-2.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Items Subtotal</span>
              <span className="font-semibold text-slate-900">${cartSubtotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between">
              <span>Shipping (Multi-Vendor Combined)</span>
              <span>{shippingEstimate === 0 ? <strong className="text-emerald-600">FREE</strong> : `$${shippingEstimate.toFixed(2)}`}</span>
            </div>

            <div className="flex justify-between">
              <span>Estimated Sales Tax (5%)</span>
              <span className="font-semibold text-slate-900">${taxEstimate.toFixed(2)}</span>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline text-sm">
              <span className="font-bold text-slate-900">Grand Total</span>
              <span className="text-xl font-extrabold text-indigo-600">${grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {shippingEstimate > 0 && (
            <div className="p-3 bg-amber-50 rounded-xl text-[11px] text-amber-800 border border-amber-200/50">
              Add ${(100 - cartSubtotal).toFixed(2)} more to qualify for <strong>FREE shipping</strong>!
            </div>
          )}

          <button
            onClick={() => navigate('/checkout')}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 transition"
          >
            Proceed to Checkout
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="pt-2 flex items-center justify-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Secure 256-bit encrypted checkout</span>
          </div>
        </div>
      </div>
    </div>
  );
};
