export type OrderStatus = "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
export type PaymentMethod = "COD" | "VNPAY" | "MOMO" | "PAYOS";
export type PaymentStatus = "UNPAID" | "PAID" | "REFUNDED";
export type SystemRole = "SUPER_ADMIN" | "ADMIN" | "STAFF" | "CUSTOMER";
export type UserStatus = "ACTIVE" | "BLOCKED" | "PENDING";

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  url?: string; // Cho API upload
}

export interface PaginationMeta {
  total?: number;
  totalCount?: number;
  page?: number;
  currentPage?: number;
  limit?: number;
  totalPages: number;
}

export interface PaginatedData<T> {
  items?: T[];
  users?: T[];
  products?: T[];
  categories?: T[];
  brands?: T[];
  roles?: T[];
  permissions?: T[];
  meta: PaginationMeta;
}

export interface User {
  id: string;
  roleId: string;
  email: string;
  phoneNumber?: string;
  fullName: string;
  avatarUrl?: string;
  dateOfBirth?: string;
  gender: string;
  status: UserStatus;
  roleCode?: string;
  permissions?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Brand {
  id: string;
  name: string;
  logo?: string;
  description?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Inventory {
  id: string;
  productId: string;
  quantity: number;
  importPrice: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductImage {
  id: string;
  productId: string;
  imageUrl: string;
  isThumbnail: boolean;
  sortOrder: number;
}

export interface Product {
  id: string;
  storeId?: string | null;
  categoryId: string;
  brandId: string;
  name: string;
  slug: string;
  sku: string;
  shortDescription?: string;
  description?: string;
  thumbnail: string;
  price: number;
  discountPrice?: number;
  status: string;
  category?: Category;
  brand?: Brand;
  store?: Store;
  images?: ProductImage[];
  inventory?: Inventory;
  stockQuantity?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  id?: string;
  productId: string;
  quantity: number;
  price: number;
  product?: Product;
  createdAt?: string;
  updatedAt?: string;
}

export interface Cart {
  id: string;
  userId: string;
  totalItems: number;
  isEmpty: boolean;
  items: CartItem[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product?: Product;
}

export interface Order {
  id: string;
  userId: string;
  orderCode: string;
  status: OrderStatus;
  totalAmount: number;
  discountAmount: number;
  shippingFee: number;
  finalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  recipientName: string;
  phoneNumber: string;
  shippingAddress: string;
  shippingCode?: string | null;
  customerNote?: string | null;
  cancelReason?: string | null;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface UserAddress {
  id: string;
  userId: string;
  recipientName: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2?: string;
  ward: string;
  district: string;
  city: string;
  country: string;
  postalCode?: string;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Permission {
  id: string;
  name: string;
  module: string;
  description?: string;
}

export interface Role {
  id: string;
  name: string;
  code: string;
  description?: string;
  permissionCodes?: string[];
  permissions?: Permission[];
}

export type BusinessType = "PERSONAL" | "ENTERPRISE";
export type StoreStatus = "PENDING" | "ACTIVE" | "REJECTED" | "SUSPENDED";

export interface StoreAddress {
  id: string;
  storeId: string;
  contactName: string;
  phoneNumber?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  ward: string;
  district: string;
  city: string;
  country: string;
  postalCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isDefaultPickup: boolean;
  isDefaultReturn: boolean;
  isDefault: boolean;
  fullAddress: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Store {
  id: string;
  userId: string;
  name: string;
  description?: string | null;
  logo?: string | null;
  coverImage?: string | null;
  contactPhone?: string;
  contactEmail: string;
  businessType: BusinessType;
  taxCode?: string | null;
  identityNumber?: string | null;
  status: StoreStatus;
  statusNote?: string | null;
  isOnVacation: boolean;
  canAcceptOrders: boolean;
  addresses?: StoreAddress[];
  createdAt: string;
  updatedAt: string;
}

export interface RegisterStorePayload {
  name: string;
  description?: string;
  logo?: string;
  coverImage?: string;
  contactPhone?: string;
  contactEmail: string;
  businessType: BusinessType;
  taxCode?: string;
  identityNumber?: string;
}

export interface UpdateStoreProfilePayload {
  name: string;
  description?: string;
  logo?: string;
  coverImage?: string;
}

export interface UpdateStoreLegalInfoPayload {
  taxCode?: string;
  identityNumber?: string;
}

export interface CreateStoreAddressPayload {
  storeId: string;
  contactName: string;
  phoneNumber?: string;
  addressLine1: string;
  addressLine2?: string;
  ward: string;
  district: string;
  city: string;
  country?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  isDefaultPickup?: boolean;
  isDefaultReturn?: boolean;
  isDefault?: boolean;
}

export interface UpdateStoreAddressPayload {
  contactName?: string;
  phoneNumber?: string;
  addressLine1?: string;
  addressLine2?: string;
  ward?: string;
  district?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  isDefaultPickup?: boolean;
  isDefaultReturn?: boolean;
  isDefault?: boolean;
}

