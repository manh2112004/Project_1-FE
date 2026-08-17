import React, { useState, useEffect, useRef } from 'react';
import { useChatStore } from '../../store/useChatStore';
import { useAuthStore } from '../../store/useAuthStore';
import type { MessageType } from '../../types';

export const ChatBox: React.FC = () => {
  const { user, accessToken, isAuthenticated } = useAuthStore();
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1. Khởi tạo kết nối Socket.IO khi User đã đăng nhập
  useEffect(() => {
    if (isAuthenticated && accessToken) {
      initializeSocket(accessToken);
    }
    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated, accessToken, initializeSocket, disconnectSocket]);

  // 2. Cuộn xuống tin nhắn cuối cùng khi có tin nhắn mới hoặc đổi phòng
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeConversation, isTyping]);

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

  const handleSendText = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputContent.trim() || isSending) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    sendTypingStatus(false);

    const content = inputContent;
    setInputContent('');
    await sendMessage(content);
  };

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
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
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
        <div className="w-[360px] sm:w-[400px] h-[520px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              {activeConversation && (
                <button
                  onClick={() => selectConversation(null)}
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
            /* LỚP 1: Danh sách cuộc trò chuyện */
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
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

                  return (
                    <div
                      key={conv.id}
                      onClick={() => selectConversation(conv)}
                      className="p-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors flex items-center gap-3"
                    >
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                          {isMyCustomerView ? '🏪' : '👤'}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                            {displayName}
                          </span>
                          {conv.lastMessageAt && (
                            <span className="text-[10px] text-gray-400">
                              {new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                          {conv.lastMessageContent || 'Bắt đầu trò chuyện...'}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* LỚP 2: Khung tin nhắn phòng chat đang chọn */
            <div className="flex-1 flex flex-col min-h-0 bg-gray-50 dark:bg-gray-900">
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
                  messages.map((msg) => {
                    const isMe = msg.senderId === user?.id;

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm ${isMe
                              ? 'bg-blue-600 text-white rounded-br-none'
                              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-100 dark:border-gray-700 rounded-bl-none'
                            } ${msg.isRecalled ? 'italic opacity-70' : ''}`}
                        >
                          {/* Loại tin nhắn Thẻ sản phẩm */}
                          {msg.type === 'PRODUCT_CARD' && msg.metadata && (
                            <div className="mb-2 p-2 bg-black/10 dark:bg-white/10 rounded-lg flex gap-2 items-center">
                              {msg.metadata.thumbnail && (
                                <img
                                  src={msg.metadata.thumbnail}
                                  alt=""
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
                        </div>

                        {/* Subline: Thời gian & Nút thu hồi */}
                        <div className="flex items-center gap-1.5 mt-1 px-1 text-[10px] text-gray-400">
                          <span>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isMe && !msg.isRecalled && (
                            <button
                              onClick={() => recallMessage(msg.id)}
                              className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity"
                              title="Thu hồi tin nhắn"
                            >
                              Thu hồi
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
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

              {/* Ô Nhập Tin Nhắn */}
              <form onSubmit={handleSendText} className="p-3 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex items-center gap-2">
                <input
                  type="text"
                  value={inputContent}
                  onChange={handleInputChange}
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm px-3.5 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={!inputContent.trim() || isSending}
                  className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-full transition-all shadow-md focus:outline-none"
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
