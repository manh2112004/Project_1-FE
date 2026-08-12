import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import type { Store, Product } from '../../types';
import { useCartStore } from '../../store/useCartStore';
import { useToastStore } from '../../store/useToastStore';
import { useAuthStore } from '../../store/useAuthStore';
import {
  ShieldCheck,
  Phone,
  Mail,
  ShoppingBag,
  ArrowLeft,
  Loader2,
  Package,
} from 'lucide-react';

export const StoreDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { addToCart } = useCartStore();
  const { addToast } = useToastStore();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!id) return;

    const fetchStoreAndProducts = async () => {
      try {
        setIsLoading(true);
        const [storeRes, prodRes] = await Promise.all([
          api.get(`/stores/${id}`),
          api.get(`/products/store/${id}`),
        ]);

        if (storeRes.data?.success) {
          setStore(storeRes.data.data);
        }

        if (prodRes.data?.success) {
          setProducts(prodRes.data.data || []);
        }
      } catch (err: any) {
        addToast({ type: 'error', title: 'Lỗi', message: 'Không thể lấy thông tin cửa hàng.' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStoreAndProducts();
  }, [id, addToast]);

  const handleAddToCart = async (product: Product) => {
    if (!isAuthenticated) {
      addToast({ type: 'warning', title: 'Yêu cầu đăng nhập', message: 'Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.' });
      return;
    }

    try {
      const priceToUse = product.discountPrice || product.price;
      await addToCart(product.id, 1, priceToUse);
      addToast({ type: 'success', title: 'Thành công', message: `Đã thêm ${product.name} vào giỏ hàng!` });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Lỗi', message: err.message || 'Không thể thêm sản phẩm vào giỏ hàng.' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="glass-panel p-12 rounded-3xl text-center space-y-4 max-w-md mx-auto my-12 border border-slate-800">
        <h2 className="text-xl font-bold text-white">Gian hàng không tồn tại</h2>
        <Link to="/stores" className="inline-block px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs">
          Quay lại danh sách gian hàng
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-4">
      {/* Back Link */}
      <button
        onClick={() => navigate('/stores')}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Tất cả gian hàng
      </button>

      {/* Store Header Banner Card */}
      <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/60 via-slate-900/90 to-slate-900 relative overflow-hidden shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <img
              src={
                store.logo ||
                `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(store.name)}`
              }
              alt={store.name}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover bg-slate-900 border border-indigo-500/40 p-1 shadow-xl shrink-0"
            />
            <div className="space-y-2 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {store.name}
                </h1>
                <span className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5" /> Gian Hàng Chính Hãng
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-indigo-400" /> {store.contactEmail}
                </span>
                {store.contactPhone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-indigo-400" /> Hotline: {store.contactPhone}
                  </span>
                )}
                <span className="flex items-center gap-1.5 font-semibold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full">
                  <Package className="w-3.5 h-3.5" /> {products.length} sản phẩm
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Description Banner */}
        {store.description && (
          <div className="pt-4 border-t border-slate-800/80">
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line max-w-3xl">
              {store.description}
            </p>
          </div>
        )}
      </div>

      {/* Store Products List */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-400" />
            <span>Sản Phẩm Của Gian Hàng ({products.length})</span>
          </h2>
        </div>

        {products.length === 0 ? (
          <div className="glass-panel p-16 rounded-3xl text-center space-y-3 border border-slate-800">
            <Package className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">Gian hàng chưa đăng sản phẩm nào</h3>
            <p className="text-xs text-slate-400">Vui lòng quay lại sau khi chủ cửa hàng bổ sung thêm sản phẩm mới.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => {
              const hasDiscount = product.discountPrice && product.discountPrice < product.price;

              return (
                <div
                  key={product.id}
                  className="glass-card rounded-2xl overflow-hidden flex flex-col justify-between border border-slate-800/80 group hover:border-indigo-500/40 transition-all duration-300 shadow-lg hover:shadow-indigo-500/10"
                >
                  <div className="relative aspect-square w-full overflow-hidden bg-slate-900/90 p-4 flex items-center justify-center border-b border-slate-800/60">
                    <img
                      src={product.thumbnail || 'https://via.placeholder.com/300?text=No+Image'}
                      alt={product.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-all duration-300"
                    />
                    {hasDiscount && (
                      <span className="absolute top-3 left-3 bg-rose-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-lg z-10">
                        Giảm giá
                      </span>
                    )}
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug group-hover:text-indigo-400 transition-colors min-h-[2.5rem]">
                        <Link to={`/products/${product.id}`} title={product.name}>
                          {product.name}
                        </Link>
                      </h3>
                      {product.shortDescription && (
                        <p className="text-xs text-slate-400 line-clamp-1 mt-1">{product.shortDescription}</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/60">
                      <div>
                        {hasDiscount ? (
                          <div className="flex flex-col">
                            <span className="text-sm font-extrabold text-emerald-400">
                              {product.discountPrice?.toLocaleString('vi-VN')} đ
                            </span>
                            <span className="text-[11px] text-slate-500 line-through">
                              {product.price.toLocaleString('vi-VN')} đ
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm font-extrabold text-white">
                            {product.price.toLocaleString('vi-VN')} đ
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleAddToCart(product)}
                        className="p-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/30 transition-all shrink-0"
                        title="Thêm vào giỏ"
                      >
                        <ShoppingBag className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
