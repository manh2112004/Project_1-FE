import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import { useCartStore } from '../../store/useCartStore';
import { useToastStore } from '../../store/useToastStore';
import type { UserAddress, PaymentMethod } from '../../types';
import {
  MapPin,
  CreditCard,
  ArrowRight,
  Loader2,
  User,
  Phone,
  FileText,
  ShoppingBag,
  X,
  CheckCircle2,
} from 'lucide-react';

export const CheckoutPage: React.FC = () => {
  const { cart, fetchCart } = useCartStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();
  const location = useLocation();

  const selectedProductIds: string[] | undefined = location.state?.selectedProductIds;

  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');

  const [recipientName, setRecipientName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');
  const [customerNote, setCustomerNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    fetchCart();
    const fetchAddresses = async () => {
      try {
        const res = await api.get('/user-addresses/me');
        if (res.data?.success) {
          const list: UserAddress[] = res.data.data || [];
          setAddresses(list);
          const defaultAddr = list.find((a) => a.isDefault) || list[0];
          if (defaultAddr) {
            setSelectedAddressId(defaultAddr.id);
            fillAddressData(defaultAddr);
          }
        }
      } catch (err) {
        console.error('Lỗi lấy danh sách địa chỉ:', err);
      }
    };
    fetchAddresses();
  }, [fetchCart]);

  const fillAddressData = (addr: UserAddress) => {
    setRecipientName(addr.recipientName);
    setPhoneNumber(addr.phoneNumber);
    const fullAddr = [addr.addressLine1, addr.addressLine2, addr.ward, addr.district, addr.city, addr.country]
      .filter(Boolean)
      .join(', ');
    setShippingAddress(fullAddr);
  };

  const handleSelectAddress = (addrId: string) => {
    setSelectedAddressId(addrId);
    const selected = addresses.find((a) => a.id === addrId);
    if (selected) fillAddressData(selected);
  };

  // Lọc chỉ hiển thị & thanh toán các sản phẩm được chọn
  const allItems = cart?.items || [];
  const items = selectedProductIds && selectedProductIds.length > 0
    ? allItems.filter((item) => selectedProductIds.includes(item.productId))
    : allItems;

  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Mở Popup Modal xác nhận đơn hàng sau khi validate form
  const handleSubmitCheckout = (e: React.FormEvent) => {
    e.preventDefault();

    // Phone Regex Việt Nam
    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    if (!phoneRegex.test(phoneNumber)) {
      addToast({
        type: 'warning',
        title: 'Số điện thoại không hợp lệ',
        message: 'Vui lòng nhập đúng số điện thoại nhận hàng Việt Nam.',
      });
      return;
    }

    if (!recipientName || !shippingAddress) {
      addToast({
        type: 'warning',
        title: 'Thiếu thông tin',
        message: 'Vui lòng nhập tên người nhận và địa chỉ giao hàng.',
      });
      return;
    }

    if (items.length === 0) {
      addToast({
        type: 'warning',
        title: 'Giỏ hàng rỗng',
        message: 'Không có sản phẩm nào được chọn để thanh toán.',
      });
      return;
    }

    setShowConfirmModal(true);
  };

  // Thực thi tạo đơn hàng khi người dùng bấm "Đồng Ý Đặt Hàng" trong Modal
  const handleConfirmCheckout = async () => {
    try {
      setIsLoading(true);
      const payload = {
        recipientName,
        phoneNumber,
        shippingAddress,
        paymentMethod,
        customerNote: customerNote || undefined,
        productIds: selectedProductIds && selectedProductIds.length > 0 ? selectedProductIds : undefined,
      };

      const res = await api.post('/orders/checkout', payload);
      if (res.data?.success) {
        const createdOrder = res.data.data;
        setShowConfirmModal(false);

        if (paymentMethod === 'PAYOS' && createdOrder?.id) {
          addToast({
            type: 'info',
            title: 'Đang kết nối PayOS',
            message: 'Hệ thống đang khởi tạo liên kết thanh toán VietQR...',
          });
          try {
            const payosRes = await api.post('/payments/payos/create-link', { orderId: createdOrder.id });
            if (payosRes.data?.success && payosRes.data?.data?.checkoutUrl) {
              await fetchCart();
              window.location.href = payosRes.data.data.checkoutUrl;
              return;
            }
          } catch (payosErr: any) {
            addToast({
              type: 'error',
              title: 'Lỗi khởi tạo thanh toán PayOS',
              message: payosErr.response?.data?.message || 'Không thể tạo liên kết thanh toán VietQR PayOS.',
            });
          }
        }

        addToast({
          type: 'success',
          title: 'Đặt hàng thành công!',
          message: `Mã đơn hàng của bạn: ${createdOrder?.orderCode || 'ORD'}`,
        });
        await fetchCart();
        navigate('/orders');
      }
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Đặt hàng thất bại',
        message: error.response?.data?.message || 'Có lỗi xảy ra khi tạo đơn hàng.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 py-4 max-w-5xl mx-auto px-4 relative">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Thanh Toán Đơn Hàng</h1>
        <p className="text-xs text-slate-400 mt-1">Xác nhận địa chỉ giao nhận và lựa chọn phương thức thanh toán</p>
      </div>

      <form onSubmit={handleSubmitCheckout} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Address Book Picker */}
          {addresses.length > 0 && (
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-400" /> Chọn Địa Chỉ Đã Lưu
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {addresses.map((addr) => (
                  <button
                    key={addr.id}
                    type="button"
                    onClick={() => handleSelectAddress(addr.id)}
                    className={`p-4 rounded-2xl border text-left transition-all ${selectedAddressId === addr.id
                      ? 'border-indigo-500 bg-indigo-500/10 text-white shadow-lg shadow-indigo-500/10'
                      : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
                      }`}
                  >
                    <div className="flex items-center justify-between font-bold text-xs text-white">
                      <span>{addr.recipientName}</span>
                      {addr.isDefault && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                          Mặc định
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">{addr.phoneNumber}</p>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                      {[addr.addressLine1, addr.ward, addr.district, addr.city].filter(Boolean).join(', ')}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recipient & Address Inputs */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-400" /> Thông Tin Người Nhận
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Họ tên người nhận</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn A"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Số điện thoại nhận</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="0987654321"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Địa chỉ giao hàng chi tiết</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Số 123 Đường ABC, Phường X, Quận Y, TP. Hồ Chí Minh"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Ghi chú đơn hàng (Tùy chọn)</label>
              <div className="relative">
                <textarea
                  rows={2}
                  placeholder="Giao giờ hành chính, gọi trước khi giao..."
                  value={customerNote}
                  onChange={(e) => setCustomerNote(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
                <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-indigo-400" /> Phương Thức Thanh Toán
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { id: 'COD', label: 'Thanh toán khi nhận (COD)', desc: 'Tiền mặt khi giao hàng' },
                { id: 'PAYOS', label: 'Cổng PayOS (VietQR)', desc: 'Quét mã QR Ngân hàng' },
              ].map((pm) => (
                <button
                  key={pm.id}
                  type="button"
                  onClick={() => setPaymentMethod(pm.id as PaymentMethod)}
                  className={`p-4 rounded-2xl border text-left transition-all ${paymentMethod === pm.id
                    ? 'border-indigo-500 bg-indigo-500/10 text-white shadow-lg shadow-indigo-500/10'
                    : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
                    }`}
                >
                  <span className="font-bold text-xs block text-white">{pm.label}</span>
                  <span className="text-[11px] text-slate-400 mt-1 block">{pm.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Summary */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6 h-fit sticky top-24">
          <h3 className="text-base font-bold text-white border-b border-slate-800 pb-4 flex items-center justify-between">
            <span>Sản Phẩm Đặt Hàng</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-bold">
              {items.length} mục
            </span>
          </h3>

          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {items.map((item) => (
              <div
                key={item.productId}
                className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-white font-bold truncate flex-1" title={item.product?.name || item.productId}>
                    {item.product?.name || item.productId}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-extrabold text-[11px] border border-indigo-500/30 shrink-0">
                    x{item.quantity}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5 border-t border-slate-800/60">
                  <span>
                    Đơn giá: <strong className="text-slate-300 font-semibold">{item.price.toLocaleString('vi-VN')} đ</strong>
                  </span>
                  <span>
                    Thành tiền:{' '}
                    <strong className="text-emerald-400 font-extrabold">
                      {(item.price * item.quantity).toLocaleString('vi-VN')} đ
                    </strong>
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-800 pt-4 space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Số loại chọn mua</span>
              <span className="text-white font-semibold">{items.length} mục</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Tổng số lượng sản phẩm</span>
              <span className="text-white font-semibold">
                {items.reduce((sum, item) => sum + item.quantity, 0)} sản phẩm
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Tạm tính</span>
              <span className="text-white font-semibold">{totalPrice.toLocaleString('vi-VN')} đ</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Phí giao hàng</span>
              <span className="text-emerald-400 font-semibold">Miễn phí</span>
            </div>
            <div className="border-t border-slate-800 pt-3 flex justify-between text-sm font-black text-white">
              <span>Tổng thanh toán</span>
              <span className="text-emerald-400">{totalPrice.toLocaleString('vi-VN')} đ</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || items.length === 0}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-xl shadow-indigo-500/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 hover:scale-105"
          >
            <span>Xác Nhận Đặt Hàng ({items.length})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Modal Popup Xác Nhận Đặt Hàng */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 max-w-lg w-full space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Xác Nhận Đặt Đơn Hàng</h3>
                  <p className="text-xs text-slate-400">Vui lòng kiểm tra lại thông tin đơn hàng trước khi hoàn tất</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Thông tin đơn hàng tóm tắt trong Modal */}
            <div className="space-y-3 text-xs bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Người nhận hàng:</span>
                <span className="font-bold text-white">
                  {recipientName} ({phoneNumber})
                </span>
              </div>

              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Địa chỉ giao hàng:</span>
                <span className="font-semibold text-slate-200 text-right max-w-[220px] truncate" title={shippingAddress}>
                  {shippingAddress}
                </span>
              </div>

              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Phương thức thanh toán:</span>
                <span className="font-bold text-indigo-400">
                  {paymentMethod === 'PAYOS' ? 'Cổng PayOS (VietQR)' : 'Thanh toán khi nhận (COD)'}
                </span>
              </div>

              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Sản phẩm đặt mua:</span>
                <span className="font-semibold text-white">
                  {items.length} loại ({items.reduce((s, i) => s + i.quantity, 0)} sản phẩm)
                </span>
              </div>

              <div className="flex justify-between pt-1 text-sm font-black">
                <span className="text-white">Tổng tiền thanh toán:</span>
                <span className="text-emerald-400">{totalPrice.toLocaleString('vi-VN')} đ</span>
              </div>
            </div>

            {/* Nút hành động trong Modal */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={isLoading}
                className="flex-1 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all border border-slate-700 disabled:opacity-50"
              >
                Hủy bỏ
              </button>

              <button
                type="button"
                onClick={handleConfirmCheckout}
                disabled={isLoading}
                className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-xl shadow-indigo-500/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 hover:scale-105"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Đồng Ý Đặt Hàng</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;
