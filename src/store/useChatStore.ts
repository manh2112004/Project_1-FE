import { create } from 'zustand';
import { chatService } from '../services/chatService';
import { socketService } from '../services/socketService';
import { useToastStore } from './useToastStore';
import { useAuthStore } from './useAuthStore';
import type { Conversation, Message, MessageType, Product } from '../types';

interface ChatStore {
  isOpen: boolean;
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  isSending: boolean;
  pendingProductCard: Product | null;
  socketConnected: boolean;
  isTyping: boolean;
  typingUserId: string | null;

  // Actions
  toggleChat: (open?: boolean) => void;
  initializeSocket: (token: string) => void;
  disconnectSocket: () => void;
  openChatWithStore: (storeId: string, initialProduct?: Product) => Promise<void>;
  fetchMyConversations: (storeId?: string) => Promise<void>;
  selectConversation: (conversation: Conversation | null) => Promise<void>;
  fetchMessages: (conversationId: string) => Promise<void>;
  sendMessage: (content: string, type?: MessageType, metadata?: any, attachments?: any[]) => Promise<boolean>;
  recallMessage: (messageId: string) => Promise<boolean>;
  sendTypingStatus: (isTyping: boolean) => void;
  markConversationAsRead: (conversationId: string) => void;
  setPendingProductCard: (product: Product | null) => void;
}

let typingTimeout: ReturnType<typeof setTimeout> | null = null;

