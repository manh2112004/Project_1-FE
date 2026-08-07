import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import type { Brand, PaginationMeta } from '../../types';
import { Pagination } from '../../components/common/Pagination';
import { useToastStore } from '../../store/useToastStore';
import { Award, Plus, Edit2, Trash2, X, Loader2 } from 'lucide-react';

export const AdminBrandsPage: React.FC = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>();
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    logo: '',
    description: '',
    isActive: true,
  });

  const { addToast } = useToastStore();

  const fetchBrands = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/brand/paginated?page=${page}&limit=10`);
      if (res.data?.success) {
        setBrands(res.data.data.brands || res.data.data.items || res.data.data || []);
        setMeta(res.data.data.meta);
      }
    } catch (err) {
      console.error('Lỗi lấy thương hiệu:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, [page]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({ name: '', logo: '', description: '', isActive: true });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b: Brand) => {
    setEditingId(b.id);
    setFormData({
      name: b.name,
      logo: b.logo || '',
      description: b.description || '',
      isActive: b.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    try {
      if (editingId) {
        const res = await api.put(`/brand/${editingId}`, formData);
        if (res.data?.success) {
          addToast({ type: 'success', title: 'Thành công', message: 'Cập nhật thương hiệu thành công.' });
        }
      } else {
        const res = await api.post('/brand', formData);
        if (res.data?.success) {
          addToast({ type: 'success', title: 'Thành công', message: 'Tạo thương hiệu thành công.' });
        }
      }
      setIsModalOpen(false);
      fetchBrands();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Lỗi', message: err.response?.data?.message || 'Lỗi thao tác thương hiệu.' });
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa thương hiệu này?')) {
      try {
        const res = await api.delete(`/brand/${id}`);
        if (res.data?.success) {
          addToast({ type: 'info', title: 'Thành công', message: 'Đã xóa thương hiệu.' });
          fetchBrands();
        }
      } catch (err: any) {
        addToast({ type: 'error', title: 'Lỗi', message: 'Không thể xóa thương hiệu.' });
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Quản Lý Thương Hiệu (Brand)</h1>
          <p className="text-xs text-slate-400 mt-1">Danh sách đối tác và nhãn hàng sản phẩm</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" /> Tạo Thương Hiệu Mới
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
                <th className="py-3.5 px-4">Tên Thương Hiệu</th>
                <th className="py-3.5 px-4">Mô Tả</th>
                <th className="py-3.5 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {brands.map((b) => (
                <tr key={b.id} className="hover:bg-slate-900/40">
                  <td className="py-3.5 px-4 font-bold text-white flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center p-1">
                      {b.logo ? <img src={b.logo} alt="" className="h-full object-contain" /> : <Award className="w-4 h-4 text-amber-400" />}
                    </div>
                    <span>{b.name}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 max-w-xs truncate">{b.description || '-'}</td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleOpenEdit(b)} className="p-1.5 rounded-lg text-slate-400 hover:text-white">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(b.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
              <h3 className="text-sm font-bold text-white">{editingId ? 'Sửa Thương Hiệu' : 'Thêm Thương Hiệu'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Tên thương hiệu</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-white"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Logo thương hiệu</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="https://..."
                    value={formData.logo}
                    onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
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
                            setFormData((prev) => ({ ...prev, logo: res.data.url }));
                            addToast({ type: 'success', title: 'Tải ảnh thành công', message: 'Đã upload logo thương hiệu lên Cloudinary.' });
                          }
                        } catch (err: any) {
                          addToast({ type: 'error', title: 'Lỗi', message: 'Tải logo thất bại.' });
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
