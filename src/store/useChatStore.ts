import { create } from 'zustand';
import { chatService } from '../services/chatService';
import { useToastStore } from './useToastStore';
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

  // Actions
  toggleChat: (open?: boolean) => void;
  openChatWithStore: (storeId: string, initialProduct?: Product) => Promise<void>;
  fetchMyConversations: (storeId?: string) => Promise<void>;
  selectConversation: (conversation: Conversation) => Promise<void>;
  fetchMessages: (conversationId: string) => Promise<void>;
  sendMessage: (content: string, type?: MessageType, metadata?: any) => Promise<boolean>;
  recallMessage: (messageId: string) => Promise<boolean>;
  setPendingProductCard: (product: Product | null) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  isOpen: false,
  conversations: [],
  activeConversation: null,
  messages: [],
  isLoadingConversations: false,
  isLoadingMessages: false,
  isSending: false,
  pendingProductCard: null,

  toggleChat: (open) => {
    set((state) => ({ isOpen: open !== undefined ? open : !state.isOpen }));
  },

  setPendingProductCard: (product) => {
    set({ pendingProductCard: product });
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
        set({ activeConversation: conversation });
        await get().fetchMessages(conversation.id);
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

  selectConversation: async (conversation: Conversation) => {
    set({ activeConversation: conversation });
    await get().fetchMessages(conversation.id);
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

  sendMessage: async (content: string, type: MessageType = 'TEXT', metadata?: any) => {
    const { activeConversation, isSending } = get();
    if (!activeConversation || isSending || !content.trim()) return false;

    try {
      set({ isSending: true });
      const res = await chatService.sendMessage({
        conversationId: activeConversation.id,
        content: content.trim(),
        type,
        metadata,
      });

      if (res.success && res.data) {
        const newMsg = res.data;
        set((state) => ({
          messages: [...state.messages, newMsg],
          pendingProductCard: null,
        }));
        // Cập nhật lại danh sách cuộc trò chuyện để có lastMessageContent
        get().fetchMyConversations();
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
