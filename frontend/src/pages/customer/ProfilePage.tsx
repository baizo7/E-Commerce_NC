import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authService, orderService, addressService } from '../../services/api';
import { unwrapResults, UserAddress } from '../../types';
import { Link } from 'react-router-dom';
import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Lock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Save,
  Package,
  Calendar,
  KeyRound,
  Camera,
  Upload,
  Trash2,
  RefreshCw,
  Image as ImageIcon,
  Plus,
  Edit3,
  Star,
  X
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [activeTab, setActiveTab] = useState<'profile' | 'address' | 'security'>('profile');

  // Profile Information State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Avatar Upload State
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarSuccess, setAvatarSuccess] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  // Shipping Address State
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('United States');
  const [postalCode, setPostalCode] = useState('');

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Form Processing States
  const [saving, setSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Stats
  const [ordersCount, setOrdersCount] = useState<number>(0);

  // Saved Address Book
  const [addressList, setAddressList] = useState<UserAddress[]>([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);
  const [addressFormData, setAddressFormData] = useState({
    title: 'Home',
    recipient_name: '',
    phone: '',
    street_address: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'India',
    is_default: false,
  });

  const fetchAddresses = async () => {
    try {
      setAddressLoading(true);
      const data = await addressService.getAddresses();
      setAddressList(data);
    } catch (err) {
      console.error('Failed to load address book:', err);
    } finally {
      setAddressLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const openNewAddressModal = () => {
    setEditingAddress(null);
    setAddressFormData({
      title: 'Home',
      recipient_name: user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : '',
      phone: user?.phone || '',
      street_address: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'India',
      is_default: addressList.length === 0,
    });
    setIsAddressModalOpen(true);
  };

  const openEditAddressModal = (addr: UserAddress) => {
    setEditingAddress(addr);
    setAddressFormData({
      title: addr.title,
      recipient_name: addr.recipient_name,
      phone: addr.phone,
      street_address: addr.street_address,
      city: addr.city,
      state: addr.state || '',
      postal_code: addr.postal_code,
      country: addr.country || 'India',
      is_default: addr.is_default,
    });
    setIsAddressModalOpen(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAddress) {
        await addressService.updateAddress(editingAddress.id, addressFormData);
      } else {
        await addressService.createAddress(addressFormData);
      }
      setIsAddressModalOpen(false);
      await fetchAddresses();
      setProfileSuccess(editingAddress ? 'Address updated successfully!' : 'New address added to book!');
      setTimeout(() => setProfileSuccess(null), 3000);
    } catch (err: any) {
      setProfileError(err.response?.data?.error || 'Failed to save address.');
      setTimeout(() => setProfileError(null), 4000);
    }
  };

  const handleDeleteAddress = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    try {
      await addressService.deleteAddress(id);
      await fetchAddresses();
    } catch (err: any) {
      alert('Could not delete address.');
    }
  };

  const handleSetDefaultAddress = async (id: number) => {
    try {
      await addressService.setDefaultAddress(id);
      await fetchAddresses();
    } catch (err: any) {
      alert('Could not set default address.');
    }
  };

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
      setPhone(user.phone || '');
      setAvatarUrl(user.avatar_url || '');
      setAddress(user.address || '');
      setCity(user.city || '');
      setCountry(user.country || 'United States');
      setPostalCode(user.postal_code || '');
    }

    const fetchOrderStats = async () => {
      try {
        const res = await orderService.getCustomerOrders();
        const list = unwrapResults(res);
        setOrdersCount(list.length);
      } catch (e) {
        console.error('Could not load order count', e);
      }
    };
    fetchOrderStats();
  }, [user]);

  // Handle Local Device File Selection & Direct Upload
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAvatarError('Please select a valid image file (PNG, JPG, WEBP, or GIF).');
      return;
    }

    // 5MB limit
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('Image size exceeds 5MB. Please choose a smaller photo.');
      return;
    }

    setAvatarUploading(true);
    setAvatarError(null);
    setAvatarSuccess(null);

    try {
      const res = await authService.uploadAvatar(file);
      setAvatarUrl(res.avatar_url);
      await refreshUser();
      setAvatarSuccess('Profile photo uploaded and updated successfully!');
      setTimeout(() => setAvatarSuccess(null), 4000);
    } catch (err: any) {
      console.error(err);
      setAvatarError(err.response?.data?.error || err.message || 'Failed to upload photo from device.');
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAvatar = async () => {
    if (!window.confirm('Are you sure you want to remove your profile photo?')) return;
    setAvatarUploading(true);
    setAvatarError(null);
    setAvatarSuccess(null);
    try {
      await authService.removeAvatar();
      setAvatarUrl('');
      await refreshUser();
      setAvatarSuccess('Profile photo removed.');
      setTimeout(() => setAvatarSuccess(null), 4000);
    } catch (err: any) {
      console.error(err);
      setAvatarError(err.response?.data?.error || err.message || 'Failed to remove photo.');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setProfileSuccess(null);
    setProfileError(null);

    try {
      await authService.updateProfile({
        first_name: firstName,
        last_name: lastName,
        phone,
        address,
        city,
        country,
        postal_code: postalCode,
      });
      await refreshUser();
      setProfileSuccess('Account details saved successfully.');
      setTimeout(() => setProfileSuccess(null), 4000);
    } catch (err: any) {
      console.error(err);
      setProfileError(err.response?.data?.detail || err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSaving(true);
    setPasswordSuccess(null);
    setPasswordError(null);

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      setPasswordSaving(false);
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long.');
      setPasswordSaving(false);
      return;
    }

    try {
      const res = await authService.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPasswordSuccess(res.message || 'Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(null), 4000);
    } catch (err: any) {
      console.error(err);
      setPasswordError(
        err.response?.data?.error ||
        err.response?.data?.current_password?.[0] ||
        err.response?.data?.new_password?.[0] ||
        'Failed to change password. Please check your current password.'
      );
    } finally {
      setPasswordSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <p className="text-slate-500 text-sm">Please log in to view your profile.</p>
        <Link to="/login" className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold">
          Sign In
        </Link>
      </div>
    );
  }

  const userInitials = (user.first_name?.[0] || user.email[0]).toUpperCase();

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Hidden Native File Input for Local System Image Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
        className="hidden"
      />

      {/* Header Banner */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          {/* Avatar with Quick Upload Trigger */}
          <div className="relative group flex-shrink-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-extrabold text-2xl flex items-center justify-center shadow-lg shadow-indigo-100 overflow-hidden border-2 border-white">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                userInitials
              )}
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarUploading}
              title="Upload photo from device"
              className="absolute -bottom-1.5 -right-1.5 p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition disabled:opacity-50"
            >
              {avatarUploading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Camera className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {user.first_name ? `${user.first_name} ${user.last_name}` : user.username}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                {user.role}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              {user.email}
            </p>
          </div>
        </div>

        {/* Quick Stats Pill */}
        <div className="flex items-center gap-3">
          <Link
            to="/orders"
            className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl transition text-left"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Orders Placed</span>
              <span className="text-xs font-bold text-slate-900">{ordersCount} shipments</span>
            </div>
          </Link>

          <div className="hidden sm:flex items-center gap-3 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-left">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Account Status</span>
              <span className="text-xs font-bold text-emerald-600">Active Member</span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Tabs Navigation */}
      <div className="flex border-b border-slate-200 space-x-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition ${
            activeTab === 'profile'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserIcon className="w-4 h-4" />
          Personal Details
        </button>

        <button
          onClick={() => setActiveTab('address')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition ${
            activeTab === 'address'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MapPin className="w-4 h-4" />
          Default Delivery Address
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition ${
            activeTab === 'security'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Lock className="w-4 h-4" />
          Security & Password
        </button>
      </div>

      {/* Tab 1: Personal Details */}
      {activeTab === 'profile' && (
        <form onSubmit={handleUpdateProfile} className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Personal Information</h2>
            <p className="text-xs text-slate-500 mt-0.5">Manage your profile photo, name, and contact details.</p>
          </div>

          {profileSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{profileSuccess}</span>
            </div>
          )}

          {profileError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          {/* Local Device Photo Upload Box */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <label className="block text-xs font-bold text-slate-800">Profile Photo</label>

            {avatarSuccess && (
              <div className="p-2.5 bg-emerald-100/70 border border-emerald-200 text-emerald-900 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{avatarSuccess}</span>
              </div>
            )}

            {avatarError && (
              <div className="p-2.5 bg-rose-100/70 border border-rose-200 text-rose-900 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{avatarError}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white font-bold text-xl flex items-center justify-center overflow-hidden flex-shrink-0 border-2 border-white shadow">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  userInitials
                )}
              </div>

              <div className="space-y-1.5 text-center sm:text-left flex-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={avatarUploading}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-sm transition disabled:opacity-50"
                  >
                    {avatarUploading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Uploading Image...
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        Upload Photo from Device
                      </>
                    )}
                  </button>

                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      disabled={avatarUploading}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-700 font-semibold rounded-xl text-xs shadow-sm transition disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      Remove
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  Select an image from your computer (PNG, JPG, WEBP, or GIF up to 5MB).
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Sarah"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Jenkins"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                disabled
                value={user.email}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-100 text-slate-500 border border-slate-200 rounded-xl cursor-not-allowed"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Account login email cannot be modified.</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +1 (555) 019-2834"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white transition"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow flex items-center gap-2 transition disabled:opacity-50"
            >
              {saving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Save Details
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Saved Address Book */}
      {activeTab === 'address' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-amber-500" />
                Saved Delivery Addresses
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage your home, studio, and office addresses for 1-click selection during checkout.
              </p>
            </div>
            <button
              type="button"
              onClick={openNewAddressModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow transition self-start sm:self-auto"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              Add New Address
            </button>
          </div>

          {addressList.length === 0 ? (
            <div className="bg-white border border-slate-200/90 rounded-3xl p-12 text-center shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">No saved addresses yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Add your primary delivery location to streamline checkout across all vendor packages.
              </p>
              <button
                type="button"
                onClick={openNewAddressModal}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Add First Address
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addressList.map((addr) => (
                <div
                  key={addr.id}
                  className={`bg-white border rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 transition ${
                    addr.is_default ? 'border-slate-950 ring-1 ring-slate-950' : 'border-slate-200'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-black">
                          {addr.title}
                        </span>
                        {addr.is_default && (
                          <span className="px-2 py-0.5 rounded bg-slate-950 text-amber-400 text-[10px] font-black uppercase flex items-center gap-1">
                            <Star className="w-3 h-3 fill-amber-400" />
                            Default
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditAddressModal(addr)}
                          className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition"
                          title="Edit address"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                          title="Delete address"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <p className="font-bold text-slate-900 text-sm">{addr.recipient_name}</p>
                      <p className="text-xs text-slate-500">{addr.phone}</p>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed">
                      {addr.street_address}, {addr.city}
                      {addr.state ? `, ${addr.state}` : ''} {addr.postal_code}
                      <br />
                      <span className="text-slate-400">{addr.country}</span>
                    </p>
                  </div>

                  {!addr.is_default && (
                    <div className="pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => handleSetDefaultAddress(addr.id)}
                        className="text-xs font-bold text-amber-600 hover:text-amber-700 hover:underline"
                      >
                        Set as Default Address
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add / Edit Address Modal */}
          {isAddressModalOpen && (
            <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-amber-500" />
                    {editingAddress ? 'Edit Address' : 'Add New Saved Address'}
                  </h3>
                  <button
                    onClick={() => setIsAddressModalOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveAddress} className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Address Label</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Home, Studio, Office"
                        value={addressFormData.title}
                        onChange={(e) => setAddressFormData({ ...addressFormData, title: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-950 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Recipient Name</label>
                      <input
                        type="text"
                        required
                        placeholder="Full Name"
                        value={addressFormData.recipient_name}
                        onChange={(e) => setAddressFormData({ ...addressFormData, recipient_name: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-950 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        required
                        placeholder="+91 ..."
                        value={addressFormData.phone}
                        onChange={(e) => setAddressFormData({ ...addressFormData, phone: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-950 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Country</label>
                      <input
                        type="text"
                        value={addressFormData.country}
                        onChange={(e) => setAddressFormData({ ...addressFormData, country: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-950 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Street Address</label>
                    <textarea
                      required
                      rows={2}
                      placeholder="Flat, building, street, area"
                      value={addressFormData.street_address}
                      onChange={(e) => setAddressFormData({ ...addressFormData, street_address: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-950 focus:bg-white resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">City</label>
                      <input
                        type="text"
                        required
                        placeholder="City"
                        value={addressFormData.city}
                        onChange={(e) => setAddressFormData({ ...addressFormData, city: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-950 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">State / Region</label>
                      <input
                        type="text"
                        placeholder="State"
                        value={addressFormData.state}
                        onChange={(e) => setAddressFormData({ ...addressFormData, state: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-950 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">PIN / ZIP Code</label>
                      <input
                        type="text"
                        required
                        placeholder="PIN"
                        value={addressFormData.postal_code}
                        onChange={(e) => setAddressFormData({ ...addressFormData, postal_code: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-950 focus:bg-white"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 pt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={addressFormData.is_default}
                      onChange={(e) => setAddressFormData({ ...addressFormData, is_default: e.target.checked })}
                      className="rounded text-amber-500 focus:ring-amber-400"
                    />
                    <span className="font-semibold text-slate-700">Make this my default shipping address</span>
                  </label>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsAddressModalOpen(false)}
                      className="px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs"
                    >
                      {editingAddress ? 'Update Address' : 'Save Address'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Security & Password */}
      {activeTab === 'security' && (
        <form onSubmit={handleChangePassword} className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Security & Password</h2>
            <p className="text-xs text-slate-500 mt-0.5">Update your account authentication credentials.</p>
          </div>

          {passwordSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          {passwordError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter your current password"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white transition"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={passwordSaving}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow flex items-center gap-2 transition disabled:opacity-50"
            >
              {passwordSaving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Updating Password...
                </>
              ) : (
                <>
                  <KeyRound className="w-3.5 h-3.5" />
                  Change Password
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
