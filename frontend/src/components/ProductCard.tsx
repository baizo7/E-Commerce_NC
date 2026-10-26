import React from 'react';
import { Link } from 'react-router-dom';
import { Star, ShoppingCart, Store, Check, AlertCircle } from 'lucide-react';
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

  const discountPercent =
    product.compare_at_price && Number(product.compare_at_price) > Number(product.price)
      ? Math.round(
          ((Number(product.compare_at_price) - Number(product.price)) /
            Number(product.compare_at_price)) *
            100
        )
      : null;

  return (
    <div className="group relative bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300 flex flex-col h-full">
      {/* Product Image & Badges */}
      <Link to={`/products/${product.slug}`} className="relative block aspect-[4/3] overflow-hidden bg-slate-100">
        <img
          src={product.primary_image || 'https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=600&q=80'}
          alt={product.title}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Discount Badge */}
        {discountPercent && (
          <span className="absolute top-3 left-3 bg-rose-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm">
            Save {discountPercent}%
          </span>
        )}

        {/* Stock Status Badge */}
        {!product.is_in_stock ? (
          <span className="absolute top-3 right-3 bg-slate-900/85 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            Out of Stock
          </span>
        ) : product.inventory_count <= (product.low_stock_threshold || 5) ? (
          <span className="absolute top-3 right-3 bg-amber-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
            <AlertCircle className="w-3 h-3" />
            Only {product.inventory_count} left
          </span>
        ) : null}
      </Link>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Vendor Tag */}
        {product.vendor_name && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5">
            <Store className="w-3.5 h-3.5 text-indigo-500" />
            <Link
              to={`/vendors/${product.vendor_slug}`}
              className="hover:text-indigo-600 font-medium truncate"
            >
              {product.vendor_name}
            </Link>
          </div>
        )}

        {/* Title */}
        <Link to={`/products/${product.slug}`} className="block flex-1">
          <h3 className="font-semibold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
            {product.title}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-1 mt-2">
          <div className="flex items-center text-amber-400">
            <Star className="w-3.5 h-3.5 fill-current" />
          </div>
          <span className="text-xs font-bold text-slate-700">{Number(product.rating || 5).toFixed(1)}</span>
          <span className="text-[11px] text-slate-400">({product.review_count || 0})</span>
        </div>

        {/* Price & Add to Cart button */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-slate-900">${Number(product.price).toFixed(2)}</span>
              {product.compare_at_price && (
                <span className="text-xs text-slate-400 line-through">
                  ${Number(product.compare_at_price).toFixed(2)}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={!product.is_in_stock || loading}
            className={`p-2.5 rounded-xl transition shadow-sm flex items-center justify-center ${
              !product.is_in_stock
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100'
            }`}
            title="Add to Cart"
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