export const useChatStore = create<ChatStore>((set, get) => ({
  isOpen: false,
  conversations: [],
  activeConversation: null,
  messages: [],
  isLoadingConversations: false,
  isLoadingMessages: false,
  isSending: false,
  pendingProductCard: null,
  socketConnected: false,
  isTyping: false,
  typingUserId: null,

  toggleChat: (open) => {
    set((state) => ({ isOpen: open !== undefined ? open : !state.isOpen }));
  },

  setPendingProductCard: (product) => {
    set({ pendingProductCard: product });
  },

  // Khởi tạo kết nối Socket.IO & Đăng ký sự kiện Realtime
  initializeSocket: (token: string) => {
    if (!token) return;

    const socket = socketService.connect(token);

    // Cập nhật ngay lập tức nếu socket đã ở trạng thái connected từ trước
    if (socket.connected) {
      set({ socketConnected: true });
      const currentActive = get().activeConversation;
      if (currentActive) {
        socketService.joinRoom(currentActive.id);
        socketService.markAsRead(currentActive.id);
      }
    }

    socket.off('connect');
    socket.on('connect', () => {
      console.log('⚡ Socket connected status updated in Zustand store');
      set({ socketConnected: true });
      const currentActive = get().activeConversation;
      if (currentActive) {
        socketService.joinRoom(currentActive.id);
        socketService.markAsRead(currentActive.id);
      }
    });

    socket.off('connect_error');
    socket.on('connect_error', (err) => {
      console.warn('⚠️ Socket connection error:', err.message);
      set({ socketConnected: false });
    });

    socket.off('disconnect');
    socket.on('disconnect', () => {
      set({ socketConnected: false });
    });

    // Lắng nghe tin nhắn mới từ WebSocket Server (sự kiện BE 'chat:new_message')
    socketService.onNewMessage((newMsg: Message) => {
      const { activeConversation, isOpen, messages, conversations } = get();
      const currentUserId = useAuthStore.getState().user?.id;
      const isFromMe = newMsg.senderId === currentUserId;
      const isCurrentActiveRoom = activeConversation && activeConversation.id === newMsg.conversationId && isOpen;

      // 1. Cập nhật tin nhắn trong khung chat active
      if (isCurrentActiveRoom) {
        const exists = messages.some((m) => m.id === newMsg.id);
        if (!exists) {
          set({
            messages: [...messages, newMsg],
            isTyping: false,
          });
        }
        // Gửi báo hiệu đã đọc tin nhắn cho đối phương nếu tin nhắn từ người khác
        if (!isFromMe) {
          socketService.markAsRead(activeConversation.id);
        }
      } else {
        // Thông báo nếu nhận được tin nhắn phòng khác hoặc đang đóng ChatBox (chỉ khi từ đối phương)
        if (!isFromMe && (!isOpen || activeConversation?.id !== newMsg.conversationId)) {
          useToastStore.getState().addToast({
            title: 'Tin nhắn mới',
            message: newMsg.content || 'Bạn nhận được tin nhắn mới',
            type: 'info',
          });
        }
      }

      // 2. Cập nhật lại danh sách cuộc trò chuyện (lastMessageContent, lastMessageAt, hasUnread)
      const targetConvIndex = conversations.findIndex((c) => c.id === newMsg.conversationId);
      const newHasUnread = !isFromMe && !isCurrentActiveRoom;

      if (targetConvIndex !== -1) {
        const updatedConversations = [...conversations];
        updatedConversations[targetConvIndex] = {
          ...updatedConversations[targetConvIndex],
          lastMessageContent: newMsg.content,
          lastMessageAt: newMsg.createdAt,
          hasUnread: newHasUnread,
        };
        // Đưa cuộc trò chuyện lên đầu danh sách
        const [moved] = updatedConversations.splice(targetConvIndex, 1);
        updatedConversations.unshift(moved);
        set({ conversations: updatedConversations });
      } else {
        // Nếu cuộc trò chuyện mới chưa có trong danh sách -> fetch lại
        get().fetchMyConversations();
      }
    });

    // Lắng nghe tín hiệu gõ phím của đối phương (sự kiện BE 'chat:user_typing')
    socketService.onUserTyping(({ userId, isTyping }) => {
      const { activeConversation } = get();
      if (!activeConversation) return;

      if (isTyping) {
        set({ isTyping: true, typingUserId: userId });
        if (typingTimeout) clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
          set({ isTyping: false, typingUserId: null });
        }, 4000);
      } else {
        if (typingTimeout) clearTimeout(typingTimeout);
        set({ isTyping: false, typingUserId: null });
      }
    });

    // Lắng nghe tín hiệu đối phương đã đọc tin nhắn (sự kiện BE 'chat:messages_read')
    socketService.onMessagesRead(({ conversationId, readByUserId, readAt }) => {
      const { activeConversation, messages } = get();
      if (activeConversation && conversationId === activeConversation.id) {
        set({
          messages: messages.map((m) =>
            m.senderId !== readByUserId
              ? { ...m, isRead: true, readAt: readAt || new Date().toISOString() }
              : m
          ),
        });
      }
    });
  },

  // Ngắt kết nối socket
  disconnectSocket: () => {
    socketService.offChatEvents();
    socketService.disconnect();
    set({ socketConnected: false, isTyping: false, typingUserId: null });
  },

  openChatWithStore: async (storeId: string, initialProduct?: Product) => {
    try {
      set({ isOpen: true, isLoadingMessages: true });
      if (initialProduct) {
        set({ pendingProductCard: initialProduct });
      }

      const res = await chatService.createOrGetConversation(storeId);
      if (res.success && res.data) {
        const conversation = res.data;
        await get().selectConversation(conversation);
        await get().fetchMyConversations();
      }
    } catch (err: any) {
      console.error('Lỗi khi mở cuộc trò chuyện:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Lỗi tạo cuộc trò chuyện.';
      useToastStore.getState().addToast({
        title: errorMsg,
        type: 'error',
      });
    } finally {
      set({ isLoadingMessages: false });
    }
  },

  fetchMyConversations: async (storeId?: string) => {
    try {
      set({ isLoadingConversations: true });
      const res = await chatService.getMyConversations(storeId);
      if (res.success && res.data) {
        set({ conversations: res.data });
      }
    } catch (err) {
      console.error('Lỗi lấy danh sách cuộc trò chuyện:', err);
    } finally {
      set({ isLoadingConversations: false });
    }
  },

  selectConversation: async (conversation: Conversation | null) => {
    const currentActive = get().activeConversation;
    if (currentActive) {
      socketService.leaveRoom(currentActive.id);
    }

    if (conversation) {
      // Đánh dấu đã đọc trong state local
      const conversations = get().conversations;
      const updatedConversations = conversations.map((c) =>
        c.id === conversation.id ? { ...c, hasUnread: false } : c
      );

      set({
        activeConversation: { ...conversation, hasUnread: false },
        conversations: updatedConversations,
        isTyping: false,
        typingUserId: null,
      });

      // Tham gia room Socket mới ở BE ('chat:join_room') và phát tín hiệu đã đọc
      socketService.joinRoom(conversation.id);
      socketService.markAsRead(conversation.id);
      await get().fetchMessages(conversation.id);
    } else {
      set({ activeConversation: null, isTyping: false, typingUserId: null });
    }
  },

  markConversationAsRead: (conversationId: string) => {
    socketService.markAsRead(conversationId);
  },

  fetchMessages: async (conversationId: string) => {
    try {
      set({ isLoadingMessages: true });
      const res = await chatService.getMessages(conversationId);
      if (res.success && res.data) {
        set({ messages: res.data });
      }
    } catch (err) {
      console.error('Lỗi lấy tin nhắn:', err);
    } finally {
      set({ isLoadingMessages: false });
    }
  },

  sendMessage: async (content: string, type: MessageType = 'TEXT', metadata?: any, attachments?: any[]) => {
    const { activeConversation, isSending } = get();
    if (!activeConversation || isSending || (!content.trim() && (!attachments || attachments.length === 0))) return false;

    try {
      set({ isSending: true });

      // Tắt trạng thái gõ phím ngay khi gửi
      socketService.sendTyping(activeConversation.id, false);

      const res = await chatService.sendMessage({
        conversationId: activeConversation.id,
        content: content.trim() || '[Hình ảnh]',
        type,
        metadata,
        attachments,
      });

      if (res.success && res.data) {
        const newMsg = res.data;
        const currentMessages = get().messages;
        const exists = currentMessages.some((m) => m.id === newMsg.id);

        if (!exists) {
          set({
            messages: [...currentMessages, newMsg],
            pendingProductCard: null,
          });
        }

        // Cập nhật ngay lập tức đoạn tin nhắn preview (lastMessageContent) trong danh sách cuộc trò chuyện
        const { conversations } = get();
        const targetIndex = conversations.findIndex((c) => c.id === activeConversation.id);
        if (targetIndex !== -1) {
          const updatedConversations = [...conversations];
          updatedConversations[targetIndex] = {
            ...updatedConversations[targetIndex],
            lastMessageContent: newMsg.content,
            lastMessageAt: newMsg.createdAt,
            hasUnread: false,
          };
          const [moved] = updatedConversations.splice(targetIndex, 1);
          updatedConversations.unshift(moved);
          set({ conversations: updatedConversations });
        } else {
          get().fetchMyConversations();
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error('Gửi tin nhắn thất bại:', err);
      return false;
    } finally {
      set({ isSending: false });
    }
  },

  sendTypingStatus: (isTyping: boolean) => {
    const { activeConversation } = get();
    if (activeConversation) {
      socketService.sendTyping(activeConversation.id, isTyping);
    }
  },

  recallMessage: async (messageId: string) => {
    try {
      const res = await chatService.recallMessage(messageId);
      if (res.success && res.data) {
        const updatedMsg = res.data;
        set((state) => ({
          messages: state.messages.map((m) => (m.id === messageId ? updatedMsg : m)),
        }));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Thu hồi tin nhắn thất bại:', err);
      return false;
    }
  },
}));
