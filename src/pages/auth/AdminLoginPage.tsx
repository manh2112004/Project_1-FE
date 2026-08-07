import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import { ShieldCheck, Mail, Lock, ArrowRight, Loader2, ArrowLeft } from 'lucide-react';

export const AdminLoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { setAuth, logout } = useAuthStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      addToast({ type: 'warning', title: 'Thông báo', message: 'Vui lòng nhập Email và Mật khẩu Quản trị.' });
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.post('/auth/login', { email, password });
      if (res.data?.success) {
        const { user, accessToken, refreshToken } = res.data.data;

        // Kiểm tra quyền truy cập Trang Quản Trị: Tất cả các vai trò ngoại trừ CUSTOMER đều được phép
        const roleCode = user.roleCode || user.role?.code || '';
        if (roleCode === 'CUSTOMER') {
          addToast({
            type: 'error',
            title: 'Truy cập bị từ chối',
            message: 'Tài khoản Khách hàng (CUSTOMER) không có quyền truy cập Trang Quản Trị.',
          });
          logout();
          return;
        }

        setAuth(user, accessToken, refreshToken);
        addToast({
          type: 'success',
          title: 'Đăng nhập Quản trị thành công',
          message: `Chào mừng Quản trị viên ${user.fullName}!`,
        });
        navigate('/admin', { replace: true });
      }
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Đăng nhập thất bại',
        message: error.response?.data?.message || 'Email hoặc mật khẩu Admin không chính xác.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md glass-panel p-8 sm:p-10 rounded-3xl shadow-2xl relative z-10 border border-slate-800">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-amber-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">ADMIN PORTAL</h1>
          <p className="text-xs text-amber-400 font-semibold mt-1">Đăng nhập Dành Cho Quản Trị Viên & Nhân Viên</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Admin</label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="admin@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Mật khẩu</label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold text-xs shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Vào Trang Quản Trị</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800/80 text-center">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Quay lại trang bán hàng
          </Link>
        </div>
      </div>
    </div>
  );
};
