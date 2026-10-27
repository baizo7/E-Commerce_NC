import React, { useState } from 'react';
import { Mail, Send, CheckCircle2, AlertCircle, HelpCircle, Store, MessageSquare, Phone, User } from 'lucide-react';
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
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold">
          <Mail className="w-3.5 h-3.5" />
          Direct Platform Communications
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Contact Platform Administration
        </h1>
        <p className="text-sm text-slate-500 max-w-lg mx-auto">
          Have questions about vendor onboarding, store approvals, orders, or partnership? Send a message directly to the platform team at <strong className="text-slate-800">producte23@gmail.com</strong>.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Info Column */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Platform Admin Contact</h3>
            <div className="space-y-3 text-xs text-slate-600">
              <div>
                <span className="text-slate-400 block mb-0.5">Primary Administrator Email</span>
                <span className="font-semibold text-indigo-600 select-all">producte23@gmail.com</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Inquiry Types Handled</span>
                <ul className="list-disc list-inside space-y-1 text-slate-500">
                  <li>Vendor Application & Approval</li>
                  <li>Commission & Payout Inquiries</li>
                  <li>Order & Dispute Resolution</li>
                  <li>Technical Support & Feedback</li>
                </ul>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Response Time</span>
                <span className="text-slate-700 font-medium">Within 24 business hours</span>
              </div>
            </div>
          </div>

          <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-5 text-xs text-indigo-950 space-y-2">
            <div className="flex items-center gap-2 font-bold text-indigo-900">
              <Store className="w-4 h-4 text-indigo-600" />
              Vendor Registration Questions?
            </div>
            <p className="text-indigo-800/80 leading-relaxed">
              If you have already registered a store, all alerts are automatically routed to <strong>producte23@gmail.com</strong> for administrator review and activation.
            </p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="md:col-span-2 bg-white border border-slate-200/90 rounded-2xl p-8 shadow-sm">
          {success ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Inquiry Routed Successfully!</h2>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Your message has been dispatched to the platform admin (<strong className="text-slate-700">producte23@gmail.com</strong>). An automated confirmation email has also been logged.
              </p>
              <button
                onClick={() => setSuccess(false)}
                className="mt-4 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition"
              >
                Send Another Inquiry
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Alex Morgan"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    Your Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. alex@example.com"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. +1 555-0199"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                    Inquiry Type *
                  </label>
                  <select
                    value={formData.query_type}
                    onChange={(e) => setFormData({ ...formData, query_type: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white transition"
                  >
                    <option value="VENDOR_QUERY">Vendor Registration & Partnership</option>
                    <option value="CUSTOMER_SUPPORT">Customer Support</option>
                    <option value="ORDER_ISSUE">Order or Delivery Issue</option>
                    <option value="GENERAL">General Feedback / Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                  Subject *
                </label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="e.g. Question regarding vendor approval and inventory sync"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Your Message *
                </label>
                <textarea
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Provide detailed description of your inquiry, store name, or order number..."
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white transition resize-none"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Routing to Admin...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Inquiry to producte23@gmail.com
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
