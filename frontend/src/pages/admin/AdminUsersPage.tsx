import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  Shield,
  ShieldCheck,
  Store,
  User as UserIcon,
  CreditCard,
  Calendar,
  X,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { adminService } from '../../services/api';
import { AdminUser } from '../../types';
import { AdminSubNav } from '../../components/AdminSubNav';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'CUSTOMER' | 'VENDOR' | 'ADMIN'>('ALL');

  // Role Elevation Modal
  const [roleModalUser, setRoleModalUser] = useState<AdminUser | null>(null);
  const [selectedNewRole, setSelectedNewRole] = useState<'CUSTOMER' | 'VENDOR' | 'ADMIN'>('CUSTOMER');
  const [updatingRole, setUpdatingRole] = useState(false);

  // User Dossier Modal
  const [inspectUser, setInspectUser] = useState<AdminUser | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await adminService.getUsers({
        role: roleFilter === 'ALL' ? undefined : roleFilter,
        search: searchTerm || undefined,
      });
      setUsers(res);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 200);
    return () => clearTimeout(timer);
  }, [searchTerm, roleFilter]);

  // KPIs
  const stats = useMemo(() => {
    const total = users.length;
    const customers = users.filter((u) => u.role === 'CUSTOMER').length;
    const vendors = users.filter((u) => u.role === 'VENDOR').length;
    const admins = users.filter((u) => u.role === 'ADMIN').length;
    return { total, customers, vendors, admins };
  }, [users]);

  // Open role elevation modal
  const handleOpenRoleModal = (u: AdminUser) => {
    setRoleModalUser(u);
    setSelectedNewRole(u.role);
  };

  // Submit role update
  const handleUpdateRole = async () => {
    if (!roleModalUser) return;
    setUpdatingRole(true);
    try {
      const res = await adminService.updateUserRole(roleModalUser.id, selectedNewRole);
      // Update local state
      setUsers((prev) =>
        prev.map((u) => (u.id === roleModalUser.id ? { ...u, role: selectedNewRole } : u))
      );
      if (inspectUser && inspectUser.id === roleModalUser.id) {
        setInspectUser((prev) => (prev ? { ...prev, role: selectedNewRole } : null));
      }
      setRoleModalUser(null);
    } catch (err) {
      console.error('Failed to update user role:', err);
      alert('Failed to update user role.');
    } finally {
      setUpdatingRole(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* Unified Admin SubNav */}
      <AdminSubNav />

      {/* Header Banner */}
      <div className="bg-[#0a0500] text-white rounded-3xl p-8 relative overflow-hidden shadow-xl border border-neutral-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#ffcd05]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-700/80 text-[#ffcd05] text-[11px] font-black uppercase tracking-wider">
              <Users className="w-3.5 h-3.5" />
              <span>Platform Identity & Role-Based Access Control</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              User Directory & Role Governance
            </h1>
            <p className="text-neutral-400 text-sm max-w-2xl font-medium leading-relaxed">
              Supervise all registered platform accounts. Audit lifetime customer spend, inspect merchant linkages, and elevate or restrict access privileges.
            </p>
          </div>

          {/* Quick Counter Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-3.5 text-center min-w-[90px]">
              <span className="text-[10px] font-black uppercase text-neutral-400 block tracking-wider">Total</span>
              <span className="text-xl font-black text-white">{stats.total}</span>
            </div>
            <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-3.5 text-center min-w-[90px]">
              <span className="text-[10px] font-black uppercase text-neutral-400 block tracking-wider">Customers</span>
              <span className="text-xl font-black text-neutral-300">{stats.customers}</span>
            </div>
            <div className="bg-neutral-900/90 border border-amber-900/40 rounded-2xl p-3.5 text-center min-w-[90px]">
              <span className="text-[10px] font-black uppercase text-amber-400 block tracking-wider">Vendors</span>
              <span className="text-xl font-black text-[#ffcd05]">{stats.vendors}</span>
            </div>
            <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-3.5 text-center min-w-[90px]">
              <span className="text-[10px] font-black uppercase text-neutral-400 block tracking-wider">Admins</span>
              <span className="text-xl font-black text-white">{stats.admins}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
          {/* Search Input */}
          <div className="md:col-span-7 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by user email, first name, last name, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 hover:bg-neutral-100/70 focus:bg-white border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-900 placeholder-neutral-400 focus:border-[#0a0500] outline-none transition"
            />
          </div>

          {/* Role Filter Tabs */}
          <div className="md:col-span-5 flex items-center bg-neutral-100 p-1 rounded-xl">
            {(['ALL', 'CUSTOMER', 'VENDOR', 'ADMIN'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition ${
                  roleFilter === r
                    ? 'bg-[#0a0500] text-white shadow-sm font-black'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {r === 'ALL' ? 'All Roles' : r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-neutral-200/90 rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-16 text-center">
            <div className="w-8 h-8 border-2 border-[#0a0500] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">Loading user registry...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <Users className="w-12 h-12 text-neutral-300 mx-auto" />
            <h3 className="font-bold text-neutral-800 text-base">No users found</h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              No platform accounts matched your search criteria or role filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-500 uppercase font-black text-[10px] tracking-wider border-b border-neutral-100">
                <tr>
                  <th className="py-4 px-4">User Account</th>
                  <th className="py-4 px-4">Role Privileges</th>
                  <th className="py-4 px-4">Merchant Linkage</th>
                  <th className="py-4 px-4">Orders Placed</th>
                  <th className="py-4 px-4">Lifetime Spend</th>
                  <th className="py-4 px-4">Joined Platform</th>
                  <th className="py-4 px-4 text-right">Access Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {users.map((u) => {
                  const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username || 'User';
                  const initials = fullName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);

                  return (
                    <tr key={u.id} className="hover:bg-neutral-50/70 transition">
                      {/* User Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {u.avatar_url ? (
                            <img
                              src={u.avatar_url}
                              alt=""
                              className="w-10 h-10 rounded-full object-cover border border-neutral-200"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-[#0a0500] text-[#ffcd05] font-black text-xs flex items-center justify-center flex-shrink-0">
                              {initials}
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-neutral-900 block text-xs">{fullName}</span>
                            <span className="text-[11px] text-neutral-500 block">{u.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4">
                        {u.role === 'ADMIN' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0a0500] text-white font-black text-[10px] uppercase tracking-wider">
                            <ShieldCheck className="w-3.5 h-3.5 text-[#ffcd05]" />
                            <span>Administrator</span>
                          </span>
                        ) : u.role === 'VENDOR' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200/80 font-black text-[10px] uppercase tracking-wider">
                            <Store className="w-3.5 h-3.5 text-amber-600" />
                            <span>Merchant Vendor</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 text-neutral-700 font-bold text-[10px] uppercase tracking-wider">
                            <UserIcon className="w-3.5 h-3.5 text-neutral-400" />
                            <span>Customer</span>
                          </span>
                        )}
                      </td>

                      {/* Merchant Linkage */}
                      <td className="py-3.5 px-4">
                        {u.vendor_profile ? (
                          <div>
                            <span className="font-bold text-neutral-900 block truncate max-w-[150px]">
                              {u.vendor_profile.store_name}
                            </span>
                            <span className="text-[10px] font-semibold text-neutral-400 uppercase">
                              Status: {u.vendor_profile.status}
                            </span>
                          </div>
                        ) : (
                          <span className="text-neutral-400 text-[11px] font-medium">—</span>
                        )}
                      </td>

                      {/* Orders Count */}
                      <td className="py-3.5 px-4 font-bold text-neutral-800">
                        {u.orders_count || 0} orders
                      </td>

                      {/* Lifetime Spend */}
                      <td className="py-3.5 px-4 font-black text-neutral-900">
                        ${Number(u.total_spent || 0).toFixed(2)}
                      </td>

                      {/* Date Joined */}
                      <td className="py-3.5 px-4 text-neutral-500 font-medium text-[11px]">
                        {new Date(u.date_joined).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setInspectUser(u)}
                            className="p-1.5 rounded-lg text-neutral-500 hover:text-[#0a0500] hover:bg-neutral-100 transition"
                            title="Inspect Profile"
                          >
                            <UserIcon className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleOpenRoleModal(u)}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-neutral-200 text-neutral-700 hover:text-[#0a0500] hover:border-[#0a0500] font-black text-[10px] uppercase tracking-wider transition"
                          >
                            <Shield className="w-3 h-3 text-[#ffcd05]" />
                            <span>Modify Role</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Role Elevation Modal */}
      {roleModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0500]/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 space-y-5 animate-fadeIn">
            <div className="flex items-start justify-between pb-3 border-b border-neutral-100">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#ffcd05] bg-[#0a0500] px-2 py-0.5 rounded-full inline-block">
                  RBAC Role Governance
                </span>
                <h3 className="font-black text-neutral-900 text-lg mt-1">
                  Change Role for {roleModalUser.first_name || roleModalUser.email}
                </h3>
                <span className="text-xs text-neutral-400 font-medium">{roleModalUser.email}</span>
              </div>
              <button
                onClick={() => setRoleModalUser(null)}
                className="p-1 text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black uppercase tracking-wider text-neutral-500 block">
                Assign Platform Role:
              </label>

              {/* CUSTOMER Choice */}
              <label
                onClick={() => setSelectedNewRole('CUSTOMER')}
                className={`p-3.5 rounded-2xl border cursor-pointer block transition ${
                  selectedNewRole === 'CUSTOMER'
                    ? 'border-[#0a0500] bg-neutral-50 ring-1 ring-[#0a0500]'
                    : 'border-neutral-200 hover:bg-neutral-50/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-neutral-200 text-neutral-700 flex items-center justify-center font-bold text-xs">
                      <UserIcon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-black text-xs text-neutral-900 block">CUSTOMER</span>
                      <span className="text-[11px] text-neutral-500">Standard shopper with shopping cart & checkout</span>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="role"
                    checked={selectedNewRole === 'CUSTOMER'}
                    onChange={() => setSelectedNewRole('CUSTOMER')}
                    className="accent-[#0a0500]"
                  />
                </div>
              </label>

              {/* VENDOR Choice */}
              <label
                onClick={() => setSelectedNewRole('VENDOR')}
                className={`p-3.5 rounded-2xl border cursor-pointer block transition ${
                  selectedNewRole === 'VENDOR'
                    ? 'border-[#0a0500] bg-neutral-50 ring-1 ring-[#0a0500]'
                    : 'border-neutral-200 hover:bg-neutral-50/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-xs">
                      <Store className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-black text-xs text-neutral-900 block">VENDOR</span>
                      <span className="text-[11px] text-neutral-500">Merchant access to manage products & fulfill orders</span>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="role"
                    checked={selectedNewRole === 'VENDOR'}
                    onChange={() => setSelectedNewRole('VENDOR')}
                    className="accent-[#0a0500]"
                  />
                </div>
              </label>

              {/* ADMIN Choice */}
              <label
                onClick={() => setSelectedNewRole('ADMIN')}
                className={`p-3.5 rounded-2xl border cursor-pointer block transition ${
                  selectedNewRole === 'ADMIN'
                    ? 'border-[#0a0500] bg-neutral-50 ring-1 ring-[#0a0500]'
                    : 'border-neutral-200 hover:bg-neutral-50/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-[#0a0500] text-[#ffcd05] flex items-center justify-center font-bold text-xs">
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-black text-xs text-neutral-900 block">ADMIN</span>
                      <span className="text-[11px] text-neutral-500">Root marketplace access, finance, & moderation controls</span>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="role"
                    checked={selectedNewRole === 'ADMIN'}
                    onChange={() => setSelectedNewRole('ADMIN')}
                    className="accent-[#0a0500]"
                  />
                </div>
              </label>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRoleModalUser(null)}
                className="px-4 py-2 rounded-full border border-neutral-200 text-neutral-600 text-xs font-bold uppercase tracking-wider hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={updatingRole || selectedNewRole === roleModalUser.role}
                onClick={handleUpdateRole}
                className="px-5 py-2 rounded-full bg-[#0a0500] hover:bg-neutral-800 text-white text-xs font-black uppercase tracking-wider transition shadow-sm disabled:opacity-50"
              >
                {updatingRole ? 'Updating...' : 'Save Privileges'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inspect User Dossier Modal */}
      {inspectUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0500]/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-neutral-200 space-y-6 my-8 animate-fadeIn">
            <div className="flex items-start justify-between pb-4 border-b border-neutral-100">
              <div className="flex items-center gap-3">
                {inspectUser.avatar_url ? (
                  <img
                    src={inspectUser.avatar_url}
                    alt=""
                    className="w-12 h-12 rounded-full object-cover border border-neutral-200"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#0a0500] text-[#ffcd05] font-black text-base flex items-center justify-center">
                    {(inspectUser.first_name?.[0] || inspectUser.username?.[0] || 'U').toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="font-black text-neutral-900 text-lg">
                    {inspectUser.first_name} {inspectUser.last_name}
                  </h3>
                  <span className="text-xs text-neutral-500 font-medium">{inspectUser.email}</span>
                </div>
              </div>
              <button
                onClick={() => setInspectUser(null)}
                className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/80">
                  <span className="text-[10px] font-black uppercase text-neutral-400 block tracking-wider">Role</span>
                  <span className="font-bold text-neutral-900 block mt-0.5">{inspectUser.role}</span>
                </div>
                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/80">
                  <span className="text-[10px] font-black uppercase text-neutral-400 block tracking-wider">Phone</span>
                  <span className="font-bold text-neutral-900 block mt-0.5">{inspectUser.phone || 'None provided'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/80">
                  <span className="text-[10px] font-black uppercase text-neutral-400 block tracking-wider">Orders</span>
                  <span className="font-black text-neutral-900 text-sm block mt-0.5">{inspectUser.orders_count || 0}</span>
                </div>
                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/80">
                  <span className="text-[10px] font-black uppercase text-neutral-400 block tracking-wider">Total Spent</span>
                  <span className="font-black text-emerald-700 text-sm block mt-0.5">${Number(inspectUser.total_spent || 0).toFixed(2)}</span>
                </div>
              </div>

              {inspectUser.vendor_profile && (
                <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200/80 space-y-2">
                  <span className="text-[10px] font-black uppercase text-amber-900 block tracking-wider">
                    Linked Merchant Storefront
                  </span>
                  <div className="flex justify-between items-center">
                    <span className="font-black text-neutral-900 text-sm">{inspectUser.vendor_profile.store_name}</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
                      {inspectUser.vendor_profile.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-600 line-clamp-2">
                    {inspectUser.vendor_profile.description || 'No store description.'}
                  </p>
                </div>
              )}

              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/80 space-y-1">
                <div className="flex justify-between text-neutral-500">
                  <span>Joined Marketplace:</span>
                  <span className="font-semibold text-neutral-800">
                    {new Date(inspectUser.date_joined).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
              <button
                onClick={() => {
                  const target = inspectUser;
                  setInspectUser(null);
                  handleOpenRoleModal(target);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-700 hover:text-[#0a0500]"
              >
                <Shield className="w-3.5 h-3.5 text-[#ffcd05]" />
                <span>Change User Role</span>
              </button>

              <button
                onClick={() => setInspectUser(null)}
                className="px-5 py-2 bg-[#0a0500] text-white text-xs font-black uppercase tracking-wider rounded-full hover:bg-neutral-800 transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};