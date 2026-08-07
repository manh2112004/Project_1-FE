import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ShieldCheck, Truck, CreditCard, Headset } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-900 text-slate-400 mt-auto">
      {/* Features Bar */}
      <div className="border-b border-slate-900/80 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h5 className="text-sm font-semibold text-white">Giao hàng toàn quốc</h5>
              <p className="text-xs text-slate-400">Nhanh chóng & An toàn</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h5 className="text-sm font-semibold text-white">Cam kết chính hãng</h5>
              <p className="text-xs text-slate-400">100% Sản phẩm chất lượng</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h5 className="text-sm font-semibold text-white">Thanh toán linh hoạt</h5>
              <p className="text-xs text-slate-400">COD, VNPay, MoMo</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-violet-500/10 text-violet-400">
              <Headset className="w-6 h-6" />
            </div>
            <div>
              <h5 className="text-sm font-semibold text-white">Hỗ trợ 24/7</h5>
              <p className="text-xs text-slate-400">Tư vấn tận tâm</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">NEXSTORE</span>
          </div>
          <p className="text-xs leading-relaxed text-slate-400">
            Hệ thống bán sỉ và lẻ sản phẩm công nghệ, đồ gia dụng và thời trang cao cấp hàng đầu Việt Nam.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-white mb-4">Khám phá</h4>
          <ul className="space-y-2.5 text-xs">
            <li><Link to="/products" className="hover:text-indigo-400 transition-colors">Tất cả sản phẩm</Link></li>
            <li><Link to="/products?search=hot" className="hover:text-indigo-400 transition-colors">Sản phẩm bán chạy</Link></li>
            <li><Link to="/cart" className="hover:text-indigo-400 transition-colors">Giỏ hàng</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-white mb-4">Tài khoản</h4>
          <ul className="space-y-2.5 text-xs">
            <li><Link to="/profile" className="hover:text-indigo-400 transition-colors">Thông tin cá nhân</Link></li>
            <li><Link to="/orders" className="hover:text-indigo-400 transition-colors">Lịch sử đơn hàng</Link></li>
            <li><Link to="/addresses" className="hover:text-indigo-400 transition-colors">Sổ địa chỉ</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-white mb-4">Liên hệ</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Email: support@nexstore.vn<br />
            Hotline: 1900 6868<br />
            Địa chỉ: 123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh
          </p>
        </div>
      </div>

      <div className="border-t border-slate-900 py-6 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} NexStore. Tất cả quyền được bảo lưu. Kết nối với Backend Project_1.
      </div>
    </footer>
  );
};
