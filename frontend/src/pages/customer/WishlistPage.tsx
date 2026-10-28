import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2, ArrowRight, Store, Package } from 'lucide-react';
import { wishlistService } from '../../services/api';
import { WishlistItem } from '../../types';
import { useCart } from '../../context/CartContext';

export const WishlistPage: React.FC = () => {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const { addToCart } = useCart();

  const fetchWishlist = async () => {
    setLoading(true);
    try {
      const data = await wishlistService.getWishlist();
      setItems(data);
    } catch (err) {
      console.error('Failed to load wishlist:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleRemove = async (productId: number) => {
    try {
      setActionLoading(productId);
      await wishlistService.toggleWishlist(productId);
      setItems((prev) => prev.filter((item) => item.product.id !== productId));
    } catch (err) {
      console.error('Failed to remove from wishlist:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleMoveToCart = async (productId: number) => {
    try {
      setActionLoading(productId);
      await addToCart(productId, 1);
      await wishlistService.toggleWishlist(productId);
      setItems((prev) => prev.filter((item) => item.product.id !== productId));
    } catch (err) {
      console.error('Failed to move to cart:', err);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="h-8 w-48 bg-slate-200 animate-pulse rounded-lg mb-8"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white p-4 rounded-2xl border border-slate-200 animate-pulse space-y-4">
              <div className="aspect-[3/4] bg-slate-200 rounded-xl"></div>
              <div className="h-4 bg-slate-200 rounded w-3/4"></div>
              <div className="h-4 bg-slate-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-950 flex items-center gap-2.5">
            <Heart className="w-7 h-7 text-rose-500 fill-rose-500" />
            Saved Wishlist
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Keep track of items you love and move them directly to your cart whenever you are ready.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1.5 rounded-full bg-slate-100 text-xs font-bold text-slate-700">
            {items.length} {items.length === 1 ? 'item' : 'items'} saved
          </span>
        </div>
      </div>

      {/* Content */}
      {items.length === 0 ? (
        <div className="text-center py-20 px-4 bg-white rounded-3xl border border-slate-200 shadow-xs max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
            <Heart className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-slate-900">Your wishlist is empty</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Explore our curated selection of verified modern products and tap the heart icon on any product to save it here.
          </p>
          <div className="pt-2">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-6 py-3 bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-full shadow-md transition"
            >
              Start Shopping <ArrowRight className="w-4 h-4 text-amber-400" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((item) => {
            const p = item.product;
            const priceNum = Number(p.price);
            const compareNum = p.compare_at_price ? Number(p.compare_at_price) : null;
            const hasDiscount = compareNum && compareNum > priceNum;

            return (
              <div
                key={item.id}
                className="group relative bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
              >
                {/* Image */}
                <div className="relative aspect-[3/4] bg-slate-100 overflow-hidden">
                  <Link to={`/products/${p.slug}`}>
                    <img
                      src={p.primary_image || 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=600&q=80'}
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </Link>

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemove(p.id)}
                    disabled={actionLoading === p.id}
                    className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-400 hover:text-rose-600 shadow-sm flex items-center justify-center transition"
                    title="Remove from wishlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {/* Discount Badge */}
                  {hasDiscount && (
                    <span className="absolute top-2.5 left-2.5 bg-amber-400 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-sm">
                      SALE
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    {p.vendor_name && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium mb-1 truncate">
                        <Store className="w-3 h-3 text-amber-500 flex-shrink-0" />
                        <span className="truncate">{p.vendor_name}</span>
                      </div>
                    )}
                    <Link to={`/products/${p.slug}`}>
                      <h4 className="font-bold text-slate-900 text-sm line-clamp-2 hover:text-amber-600 transition">
                        {p.title}
                      </h4>
                    </Link>
                  </div>

                  <div>
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-base font-black text-slate-950">
                        ${priceNum.toFixed(2)}
                      </span>
                      {hasDiscount && compareNum && (
                        <span className="text-xs text-slate-400 line-through">
                          ${compareNum.toFixed(2)}
                        </span>
                      )}
                    </div>

                    {/* Move to Cart */}
                    <button
                      onClick={() => handleMoveToCart(p.id)}
                      disabled={!p.is_in_stock || actionLoading === p.id}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                        !p.is_in_stock
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-amber-400 hover:bg-amber-500 text-slate-950 shadow-xs'
                      }`}
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      {!p.is_in_stock ? 'Sold Out' : 'Move to Cart'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
