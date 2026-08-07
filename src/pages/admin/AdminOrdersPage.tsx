import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import type { Order } from '../../types';
import { Pagination } from '../../components/common/Pagination';
import { useToastStore } from '../../store/useToastStore';
import { DollarSign, X, Loader2 } from 'lucide-react';

export const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [meta, setMeta] = useState<any>();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Ship Modal
  const [shipModalOrderId, setShipModalOrderId] = useState<string | null>(null);
  const [shippingCode, setShippingCode] = useState('');

  // Cancel Modal
  const [cancelModalOrderId, setCancelModalOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const { addToast } = useToastStore();

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      let url = `/orders?page=${page}&limit=10`;
      if (statusFilter !== 'ALL') url += `&status=${statusFilter}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;

      const res = await api.get(url);
      if (res.data?.success) {
        setOrders(res.data.data.orders || res.data.data.items || res.data.data || []);
        setMeta(res.data.data.meta);
      }
    } catch (err) {
      console.error('Lỗi lấy danh sách đơn hàng Admin:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    const handleSseOrderUpdate = () => {
      fetchOrders();
    };

    window.addEventListener('sse:order_updated', handleSseOrderUpdate);
    window.addEventListener('sse:order_created', handleSseOrderUpdate);

    return () => {
      window.removeEventListener('sse:order_updated', handleSseOrderUpdate);
      window.removeEventListener('sse:order_created', handleSseOrderUpdate);
    };
  }, [page, statusFilter]);

  const handleConfirm = async (id: string) => {
    try {
      const res = await api.put(`/orders/${id}/confirm`);
      if (res.data?.success) {
        addToast({ type: 'success', title: 'Thành công', message: 'Đã duyệt đơn hàng sang trạng thái Đang xử lý.' });
        fetchOrders();
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Lỗi', message: err.response?.data?.message || 'Duyệt đơn thất bại.' });
    }
  };

  const handleShipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shipModalOrderId || !shippingCode.trim()) return;

    try {
      const res = await api.put(`/orders/${shipModalOrderId}/ship`, { shippingCode });
      if (res.data?.success) {
        addToast({ type: 'success', title: 'Thành công', message: 'Đã bàn giao đơn hàng cho đơn vị vận chuyển.' });
        setShipModalOrderId(null);
        setShippingCode('');
        fetchOrders();
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Lỗi', message: err.response?.data?.message || 'Bàn giao thất bại.' });
    }
  };

  const handleMarkDelivered = async (id: string) => {
    try {
      const res = await api.put(`/orders/${id}/deliver`);
      if (res.data?.success) {
        addToast({ type: 'success', title: 'Thành công', message: 'Đã xác nhận giao hàng thành công!' });
        fetchOrders();
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Lỗi', message: err.response?.data?.message || 'Cập nhật thất bại.' });
    }
  };

  const handleMarkPaid = async (id: string) => {
    try {
      const res = await api.put(`/orders/${id}/pay`);
      if (res.data?.success) {
        addToast({ type: 'success', title: 'Thành công', message: 'Đã cập nhật trạng thái Đã thanh toán.' });
        fetchOrders();
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Lỗi', message: err.response?.data?.message || 'Cập nhật thanh toán thất bại.' });
    }
  };

  const handleAdminCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelModalOrderId || !cancelReason.trim()) return;

    try {
      const res = await api.put(`/orders/${cancelModalOrderId}/admin-cancel`, { cancelReason });
      if (res.data?.success) {
        addToast({ type: 'info', title: 'Đã hủy đơn', message: 'Admin đã hủy đơn hàng thành công.' });
        setCancelModalOrderId(null);
        setCancelReason('');
        fetchOrders();
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Lỗi', message: err.response?.data?.message || 'Hủy đơn thất bại.' });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Quản Lý Đơn Hàng Hệ Thống</h1>
        <p className="text-xs text-slate-400 mt-1">Theo dõi và chuyển đổi trạng thái vòng đời đơn hàng</p>
      </div>

      {/* Tabs Filter */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        {['ALL', 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((st) => (
          <button
            key={st}
            onClick={() => {
              setStatusFilter(st);
              setPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              statusFilter === st
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            {st === 'ALL' ? 'Tất cả đơn' : st}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      {isLoading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl text-center space-y-2 border border-slate-800">
          <p className="text-xs text-slate-400">Không có đơn hàng nào khớp với bộ lọc.</p>
        </div>
      ) : (
        <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 uppercase font-semibold bg-slate-900/60">
                <tr>
                  <th className="py-3.5 px-4">Mã Đơn</th>
                  <th className="py-3.5 px-4">Người Nhận / SĐT</th>
                  <th className="py-3.5 px-4">Thanh Toán</th>
                  <th className="py-3.5 px-4">Tổng Tiền</th>
                  <th className="py-3.5 px-4">Trạng Thái Đơn</th>
                  <th className="py-3.5 px-4 text-right">Xử Lý 1-Click</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-900/40">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-white block">{o.orderCode}</span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(o.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-white">{o.recipientName}</p>
                      <p className="text-[11px] text-slate-400">{o.phoneNumber}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[11px] font-semibold text-slate-300 block">{o.paymentMethod}</span>
                      <span
                        className={`text-[10px] font-extrabold ${
                          o.paymentStatus === 'PAID' ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {o.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-black text-emerald-400">
                      {o.finalAmount?.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* PENDING -> Confirm */}
                        {o.status === 'PENDING' && (
                          <button
                            onClick={() => handleConfirm(o.id)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px]"
                            title="Duyệt đơn"
                          >
                            Duyệt
                          </button>
                        )}

                        {/* PROCESSING -> Ship */}
                        {o.status === 'PROCESSING' && (
                          <button
                            onClick={() => setShipModalOrderId(o.id)}
                            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px]"
                            title="Bàn giao vận chuyển"
                          >
                            Vận chuyển
                          </button>
                        )}

                        {/* SHIPPED -> Deliver */}
                        {o.status === 'SHIPPED' && (
                          <button
                            onClick={() => handleMarkDelivered(o.id)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px]"
                            title="Xác nhận đã giao"
                          >
                            Đã giao
                          </button>
                        )}

                        {/* Mark Paid */}
                        {o.paymentStatus !== 'PAID' && (
                          <button
                            onClick={() => handleMarkPaid(o.id)}
                            className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 font-bold text-[10px]"
                            title="Đã thanh toán"
                          >
                            <DollarSign className="w-3 h-3 inline" /> Trả tiền
                          </button>
                        )}

                        {/* Admin Cancel */}
                        {o.status !== 'DELIVERED' && o.status !== 'CANCELLED' && (
                          <button
                            onClick={() => setCancelModalOrderId(o.id)}
                            className="px-2 py-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 font-bold text-[10px]"
                            title="Hủy đơn"
                          >
                            Hủy
                          </button>
                        )}
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

      {/* Ship Modal */}
      {shipModalOrderId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl max-w-md w-full border border-slate-800 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">Bàn Giao Đơn Cho Vận Chuyển</h3>
              <button onClick={() => setShipModalOrderId(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleShipSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Mã Vận Đơn (Tracking Code)</label>
                <input
                  type="text"
                  required
                  placeholder="GHN-123456789"
                  value={shippingCode}
                  onChange={(e) => setShippingCode(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShipModalOrderId(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Hủy bỏ
                </button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold">
                  Bàn Giao Vận Chuyển
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Cancel Modal */}
      {cancelModalOrderId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl max-w-md w-full border border-slate-800 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">Admin Hủy Đơn Hàng</h3>
              <button onClick={() => setCancelModalOrderId(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdminCancelSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Lý do hủy đơn</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Khách yêu cầu hủy, hết hàng tồn kho..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelModalOrderId(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Hủy bỏ
                </button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold">
                  Xác Nhận Hủy Đơn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
