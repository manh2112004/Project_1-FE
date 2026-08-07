import { create } from 'zustand';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  updateUser: (user: Partial<User>) => void;
  logout: () => void;
  hasRole: (roles: string[]) => boolean;
  hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => {
  // Restore initial state from localStorage
  const savedUser = localStorage.getItem('user_info');
  const savedToken = localStorage.getItem('access_token');
  const savedRefresh = localStorage.getItem('refresh_token');

  return {
    user: savedUser ? JSON.parse(savedUser) : null,
    accessToken: savedToken || null,
    refreshToken: savedRefresh || null,
    isAuthenticated: !!savedToken,

    setAuth: (user, accessToken, refreshToken) => {
      localStorage.setItem('user_info', JSON.stringify(user));
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      set({ user, accessToken, refreshToken, isAuthenticated: true });
    },

    updateUser: (updatedFields) => {
      const current = get().user;
      if (!current) return;
      const newUser = { ...current, ...updatedFields };
      localStorage.setItem('user_info', JSON.stringify(newUser));
      set({ user: newUser });
    },

    logout: () => {
      localStorage.removeItem('user_info');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
    },

    hasRole: (allowedRoles) => {
      const user = get().user;
      if (!user) return false;
      if (user.email === 'admin@system.com' || user.roleCode === 'SUPER_ADMIN') return true;
      if (allowedRoles.includes('ALL_NON_CUSTOMER')) {
        return user.roleCode !== 'CUSTOMER';
      }
      return allowedRoles.includes(user.roleCode || '');
    },

    hasPermission: (permission) => {
      const user = get().user;
      const token = get().accessToken;
      if (!user && !token) return false;
      if (user?.email === 'admin@system.com' || user?.roleCode === 'SUPER_ADMIN') return true;

      let userPerms = user?.permissions || [];
      if (userPerms.length === 0 && token) {
        try {
          const payloadBase64 = token.split('.')[1];
          if (payloadBase64) {
            const decoded = JSON.parse(atob(payloadBase64));
            userPerms = decoded.permissions || decoded.permissionCodes || [];
          }
        } catch (e) {
          // ignore error
        }
      }

      return userPerms.includes(permission);
    },
  };
});
