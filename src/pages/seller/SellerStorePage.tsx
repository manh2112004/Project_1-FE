import React, { useState, useEffect } from 'react';
import { storeService } from '../../services/storeService';
import api from '../../services/api';
import { useToastStore } from '../../store/useToastStore';
import type {
  Store,
  StoreAddress,
  Product,
  RegisterStorePayload,
  Category,
  Brand,
} from '../../types';
import { vnLocationService } from '../../services/vnLocationService';
import type { Province, District, Ward } from '../../services/vnLocationService';
import {
  Store as StoreIcon,
  MapPin,
  Building,
  UserCheck,
  ShieldCheck,
  AlertTriangle,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  Clock,
  Ban,
  Sun,
  Moon,
  RefreshCw,
  Mail,
  Phone,
  Upload,
  XCircle,
  Package,
  PlusCircle,
} from 'lucide-react';

export const SellerStorePage: React.FC = () => {
  const [store, setStore] = useState<Store | null>(null);
  const [addresses, setAddresses] = useState<StoreAddress[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'legal' | 'addresses' | 'products'>('profile');

  const { addToast } = useToastStore();

  // Form states cho Đăng ký Shop mới
  const [regForm, setRegForm] = useState<RegisterStorePayload>({
    name: '',
    description: '',
    logo: '',
    coverImage: '',
    contactPhone: '',
    contactEmail: '',
    businessType: 'PERSONAL',
    taxCode: '',
    identityNumber: '',
  });

  // Form state cho Cập nhật Profile
  const [profileForm, setProfileForm] = useState({
    name: '',
    description: '',
    logo: '',
    coverImage: '',
  });

  // Form state cho Cập nhật Pháp lý
  const [legalForm, setLegalForm] = useState({
    taxCode: '',
    identityNumber: '',
  });

  // State cho Modal Địa chỉ kho hàng
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<StoreAddress | null>(null);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  // State cho Modal Đăng sản phẩm mới
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [uploadingProductThumb, setUploadingProductThumb] = useState(false);
  const [togglingProductId, setTogglingProductId] = useState<string | null>(null);

  const [productForm, setProductForm] = useState({
    name: '',
    sku: '',
    categoryId: '',
    brandId: '',
    price: 0,
    discountPrice: 0,
    shortDescription: '',
    description: '',
    thumbnail: '',
  });

  const [addressForm, setAddressForm] = useState<{
    contactName: string;
    phoneNumber: string;
    addressLine1: string;
    addressLine2: string;
    ward: string;
    district: string;
    city: string;
    isDefaultPickup: boolean;
    isDefaultReturn: boolean;
    isDefault: boolean;
  }>({
    contactName: '',
    phoneNumber: '',
    addressLine1: '',
    addressLine2: '',
    ward: '',
    district: '',
    city: '',
    isDefaultPickup: false,
    isDefaultReturn: false,
    isDefault: false,
  });

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const handleUploadImage = async (file: File, type: 'logo' | 'cover', isRegistration: boolean) => {
    const isLogo = type === 'logo';
    if (isLogo) setUploadingLogo(true);
    else setUploadingCover(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const url = res.data?.url || res.data?.data?.url;
      if (url) {
        if (isRegistration) {
          setRegForm((prev) => ({
            ...prev,
            [isLogo ? 'logo' : 'coverImage']: url,
          }));
        } else {
          setProfileForm((prev) => ({
            ...prev,
            [isLogo ? 'logo' : 'coverImage']: url,
          }));
        }
        addToast({ type: 'success', title: 'Tải ảnh thành công', message: `Đã cập nhật ảnh ${isLogo ? 'Logo' : 'Bìa'}.` });
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Tải ảnh thất bại',
        message: err.response?.data?.message || 'Có lỗi xảy ra khi tải ảnh lên.',
      });
    } finally {
      if (isLogo) setUploadingLogo(false);
      else setUploadingCover(false);
    }
  };

  const fetchMyStore = async () => {
    setLoading(true);
    try {
      const res = await storeService.getMyStore();
      if (res.data) {
        setStore(res.data);
        setProfileForm({
          name: res.data.name || '',
          description: res.data.description || '',
          logo: res.data.logo || '',
          coverImage: res.data.coverImage || '',
        });
        setLegalForm({
          taxCode: res.data.taxCode || '',
          identityNumber: res.data.identityNumber || '',
        });
        fetchAddresses(res.data.id);
        fetchStoreProducts(res.data.id);
      } else {
        setStore(null);
      }
    } catch (err: any) {
      setStore(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchAddresses = async (storeId: string) => {
    try {
      const res = await storeService.getAddressesByStoreId(storeId);
      if (res.data) {
        setAddresses(res.data);
      }
    } catch (err: any) {
      console.error('Lỗi lấy địa chỉ kho:', err);
    }
  };

  const fetchStoreProducts = async (storeId: string) => {
    try {
      const res = await storeService.getStoreProducts(storeId);
      if (res.data) {
        setProducts(res.data);
      }
    } catch (err: any) {
      console.error('Lỗi lấy sản phẩm shop:', err);
    }
  };

  const fetchCategoriesAndBrands = async () => {
    try {
      const [catRes, brandRes] = await Promise.all([
        api.get('/categories'),
        api.get('/brand'),
      ]);
      if (catRes.data?.data) setCategories(catRes.data.data);
      if (brandRes.data?.data) setBrands(brandRes.data.data);
    } catch (err) {
      console.error('Lỗi lấy danh mục/thương hiệu:', err);
    }
  };

  useEffect(() => {
    fetchMyStore();
    vnLocationService.getProvinces().then((list) => setProvinces(list));
    fetchCategoriesAndBrands();
  }, []);

  // Xử lý Đăng ký shop
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await storeService.registerStore(regForm);
      addToast({
        type: 'success',
        title: 'Đăng ký thành công',
        message: 'Cửa hàng đã được khởi tạo và đang chờ Ban quản trị duyệt.',
      });
      fetchMyStore();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Đăng ký thất bại',
        message: err.response?.data?.message || err.message || 'Có lỗi xảy ra khi đăng ký gian hàng.',
      });
    }
  };

  // Cập nhật Profile
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await storeService.updateProfile(profileForm);
      if (res.data) setStore(res.data);
      addToast({
        type: 'success',
        title: 'Thành công',
        message: 'Đã cập nhật hồ sơ cửa hàng.',
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Lỗi',
        message: err.response?.data?.message || 'Cập nhật hồ sơ thất bại.',
      });
    }
  };

  // Cập nhật Giấy tờ pháp lý
  const handleUpdateLegal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await storeService.updateLegalInfo(legalForm);
      if (res.data) setStore(res.data);
      addToast({
        type: 'success',
        title: 'Cập nhật thành công',
        message: 'Thông tin pháp lý đã gửi. Cửa hàng chuyển về trạng thái Chờ duyệt.',
      });
      fetchMyStore();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Lỗi',
        message: err.response?.data?.message || 'Cập nhật pháp lý thất bại.',
      });
    }
  };

  // Bật/Tắt chế độ tạm nghỉ
  const handleToggleVacation = async () => {
    if (!store) return;
    try {
      const res = await storeService.toggleVacation(!store.isOnVacation);
      if (res.data) {
        setStore(res.data);
        addToast({
          type: 'info',
          title: 'Thông báo',
          message: res.data.isOnVacation
            ? 'Đã BẬT chế độ tạm nghỉ bán hàng.'
            : 'Đã TẮT chế độ tạm nghỉ. Cửa hàng đã hoạt động trở lại.',
        });
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Lỗi',
        message: err.response?.data?.message || 'Thao tác thất bại.',
      });
    }
  };

  // --- XỬ LÝ ĐẠI CHỈ KHO HÀNG ---
  const handleProvinceChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pCode = Number(e.target.value);
    const selectedP = provinces.find((p) => Number(p.code) === pCode);

    if (selectedP) {
      const list = await vnLocationService.getDistricts(pCode);
      setDistricts(list);
      setWards([]);
      setAddressForm((prev) => ({
        ...prev,
        city: selectedP.name,
        district: '',
        ward: '',
      }));
    } else {
      setDistricts([]);
      setWards([]);
    }
  };

  const handleDistrictChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const dCode = Number(e.target.value);
    const selectedD = districts.find((d) => Number(d.code) === dCode);

    if (selectedD) {
      const list = await vnLocationService.getWards(dCode);
      setWards(list);
      setAddressForm((prev) => ({
        ...prev,
        district: selectedD.name,
        ward: '',
      }));
    } else {
      setWards([]);
    }
  };

  const openAddressModal = (addr?: StoreAddress) => {
    if (addr) {
      setEditingAddress(addr);
      setAddressForm({
        contactName: addr.contactName,
        phoneNumber: addr.phoneNumber || '',
        addressLine1: addr.addressLine1,
        addressLine2: addr.addressLine2 || '',
        ward: addr.ward,
        district: addr.district,
        city: addr.city,
        isDefaultPickup: addr.isDefaultPickup,
        isDefaultReturn: addr.isDefaultReturn,
        isDefault: addr.isDefault,
      });
    } else {
      setEditingAddress(null);
      setAddressForm({
        contactName: '',
        phoneNumber: '',
        addressLine1: '',
        addressLine2: '',
        ward: '',
        district: '',
        city: '',
        isDefaultPickup: false,
        isDefaultReturn: false,
        isDefault: false,
      });
    }
    setIsAddressModalOpen(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;

    try {
      if (editingAddress) {
        await storeService.updateAddress(editingAddress.id, addressForm);
        addToast({ type: 'success', title: 'Thành công', message: 'Đã cập nhật địa chỉ kho hàng.' });
      } else {
        await storeService.createAddress({
          storeId: store.id,
          ...addressForm,
        });
        addToast({ type: 'success', title: 'Thành công', message: 'Đã thêm địa chỉ kho hàng mới.' });
      }
      setIsAddressModalOpen(false);
      fetchAddresses(store.id);
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Lỗi',
        message: err.response?.data?.message || 'Lưu địa chỉ kho thất bại.',
      });
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa địa chỉ kho hàng này?')) return;
    if (!store) return;
    try {
      await storeService.deleteAddress(addressId);
      addToast({ type: 'success', title: 'Đã xóa', message: 'Địa chỉ kho đã được gỡ bỏ.' });
      fetchAddresses(store.id);
    } catch (err: any) {
      addToast({ type: 'error', title: 'Lỗi', message: err.response?.data?.message || 'Xóa thất bại.' });
    }
  };

  const handleSetDefaultAddress = async (addressId: string, type: 'default' | 'pickup' | 'return') => {
    if (!store) return;
    try {
      await storeService.setDefaultAddress(addressId, type);
      addToast({ type: 'success', title: 'Cập nhật', message: 'Đã thay đổi thiết lập kho mặc định.' });
      fetchAddresses(store.id);
    } catch (err: any) {
      addToast({ type: 'error', title: 'Lỗi', message: err.response?.data?.message || 'Thao tác thất bại.' });
    }
  };

  // --- XỬ LÝ ĐĂNG SẢN PHẨM MỚI ---
  const handleCreateProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;

    try {
      await api.post('/products', {
        ...productForm,
        storeId: store.id,
        price: Number(productForm.price),
        discountPrice: productForm.discountPrice ? Number(productForm.discountPrice) : undefined,
      });

      addToast({
        type: 'success',
        title: 'Đăng sản phẩm thành công',
        message: `Sản phẩm "${productForm.name}" đã được tạo thành công!`,
      });

      setIsProductModalOpen(false);
      setProductForm({
        name: '',
        sku: '',
        categoryId: '',
        brandId: '',
        price: 0,
        discountPrice: 0,
        shortDescription: '',
        description: '',
        thumbnail: '',
      });

      fetchStoreProducts(store.id);
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Lỗi tạo sản phẩm',
        message: err.response?.data?.message || 'Có lỗi xảy ra khi tạo sản phẩm mới.',
      });
    }
  };

  const handleUploadProductThumb = async (file: File) => {
    setUploadingProductThumb(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data?.url || res.data?.data?.url;
      if (url) {
        setProductForm((prev) => ({ ...prev, thumbnail: url }));
        addToast({ type: 'success', title: 'Thành công', message: 'Đã tải ảnh đại diện sản phẩm.' });
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Lỗi', message: err.response?.data?.message || 'Tải ảnh thất bại.' });
    } finally {
      setUploadingProductThumb(false);
    }
  };

  // --- XỬ LÝ ĐỔI TRẠNG THÁI SẢN PHẨM ---
  const handleToggleProductStatus = async (product: Product) => {
    const currentStatus = product.status || 'ACTIVE';
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setTogglingProductId(product.id);
    try {
      const res = await api.put(`/products/${product.id}`, { status: newStatus });
      if (res.data?.success || res.status === 200) {
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, status: newStatus } : p))
        );
        addToast({
          type: 'success',
          title: 'Đã cập nhật trạng thái',
          message: `Sản phẩm "${product.name}" hiện đã chuyển sang [${newStatus === 'ACTIVE' ? 'Đang bán' : 'Tạm ngưng bán'}].`,
        });
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Cập nhật thất bại',
        message: err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái sản phẩm.',
      });
    } finally {
      setTogglingProductId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-slate-400">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mr-3" />
        Đang tải dữ liệu cửa hàng...
      </div>
    );
  }

  // --- TRƯỜNG HỢP 1: CHƯA CÓ CỬA HÀNG (FORM ĐĂNG KÝ) ---
  if (!store) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header Hero Banner */}
        <div className="glass-panel p-8 rounded-3xl border border-slate-800 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="relative z-10 flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <StoreIcon className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                Đăng ký trở thành Người Bán Hàng
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Tạo cửa hàng của bạn ngay hôm nay để bắt đầu kinh doanh trên nền tảng Thương mại Điện tử!
              </p>
            </div>
          </div>
        </div>

        <div className="glass-panel p-8 rounded-3xl border border-slate-800 shadow-2xl">
          <form onSubmit={handleRegister} className="space-y-6 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Loại hình kinh doanh */}
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Loại hình kinh doanh *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setRegForm({ ...regForm, businessType: 'PERSONAL' })}
                    className={`p-4 rounded-2xl border flex items-center gap-3 transition-all text-left ${regForm.businessType === 'PERSONAL'
                      ? 'border-indigo-500 bg-indigo-500/10 text-white shadow-lg shadow-indigo-500/10'
                      : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
                      }`}
                  >
                    <UserCheck className="w-6 h-6 text-indigo-400 shrink-0" />
                    <div>
                      <div className="font-bold text-sm text-white">Cá nhân / Hộ kinh doanh</div>
                      <div className="text-xs text-slate-400 mt-0.5">Cung cấp CCCD/CMND cá nhân</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegForm({ ...regForm, businessType: 'ENTERPRISE' })}
                    className={`p-4 rounded-2xl border flex items-center gap-3 transition-all text-left ${regForm.businessType === 'ENTERPRISE'
                      ? 'border-indigo-500 bg-indigo-500/10 text-white shadow-lg shadow-indigo-500/10'
                      : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
                      }`}
                  >
                    <Building className="w-6 h-6 text-purple-400 shrink-0" />
                    <div>
                      <div className="font-bold text-sm text-white">Doanh nghiệp / Công ty</div>
                      <div className="text-xs text-slate-400 mt-0.5">Cung cấp Mã số thuế Doanh nghiệp</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Tên gian hàng */}
              <div className="col-span-2 md:col-span-1">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tên cửa hàng *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Shop Thời Trang Nữ Bella"
                  value={regForm.name}
                  onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Email liên hệ */}
              <div className="col-span-2 md:col-span-1">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email liên hệ cửa hàng *</label>
                <input
                  type="email"
                  required
                  placeholder="store@example.com"
                  value={regForm.contactEmail}
                  onChange={(e) => setRegForm({ ...regForm, contactEmail: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Số điện thoại liên hệ */}
              <div className="col-span-2 md:col-span-1">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Số điện thoại liên hệ</label>
                <input
                  type="text"
                  placeholder="0901234567"
                  value={regForm.contactPhone}
                  onChange={(e) => setRegForm({ ...regForm, contactPhone: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Giấy tờ tùy thân / Pháp lý */}
              {regForm.businessType === 'PERSONAL' ? (
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Số CCCD / CMND *</label>
                  <input
                    type="text"
                    required
                    placeholder="001099xxxxxx"
                    value={regForm.identityNumber}
                    onChange={(e) => setRegForm({ ...regForm, identityNumber: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              ) : (
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Mã số thuế Doanh nghiệp *</label>
                  <input
                    type="text"
                    required
                    placeholder="0101234567"
                    value={regForm.taxCode}
                    onChange={(e) => setRegForm({ ...regForm, taxCode: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              {/* Mô tả cửa hàng */}
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Mô tả giới thiệu cửa hàng</label>
                <textarea
                  rows={3}
                  placeholder="Chuyên cung cấp các mặt hàng chính hãng chất lượng cao..."
                  value={regForm.description}
                  onChange={(e) => setRegForm({ ...regForm, description: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Logo Cửa hàng */}
              <div className="col-span-2 md:col-span-1">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Ảnh Logo Cửa hàng</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="https://... hoặc tải từ máy"
                    value={regForm.logo}
                    onChange={(e) => setRegForm({ ...regForm, logo: e.target.value })}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <label className="px-4 py-2.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/30 rounded-xl cursor-pointer flex items-center gap-1.5 font-semibold text-xs transition-all shrink-0">
                    <Upload className="w-4 h-4" />
                    {uploadingLogo ? 'Đang tải...' : 'Tải từ máy'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadImage(file, 'logo', true);
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Ảnh Bìa Cửa hàng */}
              <div className="col-span-2 md:col-span-1">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Ảnh Bìa Cửa hàng</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="https://... hoặc tải từ máy"
                    value={regForm.coverImage}
                    onChange={(e) => setRegForm({ ...regForm, coverImage: e.target.value })}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <label className="px-4 py-2.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/30 rounded-xl cursor-pointer flex items-center gap-1.5 font-semibold text-xs transition-all shrink-0">
                    <Upload className="w-4 h-4" />
                    {uploadingCover ? 'Đang tải...' : 'Tải từ máy'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadImage(file, 'cover', true);
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="submit"
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold shadow-lg shadow-indigo-500/25 transition-all"
              >
                Gửi Đơn Đăng Ký Cửa Hàng
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // --- TRƯỜNG HỢP 2: ĐÃ ĐĂNG KÝ CỬA HÀNG ---
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Banner & Header Shop */}
      <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-2xl relative">
        {/* Banner Cover */}
        <div className="h-48 bg-gradient-to-r from-indigo-900 via-slate-900 to-purple-950 relative border-b border-slate-800/80">
          {store.coverImage && (
            <img src={store.coverImage} alt="Cover" className="w-full h-full object-cover opacity-60" />
          )}
          {/* Vacation Mode Switch */}
          <div className="absolute top-4 right-4 glass-panel border border-slate-700/80 px-4 py-2 rounded-full flex items-center gap-3 shadow-xl">
            {store.isOnVacation ? (
              <Moon className="w-4 h-4 text-amber-400" />
            ) : (
              <Sun className="w-4 h-4 text-emerald-400 animate-spin-slow" />
            )}
            <span className="text-xs font-bold text-white">
              {store.isOnVacation ? 'Tạm nghỉ' : 'Đang Hoạt động'}
            </span>
            <button
              type="button"
              onClick={handleToggleVacation}
              className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${store.isOnVacation ? 'bg-amber-500/30 border border-amber-500/40 justify-end' : 'bg-emerald-500/30 border border-emerald-500/40 justify-start'
                }`}
            >
              <div className={`w-4 h-4 rounded-full shadow-md ${store.isOnVacation ? 'bg-amber-400' : 'bg-emerald-400'}`} />
            </button>
          </div>
        </div>

        {/* Profile Header Info */}
        <div className="p-6 pt-0 flex flex-col md:flex-row items-start md:items-end justify-between gap-4 -mt-12 relative z-10">
          <div className="flex items-end gap-5">
            {/* Logo */}
            <div className="w-24 h-24 rounded-2xl border-4 border-slate-900 bg-slate-800 shadow-2xl overflow-hidden flex items-center justify-center text-indigo-400 font-black text-3xl border border-slate-700 shrink-0">
              {store.logo ? (
                <img src={store.logo} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                store.name.charAt(0).toUpperCase()
              )}
            </div>

            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white tracking-tight">{store.name}</h1>
                {/* Status Badge */}
                {store.status === 'ACTIVE' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CheckCircle className="w-3.5 h-3.5" /> Đã duyệt
                  </span>
                )}
                {store.status === 'PENDING' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Clock className="w-3.5 h-3.5" /> Đang chờ duyệt
                  </span>
                )}
                {store.status === 'REJECTED' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    <Ban className="w-3.5 h-3.5" /> Từ chối duyệt
                  </span>
                )}
                {store.status === 'SUSPENDED' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                    <AlertTriangle className="w-3.5 h-3.5" /> Đang bị khóa
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-4">
                <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-indigo-400" /> {store.contactEmail}</span>
                {store.contactPhone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-indigo-400" /> {store.contactPhone}</span>}
              </p>
            </div>
          </div>

          {/* Quick Action Button: + Đăng sản phẩm mới (chỉ hiện khi shop đã ACTIVE) */}
          {store.status === 'ACTIVE' && (
            <button
              type="button"
              onClick={() => {
                setActiveTab('products');
                setIsProductModalOpen(true);
              }}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/25 flex items-center gap-2 transition-all shrink-0"
            >
              <PlusCircle className="w-4 h-4" /> Đăng Sản Phẩm Mới
            </button>
          )}
        </div>

        {/* Thông báo nếu bị Từ chối / Khóa */}
        {store.statusNote && (store.status === 'REJECTED' || store.status === 'SUSPENDED') && (
          <div className="mx-6 mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Lý do từ Ban quản trị: </span>
              {store.statusNote}
            </div>
          </div>
        )}
      </div>

      {/* Tabs Header */}
      <div className="flex border-b border-slate-800 bg-slate-900/60 px-4 rounded-2xl">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`py-3.5 px-5 font-bold text-xs border-b-2 flex items-center gap-2 transition-all ${activeTab === 'profile'
            ? 'border-indigo-500 text-indigo-400'
            : 'border-transparent text-slate-400 hover:text-white'
            }`}
        >
          <StoreIcon className="w-4 h-4" /> Hồ sơ cửa hàng
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`py-3.5 px-5 font-bold text-xs border-b-2 flex items-center gap-2 transition-all ${activeTab === 'products'
            ? 'border-indigo-500 text-indigo-400'
            : 'border-transparent text-slate-400 hover:text-white'
            }`}
        >
          <Package className="w-4 h-4" /> Quản lý Sản phẩm ({products.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('legal')}
          className={`py-3.5 px-5 font-bold text-xs border-b-2 flex items-center gap-2 transition-all ${activeTab === 'legal'
            ? 'border-indigo-500 text-indigo-400'
            : 'border-transparent text-slate-400 hover:text-white'
            }`}
        >
          <ShieldCheck className="w-4 h-4" /> Giấy tờ pháp lý
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('addresses')}
          className={`py-3.5 px-5 font-bold text-xs border-b-2 flex items-center gap-2 transition-all ${activeTab === 'addresses'
            ? 'border-indigo-500 text-indigo-400'
            : 'border-transparent text-slate-400 hover:text-white'
            }`}
        >
          <MapPin className="w-4 h-4" /> Địa chỉ & Kho hàng ({addresses.length})
        </button>
      </div>

      {/* TAB 1: HỒ SƠ CỬA HÀNG */}
      {activeTab === 'profile' && (
        <div className="glass-panel rounded-3xl border border-slate-800 p-6 text-xs">
          <form onSubmit={handleUpdateProfile} className="space-y-5 max-w-3xl">
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">Tên cửa hàng *</label>
              <input
                type="text"
                required
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">Mô tả giới thiệu cửa hàng</label>
              <textarea
                rows={4}
                value={profileForm.description}
                onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Ảnh Logo Cửa hàng</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="https://... hoặc tải từ máy"
                    value={profileForm.logo}
                    onChange={(e) => setProfileForm({ ...profileForm, logo: e.target.value })}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-indigo-500"
                  />
                  <label className="px-3 py-2 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/30 rounded-xl cursor-pointer flex items-center gap-1 font-semibold text-xs transition-all shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    {uploadingLogo ? 'Đang tải...' : 'Tải từ máy'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadImage(file, 'logo', false);
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Ảnh Bìa Cửa hàng</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="https://... hoặc tải từ máy"
                    value={profileForm.coverImage}
                    onChange={(e) => setProfileForm({ ...profileForm, coverImage: e.target.value })}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-indigo-500"
                  />
                  <label className="px-3 py-2 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/30 rounded-xl cursor-pointer flex items-center gap-1 font-semibold text-xs transition-all shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    {uploadingCover ? 'Đang tải...' : 'Tải từ máy'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadImage(file, 'cover', false);
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold shadow-lg shadow-indigo-500/20 transition-all"
              >
                Lưu thay đổi hồ sơ
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB SẢN PHẨM CỦA SHOP */}
      {activeTab === 'products' && (
        <div className="space-y-4 text-xs">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center glass-panel p-4 rounded-2xl border border-slate-800 gap-4">
            <div>
              <h2 className="font-bold text-white text-sm">Danh sách Sản Phẩm của Shop</h2>
              <p className="text-slate-400 text-xs mt-0.5">Quản lý toàn bộ danh mục hàng hóa đăng bán của gian hàng</p>
            </div>

            {store.status === 'ACTIVE' ? (
              <button
                type="button"
                onClick={() => setIsProductModalOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-xl hover:from-indigo-500 hover:to-violet-500 flex items-center gap-1.5 shadow-lg shadow-indigo-500/20 transition-all shrink-0"
              >
                <PlusCircle className="w-4 h-4" /> Đăng sản phẩm mới
              </button>
            ) : (
              <div className="px-3 py-1.5 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-xl text-xs flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                Cần được Admin phê duyệt gian hàng để mở quyền đăng sản phẩm.
              </div>
            )}
          </div>

          {products.length === 0 ? (
            <div className="text-center py-16 glass-panel rounded-3xl border border-slate-800 text-slate-400 space-y-3">
              <Package className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">Gian hàng chưa có sản phẩm nào.</p>
              {store.status === 'ACTIVE' && (
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(true)}
                  className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 inline-flex items-center gap-2 transition-all shadow-lg"
                >
                  <PlusCircle className="w-4 h-4" /> Bắt đầu đăng sản phẩm đầu tiên
                </button>
              )}
            </div>
          ) : (
            <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                  <tr>
                    <th className="py-4 px-6">Sản phẩm</th>
                    <th className="py-4 px-6">SKU</th>
                    <th className="py-4 px-6">Giá niêm yết</th>
                    <th className="py-4 px-6">Giá khuyến mãi</th>
                    <th className="py-4 px-6">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center p-1">
                            {p.thumbnail ? (
                              <img src={p.thumbnail} alt="" className="w-full h-full object-contain" />
                            ) : (
                              <Package className="w-5 h-5 text-indigo-400" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm">{p.name}</div>
                            <div className="text-[11px] text-slate-400 max-w-xs truncate">{p.shortDescription || 'Chưa có mô tả ngắn'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-mono text-slate-300 font-bold">{p.sku}</td>
                      <td className="py-4 px-6 font-bold text-white">{p.price.toLocaleString('vi-VN')} đ</td>
                      <td className="py-4 px-6 text-emerald-400 font-bold">
                        {p.discountPrice ? `${p.discountPrice.toLocaleString('vi-VN')} đ` : '-'}
                      </td>
                      <td className="py-4 px-6">
                        <button
                          type="button"
                          disabled={togglingProductId === p.id}
                          onClick={() => handleToggleProductStatus(p)}
                          title="Bấm để bật/tắt trạng thái bán hàng"
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all border shadow-sm ${p.status === 'ACTIVE' || !p.status
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-500/50'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20 hover:border-rose-500/50'
                            }`}
                        >
                          {togglingProductId === p.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : p.status === 'ACTIVE' || !p.status ? (
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Ban className="w-3.5 h-3.5 text-rose-400" />
                          )}
                          <span>{p.status === 'ACTIVE' || !p.status ? 'Đang bán' : 'Tạm ngưng'}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: GIẤY TỜ PHÁP LÝ */}
      {activeTab === 'legal' && (
        <div className="glass-panel rounded-3xl border border-slate-800 p-6 text-xs">
          <form onSubmit={handleUpdateLegal} className="space-y-5 max-w-3xl">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
              💡 <strong>Lưu ý:</strong> Khi cập nhật thông tin mã số thuế hoặc số CCCD, gian hàng sẽ tự động chuyển về trạng thái <b>Chờ duyệt</b> để Ban quản trị xác minh lại.
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Loại hình kinh doanh hiện tại</label>
              <div className="font-bold text-white text-sm">
                {store.businessType === 'PERSONAL' ? 'Cá nhân / Hộ kinh doanh' : 'Doanh nghiệp / Công ty'}
              </div>
            </div>

            {store.businessType === 'PERSONAL' ? (
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Số CCCD / CMND *</label>
                <input
                  type="text"
                  required
                  value={legalForm.identityNumber}
                  onChange={(e) => setLegalForm({ ...legalForm, identityNumber: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            ) : (
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">Mã số thuế Doanh nghiệp *</label>
                <input
                  type="text"
                  required
                  value={legalForm.taxCode}
                  onChange={(e) => setLegalForm({ ...legalForm, taxCode: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold shadow-lg shadow-indigo-500/20 transition-all"
              >
                Cập nhật giấy tờ pháp lý
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: ĐỊA CHỈ & KHO HÀNG */}
      {activeTab === 'addresses' && (
        <div className="space-y-4 text-xs">
          <div className="flex justify-between items-center glass-panel p-4 rounded-2xl border border-slate-800">
            <h2 className="font-bold text-white text-sm">Danh sách kho nhận & trả hàng</h2>
            <button
              type="button"
              onClick={() => openAddressModal()}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-xl hover:from-indigo-500 hover:to-violet-500 flex items-center gap-1.5 shadow-lg shadow-indigo-500/20 transition-all"
            >
              <Plus className="w-4 h-4" /> Thêm kho mới
            </button>
          </div>

          {addresses.length === 0 ? (
            <div className="text-center py-12 glass-panel rounded-3xl border border-slate-800 text-slate-400">
              <MapPin className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p>Chưa có địa chỉ kho hàng nào. Vui lòng thêm địa chỉ kho để bàn giao sản phẩm cho Shipper!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map((addr) => (
                <div key={addr.id} className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-3 relative">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-white text-sm">{addr.contactName}</span>
                      {addr.phoneNumber && <span className="text-xs text-slate-400 ml-2">({addr.phoneNumber})</span>}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openAddressModal(addr)}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-slate-300 leading-relaxed">{addr.fullAddress}</p>

                  {/* Badges & Actions */}
                  <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center gap-2 text-[11px]">
                    {addr.isDefault && (
                      <span className="px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-400 font-semibold border border-indigo-500/20">
                        Kho Mặc Định
                      </span>
                    )}
                    {addr.isDefaultPickup && (
                      <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                        Điểm Lấy Hàng
                      </span>
                    )}
                    {addr.isDefaultReturn && (
                      <span className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 font-semibold border border-amber-500/20">
                        Điểm Trả Hàng
                      </span>
                    )}

                    <div className="ml-auto flex items-center gap-2">
                      {!addr.isDefaultPickup && (
                        <button
                          type="button"
                          onClick={() => handleSetDefaultAddress(addr.id, 'pickup')}
                          className="text-indigo-400 hover:underline font-semibold"
                        >
                          Chọn làm Nơi Lấy
                        </button>
                      )}
                      {!addr.isDefaultReturn && (
                        <button
                          type="button"
                          onClick={() => handleSetDefaultAddress(addr.id, 'return')}
                          className="text-amber-400 hover:underline font-semibold"
                        >
                          Chọn làm Nơi Trả
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL ĐĂNG SẢN PHẨM MỚI */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass-panel rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 border border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-indigo-400" /> Đăng sản phẩm mới cho Shop
              </h3>
              <button type="button" onClick={() => setIsProductModalOpen(false)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProductSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Tên sản phẩm *</label>
                  <input
                    type="text"
                    required
                    placeholder="Giày Bóng Đá Nike Mercurial Superfly"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Mã SKU *</label>
                  <input
                    type="text"
                    required
                    placeholder="NIKE-MERC-01"
                    value={productForm.sku}
                    onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-white uppercase focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Danh mục sản phẩm *</label>
                  <select
                    required
                    value={productForm.categoryId}
                    onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Chọn danh mục --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Thương hiệu *</label>
                  <select
                    required
                    value={productForm.brandId}
                    onChange={(e) => setProductForm({ ...productForm, brandId: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Chọn thương hiệu --</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Giá bán niêm yết (VNĐ) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    placeholder="1500000"
                    value={productForm.price || ''}
                    onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Giá khuyến mãi (VNĐ - tùy chọn)</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="1200000"
                    value={productForm.discountPrice || ''}
                    onChange={(e) => setProductForm({ ...productForm, discountPrice: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Mô tả ngắn sản phẩm</label>
                <input
                  type="text"
                  placeholder="Chất liệu cao cấp, đinh TF bám sân tốt..."
                  value={productForm.shortDescription}
                  onChange={(e) => setProductForm({ ...productForm, shortDescription: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Chi tiết nội dung mô tả sản phẩm</label>
                <textarea
                  rows={3}
                  placeholder="Thông tin chi tiết về kích thước, xuất xứ, bảo hành..."
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Ảnh đại diện sản phẩm (Thumbnail)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="https://... hoặc tải từ máy"
                    value={productForm.thumbnail}
                    onChange={(e) => setProductForm({ ...productForm, thumbnail: e.target.value })}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-indigo-500"
                  />
                  <label className="px-3 py-2 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/30 rounded-xl cursor-pointer flex items-center gap-1 font-semibold text-xs transition-all shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    {uploadingProductThumb ? 'Đang tải...' : 'Tải từ máy'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadProductThumb(file);
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 border border-slate-800 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 hover:from-indigo-500 hover:to-violet-500"
                >
                  Đăng Sản Phẩm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL THÊM / SỬA ĐỊA CHỈ KHO */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass-panel rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-800">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingAddress ? 'Chỉnh sửa địa chỉ kho' : 'Thêm mới địa chỉ kho hàng'}
              </h3>
              <button type="button" onClick={() => setIsAddressModalOpen(false)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Tên người / Kho liên hệ *</label>
                <input
                  type="text"
                  required
                  placeholder="Kho Tổng Cầu Giấy / Anh Nam"
                  value={addressForm.contactName}
                  onChange={(e) => setAddressForm({ ...addressForm, contactName: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Số điện thoại liên hệ kho</label>
                <input
                  type="text"
                  placeholder="0987654321"
                  value={addressForm.phoneNumber}
                  onChange={(e) => setAddressForm({ ...addressForm, phoneNumber: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Tỉnh / Thành *</label>
                  <select
                    required
                    onChange={handleProvinceChange}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Chọn --</option>
                    {provinces.map((p) => (
                      <option key={p.code} value={p.code}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Quận / Huyện *</label>
                  <select
                    required
                    onChange={handleDistrictChange}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Chọn --</option>
                    {districts.map((d) => (
                      <option key={d.code} value={d.code}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Phường / Xã *</label>
                  <select
                    required
                    value={wards.find((w) => w.name === addressForm.ward)?.code || ''}
                    onChange={(e) => {
                      const selectedWard = wards.find((w) => String(w.code) === e.target.value);
                      setAddressForm({ ...addressForm, ward: selectedWard ? selectedWard.name : '' });
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Chọn --</option>
                    {wards.map((w) => (
                      <option key={w.code} value={w.code}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Địa chỉ chi tiết (Số nhà, tên đường) *</label>
                <input
                  type="text"
                  required
                  placeholder="123 Đường Cầu Giấy"
                  value={addressForm.addressLine1}
                  onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-2 pt-2">
                <label className="flex items-center gap-2 font-medium text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addressForm.isDefaultPickup}
                    onChange={(e) => setAddressForm({ ...addressForm, isDefaultPickup: e.target.checked })}
                    className="rounded bg-slate-900 border-slate-800 text-indigo-600 focus:ring-indigo-500"
                  />
                  Đặt làm kho lấy hàng mặc định cho Shipper
                </label>

                <label className="flex items-center gap-2 font-medium text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addressForm.isDefaultReturn}
                    onChange={(e) => setAddressForm({ ...addressForm, isDefaultReturn: e.target.checked })}
                    className="rounded bg-slate-900 border-slate-800 text-indigo-600 focus:ring-indigo-500"
                  />
                  Đặt làm điểm nhận hàng trả về mặc định
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="px-4 py-2 border border-slate-800 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 hover:from-indigo-500 hover:to-violet-500"
                >
                  Lưu địa chỉ kho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
