import React, { useState } from 'react';
import {
  ShieldCheck,
  CreditCard,
  QrCode,
  Building2,
  Wallet,
  X,
  Lock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Zap,
  Info
} from 'lucide-react';
import { Order } from '../types';

interface RazorpaySandboxModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (paymentId: string) => Promise<void>;
  onFailure: (errorReason: string) => Promise<void>;
}

export const RazorpaySandboxModal: React.FC<RazorpaySandboxModalProps> = ({
  order,
  isOpen,
  onClose,
  onSuccess,
  onFailure,
}) => {
  const [activeTab, setActiveTab] = useState<'CARD' | 'UPI' | 'NETBANKING' | 'WALLET'>('CARD');
  const [processing, setProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Form states
  const [cardNumber, setCardNumber] = useState('4111 •••• •••• 1111');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('123');
  const [cardHolder, setCardHolder] = useState(order.shipping_name || 'Sarah Jenkins');
  const [upiId, setUpiId] = useState('customer@oksbi');
  const [selectedBank, setSelectedBank] = useState('HDFC');
  const [selectedWallet, setSelectedWallet] = useState('Amazon Pay');

  if (!isOpen) return null;

  const grandTotal = Number(order.grand_total);
  const totalInInr = (grandTotal * 83).toFixed(2); // Approximate INR conversion if displayed in INR

  const handlePay = async (simulateFailure: boolean = false) => {
    setProcessing(true);
    setStatusMessage(simulateFailure ? 'Simulating bank decline...' : 'Contacting issuing bank for 3D-Secure approval...');

    setTimeout(async () => {
      try {
        if (simulateFailure) {
          await onFailure('Bank declined authorization: Insufficient balance or card limits exceeded.');
        } else {
          const simulatedPaymentId = `pay_rzp_${Date.now()}`;
          setStatusMessage('Signature verified! Confirming order...');
          await onSuccess(simulatedPaymentId);
        }
      } catch (err: any) {
        console.error('Sandbox payment handler error:', err);
      } finally {
        setProcessing(false);
      }
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Razorpay Brand Header */}
        <div className="bg-[#0c2340] text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-lg text-white shadow-md">
              <Zap className="w-6 h-6 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base tracking-tight">Razorpay Gateway</h3>
                <span className="text-[10px] font-bold uppercase bg-amber-400 text-slate-900 px-2 py-0.5 rounded-full">
                  Sandbox Simulation
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Order <span className="font-mono text-blue-200">#{order.order_number}</span> &bull; {order.shipping_email}
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs text-slate-300">Amount Payable</div>
            <div className="text-xl font-extrabold text-white">₹{order.grand_total}</div>
          </div>

          <button
            onClick={onClose}
            disabled={processing}
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informational banner */}
        <div className="bg-blue-50 px-6 py-2.5 border-b border-blue-100 flex items-center gap-2 text-xs text-blue-800">
          <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span>
            Test mode gateway modal. You can test authorization approval or simulate bank declines.
          </span>
        </div>

        {/* Modal Body: Tabs & Form */}
        <div className="p-6">
          {/* Payment Method Tabs */}
          <div className="grid grid-cols-4 gap-2 pb-5 border-b border-slate-100 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('CARD')}
              className={`py-2.5 px-2 rounded-xl flex flex-col items-center gap-1.5 transition ${
                activeTab === 'CARD'
                  ? 'bg-blue-50 text-blue-700 border-2 border-blue-500 font-bold'
                  : 'text-slate-600 hover:bg-slate-50 border border-transparent'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Card</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('UPI')}
              className={`py-2.5 px-2 rounded-xl flex flex-col items-center gap-1.5 transition ${
                activeTab === 'UPI'
                  ? 'bg-blue-50 text-blue-700 border-2 border-blue-500 font-bold'
                  : 'text-slate-600 hover:bg-slate-50 border border-transparent'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>UPI / QR</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('NETBANKING')}
              className={`py-2.5 px-2 rounded-xl flex flex-col items-center gap-1.5 transition ${
                activeTab === 'NETBANKING'
                  ? 'bg-blue-50 text-blue-700 border-2 border-blue-500 font-bold'
                  : 'text-slate-600 hover:bg-slate-50 border border-transparent'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Netbanking</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('WALLET')}
              className={`py-2.5 px-2 rounded-xl flex flex-col items-center gap-1.5 transition ${
                activeTab === 'WALLET'
                  ? 'bg-blue-50 text-blue-700 border-2 border-blue-500 font-bold'
                  : 'text-slate-600 hover:bg-slate-50 border border-transparent'
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span>Wallet</span>
            </button>
          </div>

          {/* Tab 1: Credit / Debit Card */}
          {activeTab === 'CARD' && (
            <div className="pt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Card Number</label>
                <div className="relative">
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm font-mono bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white"
                  />
                  <span className="absolute right-3 top-3 text-[10px] font-bold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                    VISA TEST
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Expiry</label>
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm font-mono bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">CVV</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm font-mono bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cardholder Name</label>
                <input
                  type="text"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>
            </div>
          )}

          {/* Tab 2: UPI / QR */}
          {activeTab === 'UPI' && (
            <div className="pt-5 space-y-4">
              <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-slate-200 shadow-sm">
                    <QrCode className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">Scan & Pay via any UPI App</h4>
                    <p className="text-[11px] text-slate-500">Google Pay, PhonePe, Paytm, BHIM</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                  Active
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Virtual Payment Address (VPA)</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm font-mono bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white"
                  placeholder="username@bank"
                />
              </div>
            </div>
          )}

          {/* Tab 3: Netbanking */}
          {activeTab === 'NETBANKING' && (
            <div className="pt-5 space-y-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Bank</label>
              <div className="grid grid-cols-2 gap-2.5">
                {['HDFC', 'ICICI', 'State Bank of India', 'Axis Bank', 'Kotak', 'Punjab National'].map((bank) => (
                  <button
                    key={bank}
                    type="button"
                    onClick={() => setSelectedBank(bank)}
                    className={`p-3 rounded-xl border text-left text-xs font-semibold transition ${
                      selectedBank === bank
                        ? 'border-blue-600 bg-blue-50 text-blue-900'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {bank}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tab 4: Wallet */}
          {activeTab === 'WALLET' && (
            <div className="pt-5 space-y-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Wallet</label>
              <div className="grid grid-cols-2 gap-2.5">
                {['Amazon Pay', 'Paytm Wallet', 'Mobikwik', 'PhonePe Wallet'].map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setSelectedWallet(w)}
                    className={`p-3 rounded-xl border text-left text-xs font-semibold transition ${
                      selectedWallet === w
                        ? 'border-blue-600 bg-blue-50 text-blue-900'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Status Message */}
          {statusMessage && (
            <div className="mt-4 p-3 rounded-xl bg-amber-50 text-amber-800 text-xs flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Payment Actions */}
          <div className="mt-6 space-y-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              disabled={processing}
              onClick={() => handlePay(false)}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-lg shadow-blue-200 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {processing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Authorizing Payment...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Pay ₹{order.grand_total} (Authorize)
                </>
              )}
            </button>

            <div className="flex items-center justify-between gap-3 pt-1">
              <button
                type="button"
                disabled={processing}
                onClick={() => handlePay(true)}
                className="text-xs text-rose-600 hover:text-rose-700 hover:underline font-semibold"
              >
                Simulate Bank Decline &rarr;
              </button>

              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>256-Bit Encrypted</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
