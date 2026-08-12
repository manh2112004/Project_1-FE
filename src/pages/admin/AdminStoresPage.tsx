import React, { useState, useEffect } from 'react';
import { storeService } from '../../services/storeService';
import { useToastStore } from '../../store/useToastStore';
import type { Store, StoreStatus } from '../../types';
import {
  Store as StoreIcon,
  Search,
  CheckCircle,
  Clock,
  Ban,
  AlertTriangle,
  RefreshCw,
  Eye,
  ChevronLeft,
  ChevronRight,
  XCircle,
} from 'lucide-react';

export const AdminStoresPage: React.FC = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  // Search & Filter
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [search, setSearch] = useState<string>('');
  const [status, setStatus] = useState<StoreStatus | ''>('');

  // Selected Store modal
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [modalType, setModalType] = useState<'view' | 'suspend' | 'reject' | null>(null);
  const [reason, setReason] = useState<string>('');

  const { addToast } = useToastStore();

  const fetchStores = async () => {
    setLoading(true);
    try {
      const res = await storeService.getStoresPaginated({
        page,
        limit,
        search: search || undefined,
        status: status || undefined,
      });

      if (res.data) {
        setStores(res.data.items || []);
        if (res.data.meta) {
          setTotalCount(res.data.meta.total || 0);
          setTotalPages(res.data.meta.totalPages || 1);
        }
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Lỗi',
        message: err.response?.data?.message || 'Tải danh sách gian hàng thất bại.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, [page, status]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchStores();
  };

  // Duyệt shop
  const handleApprove = async (store: Store) => {
    if (!confirm(`Bạn có chắc chắn muốn duyệt cửa hàng "${store.name}"?`)) return;
    try {
      await storeService.approveStore(store.id);
      addToast({ type: 'success', title: 'Thành công', message: `Đã phê duyệt gian hàng "${store.name}".` });
      fetchStores();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Lỗi', message: err.response?.data?.message || 'Thao tác thất bại.' });
    }
  };

  // Mở khóa shop
  const handleReactivate = async (store: Store) => {
    if (!confirm(`Xác nhận mở khóa cửa hàng "${store.name}"?`)) return;
    try {
      await storeService.reactivateStore(store.id);
      addToast({ type: 'success', title: 'Thành công', message: `Đã mở khóa cửa hàng "${store.name}".` });
      fetchStores();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Lỗi', message: err.response?.data?.message || 'Thao tác thất bại.' });
    }
  };

  // Khóa shop
  const handleSuspendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStore || !reason.trim()) return;
    try {
      await storeService.suspendStore(selectedStore.id, reason);
      addToast({ type: 'warning', title: 'Đã khóa gian hàng', message: `Đã khóa cửa hàng "${selectedStore.name}".` });
      setModalType(null);
      setReason('');
      fetchStores();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Lỗi', message: err.response?.data?.message || 'Khóa gian hàng thất bại.' });
    }
  };

  // Từ chối shop
  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStore || !reason.trim()) return;
    try {
      await storeService.rejectStore(selectedStore.id, reason);
      addToast({ type: 'info', title: 'Từ chối duyệt', message: `Đã từ chối gian hàng "${selectedStore.name}".` });
      setModalType(null);
      setReason('');
      fetchStores();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Lỗi', message: err.response?.data?.message || 'Từ chối thất bại.' });
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
            <StoreIcon className="w-7 h-7 text-indigo-400" /> Quản lý Gian Hàng (Stores)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Phê duyệt, khóa hoặc mở khóa các gian hàng của Người bán trên hệ thống.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchStores}
          className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-700 flex items-center gap-2 shadow-sm transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Làm mới
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row gap-4 justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Tìm theo tên shop, email, số điện thoại..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-xs text-white placeholder-slate-500"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-xl hover:from-indigo-500 hover:to-violet-500 text-xs shadow-lg shadow-indigo-500/20 transition-all"
          >
            Tìm kiếm
          </button>
        </form>

        {/* Status Filter Dropdown */}
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as StoreStatus | '');
            setPage(1);
          }}
          className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 focus:outline-none focus:border-indigo-500"
        >
          <option value="">-- Tất cả trạng thái --</option>
          <option value="PENDING">Chờ duyệt (PENDING)</option>
          <option value="ACTIVE">Đã duyệt / Hoạt động (ACTIVE)</option>
          <option value="REJECTED">Từ chối (REJECTED)</option>
          <option value="SUSPENDED">Đang bị khóa (SUSPENDED)</option>
        </select>
      </div>

      {/* Table List */}
      <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-2" />
            Đang tải danh sách cửa hàng...
          </div>
        ) : stores.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <StoreIcon className="w-12 h-12 text-slate-600 mx-auto mb-2" />
            Không tìm thấy gian hàng nào.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="py-4 px-6">Gian Hàng</th>
                  <th className="py-4 px-6">Liên Hệ</th>
                  <th className="py-4 px-6">Pháp Lý</th>
                  <th className="py-4 px-6">Trạng Thái</th>
                  <th className="py-4 px-6 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {stores.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 text-indigo-400 font-black flex items-center justify-center border border-slate-800 overflow-hidden shrink-0">
                          {s.logo ? (
                            <img src={s.logo} alt="Logo" className="w-full h-full object-cover" />
                          ) : (
                            s.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm">{s.name}</div>
                          <div className="text-[11px] text-slate-500">ID: {s.id.substring(0, 8)}...</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="text-slate-200 font-medium">{s.contactEmail}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{s.contactPhone || 'Chưa bổ sung SĐT'}</div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                        {s.businessType === 'PERSONAL' ? 'Cá nhân' : 'Doanh nghiệp'}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        {s.businessType === 'PERSONAL'
                          ? `CCCD: ${s.identityNumber || 'N/A'}`
                          : `MST: ${s.taxCode || 'N/A'}`}
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      {s.status === 'ACTIVE' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle className="w-3.5 h-3.5" /> Hoạt động
                        </span>
                      )}
                      {s.status === 'PENDING' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
                          <Clock className="w-3.5 h-3.5" /> Chờ duyệt
                        </span>
                      )}
                      {s.status === 'REJECTED' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          <Ban className="w-3.5 h-3.5" /> Từ chối
                        </span>
                      )}
                      {s.status === 'SUSPENDED' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                          <AlertTriangle className="w-3.5 h-3.5" /> Đang bị khóa
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Xem chi tiết */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStore(s);
                            setModalType('view');
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-400 rounded-lg hover:bg-slate-800"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Phê duyệt */}
                        {s.status === 'PENDING' && (
                          <button
                            type="button"
                            onClick={() => handleApprove(s)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm"
                          >
                            Duyệt
                          </button>
                        )}

                        {/* Từ chối */}
                        {s.status === 'PENDING' && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStore(s);
                              setModalType('reject');
                            }}
                            className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg shadow-sm"
                          >
                            Từ chối
                          </button>
                        )}

                        {/* Khóa shop */}
                        {s.status === 'ACTIVE' && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStore(s);
                              setModalType('suspend');
                            }}
                            className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg shadow-sm"
                          >
                            Khóa shop
                          </button>
                        )}

                        {/* Mở khóa shop */}
                        {s.status === 'SUSPENDED' && (
                          <button
                            type="button"
                            onClick={() => handleReactivate(s)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-sm"
                          >
                            Mở khóa
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Hiển thị {stores.length} / Tổng {totalCount} gian hàng
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold text-slate-300">
                Trang {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL VIEW / REJECT / SUSPEND */}
      {modalType && selectedStore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass-panel rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-800 text-white text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">
                {modalType === 'view' && `Chi tiết Gian hàng: ${selectedStore.name}`}
                {modalType === 'suspend' && `Khóa cửa hàng: ${selectedStore.name}`}
                {modalType === 'reject' && `Từ chối duyệt cửa hàng: ${selectedStore.name}`}
              </h3>
              <button type="button" onClick={() => setModalType(null)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Modal VIEW */}
            {modalType === 'view' && (
              <div className="space-y-3 text-slate-300">
                <div><b className="text-white">Tên shop:</b> {selectedStore.name}</div>
                <div><b className="text-white">Email:</b> {selectedStore.contactEmail}</div>
                <div><b className="text-white">Số điện thoại:</b> {selectedStore.contactPhone || 'N/A'}</div>
                <div><b className="text-white">Loại hình:</b> {selectedStore.businessType}</div>
                <div><b className="text-white">Số CCCD/CMND:</b> {selectedStore.identityNumber || 'N/A'}</div>
                <div><b className="text-white">Mã số thuế:</b> {selectedStore.taxCode || 'N/A'}</div>
                <div><b className="text-white">Trạng thái:</b> {selectedStore.status}</div>
                {selectedStore.statusNote && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
                    <b className="text-amber-200">Ghi chú/Lý do:</b> {selectedStore.statusNote}
                  </div>
                )}
                <div><b className="text-white">Mô tả:</b> {selectedStore.description || 'Chưa có mô tả'}</div>
              </div>
            )}

            {/* Modal SUSPEND */}
            {modalType === 'suspend' && (
              <form onSubmit={handleSuspendSubmit} className="space-y-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">
                    Nhập lý do khóa gian hàng *
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Ví dụ: Vi phạm chính sách bán hàng giả, hàng nhái..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="px-4 py-2 border border-slate-800 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold shadow-lg shadow-amber-500/20"
                  >
                    Xác nhận khóa shop
                  </button>
                </div>
              </form>
            )}

            {/* Modal REJECT */}
            {modalType === 'reject' && (
              <form onSubmit={handleRejectSubmit} className="space-y-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">
                    Nhập lý do từ chối phê duyệt *
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Ví dụ: Mã số thuế không đúng với CSDL cơ quan thuế..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="px-4 py-2 border border-slate-800 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold shadow-lg shadow-rose-500/20"
                  >
                    Xác nhận từ chối
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
