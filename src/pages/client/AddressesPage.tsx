import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import type { UserAddress } from '../../types';
import { useToastStore } from '../../store/useToastStore';
import { MapPin, Plus, Trash2, Edit2, X, Loader2 } from 'lucide-react';

export const AddressesPage: React.FC = () => {
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    recipientName: '',
    phoneNumber: '',
    addressLine1: '',
    ward: '',
    district: '',
    city: '',
    country: 'Việt Nam',
    isDefault: false,
  });

  const { addToast } = useToastStore();

  const fetchAddresses = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/user-addresses/me');
      if (res.data?.success) {
        setAddresses(res.data.data || []);
      }
    } catch (err) {
      console.error('Lỗi lấy sổ địa chỉ:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData({
      recipientName: '',
      phoneNumber: '',
      addressLine1: '',
      ward: '',
      district: '',
      city: '',
      country: 'Việt Nam',
      isDefault: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (addr: UserAddress) => {
    setEditingId(addr.id);
    setFormData({
      recipientName: addr.recipientName,
      phoneNumber: addr.phoneNumber,
      addressLine1: addr.addressLine1,
      ward: addr.ward || '',
      district: addr.district || '',
      city: addr.city || '',
      country: addr.country || 'Việt Nam',
      isDefault: addr.isDefault,
    });
    setIsModalOpen(true);
  };

  const handleSubmitModal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        const res = await api.put(`/user-addresses/${editingId}`, formData);
        if (res.data?.success) {
          addToast({ type: 'success', title: 'Thành công', message: 'Cập nhật địa chỉ thành công.' });
        }
      } else {
        const res = await api.post('/user-addresses', formData);
        if (res.data?.success) {
          addToast({ type: 'success', title: 'Thành công', message: 'Thêm mới địa chỉ thành công.' });
        }
      }
      setIsModalOpen(false);
      fetchAddresses();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Lỗi', message: err.response?.data?.message || 'Thao tác thất bại.' });
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) {
      try {
        const res = await api.delete(`/user-addresses/${id}`);
        if (res.data?.success) {
          addToast({ type: 'info', title: 'Thành công', message: 'Đã xóa địa chỉ.' });
          fetchAddresses();
        }
      } catch (err: any) {
        addToast({ type: 'error', title: 'Lỗi', message: 'Xóa địa chỉ thất bại.' });
      }
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const res = await api.patch(`/user-addresses/${id}/default`);
      if (res.data?.success) {
        addToast({ type: 'success', title: 'Thành công', message: 'Đã thiết lập địa chỉ mặc định.' });
        fetchAddresses();
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Lỗi', message: 'Thiết lập địa chỉ mặc định thất bại.' });
    }
  };

  return (
    <div className="space-y-8 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Sổ Địa Chỉ Giao Hàng</h1>
          <p className="text-xs text-slate-400 mt-1">Quản lý danh sách địa chỉ nhận hàng để thanh toán nhanh chóng</p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" /> Thêm Địa Chỉ Mới
        </button>
      </div>

      {isLoading ? (
        <div className="min-h-[30vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : addresses.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl text-center space-y-3 border border-slate-800 max-w-md mx-auto">
          <MapPin className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-xs text-slate-400">Bạn chưa thêm địa chỉ nhận hàng nào.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`glass-panel p-6 rounded-3xl border transition-all space-y-3 flex flex-col justify-between ${
                addr.isDefault ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-800'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-white">{addr.recipientName}</span>
                  {addr.isDefault ? (
                    <span className="text-[10px] font-extrabold text-indigo-400 bg-indigo-500/20 px-2.5 py-0.5 rounded-full border border-indigo-500/30">
                      Mặc định
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSetDefault(addr.id)}
                      className="text-[10px] font-semibold text-slate-400 hover:text-indigo-400 transition-colors"
                    >
                      Thiết lập mặc định
                    </button>
                  )}
                </div>

                <p className="text-xs text-slate-300">SĐT: {addr.phoneNumber}</p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {[addr.addressLine1, addr.ward, addr.district, addr.city, addr.country].filter(Boolean).join(', ')}
                </p>
              </div>

              <div className="flex justify-end items-center gap-2 pt-3 border-t border-slate-800/80">
                <button
                  onClick={() => handleOpenEditModal(addr)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all text-xs flex items-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Sửa
                </button>
                <button
                  onClick={() => handleDelete(addr.id)}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all text-xs flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl max-w-lg w-full border border-slate-800 space-y-4 animate-fade-in">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">
                {editingId ? 'Cập Nhật Địa Chỉ' : 'Thêm Địa Chỉ Mới'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitModal} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Tên người nhận</label>
                  <input
                    type="text"
                    required
                    value={formData.recipientName}
                    onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    required
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Địa chỉ (Số nhà, Tên đường)</label>
                <input
                  type="text"
                  required
                  value={formData.addressLine1}
                  onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Phường / Xã</label>
                  <input
                    type="text"
                    required
                    value={formData.ward}
                    onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Quận / Huyện</label>
                  <input
                    type="text"
                    required
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Tỉnh / Thành phố</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="rounded border-slate-800 text-indigo-600 focus:ring-0"
                />
                <label htmlFor="isDefault" className="text-xs text-slate-300">
                  Đặt làm địa chỉ mặc định
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                >
                  {editingId ? 'Lưu Cập Nhật' : 'Tạo Mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
