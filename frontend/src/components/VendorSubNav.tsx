import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { LayoutDashboard, Package, Truck, IndianRupee, Settings, ExternalLink, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const VendorSubNav: React.FC = () => {
  const { user } = useAuth();
  const vendor = user?.vendor_profile;

  const navItems = [
    { label: 'Overview', path: '/vendor/dashboard', icon: LayoutDashboard },
    { label: 'Products', path: '/vendor/products', icon: Package },
    { label: 'Fulfillment & Orders', path: '/vendor/orders', icon: Truck },
    { label: 'Financials & Payouts', path: '/vendor/earnings', icon: IndianRupee },
    { label: 'Store Settings', path: '/vendor/settings', icon: Settings },
  ];

  return (
    <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 shadow-sm mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-1 md:pb-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `px-3.5 py-2 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition whitespace-nowrap ${
                    isActive
                      ? 'bg-[#0a0500] text-white shadow-sm font-black'
                      : 'text-neutral-600 hover:text-[#0a0500] hover:bg-neutral-100'
                  }`
                }
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Storefront Link & Rating */}
        <div className="flex items-center gap-3 self-end md:self-auto text-xs">
          {vendor?.rating && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200/60 font-black text-[11px]">
              <Star className="w-3 h-3 fill-[#ffcd05] text-[#ffcd05]" />
              <span>{Number(vendor.rating).toFixed(1)}</span>
            </div>
          )}

          {vendor?.slug && (
            <Link
              to={`/vendors/${vendor.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-neutral-200 text-neutral-600 hover:text-[#0a0500] hover:border-[#0a0500] font-bold text-[11px] transition"
            >
              <span>Public Store</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
