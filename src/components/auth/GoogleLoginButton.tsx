import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import { Loader2 } from 'lucide-react';

declare global {
  interface Window {
    google?: any;
  }
}

interface GoogleLoginButtonProps {
  onSuccess?: () => void;
  className?: string;
}

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ onSuccess, className }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();

  const GOOGLE_CLIENT_ID =
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    '1054367375253-googleclientidplaceholder.apps.googleusercontent.com';

  useEffect(() => {
    // Tải Google Identity Services (GIS) Script nếu chưa có
    if (!window.google) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
  }, []);

  const handleGoogleCredential = async (response: any) => {
    if (!response?.credential) {
      addToast({ type: 'error', title: 'Lỗi', message: 'Không nhận được ID Token từ Google.' });
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.post('/auth/google', { idToken: response.credential });

      if (res.data?.success) {
        const { user, accessToken, refreshToken } = res.data.data;
        setAuth(user, accessToken, refreshToken);
        addToast({
          type: 'success',
          title: 'Đăng nhập Google thành công 🎉',
          message: `Chào mừng ${user.fullName}!`,
        });

        if (onSuccess) {
          onSuccess();
        } else {
          // Nếu vai trò không phải CUSTOMER thì cho vào /admin
          if (user.roleCode && user.roleCode !== 'CUSTOMER') {
            navigate('/admin', { replace: true });
          } else {
            navigate('/', { replace: true });
          }
        }
      }
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Đăng nhập Google thất bại',
        message: error.response?.data?.message || 'Có lỗi xảy ra khi xác thực với Google.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleClick = () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential,
      });

      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // Cho phép mở popup chooser thủ công
          window.google.accounts.id.renderButton(
            document.getElementById('hidden-google-btn'),
            { theme: 'outline', size: 'large' }
          );
          const hiddenBtn = document.getElementById('hidden-google-btn')?.querySelector('div[role="button"]') as HTMLElement;
          if (hiddenBtn) {
            hiddenBtn.click();
          }
        }
      });
    } else {
      addToast({
        type: 'info',
        title: 'Đang tải Google Auth',
        message: 'Đang kết nối thư viện Google Identity... Vui lòng thử lại sau 2 giây.',
      });
    }
  };

  return (
    <>
      <div id="hidden-google-btn" className="hidden"></div>
      <button
        type="button"
        disabled={isLoading}
        onClick={handleGoogleClick}
        className={
          className ||
          'w-full py-3 px-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/80 text-white font-medium text-sm flex items-center justify-center gap-3 transition-all shadow-md group disabled:opacity-50'
        }
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
        ) : (
          <>
            {/* SVG Logo Google chuẩn */}
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className="font-semibold">Đăng Nhập Bằng Google</span>
          </>
        )}
      </button>
    </>
  );
};
