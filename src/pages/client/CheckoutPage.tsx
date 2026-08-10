import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useCartStore } from '../../store/useCartStore';
import { useToastStore } from '../../store/useToastStore';
import type { UserAddress, PaymentMethod } from '../../types';
import { MapPin, CreditCard, ArrowRight, Loader2, User, Phone, FileText } from 'lucide-react';

export const CheckoutPage: React.FC = () => {
  const { cart, fetchCart, clearCart } = useCartStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');

  const [recipientName, setRecipientName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');
  const [customerNote, setCustomerNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

  const handleSubmitCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    // Phone Regex Việt Nam
    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    if (!phoneRegex.test(phoneNumber)) {
      addToast({ type: 'warning', title: 'Số điện thoại không hợp lệ', message: 'Vui lòng nhập đúng số điện thoại nhận hàng Việt Nam.' });
      return;
    }

    if (!recipientName || !shippingAddress) {
      addToast({ type: 'warning', title: 'Thiếu thông tin', message: 'Vui lòng nhập tên người nhận và địa chỉ giao hàng.' });
      return;
    }

    try {
      setIsLoading(true);
      const payload = {
        recipientName,
        phoneNumber,
        shippingAddress,
        paymentMethod,
        customerNote: customerNote || undefined,
      };

      const res = await api.post('/orders/checkout', payload);
      if (res.data?.success) {
        const createdOrder = res.data.data;

        if (paymentMethod === 'PAYOS' && createdOrder?.id) {
          addToast({
            type: 'info',
            title: 'Đang kết nối PayOS',
            message: 'Hệ thống đang khởi tạo liên kết thanh toán VietQR...',
          });
          try {
            const payosRes = await api.post('/payments/payos/create-link', { orderId: createdOrder.id });
            if (payosRes.data?.success && payosRes.data?.data?.checkoutUrl) {
              await clearCart();
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
        await clearCart();
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

  const items = cart?.items || [];
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="space-y-8 py-4">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Thanh Toán Đơn Hàng</h1>
        <p className="text-xs text-slate-400 mt-1">Xác nhận thông tin giao hàng & Phương thức thanh toán</p>
      </div>

      <form onSubmit={handleSubmitCheckout} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Address Selector */}
          {addresses.length > 0 && (
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-400" /> Chọn Địa Chỉ Từ Sổ Địa Chỉ
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {addresses.map((addr) => (
                  <button
                    key={addr.id}
                    type="button"
                    onClick={() => handleSelectAddress(addr.id)}
                    className={`p-4 rounded-2xl border text-left transition-all ${selectedAddressId === addr.id
                        ? 'border-indigo-500 bg-indigo-500/10 text-white'
                        : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
                      }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-xs text-white">{addr.recipientName}</span>
                      {addr.isDefault && (
                        <span className="text-[10px] font-extrabold text-indigo-400 bg-indigo-500/20 px-2 py-0.5 rounded-full">
                          Mặc định
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-300">{addr.phoneNumber}</p>
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                      {[addr.addressLine1, addr.ward, addr.district, addr.city].filter(Boolean).join(', ')}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Form details */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-400" /> Thông Tin Người Nhận Hàng
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tên người nhận</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Nguyen Van A"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { id: 'COD', label: 'Thanh toán khi nhận (COD)', desc: 'Tiền mặt khi giao hàng' },
                { id: 'PAYOS', label: 'Cổng PayOS (VietQR)', desc: 'Quét mã QR Ngân hàng' },
                { id: 'VNPAY', label: 'Ví VNPay', desc: 'Quét mã QR VNPay' },
                { id: 'MOMO', label: 'Ví MoMo', desc: 'Thanh toán ví MoMo' },
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
          <h3 className="text-base font-bold text-white border-b border-slate-800 pb-4">
            Sản Phẩm Đặt Hàng ({items.length})
          </h3>

          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {items.map((item) => (
              <div key={item.productId} className="flex justify-between items-center text-xs">
                <span className="text-slate-300 truncate max-w-[180px]">
                  {item.product?.name || item.productId} (x{item.quantity})
                </span>
                <span className="font-semibold text-white">
                  {(item.price * item.quantity).toLocaleString('vi-VN')} đ
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-800 pt-4 space-y-2 text-xs">
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
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>Xác Nhận Đặt Hàng</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
