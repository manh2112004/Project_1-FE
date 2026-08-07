import React from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PermissionGuardProps {
  children: React.ReactNode;
  requiredPermission: string;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({ children, requiredPermission }) => {
  const { user, hasPermission } = useAuthStore();

  const isSuperAdmin = user?.email === 'admin@system.com' || user?.roleCode === 'SUPER_ADMIN';
  const isAllowed = isSuperAdmin || hasPermission(requiredPermission);

  if (!isAllowed) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="glass-panel p-8 rounded-3xl max-w-md w-full text-center border border-rose-500/30 shadow-2xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/10">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">TRUY CẬP BỊ TỪ CHỐI (403)</h2>
            <p className="text-rose-400 text-xs font-bold mt-1">Bạn không có quyền truy cập trang này!</p>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
            Yêu cầu mã quyền: <code className="text-amber-400 font-mono font-bold">{requiredPermission}</code>
          </p>
          <div className="pt-2">
            <Link
              to="/admin"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
