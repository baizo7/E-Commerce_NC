import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, ShoppingBag, Store, ShieldCheck, Tag, Check, Sparkles } from 'lucide-react';
import { AssistantProductCard } from '../../services/assistantService';
import { useCart } from '../../context/CartContext';

interface ProductRecommendationCardProps {
  product: AssistantProductCard;
  onProductClick?: () => void;
}

export const ProductRecommendationCard: React.FC<ProductRecommendationCardProps> = ({
  product,
  onProductClick
}) => {
  const { addToCart } = useCart();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setAdding(true);
      await addToCart(product.id, 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch {
      // Handled in CartContext
    } finally {
      setAdding(false);
    }
  };

  const hasDiscount = product.discount_percent && product.discount_percent > 0;
  const ratingValue = product.rating ?? product.raw_rating ?? 0;
  const reviewCount = product.review_count ?? 0;

  return (
    <div className="flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 w-64 shrink-0 text-left">
      {/* Product Image & Badges */}
      <div className="relative h-36 w-full bg-slate-100 overflow-hidden">
        {product.primary_image ? (
          <img
            src={product.primary_image}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
            <ShoppingBag className="w-8 h-8 opacity-40" />
          </div>
        )}

        {/* Discount Badge */}
        {hasDiscount && (
          <span className="absolute top-2 left-2 bg-[#ffcd05] text-[#0a0500] text-[11px] font-black px-2 py-0.5 rounded shadow-xs flex items-center gap-1">
            <Tag className="w-3 h-3" />
            {product.discount_percent}% OFF
          </span>
        )}

        {/* In Stock Badge */}
        {product.inventory_count !== undefined && product.inventory_count > 0 && (
          <span className="absolute top-2 right-2 bg-emerald-600/90 backdrop-blur-xs text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
            In Stock
          </span>
        )}
      </div>

      {/* Product Content */}
      <div className="p-3 flex flex-col flex-1 justify-between gap-2">
        <div>
          {/* Vendor info */}
          <div className="flex items-center gap-1 text-[11px] text-slate-500 mb-1">
            <Store className="w-3 h-3 shrink-0" />
            <span className="truncate">{product.vendor_name}</span>
          </div>

          {/* Title */}
          <Link
            to={product.pdp_url || `/products/${product.slug}`}
            onClick={onProductClick}
            className="font-semibold text-slate-900 text-xs line-clamp-2 hover:text-[#0a0500] hover:underline"
          >
            {product.title}
          </Link>

          {/* Recommendation Reason Pill */}
          {product.recommendation_reason && (
            <div className="mt-1.5 flex items-start gap-1 bg-amber-50 border border-amber-200/80 rounded px-2 py-1 text-[10px] text-amber-900 font-medium">
              <Sparkles className="w-3 h-3 text-[#ffcd05] shrink-0 mt-0.5 fill-[#ffcd05]" />
              <span className="line-clamp-2">{product.recommendation_reason}</span>
            </div>
          )}

          {/* Coupon if applicable */}
          {product.applicable_coupon && (
            <div className="mt-1 flex items-center gap-1 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5 text-[10px] text-emerald-800 font-semibold">
              <Tag className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
              <span>Coupon {product.applicable_coupon.code}: save ₹{product.applicable_coupon.coupon_savings}</span>
            </div>
          )}

          {/* Ratings & Verified Badge */}
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-800">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{ratingValue.toFixed(1)}</span>
              <span className="text-slate-400 font-normal">({reviewCount})</span>
            </div>

            {product.verified_buyer_pct && product.verified_buyer_pct > 0 ? (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">
                <ShieldCheck className="w-2.5 h-2.5" />
                {product.verified_buyer_pct}% verified
              </span>
            ) : null}
          </div>
        </div>

        {/* Pricing & Add to Cart Action */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-bold text-slate-900">
                ₹{Number(product.current_price ?? (product as any).price ?? 0).toLocaleString()}
              </span>
              {product.compare_at_price && Number(product.compare_at_price) > Number(product.current_price ?? (product as any).price ?? 0) && (
                <span className="text-[11px] text-slate-400 line-through">
                  ₹{Number(product.compare_at_price).toLocaleString()}
                </span>
              )}
            </div>
            {product.savings_amount && product.savings_amount > 0 ? (
              <span className="text-[10px] text-emerald-700 font-semibold block">
                Save ₹{product.savings_amount.toLocaleString()}
              </span>
            ) : null}
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={adding}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
              added
                ? 'bg-emerald-600 text-white'
                : 'bg-[#0a0500] hover:bg-slate-800 text-white'
            }`}
            title="Quick add to cart"
          >
            {added ? (
              <>
                <Check className="w-3 h-3" />
                <span>Added</span>
              </>
            ) : adding ? (
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ShoppingBag className="w-3 h-3" />
                <span>Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
