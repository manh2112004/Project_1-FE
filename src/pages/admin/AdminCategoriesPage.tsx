import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import type { Category, PaginationMeta } from '../../types';
import { Pagination } from '../../components/common/Pagination';
import { useToastStore } from '../../store/useToastStore';
import { Layers, Plus, Edit2, Trash2, X, Loader2, FolderTree } from 'lucide-react';

export const AdminCategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>();
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    parentId: '',
    name: '',
    slug: '',
    description: '',
    image: '',
    isActive: true,
  });

  const { addToast } = useToastStore();

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const [paginatedRes, allRes] = await Promise.all([
        api.get(`/categories/paginated?page=${page}&limit=10`),
        api.get('/categories'),
      ]);

      if (paginatedRes.data?.success) {
        setCategories(paginatedRes.data.data.categories || paginatedRes.data.data.items || paginatedRes.data.data || []);
        setMeta(paginatedRes.data.data.meta);
      }
      if (allRes.data?.success) {
        setAllCategories(allRes.data.data || []);
      }
    } catch (err) {
      console.error('Lỗi lấy danh sách danh mục:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [page]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({ parentId: '', name: '', slug: '', description: '', image: '', isActive: true });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingId(cat.id);
    setFormData({
      parentId: cat.parentId || '',
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      image: cat.image || '',
      isActive: cat.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    try {
      const payload = {
        ...formData,
        parentId: formData.parentId ? formData.parentId : null,
      };

      if (editingId) {
        const res = await api.put(`/categories/${editingId}`, payload);
        if (res.data?.success) {
          addToast({ type: 'success', title: 'Thành công', message: 'Cập nhật danh mục thành công.' });
        }
      } else {
        const res = await api.post('/categories', payload);
        if (res.data?.success) {
          addToast({ type: 'success', title: 'Thành công', message: 'Tạo mới danh mục thành công.' });
        }
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Lỗi', message: err.response?.data?.message || 'Lỗi xử lý danh mục.' });
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa danh mục này?')) {
      try {
        const res = await api.delete(`/categories/${id}`);
        if (res.data?.success) {
          addToast({ type: 'info', title: 'Thành công', message: 'Đã xóa danh mục thành công.' });
          fetchCategories();
        }
      } catch (err: any) {
        addToast({ type: 'error', title: 'Lỗi', message: err.response?.data?.message || 'Không thể xóa danh mục.' });
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Quản Lý Danh Mục (Phân Cấp Cha - Con)</h1>
          <p className="text-xs text-slate-400 mt-1">Phân loại sản phẩm đa cấp hệ thống E-commerce</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" /> Tạo Danh Mục Mới
        </button>
      </div>

      {isLoading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : (
        <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-slate-400 uppercase font-semibold bg-slate-900/60">
              <tr>
                <th className="py-3.5 px-4">Tên Danh Mục</th>
                <th className="py-3.5 px-4">Cấp Danh Mục</th>
                <th className="py-3.5 px-4">Slug</th>
                <th className="py-3.5 px-4">Mô Tả</th>
                <th className="py-3.5 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {categories.map((c) => {
                const parentCat = allCategories.find((parent) => parent.id === c.parentId);
                return (
                  <tr key={c.id} className="hover:bg-slate-900/40">
                    <td className="py-3.5 px-4 font-bold text-white flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                        {c.image ? <img src={c.image} alt="" className="w-6 h-6 object-contain" /> : <Layers className="w-4 h-4" />}
                      </div>
                      <span>{c.name}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      {parentCat ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-semibold">
                          <FolderTree className="w-3 h-3" /> Con của: {parentCat.name}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                          📁 Danh mục gốc (Cha)
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono">{c.slug}</td>
                    <td className="py-3.5 px-4 text-slate-400 max-w-xs truncate">{c.description || '-'}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleOpenEdit(c)} className="p-1.5 rounded-lg text-slate-400 hover:text-white">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Pagination meta={meta} onPageChange={(p) => setPage(p)} />
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl max-w-md w-full border border-slate-800 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">{editingId ? 'Sửa Danh Mục' : 'Thêm Danh Mục'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              {/* Select Parent Category */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Danh mục cha (Tùy chọn)</label>
                <select
                  value={formData.parentId}
                  onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-white focus:border-indigo-500"
                >
                  <option value="">-- Là Danh mục gốc (Không có danh mục cha) --</option>
                  {allCategories
                    .filter((c) => c.id !== editingId)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        📁 {c.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Tên danh mục</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Điện thoại, Laptop..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Slug URL (Tự động hoặc tùy chỉnh)</label>
                <input
                  type="text"
                  placeholder="dien-thoai, laptop..."
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Hình ảnh danh mục</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="https://..."
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-white"
                  />
                  <label className="px-3 py-2 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/30 rounded-xl cursor-pointer flex items-center gap-1 font-semibold text-xs transition-all">
                    Tải từ máy
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const data = new FormData();
                          data.append('file', file);
                          const res = await api.post('/upload', data, {
                            headers: { 'Content-Type': 'multipart/form-data' },
                          });
                          if (res.data?.success && res.data?.url) {
                            setFormData((prev) => ({ ...prev, image: res.data.url }));
                            addToast({ type: 'success', title: 'Tải ảnh thành công', message: 'Đã upload ảnh danh mục lên Cloudinary.' });
                          }
                        } catch (err: any) {
                          addToast({ type: 'error', title: 'Lỗi', message: 'Tải ảnh danh mục thất bại.' });
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Mô tả</label>
                <textarea
                  rows={2}
                  placeholder="Mô tả chi tiết danh mục..."
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
                <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold">
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
