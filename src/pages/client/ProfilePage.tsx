import React, { useState } from 'react';
import api from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import { useToastStore } from '../../store/useToastStore';
import { User, Lock, Save, Loader2, Upload, Camera } from 'lucide-react';

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

  // Tự động tải lại thông tin Profile mới nhất từ Backend khi vào trang
  React.useEffect(() => {
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
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Địa chỉ Email (Cố định)</label>
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
    </div>
  );
};
