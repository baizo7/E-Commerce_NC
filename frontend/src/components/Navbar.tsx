import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingBag,
  User as UserIcon,
  Store,
  ShieldCheck,
  Search,
  LogOut,
  Package,
  Settings,
  Menu,
  X,
  Compass,
  Heart,
  Tag,
  AlertTriangle,
  History
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { bannerService } from '../services/api';
import { PlatformBanner } from '../types';

export const Navbar: React.FC = () => {
  const { user, logout, isVendor, isAdmin } = useAuth();
  const { cartCount, cartSubtotal } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchTerm, setSearchTerm] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [banner, setBanner] = useState<PlatformBanner | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const banners = await bannerService.getActiveBanners();
        if (banners.length > 0) {
          setBanner(banners[0]);
        }
      } catch (err) {
        // Silently continue if banners API not loaded
      }
    };
    fetchBanners();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm('');
      setMobileMenuOpen(false);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Site-Wide Promotional / Notice Ribbon Banner */}
      {banner && !bannerDismissed && (
        <div className="bg-[#0a0500] text-amber-400 py-2 px-4 text-xs font-bold border-b border-neutral-800 flex items-center justify-between shadow-xs">
          <div className="max-w-7xl mx-auto flex items-center gap-2 truncate">
            <Tag className="w-3.5 h-3.5 flex-shrink-0 text-[#ffcd05]" />
            <span className="text-white font-extrabold uppercase tracking-wide text-[11px]">
              {banner.title}:
            </span>
            <span className="text-neutral-300 font-medium truncate">
              {banner.message}
            </span>
            {banner.link_url && (
              <Link to={banner.link_url} className="text-[#ffcd05] hover:underline underline-offset-2 ml-1 font-black flex-shrink-0">
                Explore Deals &rarr;
              </Link>
            )}
          </div>
          <button
            onClick={() => setBannerDismissed(true)}
            className="text-neutral-400 hover:text-white p-1 rounded-full transition"
            title="Dismiss Announcement"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Blocksy Modern Shop Brand Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0 group">
            <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center text-amber-400 font-black shadow-sm group-hover:bg-amber-400 group-hover:text-slate-950 transition-colors">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div className="leading-none">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 uppercase font-sans">
                MODERN<span className="text-amber-400">.</span>SHOP
              </span>
              <span className="block text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">
                Multi-Vendor Commerce
              </span>
            </div>
          </Link>

          {/* Navigation Links (Blocksy Modern Shop Style: HOME, SHOP, PRODUCTS, VENDORS, CONTACT) */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-extrabold uppercase tracking-widest text-slate-700">
            <Link
              to="/"
              className={`transition hover:text-amber-500 ${
                isActive('/') ? 'text-amber-500 border-b-2 border-amber-400 pb-1' : ''
              }`}
            >
              HOME
            </Link>
            <Link
              to="/products"
              className={`transition hover:text-amber-500 ${
                isActive('/products') ? 'text-amber-500 border-b-2 border-amber-400 pb-1' : ''
              }`}
            >
              SHOP
            </Link>
            <Link
              to="/vendors"
              className={`transition hover:text-amber-500 ${
                isActive('/vendors') ? 'text-amber-500 border-b-2 border-amber-400 pb-1' : ''
              }`}
            >
              VENDORS
            </Link>
            <Link
              to="/vendor/dashboard"
              className={`transition hover:text-amber-500 flex items-center gap-1.5 ${
                location.pathname.startsWith('/vendor') ? 'text-amber-500 border-b-2 border-amber-400 pb-1' : ''
              }`}
            >
              <Store className="w-3.5 h-3.5 text-[#fcb424]" />
              VENDOR PORTAL
            </Link>
            <Link
              to="/contact"
              className={`transition hover:text-amber-500 ${
                isActive('/contact') ? 'text-amber-500 border-b-2 border-amber-400 pb-1' : ''
              }`}
            >
              CONTACT
            </Link>

            {isAdmin && (
              <Link
                to="/admin/dashboard"
                className="text-slate-950 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition normal-case font-bold"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Admin
              </Link>
            )}
          </nav>

          {/* Right Action Area (Search, User, Cart) */}
          <div className="flex items-center gap-3">
            {/* Search Input */}
            <form onSubmit={handleSearch} className="hidden xl:block relative w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-100 focus:bg-white border border-transparent focus:border-amber-400 rounded-full outline-none transition"
              />
            </form>

            {/* Wishlist Link */}
            <Link
              to="/wishlist"
              className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200 transition"
              title="Saved Wishlist"
            >
              <Heart className="w-4 h-4" />
            </Link>

            {/* Shopping Cart Pill (Blocksy Modern Shop: Icon + Price) */}
            <Link
              to="/cart"
              className="flex items-center gap-2.5 px-3 py-2 rounded-full bg-slate-50 hover:bg-amber-50/70 border border-slate-200 transition"
              title="Shopping Cart"
            >
              <div className="relative">
                <ShoppingBag className="w-4 h-4 text-slate-800" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] flex items-center justify-center shadow-xs">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="text-xs font-black text-slate-900 hidden sm:inline">
                ${cartSubtotal.toFixed(2)}
              </span>
            </Link>

            {/* User Account / Profile */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 pl-2 pr-3 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition"
                >
                  <div className="w-6 h-6 rounded-full bg-slate-950 text-amber-400 flex items-center justify-center text-xs font-black overflow-hidden">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      (user.first_name?.[0] || user.email[0]).toUpperCase()
                    )}
                  </div>
                  <span className="hidden sm:inline max-w-[90px] truncate">
                    {user.first_name || user.email.split('@')[0]}
                  </span>
                </button>

                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 text-xs text-slate-700"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="font-bold text-slate-900 truncate">
                        {user.first_name ? `${user.first_name} ${user.last_name}` : user.username}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                    </div>

                    <Link
                      to="/profile"
                      className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 text-slate-800 font-semibold"
                    >
                      <UserIcon className="w-4 h-4 text-slate-400" />
                      Account & Profile
                    </Link>

                    <Link
                      to="/orders"
                      className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 text-slate-800 font-semibold"
                    >
                      <Package className="w-4 h-4 text-slate-400" />
                      My Orders
                    </Link>

                    <Link
                      to="/wishlist"
                      className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 text-slate-800 font-semibold"
                    >
                      <Heart className="w-4 h-4 text-slate-400" />
                      Saved Wishlist
                    </Link>

                    {isVendor && (
                      <>
                        <Link
                          to="/vendor/dashboard"
                          className="flex items-center gap-2.5 px-4 py-2 hover:bg-amber-50 text-amber-900 font-semibold"
                        >
                          <Store className="w-4 h-4 text-[#fcb424]" />
                          Vendor Dashboard
                        </Link>
                        <Link
                          to="/vendor/settings"
                          className="flex items-center gap-2.5 px-4 py-2 hover:bg-amber-50 text-amber-900 font-semibold"
                        >
                          <Settings className="w-4 h-4 text-slate-400" />
                          Store Settings
                        </Link>
                      </>
                    )}

                    {isAdmin && (
                      <>
                        <Link
                          to="/admin/dashboard"
                          className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-100 text-slate-900 font-semibold"
                        >
                          <ShieldCheck className="w-4 h-4 text-slate-950" />
                          Admin Command Center
                        </Link>
                        <Link
                          to="/admin/disputes"
                          className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-100 text-slate-900 font-semibold"
                        >
                          <AlertTriangle className="w-4 h-4 text-slate-950" />
                          Disputes & Refunds
                        </Link>
                        <Link
                          to="/admin/audit-logs"
                          className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-100 text-slate-900 font-semibold"
                        >
                          <History className="w-4 h-4 text-slate-950" />
                          Audit Activity Trail
                        </Link>
                      </>
                    )}

                    {!isVendor && !isAdmin && (
                      <Link
                        to="/register?role=vendor"
                        className="flex items-center gap-2.5 px-4 py-2 hover:bg-amber-50 text-amber-800 font-semibold"
                      >
                        <Store className="w-4 h-4" />
                        Become a Vendor
                      </Link>
                    )}

                    <div className="border-t border-slate-100 my-1"></div>

                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-rose-600 hover:bg-rose-50 font-semibold text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-full text-xs shadow-sm transition"
              >
                Sign In
              </Link>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-700 hover:text-slate-950 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-5 py-4 space-y-3">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs bg-slate-100 rounded-full outline-none"
              />
            </div>
          </form>

          <div className="flex flex-col space-y-2 pt-2 text-xs font-bold uppercase tracking-wider text-slate-800">
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-amber-500">
              HOME
            </Link>
            <Link to="/products" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-amber-500">
              SHOP
            </Link>
            <Link to="/vendors" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-amber-500">
              VENDORS
            </Link>
            <Link to="/vendor/dashboard" onClick={() => setMobileMenuOpen(false)} className="py-2 text-[#0a0500] hover:text-amber-500 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-[#fcb424]" />
              VENDOR PORTAL
            </Link>
            <Link to="/contact" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-amber-500">
              CONTACT
            </Link>
            {user && (
              <>
                <Link to="/wishlist" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-amber-500">
                  SAVED WISHLIST
                </Link>
                <Link to="/orders" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-amber-500">
                  MY ORDERS
                </Link>
                <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="py-2 hover:text-amber-500">
                  ACCOUNT & PROFILE
                </Link>
              </>
            )}
            {isVendor && (
              <Link to="/vendor/dashboard" onClick={() => setMobileMenuOpen(false)} className="py-2 text-amber-600">
                VENDOR DASHBOARD
              </Link>
            )}
            {isAdmin && (
              <Link to="/admin/dashboard" onClick={() => setMobileMenuOpen(false)} className="py-2 text-slate-900 font-extrabold">
                ADMIN COMMAND CENTER
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  </>
);
};
