import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Layers,
  Award,
  Boxes,
  Users,
  ShieldCheck,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';

export const AdminSidebar: React.FC = () => {
  const { user, hasPermission } = useAuthStore();
  const isSuperAdmin = user?.email === 'admin@system.com' || user?.roleCode === 'SUPER_ADMIN';

  const menuItems = [
    { title: 'Dashboard', path: '/admin', icon: LayoutDashboard, permission: null },
    { title: 'Quản lý Đơn hàng', path: '/admin/orders', icon: ShoppingBag, permission: 'READ_ORDER' },
    { title: 'Quản lý Sản phẩm', path: '/admin/products', icon: Package, permission: 'READ_PRODUCT' },
    { title: 'Quản lý Danh mục', path: '/admin/categories', icon: Layers, permission: 'READ_CATEGORY' },
    { title: 'Thương hiệu', path: '/admin/brands', icon: Award, permission: 'READ_BRAND' },
    { title: 'Quản lý Tồn kho', path: '/admin/inventories', icon: Boxes, permission: 'READ_INVENTORY' },
    { title: 'Người dùng', path: '/admin/users', icon: Users, permission: 'READ_USER' },
    { title: 'Vai trò & Quyền', path: '/admin/roles', icon: ShieldCheck, permission: 'READ_ROLE' },
  ].filter((item) => !item.permission || isSuperAdmin || hasPermission(item.permission));

  return (
    <aside className="w-64 bg-slate-900/90 border-r border-slate-800 flex flex-col justify-between h-screen sticky top-0 shrink-0">
      <div>
        {/* Brand Header */}
        <div className="h-20 flex items-center gap-3 px-6 border-b border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-white text-base tracking-tight">NEX ADMIN</h1>
            <p className="text-[10px] text-indigo-400 font-semibold tracking-wider uppercase">Project 1 Control</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span>{item.title}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Back to Client Storefront */}
      <div className="p-4 border-t border-slate-800">
        <NavLink
          to="/"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Về Cửa Hàng</span>
        </NavLink>
      </div>
    </aside>
  );
};
