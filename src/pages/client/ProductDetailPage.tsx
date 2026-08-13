import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import type { Product, ProductImage } from '../../types';
import { useCartStore } from '../../store/useCartStore';
import { useToastStore } from '../../store/useToastStore';
import { useAuthStore } from '../../store/useAuthStore';
import { ShoppingBag, ArrowLeft, ShieldCheck, Truck, Plus, Minus, Loader2, Store, AlertTriangle } from 'lucide-react';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [activeImage, setActiveImage] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const { addToCart } = useCartStore();
  const { addToast } = useToastStore();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!id) return;

    const fetchDetail = async () => {
      try {
        setIsLoading(true);
        const [prodRes, imgRes] = await Promise.all([
          api.get(`/products/${id}`),
          api.get('/product-images'),
        ]);

        if (prodRes.data?.success) {
          const prod: Product = prodRes.data.data;

          if (prod.storeId || prod.store?.id) {
            try {
              const targetStoreId = prod.storeId || prod.store?.id;
              const storeRes = await api.get(`/stores/${targetStoreId}`);
              if (storeRes.data?.success) {
                prod.store = storeRes.data.data;
              }
            } catch (err) {
              console.error('Lỗi lấy thông tin cửa hàng:', err);
            }
          }

          setProduct(prod);

          // Lọc danh sách hình ảnh theo productId
          let allImgs: string[] = [];
          if (prod.thumbnail) allImgs.push(prod.thumbnail);

          if (imgRes.data?.success) {
            const list: ProductImage[] = imgRes.data.data || [];
            const prodImgs = list.filter((img) => img.productId === id).map((img) => img.imageUrl);
            allImgs = [...allImgs, ...prodImgs];
          }

          // Duplicate remove
          allImgs = Array.from(new Set(allImgs));
          setImages(allImgs);
          setActiveImage(allImgs[0] || 'https://via.placeholder.com/400?text=No+Image');
        }
      } catch (err: any) {
        addToast({ type: 'error', title: 'Lỗi', message: 'Không thể lấy thông tin chi tiết sản phẩm.' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetail();
  }, [id, addToast]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      addToast({ type: 'warning', title: 'Yêu cầu đăng nhập', message: 'Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.' });
      navigate('/login');
      return;
    }

    if (!product) return;

    try {
      const priceToUse = product.discountPrice || product.price;
      await addToCart(product.id, quantity, priceToUse);
      addToast({ type: 'success', title: 'Thành công', message: `Đã thêm ${quantity} sản phẩm vào giỏ hàng!` });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Lỗi', message: err.message || 'Thêm giỏ hàng thất bại.' });
    }
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    navigate('/cart');
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="glass-panel p-12 rounded-2xl text-center space-y-4 max-w-md mx-auto my-12">
        <h2 className="text-xl font-bold text-white">Sản phẩm không tồn tại</h2>
        <Link to="/products" className="inline-block px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-medium text-sm">
          Quay lại danh sách sản phẩm
        </Link>
      </div>
    );
  }

  const hasDiscount = product.discountPrice && product.discountPrice < product.price;

  return (
    <div className="space-y-8 py-4">
      {/* Back Link */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Quay lại
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Left: Images Gallery */}
        <div className="space-y-4">
          <div className="glass-panel aspect-square rounded-3xl p-6 flex items-center justify-center border border-slate-800 overflow-hidden">
            <img
              src={activeImage}
              alt={product.name}
              className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
            />
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`w-16 h-16 rounded-xl glass-card p-1 border transition-all shrink-0 ${activeImage === img ? 'border-indigo-500 ring-2 ring-indigo-500/30' : 'border-slate-800 opacity-60 hover:opacity-100'
                    }`}
                >
                  <img src={img} alt="" className="w-full h-full object-contain rounded-lg" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Details Info */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 mb-2">
              <span>SKU: {product.sku}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug">
              {product.name}
            </h1>
            {product.shortDescription && (
              <p className="text-slate-300 text-sm mt-3 leading-relaxed">{product.shortDescription}</p>
            )}
          </div>

          {/* Shop Info Card */}
          {product.store && (
            <Link
              to={`/stores/${product.store.id}`}
              className="glass-panel p-4 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/50 via-slate-900/90 to-slate-900 flex items-center justify-between gap-4 shadow-lg hover:border-indigo-500/60 transition-all group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <img
                  src={
                    product.store.logo ||
                    `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(product.store.name)}`
                  }
                  alt={product.store.name}
                  className="w-12 h-12 rounded-xl object-cover bg-slate-900 border border-indigo-500/40 p-0.5 shrink-0 shadow-md group-hover:scale-105 transition-transform"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-white text-sm truncate group-hover:text-indigo-300 transition-colors">
                      {product.store.name}
                    </h4>
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full shrink-0">
                      <Store className="w-3 h-3" /> Gian hàng chính hãng
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    Email: {product.store.contactEmail} {product.store.contactPhone ? `• Hotline: ${product.store.contactPhone}` : ''}
                  </p>
                </div>
              </div>
            </Link>
          )}

          {/* Price Tag */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-baseline gap-4">
            {hasDiscount ? (
              <>
                <span className="text-3xl font-black text-emerald-400">
                  {product.discountPrice?.toLocaleString('vi-VN')} đ
                </span>
                <span className="text-sm font-semibold text-slate-500 line-through">
                  {product.price.toLocaleString('vi-VN')} đ
                </span>
                <span className="ml-auto text-xs font-extrabold bg-rose-500/20 border border-rose-500/30 text-rose-400 px-3 py-1 rounded-full">
                  Tiết kiệm {((1 - product.discountPrice! / product.price) * 100).toFixed(0)}%
                </span>
              </>
            ) : (
              <span className="text-3xl font-black text-white">
                {product.price.toLocaleString('vi-VN')} đ
              </span>
            )}
          </div>

          {/* Quantity Controls */}
          {(() => {
            const stock = product.stockQuantity ?? product.inventory?.quantity ?? 0;
            const isOutOfStock = stock <= 0;
            const isStoreVacation = Boolean(product.store?.isOnVacation);
            const isProductInactive = product.status === 'INACTIVE';
            const isCanBuy = !isOutOfStock && !isStoreVacation && !isProductInactive;
            const maxLimit = !isCanBuy ? 1 : Math.min(99, stock);

            return (
              <>
                {isStoreVacation && (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                    <div>
                      <strong className="font-bold">Gian hàng đang tạm nghỉ bán:</strong> Chủ shop đang bật chế độ tạm nghỉ. Sản phẩm hiện tạm thời ngưng nhận đơn đặt hàng.
                    </div>
                  </div>
                )}

                {isProductInactive && !isStoreVacation && (
                  <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                    <div>
                      <strong className="font-bold">Tạm ngưng kinh doanh:</strong> Sản phẩm này hiện tạm thời không khả dụng để đặt mua.
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-300">Số lượng mua</label>
                    {isStoreVacation ? (
                      <span className="text-xs font-bold bg-amber-500/20 border border-amber-500/30 text-amber-400 px-3 py-1 rounded-full">
                        Shop tạm nghỉ
                      </span>
                    ) : isProductInactive ? (
                      <span className="text-xs font-bold bg-rose-500/20 border border-rose-500/30 text-rose-400 px-3 py-1 rounded-full">
                        Tạm ngưng bán
                      </span>
                    ) : isOutOfStock ? (
                      <span className="text-xs font-bold bg-rose-500/20 border border-rose-500/30 text-rose-400 px-3 py-1 rounded-full">
                        Hết hàng trong kho
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                        Còn hàng: <strong className="font-bold text-emerald-300">{stock}</strong> sản phẩm
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                      <button
                        type="button"
                        disabled={!isCanBuy || quantity <= 1}
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="p-2.5 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>

                      <input
                        type="number"
                        disabled={!isCanBuy}
                        min={1}
                        max={maxLimit}
                        value={!isCanBuy ? 0 : quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (isNaN(val)) setQuantity(1);
                          else setQuantity(Math.min(maxLimit, Math.max(1, val)));
                        }}
                        onBlur={() => {
                          if (!quantity || quantity < 1) setQuantity(1);
                          if (quantity > maxLimit) setQuantity(maxLimit);
                        }}
                        className="w-14 text-center text-sm font-bold text-white bg-transparent focus:outline-none focus:bg-slate-800/80 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none border-x border-slate-800/50 py-1 disabled:opacity-40"
                      />

                      <button
                        type="button"
                        disabled={!isCanBuy || quantity >= maxLimit}
                        onClick={() => setQuantity((q) => Math.min(maxLimit, q + 1))}
                        className="p-2.5 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Action CTAs */}
                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <button
                    disabled={!isCanBuy}
                    onClick={handleAddToCart}
                    className="flex-1 py-3.5 rounded-xl bg-slate-900 border border-indigo-500/40 hover:bg-indigo-600/20 text-indigo-400 hover:text-white disabled:opacity-40 disabled:hover:bg-slate-900 disabled:hover:text-indigo-400 font-bold text-sm flex items-center justify-center gap-2 transition-all"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>
                      {isStoreVacation
                        ? 'Shop Đang Tạm Nghỉ Bán'
                        : isProductInactive
                        ? 'Sản Phẩm Tạm Ngưng Bán'
                        : isOutOfStock
                        ? 'Sản Phẩm Tạm Hết Hàng'
                        : 'Thêm Vào Giỏ Hàng'}
                    </span>
                  </button>
                  <button
                    disabled={!isCanBuy}
                    onClick={handleBuyNow}
                    className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white disabled:opacity-40 disabled:hover:from-indigo-600 disabled:hover:to-violet-600 font-bold text-sm shadow-xl shadow-indigo-500/30 transition-all hover:scale-105"
                  >
                    Mua Ngay
                  </button>
                </div>
              </>
            );
          })()}

          {/* Guarantee Badges */}
          <div className="pt-4 border-t border-slate-800/80 grid grid-cols-2 gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Cam kết hàng chính hãng 100%
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-indigo-400" /> Giao hàng toàn quốc
            </div>
          </div>

          {/* Full Description */}
          {product.description && (
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-white">Mô tả sản phẩm</h3>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{product.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
