import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from './components/common/ToastContainer';

// Layouts
import { ClientLayout } from './components/layout/ClientLayout';
import { AdminLayout } from './components/layout/AdminLayout';

// Guards
import { AuthGuard } from './components/auth/AuthGuard';
import { RoleGuard } from './components/auth/RoleGuard';
import { PermissionGuard } from './components/auth/PermissionGuard';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { AdminLoginPage } from './pages/auth/AdminLoginPage';

// Client Pages
import { HomePage } from './pages/client/HomePage';
import { ProductsPage } from './pages/client/ProductsPage';
import { ProductDetailPage } from './pages/client/ProductDetailPage';
import { CartPage } from './pages/client/CartPage';
import { CheckoutPage } from './pages/client/CheckoutPage';
import { OrdersPage } from './pages/client/OrdersPage';
import { ProfilePage } from './pages/client/ProfilePage';
import { AddressesPage } from './pages/client/AddressesPage';

// Admin Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminProductsPage } from './pages/admin/AdminProductsPage';
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage';
import { AdminCategoriesPage } from './pages/admin/AdminCategoriesPage';
import { AdminBrandsPage } from './pages/admin/AdminBrandsPage';
import { AdminInventoryPage } from './pages/admin/AdminInventoryPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminRolesPage } from './pages/admin/AdminRolesPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Client Storefront Routes */}
          <Route path="/" element={<ClientLayout />}>
            <Route index element={<HomePage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="products/:id" element={<ProductDetailPage />} />
            <Route path="cart" element={<CartPage />} />

            {/* Authenticated Client Routes */}
            <Route
              path="checkout"
              element={
                <AuthGuard>
                  <CheckoutPage />
                </AuthGuard>
              }
            />
            <Route
              path="orders"
              element={
                <AuthGuard>
                  <OrdersPage />
                </AuthGuard>
              }
            />
            <Route
              path="profile"
              element={
                <AuthGuard>
                  <ProfilePage />
                </AuthGuard>
              }
            />
            <Route
              path="addresses"
              element={
                <AuthGuard>
                  <AddressesPage />
                </AuthGuard>
              }
            />
          </Route>

          {/* Admin Portal Protected Routes */}
          <Route
            path="/admin"
            element={
              <RoleGuard disallowedRoles={['CUSTOMER']}>
                <AdminLayout />
              </RoleGuard>
            }
          >
            <Route index element={<AdminDashboardPage />} />
            <Route
              path="products"
              element={
                <PermissionGuard requiredPermission="READ_PRODUCT">
                  <AdminProductsPage />
                </PermissionGuard>
              }
            />
            <Route
              path="orders"
              element={
                <PermissionGuard requiredPermission="READ_ORDER">
                  <AdminOrdersPage />
                </PermissionGuard>
              }
            />
            <Route
              path="categories"
              element={
                <PermissionGuard requiredPermission="READ_CATEGORY">
                  <AdminCategoriesPage />
                </PermissionGuard>
              }
            />
            <Route
              path="brands"
              element={
                <PermissionGuard requiredPermission="READ_BRAND">
                  <AdminBrandsPage />
                </PermissionGuard>
              }
            />
            <Route
              path="inventories"
              element={
                <PermissionGuard requiredPermission="READ_INVENTORY">
                  <AdminInventoryPage />
                </PermissionGuard>
              }
            />
            <Route
              path="users"
              element={
                <PermissionGuard requiredPermission="READ_USER">
                  <AdminUsersPage />
                </PermissionGuard>
              }
            />
            <Route
              path="roles"
              element={
                <PermissionGuard requiredPermission="READ_ROLE">
                  <AdminRolesPage />
                </PermissionGuard>
              }
            />
          </Route>
        </Routes>
      </Router>

      {/* Global Toast Container */}
      <ToastContainer />
    </QueryClientProvider>
  );
};

export default App;
