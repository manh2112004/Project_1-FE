import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import type { User, Role, PaginationMeta } from '../../types';
import { Pagination } from '../../components/common/Pagination';
import { useToastStore } from '../../store/useToastStore';
import { Trash2, Plus, X, Loader2, Edit2 } from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>();
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Modal Create
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phoneNumber: '',
    gender: 'MALE',
    roleId: '',
  });

  // Modal Edit
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    fullName: '',
    phoneNumber: '',
    gender: 'MALE',
    roleId: '',
    status: 'ACTIVE',
  });

  const { addToast } = useToastStore();

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const [userRes, roleRes] = await Promise.all([
        api.get(`/users/paginated?page=${page}&limit=10`),
        api.get('/roles'),
      ]);

      if (userRes.data?.success) {
        const data = userRes.data.data;
        setUsers(data.users || data.items || []);
        setMeta(data.meta);
      }
      if (roleRes.data?.success) {
        setRoles(roleRes.data.data || []);
      }
    } catch (err) {
      console.error('Lỗi lấy danh sách người dùng:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const handleBlockUser = async (id: string) => {
    try {
      const res = await api.patch(`/users/${id}/block`);
      if (res.data?.success) {
        addToast({ type: 'warning', title: 'Thông báo', message: 'Đã khóa tài khoản thành công.' });
        fetchUsers();
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Lỗi', message: 'Khóa tài khoản thất bại.' });
    }
  };

  const handleActivateUser = async (id: string) => {
    try {
      const res = await api.patch(`/users/${id}/activate`);
      if (res.data?.success) {
        addToast({ type: 'success', title: 'Thành công', message: 'Kích hoạt lại tài khoản thành công.' });
        fetchUsers();
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Lỗi', message: 'Kích hoạt thất bại.' });
    }
  };

  const handleChangeRole = async (userId: string, roleId: string) => {
    try {
      const res = await api.put(`/users/${userId}/role`, { roleId });
      if (res.data?.success) {
        addToast({ type: 'success', title: 'Thành công', message: 'Thay đổi vai trò người dùng thành công.' });
        fetchUsers();
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Lỗi', message: 'Cập nhật vai trò thất bại.' });
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      try {
        const res = await api.delete(`/users/${id}`);
        if (res.data?.success) {
          addToast({ type: 'info', title: 'Thành công', message: 'Đã xóa người dùng.' });
          fetchUsers();
        }
      } catch (err: any) {
        addToast({ type: 'error', title: 'Lỗi', message: 'Xóa người dùng thất bại.' });
      }
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/users', formData);
      if (res.data?.success) {
        addToast({ type: 'success', title: 'Thành công', message: 'Admin tạo tài khoản người dùng thành công.' });
        setIsModalOpen(false);
        fetchUsers();
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Lỗi', message: err.response?.data?.message || 'Tạo tài khoản thất bại.' });
    }
  };

  const handleOpenEditUser = (u: User) => {
    setEditingUserId(u.id);
    setEditFormData({
      fullName: u.fullName || '',
      phoneNumber: u.phoneNumber || '',
      gender: u.gender || 'MALE',
      roleId: u.roleId || '',
      status: u.status || 'ACTIVE',
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserId) return;
    try {
      const res = await api.put(`/users/${editingUserId}`, editFormData);
      if (res.data?.success) {
        addToast({ type: 'success', title: 'Thành công', message: 'Cập nhật thông tin người dùng thành công.' });
        setIsEditModalOpen(false);
        fetchUsers();
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Lỗi', message: err.response?.data?.message || 'Cập nhật thông tin thất bại.' });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Quản Lý Người Dùng</h1>
          <p className="text-xs text-slate-400 mt-1">Gán Vai trò, Chỉnh sửa thông tin & Khóa/Kích hoạt tài khoản người dùng hệ thống</p>
        </div>

        <button
          onClick={() => {
            setFormData({
              email: '',
              password: '',
              fullName: '',
              phoneNumber: '',
              gender: 'MALE',
              roleId: roles[0]?.id || '',
            });
            setIsModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" /> Tạo Tài Khoản Mới
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
                <th className="py-3.5 px-4">Người Dùng</th>
                <th className="py-3.5 px-4">Số Điện Thoại</th>
                <th className="py-3.5 px-4">Trạng Thái</th>
                <th className="py-3.5 px-4">Thay Đổi Vai Trò</th>
                <th className="py-3.5 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-900/40">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
                        {u.fullName?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="font-bold text-white">{u.fullName}</p>
                        <p className="text-[10px] text-slate-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300">{u.phoneNumber || '-'}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${u.status === 'BLOCKED'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <select
                      value={u.roleId}
                      onChange={(e) => handleChangeRole(u.id, e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded-lg py-1 px-2.5 text-xs text-white"
                    >
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} ({r.code})
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEditUser(u)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors"
                        title="Chỉnh sửa thông tin"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {u.status === 'BLOCKED' ? (
                        <button
                          onClick={() => handleActivateUser(u.id)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px]"
                        >
                          Kích Hoạt
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBlockUser(u.id)}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 font-bold text-[10px]"
                        >
                          Khóa
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400"
                        title="Xóa người dùng"
                      >
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

      {/* Admin Create User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl max-w-md w-full border border-slate-800 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">Admin Tạo Tài Khoản Mới</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Họ và tên</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Mật khẩu</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Số điện thoại</label>
                <input
                  type="text"
                  required
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Vai trò</label>
                <select
                  value={formData.roleId}
                  onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-white"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.code})
                    </option>
                  ))}
                </select>
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
                  Tạo Mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Edit User Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl max-w-md w-full border border-slate-800 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">Chỉnh Sửa Thông Tin Người Dùng</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Họ và tên</label>
                <input
                  type="text"
                  required
                  value={editFormData.fullName}
                  onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Số điện thoại</label>
                <input
                  type="text"
                  value={editFormData.phoneNumber}
                  onChange={(e) => setEditFormData({ ...editFormData, phoneNumber: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Giới tính</label>
                <select
                  value={editFormData.gender}
                  onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-white"
                >
                  <option value="MALE">Nam (MALE)</option>
                  <option value="FEMALE">Nữ (FEMALE)</option>
                  <option value="OTHER">Khác (OTHER)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Vai trò</label>
                <select
                  value={editFormData.roleId}
                  onChange={(e) => setEditFormData({ ...editFormData, roleId: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-white"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Trạng thái tài khoản</label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-white"
                >
                  <option value="ACTIVE">Hoạt động (ACTIVE)</option>
                  <option value="BLOCKED">Đã khóa (BLOCKED)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-semibold"
                >
                  Hủy bỏ
                </button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold">
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
