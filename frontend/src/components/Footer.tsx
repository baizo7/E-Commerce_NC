import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ShieldCheck, Truck, RefreshCw, Award } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 mt-20 border-t border-slate-800">
      {/* Value Proposition Highlights */}
      <div className="border-b border-slate-800/80 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-950 text-indigo-400 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">Escrow Buyer Protection</h4>
              <p className="text-xs text-slate-400 mt-0.5">Funds released to vendor upon delivery verification.</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-950 text-indigo-400 flex items-center justify-center flex-shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">Vetted Independent Vendors</h4>
              <p className="text-xs text-slate-400 mt-0.5">Every merchant undergoes strict quality moderation.</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-950 text-indigo-400 flex items-center justify-center flex-shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">Multi-Vendor Dispatch</h4>
              <p className="text-xs text-slate-400 mt-0.5">Automated split tracking across all fulfillment centers.</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-950 text-indigo-400 flex items-center justify-center flex-shrink-0">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">Hassle-Free Returns</h4>
              <p className="text-xs text-slate-400 mt-0.5">30-day money-back guarantee across all marketplace items.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-2 md:grid-cols-5 gap-8">
        <div className="col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">NexaMarket</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed max-w-sm mb-4">
            The next-generation multi-vendor digital marketplace. Empowering independent makers, specialized brands, and discerning shoppers through seamless transactional commerce.
          </p>
          <div className="text-xs text-slate-500">
            Built with React, Vite, TypeScript, Django REST Framework & PostgreSQL.
          </div>
        </div>

        <div>
          <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-3">Marketplace</h4>
          <ul className="space-y-2 text-xs">
            <li><Link to="/products" className="hover:text-white transition">All Products</Link></li>
            <li><Link to="/vendors" className="hover:text-white transition">Explore Stores</Link></li>
            <li><Link to="/products?featured=true" className="hover:text-white transition">Featured Deals</Link></li>
            <li><Link to="/orders" className="hover:text-white transition">Order Tracking</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-3">Vendors</h4>
          <ul className="space-y-2 text-xs">
            <li><Link to="/register?role=vendor" className="hover:text-white transition">Vendor Registration</Link></li>
            <li><Link to="/vendor/dashboard" className="hover:text-white transition">Vendor Dashboard</Link></li>
            <li><span className="text-slate-500">Commission Rates (10%)</span></li>
            <li><span className="text-slate-500">Seller Guidelines</span></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-3">Administration</h4>
          <ul className="space-y-2 text-xs">
            <li><Link to="/admin/dashboard" className="hover:text-white transition">Admin Portal</Link></li>
            <li><a href="http://127.0.0.1:8000/api/docs/" target="_blank" rel="noreferrer" className="hover:text-white transition">Swagger API Docs</a></li>
            <li><a href="http://127.0.0.1:8000/admin/" target="_blank" rel="noreferrer" className="hover:text-white transition">Django Admin Panel</a></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} NexaMarket Multi-Vendor Inc. All rights reserved.
      </div>
    </footer>
  );
};
