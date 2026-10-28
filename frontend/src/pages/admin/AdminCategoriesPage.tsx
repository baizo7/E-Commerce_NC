import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Trash2,
  FolderTree,
  X,
  Upload,
  Edit3,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Package
} from 'lucide-react';
import { adminService, productService } from '../../services/api';
import { Category } from '../../types';
import { AdminSubNav } from '../../components/AdminSubNav';

export const AdminCategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: '',
    icon: 'Package',
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await productService.getCategories();
      setCategories(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreateModal = () => {
    setSelectedCategory(null);
    setFormData({ name: '', description: '', image_url: '', icon: 'Package' });
    setImagePreview(null);
    setFormError(null);
    setModalMode('create');
  };

  const openEditModal = (cat: Category) => {
    setSelectedCategory(cat);
    setFormData({
      name: cat.name,
      description: cat.description || '',
      image_url: cat.image_url || '',
      icon: cat.icon || 'Package',
    });
    setImagePreview(cat.image_url || null);
    setFormError(null);
    setModalMode('edit');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setFormError('Image size exceeds 5MB limit.');
      return;
    }

    setImagePreview(URL.createObjectURL(file));
    setUploadingImage(true);
    setFormError(null);

    try {
      const res = await adminService.uploadCategoryImage(file);
      setFormData((prev) => ({ ...prev, image_url: res.image_url }));
    } catch (err: any) {
      console.error(err);
      setImagePreview(formData.image_url || null);
      setFormError('Failed to upload category image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete category "${name}"?`)) return;
    try {
      await adminService.deleteCategory(id);
      fetchCategories();
    } catch (err) {
      console.error(err);
      alert('Failed to delete category.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      if (modalMode === 'create') {
        await adminService.createCategory(formData);
      } else if (modalMode === 'edit' && selectedCategory) {
        await adminService.updateCategory(selectedCategory.id, formData);
      }
      setModalMode(null);
      fetchCategories();
    } catch (err: any) {
      console.error(err);
      setFormError(err.response?.data?.name?.[0] || 'Failed to save category.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <AdminSubNav />

      {/* Header Banner */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-black uppercase tracking-widest text-[#fcb424] block">
            Taxonomy Architecture
          </span>
          <h1 className="text-2xl font-black text-[#0a0500] uppercase tracking-tight mt-0.5">
            Marketplace Categories
          </h1>
          <p className="text-xs text-[#504e4a] mt-0.5">
            Organize catalog hierarchies, upload category visual banners from local device, and govern public marketplace navigation.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-6 py-3 bg-[#0a0500] hover:bg-neutral-800 text-white font-black text-xs uppercase tracking-wider rounded-full shadow-md transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4 text-[#ffcd05]" />
          <span>Create Category</span>
        </button>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="p-16 text-center text-xs text-slate-400">Loading catalog taxonomies...</div>
      ) : categories.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-2xl p-16 text-center text-xs text-[#504e4a]">
          No marketplace categories created yet. Click "Create Category" to initialize taxonomy.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="bg-white border border-neutral-200/90 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between group hover:shadow-md transition"
            >
              {/* Category Cover */}
              <div className="h-32 bg-neutral-900 relative overflow-hidden">
                <img
                  src={cat.image_url || 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=600&q=80'}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                
                <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                  <span className="font-black text-white text-base uppercase tracking-tight leading-tight">
                    {cat.name}
                  </span>
                  <span className="text-[10px] font-mono text-[#ffcd05] bg-black/60 px-2 py-0.5 rounded-md">
                    /{cat.slug}
                  </span>
                </div>
              </div>

              {/* Description & Controls */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <p className="text-xs text-[#504e4a] line-clamp-2 leading-relaxed">
                  {cat.description || 'General marketplace taxonomy and catalog grouping.'}
                </p>

                <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
                  <Link
                    to={`/products?category=${cat.slug}`}
                    target="_blank"
                    className="text-[11px] font-black uppercase text-[#0a0500] hover:text-[#fcb424] flex items-center gap-1 transition"
                  >
                    <span>View Catalog Items</span>
                    <span className="text-xs">&rarr;</span>
                  </Link>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(cat)}
                      className="p-2 rounded-full hover:bg-neutral-100 text-[#0a0500] transition"
                      title="Edit Category"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id, cat.name)}
                      className="p-2 rounded-full hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
                      title="Delete Category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Category Create / Edit Modal */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative space-y-6 my-8">
            <button
              onClick={() => setModalMode(null)}
              className="absolute right-5 top-5 p-2 rounded-full hover:bg-neutral-100 text-slate-400 hover:text-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#fcb424] block">
                {modalMode === 'create' ? 'New Taxonomy' : 'Modify Taxonomy'}
              </span>
              <h3 className="text-xl font-black text-[#0a0500] uppercase tracking-tight mt-0.5">
                {modalMode === 'create' ? 'Create Marketplace Category' : `Edit ${selectedCategory?.name}`}
              </h3>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Mechanical Keyboards & Audio"
                  className="w-full px-4 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-[#0a0500] focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe items grouped under this category for search relevance..."
                  className="w-full px-4 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:border-[#0a0500] focus:bg-white transition resize-none"
                />
              </div>

              {/* Local File Upload Dropzone */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  Category Visual Cover (Upload from Device)
                </label>

                {imagePreview ? (
                  <div className="relative h-28 rounded-xl overflow-hidden border border-neutral-200 bg-neutral-100 group">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    {uploadingImage && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      </div>
                    )}
                  </div>
                ) : null}

                <input
                  id="category-file-upload-input"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="sr-only"
                />

                <label
                  htmlFor="category-file-upload-input"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-[#0a0500] font-bold text-xs uppercase tracking-wider rounded-full cursor-pointer transition select-none"
                >
                  <Upload className="w-3.5 h-3.5 text-[#0a0500]" />
                  <span>{uploadingImage ? 'Uploading Image...' : imagePreview ? 'Replace Image from Device' : 'Choose File from Device'}</span>
                </label>
                <span className="text-[11px] text-slate-400 block">JPEG, PNG, WEBP up to 5MB</span>
              </div>

              <div className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 hover:bg-neutral-100 rounded-full"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingImage}
                  className="px-6 py-2.5 bg-[#0a0500] hover:bg-neutral-800 text-white font-black text-xs uppercase tracking-wider rounded-full shadow-md transition disabled:opacity-50"
                >
                  {modalMode === 'create' ? 'Create Category' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
