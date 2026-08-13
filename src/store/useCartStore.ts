import { create } from 'zustand';
import api from '../services/api';
import type { Cart } from '../types';

interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  fetchCart: () => Promise<void>;
  addToCart: (productId: string, quantity: number, price: number) => Promise<boolean>;
  updateQuantity: (productId: string, quantity: number) => Promise<boolean>;
  removeItem: (productId: string) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: null,
  isLoading: false,

  fetchCart: async () => {
    try {
      set({ isLoading: true });
      const res = await api.get('/cart/me');
      if (res.data?.success) {
        const cartData: Cart = res.data.data;
        if (cartData?.items && cartData.items.length > 0) {
          // Lấy thêm thông tin chi tiết từng sản phẩm (Tên, Ảnh thumbnail)
          const itemsWithProducts = await Promise.all(
            cartData.items.map(async (item) => {
              try {
                const prodRes = await api.get(`/products/${item.productId}`);
                if (prodRes.data?.success) {
                  const prod = prodRes.data.data;
                  if (prod.storeId || prod.store?.id) {
                    try {
                      const sRes = await api.get(`/stores/${prod.storeId || prod.store?.id}`);
                      if (sRes.data?.success) {
                        prod.store = sRes.data.data;
                      }
                    } catch (e) { }
                  }
                  return { ...item, product: prod };
                }
              } catch (err) {
                // Ignore product fetch error
              }
              return item;
            })
          );
          cartData.items = itemsWithProducts;
        }
        set({ cart: cartData });
      }
    } catch (error) {
      console.error('Lấy giỏ hàng thất bại:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  addToCart: async (productId, quantity, price) => {
    try {
      set({ isLoading: true });
      const res = await api.post('/cart/items', { productId, quantity, price });
      if (res.data?.success) {
        await get().fetchCart();
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Thêm giỏ hàng thất bại:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateQuantity: async (productId, quantity) => {
    try {
      set({ isLoading: true });
      const res = await api.put(`/cart/items/${productId}`, { quantity });
      if (res.data?.success) {
        await get().fetchCart();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Cập nhật số lượng giỏ hàng thất bại:', error);
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  removeItem: async (productId) => {
    try {
      set({ isLoading: true });
      const res = await api.delete(`/cart/items/${productId}`);
      if (res.data?.success) {
        await get().fetchCart();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Xóa mục khỏi giỏ hàng thất bại:', error);
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  clearCart: async () => {
    try {
      set({ isLoading: true });
      const res = await api.delete('/cart/clear');
      if (res.data?.success) {
        set({ cart: { id: '', userId: '', totalItems: 0, isEmpty: true, items: [] } });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Xóa sạch giỏ hàng thất bại:', error);
      return false;
    } finally {
      set({ isLoading: false });
    }
  },
}));
