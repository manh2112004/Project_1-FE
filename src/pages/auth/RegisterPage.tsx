import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useToastStore } from '../../store/useToastStore';
import { Sparkles, Mail, Lock, User, Phone, ArrowRight, Loader2, ArrowLeft, RefreshCw, CheckCircle2, ShieldCheck } from 'lucide-react';
import { OtpInput } from '../../components/common/OtpInput';

export const RegisterPage: React.FC = () => {
  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phoneNumber: '',
    gender: 'MALE',
    otp: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState<number>(0);

  const { addToast } = useToastStore();
  const navigate = useNavigate();

  // Đếm ngược 5 phút (300 giây)
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Bước 1: Gửi mã OTP về Email
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!formData.email || !formData.fullName || !formData.password) {
      addToast({ type: 'warning', title: 'Thông báo', message: 'Vui lòng điền đầy đủ các thông tin bắt buộc.' });
      return;
    }

    if (formData.password.length < 6) {
      addToast({ type: 'warning', title: 'Mật khẩu yếu', message: 'Mật khẩu phải chứa ít nhất 6 ký tự.' });
      return;
    }

    // Phone Regex Việt Nam
    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    if (!phoneRegex.test(formData.phoneNumber)) {
      addToast({ type: 'warning', title: 'Số điện thoại không hợp lệ', message: 'Vui lòng nhập đúng số điện thoại Việt Nam (ví dụ 0987654321).' });
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.post('/auth/send-otp', { email: formData.email });
      if (res.data?.success) {
        addToast({
          type: 'success',
          title: 'Đã gửi mã OTP 📧',
          message: res.data.message || 'Mã OTP 6 chữ số đã được gửi đến Email của bạn.',
        });
        setStep(2);
        setCountdown(300); // 5 phút
      }
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Gửi OTP thất bại',
        message: error.response?.data?.message || 'Không thể gửi mã OTP đến email này.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Bước 2: Xác nhận OTP và Hoàn tất Đăng ký
  const handleCompleteRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.otp || formData.otp.trim().length !== 6) {
      addToast({ type: 'warning', title: 'Mã OTP chưa đủ 6 số', message: 'Vui lòng nhập đủ 6 chữ số mã OTP.' });
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.post('/auth/register', formData);
      if (res.data?.success) {
        addToast({
          type: 'success',
          title: 'Đăng ký thành công 🎉',
          message: 'Tài khoản của bạn đã được xác thực thành công. Vui lòng đăng nhập!',
        });
        navigate('/login');
      }
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Xác thực thất bại',
        message: error.response?.data?.message || 'Có lỗi xảy ra khi tạo tài khoản.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-lg glass-panel p-8 sm:p-10 rounded-3xl shadow-2xl relative z-10 border border-slate-800">
        {/* Step Indicator Badges */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
            step === 1 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
          }`}>
            {step === 2 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span>1</span>}
            <span>Thông tin cá nhân</span>
          </div>

          <div className="w-6 h-[1px] bg-slate-800"></div>

          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
            step === 2 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-slate-900 text-slate-500 border border-slate-800'
          }`}>
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Xác thực OTP</span>
          </div>
        </div>

        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 mb-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-2xl font-extrabold text-white tracking-tight">NEXSTORE</span>
          </Link>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {step === 1 ? 'Đăng Ký Tài Khoản Khách Hàng' : 'Xác Thực Mã OTP Email'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {step === 1
              ? 'Nhập thông tin cá nhân để nhận mã xác thực OTP qua Email'
              : 'Chúng tôi đã gửi mã xác thực 6 chữ số đến hòm thư Email của bạn'}
          </p>
        </div>

        {step === 1 ? (
          /* Step 1: Form Thông tin đăng ký */
          <form onSubmit={(e) => handleSendOtp(e)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Họ và tên</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Nguyen Van A"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full bg-slate-900/90 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
                <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Địa chỉ Email nhận OTP</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-900/90 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
                <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Số điện thoại</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="0987654321"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="w-full bg-slate-900/90 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                  <Phone className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Giới tính</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full bg-slate-900/90 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                >
                  <option value="MALE">Nam</option>
                  <option value="FEMALE">Nữ</option>
                  <option value="OTHER">Khác</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Mật khẩu</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="Tối thiểu 6 ký tự"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-slate-900/90 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
                <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 mt-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm shadow-xl shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Gửi Mã Xác Thực OTP</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* Step 2: Giao diện 6 ô nhập mã OTP chuyên nghiệp */
          <form onSubmit={handleCompleteRegister} className="space-y-6">
            {/* Email info badge & timer */}
            <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Gửi đến email:</span>
                <span className="font-bold text-indigo-400 truncate max-w-[200px]">{formData.email}</span>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
                <span className="text-slate-400">Mã có hiệu lực trong:</span>
                <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-md border border-amber-500/20">
                  {formatTime(countdown)}
                </span>
              </div>
            </div>

            {/* 6-Digit Otp Input Component */}
            <div>
              <label className="block text-xs font-bold text-slate-300 text-center uppercase tracking-wider mb-1">
                Mã Xác Thực OTP (6 chữ số)
              </label>
              <OtpInput
                value={formData.otp}
                onChange={(otp) => setFormData({ ...formData, otp })}
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || formData.otp.length !== 6}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span>Xác Nhận & Đăng Ký Tài Khoản</span>
              )}
            </button>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Thay đổi thông tin
              </button>

              <button
                type="button"
                disabled={isLoading || countdown > 0}
                onClick={() => handleSendOtp()}
                className="text-indigo-400 hover:text-indigo-300 disabled:opacity-40 flex items-center gap-1.5 font-semibold transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>{countdown > 0 ? `Gửi lại mã (${countdown}s)` : 'Gửi lại mã OTP'}</span>
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 text-center text-xs text-slate-400">
          Đã có tài khoản?{' '}
          <Link to="/login" className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    </div>
  );
};
