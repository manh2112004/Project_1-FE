import api from './api';
import type {
  ApiResponse,
  Store,
  StoreAddress,
  Product,
  StoreStatus,
  RegisterStorePayload,
  UpdateStoreProfilePayload,
  UpdateStoreLegalInfoPayload,
  CreateStoreAddressPayload,
  UpdateStoreAddressPayload,
} from '../types';

export const storeService = {
  // 1. Phân trang danh sách Store (Admin/Public)
  async getStoresPaginated(params?: { page?: number; limit?: number; search?: string; status?: StoreStatus }) {
    const res = await api.get<ApiResponse<{ items: Store[]; meta: any }>>('/stores/paginated', { params });
    return res.data;
  },

  // 2. Lấy thông tin Store theo ID
  async getStoreById(id: string) {
    const res = await api.get<ApiResponse<Store>>(`/stores/${id}`);
    return res.data;
  },

  // 3. Lấy gian hàng của tôi (Seller)
  async getMyStore() {
    const res = await api.get<ApiResponse<Store>>('/stores/me');
    return res.data;
  },

  // 4. Đăng ký cửa hàng mới
  async registerStore(data: RegisterStorePayload) {
    const res = await api.post<ApiResponse<Store>>('/stores/register', data);
    return res.data;
  },

  // 5. Cập nhật hồ sơ shop (Tên, mô tả, logo, cover)
  async updateProfile(data: UpdateStoreProfilePayload) {
    const res = await api.put<ApiResponse<Store>>('/stores/profile', data);
    return res.data;
  },

  // 6. Cập nhật giấy tờ pháp lý (Mã số thuế / CCCD)
  async updateLegalInfo(data: UpdateStoreLegalInfoPayload) {
    const res = await api.put<ApiResponse<Store>>('/stores/legal-info', data);
    return res.data;
  },

  // 7. Bật / Tắt tạm nghỉ bán hàng
  async toggleVacation(isOnVacation: boolean) {
    const res = await api.patch<ApiResponse<Store>>('/stores/vacation', { isOnVacation });
    return res.data;
  },

  // 8. Admin phê duyệt Store
  async approveStore(id: string) {
    const res = await api.patch<ApiResponse<Store>>(`/stores/${id}/approve`);
    return res.data;
  },

  // 9. Admin khóa Store
  async suspendStore(id: string, reason: string) {
    const res = await api.patch<ApiResponse<Store>>(`/stores/${id}/suspend`, { reason });
    return res.data;
  },

  // 10. Admin từ chối Store
  async rejectStore(id: string, reason: string) {
    const res = await api.patch<ApiResponse<Store>>(`/stores/${id}/reject`, { reason });
    return res.data;
  },

  // 11. Admin mở khóa Store
  async reactivateStore(id: string) {
    const res = await api.patch<ApiResponse<Store>>(`/stores/${id}/reactivate`);
    return res.data;
  },

  // --- STORE ADDRESS / KHO HÀNG APIs ---

  // 12. Xem danh sách kho hàng của Store
  async getAddressesByStoreId(storeId: string) {
    const res = await api.get<ApiResponse<StoreAddress[]>>(`/store-addresses/store/${storeId}`);
    return res.data;
  },

  // 13. Tạo mới kho hàng
  async createAddress(data: CreateStoreAddressPayload) {
    const res = await api.post<ApiResponse<StoreAddress>>('/store-addresses', data);
    return res.data;
  },

  // 14. Cập nhật kho hàng
  async updateAddress(id: string, data: UpdateStoreAddressPayload) {
    const res = await api.put<ApiResponse<StoreAddress>>(`/store-addresses/${id}`, data);
    return res.data;
  },

  // 15. Xóa kho hàng
  async deleteAddress(id: string) {
    const res = await api.delete<ApiResponse<void>>(`/store-addresses/${id}`);
    return res.data;
  },

  // 16. Đặt kho mặc định (default | pickup | return)
  async setDefaultAddress(id: string, type: 'default' | 'pickup' | 'return') {
    const res = await api.patch<ApiResponse<StoreAddress>>(`/store-addresses/${id}/default?type=${type}`);
    return res.data;
  },

  // 17. Lấy danh sách sản phẩm của Store
  async getStoreProducts(storeId: string) {
    const res = await api.get<ApiResponse<Product[]>>(`/products/store/${storeId}`);
    return res.data;
  },
};
