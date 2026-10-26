import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Lock, Mail, ArrowRight, ShieldCheck, Store, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login, demoLogin } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Invalid email or password.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickPersona = async (persona: 'customer' | 'vendor' | 'admin') => {
    setSubmitting(true);
    setError(null);
    try {
      await demoLogin(persona);
      if (persona === 'vendor') {
        navigate('/vendor/dashboard');
      } else if (persona === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error(err);
      setError('Failed demo login');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-10 space-y-8">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-indigo-100">
          <ShoppingBag className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Sign In to NexaMarket</h1>
        <p className="text-xs text-slate-500">Access your customer, vendor, or administration portal</p>
      </div>

      {/* One-Click Demo Personas for Quick Evaluation */}
      <div className="bg-slate-100/80 p-4 rounded-2xl border border-slate-200/80 space-y-2.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block text-center">
          One-Click Evaluation Personas:
        </span>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <button
            type="button"
            onClick={() => handleQuickPersona('customer')}
            className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm hover:border-indigo-500 hover:shadow-md transition text-center flex flex-col items-center gap-1"
          >
            <UserIcon className="w-4 h-4 text-emerald-600" />
            <span className="font-bold text-slate-800 text-[11px]">Customer</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickPersona('vendor')}
            className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm hover:border-indigo-500 hover:shadow-md transition text-center flex flex-col items-center gap-1"
          >
            <Store className="w-4 h-4 text-amber-600" />
            <span className="font-bold text-slate-800 text-[11px]">Vendor</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickPersona('admin')}
            className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm hover:border-indigo-500 hover:shadow-md transition text-center flex flex-col items-center gap-1"
          >
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span className="font-bold text-slate-800 text-[11px]">Admin</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
        {error && (
          <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl font-medium border border-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {submitting ? 'Authenticating...' : 'Sign In'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
          Don't have an account yet?{' '}
          <Link to="/register" className="font-bold text-indigo-600 hover:underline">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
};
