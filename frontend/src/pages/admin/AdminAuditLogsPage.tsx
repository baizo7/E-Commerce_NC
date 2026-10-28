import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Shield,
  Eye,
  X,
  User,
  Clock,
  Terminal,
  Activity
} from 'lucide-react';
import { adminService } from '../../services/api';
import { AuditLog } from '../../types';
import { AdminSubNav } from '../../components/AdminSubNav';

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      log.action?.toLowerCase().includes(term) ||
      log.actor_email?.toLowerCase().includes(term) ||
      log.target_model?.toLowerCase().includes(term) ||
      log.ip_address?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <AdminSubNav />

      {/* Header Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-black uppercase tracking-widest text-[#fcb424]">Enterprise Compliance & Moderation</span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-950 uppercase tracking-tight mt-1 flex items-center gap-2.5">
            <History className="w-7 h-7 text-slate-950" />
            Audit Activity Trail
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Immutable tracking of merchant status changes, user permissions, dispute resolutions, and platform administrative actions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
            {logs.length} Audit Events Logged
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-sm w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search action, actor email, or model..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-full text-xs outline-none focus:border-slate-950 shadow-xs"
          />
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-900 uppercase font-black tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-4 px-5">Timestamp</th>
                <th className="py-4 px-5">Actor</th>
                <th className="py-4 px-5">Action</th>
                <th className="py-4 px-5">Target Entity</th>
                <th className="py-4 px-5">Target ID</th>
                <th className="py-4 px-5">IP Address</th>
                <th className="py-4 px-5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading audit trail events...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No audit records match your query.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-4 px-5 text-slate-500 font-mono text-[11px]">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-4 px-5 font-bold text-slate-900">
                      {log.actor_email || (log.actor ? `User #${log.actor}` : 'System')}
                    </td>
                    <td className="py-4 px-5">
                      <span className="px-2.5 py-1 rounded-md bg-slate-900 text-amber-400 font-black text-[10px] uppercase font-mono tracking-wide">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-slate-600 font-mono font-semibold">
                      {log.target_model}
                    </td>
                    <td className="py-4 px-5 font-mono text-slate-500">
                      #{log.target_id}
                    </td>
                    <td className="py-4 px-5 font-mono text-slate-500 text-[11px]">
                      {log.ip_address || '—'}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition inline-flex items-center gap-1 font-bold"
                        title="View payload diff"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <Terminal className="w-4 h-4 text-slate-950" />
                Audit Event #{selectedLog.id} Payload
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="font-bold text-slate-400 block uppercase text-[10px]">Action</span>
                  <span className="font-black text-slate-900">{selectedLog.action}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-400 block uppercase text-[10px]">Timestamp</span>
                  <span className="text-slate-700">{new Date(selectedLog.created_at).toLocaleString()}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-400 block uppercase text-[10px]">Actor</span>
                  <span className="text-slate-700">{selectedLog.actor_email}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-400 block uppercase text-[10px]">IP Address</span>
                  <span className="font-mono text-slate-700">{selectedLog.ip_address || 'Internal'}</span>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-700 block mb-1.5 uppercase text-[10px] tracking-wider">
                  Logged State Diff / Payload:
                </span>
                <pre className="p-4 bg-slate-950 text-amber-400 rounded-2xl overflow-x-auto text-[11px] font-mono leading-relaxed max-h-60">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 bg-slate-950 text-white rounded-xl font-bold hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
