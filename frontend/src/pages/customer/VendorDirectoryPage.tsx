import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Store, Star, ArrowRight, Search, ShieldCheck } from 'lucide-react';
import { vendorService } from '../../services/api';
import { VendorProfile } from '../../types';

export const VendorDirectoryPage: React.FC = () => {
  const [vendors, setVendors] = useState<VendorProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVendors = async () => {
      setLoading(true);
      try {
        const res = await vendorService.getPublicVendors();
        const list = (res as any).results || res;
        setVendors(list);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchVendors();
  }, []);

  const filtered = vendors.filter(
    (v) =>
      v.store_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold mb-3">
            <Store className="w-3.5 h-3.5" />
            Merchant Directory
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Verified Marketplace Stores</h1>
          <p className="text-sm text-slate-500 mt-1">
            Shop directly from our community of vetted makers, independent ateliers, and certified tech distributors.
          </p>
        </div>

        <div className="mt-6 max-w-md relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search stores by name or keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-indigo-500 outline-none transition"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse bg-white border border-slate-200 rounded-2xl h-64"></div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 text-sm">
          No vendors found matching "{searchTerm}".
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((vendor) => (
            <Link
              key={vendor.id}
              to={`/vendors/${vendor.slug}`}
              className="group bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all flex flex-col"
            >
              <div className="h-28 bg-slate-900 relative">
                <img
                  src={vendor.banner_url || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80'}
                  alt={vendor.store_name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                />
              </div>

              <div className="p-5 flex-1 flex flex-col relative">
                <div className="flex items-center gap-3 -mt-10 mb-3">
                  <div className="w-14 h-14 rounded-xl border-2 border-white shadow-md bg-white overflow-hidden flex-shrink-0">
                    <img
                      src={vendor.logo_url || 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=200&q=80'}
                      alt={vendor.store_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {vendor.store_name}
                    </h3>
                    <div className="flex items-center gap-1 text-[11px] text-amber-500 font-bold">
                      <Star className="w-3 h-3 fill-current" />
                      <span>{Number(vendor.rating || 5.0).toFixed(1)}</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed flex-1">
                  {vendor.description}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">{vendor.product_count ?? 'Multiple'} items listed</span>
                  <span className="font-semibold text-indigo-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                    Visit Store <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
