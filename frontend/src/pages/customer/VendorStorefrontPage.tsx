import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Store, Star, Mail, Phone, Package, ChevronRight, ShieldCheck, AlertTriangle, X, CheckCircle2, Send } from 'lucide-react';
import { vendorService, productService, emailService } from '../../services/api';
import { VendorProfile, Product } from '../../types';
import { ProductCard } from '../../components/ProductCard';

export const VendorStorefrontPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Contact Store Modal
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [contactSending, setContactSending] = useState(false);
  const [contactSent, setContactSent] = useState(false);

  useEffect(() => {
    const fetchVendorData = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        const vData = await vendorService.getPublicVendorDetail(slug);
        setVendor(vData);

        const prodsRes = await productService.getProducts({ vendor: slug });
        const prods = (prodsRes as any).results || prodsRes;
        setProducts(prods);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchVendorData();
  }, [slug]);

  const handleSendContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactSending(true);
    try {
      await emailService.sendContactQuery({
        name: contactForm.name,
        email: contactForm.email,
        subject: `[Store Inquiry - ${vendor?.store_name}] ${contactForm.subject}`,
        message: contactForm.message,
        query_type: 'VENDOR_INQUIRY',
      });
      setContactSent(true);
      setTimeout(() => {
        setContactSent(false);
        setContactModalOpen(false);
        setContactForm({ name: '', email: '', subject: '', message: '' });
      }, 2500);
    } catch (err) {
      console.error(err);
      alert('Failed to route inquiry. Please try again.');
    } finally {
      setContactSending(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-8 max-w-7xl mx-auto py-12 px-4 sm:px-6">
        <div className="h-4 w-40 bg-slate-200 rounded"></div>
        <div className="h-64 bg-slate-200 rounded-2xl"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-slate-200 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="text-center py-24 max-w-md mx-auto px-4">
        <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-500 mx-auto flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-[#0a0500] uppercase tracking-wide">Storefront Not Found</h2>
        <p className="text-sm text-[#504e4a] mt-2">The merchant store you are looking for is either inactive or does not exist.</p>
        <Link
          to="/vendors"
          className="mt-6 inline-block px-7 py-3 bg-[#0a0500] hover:bg-neutral-800 text-white text-xs font-black uppercase tracking-wider rounded-full transition"
        >
          View All Vendors
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Modern Shop Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
        <Link to="/" className="hover:text-[#0a0500] transition">
          Home
        </Link>
        <ChevronRight className="w-3 h-3 text-slate-300" />
        <Link to="/vendors" className="hover:text-[#0a0500] transition">
          Verified Vendors
        </Link>
        <ChevronRight className="w-3 h-3 text-slate-300" />
        <span className="text-[#0a0500] truncate max-w-xs">{vendor.store_name}</span>
      </nav>

      {/* Vendor Storefront Header Banner */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl overflow-hidden shadow-sm">
        <div className="h-52 sm:h-72 bg-[#0a0500] relative">
          <img
            src={vendor.banner_url || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=80'}
            alt={vendor.store_name}
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent"></div>
        </div>

        <div className="p-6 sm:p-10 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 -mt-20 sm:-mt-24 mb-6">
            <div className="flex items-end gap-5">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl border-4 border-white shadow-xl bg-white overflow-hidden flex-shrink-0">
                <img
                  src={vendor.logo_url || 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=300&q=80'}
                  alt={vendor.store_name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="pb-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black text-[#0a0500] uppercase tracking-tight">
                    {vendor.store_name}
                  </h1>
                  <span className="px-3 py-1 rounded-full bg-[#ffcd05] text-[#0a0500] text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                    <ShieldCheck className="w-3 h-3" /> Verified Merchant
                  </span>
                </div>

                <div className="flex items-center gap-3 mt-2 text-xs">
                  <div className="flex items-center text-[#ffcd05]">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < Math.floor(Number(vendor.rating || 5)) ? 'fill-[#ffcd05]' : 'text-neutral-300 fill-transparent'
                        }`}
                      />
                    ))}
                    <span className="ml-1.5 font-black text-[#0a0500]">{Number(vendor.rating || 5.0).toFixed(1)}</span>
                  </div>
                  <span className="text-slate-300">·</span>
                  <span className="text-slate-500 font-semibold">{products.length} Products Cataloged</span>
                </div>
              </div>
            </div>
          </div>

          <p className="text-sm text-[#504e4a] max-w-3xl leading-relaxed mb-6">
            {vendor.description || 'Welcome to our verified merchant storefront. All listed products are curated with care and dispatched under verified escrow protection.'}
          </p>

          <div className="flex flex-wrap items-center gap-6 pt-5 border-t border-neutral-100 text-xs text-slate-500 font-medium">
            {vendor.business_email && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" />
                <span>{vendor.business_email}</span>
              </div>
            )}
            {vendor.business_phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400" />
                <span>{vendor.business_phone}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-emerald-700 font-bold">
              <Package className="w-4 h-4" />
              <span>Direct Merchant Fulfillment & Express Shipping</span>
            </div>

            <button
              onClick={() => setContactModalOpen(true)}
              className="sm:ml-auto inline-flex items-center gap-2 px-5 py-2.5 bg-[#0a0500] hover:bg-neutral-800 text-white font-black text-xs uppercase tracking-wider rounded-full shadow-sm transition"
            >
              <Mail className="w-3.5 h-3.5 text-[#ffcd05]" />
              <span>Contact Store</span>
            </button>
          </div>
        </div>
      </div>

      {/* Vendor's Product Catalog Grid */}
      <section className="space-y-6 pt-4">
        <div className="border-b border-neutral-200 pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-[#fcb424]">Store Catalog</span>
            <h2 className="text-2xl font-black text-[#0a0500] uppercase tracking-tight mt-1">
              Products by {vendor.store_name}
            </h2>
          </div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Showing {products.length} Items
          </span>
        </div>

        {products.length === 0 ? (
          <div className="bg-white border border-neutral-200 rounded-2xl p-16 text-center text-sm text-[#504e4a]">
            This merchant does not currently have any active items available. Please check back soon!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* Contact Store Inquiry Modal */}
      {contactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative space-y-6">
            <button
              onClick={() => setContactModalOpen(false)}
              className="absolute right-5 top-5 p-2 rounded-full hover:bg-neutral-100 text-slate-400 hover:text-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#fcb424] block">Direct Inquiry</span>
              <h3 className="text-xl font-black text-[#0a0500] uppercase tracking-tight mt-0.5">
                Message {vendor.store_name}
              </h3>
              <p className="text-xs text-[#504e4a] mt-1">
                Have questions about materials, custom dimensions, or delivery estimates? Send a direct note to the merchant.
              </p>
            </div>

            {contactSent ? (
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="font-black text-[#0a0500] text-sm uppercase">Message Dispatched!</h4>
                <p className="text-xs text-emerald-800">
                  Your inquiry has been routed to {vendor.store_name}. An email copy has been logged.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendContact} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    placeholder="e.g. Alex Morgan"
                    className="w-full px-4 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-[#0a0500] focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Your Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    placeholder="you@example.com"
                    className="w-full px-4 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-[#0a0500] focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Subject *
                  </label>
                  <input
                    type="text"
                    required
                    value={contactForm.subject}
                    onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                    placeholder="e.g. Question about warranty & shipping schedule"
                    className="w-full px-4 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-[#0a0500] focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Message *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    placeholder="Type your question or customization request here..."
                    className="w-full px-4 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-[#0a0500] focus:bg-white transition resize-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setContactModalOpen(false)}
                    className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={contactSending}
                    className="px-6 py-2.5 bg-[#0a0500] hover:bg-neutral-800 text-white font-black text-xs uppercase tracking-wider rounded-full shadow-md transition flex items-center gap-2 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5 text-[#ffcd05]" />
                    <span>{contactSending ? 'Dispatching...' : 'Send Message'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
