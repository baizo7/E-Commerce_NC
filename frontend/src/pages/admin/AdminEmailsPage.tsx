import React, { useEffect, useState } from 'react';
import {
  Mail,
  Send,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Eye,
  Server,
  Clock,
  User,
  X,
  FileText
} from 'lucide-react';
import { emailService } from '../../services/api';
import { EmailLog } from '../../types';

export const AdminEmailsPage: React.FC = () => {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [testEmail, setTestEmail] = useState<string>('customer@example.com');
  const [testing, setTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    recipient: string;
    status: string;
    error_message?: string;
    backend: string;
  } | null>(null);

  const [selectedEmail, setSelectedEmail] = useState<EmailLog | null>(null);
  const [resendingId, setResendingId] = useState<number | null>(null);
  const [resendNotice, setResendNotice] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await emailService.getEmailLogs();
      const items = Array.isArray(data) ? data : (data as any).results || [];
      setLogs(items);
    } catch (err) {
      console.error('Failed to fetch email logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await emailService.sendTestEmail(testEmail);
      setTestResult(res);
      await fetchLogs();
    } catch (err: any) {
      console.error('Test email failed:', err);
      setTestResult({
        success: false,
        recipient: testEmail,
        status: 'FAILED',
        error_message: err.response?.data?.error_message || err.message || 'SMTP connection timeout or invalid credentials',
        backend: 'Configured Backend'
      });
      await fetchLogs();
    } finally {
      setTesting(false);
    }
  };

  const handleResend = async (id: number) => {
    setResendingId(id);
    setResendNotice(null);
    try {
      const res = await emailService.resendEmail(id);
      setResendNotice(`Email re-dispatched successfully.`);
      await fetchLogs();
    } catch (err: any) {
      setResendNotice(`Failed to re-dispatch email: ${err.message}`);
    } finally {
      setResendingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Mail className="w-8 h-8 text-indigo-600" />
            Email Communications & Outbox
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time audit log of all system emails (order receipts, merchant dispatch notices, tracking updates).
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs shadow-sm transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Outbox
        </button>
      </div>

      {/* Diagnostic & Configuration Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Server className="w-5 h-5 text-indigo-600" />
            <h2 className="font-bold text-slate-900 text-sm">SMTP / Backend Settings</h2>
          </div>
          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex justify-between">
              <span className="text-slate-400">Configured Mode:</span>
              <span className="font-mono font-semibold text-slate-800">
                {testResult?.backend || 'Active Backend'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Total Sent / Logged:</span>
              <span className="font-bold text-indigo-600">{logs.length} emails</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Delivery Status:</span>
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Ready
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">
            To route through your production provider (SendGrid, Amazon SES, Brevo, or Gmail), configure <code>EMAIL_HOST</code> and <code>EMAIL_HOST_PASSWORD</code> in <code>backend/.env</code>.
          </p>
        </div>

        {/* Live Test Dispatcher */}
        <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Send className="w-5 h-5 text-indigo-600" />
            <h2 className="font-bold text-slate-900 text-sm">Send Live Diagnostic Test Email</h2>
          </div>

          <form onSubmit={handleSendTest} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              required
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="Enter destination email (e.g. test@example.com)"
              className="flex-1 px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white"
            />
            <button
              type="submit"
              disabled={testing}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {testing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Testing Dispatch...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Dispatch Test Email
                </>
              )}
            </button>
          </form>

          {testResult && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <strong>{testResult.success ? 'Diagnostic Test Passed!' : 'Delivery Failed:'}</strong>{' '}
                {testResult.success
                  ? `Message dispatched to ${testResult.recipient}. Logged in outbox.`
                  : testResult.error_message}
              </div>
            </div>
          )}

          {resendNotice && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800">
              {resendNotice}
            </div>
          )}
        </div>
      </div>

      {/* Email Outbox Log Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-900 text-sm">Dispatched Email Audit Trail</h2>
          <span className="text-xs text-slate-500">{logs.length} logged records</span>
        </div>

        {loading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
            <p className="text-xs text-slate-500">Loading email logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            No emails have been dispatched yet. Place an order or trigger a test email above!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-semibold">
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6">Recipient</th>
                  <th className="py-3 px-6">Subject</th>
                  <th className="py-3 px-6">Type</th>
                  <th className="py-3 px-6">Timestamp</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 px-6">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          log.status === 'SENT'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {log.status === 'SENT' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 font-medium text-slate-900">{log.recipient}</td>
                    <td className="py-3.5 px-6 text-slate-700 max-w-xs truncate">{log.subject}</td>
                    <td className="py-3.5 px-6">
                      <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        {log.email_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-slate-500">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-6 text-right space-x-2">
                      <button
                        onClick={() => setSelectedEmail(log)}
                        className="px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition"
                      >
                        Preview
                      </button>
                      <button
                        onClick={() => handleResend(log.id)}
                        disabled={resendingId === log.id}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition disabled:opacity-50"
                      >
                        {resendingId === log.id ? 'Resending...' : 'Resend'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* HTML Email Preview Modal */}
      {selectedEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{selectedEmail.subject}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  To: <strong>{selectedEmail.recipient}</strong> &bull; {new Date(selectedEmail.created_at).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedEmail(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-slate-100">
              {selectedEmail.body_html ? (
                <div
                  className="bg-white rounded-xl shadow-sm overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: selectedEmail.body_html }}
                />
              ) : (
                <pre className="p-4 bg-white rounded-xl text-xs font-mono whitespace-pre-wrap text-slate-700">
                  {selectedEmail.body_text}
                </pre>
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-100 bg-white flex justify-end">
              <button
                onClick={() => setSelectedEmail(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
