import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Star,
  ShoppingCart,
  Store,
  ShieldCheck,
  Truck,
  Check,
  AlertTriangle,
  RotateCcw,
  Zap,
  ChevronRight
} from 'lucide-react';
import { productService } from '../../services/api';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { ProductCard } from '../../components/ProductCard';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addToCart, loading: cartLoading } = useCart();
  const { user } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'reviews'>('desc');

  // Review Form state
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewTitle, setReviewTitle] = useState<string>('');
  const [reviewComment, setReviewComment] = useState<string>('');
  const [reviewSubmitting, setReviewSubmitting] = useState<boolean>(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState<boolean>(false);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        const data = await productService.getProductDetail(slug);
        setProduct(data);
        setSelectedImage(data.primary_image || (data.images?.[0]?.image_url ?? ''));

        // Fetch related products from the same category or marketplace
        try {
          const catId = typeof data.category === 'object' && data.category ? data.category.id : data.category;
          const relatedRes = await productService.getProducts(catId ? { category: String(catId) } : {});
          const relatedList: Product[] = (relatedRes as any).results || relatedRes;
          setRelatedProducts(relatedList.filter((p) => p.id !== data.id).slice(0, 4));
        } catch {
          // ignore related product error
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [slug]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-8 max-w-7xl mx-auto py-12 px-4 sm:px-6">
        <div className="h-4 w-48 bg-slate-200 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="aspect-[4/5] bg-slate-200 rounded-2xl"></div>
          <div className="space-y-6">
            <div className="h-6 bg-slate-200 rounded w-1/4"></div>
            <div className="h-10 bg-slate-200 rounded w-3/4"></div>
            <div className="h-6 bg-slate-200 rounded w-1/3"></div>
            <div className="h-24 bg-slate-200 rounded w-full"></div>
            <div className="h-12 bg-slate-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-24 max-w-md mx-auto px-4">
        <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-500 mx-auto flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-[#0a0500] uppercase tracking-wide">Product Not Found</h2>
        <p className="text-sm text-[#504e4a] mt-2">The product you are looking for may have been archived or moved.</p>
        <Link
          to="/products"
          className="mt-6 inline-block px-7 py-3 bg-[#0a0500] hover:bg-neutral-800 text-white text-xs font-black uppercase tracking-wider rounded-full transition"
        >
          Return to Shop
        </Link>
      </div>
    );
  }

  const handleAddToCart = async () => {
    try {
      await addToCart(product.id, quantity);
    } catch {
      // Notification handled in context
    }
  };

  const handleBuyNow = async () => {
    try {
      await addToCart(product.id, quantity);
      navigate('/checkout');
    } catch {
      // Error handled in context
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setReviewError('You must be logged in to leave a review.');
      return;
    }
    setReviewSubmitting(true);
    setReviewError(null);
    try {
      await productService.createReview(product.slug, {
        rating: reviewRating,
        title: reviewTitle,
        comment: reviewComment,
      });
      setReviewSuccess(true);
      // Refresh product data
      const updated = await productService.getProductDetail(product.slug);
      setProduct(updated);
      setReviewTitle('');
      setReviewComment('');
    } catch (err: any) {
      setReviewError(err.response?.data?.error || 'Failed to submit review. You may have already reviewed this item.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const vendorObj = typeof product.vendor === 'object' ? product.vendor : null;
  const vendorName = vendorObj?.store_name || product.vendor_name || 'Verified Merchant';
  const vendorSlug = vendorObj?.slug || product.vendor_slug;
  const categoryName = typeof product.category === 'object' && product.category ? product.category.name : product.category_name;

  const priceNum = Number(product.price);
  const compareNum = product.compare_at_price ? Number(product.compare_at_price) : null;
  const isOnSale = compareNum !== null && compareNum > priceNum;
  const discountPercent = isOnSale && compareNum ? Math.round(((compareNum - priceNum) / compareNum) * 100) : null;

  return (
    <div className="space-y-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Modern Shop Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
        <Link to="/" className="hover:text-[#0a0500] transition">
          Home
        </Link>
        <ChevronRight className="w-3 h-3 text-slate-300" />
        <Link to="/products" className="hover:text-[#0a0500] transition">
          Shop
        </Link>
        {categoryName && (
          <>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <span className="text-slate-500">{categoryName}</span>
          </>
        )}
        <ChevronRight className="w-3 h-3 text-slate-300" />
        <span className="text-[#0a0500] truncate max-w-xs">{product.title}</span>
      </nav>

      {/* Main Product Showcase Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-14 items-start">
        {/* Images Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-[4/5] bg-neutral-100 rounded-2xl overflow-hidden border border-neutral-200/80 shadow-sm group">
            <img
              src={selectedImage || 'https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=800&q=80'}
              alt={product.title}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
            />

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-10 pointer-events-none">
              {isOnSale && (
                <span className="bg-[#ffcd05] text-[#0a0500] text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded shadow-sm">
                  SALE {discountPercent}%
                </span>
              )}
              {product.is_featured && (
                <span className="bg-[#0a0500] text-white text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded shadow-sm">
                  HOT
                </span>
              )}
            </div>
          </div>

          {/* Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img.image_url)}
                  className={`w-20 h-24 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                    selectedImage === img.image_url ? 'border-[#0a0500] shadow-md scale-102' : 'border-neutral-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details & Actions */}
        <div className="space-y-6">
          {/* Vendor Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 text-xs font-medium text-slate-700">
            <Store className="w-3.5 h-3.5 text-[#fcb424]" />
            <span className="text-slate-500">Sold by:</span>
            {vendorSlug ? (
              <Link to={`/vendors/${vendorSlug}`} className="font-bold text-[#0a0500] hover:underline">
                {vendorName}
              </Link>
            ) : (
              <span className="font-bold text-[#0a0500]">{vendorName}</span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0a0500] tracking-tight leading-tight">
            {product.title}
          </h1>

          {/* Rating & Reviews Bar */}
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center text-[#ffcd05]">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.floor(Number(product.rating || 5)) ? 'fill-[#ffcd05]' : 'text-neutral-300 fill-transparent'
                  }`}
                />
              ))}
            </div>
            <span className="font-bold text-[#0a0500]">{Number(product.rating || 5).toFixed(1)}</span>
            <span className="text-slate-400">·</span>
            <button
              onClick={() => setActiveTab('reviews')}
              className="text-[#504e4a] hover:text-[#0a0500] font-semibold underline underline-offset-4"
            >
              {product.review_count || product.reviews?.length || 0} Customer Reviews
            </button>
          </div>

          {/* Modern Shop Price Block */}
          <div className="flex items-baseline gap-3 py-2">
            <span className="text-3xl sm:text-4xl font-black text-[#0a0500] tracking-tight">
              ${priceNum.toFixed(2)}
            </span>
            {isOnSale && compareNum && (
              <>
                <span className="text-xl text-neutral-400 line-through font-semibold">
                  ${compareNum.toFixed(2)}
                </span>
                <span className="px-2.5 py-1 rounded bg-amber-100 text-[#0a0500] font-black text-xs uppercase tracking-wide">
                  Save ${(compareNum - priceNum).toFixed(2)}
                </span>
              </>
            )}
          </div>

          {/* Short description */}
          <p className="text-sm text-[#504e4a] leading-relaxed">
            {product.short_description || product.description}
          </p>

          {/* Stock Indicator */}
          <div className="pt-1">
            {product.inventory_count > 0 ? (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>In Stock ({product.inventory_count} units available)</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Currently Out of Stock</span>
              </div>
            )}
          </div>

          {/* Quantity Selector & Action Buttons */}
          {product.inventory_count > 0 && (
            <div className="space-y-4 pt-4 border-t border-neutral-200">
              <div className="flex flex-wrap items-center gap-4">
                {/* Stepper */}
                <div className="inline-flex items-center border-2 border-neutral-200 rounded-full bg-white overflow-hidden shadow-sm">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 flex items-center justify-center text-slate-700 hover:bg-neutral-100 font-bold transition"
                  >
                    -
                  </button>
                  <span className="w-10 text-center text-sm font-black text-[#0a0500]">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.inventory_count, quantity + 1))}
                    className="w-10 h-10 flex items-center justify-center text-slate-700 hover:bg-neutral-100 font-bold transition"
                  >
                    +
                  </button>
                </div>

                {/* Add to Cart button (Blocksy Modern Shop yellow style) */}
                <button
                  onClick={handleAddToCart}
                  disabled={cartLoading}
                  className="flex-1 min-w-[200px] px-8 py-3.5 bg-[#ffcd05] hover:bg-[#fcb424] text-[#0a0500] font-black uppercase tracking-wider text-xs rounded-full shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <ShoppingCart className="w-4 h-4 text-[#0a0500]" />
                  Add to Cart
                </button>

                {/* Buy Now button */}
                <button
                  onClick={handleBuyNow}
                  disabled={cartLoading}
                  className="px-8 py-3.5 bg-[#0a0500] hover:bg-neutral-800 text-white font-bold uppercase tracking-wider text-xs rounded-full shadow-md hover:shadow-lg transition flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  <Zap className="w-3.5 h-3.5 text-[#ffcd05]" />
                  Buy Now
                </button>
              </div>
            </div>
          )}

          {/* Blocksy Modern Shop Guarantee Perks Box */}
          <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-3.5 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#ffcd05]/20 flex items-center justify-center flex-shrink-0 text-[#0a0500]">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-[#0a0500] block">Free Shipping Available</span>
                <span className="text-slate-500">Free standard delivery on orders over $100</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#ffcd05]/20 flex items-center justify-center flex-shrink-0 text-[#0a0500]">
                <RotateCcw className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-[#0a0500] block">30-Day Money Back Guarantee</span>
                <span className="text-slate-500">Return or exchange any unworn product within 30 days</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#ffcd05]/20 flex items-center justify-center flex-shrink-0 text-[#0a0500]">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-[#0a0500] block">Certified Independent Merchant</span>
                <span className="text-slate-500">Authentic products protected by buyer escrow guarantees</span>
              </div>
            </div>
          </div>

          {/* Product Meta */}
          <div className="pt-2 border-t border-neutral-200 text-xs text-slate-500 space-y-1">
            {product.sku && (
              <div>
                <span className="font-bold text-slate-700">SKU:</span> {product.sku}
              </div>
            )}
            {categoryName && (
              <div>
                <span className="font-bold text-slate-700">Category:</span> {categoryName}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs: Description vs Specifications vs Reviews */}
      <div className="pt-10 border-t border-neutral-200">
        <div className="flex items-center gap-8 border-b border-neutral-200 mb-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('desc')}
            className={`pb-4 text-xs font-black uppercase tracking-wider transition border-b-2 whitespace-nowrap ${
              activeTab === 'desc'
                ? 'border-[#0a0500] text-[#0a0500]'
                : 'border-transparent text-slate-400 hover:text-slate-800'
            }`}
          >
            Description
          </button>
          <button
            onClick={() => setActiveTab('specs')}
            className={`pb-4 text-xs font-black uppercase tracking-wider transition border-b-2 whitespace-nowrap ${
              activeTab === 'specs'
                ? 'border-[#0a0500] text-[#0a0500]'
                : 'border-transparent text-slate-400 hover:text-slate-800'
            }`}
          >
            Specifications
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-4 text-xs font-black uppercase tracking-wider transition border-b-2 whitespace-nowrap ${
              activeTab === 'reviews'
                ? 'border-[#0a0500] text-[#0a0500]'
                : 'border-transparent text-slate-400 hover:text-slate-800'
            }`}
          >
            Reviews ({product.reviews?.length || product.review_count || 0})
          </button>
        </div>

        {/* Tab 1: Description */}
        {activeTab === 'desc' && (
          <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 sm:p-10 space-y-4 max-w-4xl">
            <h3 className="font-black text-[#0a0500] uppercase text-sm tracking-wider">Product Story & Craftsmanship</h3>
            <div className="text-sm text-[#504e4a] leading-relaxed whitespace-pre-line">
              {product.description || product.short_description}
            </div>
          </div>
        )}

        {/* Tab 2: Specifications */}
        {activeTab === 'specs' && (
          <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 sm:p-10 max-w-4xl">
            <h3 className="font-black text-[#0a0500] uppercase text-sm tracking-wider mb-6">Technical Details</h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm divide-y sm:divide-y-0 divide-neutral-100">
              <div className="flex justify-between py-2 border-b border-neutral-100">
                <dt className="text-slate-500">Merchant Store</dt>
                <dd className="font-bold text-[#0a0500]">{vendorName}</dd>
              </div>
              <div className="flex justify-between py-2 border-b border-neutral-100">
                <dt className="text-slate-500">Category</dt>
                <dd className="font-bold text-[#0a0500]">{categoryName || 'General Goods'}</dd>
              </div>
              <div className="flex justify-between py-2 border-b border-neutral-100">
                <dt className="text-slate-500">SKU Identifier</dt>
                <dd className="font-bold text-[#0a0500]">{product.sku || 'N/A'}</dd>
              </div>
              <div className="flex justify-between py-2 border-b border-neutral-100">
                <dt className="text-slate-500">Inventory Status</dt>
                <dd className="font-bold text-emerald-600">
                  {product.inventory_count > 0 ? `${product.inventory_count} Available` : 'Backordered'}
                </dd>
              </div>
              <div className="flex justify-between py-2 border-b border-neutral-100">
                <dt className="text-slate-500">Dispatch Location</dt>
                <dd className="font-bold text-[#0a0500]">Verified Merchant Hub</dd>
              </div>
              <div className="flex justify-between py-2 border-b border-neutral-100">
                <dt className="text-slate-500">Warranty / Protection</dt>
                <dd className="font-bold text-[#0a0500]">30 Days Comprehensive</dd>
              </div>
            </dl>
          </div>
        )}

        {/* Tab 3: Reviews */}
        {activeTab === 'reviews' && (
          <div className="space-y-10 max-w-4xl">
            {/* Write a review box */}
            <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 sm:p-8 shadow-sm">
              <h3 className="font-black text-[#0a0500] uppercase text-sm tracking-wider mb-1">Leave A Customer Review</h3>
              <p className="text-xs text-slate-500 mb-6">Your honest feedback directly informs creators and prospective buyers.</p>

              {reviewSuccess ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
                  <Check className="w-5 h-5 text-emerald-600" />
                  <span>Thank you! Your verified review has been submitted and published.</span>
                </div>
              ) : (
                <form onSubmit={handleReviewSubmit} className="space-y-5 max-w-xl">
                  {reviewError && (
                    <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-medium">
                      {reviewError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Overall Rating</label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setReviewRating(star)}
                          className="p-1 transition hover:scale-110"
                        >
                          <Star
                            className={`w-6 h-6 ${
                              star <= reviewRating ? 'fill-[#ffcd05] text-[#ffcd05]' : 'text-neutral-200 fill-transparent'
                            }`}
                          />
                        </button>
                      ))}
                      <span className="text-xs font-black text-[#0a0500] ml-2">{reviewRating} of 5 Stars</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Review Headline</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Exceptional durability and stunning craftsmanship"
                      value={reviewTitle}
                      onChange={(e) => setReviewTitle(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-[#0a0500] focus:bg-white transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Detailed Feedback</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Write your honest review on quality, fit, finish, and vendor communication..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-[#0a0500] focus:bg-white transition"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={reviewSubmitting}
                    className="px-8 py-3 bg-[#0a0500] hover:bg-neutral-800 text-white font-black uppercase tracking-wider text-xs rounded-full transition disabled:opacity-50"
                  >
                    {reviewSubmitting ? 'Posting Review...' : 'Submit Review'}
                  </button>
                </form>
              )}
            </div>

            {/* Existing reviews list */}
            <div className="space-y-4">
              {product.reviews && product.reviews.length > 0 ? (
                product.reviews.map((rev) => (
                  <div key={rev.id} className="bg-white border border-neutral-200/90 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#ffcd05] text-[#0a0500] font-black flex items-center justify-center text-xs">
                          {rev.customer_name[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <span className="font-bold text-sm text-[#0a0500] block leading-tight">
                            {rev.customer_name}
                          </span>
                          <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                            <Check className="w-3 h-3" /> Verified Buyer
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center text-[#ffcd05]">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < rev.rating ? 'fill-[#ffcd05]' : 'text-neutral-200 fill-transparent'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {rev.title && <h4 className="font-bold text-sm text-[#0a0500] mt-1">{rev.title}</h4>}
                    <p className="text-xs text-[#504e4a] mt-1.5 leading-relaxed">{rev.comment}</p>
                    <span className="text-[11px] text-slate-400 block mt-3">
                      {new Date(rev.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))
              ) : (
                <div className="bg-white border border-neutral-200 rounded-2xl p-10 text-center text-slate-500 text-sm">
                  No customer reviews yet. Be the first to share your thoughts on this product!
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Related Products Section (Modern Shop 4-Col Grid) */}
      {relatedProducts.length > 0 && (
        <section className="pt-16 border-t border-neutral-200 space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-[#fcb424]">Related Collection</span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0a0500] uppercase tracking-tight">
              You Might Also Like
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
