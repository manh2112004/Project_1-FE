import React, { useState, useEffect, useRef } from 'react';
import EmojiPicker, { EmojiStyle, Theme } from 'emoji-picker-react';
import type { EmojiClickData } from 'emoji-picker-react';
import { useChatStore } from '../../store/useChatStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import api from '../../services/api';
import type { MessageType } from '../../types';

// Hàm format thời gian chuẩn HH:mm
const formatTime = (dateString?: string | null) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Hàm format thời gian tương đối (vừa xong, 59 phút, 2 giờ, 3 ngày...)
const formatRelativeTime = (dateString?: string | null) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds <= 0 || diffInSeconds < 60) {
    return 'vừa xong';
  }
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} phút`;
  }
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} giờ`;
  }
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} ngày`;
  }
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
};

// Hàm format nhãn ngày phân đoạn cuộc trò chuyện (Hôm nay, Hôm qua, DD/MM/YYYY)
const formatDateLabel = (dateString?: string | null) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Hôm nay';
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Hôm qua';
  }
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export const ChatBox: React.FC = () => {
  const { user, accessToken, isAuthenticated } = useAuthStore();
  const { addToast } = useToastStore();
  const {
    isOpen,
    toggleChat,
    conversations,
    activeConversation,
    messages,
    isLoadingConversations,
    isLoadingMessages,
    isSending,
    pendingProductCard,
    socketConnected,
    isTyping,
    initializeSocket,
    disconnectSocket,
    sendTypingStatus,
    selectConversation,
    sendMessage,
    recallMessage,
    setPendingProductCard,
    fetchMyConversations,
  } = useChatStore();

  const [inputContent, setInputContent] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hàm tự động cuộn xuống cuối cùng tin nhắn mới nhất
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    requestAnimationFrame(() => {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' });
      }, 30);
    });
  };

  // 1. Khởi tạo kết nối Socket.IO khi User đã đăng nhập
  useEffect(() => {
    if (isAuthenticated && accessToken) {
      initializeSocket(accessToken);
    }
    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated, accessToken, initializeSocket, disconnectSocket]);

  // 2. Tự động cuộn xuống dưới cùng khi mở/chọn phòng chat và khi tải tin nhắn xong
  useEffect(() => {
    if (activeConversation && !isLoadingMessages) {
      scrollToBottom('auto');
    }
  }, [activeConversation, isLoadingMessages]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom('smooth');
    }
  }, [messages.length, isTyping, isUploadingImage]);

  // 3. Load danh sách conversation khi mở ChatBox
  useEffect(() => {
    if (isOpen && isAuthenticated) {
      fetchMyConversations();
    }
  }, [isOpen, isAuthenticated, fetchMyConversations]);

  if (!isAuthenticated) return null;

  // Xử lý sự kiện gõ phím (Realtime typing status)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputContent(e.target.value);
    if (activeConversation) {
      sendTypingStatus(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingStatus(false);
      }, 2500);
    }
  };

  // Thêm Emoji Google vào ô input
  const handleSelectEmoji = (emojiData: EmojiClickData) => {
    setInputContent((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  // Gửi tin nhắn chữ
  const handleSendText = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputContent.trim() || isSending) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    sendTypingStatus(false);
    setShowEmojiPicker(false);

    const content = inputContent;
    setInputContent('');
    await sendMessage(content);
    scrollToBottom('smooth');
  };

  // Tải ảnh lên và gửi tin nhắn dạng Image
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Kiểm tra định dạng và dung lượng file (< 5MB)
    if (!file.type.startsWith('image/')) {
      addToast({ type: 'error', title: 'Lỗi', message: 'Vui lòng chọn file hình ảnh (JPG, PNG, WebP...)' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      addToast({ type: 'error', title: 'Lỗi', message: 'Dung lượng ảnh tối đa là 5MB' });
      return;
    }

    try {
      setIsUploadingImage(true);
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const imageUrl = res.data?.url || res.data?.data?.url;
      if (imageUrl) {
        await sendMessage('[Hình ảnh]', 'IMAGE' as MessageType, { url: imageUrl }, [
          { type: 'IMAGE', url: imageUrl },
        ]);
        scrollToBottom('smooth');
      } else {
        throw new Error('Không nhận được URL ảnh từ server');
      }
    } catch (err: any) {
      console.error('Lỗi khi tải ảnh chat:', err);
      addToast({
        type: 'error',
        title: 'Tải ảnh thất bại',
        message: err.response?.data?.message || 'Không thể tải ảnh lên. Vui lòng thử lại.',
      });
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Gửi thẻ sản phẩm quan tâm
  const handleSendProductCard = async () => {
    if (!pendingProductCard || isSending) return;

    const content = `Sản phẩm quan tâm: ${pendingProductCard.name}`;
    const metadata = {
      productId: pendingProductCard.id,
      name: pendingProductCard.name,
      price: pendingProductCard.price,
      discountPrice: pendingProductCard.discountPrice,
      thumbnail: pendingProductCard.thumbnail,
    };

    await sendMessage(content, 'PRODUCT_CARD' as MessageType, metadata);
    setPendingProductCard(null);
    scrollToBottom('smooth');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Lightbox Xem Ảnh Phóng To */}
      {previewImageUrl && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewImageUrl(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] flex items-center justify-center">
            <img src={previewImageUrl} alt="Preview" className="max-w-full max-h-[85vh] rounded-xl object-contain shadow-2xl animate-in zoom-in-95 duration-200" />
            <button
              onClick={() => setPreviewImageUrl(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 font-bold text-xl bg-white/20 p-2 rounded-full backdrop-blur"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Nút Toggle Bật/Tắt Chat Widget */}
      {!isOpen && (
        <button
          onClick={() => toggleChat(true)}
          className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 focus:outline-none"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${socketConnected ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`}></span>
            <span className={`relative inline-flex rounded-full h-4 w-4 ${socketConnected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
          </span>
        </button>
      )}

      {/* Cửa sổ Khung Chat (Chat Modal) */}
      {isOpen && (
        <div className="w-[360px] sm:w-[400px] h-[540px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              {activeConversation && (
                <button
                  onClick={() => {
                    selectConversation(null);
                    setShowEmojiPicker(false);
                  }}
                  className="p-1 hover:bg-white/10 rounded-full transition-colors"
                  title="Trở về danh sách"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
                  💬
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-semibold text-sm leading-tight truncate max-w-[170px]">
                      {activeConversation
                        ? (user?.id === activeConversation.customerId
                          ? (activeConversation.store?.name || 'Trò chuyện với Shop')
                          : (activeConversation.customer?.fullName || 'Trò chuyện với Khách'))
                        : 'Danh sách trò chuyện'}
                    </h3>
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${socketConnected ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`}
                      title={socketConnected ? 'Realtime Socket: Đã kết nối' : 'Đang kết nối Socket...'}
                    />
                  </div>
                  <p className="text-xs text-blue-100 font-light">
                    {socketConnected ? 'Online Hỗ trợ (Realtime)' : 'Đang kết nối...'}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => toggleChat(false)}
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body: Danh sách cuộc trò chuyện OR Tin nhắn trong phòng chat */}
          {!activeConversation ? (
            /* LỚP 1: Danh sách cuộc trò chuyện chuẩn mẫu Messenger */
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700/60">
              {isLoadingConversations ? (
                <div className="p-8 text-center text-sm text-gray-500">Đang tải cuộc trò chuyện...</div>
              ) : conversations.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-500">Chưa có cuộc trò chuyện nào</div>
              ) : (
                conversations.map((conv) => {
                  const isMyCustomerView = user?.id === conv.customerId;
                  const displayName = isMyCustomerView
                    ? (conv.store?.name || `Shop #${conv.storeId.slice(0, 8)}`)
                    : (conv.customer?.fullName || `Khách hàng #${conv.customerId.slice(0, 8)}`);
                  const avatarUrl = isMyCustomerView ? conv.store?.logo : conv.customer?.avatarUrl;
                  const isUnread = !!conv.hasUnread;
                  const relativeTime = formatRelativeTime(conv.lastMessageAt);

                  return (
                    <div
                      key={conv.id}
                      onClick={() => selectConversation(conv)}
                      className={`p-3.5 hover:bg-gray-100/80 dark:hover:bg-gray-700/60 cursor-pointer transition-all flex items-center gap-3.5 ${
                        isUnread ? 'bg-blue-50/50 dark:bg-blue-950/30' : ''
                      }`}
                    >
                      {/* Avatar kèm Chấm Xanh Online */}
                      <div className="relative flex-shrink-0">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="" className="w-11 h-11 rounded-full object-cover border border-gray-200 dark:border-gray-700 shadow-xs" />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
                            {isMyCustomerView ? '🏪' : '👤'}
                          </div>
                        )}
                        {/* Chấm Xanh lá đại diện Online */}
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-800 shadow-xs" />
                      </div>

                      {/* Thông tin Cuộc trò chuyện & Nội dung xem trước */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={`text-sm truncate ${
                            isUnread
                              ? 'font-bold text-gray-900 dark:text-white'
                              : 'font-semibold text-gray-800 dark:text-gray-200'
                          }`}>
                            {displayName}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <p className={`text-xs truncate flex-1 ${
                            isUnread
                              ? 'font-bold text-blue-600 dark:text-blue-400'
                              : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {conv.lastMessageContent || 'Bắt đầu trò chuyện...'}
                          </p>
                          {relativeTime && (
                            <span className={`text-[11px] whitespace-nowrap flex-shrink-0 ${
                              isUnread
                                ? 'font-semibold text-blue-600 dark:text-blue-400'
                                : 'text-gray-400 dark:text-gray-500'
                            }`}>
                              · {relativeTime}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Chấm Xanh Dương đại diện Tin nhắn Chưa đọc */}
                      {isUnread && (
                        <span className="w-3.5 h-3.5 bg-blue-500 rounded-full flex-shrink-0 shadow-sm animate-pulse ml-1" title="Tin nhắn mới chưa đọc" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* LỚP 2: Khung tin nhắn phòng chat đang chọn */
            <div className="flex-1 flex flex-col min-h-0 bg-gray-50 dark:bg-gray-900 relative">
              {/* Card gợi ý sản phẩm nếu mở từ trang chi tiết sản phẩm */}
              {pendingProductCard && (
                <div className="m-3 p-2.5 bg-white dark:bg-gray-800 rounded-xl border border-blue-100 dark:border-gray-700 shadow-sm flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={pendingProductCard.thumbnail || 'https://via.placeholder.com/50'}
                      alt={pendingProductCard.name}
                      className="w-10 h-10 object-cover rounded-lg"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {pendingProductCard.name}
                      </p>
                      <p className="text-xs font-bold text-blue-600">
                        {pendingProductCard.price.toLocaleString('vi-VN')} đ
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleSendProductCard}
                    disabled={isSending}
                    className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors shadow-sm whitespace-nowrap"
                  >
                    Gửi Thẻ
                  </button>
                </div>
              )}

              {/* Danh sách Tin Nhắn */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {isLoadingMessages ? (
                  <div className="text-center text-xs text-gray-400 py-4">Đang tải tin nhắn...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-xs text-gray-400 py-8">
                    Hãy gửi tin nhắn đầu tiên để bắt đầu trò chuyện!
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isMe = msg.senderId === user?.id;
                    const imageUrl =
                      (msg.attachments && msg.attachments.length > 0 && msg.attachments[0].url) ||
                      msg.metadata?.url ||
                      (msg.type === 'IMAGE' && msg.metadata?.url) ||
                      (typeof msg.content === 'string' && (msg.content.startsWith('http://') || msg.content.startsWith('https://')) ? msg.content : null);

                    // Kiểm tra hiển thị nhãn ngày nếu sang ngày mới
                    const currentDateLabel = formatDateLabel(msg.createdAt);
                    const prevDateLabel = index > 0 ? formatDateLabel(messages[index - 1].createdAt) : null;
                    const showDateBadge = index === 0 || currentDateLabel !== prevDateLabel;

                    return (
                      <React.Fragment key={msg.id}>
                        {/* Phân đoạn Ngày gửi (Hôm nay, Hôm qua, DD/MM/YYYY) */}
                        {showDateBadge && (
                          <div className="flex justify-center my-2">
                            <span className="bg-gray-200/80 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300 text-[10px] font-medium px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                              {currentDateLabel}
                            </span>
                          </div>
                        )}

                        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}>
                          <div
                            className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm ${isMe
                              ? 'bg-blue-600 text-white rounded-br-none'
                              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-100 dark:border-gray-700 rounded-bl-none'
                              } ${msg.isRecalled ? 'italic opacity-70' : ''}`}
                          >
                            {/* Tin nhắn dạng Hình ảnh */}
                            {imageUrl && !msg.isRecalled ? (
                              <div className="space-y-1.5">
                                <img
                                  src={imageUrl}
                                  alt="Ảnh gửi"
                                  onLoad={() => scrollToBottom('auto')}
                                  onClick={() => setPreviewImageUrl(imageUrl)}
                                  className="max-w-[220px] max-h-[220px] rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity border border-black/10 shadow-sm"
                                />
                                {msg.content && msg.content !== '[Hình ảnh]' && !msg.content.startsWith('http') && (
                                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                                )}
                              </div>
                            ) : (
                              <>
                                {/* Loại tin nhắn Thẻ sản phẩm */}
                                {msg.type === 'PRODUCT_CARD' && msg.metadata && (
                                  <div className="mb-2 p-2 bg-black/10 dark:bg-white/10 rounded-lg flex gap-2 items-center">
                                    {msg.metadata.thumbnail && (
                                      <img
                                        src={msg.metadata.thumbnail}
                                        alt=""
                                        onLoad={() => scrollToBottom('auto')}
                                        className="w-8 h-8 rounded object-cover"
                                      />
                                    )}
                                    <div className="text-xs">
                                      <p className="font-semibold line-clamp-1">{msg.metadata.name}</p>
                                      <p className="font-bold text-yellow-300">
                                        {msg.metadata.price?.toLocaleString('vi-VN')} đ
                                      </p>
                                    </div>
                                  </div>
                                )}
                                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                              </>
                            )}
                          </div>

                          {/* Subline: Thời gian & Trạng thái Đã đọc / Đã gửi */}
                          <div className="flex items-center gap-1.5 mt-1 px-1 text-[10px] text-gray-400">
                            <span>{formatTime(msg.createdAt)}</span>

                            {/* Trạng thái Đã gửi / Đã đọc cho tin nhắn của Tôi */}
                            {isMe && !msg.isRecalled && (
                              <span
                                className={`flex items-center gap-0.5 font-medium ${msg.isRead ? 'text-sky-400 dark:text-sky-300' : 'text-gray-400'}`}
                                title={msg.isRead && msg.readAt ? `Đã đọc lúc ${formatTime(msg.readAt)}` : 'Đã gửi'}
                              >
                                {msg.isRead ? (
                                  <>
                                    <svg className="w-3.5 h-3.5 text-sky-400 dark:text-sky-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7m-11 6l4 4L22 7" />
                                    </svg>
                                    <span>Đã đọc</span>
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span>Đã gửi</span>
                                  </>
                                )}
                              </span>
                            )}

                            {isMe && !msg.isRecalled && (
                              <button
                                onClick={() => recallMessage(msg.id)}
                                className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity ml-1"
                                title="Thu hồi tin nhắn"
                              >
                                Thu hồi
                              </button>
                            )}
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })
                )}

                {/* Trạng thái dang upload ảnh */}
                {isUploadingImage && (
                  <div className="flex justify-end">
                    <div className="bg-blue-600/80 text-white rounded-2xl rounded-br-none px-4 py-3 text-xs flex items-center gap-2 animate-pulse">
                      <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Đang tải ảnh lên...</span>
                    </div>
                  </div>
                )}

                {/* Trạng thái đối phương đang nhập tin nhắn (Typing Indicator) */}
                {isTyping && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 italic py-1 px-2">
                    <span className="flex gap-1 items-center">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </span>
                    <span>Đối phương đang gõ...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Popup Chọn Google Emoji Picker */}
              {showEmojiPicker && (
                <div className="absolute bottom-16 left-2 right-2 z-40 flex justify-center shadow-2xl rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200 border border-gray-200 dark:border-gray-700">
                  <EmojiPicker
                    onEmojiClick={handleSelectEmoji}
                    emojiStyle={EmojiStyle.GOOGLE}
                    theme={Theme.AUTO}
                    lazyLoadEmojis={true}
                    searchPlaceHolder="Tìm kiếm Google Emoji..."
                    width="100%"
                    height={360}
                  />
                </div>
              )}

              {/* Hidden File Input cho Upload Ảnh */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />

              {/* Ô Nhập Tin Nhắn & Nút Thao Tác */}
              <form onSubmit={handleSendText} className="p-3 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex items-center gap-1.5">
                {/* Nút Chọn Emoji */}
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker((prev) => !prev)}
                  className={`p-2 rounded-full transition-colors ${showEmojiPicker ? 'bg-blue-100 text-blue-600 dark:bg-gray-700' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                  title="Chọn Google Emoji"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>

                {/* Nút Upload Ảnh */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingImage || isSending}
                  className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors disabled:opacity-50"
                  title="Gửi hình ảnh"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>

                {/* Input Nhập Văn Bản */}
                <input
                  type="text"
                  value={inputContent}
                  onChange={handleInputChange}
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm px-3.5 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                {/* Nút Gửi */}
                <button
                  type="submit"
                  disabled={!inputContent.trim() || isSending}
                  className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-full transition-all shadow-md focus:outline-none"
                  title="Gửi tin nhắn"
                >
                  <svg className="w-4 h-4 transform rotate-90" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
