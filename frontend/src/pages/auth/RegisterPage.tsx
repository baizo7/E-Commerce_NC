import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ShoppingBag, Lock, Mail, User as UserIcon, Store, Phone, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const RegisterPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'vendor' ? 'VENDOR' : 'CUSTOMER';

  const { register } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState<'CUSTOMER' | 'VENDOR'>(initialRole);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    store_name: '',
    store_description: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await register({
        ...formData,
        role,
      });

      if (role === 'VENDOR') {
        navigate('/vendor/dashboard');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      console.error(err);
      const resData = err.response?.data;
      if (typeof resData === 'object') {
        const msg = Object.entries(resData)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' ') : v}`)
          .join('\n');
        setError(msg || 'Registration failed.');
      } else {
        setError('Registration failed. Please verify your details.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-[#0a0500] text-[#ffcd05] flex items-center justify-center mx-auto shadow-md">
          <ShoppingBag className="w-7 h-7" />
        </div>
        <span className="text-xs font-black uppercase tracking-widest text-[#fcb424] block">Join The Platform</span>
        <h1 className="text-3xl font-black text-[#0a0500] uppercase tracking-tight">Create Account</h1>
        <p className="text-xs text-[#504e4a]">Join as a shopper or open your verified independent storefront</p>
      </div>

      {/* Role Switcher Tabs */}
      <div className="bg-neutral-100 p-1 rounded-full grid grid-cols-2 gap-1 text-xs font-bold uppercase tracking-wider">
        <button
          type="button"
          onClick={() => setRole('CUSTOMER')}
          className={`py-2.5 rounded-full transition flex items-center justify-center gap-1.5 ${
            role === 'CUSTOMER' ? 'bg-[#0a0500] text-white shadow-sm font-black' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <UserIcon className="w-4 h-4" />
          Buyer
        </button>
        <button
          type="button"
          onClick={() => setRole('VENDOR')}
          className={`py-2.5 rounded-full transition flex items-center justify-center gap-1.5 ${
            role === 'VENDOR' ? 'bg-[#ffcd05] text-[#0a0500] shadow-sm font-black' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Store className="w-4 h-4" />
          Merchant
        </button>
      </div>

      <div className="bg-white border border-neutral-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
        {error && (
          <div className="p-3.5 bg-rose-50 text-rose-800 text-xs rounded-xl font-medium border border-rose-200 whitespace-pre-line">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">First Name</label>
              <input
                type="text"
                required
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-[#0a0500] focus:bg-white transition"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">Last Name</label>
              <input
                type="text"
                required
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-[#0a0500] focus:bg-white transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-[#0a0500] focus:bg-white transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-[#0a0500] focus:bg-white transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                placeholder="Minimum 8 characters"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-[#0a0500] focus:bg-white transition"
              />
            </div>
          </div>

          {/* Conditional Vendor Profile Information */}
          {role === 'VENDOR' && (
            <div className="pt-4 border-t border-neutral-100 space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#0a0500] mb-1">Store / Brand Name</label>
                <div className="relative">
                  <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required={role === 'VENDOR'}
                    placeholder="e.g. Apex Artisanal Studios"
                    value={formData.store_name}
                    onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-amber-50/50 border border-amber-200 rounded-xl outline-none focus:border-[#0a0500] focus:bg-white font-bold transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">Store Description & Specialties</label>
                <textarea
                  rows={2}
                  placeholder="Describe your craft, brand history, or fulfillment capabilities..."
                  value={formData.store_description}
                  onChange={(e) => setFormData({ ...formData, store_description: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-[#0a0500] focus:bg-white transition resize-none"
                ></textarea>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-[#ffcd05] hover:bg-[#fcb424] text-[#0a0500] font-black uppercase tracking-wider text-xs rounded-full shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition disabled:opacity-50 mt-4"
          >
            {submitting ? 'Creating Account...' : role === 'VENDOR' ? 'Register Store & Open Shop' : 'Create Buyer Account'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-4 border-t border-neutral-100 text-center text-xs text-slate-500 font-medium">
          Already registered?{' '}
          <Link to="/login" className="font-bold text-[#0a0500] hover:underline">
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
};
