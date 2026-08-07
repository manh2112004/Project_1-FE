import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  disallowedRoles?: string[];
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ children, allowedRoles, disallowedRoles }) => {
  const { isAuthenticated, user, hasRole } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  const roleCode = user?.roleCode || '';

  if (disallowedRoles && disallowedRoles.includes(roleCode)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
        <div className="glass-card p-8 rounded-2xl max-w-md text-center border border-rose-500/20 shadow-2xl">
          <h2 className="text-2xl font-bold text-rose-400 mb-2">Truy cập bị từ chối (403)</h2>
          <p className="text-slate-300 text-sm mb-6">
            Tài khoản Khách hàng (CUSTOMER) không có quyền truy cập phân hệ Quản trị.
          </p>
          <a
            href="/"
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all"
          >
            Quay lại trang chủ
          </a>
        </div>
      </div>
    );
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
        <div className="glass-card p-8 rounded-2xl max-w-md text-center border border-rose-500/20 shadow-2xl">
          <h2 className="text-2xl font-bold text-rose-400 mb-2">Truy cập bị từ chối (403)</h2>
          <p className="text-slate-300 text-sm mb-6">
            Tài khoản của bạn không có quyền hạn cần thiết để truy cập trang này.
          </p>
          <a
            href="/"
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all"
          >
            Quay lại trang chủ
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
