import React, { useState, useEffect } from 'react';
import { Store, Upload, CheckCircle2, AlertCircle, Save, Building2, CreditCard, ShieldCheck, Image as ImageIcon } from 'lucide-react';
import { vendorService } from '../../services/api';
import { VendorProfile } from '../../types';
import { VendorSubNav } from '../../components/VendorSubNav';
import { useAuth } from '../../context/AuthContext';

export const VendorSettingsPage: React.FC = () => {
  const { refreshUser } = useAuth();
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    store_name: '',
    description: '',
    business_email: '',
    business_phone: '',
    business_address: '',
    tax_id: '',
    bank_name: '',
    bank_account_holder: '',
    bank_account_number: '',
    bank_routing_code: '',
    payout_method: 'DIRECT_DEPOSIT',
  });

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const data = await vendorService.getMyProfile();
      setProfile(data);
      setFormData({
        store_name: data.store_name || '',
        description: data.description || '',
        business_email: data.business_email || '',
        business_phone: data.business_phone || '',
        business_address: data.business_address || '',
        tax_id: data.tax_id || '',
        bank_name: data.bank_name || '',
        bank_account_holder: data.bank_account_holder || '',
        bank_account_number: data.bank_account_number || '',
        bank_routing_code: data.bank_routing_code || '',
        payout_method: data.payout_method || 'DIRECT_DEPOSIT',
      });
    } catch (err) {
      console.error(err);
      setErrorMessage('Failed to load store settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUploadBranding = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
    const file = e.target.files?.[0];
    // Reset file input value immediately so re-selecting the same file fires onChange
    e.target.value = '';
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage(`Selected ${type} exceeds the 5MB size limit.`);
      return;
    }

    // Set immediate client-side preview
    const objectUrl = URL.createObjectURL(file);
    if (type === 'logo') {
      setLogoPreview(objectUrl);
      setUploadingLogo(true);
    } else {
      setBannerPreview(objectUrl);
      setUploadingBanner(true);
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await vendorService.uploadStoreBranding(file, type);
      setProfile(res.vendor);
      setSuccessMessage(`Store ${type} uploaded and updated successfully!`);
      await refreshUser();
    } catch (err: any) {
      console.error('Branding upload error:', err);
      // Revert preview on failure
      if (type === 'logo') setLogoPreview(null);
      else setBannerPreview(null);
      setErrorMessage(err.response?.data?.error || `Failed to upload ${type}. Please check image format.`);
    } finally {
      if (type === 'logo') setUploadingLogo(false);
      else setUploadingBanner(false);
    }
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const updated = await vendorService.updateMyProfile(formData);
      setProfile(updated);
      setSuccessMessage('Store details & payout configuration saved successfully!');
      await refreshUser();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.response?.data?.detail || 'Failed to save settings. Please verify inputs.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="h-14 bg-slate-200 rounded-2xl"></div>
        <div className="h-64 bg-slate-200 rounded-2xl"></div>
      </div>
    );
  }

  const currentLogo = logoPreview || profile?.logo_url || 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=200&q=80';
  const currentBanner = bannerPreview || profile?.banner_url || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80';

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <VendorSubNav />

      {/* Header Banner */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 sm:p-8 shadow-sm">
        <span className="text-xs font-black uppercase tracking-widest text-[#fcb424]">Store Management</span>
        <h1 className="text-2xl sm:text-3xl font-black text-[#0a0500] uppercase tracking-tight mt-1">
          Store Settings & Branding
        </h1>
        <p className="text-xs text-[#504e4a] mt-1 font-medium">
          Upload local storefront logo & banner assets, manage merchant profile info, and configure bank settlement accounts.
        </p>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Storefront Visual Assets Section */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-neutral-100">
          <Store className="w-5 h-5 text-[#fcb424]" />
          <h2 className="font-black text-[#0a0500] uppercase text-sm tracking-wider">
            Storefront Visual Assets
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Logo Card */}
          <div className="space-y-4 p-5 rounded-2xl border border-neutral-200 bg-neutral-50/50">
            <div>
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-800">
                Storefront Logo
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">Displayed on store header and product cards</p>
            </div>

            <div className="flex items-center gap-5">
              <div className="w-24 h-24 rounded-2xl border-2 border-white shadow-md overflow-hidden bg-white flex-shrink-0 relative group">
                <img
                  src={currentLogo}
                  alt="Store Logo"
                  className="w-full h-full object-cover"
                />
                {uploadingLogo && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {/* Native Accessible File Input with Label */}
                <input
                  id="store-logo-file-input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleUploadBranding(e, 'logo')}
                  className="sr-only"
                />

                <label
                  htmlFor="store-logo-file-input"
                  className={`inline-flex items-center gap-2 px-5 py-2.5 bg-[#0a0500] hover:bg-neutral-800 text-white font-black uppercase tracking-wider text-xs rounded-full shadow-md transition cursor-pointer select-none ${
                    uploadingLogo ? 'opacity-60 pointer-events-none' : ''
                  }`}
                >
                  <Upload className="w-3.5 h-3.5 text-[#ffcd05]" />
                  <span>{uploadingLogo ? 'Uploading...' : 'Upload Logo from Device'}</span>
                </label>

                <p className="text-[11px] text-slate-400">Square PNG, JPG, or WEBP up to 5MB</p>
              </div>
            </div>
          </div>

          {/* Banner Card */}
          <div className="space-y-4 p-5 rounded-2xl border border-neutral-200 bg-neutral-50/50">
            <div>
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-800">
                Storefront Header Banner
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">Wide promotional showcase at top of store page</p>
            </div>

            {/* Banner Preview Frame */}
            <div className="h-32 rounded-2xl border-2 border-white shadow-md overflow-hidden bg-white relative group">
              <img
                src={currentBanner}
                alt="Store Banner"
                className="w-full h-full object-cover"
              />
              {uploadingBanner && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                </div>
              )}
            </div>

            {/* Visible Dedicated Upload Button */}
            <div className="flex flex-wrap items-center gap-3">
              <input
                id="store-banner-file-input"
                type="file"
                accept="image/*"
                onChange={(e) => handleUploadBranding(e, 'banner')}
                className="sr-only"
              />

              <label
                htmlFor="store-banner-file-input"
                className={`inline-flex items-center gap-2 px-5 py-2.5 bg-[#0a0500] hover:bg-neutral-800 text-white font-black uppercase tracking-wider text-xs rounded-full shadow-md transition cursor-pointer select-none ${
                  uploadingBanner ? 'opacity-60 pointer-events-none' : ''
                }`}
              >
                <Upload className="w-3.5 h-3.5 text-[#ffcd05]" />
                <span>{uploadingBanner ? 'Uploading...' : 'Upload Banner from Device'}</span>
              </label>

              <span className="text-[11px] text-slate-400">1200x400 recommended (up to 5MB)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSaveDetails} className="space-y-8">
        {/* Store Business Details */}
        <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-neutral-100">
            <Building2 className="w-5 h-5 text-[#fcb424]" />
            <h2 className="font-black text-[#0a0500] uppercase text-sm tracking-wider">
              Merchant Business Profile
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Store / Brand Name *
              </label>
              <input
                type="text"
                required
                value={formData.store_name}
                onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
                className="w-full px-4 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-[#0a0500] focus:bg-white font-bold transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Tax ID / Business Registration Number
              </label>
              <input
                type="text"
                placeholder="e.g. US-EIN-98765432"
                value={formData.tax_id}
                onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                className="w-full px-4 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-[#0a0500] focus:bg-white font-mono transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Public Business Email
              </label>
              <input
                type="email"
                value={formData.business_email}
                onChange={(e) => setFormData({ ...formData, business_email: e.target.value })}
                className="w-full px-4 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-[#0a0500] focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Customer Support Phone
              </label>
              <input
                type="tel"
                value={formData.business_phone}
                onChange={(e) => setFormData({ ...formData, business_phone: e.target.value })}
                className="w-full px-4 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-[#0a0500] focus:bg-white transition"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Fulfillment Hub / Warehouse Address
              </label>
              <input
                type="text"
                placeholder="e.g. 100 Industrial Parkway, Suite 400, Chicago, IL"
                value={formData.business_address}
                onChange={(e) => setFormData({ ...formData, business_address: e.target.value })}
                className="w-full px-4 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-[#0a0500] focus:bg-white transition"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Store Bio & Craftsmanship Story
              </label>
              <textarea
                rows={3}
                placeholder="Describe your craft, materials, origin, and fulfillment guarantees..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-[#0a0500] focus:bg-white transition resize-none"
              ></textarea>
            </div>
          </div>
        </div>

        {/* Bank & Payout Settlement Configuration */}
        <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
            <div className="flex items-center gap-2.5">
              <CreditCard className="w-5 h-5 text-[#fcb424]" />
              <h2 className="font-black text-[#0a0500] uppercase text-sm tracking-wider">
                Bank & Disbursement Details
              </h2>
            </div>
            <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Bank-Grade Encryption
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Bank / Financial Institution Name
              </label>
              <input
                type="text"
                placeholder="e.g. JPMorgan Chase Bank / HDFC"
                value={formData.bank_name}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                className="w-full px-4 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-[#0a0500] focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Account Beneficiary Name
              </label>
              <input
                type="text"
                placeholder="e.g. Apex Artisanal Studios LLC"
                value={formData.bank_account_holder}
                onChange={(e) => setFormData({ ...formData, bank_account_holder: e.target.value })}
                className="w-full px-4 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-[#0a0500] focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Account Number / IBAN
              </label>
              <input
                type="text"
                placeholder="e.g. 987654321098"
                value={formData.bank_account_number}
                onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })}
                className="w-full px-4 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-[#0a0500] focus:bg-white font-mono transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Routing Code / IFSC / SWIFT
              </label>
              <input
                type="text"
                placeholder="e.g. 021000021"
                value={formData.bank_routing_code}
                onChange={(e) => setFormData({ ...formData, bank_routing_code: e.target.value })}
                className="w-full px-4 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-[#0a0500] focus:bg-white font-mono transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Preferred Payout Method
              </label>
              <select
                value={formData.payout_method}
                onChange={(e) => setFormData({ ...formData, payout_method: e.target.value })}
                className="w-full px-4 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-[#0a0500] focus:bg-white font-medium transition"
              >
                <option value="DIRECT_DEPOSIT">Direct Deposit (ACH / NEFT)</option>
                <option value="WIRE">Domestic / International Wire</option>
                <option value="UPI">UPI / Instant Fast Payment</option>
              </select>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3.5 bg-[#ffcd05] hover:bg-[#fcb424] text-[#0a0500] font-black uppercase tracking-wider text-xs rounded-full shadow-md hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-[#0a0500]" />
            {saving ? 'Saving Changes...' : 'Save Store & Payout Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};
