import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import type { Product, Category, Brand, PaginationMeta } from '../../types';
import { Pagination } from '../../components/common/Pagination';
import { useToastStore } from '../../store/useToastStore';
import { Plus, Search, Edit2, Trash2, Upload, Image as ImageIcon, X, Loader2 } from 'lucide-react';

export const AdminProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modal Create/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Modal Image Gallery Upload
  const [galleryModalProductId, setGalleryModalProductId] = useState<string | null>(null);
  const [uploadFiles, setUploadFiles] = useState<FileList | null>(null);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    sku: '',
    categoryId: '',
    brandId: '',
    price: 0,
    discountPrice: 0,
    shortDescription: '',
    description: '',
    thumbnail: '',
    status: 'ACTIVE',
  });

  const { addToast } = useToastStore();

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/products/paginated?page=${page}&limit=10&search=${encodeURIComponent(search)}`);
      if (res.data?.success) {
        const data = res.data.data;
        let list: Product[] = [];
        if (Array.isArray(data)) {
          list = data;
        } else if (data && Array.isArray(data.products)) {
          list = data.products;
        } else if (data && Array.isArray(data.items)) {
          list = data.items;
        }
        setProducts(list);
        setMeta(data.meta);
      }
    } catch (err) {
      console.error('Lỗi lấy danh sách sản phẩm Admin:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page]);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [catRes, brandRes] = await Promise.all([api.get('/categories'), api.get('/brand')]);
        if (catRes.data?.success) setCategories(catRes.data.data || []);
        if (brandRes.data?.success) setBrands(brandRes.data.data || []);
      } catch (err) {
        console.error('Lỗi lấy metadata danh mục/brand:', err);
      }
    };
    fetchMetadata();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData({
      name: '',
      slug: '',
      sku: '',
      categoryId: categories[0]?.id || '',
      brandId: brands[0]?.id || '',
      price: 0,
      discountPrice: 0,
      shortDescription: '',
      description: '',
      thumbnail: '',
      status: 'ACTIVE',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingId(p.id);
    setFormData({
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      categoryId: p.categoryId,
      brandId: p.brandId,
      price: p.price,
      discountPrice: p.discountPrice || 0,
      shortDescription: p.shortDescription || '',
      description: p.description || '',
      thumbnail: p.thumbnail || '',
      status: p.status || 'ACTIVE',
    });
    setIsModalOpen(true);
  };

  // Upload single thumbnail file
  const handleSingleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = new FormData();
      data.append('file', file);

      const res = await api.post('/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success && res.data?.url) {
        setFormData((prev) => ({ ...prev, thumbnail: res.data.url }));
        addToast({ type: 'success', title: 'Tải ảnh thành công', message: 'Đã upload thumbnail lên Cloudinary.' });
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Lỗi', message: 'Tải ảnh đại diện thất bại.' });
    }
  };

  const handleSubmitModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.categoryId || !formData.brandId || !formData.price) {
      addToast({ type: 'warning', title: 'Thiếu thông tin', message: 'Vui lòng nhập đầy đủ các trường bắt buộc.' });
      return;
    }

    try {
      if (editingId) {
        const res = await api.put(`/products/${editingId}`, formData);
        if (res.data?.success) {
          addToast({ type: 'success', title: 'Thành công', message: 'Cập nhật sản phẩm thành công.' });
        }
      } else {
        const res = await api.post('/products', formData);
        if (res.data?.success) {
          addToast({ type: 'success', title: 'Thành công', message: 'Tạo sản phẩm mới thành công.' });
        }
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Lỗi',
        message: err.response?.data?.message || 'Lỗi thao tác sản phẩm.',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
      try {
        const res = await api.delete(`/products/${id}`);
        if (res.data?.success) {
          addToast({ type: 'info', title: 'Đã xóa', message: 'Đã xóa sản phẩm thành công.' });
          fetchProducts();
        }
      } catch (err: any) {
        addToast({ type: 'error', title: 'Lỗi', message: err.response?.data?.message || 'Xóa sản phẩm thất bại.' });
      }
    }
  };

  // Upload multi images gallery
  const handleUploadGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!galleryModalProductId || !uploadFiles || uploadFiles.length === 0) return;

    try {
      setIsUploadingGallery(true);
      const data = new FormData();
      Array.from(uploadFiles).forEach((f) => data.append('images', f));
      data.append('productId', galleryModalProductId);
      data.append('isThumbnail', 'false');
      data.append('sortOrder', '1');

      const res = await api.post('/product-images', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success) {
        addToast({ type: 'success', title: 'Thành công', message: 'Đã tải bộ sưu tập ảnh lên Cloudinary.' });
        setGalleryModalProductId(null);
        setUploadFiles(null);
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Lỗi', message: 'Upload ảnh bộ sưu tập thất bại.' });
    } finally {
      setIsUploadingGallery(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Quản Lý Sản Phẩm</h1>
          <p className="text-xs text-slate-400 mt-1">Tạo mới, chỉnh sửa và upload hình ảnh sản phẩm lên Cloudinary</p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" /> Tạo Sản Phẩm Mới
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Tìm theo tên sản phẩm, SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          </div>
          <button type="submit" className="px-4 py-2 bg-slate-800 text-white text-xs font-semibold rounded-xl">
            Lọc
          </button>
        </form>
      </div>

      {/* Products Table */}
      {isLoading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : (
        <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 uppercase font-semibold bg-slate-900/60">
                <tr>
                  <th className="py-3.5 px-4">Sản Phẩm</th>
                  <th className="py-3.5 px-4">SKU</th>
                  <th className="py-3.5 px-4">Giá Bán</th>
                  <th className="py-3.5 px-4">Giá Giảm</th>
                  <th className="py-3.5 px-4 text-center">Bộ Sưu Tập Ảnh</th>
                  <th className="py-3.5 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-900/40">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.thumbnail || 'https://via.placeholder.com/50'}
                          alt={p.name}
                          className="w-10 h-10 rounded-xl object-contain bg-slate-900 p-1 border border-slate-800"
                        />
                        <div>
                          <p className="font-bold text-white max-w-xs truncate">{p.name}</p>
                          <p className="text-[10px] text-slate-400">{p.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-mono">{p.sku}</td>
                    <td className="py-3 px-4 font-bold text-white">{p.price.toLocaleString('vi-VN')} đ</td>
                    <td className="py-3 px-4 font-semibold text-emerald-400">
                      {p.discountPrice ? `${p.discountPrice.toLocaleString('vi-VN')} đ` : '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setGalleryModalProductId(p.id)}
                        className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 font-medium inline-flex items-center gap-1.5"
                      >
                        <ImageIcon className="w-3.5 h-3.5" /> Upload Bộ Ảnh
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(p)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination meta={meta} onPageChange={(p) => setPage(p)} />
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl max-w-2xl w-full border border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">
                {editingId ? 'Cập Nhật Sản Phẩm' : 'Tạo Sản Phẩm Mới'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitModal} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Tên sản phẩm *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Slug URL</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="san-pham-dem-slug"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Mã SKU *</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Danh mục *</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Thương hiệu *</label>
                  <select
                    value={formData.brandId}
                    onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-white"
                  >
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Giá niêm yết (VNĐ) *</label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Giá khuyến mãi (Tùy chọn)</label>
                  <input
                    type="number"
                    value={formData.discountPrice}
                    onChange={(e) => setFormData({ ...formData, discountPrice: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-white"
                  />
                </div>
              </div>

              {/* Upload Thumbnail */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Ảnh đại diện (Thumbnail URL / Cloudinary)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.thumbnail}
                    onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                    placeholder="https://cloudinary.com/..."
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-white"
                  />
                  <label className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl cursor-pointer flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" /> Upload File
                    <input type="file" onChange={handleSingleThumbnailUpload} className="hidden" accept="image/*" />
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Mô tả ngắn</label>
                <input
                  type="text"
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Mô tả chi tiết sản phẩm</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-semibold"
                >
                  Hủy bỏ
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold">
                  {editingId ? 'Lưu Cập Nhật' : 'Tạo Mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Gallery Modal */}
      {galleryModalProductId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl max-w-md w-full border border-slate-800 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">Upload Bộ Ảnh Sản Phẩm Cloudinary</h3>
              <button onClick={() => setGalleryModalProductId(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadGallery} className="space-y-4">
              <p className="text-xs text-slate-300">
                Chọn tối đa 10 hình ảnh để tải trực tiếp lên Cloudinary và lưu vào database:
              </p>

              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => setUploadFiles(e.target.files)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white"
              />

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setGalleryModalProductId(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isUploadingGallery}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold disabled:opacity-50"
                >
                  {isUploadingGallery ? 'Đang Upload...' : 'Bắt Đầu Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
