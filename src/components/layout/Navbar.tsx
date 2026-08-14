import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useCartStore } from '../../store/useCartStore';
import { useChatStore } from '../../store/useChatStore';
import api from '../../services/api';
import type { Product } from '../../types';
import {
  ShoppingBag,
  User as UserIcon,
  Search,
  LogOut,
  ShieldAlert,
  Menu,
  X,
  Package,
  MapPin,
  Sparkles,
  Loader2,
  TrendingUp,
  ArrowRight,
  Store,
  MessageSquare,
} from 'lucide-react';

const POPULAR_SEARCHES = [
  'iPhone 15 Pro Max',
  'MacBook Pro M3',
  'ASUS ROG Strix',
  'Sony WH-1000XM5',
  'Áo Sơ Mi Nam',
  'Robot Hút Bụi Xiaomi',
];

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { cart, fetchCart } = useCartStore();
  const { toggleChat } = useChatStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    }
  }, [isAuthenticated, fetchCart]);

  // Click outside listener to close search dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced API Live Search Suggestions
  useEffect(() => {
    const query = searchQuery.trim();
    if (!query) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/products/paginated?search=${encodeURIComponent(query)}&limit=5`);
        if (res.data?.success) {
          const items = res.data.data.products || res.data.data.items || res.data.data || [];
          setSuggestions(items);
        }
      } catch (err) {
        console.error('Lỗi tìm kiếm gợi ý:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    const query = searchQuery.trim();
    if (query) {
      navigate(`/products?search=${encodeURIComponent(query)}`);
    } else {
      navigate('/products');
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setShowSuggestions(false);
    if (location.pathname === '/products') {
      navigate('/products');
    }
  };

  const handleSelectProduct = (productId: string) => {
    setShowSuggestions(false);
    setSearchQuery('');
    navigate(`/products/${productId}`);
  };

  const handleSelectTag = (tag: string) => {
    setSearchQuery(tag);
    setShowSuggestions(false);
    navigate(`/products?search=${encodeURIComponent(tag)}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdmin =
    isAuthenticated &&
    (user?.email === 'admin@system.com' ||
      ['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(user?.roleCode || ''));
  const totalCartCount = cart?.totalItems || 0;

  return (
    <header className="sticky top-0 z-40 glass-nav transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-all">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-indigo-400">
              NEXSTORE
            </span>
          </Link>

          {/* Live Autocomplete Search Bar (Desktop) */}
          <div ref={searchRef} className="hidden md:block flex-1 max-w-md relative">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm, thương hiệu..."
                value={searchQuery}
                onFocus={() => setShowSuggestions(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                className="w-full bg-slate-900/90 border border-slate-800 rounded-full py-2.5 pl-11 pr-10 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />

              {isSearching ? (
                <Loader2 className="w-4 h-4 text-indigo-400 animate-spin absolute right-4 top-1/2 -translate-y-1/2" />
              ) : (
                searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )
              )}
            </form>

            {/* Suggestions Dropdown Card */}
            {showSuggestions && (
              <div className="absolute left-0 right-0 mt-3 rounded-2xl glass-panel p-3 shadow-2xl border border-slate-800 text-xs z-50 overflow-hidden animate-fade-in">
                {/* Cases: 1. Input empty -> Popular Searches */}
                {!searchQuery.trim() ? (
                  <div className="space-y-2 p-1">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-indigo-400" /> Tìm kiếm phổ biến
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {POPULAR_SEARCHES.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleSelectTag(tag)}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 text-slate-300 hover:text-white transition-all text-left"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : isSearching ? (
                  /* Loading State */
                  <div className="py-6 text-center text-slate-400 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" /> Đang tìm kiếm sản phẩm...
                  </div>
                ) : suggestions.length === 0 ? (
                  /* Empty Result State */
                  <div className="py-6 text-center text-slate-400">
                    Không tìm thấy sản phẩm nào phù hợp với <strong className="text-white">"{searchQuery}"</strong>
                  </div>
                ) : (
                  /* Products Suggestions List */
                  <div className="space-y-1">
                    <div className="px-2 py-1 border-b border-slate-800/80 flex justify-between items-center text-slate-400 font-semibold text-[11px]">
                      <span>Gợi ý sản phẩm cho "{searchQuery}"</span>
                      <span className="text-indigo-400">{suggestions.length} sản phẩm</span>
                    </div>

                    <div className="divide-y divide-slate-800/40">
                      {suggestions.map((p) => {
                        const price = p.discountPrice || p.price;
                        return (
                          <div
                            key={p.id}
                            onClick={() => handleSelectProduct(p.id)}
                            className="flex items-center gap-3 p-2 rounded-xl hover:bg-indigo-500/10 cursor-pointer transition-all group"
                          >
                            <img
                              src={p.thumbnail || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                              alt=""
                              className="w-10 h-10 rounded-lg object-contain bg-slate-900 p-1 border border-slate-800 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-white group-hover:text-indigo-300 truncate transition-colors">
                                {p.name}
                              </h4>
                              <p className="text-[11px] font-semibold text-emerald-400 mt-0.5">
                                {price.toLocaleString('vi-VN')} đ
                                {p.discountPrice && p.price > p.discountPrice && (
                                  <span className="ml-2 text-slate-500 line-through text-[10px]">
                                    {p.price.toLocaleString('vi-VN')} đ
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={handleSearchSubmit}
                      className="w-full py-2 mt-1 rounded-xl bg-slate-900 hover:bg-indigo-600 text-indigo-400 hover:text-white font-bold text-center flex items-center justify-center gap-1.5 transition-all"
                    >
                      <span>Xem tất cả kết quả cho "{searchQuery}"</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Nav Right Action Buttons */}
          <div className="hidden md:flex items-center gap-5">
            <Link
              to="/products"
              className={`text-sm font-medium transition-colors ${location.pathname === '/products' ? 'text-indigo-400 font-bold' : 'text-slate-300 hover:text-white'
                }`}
            >
              Sản phẩm
            </Link>

            <Link
              to="/stores"
              className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${location.pathname.startsWith('/stores') ? 'text-indigo-400 font-bold' : 'text-slate-300 hover:text-white'
                }`}
            >
              <Store className="w-4 h-4 text-indigo-400" />
              <span>Gian Hàng</span>
            </Link>

            <Link
              to="/seller/store"
              className={`text-sm font-medium transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${
                location.pathname === '/seller/store'
                  ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                  : 'border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10'
              }`}
            >
              <span>Kênh Người Bán</span>
            </Link>

            {/* Chat Icon Button */}
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => toggleChat()}
                className="relative p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:bg-slate-800/80 text-slate-200 hover:text-white transition-all"
                title="Trò chuyện"
              >
                <MessageSquare className="w-5 h-5 text-indigo-400" />
              </button>
            )}

            {/* Cart Icon */}
            <Link
              to="/cart"
              className="relative p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:bg-slate-800/80 text-slate-200 hover:text-white transition-all"
              title="Giỏ hàng"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalCartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/40 animate-pulse">
                  {totalCartCount > 99 ? '99+' : totalCartCount}
                </span>
              )}
            </Link>

            {/* User Profile / Admin Link */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all"
                >
                  <img
                    src={
                      user?.avatarUrl ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'User'}`
                    }
                    alt={user?.fullName}
                    className="w-8 h-8 rounded-full object-cover border border-indigo-500/40"
                  />
                  <span className="text-sm font-medium text-slate-200 max-w-[120px] truncate">
                    {user?.fullName}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-56 rounded-2xl glass-panel p-2 shadow-2xl border border-slate-800 text-sm animate-fade-in z-50">
                    <div className="p-3 border-b border-slate-800">
                      <p className="font-semibold text-white truncate">{user?.fullName}</p>
                      <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                    </div>

                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-amber-400 hover:bg-amber-500/10 transition-colors font-medium"
                      >
                        <ShieldAlert className="w-4 h-4" />
                        Trang Quản Trị (Admin)
                      </Link>
                    )}

                    <Link
                      to="/seller/store"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-indigo-400 hover:bg-indigo-500/10 transition-colors font-medium"
                    >
                      <Store className="w-4 h-4" />
                      Kênh Người Bán (Store)
                    </Link>

                    <Link
                      to="/profile"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                    >
                      <UserIcon className="w-4 h-4" />
                      Thông tin cá nhân
                    </Link>

                    <Link
                      to="/orders"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                    >
                      <Package className="w-4 h-4" />
                      Đơn hàng của tôi
                    </Link>

                    <Link
                      to="/addresses"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                    >
                      <MapPin className="w-4 h-4" />
                      Sổ địa chỉ
                    </Link>

                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors font-medium mt-1"
                    >
                      <LogOut className="w-4 h-4" />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-sm font-medium text-slate-300 hover:text-white px-4 py-2 transition-colors"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-medium px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/25 transition-all"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex md:hidden items-center gap-3">
            <Link to="/cart" className="relative p-2 text-slate-300">
              <ShoppingBag className="w-6 h-6" />
              {totalCartCount > 0 && (
                <span className="absolute top-0 right-0 bg-indigo-600 text-white text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {totalCartCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg text-slate-300 hover:text-white"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMenuOpen && (
        <div className="md:hidden glass-panel border-t border-slate-800 p-4 space-y-4 animate-fade-in">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder-slate-400"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </form>

          <nav className="flex flex-col gap-2">
            <Link
              to="/products"
              onClick={() => setIsMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800"
            >
              Tất cả Sản phẩm
            </Link>

            <Link
              to="/stores"
              onClick={() => setIsMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 flex items-center gap-2"
            >
              <Store className="w-4 h-4 text-indigo-400" /> Danh sách Gian Hàng
            </Link>

            <Link
              to="/seller/store"
              onClick={() => setIsMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-indigo-400 hover:bg-slate-800 font-medium flex items-center gap-2"
            >
              <Store className="w-4 h-4" /> Kênh Người Bán (Store)
            </Link>

            {isAuthenticated ? (
              <>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setIsMenuOpen(false)}
                    className="px-3 py-2 rounded-lg text-amber-400 hover:bg-slate-800 font-medium"
                  >
                    Trang Quản Trị Admin
                  </Link>
                )}
                <Link
                  to="/profile"
                  onClick={() => setIsMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800"
                >
                  Thông tin cá nhân
                </Link>
                <Link
                  to="/orders"
                  onClick={() => setIsMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800"
                >
                  Đơn hàng của tôi
                </Link>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleLogout();
                  }}
                  className="px-3 py-2 rounded-lg text-rose-400 hover:bg-slate-800 text-left font-medium"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
                <Link
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-center bg-slate-900 text-white font-medium"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-center bg-indigo-600 text-white font-medium"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};
