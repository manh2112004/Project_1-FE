import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import type { Order, OrderStatus, Product } from '../../types';
import { Pagination } from '../../components/common/Pagination';
import { useToastStore } from '../../store/useToastStore';
import { Package, Clock, Truck, CheckCircle2, XCircle, X, Loader2, MapPin, User } from 'lucide-react';

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [productMap, setProductMap] = useState<Record<string, Product>>({});
  const [meta, setMeta] = useState<any>();
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Modal Cancel Order
  const [cancelModalOrderId, setCancelModalOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);

  const { addToast } = useToastStore();

  const fetchMyOrders = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/orders/me?page=${page}&limit=10`);
      if (res.data?.success) {
        const orderList: Order[] = res.data.data.orders || res.data.data.items || res.data.data || [];
        setOrders(orderList);
        setMeta(res.data.data.meta);

        // Tự động truy vấn lấy Tên sản phẩm & Ảnh Thumbnail cho từng productId
        const productIds = Array.from(
          new Set(
            orderList.flatMap((o) => (o.items || []).map((i) => i.productId)).filter(Boolean)
          )
        );

        if (productIds.length > 0) {
          const prodMap: Record<string, Product> = {};
          await Promise.all(
            productIds.map(async (pId) => {
              try {
                const pRes = await api.get(`/products/${pId}`);
                if (pRes.data?.success) {
                  prodMap[pId] = pRes.data.data;
                }
              } catch (err) {
                // Ignore if product deleted
              }
            })
          );
          setProductMap((prev) => ({ ...prev, ...prodMap }));
        }
      }
    } catch (err) {
      console.error('Lỗi lấy đơn hàng của tôi:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Tự động kiểm tra và xác nhận thanh toán PayOS khi quay lại trang
    const query = new URLSearchParams(window.location.search);
    const status = query.get('status');
    const orderId = query.get('orderId');

    if (status === 'success' && orderId) {
      window.history.replaceState({}, document.title, window.location.pathname);

      api
        .post('/payments/payos/confirm', { orderId })
        .then((res) => {
          if (res.data?.success) {
            addToast({
              type: 'success',
              title: 'Thanh toán thành công!',
              message: 'Đơn hàng đã được cập nhật thanh toán và trừ kho thành công.',
            });
          }
        })
        .catch((err) => {
          console.error('Lỗi xác nhận thanh toán:', err);
        })
        .finally(() => {
          fetchMyOrders();
        });
    } else {
      fetchMyOrders();
    }

    const handleSseOrderUpdate = () => {
      fetchMyOrders();
    };

    window.addEventListener('sse:order_updated', handleSseOrderUpdate);
    window.addEventListener('sse:order_created', handleSseOrderUpdate);

    return () => {
      window.removeEventListener('sse:order_updated', handleSseOrderUpdate);
      window.removeEventListener('sse:order_created', handleSseOrderUpdate);
    };
  }, [page]);

  const handleConfirmCancel = async () => {
    if (!cancelModalOrderId || !cancelReason.trim()) {
      addToast({ type: 'warning', title: 'Thông báo', message: 'Vui lòng nhập lý do hủy đơn hàng.' });
      return;
    }

    try {
      setIsSubmittingCancel(true);
      const res = await api.put(`/orders/${cancelModalOrderId}/cancel`, { cancelReason });
      if (res.data?.success) {
        addToast({ type: 'success', title: 'Đã hủy đơn hàng', message: 'Hủy đơn hàng thành công.' });
        setCancelModalOrderId(null);
        setCancelReason('');
        fetchMyOrders();
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Lỗi',
        message: err.response?.data?.message || 'Không thể hủy đơn hàng.',
      });
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 border border-amber-500/30 text-amber-400">
            <Clock className="w-3.5 h-3.5" /> Chờ xử lý
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 border border-indigo-500/30 text-indigo-400">
            <Package className="w-3.5 h-3.5" /> Đang chuẩn bị hàng
          </span>
        );
      case 'SHIPPED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 border border-blue-500/30 text-blue-400">
            <Truck className="w-3.5 h-3.5" /> Đang giao hàng
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" /> Đã giao thành công
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 border border-rose-500/30 text-rose-400">
            <XCircle className="w-3.5 h-3.5" /> Đã hủy đơn
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8 py-4 max-w-5xl mx-auto px-4">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Lịch Sử Đơn Hàng Của Tôi</h1>
        <p className="text-xs text-slate-400 mt-1">Theo dõi trạng thái giao nhận và quản lý các đơn hàng đã đặt</p>
      </div>

      {isLoading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="glass-panel p-16 rounded-3xl text-center space-y-3 border border-slate-800 max-w-md mx-auto">
          <Package className="w-12 h-12 text-slate-600 mx-auto" />
          <h2 className="text-base font-bold text-white">Bạn chưa có đơn hàng nào</h2>
          <p className="text-xs text-slate-400">Bắt đầu mua sắm ngay để trải nghiệm dịch vụ tốt nhất!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-5 transition-all hover:border-slate-700"
            >
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <span className="text-xs text-slate-400">Mã đơn hàng:</span>
                  <h3 className="text-sm font-extrabold text-white tracking-wider">{order.orderCode}</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Ngày đặt: {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                <div>{getStatusBadge(order.status)}</div>
              </div>

              {/* Items List With Thumbnail & Product Name */}
              <div className="space-y-3">
                {order.items?.map((item) => {
                  const prod = productMap[item.productId];
                  const itemPrice = Number(item.unitPrice) || 0;
                  const itemQty = Number(item.quantity) || 1;

                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-4 p-3.5 bg-slate-900/60 rounded-2xl border border-slate-800/80"
                    >
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <img
                          src={prod?.thumbnail || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=150'}
                          alt=""
                          className="w-12 h-12 rounded-xl object-contain bg-slate-950 p-1 border border-slate-800 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-white truncate">
                            {prod?.name || (item as any).productName || `Mã SP: ${item.productId}`}
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Số lượng: <strong className="text-indigo-400">x{itemQty}</strong> | Đơn giá: {itemPrice.toLocaleString('vi-VN')} đ
                          </p>
                        </div>
                      </div>

                      <span className="font-black text-xs text-emerald-400 shrink-0">
                        {(itemPrice * itemQty).toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Shipping & Recipient Info */}
              <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 text-xs space-y-1 text-slate-300">
                <p className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  <strong className="text-white">Người nhận:</strong> {order.recipientName} ({order.phoneNumber})
                </p>
                <p className="flex items-center gap-1.5 line-clamp-1">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                  <strong className="text-white">Địa chỉ:</strong> {order.shippingAddress}
                </p>
                {order.shippingCode && (
                  <p className="text-indigo-400 font-semibold">
                    <strong>Mã vận đơn:</strong> {order.shippingCode}
                  </p>
                )}
                {order.cancelReason && (
                  <p className="text-rose-400 font-semibold">
                    <strong>Lý do hủy:</strong> {order.cancelReason}
                  </p>
                )}
              </div>

              {/* Footer Total & Actions */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-800 pt-4">
                <div>
                  <span className="text-xs text-slate-400">Tổng tiền thanh toán: </span>
                  <span className="text-base font-black text-emerald-400">
                    {(Number(order.finalAmount) || 0).toLocaleString('vi-VN')} đ
                  </span>
                </div>

                {/* Cancel button if applicable */}
                {(order.status === 'PENDING' || order.status === 'PROCESSING') && (
                  <button
                    onClick={() => setCancelModalOrderId(order.id)}
                    className="px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-xs font-semibold transition-all"
                  >
                    Hủy đơn hàng này
                  </button>
                )}
              </div>
            </div>
          ))}

          <Pagination meta={meta} onPageChange={(p) => setPage(p)} />
        </div>
      )}

      {/* Cancel Order Modal */}
      {cancelModalOrderId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl max-w-md w-full border border-slate-800 space-y-4 animate-fade-in">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">Xác nhận Hủy Đơn Hàng</h3>
              <button onClick={() => setCancelModalOrderId(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">Vui lòng nhập lý do bạn muốn hủy đơn hàng này:</p>

            <textarea
              rows={3}
              placeholder="Nhập lý do hủy..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setCancelModalOrderId(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-800"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={isSubmittingCancel}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all disabled:opacity-50"
              >
                {isSubmittingCancel ? 'Đang gửi...' : 'Xác Nhận Hủy Đơn'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
