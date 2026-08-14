import api from './api';
import type { ApiResponse, Conversation, Message, MessageType, SenderType } from '../types';

export const chatService = {
  // 1. Tạo hoặc lấy phòng chat giữa Khách & Shop
  async createOrGetConversation(storeId: string) {
    const res = await api.post<ApiResponse<Conversation>>('/chat/conversations', { storeId });
    return res.data;
  },

  // 2. Lấy danh sách các cuộc trò chuyện của User / Shop
  async getMyConversations(storeId?: string) {
    const res = await api.get<ApiResponse<Conversation[]>>('/chat/conversations', {
      params: { storeId },
    });
    return res.data;
  },

  // 3. Gửi tin nhắn mới
  async sendMessage(payload: {
    conversationId: string;
    content: string;
    senderType?: SenderType;
    type?: MessageType;
    attachments?: any[];
    metadata?: any;
  }) {
    const res = await api.post<ApiResponse<Message>>('/chat/messages', payload);
    return res.data;
  },

  // 4. Lấy lịch sử tin nhắn của một cuộc trò chuyện
  async getMessages(conversationId: string, limit: number = 30, before?: string) {
    const res = await api.get<ApiResponse<Message[]>>(`/chat/conversations/${conversationId}/messages`, {
      params: { limit, before },
    });
    return res.data;
  },

  // 5. Thu hồi tin nhắn
  async recallMessage(messageId: string) {
    const res = await api.patch<ApiResponse<Message>>(`/chat/messages/${messageId}/recall`);
    return res.data;
  },
};
