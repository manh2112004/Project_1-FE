import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../../services/api';
import type { Product, Category, PaginationMeta } from '../../types';
import { Pagination } from '../../components/common/Pagination';
import { useCartStore } from '../../store/useCartStore';
import { useToastStore } from '../../store/useToastStore';
import { useAuthStore } from '../../store/useAuthStore';
import { ShoppingBag, Search, Layers, RefreshCw } from 'lucide-react';

export const ProductsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const searchParam = searchParams.get('search') || '';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const categoryParam = searchParams.get('categoryId') || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>();
  const [isLoading, setIsLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState(searchParam);

  const { addToCart } = useCartStore();
  const { addToast } = useToastStore();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Load categories
    const fetchMetadata = async () => {
      try {
        const catRes = await api.get('/categories');
        if (catRes.data?.success) setCategories(catRes.data.data || []);
      } catch (err) {
        console.error('Lỗi lấy metadata:', err);
      }
    };
    fetchMetadata();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        let url = `/products/paginated?page=${pageParam}&limit=6`;
        if (searchParam) url += `&search=${encodeURIComponent(searchParam)}`;

        const res = await api.get(url);
        if (res.data?.success) {
          const data = res.data.data;
          let list: Product[] = [];
          if (Array.isArray(data)) {
            list = data;
          } else if (data && Array.isArray(data.products)) {
            list = data.products;
          } else if (data && Array.isArray(data.items)) {
            list = data.items;
          }

          // Lọc danh mục thủ công nếu có categoryId (phía FE fallback)
          if (categoryParam) {
            list = list.filter((p) => p.categoryId === categoryParam);
          }

          setProducts(list);
          setMeta(data.meta);
        }
      } catch (err) {
        console.error('Lỗi lấy danh sách sản phẩm:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [pageParam, searchParam, categoryParam]);

  useEffect(() => {
    setSearchKeyword(searchParam);
  }, [searchParam]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchKeyword.trim();
    if (query) {
      setSearchParams({ page: '1', search: query });
    } else {
      setSearchParams({ page: '1' });
    }
  };

  const handleCategorySelect = (catId: string) => {
    if (catId === categoryParam) {
      searchParams.delete('categoryId');
    } else {
      searchParams.set('categoryId', catId);
    }
    searchParams.set('page', '1');
    setSearchParams(searchParams);
  };

  const handlePageChange = (newPage: number) => {
    searchParams.set('page', newPage.toString());
    setSearchParams(searchParams);
  };

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
    <div className="space-y-8 py-4">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Danh Sách Sản Phẩm</h1>
          <p className="text-xs text-slate-400 mt-1">Tìm kiếm & Lọc sản phẩm phù hợp với nhu cầu của bạn</p>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-md w-full">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Từ khóa tìm kiếm..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-indigo-500/20"
          >
            Tìm
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filter */}
        <aside className="space-y-6">
          {/* Categories Filter */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-white font-bold text-sm border-b border-slate-800 pb-3">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Danh Mục Sản Phẩm</span>
            </div>
            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between ${categoryParam === cat.id
                      ? 'bg-indigo-600/30 text-indigo-400 border border-indigo-500/40 font-bold'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                    }`}
                >
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Reset Filters */}
          {(categoryParam || searchParam) && (
            <button
              onClick={() => setSearchParams({})}
              className="w-full py-2.5 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
            >
              <RefreshCw className="w-4 h-4" /> Bỏ bộ lọc
            </button>
          )}
        </aside>

        {/* Product Grid Main */}
        <main className="lg:col-span-3 space-y-6">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="glass-panel h-80 rounded-2xl animate-pulse"></div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="glass-panel p-16 rounded-2xl text-center space-y-4 border border-slate-800">
              <p className="text-slate-400 text-sm">Không tìm thấy sản phẩm nào khớp với yêu cầu tìm kiếm.</p>
              <button
                onClick={() => setSearchParams({})}
                className="px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-semibold hover:bg-slate-800"
              >
                Xem tất cả sản phẩm
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {products.map((product) => {
                  const hasDiscount = product.discountPrice && product.discountPrice < product.price;

                  return (
                    <div
                      key={product.id}
                      className="glass-card rounded-2xl overflow-hidden flex flex-col justify-between border border-slate-800/80 group"
                    >
                      <div className="relative aspect-square bg-slate-900/60 p-4 flex items-center justify-center">
                        <img
                          src={product.thumbnail || 'https://via.placeholder.com/300?text=No+Image'}
                          alt={product.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-all duration-300"
                        />
                        {hasDiscount && (
                          <span className="absolute top-3 left-3 bg-rose-500 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-lg">
                            Giảm giá
                          </span>
                        )}
                      </div>

                      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                        <div>
                          <h3 className="text-sm font-bold text-white line-clamp-2 group-hover:text-indigo-400 transition-colors">
                            <Link to={`/products/${product.id}`}>{product.name}</Link>
                          </h3>
                          {product.sku && (
                            <p className="text-[10px] text-slate-500 uppercase mt-1">SKU: {product.sku}</p>
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
                            className="p-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/30 transition-all"
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

              {/* Pagination */}
              <Pagination meta={meta} onPageChange={handlePageChange} />
            </>
          )}
        </main>
      </div>
    </div>
  );
};
