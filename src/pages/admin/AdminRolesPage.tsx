import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import type { Role, Permission, PaginationMeta } from '../../types';
import { Pagination } from '../../components/common/Pagination';
import { useToastStore } from '../../store/useToastStore';
import { ShieldCheck, Plus, Edit2, Trash2, Key, X, Loader2, CheckSquare } from 'lucide-react';

export const AdminRolesPage: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>();
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Modal Role
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [roleForm, setRoleForm] = useState({ name: '', code: '', description: '' });

  // Modal Permissions
  const [permissionModalRoleId, setPermissionModalRoleId] = useState<string | null>(null);
  const [selectedPermissionCodes, setSelectedPermissionCodes] = useState<string[]>([]);

  const { addToast } = useToastStore();

  const fetchRoles = async () => {
    try {
      setIsLoading(true);
      const [roleRes, permRes] = await Promise.all([
        api.get(`/roles/paginated?page=${page}&limit=10`),
        api.get('/permissions'),
      ]);

      if (roleRes.data?.success) {
        setRoles(roleRes.data.data.roles || roleRes.data.data.items || roleRes.data.data || []);
        setMeta(roleRes.data.data.meta);
      }
      if (permRes.data?.success) {
        setPermissions(permRes.data.data || []);
      }
    } catch (err) {
      console.error('Lỗi lấy danh sách Role/Permission:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, [page]);

  const handleOpenAddRole = () => {
    setEditingId(null);
    setRoleForm({ name: '', code: '', description: '' });
    setIsModalOpen(true);
  };

  const handleOpenEditRole = (r: Role) => {
    setEditingId(r.id);
    setRoleForm({ name: r.name, code: r.code, description: r.description || '' });
    setIsModalOpen(true);
  };

  const handleRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        const res = await api.put(`/roles/${editingId}`, roleForm);
        if (res.data?.success) {
          addToast({ type: 'success', title: 'Thành công', message: 'Cập nhật vai trò thành công.' });
        }
      } else {
        const res = await api.post('/roles', roleForm);
        if (res.data?.success) {
          addToast({ type: 'success', title: 'Thành công', message: 'Tạo vai trò thành công.' });
        }
      }
      setIsModalOpen(false);
      fetchRoles();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Lỗi', message: err.response?.data?.message || 'Thao tác vai trò thất bại.' });
    }
  };

  const handleDeleteRole = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa vai trò này?')) {
      try {
        const res = await api.delete(`/roles/${id}`);
        if (res.data?.success) {
          addToast({ type: 'info', title: 'Thành công', message: 'Đã xóa vai trò.' });
          fetchRoles();
        }
      } catch (err: any) {
        addToast({ type: 'error', title: 'Lỗi', message: 'Không thể xóa vai trò.' });
      }
    }
  };

  const handleOpenPermissionsModal = (role: Role) => {
    setPermissionModalRoleId(role.id);
    const existingCodes =
      role.permissionCodes ||
      role.permissions?.map((p: any) => (typeof p === 'string' ? p : p.name)) ||
      [];
    setSelectedPermissionCodes(existingCodes);
  };

  const handleAssignPermissions = async () => {
    if (!permissionModalRoleId) return;

    try {
      const res = await api.post(`/roles/${permissionModalRoleId}/permissions`, {
        permissionCodes: selectedPermissionCodes,
      });
      if (res.data?.success) {
        addToast({ type: 'success', title: 'Thành công', message: 'Cập nhật gán quyền cho vai trò thành công!' });
        setPermissionModalRoleId(null);
        fetchRoles();
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Lỗi', message: err.response?.data?.message || 'Gán quyền thất bại.' });
    }
  };

  const togglePermissionCode = (code: string) => {
    if (selectedPermissionCodes.includes(code)) {
      setSelectedPermissionCodes(selectedPermissionCodes.filter((c) => c !== code));
    } else {
      setSelectedPermissionCodes([...selectedPermissionCodes, code]);
    }
  };

  const isAllSelected = permissions.length > 0 && selectedPermissionCodes.length === permissions.length;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedPermissionCodes([]);
    } else {
      setSelectedPermissionCodes(permissions.map((p) => p.name));
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Quản Lý Vai Trò & Phân Quyền (RBAC)</h1>
          <p className="text-xs text-slate-400 mt-1">Định nghĩa vai trò và gán mã quyền hạn cho từng cấp bậc hệ thống</p>
        </div>

        <button
          onClick={handleOpenAddRole}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" /> Tạo Vai Trò Mới
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
                <th className="py-3.5 px-4">Tên Vai Trò</th>
                <th className="py-3.5 px-4">Mã Code</th>
                <th className="py-3.5 px-4">Mô Tả</th>
                <th className="py-3.5 px-4 text-center">Gán Mã Quyền</th>
                <th className="py-3.5 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {roles.map((r) => (
                <tr key={r.id} className="hover:bg-slate-900/40">
                  <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-400" />
                    <span>{r.name}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-indigo-300">{r.code}</td>
                  <td className="py-3.5 px-4 text-slate-400">{r.description || '-'}</td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => handleOpenPermissionsModal(r)}
                      className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 font-bold inline-flex items-center gap-1.5"
                    >
                      <Key className="w-3.5 h-3.5" /> Phân Quyền
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleOpenEditRole(r)} className="p-1.5 rounded-lg text-slate-400 hover:text-white">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteRole(r.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400">
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

      {/* Role Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl max-w-md w-full border border-slate-800 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">{editingId ? 'Sửa Vai Trò' : 'Tạo Vai Trò'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRoleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Tên vai trò</label>
                <input
                  type="text"
                  required
                  value={roleForm.name}
                  onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Mã Role Code (VIẾT_HOA)</label>
                <input
                  type="text"
                  required
                  placeholder="ADMIN, STAFF..."
                  value={roleForm.code}
                  onChange={(e) => setRoleForm({ ...roleForm, code: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Mô tả</label>
                <textarea
                  rows={2}
                  value={roleForm.description}
                  onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
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

      {/* Permissions Assign Modal */}
      {permissionModalRoleId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl max-w-lg w-full border border-slate-800 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">Gán Mã Quyền Cho Vai Trò</h3>
              <button onClick={() => setPermissionModalRoleId(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-300">Chọn danh sách mã quyền hạn được phép thực thi:</p>
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-all flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 active:scale-95"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  {isAllSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {permissions.map((p) => {
                  const isChecked = selectedPermissionCodes.includes(p.name);
                  return (
                    <label
                      key={p.id}
                      className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${isChecked
                          ? 'border-indigo-500 bg-indigo-500/10 text-white font-bold'
                          : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
                        }`}
                    >
                      <div>
                        <span className="font-mono text-indigo-300 block">{p.name}</span>
                        <span className="text-[10px] text-slate-500">{p.module} - {p.description}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => togglePermissionCode(p.name)}
                        className="rounded border-slate-800 text-indigo-600 focus:ring-0"
                      />
                    </label>
                  );
                })}
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setPermissionModalRoleId(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleAssignPermissions}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                >
                  Lưu Gán Quyền
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
