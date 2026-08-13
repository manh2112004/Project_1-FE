import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/useCartStore';
import { useToastStore } from '../../store/useToastStore';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ArrowLeft, Loader2, CheckSquare, Square } from 'lucide-react';

interface CartItemRowProps {
  item: any;
  isSelected: boolean;
  onToggleSelect: (productId: string) => void;
  onUpdateQuantity: (productId: string, newQty: number) => Promise<void>;
  onRemoveItem: (productId: string) => Promise<void>;
}

const CartItemRow: React.FC<CartItemRowProps> = ({
  item,
  isSelected,
  onToggleSelect,
  onUpdateQuantity,
  onRemoveItem,
}) => {
  const itemPrice = Number(item.price) || 0;
  const itemQty = Number(item.quantity) || 1;
  const [localQty, setLocalQty] = useState<string>(String(itemQty));

  useEffect(() => {
    setLocalQty(String(itemQty));
  }, [itemQty]);

  const handleBlur = () => {
    let parsed = parseInt(localQty, 10);
    if (isNaN(parsed) || parsed < 1) {
      parsed = 1;
    } else if (parsed > 99) {
      parsed = 99;
    }
    setLocalQty(String(parsed));
    if (parsed !== itemQty) {
      onUpdateQuantity(item.productId, parsed);
    }
  };

  const handleStep = (delta: number) => {
    const newQty = Math.min(99, Math.max(1, itemQty + delta));
    setLocalQty(String(newQty));
    if (newQty !== itemQty) {
      onUpdateQuantity(item.productId, newQty);
    }
  };

  const isVacation = Boolean(item.product?.store?.isOnVacation);
  const isInactive = item.product?.status === 'INACTIVE';
  const isDisabled = isVacation || isInactive;

  return (
    <div
      className={`glass-panel p-5 rounded-2xl border transition-all flex items-center gap-4 group ${
        isDisabled
          ? 'border-slate-800 bg-slate-900/30 opacity-75'
          : isSelected
          ? 'border-indigo-500/50 bg-indigo-500/5'
          : 'border-slate-800'
      }`}
    >
      {/* Checkbox */}
      <button
        type="button"
        disabled={isDisabled}
        onClick={() => !isDisabled && onToggleSelect(item.productId)}
        className="text-slate-400 hover:text-indigo-400 shrink-0 transition-colors p-1 disabled:opacity-30 disabled:cursor-not-allowed"
        title={
          isVacation
            ? 'Shop đang trong thời gian tạm nghỉ bán'
            : isInactive
            ? 'Sản phẩm tạm ngưng kinh doanh'
            : isSelected
            ? 'Bỏ chọn sản phẩm này'
            : 'Chọn sản phẩm này để thanh toán'
        }
      >
        {isSelected && !isDisabled ? (
          <CheckSquare className="w-5 h-5 text-indigo-500" />
        ) : (
          <Square className="w-5 h-5 text-slate-600" />
        )}
      </button>

      {/* Thumbnail */}
      <div className="w-20 h-20 rounded-xl bg-slate-900 p-2 flex items-center justify-center shrink-0 border border-slate-800">
        <img
          src={item.product?.thumbnail || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'}
          alt={item.productId}
          className="w-full h-full object-contain"
        />
      </div>

      {/* Name & Price */}
      <div className="flex-1 min-w-0 space-y-1">
        <h4 className="text-sm font-bold text-white truncate">
          {item.product?.name || `Sản phẩm ID: ${item.productId}`}
        </h4>
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-xs font-semibold text-emerald-400">
            {itemPrice.toLocaleString('vi-VN')} đ
          </p>
          {isVacation && (
            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
              Shop tạm nghỉ
            </span>
          )}
          {isInactive && !isVacation && (
            <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 rounded-full">
              Tạm ngưng bán
            </span>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <button
            type="button"
            disabled={itemQty <= 1}
            onClick={() => handleStep(-1)}
            className="p-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
            title="Giảm số lượng"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <input
            type="number"
            min={1}
            max={99}
            value={localQty}
            onChange={(e) => setLocalQty(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur();
              }
            }}
            className="w-12 text-center text-xs font-extrabold text-white bg-transparent focus:outline-none focus:bg-slate-800/80 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none border-x border-slate-800/50 py-1"
          />

          <button
            type="button"
            disabled={itemQty >= 99}
            onClick={() => handleStep(1)}
            className="p-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
            title="Tăng số lượng"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => onRemoveItem(item.productId)}
          className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
          title="Xóa sản phẩm"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export const CartPage: React.FC = () => {
  const { cart, isLoading, fetchCart, updateQuantity, removeItem, clearCart } = useCartStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();

  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const items = cart?.items || [];

  // Giữ lại các tích chọn hợp lệ khi items thay đổi (mặc định để rỗng [] khi mới vào giỏ)
  useEffect(() => {
    if (items.length > 0) {
      setSelectedProductIds((prev) => prev.filter((id) => items.some((i) => i.productId === id)));
    } else {
      setSelectedProductIds([]);
    }
  }, [items]);

  const handleToggleSelect = (productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const isAllSelected = items.length > 0 && selectedProductIds.length === items.length;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(items.map((i) => i.productId));
    }
  };

  const handleUpdateQuantity = async (productId: string, newQty: number) => {
    const clampedQty = Math.min(99, Math.max(1, newQty));
    await updateQuantity(productId, clampedQty);
  };

  const handleRemoveItem = async (productId: string) => {
    await removeItem(productId);
    setSelectedProductIds((prev) => prev.filter((id) => id !== productId));
    addToast({ type: 'info', title: 'Thông báo', message: 'Đã xóa sản phẩm khỏi giỏ hàng.' });
  };

  const handleClearCart = async () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tất cả sản phẩm trong giỏ hàng?')) {
      await clearCart();
      setSelectedProductIds([]);
      addToast({ type: 'info', title: 'Thông báo', message: 'Đã xóa sạch giỏ hàng.' });
    }
  };

  // Chỉ tính tổng số lượng & tổng tiền cho các sản phẩm ĐÃ ĐƯỢC TÍCH CHỌN
  const selectedItems = items.filter((item) => selectedProductIds.includes(item.productId));

  const totalSelectedQty = selectedItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const totalPrice = selectedItems.reduce((sum, item) => {
    const price = Number(item.price) || 0;
    const qty = Number(item.quantity) || 0;
    return sum + price * qty;
  }, 0);

  const handleProceedToCheckout = () => {
    if (selectedProductIds.length === 0) {
      addToast({
        type: 'warning',
        title: 'Thông báo',
        message: 'Vui lòng tích chọn ít nhất 1 sản phẩm để tiến hành thanh toán.',
      });
      return;
    }
    navigate('/checkout', { state: { selectedProductIds } });
  };

  if (isLoading && !cart) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 py-4 max-w-6xl mx-auto px-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Giỏ Hàng Của Bạn</h1>
          <p className="text-xs text-slate-400 mt-1">Lưu trữ trên bộ nhớ tạm Redis với hiệu năng cao</p>
        </div>

        {items.length > 0 && (
          <button
            onClick={handleClearCart}
            className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1.5 p-2 rounded-lg hover:bg-rose-500/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Xóa tất cả
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="glass-panel p-16 rounded-3xl text-center space-y-4 max-w-md mx-auto my-12 border border-slate-800">
          <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center text-slate-500 mx-auto">
            <ShoppingBag className="w-8 h-8 text-indigo-400" />
          </div>
          <h2 className="text-lg font-bold text-white">Giỏ hàng của bạn đang trống</h2>
          <p className="text-xs text-slate-400">Hãy chọn cho mình những sản phẩm ưng ý nhất từ cửa hàng!</p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-500/30 transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Khám phá sản phẩm ngay
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* List items */}
          <div className="lg:col-span-2 space-y-4">
            {/* Header select all */}
            <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="flex items-center gap-2.5 font-bold text-white hover:text-indigo-400 transition-colors"
              >
                {isAllSelected ? (
                  <CheckSquare className="w-5 h-5 text-indigo-500" />
                ) : (
                  <Square className="w-5 h-5 text-slate-600" />
                )}
                <span>Chọn tất cả ({items.length} sản phẩm)</span>
              </button>

              <span className="text-slate-400">
                Đã chọn: <strong className="text-indigo-400 font-bold">{selectedProductIds.length}</strong>/
                {items.length} món
              </span>
            </div>

            {items.map((item) => (
              <CartItemRow
                key={item.productId}
                item={item}
                isSelected={selectedProductIds.includes(item.productId)}
                onToggleSelect={handleToggleSelect}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
              />
            ))}
          </div>

          {/* Checkout Summary Card */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6 h-fit sticky top-24">
            <h3 className="text-base font-bold text-white border-b border-slate-800 pb-4">
              Tóm Tắt Đơn Hàng
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Số loại chọn mua</span>
                <span className="font-semibold text-white">{selectedProductIds.length} mục</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Tổng số lượng chọn</span>
                <span className="font-semibold text-white">{totalSelectedQty} sản phẩm</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Tạm tính</span>
                <span className="font-semibold text-white">{totalPrice.toLocaleString('vi-VN')} đ</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Phí giao hàng</span>
                <span className="font-semibold text-emerald-400">Miễn phí</span>
              </div>
              <div className="border-t border-slate-800 pt-3 flex justify-between text-sm font-black text-white">
                <span>Tổng tiền thanh toán</span>
                <span className="text-emerald-400">{totalPrice.toLocaleString('vi-VN')} đ</span>
              </div>
            </div>

            <button
              onClick={handleProceedToCheckout}
              disabled={selectedProductIds.length === 0}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-xl shadow-indigo-500/30 flex items-center justify-center gap-2 transition-all hover:scale-105 disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed"
            >
              <span>Tiến Hành Thanh Toán ({selectedProductIds.length})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
