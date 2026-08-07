import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { useToastStore } from '../../store/useToastStore';
import { Mail, KeyRound, Lock, ArrowLeft, Loader2, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToastStore();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState(300);

  // Đếm ngược 5 phút cho mã OTP ở Bước 2
  useEffect(() => {
    let interval: any;
    if (step === 2 && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, otpTimer]);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Bước 1: Gửi yêu cầu mã OTP khôi phục mật khẩu
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      addToast({ type: 'warning', title: 'Thông báo', message: 'Vui lòng nhập địa chỉ Email.' });
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.post('/auth/forgot-password', {
        email: email.trim(),
      });

      if (res.data?.success) {
        addToast({
          type: 'success',
          title: 'Đã gửi mã OTP 📧',
          message: res.data.message || 'Mã OTP 6 số đã được gửi đến email của bạn.',
        });
        setStep(2);
        setOtpTimer(300);
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Yêu cầu thất bại',
        message: err.response?.data?.message || 'Không thể gửi yêu cầu khôi phục mật khẩu.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Bước 2: Kiểm tra mã OTP trực tiếp với Server
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      addToast({ type: 'warning', title: 'Thông báo', message: 'Vui lòng nhập đủ 6 số OTP.' });
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.post('/auth/verify-reset-otp', {
        email: email.trim(),
        otpCode: otpCode.trim(),
      });

      if (res.data?.success && res.data?.data?.resetToken) {
        setResetToken(res.data.data.resetToken);
        addToast({
          type: 'success',
          title: 'Xác thực OTP thành công! 🔓',
          message: 'Mã OTP chính xác. Vui lòng nhập mật khẩu mới của bạn.',
        });
        setStep(3);
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Mã OTP không đúng',
        message: err.response?.data?.message || 'Mã xác thực OTP không chính xác hoặc đã hết hạn.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Bước 3: Đặt lại Mật khẩu mới bằng resetToken
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      addToast({ type: 'warning', title: 'Thông báo', message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast({ type: 'error', title: 'Không trùng khớp', message: 'Xác nhận mật khẩu mới không chính xác.' });
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.post('/auth/reset-password', {
        resetToken,
        newPassword,
      });

      if (res.data?.success) {
        addToast({
          type: 'success',
          title: 'Đổi mật khẩu thành công! 🎉',
          message: 'Mật khẩu mới đã được cập nhật. Vui lòng đăng nhập.',
        });
        navigate('/login');
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Thất bại',
        message: err.response?.data?.message || 'Có lỗi xảy ra khi đặt lại mật khẩu.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-600/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md glass-panel p-8 sm:p-10 rounded-3xl shadow-2xl relative z-10 border border-slate-800 animate-fade-in">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-6 transition-colors font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại Đăng Nhập</span>
        </Link>

        {/* Dynamic Stepper Indicator Header */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step === 1 ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-500/20' : 'bg-slate-800 text-emerald-400'}`}>
            {step > 1 ? '✓' : '1'}
          </div>
          <div className={`w-8 h-0.5 ${step >= 2 ? 'bg-emerald-400' : 'bg-slate-800'}`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step === 2 ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-500/20' : step > 2 ? 'bg-slate-800 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
            {step > 2 ? '✓' : '2'}
          </div>
          <div className={`w-8 h-0.5 ${step === 3 ? 'bg-emerald-400' : 'bg-slate-800'}`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step === 3 ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/20' : 'bg-slate-800 text-slate-500'}`}>
            3
          </div>
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-amber-500/20">
              <KeyRound className="w-6 h-6" />
            </div>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            {step === 1 ? 'Quên Mật Khẩu?' : step === 2 ? 'Xác Thực Mã OTP' : 'Mật Khẩu Mới'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {step === 1
              ? 'Nhập Email của bạn để nhận mã xác thực OTP khôi phục tài khoản'
              : step === 2
              ? 'Nhập mã OTP 6 số để xác thực quyền sở hữu tài khoản'
              : 'Thiết lập mật khẩu mới an toàn cho tài khoản của bạn'}
          </p>
        </div>

        {/* STEP 1 FORM: YÊU CẦU MÃ OTP */}
        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Địa chỉ Email tài khoản</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="yourname@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2 cursor-pointer"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              <span>Gửi Mã Xác Thực OTP</span>
            </button>
          </form>
        )}

        {/* STEP 2 FORM: KIỂM TRA MÃ OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" /> Kiểm tra Email của bạn
              </p>
              <p className="text-[11px] text-slate-400">
                Mã OTP 6 số đã được gửi đến: <span className="font-bold text-white">{email}</span>
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">Mã Xác Thực OTP (6 số)</label>
                <span className="text-[11px] font-bold text-amber-400">Hết hạn sau: {formatTimer(otpTimer)}</span>
              </div>
              <input
                type="text"
                required
                maxLength={6}
                autoComplete="one-time-code"
                placeholder="• • • • • •"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-center font-mono font-bold tracking-[8px] text-lg text-amber-400 focus:outline-none focus:border-amber-500 placeholder-slate-600"
              />
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="submit"
                disabled={isLoading || otpTimer === 0 || otpCode.length !== 6}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                <span>Xác Nhận Mã OTP</span>
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-slate-400 hover:text-white transition-colors text-center py-1 cursor-pointer"
              >
                ← Gửi lại mã cho Email khác
              </button>
            </div>
          </form>
        )}

        {/* STEP 3 FORM: NHẬP MẬT KHẨU MỚI */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Đã xác thực OTP thành công
              </p>
              <p className="text-[11px] text-slate-400">
                Hãy thiết lập mật khẩu mới an toàn cho tài khoản <span className="font-bold text-white">{email}</span>.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Mật khẩu mới</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="Ít nhất 6 ký tự"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nhập lại Mật khẩu mới</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="Nhập lại mật khẩu giống trên"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
                />
                <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2 cursor-pointer"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              <span>Lưu Mật Khẩu Mới & Đăng Nhập</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
