import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import type { Inventory, Product } from '../../types';
import { useToastStore } from '../../store/useToastStore';
import { Boxes, Plus, Edit2, Trash2, X, Loader2 } from 'lucide-react';

export const AdminInventoryPage: React.FC = () => {
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    productId: '',
    quantity: 0,
    importPrice: 0,
  });

  const { addToast } = useToastStore();

  const fetchInventories = async () => {
    try {
      setIsLoading(true);
      const [invRes, prodRes] = await Promise.all([
        api.get('/inventories'),
        api.get('/products/paginated?limit=100'),
      ]);

      if (invRes.data?.success) {
        setInventories(invRes.data.data || []);
      }
      if (prodRes.data?.success) {
        setProducts(prodRes.data.data.products || prodRes.data.data.items || []);
      }
    } catch (err) {
      console.error('Lỗi lấy dữ liệu kho:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventories();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({ productId: products[0]?.id || '', quantity: 10, importPrice: 100000 });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (inv: Inventory) => {
    setEditingId(inv.id);
    setFormData({
      productId: inv.productId,
      quantity: inv.quantity,
      importPrice: inv.importPrice,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        const res = await api.put(`/inventories/${editingId}`, {
          quantity: formData.quantity,
          importPrice: formData.importPrice,
        });
        if (res.data?.success) {
          addToast({ type: 'success', title: 'Thành công', message: 'Cập nhật kho hàng thành công.' });
        }
      } else {
        const res = await api.post('/inventories', formData);
        if (res.data?.success) {
          addToast({ type: 'success', title: 'Thành công', message: 'Tạo mới bản ghi tồn kho thành công.' });
        }
      }
      setIsModalOpen(false);
      fetchInventories();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Lỗi', message: err.response?.data?.message || 'Lỗi thao tác tồn kho.' });
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bản ghi kho này?')) {
      try {
        const res = await api.delete(`/inventories/${id}`);
        if (res.data?.success) {
          addToast({ type: 'info', title: 'Thành công', message: 'Đã xóa bản ghi tồn kho.' });
          fetchInventories();
        }
      } catch (err: any) {
        addToast({ type: 'error', title: 'Lỗi', message: 'Xóa bản ghi kho thất bại.' });
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Quản Lý Tồn Kho</h1>
          <p className="text-xs text-slate-400 mt-1">Theo dõi số lượng hàng tồn & Giá nhập hàng</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" /> Nhập Kho Mới
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
                <th className="py-3.5 px-4">Sản Phẩm</th>
                <th className="py-3.5 px-4">Số Lượng Tồn</th>
                <th className="py-3.5 px-4">Giá Nhập</th>
                <th className="py-3.5 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {inventories.map((inv) => {
                const prod = products.find((p) => p.id === inv.productId);
                return (
                  <tr key={inv.id} className="hover:bg-slate-900/40">
                    <td className="py-3.5 px-4 font-bold text-white flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <Boxes className="w-4 h-4" />
                      </div>
                      <span>{prod?.name || `Mã SP: ${inv.productId}`}</span>
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-indigo-400">{inv.quantity} cái</td>
                    <td className="py-3.5 px-4 font-semibold text-emerald-400">
                      {inv.importPrice?.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleOpenEdit(inv)} className="p-1.5 rounded-lg text-slate-400 hover:text-white">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(inv.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400">
                          <Trash2 className="w-4 h-4" />
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl max-w-md w-full border border-slate-800 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">{editingId ? 'Cập Nhật Tồn Kho' : 'Nhập Kho Mới'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              {!editingId && (
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Chọn sản phẩm</label>
                  <select
                    value={formData.productId}
                    onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-white"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (SKU: {p.sku})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Số lượng nhập kho</label>
                <input
                  type="number"
                  required
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Giá nhập (VNĐ)</label>
                <input
                  type="number"
                  required
                  value={formData.importPrice}
                  onChange={(e) => setFormData({ ...formData, importPrice: Number(e.target.value) })}
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
