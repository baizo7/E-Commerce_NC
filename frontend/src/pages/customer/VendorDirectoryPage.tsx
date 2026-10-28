import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Store, Star, ArrowRight, Search, ShieldCheck, ChevronRight } from 'lucide-react';
import { vendorService } from '../../services/api';
import { VendorProfile, unwrapResults } from '../../types';

export const VendorDirectoryPage: React.FC = () => {
  const [vendors, setVendors] = useState<VendorProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVendors = async () => {
      setLoading(true);
      try {
        const res = await vendorService.getPublicVendors();
        setVendors(unwrapResults<VendorProfile>(res));
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
    <div className="space-y-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Modern Shop Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
        <Link to="/" className="hover:text-[#0a0500] transition">
          Home
        </Link>
        <ChevronRight className="w-3 h-3 text-slate-300" />
        <span className="text-[#0a0500]">Verified Merchants</span>
      </nav>

      {/* Directory Header Banner */}
      <div className="bg-[#0a0500] text-white rounded-3xl p-8 sm:p-14 relative overflow-hidden shadow-xl">
        <div className="absolute right-0 top-0 w-96 h-96 bg-[#ffcd05]/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-2xl space-y-3">
          <span className="text-xs font-black uppercase tracking-widest text-[#ffcd05]">Certified Marketplace Partners</span>
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white leading-tight">
            Independent Creators & Boutiques
          </h1>
          <p className="text-sm text-neutral-300 leading-relaxed pt-1">
            Browse our vetted collective of craft ateliers, technical apparel makers, and independent designers. Every vendor fulfills with escrow buyer protection.
          </p>

          <div className="pt-4 max-w-md relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search merchants by store name or specialty..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-neutral-900/90 border border-neutral-700 rounded-full text-xs text-white placeholder-neutral-400 focus:border-[#ffcd05] focus:bg-black outline-none transition shadow-inner"
            />
          </div>
        </div>
      </div>

      {/* Directory Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse bg-neutral-100 rounded-2xl h-72"></div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-2xl p-16 text-center text-[#504e4a] text-sm space-y-4">
          <p className="font-medium">
            {searchTerm ? `No stores match your search for "${searchTerm}".` : 'No verified merchants active right now.'}
          </p>
          <div>
            <Link
              to="/register?role=vendor"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#0a0500] hover:bg-neutral-800 text-white font-black uppercase tracking-wider text-xs rounded-full shadow-md transition"
            >
              <Store className="w-4 h-4 text-[#ffcd05]" />
              Become a Verified Merchant
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((vendor) => (
            <Link
              key={vendor.id}
              to={`/vendors/${vendor.slug}`}
              className="group bg-white rounded-2xl overflow-hidden border border-neutral-200/90 shadow-sm hover:shadow-xl hover:border-neutral-400 transition-all flex flex-col"
            >
              <div className="h-36 bg-[#0a0500] relative overflow-hidden">
                <img
                  src={vendor.banner_url || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80'}
                  alt={vendor.store_name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-[#0a0500] text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                  <ShieldCheck className="w-3 h-3 text-[#fcb424]" /> Verified
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col relative">
                <div className="flex items-center gap-3.5 -mt-12 mb-4">
                  <div className="w-16 h-16 rounded-xl border-2 border-white shadow-lg bg-white overflow-hidden flex-shrink-0">
                    <img
                      src={vendor.logo_url || 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=200&q=80'}
                      alt={vendor.store_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="pt-4">
                    <h3 className="font-black text-[#0a0500] text-base group-hover:text-[#fcb424] transition-colors leading-tight">
                      {vendor.store_name}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-[#ffcd05] mt-0.5">
                      <Star className="w-3.5 h-3.5 fill-[#ffcd05]" />
                      <span className="font-black text-[#0a0500]">{Number(vendor.rating || 5.0).toFixed(1)}</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-slate-400 text-[11px] font-medium">{vendor.product_count ?? 'Vetted'} items</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-[#504e4a] line-clamp-3 leading-relaxed flex-1">
                  {vendor.description || 'Independent creator fulfilling exceptional lifestyle and performance equipment.'}
                </p>

                <div className="mt-5 pt-4 border-t border-neutral-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Direct Delivery</span>
                  <span className="font-black text-[#0a0500] group-hover:translate-x-1 transition-transform flex items-center gap-1 uppercase tracking-wider text-[11px]">
                    Visit Store <ArrowRight className="w-3.5 h-3.5 text-[#fcb424]" />
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
