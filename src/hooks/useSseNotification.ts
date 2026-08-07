import { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';

export const useSseNotification = () => {
  const { accessToken, isAuthenticated, logout } = useAuthStore();
  const { addToast } = useToastStore();

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    const sseUrl = `${import.meta.env.VITE_API_URL || '/api'}/users/sse?token=${accessToken}`;
    const eventSource = new EventSource(sseUrl);

    // 1. Sự kiện cập nhật Đơn Hàng (order:updated)
    eventSource.addEventListener('order:updated', (event) => {
      try {
        const data = JSON.parse(event.data);
        addToast({
          type: 'info',
          title: 'Cập nhật Đơn hàng Realtime',
          message: data.message || 'Trạng thái đơn hàng của bạn đã có thay đổi mới.',
        });

        // Bắn Custom Event cho toàn bộ FE lắng nghe và làm mới giao diện lập tức
        window.dispatchEvent(new CustomEvent('sse:order_updated', { detail: data }));
      } catch (err) {
        console.error('Lỗi parse SSE order:updated', err);
      }
    });

    // 2. Sự kiện Đơn hàng mới khởi tạo (order:created)
    eventSource.addEventListener('order:created', (event) => {
      try {
        const data = JSON.parse(event.data);
        addToast({
          type: 'success',
          title: 'Đơn hàng mới!',
          message: data.message || 'Hệ thống nhận được một đơn hàng mới.',
        });

        window.dispatchEvent(new CustomEvent('sse:order_created', { detail: data }));
      } catch (err) {
        console.error('Lỗi parse SSE order:created', err);
      }
    });

    // 3. Sự kiện Sản phẩm mới (product:created)
    eventSource.addEventListener('product:created', (event) => {
      try {
        const product = JSON.parse(event.data);
        addToast({
          type: 'info',
          title: 'Sản phẩm mới ra mắt!',
          message: `${product.name} vừa được thêm vào cửa hàng.`,
        });
      } catch (err) {
        console.error('Lỗi parse SSE product:created', err);
      }
    });

    // 4. Sự kiện Tài khoản bị khóa (user:blocked)
    eventSource.addEventListener('user:blocked', (event) => {
      try {
        const data = JSON.parse(event.data);
        addToast({
          type: 'error',
          title: 'Tài khoản đã bị khóa',
          message: data.message || 'Tài khoản của bạn đã bị Quản trị viên khóa!',
          duration: 5000,
        });
        logout();
        setTimeout(() => {
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
        }, 5000);
      } catch (err) {
        console.error('Lỗi parse SSE user:blocked', err);
      }
    });

    eventSource.onerror = (error) => {
      console.warn('Lỗi kết nối SSE Server-Sent Events:', error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [accessToken, isAuthenticated, addToast, logout]);
};
