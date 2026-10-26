import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Store, Star, Mail, Phone, MapPin, Package, ArrowLeft } from 'lucide-react';
import { vendorService, productService } from '../../services/api';
import { VendorProfile, Product } from '../../types';
import { ProductCard } from '../../components/ProductCard';

export const VendorStorefrontPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

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

  if (loading) {
    return (
      <div className="animate-pulse space-y-6 max-w-6xl mx-auto py-10">
        <div className="h-48 bg-slate-200 rounded-3xl"></div>
        <div className="h-8 bg-slate-200 rounded w-1/3"></div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-slate-800">Vendor Not Found</h2>
        <Link to="/vendors" className="mt-4 inline-block text-indigo-600 font-semibold text-sm">
          Browse All Vendors &rarr;
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-6xl mx-auto">
      <Link to="/vendors" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Vendor Directory
      </Link>

      {/* Vendor Storefront Header */}
      <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm">
        <div className="h-48 sm:h-64 bg-slate-900 relative">
          <img
            src={vendor.banner_url || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80'}
            alt={vendor.store_name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent"></div>
        </div>

        <div className="p-6 sm:p-8 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 -mt-16 sm:-mt-20 mb-6">
            <div className="flex items-end gap-4">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-4 border-white shadow-xl bg-white overflow-hidden flex-shrink-0">
                <img
                  src={vendor.logo_url || 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=300&q=80'}
                  alt={vendor.store_name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="pb-2">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {vendor.store_name}
                  </h1>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[11px] font-bold">
                    Verified Seller
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-1 text-xs">
                  <div className="flex items-center text-amber-500 font-bold">
                    <Star className="w-3.5 h-3.5 fill-current mr-1" />
                    <span>{Number(vendor.rating || 5.0).toFixed(1)} Rating</span>
                  </div>
                  <span className="text-slate-400">&middot;</span>
                  <span className="text-slate-500">{products.length} Products Listed</span>
                </div>
              </div>
            </div>
          </div>

          <p className="text-sm text-slate-600 max-w-3xl leading-relaxed mb-6">
            {vendor.description}
          </p>

          <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-slate-100 text-xs text-slate-500">
            {vendor.business_email && (
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{vendor.business_email}</span>
              </div>
            )}
            {vendor.business_phone && (
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{vendor.business_phone}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
              <Package className="w-3.5 h-3.5" />
              <span>Direct Fulfillment Guarantee</span>
            </div>
          </div>
        </div>
      </div>

      {/* Vendor's Product Catalog */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Products by {vendor.store_name}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Dispatched directly from this merchant's fulfillment facility</p>
        </div>

        {products.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-sm text-slate-500">
            This vendor does not have any active products listed currently.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
