import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, Upload, AlertCircle, CheckCircle2, Image as ImageIcon, Star } from 'lucide-react';
import { Product, Category } from '../../types';
import { productService, vendorService } from '../../services/api';

interface VendorProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  productToEdit?: Product | null;
}

export const VendorProductModal: React.FC<VendorProductModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  productToEdit,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    price: '',
    compare_at_price: '',
    sku: '',
    inventory_count: '10',
    low_stock_threshold: '5',
    short_description: '',
    description: '',
    is_active: true,
  });

  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    productService.getCategories().then(setCategories).catch(console.error);
  }, []);

  useEffect(() => {
    if (productToEdit) {
      setFormData({
        title: productToEdit.title,
        category: (typeof productToEdit.category === 'object' ? productToEdit.category?.id : productToEdit.category)?.toString() || '',
        price: productToEdit.price.toString(),
        compare_at_price: productToEdit.compare_at_price ? productToEdit.compare_at_price.toString() : '',
        sku: productToEdit.sku || '',
        inventory_count: productToEdit.inventory_count.toString(),
        low_stock_threshold: (productToEdit.low_stock_threshold || 5).toString(),
        short_description: productToEdit.short_description || '',
        description: productToEdit.description || '',
        is_active: productToEdit.is_active,
      });

      if (productToEdit.images && productToEdit.images.length > 0) {
        setImageUrls(productToEdit.images.map((img) => img.image_url));
      } else if (productToEdit.primary_image) {
        setImageUrls([productToEdit.primary_image]);
      } else {
        setImageUrls([]);
      }
    } else {
      setFormData({
        title: '',
        category: '',
        price: '',
        compare_at_price: '',
        sku: '',
        inventory_count: '10',
        low_stock_threshold: '5',
        short_description: '',
        description: '',
        is_active: true,
      });
      setImageUrls([]);
    }
  }, [productToEdit, isOpen]);

  if (!isOpen) return null;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    setError(null);

    const newUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 5 * 1024 * 1024) {
        setError(`File "${file.name}" exceeds the 5MB size limit.`);
        continue;
      }

      try {
        const res = await vendorService.uploadProductImage(file);
        if (res.image_url) {
          newUrls.push(res.image_url);
        }
      } catch (err: any) {
        console.error('Image upload failed:', err);
        setError(err.response?.data?.error || `Failed to upload "${file.name}".`);
      }
    }

    if (newUrls.length > 0) {
      setImageUrls((prev) => [...prev, ...newUrls]);
    }

    setUploadingImages(false);
    // Reset input so the same file can be re-selected if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSetPrimary = (index: number) => {
    setImageUrls((prev) => {
      const target = prev[index];
      const remaining = prev.filter((_, i) => i !== index);
      return [target, ...remaining];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    if (imageUrls.length === 0) {
      setError('Please upload at least one product photo from your computer.');
      setSubmitting(false);
      return;
    }

    try {
      const payload: any = {
        title: formData.title,
        price: parseFloat(formData.price),
        inventory_count: parseInt(formData.inventory_count, 10),
        low_stock_threshold: parseInt(formData.low_stock_threshold, 10),
        short_description: formData.short_description,
        description: formData.description,
        is_active: formData.is_active,
        image_urls: imageUrls,
      };

      if (formData.category) {
        payload.category = parseInt(formData.category, 10);
      }
      if (formData.compare_at_price) {
        payload.compare_at_price = parseFloat(formData.compare_at_price);
      }
      if (formData.sku) {
        payload.sku = formData.sku;
      }

      if (productToEdit) {
        await vendorService.updateProduct(productToEdit.id, payload);
      } else {
        await vendorService.createProduct(payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to save product listing. Please check required fields.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-neutral-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#fcb424] block">Merchant Catalog</span>
            <h3 className="font-black text-[#0a0500] uppercase text-base tracking-tight">
              {productToEdit ? 'Edit Product Listing' : 'Add New Marketplace Product'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-200/60 hover:bg-neutral-300 text-slate-700 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6 max-h-[82vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 bg-rose-50 text-rose-800 text-xs rounded-xl font-medium border border-rose-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Product Photos Section with Local Upload */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Product Gallery Photos *
              </label>
              <span className="text-[11px] text-slate-400">Up to 5MB each (JPEG, PNG, WEBP)</span>
            </div>

            {/* Hidden File Input — triggered via label for cross-browser reliability */}
            <input
              type="file"
              id="product-image-upload"
              ref={fileInputRef}
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Dropzone / Upload Trigger — uses <label> so click always opens picker */}
            <label
              htmlFor="product-image-upload"
              className="border-2 border-dashed border-neutral-300 hover:border-[#0a0500] bg-neutral-50/80 hover:bg-neutral-100 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group"
            >
              <div className="w-12 h-12 rounded-full bg-white shadow-sm border border-neutral-200 flex items-center justify-center group-hover:scale-105 transition-transform text-[#0a0500]">
                <Upload className="w-5 h-5 text-[#fcb424]" />
              </div>
              <div>
                <span className="font-bold text-xs text-[#0a0500] block">
                  Click to select photos from your device
                </span>
                <span className="text-[11px] text-slate-400">PNG, JPG, or WEBP up to 5MB</span>
              </div>
              {uploadingImages && (
                <div className="text-xs text-amber-600 font-bold flex items-center gap-1.5 mt-1">
                  <span className="w-3.5 h-3.5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></span>
                  Uploading & optimizing images...
                </div>
              )}
            </label>

            {/* Gallery Thumbnails List */}
            {imageUrls.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 pt-2">
                {imageUrls.map((url, idx) => (
                  <div
                    key={idx}
                    className={`relative aspect-[3/4] rounded-xl overflow-hidden border-2 bg-neutral-100 shadow-sm group ${
                      idx === 0 ? 'border-[#0a0500]' : 'border-neutral-200'
                    }`}
                  >
                    <img src={url} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />

                    {idx === 0 ? (
                      <span className="absolute top-1.5 left-1.5 bg-[#ffcd05] text-[#0a0500] text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow-sm">
                        Primary
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(idx)}
                        className="absolute top-1.5 left-1.5 bg-black/70 hover:bg-black text-white text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition shadow-sm"
                        title="Set as primary thumbnail"
                      >
                        Make Primary
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-sm hover:scale-110"
                      title="Remove image"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Product Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Tactical All-Weather Commuter Backpack"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-[#0a0500] focus:bg-white transition"
            />
          </div>

          {/* Category & SKU */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Marketplace Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-[#0a0500] focus:bg-white transition"
              >
                <option value="">Select a category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                SKU Identifier
              </label>
              <input
                type="text"
                placeholder="e.g. VTX-BPK-001"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-4 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-[#0a0500] focus:bg-white font-mono transition"
              />
            </div>
          </div>

          {/* Pricing Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Selling Price ($) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="99.99"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-4 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-[#0a0500] focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Compare-at / Strike-through Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="129.99"
                value={formData.compare_at_price}
                onChange={(e) => setFormData({ ...formData, compare_at_price: e.target.value })}
                className="w-full px-4 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-[#0a0500] focus:bg-white transition"
              />
            </div>
          </div>

          {/* Stock & Threshold */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Warehouse Inventory Units *
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.inventory_count}
                onChange={(e) => setFormData({ ...formData, inventory_count: e.target.value })}
                className="w-full px-4 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-[#0a0500] focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Low Stock Threshold
              </label>
              <input
                type="number"
                min="1"
                value={formData.low_stock_threshold}
                onChange={(e) => setFormData({ ...formData, low_stock_threshold: e.target.value })}
                className="w-full px-4 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-[#0a0500] focus:bg-white transition"
              />
            </div>
          </div>

          {/* Short Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Highlight / Summary (Short Description)
            </label>
            <input
              type="text"
              placeholder="e.g. Ultra-durable water-resistant backpack with laptop compartment."
              value={formData.short_description}
              onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
              className="w-full px-4 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-[#0a0500] focus:bg-white transition"
            />
          </div>

          {/* Full Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Detailed Description & Specifications
            </label>
            <textarea
              rows={4}
              required
              placeholder="Provide comprehensive details on materials, dimensions, build quality, and care instructions..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-[#0a0500] focus:bg-white transition resize-none"
            ></textarea>
          </div>

          {/* Active status toggle */}
          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 rounded text-[#0a0500] focus:ring-[#0a0500] cursor-pointer"
            />
            <label htmlFor="is_active" className="text-xs font-bold text-slate-800 cursor-pointer">
              Product is Active & Available for Purchase
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-neutral-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-full border border-neutral-200 text-xs font-bold uppercase tracking-wider text-slate-600 hover:bg-neutral-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || uploadingImages}
              className="px-8 py-3 bg-[#ffcd05] hover:bg-[#fcb424] text-[#0a0500] font-black uppercase tracking-wider text-xs rounded-full shadow-md hover:shadow-lg transition disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? 'Publishing...' : productToEdit ? 'Save Changes' : 'Publish Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
