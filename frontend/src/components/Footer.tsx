import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ShieldCheck, Truck, RefreshCw, Send, CheckCircle2, Phone, Mail, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 5000);
    }
  };

  return (
    <footer className="bg-[#0a0500] text-slate-400 mt-24 border-t border-slate-900">
      {/* 4 Value Proposition Badges (Matching Modern Shop) */}
      <div className="border-b border-slate-900/80 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/10 text-amber-400 flex items-center justify-center flex-shrink-0 border border-amber-400/20">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-extrabold text-sm uppercase tracking-wider">Free Shipping</h4>
              <p className="text-xs text-slate-400 mt-0.5">On all platform orders over $100</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/10 text-amber-400 flex items-center justify-center flex-shrink-0 border border-amber-400/20">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-extrabold text-sm uppercase tracking-wider">30-Day Money Back</h4>
              <p className="text-xs text-slate-400 mt-0.5">Hassle-free guarantee across all stores</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/10 text-amber-400 flex items-center justify-center flex-shrink-0 border border-amber-400/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-extrabold text-sm uppercase tracking-wider">Secure Payment</h4>
              <p className="text-xs text-slate-400 mt-0.5">Protected with 256-bit SSL encryption</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/10 text-amber-400 flex items-center justify-center flex-shrink-0 border border-amber-400/20">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-extrabold text-sm uppercase tracking-wider">24/7 Support</h4>
              <p className="text-xs text-slate-400 mt-0.5">Dedicated administrative helpline</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links & Newsletter */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Column 1: About Organization */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-black">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <span className="text-lg font-black text-white uppercase tracking-tight">
              MODERN<span className="text-amber-400">.</span>SHOP
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            A multi-vendor marketplace connecting conscious shoppers with verified independent makers, studios, and craft brands worldwide.
          </p>
          <div className="text-xs text-slate-400 space-y-1">
            <p className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-amber-400" />
              <span>sanjaisam63@gmail.com</span>
            </p>
            <p className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>500 Market Square, Silicon Valley, CA</span>
            </p>
          </div>
        </div>

        {/* Column 2: Quick Links */}
        <div>
          <h4 className="text-white text-xs font-black uppercase tracking-widest mb-4 border-b border-slate-800 pb-2">
            Quick Links
          </h4>
          <ul className="space-y-2.5 text-xs">
            <li><Link to="/products" className="hover:text-amber-400 transition">Shop Catalog</Link></li>
            <li><Link to="/vendors" className="hover:text-amber-400 transition">Verified Vendors</Link></li>
            <li><Link to="/products?featured=true" className="hover:text-amber-400 transition">Featured Deals</Link></li>
            <li><Link to="/orders" className="hover:text-amber-400 transition">Track Your Shipment</Link></li>
            <li><Link to="/register?role=vendor" className="hover:text-amber-400 transition">Become a Vendor</Link></li>
          </ul>
        </div>

        {/* Column 3: Useful Information */}
        <div>
          <h4 className="text-white text-xs font-black uppercase tracking-widest mb-4 border-b border-slate-800 pb-2">
            Useful Information
          </h4>
          <ul className="space-y-2.5 text-xs">
            <li><Link to="/contact" className="hover:text-amber-400 transition">Contact Platform Support</Link></li>
            <li><span className="text-slate-400">Shipping Policy & Delivery Estimates</span></li>
            <li><span className="text-slate-400">Refunds & Escrow Buyer Guarantee</span></li>
            <li><span className="text-slate-400">Privacy & Cookie Settings</span></li>
            <li><Link to="/admin/dashboard" className="text-amber-400/80 hover:text-amber-400 transition">Platform Administration</Link></li>
          </ul>
        </div>

        {/* Column 4: Stay Updated / Newsletter */}
        <div className="space-y-4">
          <h4 className="text-white text-xs font-black uppercase tracking-widest mb-4 border-b border-slate-800 pb-2">
            Stay Updated
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Subscribe to receive exclusive hot discounts, early drops, and seasonal backpack collections.
          </p>

          {subscribed ? (
            <div className="p-3 bg-amber-400/10 border border-amber-400/30 text-amber-300 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>Thank you! You are now subscribed to Modern Shop updates.</span>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="space-y-2">
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-amber-400 transition"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black uppercase tracking-wider rounded-xl text-xs shadow-md transition flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                Subscribe Now
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Bottom Legal Bar */}
      <div className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>&copy; {new Date().getFullYear()} Modern Shop Multi-Vendor Inc. All rights reserved.</p>
          <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
            <span>Razorpay</span>
            <span>&bull;</span>
            <span>Stripe</span>
            <span>&bull;</span>
            <span>UPI / Cards</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
