import React from 'react';
import { Link } from 'react-router-dom';
import { Star, ShoppingBag, Store, AlertCircle } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, loading } = useCart();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await addToCart(product.id, 1);
    } catch {
      // Handled in context
    }
  };

  const hasDiscount = product.compare_at_price && Number(product.compare_at_price) > Number(product.price);
  const discountPercent = hasDiscount
    ? Math.round(
        ((Number(product.compare_at_price) - Number(product.price)) /
          Number(product.compare_at_price)) *
          100
      )
    : null;

  return (
    <div className="group relative bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-amber-400 transition-all duration-300 flex flex-col h-full">
      {/* Product Image & Badges (3:4 Portrait Ratio matching Modern Shop) */}
      <Link to={`/products/${product.slug}`} className="relative block aspect-[3/4] overflow-hidden bg-slate-100">
        <img
          src={product.primary_image || 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=600&q=80'}
          alt={product.title}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Modern Shop "SALE" Tag */}
        {hasDiscount ? (
          <span className="absolute top-3 left-3 bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded shadow-sm">
            SALE {discountPercent ? `-${discountPercent}%` : ''}
          </span>
        ) : product.is_featured ? (
          <span className="absolute top-3 left-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded shadow-sm">
            HOT
          </span>
        ) : null}

        {/* Stock Status Badge */}
        {!product.is_in_stock ? (
          <span className="absolute top-3 right-3 bg-slate-950/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded">
            Out of Stock
          </span>
        ) : product.inventory_count <= (product.low_stock_threshold || 5) ? (
          <span className="absolute top-3 right-3 bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow-sm">
            Only {product.inventory_count} left
          </span>
        ) : null}

        {/* Quick Add Overlay on Hover */}
        <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none group-hover:pointer-events-auto">
          <button
            onClick={handleAddToCart}
            disabled={!product.is_in_stock || loading}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold shadow-lg flex items-center justify-center gap-2 transition transform active:scale-95 ${
              !product.is_in_stock
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-amber-400 hover:bg-amber-500 text-slate-950 shadow-amber-500/20'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            {!product.is_in_stock ? 'Sold Out' : 'Quick Add to Cart'}
          </button>
        </div>
      </Link>

      {/* Content Area */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
        <div>
          {/* Category / Vendor Tag */}
          <div className="flex items-center justify-between gap-1 text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
            <span>{product.category_name || 'Lifestyle'}</span>
            {product.vendor_name && (
              <Link
                to={`/vendors/${product.vendor_slug}`}
                className="hover:text-amber-600 truncate text-[10px] text-slate-500 font-normal lowercase tracking-normal flex items-center gap-1"
              >
                <Store className="w-3 h-3 text-amber-500" />
                {product.vendor_name}
              </Link>
            )}
          </div>

          {/* Title */}
          <Link to={`/products/${product.slug}`} className="block">
            <h3 className="font-bold text-slate-900 text-sm group-hover:text-amber-600 transition-colors line-clamp-2 leading-snug">
              {product.title}
            </h3>
          </Link>
        </div>

        <div>
          {/* Star Rating */}
          <div className="flex items-center gap-1 my-1">
            <div className="flex items-center text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${
                    i < Math.floor(Number(product.rating || 5)) ? 'fill-amber-400' : 'text-slate-200'
                  }`}
                />
              ))}
            </div>
            <span className="text-[11px] font-bold text-slate-700 ml-1">
              {Number(product.rating || 5).toFixed(1)}
            </span>
            <span className="text-[10px] text-slate-400">({product.review_count || 0})</span>
          </div>

          {/* Price & Action */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
            <div className="flex items-baseline gap-2">
              <span className="text-base font-extrabold text-slate-950">
                ${Number(product.price).toFixed(2)}
              </span>
              {product.compare_at_price && (
                <span className="text-xs text-slate-400 line-through">
                  ${Number(product.compare_at_price).toFixed(2)}
                </span>
              )}
            </div>

            <button
              onClick={handleAddToCart}
              disabled={!product.is_in_stock || loading}
              className={`sm:hidden p-2 rounded-lg text-xs font-bold transition ${
                !product.is_in_stock
                  ? 'bg-slate-100 text-slate-400'
                  : 'bg-amber-400 hover:bg-amber-500 text-slate-950'
              }`}
              title="Add to Cart"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
