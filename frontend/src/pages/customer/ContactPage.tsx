import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Send, CheckCircle2, AlertCircle, HelpCircle, Store, MessageSquare, Phone, User, ChevronRight, ShieldCheck, Clock } from 'lucide-react';
import { emailService } from '../../services/api';

export const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    query_type: 'VENDOR_QUERY',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await emailService.sendContactQuery(formData);
      setSuccess(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        query_type: 'VENDOR_QUERY',
      });
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to submit inquiry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-12">
      {/* Modern Shop Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
        <Link to="/" className="hover:text-[#0a0500] transition">
          Home
        </Link>
        <ChevronRight className="w-3 h-3 text-slate-300" />
        <span className="text-[#0a0500]">Contact Administration</span>
      </nav>

      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <span className="text-xs font-black uppercase tracking-widest text-[#fcb424]">Direct Support</span>
        <h1 className="text-3xl sm:text-4xl font-black text-[#0a0500] uppercase tracking-tight">
          Get in Touch With Us
        </h1>
        <p className="text-sm text-[#504e4a] leading-relaxed">
          Questions regarding store onboarding, order fulfillment, dispute resolution, or partnership inquiries are routed straight to our platform administrator at <strong className="text-[#0a0500]">sanjaisam63@gmail.com</strong>.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-start">
        {/* Info Column */}
        <div className="space-y-6">
          <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 sm:p-8 shadow-sm space-y-5">
            <h3 className="font-black text-[#0a0500] uppercase text-xs tracking-wider pb-3 border-b border-neutral-100">
              Platform Contact Info
            </h3>

            <div className="space-y-4 text-xs text-[#504e4a]">
              <div>
                <span className="text-slate-400 block mb-1 font-bold uppercase tracking-wider text-[10px]">Administrator Email</span>
                <span className="font-bold text-[#0a0500] select-all">sanjaisam63@gmail.com</span>
              </div>

              <div>
                <span className="text-slate-400 block mb-1 font-bold uppercase tracking-wider text-[10px]">Response SLA</span>
                <div className="flex items-center gap-1.5 font-bold text-slate-700">
                  <Clock className="w-3.5 h-3.5 text-[#fcb424]" />
                  <span>Within 24 business hours</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block mb-1 font-bold uppercase tracking-wider text-[10px]">Direct Assistance For</span>
                <ul className="space-y-1.5 text-slate-600">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ffcd05]"></span>
                    <span>Merchant Onboarding & Audits</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ffcd05]"></span>
                    <span>Vendor Commission & Payouts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ffcd05]"></span>
                    <span>Dispute & Escrow Resolution</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-[#0a0500] text-white rounded-2xl p-6 shadow-md space-y-3">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#ffcd05]">
              <Store className="w-4 h-4" />
              Vendor Registration
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Applying to become a merchant? All submissions trigger instant notification emails to <strong>sanjaisam63@gmail.com</strong> for swift credential and business verification.
            </p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="md:col-span-2 bg-white border border-neutral-200/90 rounded-2xl p-6 sm:p-10 shadow-sm">
          {success ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-[#0a0500] uppercase tracking-wide">Inquiry Sent Successfully!</h2>
              <p className="text-sm text-[#504e4a] max-w-md mx-auto leading-relaxed">
                Your message has been dispatched via live SMTP to the platform administration (<strong className="text-[#0a0500]">sanjaisam63@gmail.com</strong>). An automatic confirmation receipt has been issued.
              </p>
              <button
                onClick={() => setSuccess(false)}
                className="mt-6 px-8 py-3 bg-[#0a0500] hover:bg-neutral-800 text-white font-black uppercase tracking-wider text-xs rounded-full shadow-md transition"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Alex Morgan"
                    className="w-full px-4 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-[#0a0500] focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. alex@example.com"
                    className="w-full px-4 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-[#0a0500] focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. +1 555-0199"
                    className="w-full px-4 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-[#0a0500] focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                    Inquiry Topic *
                  </label>
                  <select
                    value={formData.query_type}
                    onChange={(e) => setFormData({ ...formData, query_type: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-[#0a0500] focus:bg-white transition font-medium"
                  >
                    <option value="VENDOR_QUERY">Vendor Registration & Partnership</option>
                    <option value="CUSTOMER_SUPPORT">Customer Support</option>
                    <option value="ORDER_ISSUE">Order or Delivery Issue</option>
                    <option value="GENERAL">General Feedback / Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                  Subject *
                </label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="e.g. Inquiry regarding store approval and product sync"
                  className="w-full px-4 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-[#0a0500] focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Your Message *
                </label>
                <textarea
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Provide detailed description of your inquiry, store name, or order number..."
                  className="w-full px-4 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-[#0a0500] focus:bg-white transition resize-none"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-[#ffcd05] hover:bg-[#fcb424] text-[#0a0500] font-black uppercase tracking-wider text-xs rounded-full shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>
                    <span>Delivering via Live SMTP...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-[#0a0500]" />
                    <span>Send Message to sanjaisam63@gmail.com</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
