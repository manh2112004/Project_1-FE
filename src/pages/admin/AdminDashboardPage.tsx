import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Package, ShoppingBag, Users, TrendingUp, Sparkles, ArrowUpRight, Layers, Award } from 'lucide-react';
import type { Order } from '../../types';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

export const AdminDashboardPage: React.FC = () => {
  const { user, hasPermission } = useAuthStore();
  const isSuperAdmin = user?.email === 'admin@system.com' || user?.roleCode === 'SUPER_ADMIN';

  const canReadOrders = isSuperAdmin || hasPermission('READ_ORDER');
  const canReadProducts = isSuperAdmin || hasPermission('READ_PRODUCT');
  const canReadCategories = isSuperAdmin || hasPermission('READ_CATEGORY');
  const canReadBrands = isSuperAdmin || hasPermission('READ_BRAND');
  const canReadUsers = isSuperAdmin || hasPermission('READ_USER');

  const [totalOrders, setTotalOrders] = useState<number>(0);
  const [totalProducts, setTotalProducts] = useState<number>(0);
  const [totalCategories, setTotalCategories] = useState<number>(0);
  const [totalBrands, setTotalBrands] = useState<number>(0);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (canReadOrders) {
        try {
          const orderRes = await api.get('/orders?page=1&limit=5');
          if (orderRes.data?.success) {
            const data = orderRes.data.data;
            const orderList = Array.isArray(data) ? data : data?.orders || data?.items || [];
            setRecentOrders(orderList);
            setTotalOrders(data?.meta?.totalCount ?? data?.meta?.total ?? orderList.length);
          }
        } catch (err) {
          console.error('Lỗi lấy thống kê Đơn hàng:', err);
        }
      }

      if (canReadProducts) {
        try {
          const prodRes = await api.get('/products/paginated?page=1&limit=1');
          if (prodRes.data?.success) {
            const data = prodRes.data.data;
            const prodList = Array.isArray(data) ? data : data?.products || data?.items || [];
            setTotalProducts(data?.meta?.totalCount ?? data?.meta?.total ?? prodList.length);
          }
        } catch (err) {
          console.error('Lỗi lấy thống kê Sản phẩm:', err);
        }
      }

      if (canReadCategories) {
        try {
          const catRes = await api.get('/categories/paginated?page=1&limit=1');
          if (catRes.data?.success) {
            const data = catRes.data.data;
            const catList = Array.isArray(data) ? data : data?.categories || data?.items || [];
            setTotalCategories(data?.meta?.totalCount ?? data?.meta?.total ?? catList.length);
          }
        } catch (err) {
          console.error('Lỗi lấy thống kê Danh mục:', err);
        }
      }

      if (canReadBrands) {
        try {
          const brandRes = await api.get('/brands/paginated?page=1&limit=1');
          if (brandRes.data?.success) {
            const data = brandRes.data.data;
            const brandList = Array.isArray(data) ? data : data?.brands || data?.items || [];
            setTotalBrands(data?.meta?.totalCount ?? data?.meta?.total ?? brandList.length);
          }
        } catch (err) {
          console.error('Lỗi lấy thống kê Thương hiệu:', err);
        }
      }

      if (canReadUsers) {
        try {
          const userRes = await api.get('/users/paginated?page=1&limit=1');
          if (userRes.data?.success) {
            const data = userRes.data.data;
            const userList = Array.isArray(data) ? data : data?.users || data?.items || [];
            setTotalUsers(data?.meta?.totalCount ?? data?.meta?.total ?? userList.length);
          }
        } catch (err) {
          console.error('Lỗi lấy thống kê Người dùng:', err);
        }
      }
    };

    fetchDashboardStats();
  }, [canReadOrders, canReadProducts, canReadCategories, canReadBrands, canReadUsers]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Tổng Quan Hệ Thống</h1>
        <p className="text-xs text-slate-400 mt-1">
          Xin chào <strong className="text-indigo-400">{user?.fullName}</strong> ({user?.roleCode}) - Báo cáo chỉ số theo quyền hạn tài khoản
        </p>
      </div>

      {/* Metrics Cards Grid - Filtered by Permissions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {canReadOrders && (
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> Direct API
              </span>
            </div>
            <div>
              <p className="text-xs text-slate-400">Tổng Đơn Hàng</p>
              <h3 className="text-2xl font-black text-white mt-1">{totalOrders}</h3>
            </div>
          </div>
        )}

        {canReadProducts && (
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-2xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
                <Package className="w-6 h-6" />
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-400">Tổng Sản Phẩm</p>
              <h3 className="text-2xl font-black text-white mt-1">{totalProducts}</h3>
            </div>
          </div>
        )}

        {canReadCategories && (
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Layers className="w-6 h-6" />
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-400">Danh Mục Sản Phẩm</p>
              <h3 className="text-2xl font-black text-white mt-1">{totalCategories}</h3>
            </div>
          </div>
        )}

        {canReadBrands && (
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Award className="w-6 h-6" />
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-400">Thương Hiệu Đối Tác</p>
              <h3 className="text-2xl font-black text-white mt-1">{totalBrands}</h3>
            </div>
          </div>
        )}

        {canReadUsers && (
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Users className="w-6 h-6" />
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-400">Khách Hàng & User</p>
              <h3 className="text-2xl font-black text-white mt-1">{totalUsers}</h3>
            </div>
          </div>
        )}

        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Sparkles className="w-6 h-6" />
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-400">Realtime Engine</p>
            <h3 className="text-sm font-bold text-emerald-400 mt-2">SSE Active</h3>
          </div>
        </div>
      </div>

      {/* Recent Orders Section (Only shown if user has READ_ORDER permission) */}
      {canReadOrders && (
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Đơn Hàng Mới Nhất</h3>
            <Link to="/admin/orders" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              Quản lý đơn hàng <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">Chưa có đơn hàng nào.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 text-slate-400 uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">Mã Đơn</th>
                    <th className="py-3 px-4">Người Nhận</th>
                    <th className="py-3 px-4">Tổng Tiền</th>
                    <th className="py-3 px-4">Trạng Thái</th>
                    <th className="py-3 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-900/40">
                      <td className="py-3 px-4 font-bold text-white">{order.orderCode}</td>
                      <td className="py-3 px-4 text-slate-300">
                        {order.recipientName} ({order.phoneNumber})
                      </td>
                      <td className="py-3 px-4 font-extrabold text-emerald-400">
                        {order.finalAmount?.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-indigo-500/20 text-indigo-400">
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          to="/admin/orders"
                          className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                        >
                          Chi tiết
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
