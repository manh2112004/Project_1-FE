import { io, Socket } from 'socket.io-client';
import type { Message } from '../types';

let socket: Socket | null = null;

export const getSocketUrl = (): string => {
  const customUrl = import.meta.env.VITE_SOCKET_URL;
  if (customUrl) return customUrl;

  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl && apiUrl.startsWith('http')) {
    return apiUrl.replace(/\/api\/?$/, '');
  }

  // Kết nối tới Backend host (mặc định Port 3000)
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    if (origin.includes(':3001') || origin.includes(':5173') || origin.includes(':3000')) {
      return 'http://localhost:3000';
    }
    return origin;
  }
  return 'http://localhost:3000';
};

export const socketService = {
  // Khởi tạo và kết nối Socket.IO với Bearer Token
  connect(token: string): Socket {
    if (socket && socket.connected) {
      return socket;
    }

    // Nếu đã tồn tại socket instance nhưng bị disconnect, kết nối lại
    if (socket) {
      socket.auth = { token: token.startsWith('Bearer ') ? token : `Bearer ${token}` };
      socket.connect();
      return socket;
    }

    const socketUrl = getSocketUrl();
    const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;

    socket = io(socketUrl, {
      auth: {
        token: formattedToken,
      },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('✅ Socket.IO đã kết nối thành công:', socket?.id);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Lỗi kết nối Socket.IO:', error.message);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket.IO đã ngắt kết nối:', reason);
    });

    return socket;
  },

  // Ngắt kết nối Socket
  disconnect() {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  // Lấy Socket instance hiện tại
  getSocket(): Socket | null {
    return socket;
  },

  // Tham gia vào phòng chat cụ thể (Conversation Room)
  joinRoom(conversationId: string) {
    if (socket && socket.connected) {
      socket.emit('chat:join_room', conversationId);
    }
  },

  // Rời khỏi phòng chat cụ thể
  leaveRoom(conversationId: string) {
    if (socket && socket.connected) {
      socket.emit('chat:leave_room', conversationId);
    }
  },

  // Báo hiệu trạng thái đang gõ phím / ngừng gõ
  sendTyping(conversationId: string, isTyping: boolean) {
    if (socket && socket.connected) {
      socket.emit('chat:typing', { conversationId, isTyping });
    }
  },

  // Đăng ký nhận tin nhắn mới từ BE (sự kiện 'chat:new_message')
  onNewMessage(callback: (message: Message) => void) {
    if (socket) {
      socket.off('chat:new_message'); // Đảm bảo không bị trùng lặp listener
      socket.on('chat:new_message', callback);
    }
  },

  // Đăng ký nhận trạng thái gõ phím từ BE (sự kiện 'chat:user_typing')
  onUserTyping(callback: (data: { userId: string; isTyping: boolean }) => void) {
    if (socket) {
      socket.off('chat:user_typing');
      socket.on('chat:user_typing', callback);
    }
  },

  // Hủy lắng nghe các sự kiện chat
  offChatEvents() {
    if (socket) {
      socket.off('chat:new_message');
      socket.off('chat:user_typing');
    }
  },
};
