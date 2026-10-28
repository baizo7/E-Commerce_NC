import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Store,
  Package,
  FolderTree,
  FileText,
  Users,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  History
} from 'lucide-react';

export const AdminSubNav: React.FC = () => {
  const navItems = [
    { label: 'Executive Overview', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Merchants', path: '/admin/vendors', icon: Store },
    { label: 'Catalog Quality', path: '/admin/products', icon: Package },
    { label: 'Taxonomy', path: '/admin/categories', icon: FolderTree },
    { label: 'Orders & Settlements', path: '/admin/orders', icon: FileText },
    { label: 'Disputes & Claims', path: '/admin/disputes', icon: AlertTriangle },
    { label: 'User Directory', path: '/admin/users', icon: Users },
    { label: 'Audit Trail', path: '/admin/audit-logs', icon: History },
  ];

  return (
    <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 shadow-sm mb-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
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

        {/* Platform Status & Storefront Link */}
        <div className="flex items-center gap-3 self-end lg:self-auto text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-black text-[11px] uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Modern Shop Online</span>
          </div>

          <Link
            to="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-neutral-200 text-neutral-600 hover:text-[#0a0500] hover:border-[#0a0500] font-bold text-[11px] transition"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#ffcd05]" />
            <span>Modern Shop Storefront</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </Link>
        </div>
      </div>
    </div>
  );
};
