import axios from 'axios';
import { useToastStore } from '../store/useToastStore';
import { useAuthStore } from '../store/useAuthStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Cơ chế Hàng đợi (Queue) để xử lý các request đồng thời khi Token hết hạn
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

// Request Interceptor: Gắn Bearer Access Token vào Header
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: Tự động gọi Refresh Token khi gặp lỗi 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthRequest = originalRequest?.url?.includes('/auth/');
    const isLoginPage = window.location.pathname.includes('/login');

    // 1. Tự động đăng xuất nếu tài khoản bị Quản trị viên khóa
    if (
      !isAuthRequest &&
      !isLoginPage &&
      error.response?.status === 403 &&
      error.response?.data?.message?.includes('bị khóa')
    ) {
      useAuthStore.getState().logout();
      useToastStore.getState().addToast({
        type: 'error',
        title: 'Tài khoản đã bị khóa',
        message: error.response.data.message || 'Tài khoản của bạn đã bị khóa bởi Quản trị viên.',
        duration: 5000,
      });
      setTimeout(() => {
        window.location.href = '/login';
      }, 3000);
      return Promise.reject(error);
    }

    // 2. Xử lý 401 Unauthorized -> Tự động gia hạn (Refresh Token)
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRequest) {
      if (isRefreshing) {
        // Nếu đã có 1 request đang thực hiện Refresh Token -> Xếp hàng đợi
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            },
            reject: (err: any) => {
              reject(err);
            },
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('Không tìm thấy Refresh Token trong bộ nhớ.');
        }

        // Gọi API Refresh Token chuẩn hóa đường dẫn
        const refreshUrl = `${API_BASE_URL.replace(/\/+$/, '')}/auth/refresh-token`;
        const res = await axios.post(refreshUrl, { refreshToken });

        if (res.data?.success && res.data?.data?.accessToken) {
          const { accessToken: newAccessToken, refreshToken: newRefreshToken } = res.data.data;

          // Cập nhật CẢ Access Token lẫn Refresh Token mới (Refresh Token Rotation)
          localStorage.setItem('access_token', newAccessToken);
          if (newRefreshToken) {
            localStorage.setItem('refresh_token', newRefreshToken);
          }

          // Đồng bộ lại Zustand Auth State
          const authState = useAuthStore.getState();
          if (authState.user) {
            useAuthStore.setState({
              accessToken: newAccessToken,
              refreshToken: newRefreshToken || authState.refreshToken,
            });
          }

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          processQueue(null, newAccessToken);
          isRefreshing = false;

          return api(originalRequest);
        } else {
          throw new Error(res.data?.message || 'Gia hạn Token thất bại.');
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        isRefreshing = false;

        // Xóa thông tin đăng nhập và chuyển hướng về màn hình Đăng nhập nếu Refresh Token thất bại
        useAuthStore.getState().logout();
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
