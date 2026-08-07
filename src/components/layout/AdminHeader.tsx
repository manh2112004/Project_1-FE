import React from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AdminHeader: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-20 bg-slate-950/80 border-b border-slate-800 px-8 flex items-center justify-between sticky top-0 z-30 backdrop-blur-xl">
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight">Hệ Thống Quản Trị Backend</h2>
        <p className="text-xs text-slate-400">Kết nối trực tiếp API REST & Realtime SSE</p>
      </div>

      <div className="flex items-center gap-4">
        {/* SSE Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          SSE Realtime Active
        </div>

        {/* User Info & Logout */}
        <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
          <div className="w-9 h-9 rounded-full bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-bold">
            {user?.fullName?.charAt(0) || 'A'}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-semibold text-white leading-tight">{user?.fullName}</p>
            <p className="text-[11px] text-slate-400 font-medium">{user?.roleCode || 'ADMIN'}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Đăng xuất"
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
