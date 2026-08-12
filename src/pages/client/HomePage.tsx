import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import type { Product, Category, Brand } from '../../types';
import { useCartStore } from '../../store/useCartStore';
import { useToastStore } from '../../store/useToastStore';
import { useAuthStore } from '../../store/useAuthStore';
import {
  ShoppingBag,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Flame,
  Layers,
  Award,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { addToCart } = useCartStore();
  const { addToast } = useToastStore();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [prodRes, catRes, brandRes] = await Promise.all([
          api.get('/products/paginated?limit=8'),
          api.get('/categories'),
          api.get('/brand'),
        ]);

        if (prodRes.data?.success) {
          const data = prodRes.data.data;
          let list: Product[] = [];
          if (Array.isArray(data)) {
            list = data;
          } else if (data && Array.isArray(data.products)) {
            list = data.products;
          } else if (data && Array.isArray(data.items)) {
            list = data.items;
          }
          setProducts(list);
        }
        if (catRes.data?.success) {
          setCategories(catRes.data.data || []);
        }
        if (brandRes.data?.success) {
          setBrands(brandRes.data.data || []);
        }
      } catch (err) {
        console.error('Lỗi lấy dữ liệu Trang chủ:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

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

  return (
    <div className="space-y-16 py-4">
      {/* Hero Banner Component */}
      <section className="relative rounded-3xl overflow-hidden glass-panel p-8 sm:p-12 md:p-16 border border-slate-800 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-indigo-600/30 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-96 h-96 bg-violet-600/30 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-2xl space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" /> Trải Nghiệm Mua Sắm Hiện Đại 2026
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Khám Phá Công Nghệ & Phong Cách Sống{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400">
              Đẳng Cấp
            </span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Hàng ngàn sản phẩm chính hãng, cập nhật liên tục với ưu đãi hấp dẫn. Hệ thống thanh toán an toàn, giao hàng siêu tốc toàn quốc.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <Link
              to="/products"
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm shadow-xl shadow-indigo-500/30 flex items-center gap-2 transition-all hover:scale-105"
            >
              <span>Xem Tất Cả Sản Phẩm</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      {categories.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              <h2 className="text-xl font-extrabold text-white tracking-tight">Danh Mục Nổi Bật</h2>
            </div>
            <Link to="/products" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              Xem tất cả <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {categories.slice(0, 6).map((cat) => (
              <Link
                key={cat.id}
                to={`/products?categoryId=${cat.id}`}
                className="glass-card p-5 rounded-2xl flex flex-col items-center text-center gap-3 group"
              >
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-all">
                  {cat.image ? (
                    <img src={cat.image} alt={cat.name} className="w-10 h-10 object-contain rounded-xl" />
                  ) : (
                    <Layers className="w-7 h-7" />
                  )}
                </div>
                <span className="text-xs font-semibold text-slate-200 group-hover:text-indigo-400 transition-colors line-clamp-1">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products Grid */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-extrabold text-white tracking-tight">Sản Phẩm Bán Chạy</h2>
          </div>
          <Link to="/products" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
            Xem thêm <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="glass-panel h-80 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="glass-card p-12 rounded-2xl text-center text-slate-400 text-sm">
            Chưa có sản phẩm nào được cập nhật trong hệ thống.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
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
                      {product.store && (
                        <Link
                          to={`/stores/${product.store.id}`}
                          className="flex items-center gap-2 pb-1.5 border-b border-slate-800/40 mb-1 hover:text-indigo-400 transition-colors z-10 relative"
                        >
                          <img
                            src={
                              product.store.logo ||
                              `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(product.store.name)}`
                            }
                            alt={product.store.name}
                            className="w-5 h-5 rounded-full object-cover bg-slate-900 border border-indigo-500/40 p-0.5 shrink-0"
                          />
                          <span className="text-[11px] font-bold text-indigo-300 hover:text-indigo-200 truncate">
                            {product.store.name}
                          </span>
                        </Link>
                      )}
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

      {/* Brands Banner */}
      {brands.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-violet-400" />
            <h2 className="text-xl font-extrabold text-white tracking-tight">Thương Hiệu Đối Tác</h2>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
            {brands.map((brand) => (
              <div
                key={brand.id}
                className="glass-card p-4 rounded-xl flex items-center justify-center text-center opacity-70 hover:opacity-100 transition-opacity"
              >
                {brand.logo ? (
                  <img src={brand.logo} alt={brand.name} className="h-8 object-contain filter grayscale hover:grayscale-0 transition-all" />
                ) : (
                  <span className="text-xs font-bold text-slate-300">{brand.name}</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
