import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import type { Store } from '../../types';
import { Store as StoreIcon, ShieldCheck, ArrowRight, Phone, Mail, Loader2, Search } from 'lucide-react';

export const StoresPage: React.FC = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        setIsLoading(true);
        const res = await api.get('/stores/paginated?limit=50&status=ACTIVE');
        if (res.data?.success) {
          const items: Store[] = res.data.data.items || res.data.data || [];
          setStores(items);
        }
      } catch (err) {
        console.error('Lỗi lấy danh sách cửa hàng:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStores();
  }, []);

  const filteredStores = stores.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.description && s.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-8 py-4">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <StoreIcon className="w-4 h-4" /> Hệ Thống Gian Hàng Chính Hãng
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Khám Phá Các Cửa Hàng
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Các gian hàng đã được xác thực, uy tín với hàng ngàn sản phẩm đa dạng và dịch vụ chăm sóc khách hàng hàng đầu.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80 relative z-10">
          <input
            type="text"
            placeholder="Tìm tên gian hàng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl py-3 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        </div>
      </div>

      {/* Stores Grid */}
      {isLoading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : filteredStores.length === 0 ? (
        <div className="glass-panel p-16 rounded-3xl text-center space-y-3 max-w-md mx-auto border border-slate-800">
          <StoreIcon className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">Chưa tìm thấy gian hàng nào</h3>
          <p className="text-xs text-slate-400">Thử tìm kiếm với từ khóa khác hoặc quay lại sau.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStores.map((store) => (
            <div
              key={store.id}
              className="glass-card rounded-3xl p-6 border border-slate-800 hover:border-indigo-500/40 transition-all duration-300 flex flex-col justify-between space-y-5 group shadow-xl hover:shadow-indigo-500/10"
            >
              <div className="space-y-4">
                {/* Header info */}
                <div className="flex items-start gap-4">
                  <img
                    src={
                      store.logo ||
                      `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(store.name)}`
                    }
                    alt={store.name}
                    className="w-16 h-16 rounded-2xl object-cover bg-slate-900 border border-indigo-500/30 p-1 shrink-0 shadow-lg group-hover:scale-105 transition-transform"
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-extrabold text-white text-base truncate group-hover:text-indigo-400 transition-colors">
                        {store.name}
                      </h3>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                      <ShieldCheck className="w-3 h-3" /> Đã xác thực
                    </span>
                  </div>
                </div>

                {/* Slogan / Description */}
                {store.description ? (
                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800/60">
                    {store.description}
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 italic p-3 rounded-xl bg-slate-900/40 border border-slate-800/40">
                    Chưa có mô tả cửa hàng.
                  </p>
                )}

                {/* Contact Meta */}
                <div className="space-y-1.5 text-xs text-slate-400 pt-1">
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span className="truncate">{store.contactEmail}</span>
                  </div>
                  {store.contactPhone && (
                    <div className="flex items-center gap-2 truncate">
                      <Phone className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span>{store.contactPhone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Link */}
              <Link
                to={`/stores/${store.id}`}
                className="w-full py-3 rounded-xl bg-slate-900 border border-indigo-500/30 hover:bg-indigo-600 text-indigo-400 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <span>Xem Gian Hàng</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
