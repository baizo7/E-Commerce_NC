import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Image } from 'lucide-react';
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
  const [imageUrls, setImageUrls] = useState<string[]>(['']);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        setImageUrls(['']);
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
      setImageUrls(['']);
    }
  }, [productToEdit, isOpen]);

  if (!isOpen) return null;

  const handleAddImageUrl = () => {
    setImageUrls([...imageUrls, '']);
  };

  const handleUpdateImageUrl = (index: number, val: string) => {
    const updated = [...imageUrls];
    updated[index] = val;
    setImageUrls(updated);
  };

  const handleRemoveImageUrl = (index: number) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload: any = {
        title: formData.title,
        price: parseFloat(formData.price),
        inventory_count: parseInt(formData.inventory_count, 10),
        low_stock_threshold: parseInt(formData.low_stock_threshold, 10),
        short_description: formData.short_description,
        description: formData.description,
        is_active: formData.is_active,
        image_urls: imageUrls.filter((url) => url.trim().length > 0),
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
      setError(err.response?.data?.error || 'Failed to save product. Please check form fields.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h3 className="font-bold text-slate-900 text-base">
            {productToEdit ? 'Edit Product Listing' : 'List New Marketplace Product'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl font-medium">{error}</div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Product Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Handmade Stoneware Coffee Mug"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white"
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">SKU (Stock Keeping Unit)</label>
              <input
                type="text"
                placeholder="e.g. MUG-001"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Selling Price ($)</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="49.99"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Compare-at Price ($)</label>
              <input
                type="number"
                step="0.01"
                placeholder="59.99 (Optional for discount display)"
                value={formData.compare_at_price}
                onChange={(e) => setFormData({ ...formData, compare_at_price: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Inventory Count</label>
              <input
                type="number"
                required
                min="0"
                value={formData.inventory_count}
                onChange={(e) => setFormData({ ...formData, inventory_count: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Low Stock Alert Threshold</label>
              <input
                type="number"
                min="1"
                value={formData.low_stock_threshold}
                onChange={(e) => setFormData({ ...formData, low_stock_threshold: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Short Description</label>
            <input
              type="text"
              placeholder="One-line summary for product card"
              value={formData.short_description}
              onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Detailed Description</label>
            <textarea
              rows={4}
              required
              placeholder="Material details, dimensions, specifications, care instructions..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white"
            ></textarea>
          </div>

          {/* Product Image URLs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700">Product Image URLs (HTTPS)</label>
              <button
                type="button"
                onClick={handleAddImageUrl}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Another Image
              </button>
            </div>

            <div className="space-y-2">
              {imageUrls.map((url, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/photo-..."
                      value={url}
                      onChange={(e) => handleUpdateImageUrl(idx, e.target.value)}
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:bg-white"
                    />
                  </div>
                  {imageUrls.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveImageUrl(idx)}
                      className="p-2 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow transition disabled:opacity-50"
            >
              {submitting ? 'Saving...' : productToEdit ? 'Update Product' : 'Create Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
