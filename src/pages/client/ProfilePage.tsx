import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import { User, Lock, Save, Loader2, Upload, Camera, Mail, X, CheckCircle2, ShieldAlert } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const { addToast } = useToastStore();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [gender, setGender] = useState(user?.gender || 'MALE');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Change Password
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Change Email Modal State
  const [isChangeEmailModalOpen, setIsChangeEmailModalOpen] = useState(false);
  const [changeEmailStep, setChangeEmailStep] = useState<1 | 2>(1);
  const [newEmailInput, setNewEmailInput] = useState('');
  const [currentPassInput, setCurrentPassInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [isConfirmingOtp, setIsConfirmingOtp] = useState(false);
  const [otpTimer, setOtpTimer] = useState(300);

  // Tự động tải lại thông tin Profile mới nhất từ Backend khi vào trang
  useEffect(() => {
    api
      .get('/users/me')
      .then((res) => {
        if (res.data?.success && res.data?.data) {
          const userData = res.data.data;
          updateUser(userData);
          if (userData.fullName) setFullName(userData.fullName);
          if (userData.avatarUrl) setAvatarUrl(userData.avatarUrl);
          if (userData.gender) setGender(userData.gender);
        }
      })
      .catch(() => { });
  }, []);

  // Đếm ngược 5 phút OTP ở Bước 2
  useEffect(() => {
    let interval: any;
    if (changeEmailStep === 2 && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [changeEmailStep, otpTimer]);

  // Reset Change Email Modal State
  const handleCloseChangeEmailModal = () => {
    setIsChangeEmailModalOpen(false);
    setChangeEmailStep(1);
    setNewEmailInput('');
    setCurrentPassInput('');
    setOtpInput('');
    setOtpTimer(300);
  };

  // Bước 1: Yêu cầu gửi OTP đến email mới
  const handleRequestChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmailInput.trim()) {
      addToast({ type: 'warning', title: 'Thông báo', message: 'Vui lòng nhập Email mới.' });
      return;
    }

    try {
      setIsRequestingOtp(true);
      const res = await api.post('/users/me/request-change-email', {
        newEmail: newEmailInput.trim(),
        currentPassword: currentPassInput || undefined,
      });

      if (res.data?.success) {
        addToast({
          type: 'success',
          title: 'Đã gửi mã OTP 📧',
          message: res.data.message || `Mã OTP đã được gửi tới ${newEmailInput}`,
        });
        setChangeEmailStep(2);
        setOtpTimer(300);
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Yêu cầu thất bại',
        message: err.response?.data?.message || 'Không thể gửi mã OTP thay đổi Email.',
      });
    } finally {
      setIsRequestingOtp(false);
    }
  };

  // Bước 2: Xác nhận mã OTP để hoàn tất đổi Email
  const handleConfirmChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpInput.trim()) {
      addToast({ type: 'warning', title: 'Thông báo', message: 'Vui lòng nhập mã OTP 6 số.' });
      return;
    }

    try {
      setIsConfirmingOtp(true);
      const res = await api.post('/users/me/confirm-change-email', {
        otpCode: otpInput.trim(),
      });

      if (res.data?.success && res.data?.data) {
        updateUser(res.data.data);
        addToast({
          type: 'success',
          title: 'Đổi Email thành công! 🎉',
          message: `Địa chỉ Email của bạn đã được cập nhật thành ${res.data.data.email}`,
        });
        handleCloseChangeEmailModal();
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Xác thực thất bại',
        message: err.response?.data?.message || 'Mã OTP không chính xác hoặc đã hết hạn.',
      });
    } finally {
      setIsConfirmingOtp(false);
    }
  };

  // Xử lý Tải ảnh từ máy tính (Local File Upload -> Cloudinary)
  const handleAvatarFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingAvatar(true);
      const data = new FormData();
      data.append('file', file);

      const res = await api.post('/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success && res.data?.url) {
        setAvatarUrl(res.data.url);
        addToast({
          type: 'success',
          title: 'Tải ảnh thành công!',
          message: 'Ảnh đại diện mới đã được tải lên Cloudinary.',
        });
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Tải ảnh thất bại',
        message: err.response?.data?.message || 'Có lỗi xảy ra khi tải file ảnh lên.',
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsUpdatingProfile(true);
      const res = await api.put('/users/me', {
        fullName,
        avatarUrl: avatarUrl || undefined,
        gender,
      });

      if (res.data?.success) {
        updateUser(res.data.data);
        addToast({ type: 'success', title: 'Thành công', message: 'Cập nhật thông tin cá nhân thành công.' });
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Thất bại',
        message: err.response?.data?.message || 'Không thể cập nhật hồ sơ.',
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      addToast({ type: 'warning', title: 'Thông báo', message: 'Vui lòng nhập đầy đủ mật khẩu cũ và mới.' });
      return;
    }

    try {
      setIsChangingPass(true);
      const res = await api.put('/users/me/change-password', {
        oldPassword,
        newPassword,
      });

      if (res.data?.success) {
        addToast({ type: 'success', title: 'Thành công', message: 'Đổi mật khẩu thành công!' });
        setOldPassword('');
        setNewPassword('');
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Thất bại',
        message: err.response?.data?.message || 'Mật khẩu cũ không chính xác.',
      });
    } finally {
      setIsChangingPass(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="space-y-8 py-4 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Hồ Sơ Cá Nhân</h1>
        <p className="text-xs text-slate-400 mt-1">Quản lý thông tin tài khoản và bảo mật mật khẩu</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Profile Info Form */}
        <form onSubmit={handleUpdateProfile} className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-5">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <User className="w-4 h-4 text-indigo-400" /> Thông Tin Hồ Sơ
          </h3>

          {/* Avatar Upload Preview Circle */}
          <div className="flex flex-col items-center justify-center space-y-3 pb-2">
            <div className="relative group">
              <img
                src={
                  avatarUrl ||
                  user?.avatarUrl ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'User'}`
                }
                alt={fullName}
                className="w-24 h-24 rounded-full object-cover border-2 border-indigo-500/50 shadow-xl shadow-indigo-500/20"
              />

              {/* Upload Overlay Button */}
              <label
                htmlFor="avatar-upload-input"
                className="absolute inset-0 rounded-full bg-slate-950/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer transition-all duration-200"
              >
                {isUploadingAvatar ? (
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                ) : (
                  <>
                    <Camera className="w-6 h-6 text-indigo-400 mb-1" />
                    <span className="text-[10px] font-bold">Đổi ảnh</span>
                  </>
                )}
              </label>

              <input
                id="avatar-upload-input"
                type="file"
                accept="image/*"
                onChange={handleAvatarFileUpload}
                className="hidden"
                disabled={isUploadingAvatar}
              />
            </div>

            <label
              htmlFor="avatar-upload-input"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/30 font-semibold text-xs cursor-pointer transition-all"
            >
              {isUploadingAvatar ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang tải lên...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Chọn ảnh từ máy tính</span>
                </>
              )}
            </label>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300">Địa chỉ Email</label>
              <button
                type="button"
                onClick={() => setIsChangeEmailModalOpen(true)}
                className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors hover:underline"
              >
                <Mail className="w-3.5 h-3.5" /> Đổi Email
              </button>
            </div>
            <input
              type="text"
              disabled
              value={user?.email || ''}
              className="w-full bg-slate-900/60 border border-slate-800/80 rounded-xl py-2.5 px-4 text-xs text-slate-400 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Họ và tên</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">URL Ảnh đại diện (Tùy chọn nhập URL)</label>
            <input
              type="text"
              placeholder="https://..."
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Giới tính</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="MALE">Nam</option>
              <option value="FEMALE">Nữ</option>
              <option value="OTHER">Khác</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isUpdatingProfile || isUploadingAvatar}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {isUpdatingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Lưu Thay Đổi</span>
          </button>
        </form>

        {/* Change Password Form */}
        <form onSubmit={handleChangePassword} className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4 h-fit">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Lock className="w-4 h-4 text-amber-400" /> Đổi Mật Khẩu
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Mật khẩu hiện tại</label>
            <input
              type="password"
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Mật khẩu mới</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={isChangingPass}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {isChangingPass ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            <span>Cập Nhật Mật Khẩu</span>
          </button>
        </form>
      </div>

      {/* Modal 2 Bước Thay Đổi Email */}
      {isChangeEmailModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl max-w-md w-full border border-slate-800 space-y-4 animate-fade-in relative">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-400" />
                <span>Thay Đổi Địa Chỉ Email</span>
              </h3>
              <button onClick={handleCloseChangeEmailModal} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Step 1: Form Yêu cầu gửi OTP */}
            {changeEmailStep === 1 ? (
              <form onSubmit={handleRequestChangeEmail} className="space-y-4">
                <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-indigo-400 shrink-0" /> Xác thực an toàn 2 bước
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Mã OTP 6 số sẽ được gửi trực tiếp đến Email mới để xác nhận quyền sở hữu.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Địa chỉ Email Mới</label>
                  <input
                    type="email"
                    required
                    placeholder="emailmoi@gmail.com"
                    value={newEmailInput}
                    onChange={(e) => setNewEmailInput(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Nếu tài khoản có mật khẩu thì bắt buộc nhập Mật khẩu hiện tại */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Mật khẩu hiện tại (Xác nhận bảo mật)
                  </label>
                  <input
                    type="password"
                    placeholder="Nhập mật khẩu tài khoản của bạn"
                    value={currentPassInput}
                    onChange={(e) => setCurrentPassInput(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCloseChangeEmailModal}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={isRequestingOtp}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    {isRequestingOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                    <span>Gửi Mã OTP</span>
                  </button>
                </div>
              </form>
            ) : (
              /* Step 2: Form Nhập Mã OTP */
              <form onSubmit={handleConfirmChangeEmail} className="space-y-4">
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> Kiểm tra Hòm thư Email mới
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Mã OTP 6 số đã được gửi đến: <span className="font-bold text-white">{newEmailInput}</span>
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
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-center font-mono font-bold tracking-[8px] text-lg text-emerald-400 focus:outline-none focus:border-emerald-500 placeholder-slate-600"
                  />
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => setChangeEmailStep(1)}
                    className="text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    ← Gửi lại Email khác
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCloseChangeEmailModal}
                      className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      disabled={isConfirmingOtp || otpTimer === 0}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/25 flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                      {isConfirmingOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      <span>Xác Nhận Đổi Email</span>
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
