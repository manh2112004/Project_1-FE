import axios from 'axios';
import { useToastStore } from '../store/useToastStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Gắn Bearer Access Token vào Header
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: Tự động gọi Refresh Token khi bị 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthRequest = originalRequest?.url?.includes('/auth/');
    const isLoginPage = window.location.pathname.includes('/login');

    // Nếu tài khoản bị khóa khi đang duyệt các trang ứng dụng (không phải đang tại form login)
    if (!isAuthRequest && !isLoginPage && error.response?.status === 403 && error.response?.data?.message?.includes('bị khóa')) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_info');
      useToastStore.getState().addToast({
        type: 'error',
        title: 'Tài khoản đã bị khóa',
        message: error.response.data.message || 'Tài khoản của bạn đã bị khóa bởi Quản trị viên.',
        duration: 5000,
      });
      setTimeout(() => {
        window.location.href = '/login';
      }, 5000);
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('Không có refresh token');
        }

        const res = await axios.post('/api/auth/refresh-token', { refreshToken });
        if (res.data?.success && res.data?.data?.accessToken) {
          const newAccessToken = res.data.data.accessToken;
          localStorage.setItem('access_token', newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }
      } catch (refreshErr) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_info');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
