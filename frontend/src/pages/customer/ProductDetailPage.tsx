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
  ArrowLeft,
  Share2,
  Heart
} from 'lucide-react';
import { productService } from '../../services/api';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addToCart, loading: cartLoading } = useCart();
  const { user } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'desc' | 'reviews'>('desc');

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
      <div className="animate-pulse space-y-8 max-w-6xl mx-auto py-10">
        <div className="h-6 w-32 bg-slate-200 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="aspect-square bg-slate-200 rounded-3xl"></div>
          <div className="space-y-4">
            <div className="h-8 bg-slate-200 rounded w-3/4"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
            <div className="h-12 bg-slate-200 rounded w-1/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-slate-800">Product Not Found</h2>
        <p className="text-sm text-slate-500 mt-2">The product you are looking for may have been delisted or does not exist.</p>
        <Link to="/products" className="mt-4 inline-block px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl text-sm">
          Return to Catalog
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

  return (
    <div className="space-y-12 max-w-6xl mx-auto">
      {/* Breadcrumb navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/products" className="hover:text-indigo-600 flex items-center gap-1 font-medium">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Products
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-semibold truncate max-w-md">{product.title}</span>
      </div>

      {/* Main Product Showcase Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Images Gallery */}
        <div className="space-y-4">
          <div className="aspect-square bg-slate-100 rounded-3xl overflow-hidden border border-slate-200 shadow-sm relative">
            <img
              src={selectedImage || 'https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=800&q=80'}
              alt={product.title}
              className="w-full h-full object-cover object-center"
            />
          </div>

          {/* Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img.image_url)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition flex-shrink-0 ${
                    selectedImage === img.image_url ? 'border-indigo-600 shadow-md' : 'border-slate-200 opacity-70 hover:opacity-100'
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
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs">
            <Store className="w-4 h-4 text-indigo-600" />
            <span className="text-slate-500">Sold & Dispatched by:</span>
            {vendorSlug ? (
              <Link to={`/vendors/${vendorSlug}`} className="font-bold text-indigo-600 hover:underline">
                {vendorName}
              </Link>
            ) : (
              <span className="font-bold text-slate-800">{vendorName}</span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
            {product.title}
          </h1>

          {/* Rating & SKU */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1 bg-amber-50 text-amber-900 px-2.5 py-1 rounded-lg border border-amber-200/60 font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span>{Number(product.rating || 5).toFixed(1)}</span>
              <span className="text-slate-400 font-normal">({product.review_count || 0} reviews)</span>
            </div>
            {product.sku && <span className="text-slate-400">SKU: {product.sku}</span>}
          </div>

          {/* Price */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-baseline gap-3">
            <span className="text-3xl font-extrabold text-slate-900">
              ${Number(product.price).toFixed(2)}
            </span>
            {product.compare_at_price && (
              <>
                <span className="text-base text-slate-400 line-through">
                  ${Number(product.compare_at_price).toFixed(2)}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold text-xs">
                  Save ${(Number(product.compare_at_price) - Number(product.price)).toFixed(2)}
                </span>
              </>
            )}
          </div>

          {/* Short description */}
          <p className="text-sm text-slate-600 leading-relaxed">
            {product.short_description || product.description}
          </p>

          {/* Stock Availability */}
          <div className="pt-2">
            {product.inventory_count > 0 ? (
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>In Stock ({product.inventory_count} units available in vendor warehouse)</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs font-semibold text-rose-600">
                <AlertTriangle className="w-4 h-4" />
                <span>Currently Out of Stock</span>
              </div>
            )}
          </div>

          {/* Quantity Selector & Purchase buttons */}
          {product.inventory_count > 0 && (
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Quantity</span>
                <div className="inline-flex items-center border border-slate-300 rounded-xl bg-white shadow-sm overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 font-bold"
                  >
                    -
                  </button>
                  <span className="px-4 py-1.5 text-sm font-bold text-slate-900">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.inventory_count, quantity + 1))}
                    className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={cartLoading}
                  className="flex-1 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 transition"
                >
                  <ShoppingCart className="w-5 h-5" />
                  Add to Cart
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={cartLoading}
                  className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl shadow transition"
                >
                  Instant Buy Now
                </button>
              </div>
            </div>
          )}

          {/* Marketplace Guarantees */}
          <div className="grid grid-cols-2 gap-3 pt-4 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-indigo-500 flex-shrink-0" />
              <span>Independent Vendor Shipping</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>Escrow Buyer Protection</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Description vs Reviews */}
      <div className="pt-8 border-t border-slate-200">
        <div className="flex items-center gap-6 border-b border-slate-200 mb-6">
          <button
            onClick={() => setActiveTab('desc')}
            className={`pb-3 text-sm font-bold tracking-tight transition border-b-2 ${
              activeTab === 'desc'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Product Specification & Details
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-3 text-sm font-bold tracking-tight transition border-b-2 ${
              activeTab === 'reviews'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Customer Reviews ({product.reviews?.length || product.review_count || 0})
          </button>
        </div>

        {activeTab === 'desc' ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Full Product Information</h3>
            <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {product.description || product.short_description}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Write a review box */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm">
              <h3 className="font-bold text-slate-900 text-base mb-1">Write a Customer Review</h3>
              <p className="text-xs text-slate-500 mb-6">Share your direct experience with this product and vendor.</p>

              {reviewSuccess ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  <span>Thank you! Your verified review has been posted and product ratings updated.</span>
                </div>
              ) : (
                <form onSubmit={handleReviewSubmit} className="space-y-4 max-w-xl">
                  {reviewError && (
                    <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs font-medium">
                      {reviewError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Rating</label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setReviewRating(star)}
                          className={`p-1 transition ${
                            star <= reviewRating ? 'text-amber-400' : 'text-slate-200'
                          }`}
                        >
                          <Star className="w-6 h-6 fill-current" />
                        </button>
                      ))}
                      <span className="text-xs font-bold text-slate-700 ml-2">{reviewRating} of 5 Stars</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Review Headline</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Exceptional sound stage and battery life"
                      value={reviewTitle}
                      onChange={(e) => setReviewTitle(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Detailed Feedback</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Share your thoughts on build quality, packaging, and fulfillment..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={reviewSubmitting}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-sm transition"
                  >
                    {reviewSubmitting ? 'Submitting Review...' : 'Submit Review'}
                  </button>
                </form>
              )}
            </div>

            {/* Existing reviews list */}
            <div className="space-y-4">
              {product.reviews && product.reviews.length > 0 ? (
                product.reviews.map((rev) => (
                  <div key={rev.id} className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                          {rev.customer_name[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <span className="font-semibold text-sm text-slate-900 block leading-tight">
                            {rev.customer_name}
                          </span>
                          <span className="text-[11px] text-emerald-600 font-medium">Verified Buyer</span>
                        </div>
                      </div>

                      <div className="flex items-center text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < rev.rating ? 'fill-current' : 'text-slate-200 fill-transparent'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {rev.title && <h4 className="font-bold text-sm text-slate-900 mt-2">{rev.title}</h4>}
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{rev.comment}</p>
                    <span className="text-[10px] text-slate-400 block mt-2">
                      {new Date(rev.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 text-sm">
                  No customer reviews yet. Be the first to review this product!
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
