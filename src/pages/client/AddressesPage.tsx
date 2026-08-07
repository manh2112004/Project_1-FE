import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import type { UserAddress } from '../../types';
import { useToastStore } from '../../store/useToastStore';
import { MapPin, Plus, Trash2, Edit2, X, Loader2, Navigation, Map as MapIcon } from 'lucide-react';
import { MapPickerModal } from '../../components/common/MapPickerModal';
import {
  vnLocationService,
  type Province,
  type District,
  type Ward,
  type ReverseGeocodeResult,
} from '../../services/vnLocationService';

export const AddressesPage: React.FC = () => {
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Cascading Vietnam Administrative Units State
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  const [selectedProvinceCode, setSelectedProvinceCode] = useState<string>('');
  const [selectedDistrictCode, setSelectedDistrictCode] = useState<string>('');
  const [selectedWardCode, setSelectedWardCode] = useState<string>('');

  const [isLocatingGPS, setIsLocatingGPS] = useState(false);

  const [formData, setFormData] = useState({
    recipientName: '',
    phoneNumber: '',
    addressLine1: '',
    ward: '',
    district: '',
    city: '',
    country: 'Việt Nam',
    isDefault: false,
  });

  const { addToast } = useToastStore();

  const fetchAddresses = async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      const res = await api.get('/user-addresses/me');
      if (res.data?.success) {
        setAddresses(res.data.data || []);
      }
    } catch (err) {
      console.error('Lỗi lấy sổ địa chỉ:', err);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
    vnLocationService.getProvinces().then((data) => {
      setProvinces(data);
    });
  }, []);

  // Xử lý khi chọn Tỉnh / Thành phố -> Load Quận / Huyện
  const handleProvinceChange = async (provCode: string, provName?: string) => {
    setSelectedProvinceCode(provCode);
    setSelectedDistrictCode('');
    setSelectedWardCode('');
    setDistricts([]);
    setWards([]);

    const foundProv = provName || provinces.find((p) => String(p.code) === String(provCode))?.name || '';
    setFormData((prev) => ({ ...prev, city: foundProv, district: '', ward: '' }));

    if (provCode) {
      const distList = await vnLocationService.getDistricts(provCode);
      setDistricts(distList);
    }
  };

  // Xử lý khi chọn Quận / Huyện -> Load Phường / Xã
  const handleDistrictChange = async (distCode: string, distName?: string) => {
    setSelectedDistrictCode(distCode);
    setSelectedWardCode('');
    setWards([]);

    const foundDist = distName || districts.find((d) => String(d.code) === String(distCode))?.name || '';
    setFormData((prev) => ({ ...prev, district: foundDist, ward: '' }));

    if (distCode) {
      const wardList = await vnLocationService.getWards(distCode);
      setWards(wardList);
    }
  };

  // Xử lý khi chọn Phường / Xã
  const handleWardChange = (wCode: string, wName?: string) => {
    setSelectedWardCode(wCode);
    const foundWard = wName || wards.find((w) => String(w.code) === String(wCode))?.name || '';
    setFormData((prev) => ({ ...prev, ward: foundWard }));
  };

  // Helper chuẩn hóa tiếng Việt loại bỏ dấu và tiền tố hành chính để so sánh chính xác 100%
  const cleanVnString = (str: string = '') => {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase()
      .replace(/(tỉnh|thành phố|tp\.|quận|huyện|thị xã|phường|xã|thị trấn|p\.|q\.|h\.)/gi, '')
      .replace(/[^a-z0-9]/g, '')
      .trim();
  };

  // Hàm ghép khớp thông tin reverse geocode với danh sách Tỉnh/Quận/Xã thực tế
  const applyGeocodeResultToForm = async (geoResult: ReverseGeocodeResult) => {
    const { city: resCity, district: resDistrict, ward: resWard, addressLine1: resAddr1, fullAddress = '' } = geoResult;

    // 1. Set số nhà, tên đường
    setFormData((prev) => ({
      ...prev,
      addressLine1: resAddr1 || prev.addressLine1,
    }));

    const fullAddrClean = cleanVnString(fullAddress);
    const resCityClean = cleanVnString(resCity);
    const resDistClean = cleanVnString(resDistrict);
    const resWardClean = cleanVnString(resWard);

    // 2. Khớp Tỉnh / Thành phố
    const allProv = provinces.length > 0 ? provinces : await vnLocationService.getProvinces();
    let matchedProv = allProv.find((p) => {
      const pClean = cleanVnString(p.name);
      return (
        pClean.length >= 2 &&
        resCityClean.length >= 2 &&
        (pClean === resCityClean || resCityClean.includes(pClean) || pClean.includes(resCityClean))
      );
    });

    if (!matchedProv && fullAddrClean) {
      matchedProv = allProv.find((p) => {
        const pClean = cleanVnString(p.name);
        return pClean.length >= 2 && fullAddrClean.includes(pClean);
      });
    }

    if (matchedProv) {
      setSelectedProvinceCode(String(matchedProv.code));
      setFormData((prev) => ({ ...prev, city: matchedProv.name }));

      // Load danh sách Quận / Huyện thuộc Tỉnh đó
      const distList = await vnLocationService.getDistricts(matchedProv.code);
      setDistricts(distList);

      let matchedDist: District | undefined;
      let matchedWard: Ward | undefined;

      // 3a. Thử khớp Quận / Huyện trực tiếp theo resDistClean
      if (resDistClean && resDistClean.length >= 2) {
        matchedDist = distList.find((d) => {
          const dClean = cleanVnString(d.name);
          return dClean.length >= 2 && (dClean === resDistClean || dClean.includes(resDistClean) || resDistClean.includes(dClean));
        });
      }

      // 3b. Nếu không khớp trực tiếp, quét dClean trong fullAddress
      if (!matchedDist && fullAddrClean) {
        matchedDist = distList.find((d) => {
          const dClean = cleanVnString(d.name);
          return dClean.length >= 2 && fullAddrClean.includes(dClean);
        });
      }

      // 3c. Nếu vẫn chưa tìm thấy Quận, truy quét Phường/Xã trong toàn bộ các Quận thuộc Tỉnh để tìm Quận chứa Phường đó!
      if (!matchedDist && (resWardClean || fullAddrClean)) {
        for (const dist of distList) {
          const wardList = await vnLocationService.getWards(dist.code);
          const foundW = wardList.find((w) => {
            const wClean = cleanVnString(w.name);
            if (!wClean || wClean.length < 2) return false;
            return (
              (resWardClean.length >= 2 && (wClean === resWardClean || wClean.includes(resWardClean) || resWardClean.includes(wClean))) ||
              (fullAddrClean.length >= 2 && fullAddrClean.includes(wClean))
            );
          });
          if (foundW) {
            matchedDist = dist;
            matchedWard = foundW;
            setWards(wardList);
            break;
          }
        }
      }

      // Áp dụng Quận / Huyện khớp được
      if (matchedDist) {
        setSelectedDistrictCode(String(matchedDist.code));
        setFormData((prev) => ({ ...prev, district: matchedDist.name }));

        // Nếu Phường chưa được tìm thấy ở bước 3c, tìm trong wardList của Quận đó
        if (!matchedWard) {
          const wardList = await vnLocationService.getWards(matchedDist.code);
          setWards(wardList);

          if (resWardClean && resWardClean.length >= 2) {
            matchedWard = wardList.find((w) => {
              const wClean = cleanVnString(w.name);
              return wClean.length >= 2 && (wClean === resWardClean || wClean.includes(resWardClean) || resWardClean.includes(wClean));
            });
          }

          if (!matchedWard && (fullAddrClean || resAddr1)) {
            const resAddr1Clean = cleanVnString(resAddr1);
            matchedWard = wardList.find((w) => {
              const wClean = cleanVnString(w.name);
              return (
                wClean.length >= 2 &&
                ((fullAddrClean && fullAddrClean.includes(wClean)) || (resAddr1Clean && resAddr1Clean.includes(wClean)))
              );
            });
          }
        }

        if (matchedWard) {
          const wCode = String(matchedWard.code);
          const wName = matchedWard.name;
          setSelectedWardCode(wCode);
          setFormData((prev) => ({ ...prev, ward: wName }));
        } else {
          setSelectedWardCode('');
          setFormData((prev) => ({ ...prev, ward: resWard || '' }));
        }
      } else {
        setSelectedDistrictCode('');
        setSelectedWardCode('');
        setWards([]);
        setFormData((prev) => ({ ...prev, district: resDistrict || '', ward: resWard || '' }));
      }
    } else {
      setSelectedProvinceCode('');
      setSelectedDistrictCode('');
      setSelectedWardCode('');
      setDistricts([]);
      setWards([]);
      setFormData((prev) => ({
        ...prev,
        city: resCity || '',
        district: resDistrict || '',
        ward: resWard || '',
      }));
    }
  };

  // Nút "Vị trí hiện tại" (Geolocation GPS)
  const handleGetCurrentGPSLocation = () => {
    if (!('geolocation' in navigator)) {
      addToast({
        type: 'error',
        title: 'Không hỗ trợ',
        message: 'Trình duyệt của bạn không hỗ trợ định vị GPS.',
      });
      return;
    }

    setIsLocatingGPS(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const result = await vnLocationService.reverseGeocode(lat, lng);
          await applyGeocodeResultToForm(result);

          addToast({
            type: 'success',
            title: 'Đã lấy vị trí thành công 📍',
            message: `Địa chỉ: ${result.fullAddress || result.addressLine1}`,
          });
        } catch (err) {
          addToast({
            type: 'error',
            title: 'Thất bại',
            message: 'Không thể giải ngược vị trí hiện tại.',
          });
        } finally {
          setIsLocatingGPS(false);
        }
      },
      () => {
        setIsLocatingGPS(false);
        addToast({
          type: 'error',
          title: 'Lỗi định vị GPS',
          message: 'Vui lòng cho phép trình duyệt truy cập vị trí của bạn.',
        });
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setSelectedProvinceCode('');
    setSelectedDistrictCode('');
    setSelectedWardCode('');
    setDistricts([]);
    setWards([]);
    setFormData({
      recipientName: '',
      phoneNumber: '',
      addressLine1: '',
      ward: '',
      district: '',
      city: '',
      country: 'Việt Nam',
      isDefault: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = async (addr: UserAddress) => {
    setEditingId(addr.id);
    setFormData({
      recipientName: addr.recipientName,
      phoneNumber: addr.phoneNumber,
      addressLine1: addr.addressLine1,
      ward: addr.ward || '',
      district: addr.district || '',
      city: addr.city || '',
      country: addr.country || 'Việt Nam',
      isDefault: addr.isDefault,
    });

    // Thử khớp Tỉnh / Quận / Xã từ tên text có sẵn
    const allProv = provinces.length > 0 ? provinces : await vnLocationService.getProvinces();
    const matchedProv = allProv.find((p) => p.name === addr.city);
    if (matchedProv) {
      setSelectedProvinceCode(String(matchedProv.code));
      const distList = await vnLocationService.getDistricts(matchedProv.code);
      setDistricts(distList);

      const matchedDist = distList.find((d) => d.name === addr.district);
      if (matchedDist) {
        setSelectedDistrictCode(String(matchedDist.code));
        const wardList = await vnLocationService.getWards(matchedDist.code);
        setWards(wardList);

        const matchedWard = wardList.find((w) => w.name === addr.ward);
        if (matchedWard) {
          setSelectedWardCode(String(matchedWard.code));
        }
      }
    }

    setIsModalOpen(true);
  };

  const handleSubmitModal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        const res = await api.put(`/user-addresses/${editingId}`, formData);
        if (res.data?.success) {
          addToast({ type: 'success', title: 'Thành công', message: 'Cập nhật địa chỉ thành công.' });
        }
      } else {
        const res = await api.post('/user-addresses', formData);
        if (res.data?.success) {
          addToast({ type: 'success', title: 'Thành công', message: 'Thêm mới địa chỉ thành công.' });
        }
      }
      setIsModalOpen(false);
      fetchAddresses();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Lỗi', message: err.response?.data?.message || 'Thao tác thất bại.' });
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) {
      try {
        const res = await api.delete(`/user-addresses/${id}`);
        if (res.data?.success) {
          addToast({ type: 'info', title: 'Thành công', message: 'Đã xóa địa chỉ.' });
          fetchAddresses();
        }
      } catch (err: any) {
        addToast({ type: 'error', title: 'Lỗi', message: 'Xóa địa chỉ thất bại.' });
      }
    }
  };

  const handleSetDefault = async (id: string) => {
    // Cập nhật giao diện ngay lập tức (Optimistic State Update)
    setAddresses((prev) =>
      prev.map((addr) => ({
        ...addr,
        isDefault: addr.id === id,
      }))
    );

    try {
      const res = await api.patch(`/user-addresses/${id}/default`);
      if (res.data?.success) {
        addToast({ type: 'success', title: 'Thành công', message: 'Đã thiết lập địa chỉ mặc định.' });
        fetchAddresses(false);
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Lỗi', message: 'Thiết lập địa chỉ mặc định thất bại.' });
      fetchAddresses(false);
    }
  };

  return (
    <div className="space-y-8 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Sổ Địa Chỉ Giao Hàng</h1>
          <p className="text-xs text-slate-400 mt-1">Quản lý danh sách địa chỉ nhận hàng để thanh toán nhanh chóng</p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" /> Thêm Địa Chỉ Mới
        </button>
      </div>

      {isLoading ? (
        <div className="min-h-[30vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : addresses.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl text-center space-y-3 border border-slate-800 max-w-md mx-auto">
          <MapPin className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-xs text-slate-400">Bạn chưa thêm địa chỉ nhận hàng nào.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`glass-panel p-6 rounded-3xl border transition-all space-y-3 flex flex-col justify-between ${addr.isDefault ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-800'
                }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-white">{addr.recipientName}</span>
                  {addr.isDefault ? (
                    <span className="text-[10px] font-extrabold text-indigo-400 bg-indigo-500/20 px-2.5 py-0.5 rounded-full border border-indigo-500/30">
                      Mặc định
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSetDefault(addr.id)}
                      className="text-[10px] font-semibold text-slate-400 hover:text-indigo-400 transition-colors"
                    >
                      Thiết lập mặc định
                    </button>
                  )}
                </div>

                <p className="text-xs text-slate-300">SĐT: {addr.phoneNumber}</p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {[addr.addressLine1, addr.ward, addr.district, addr.city, addr.country].filter(Boolean).join(', ')}
                </p>
              </div>

              <div className="flex justify-end items-center gap-2 pt-3 border-t border-slate-800/80">
                <button
                  onClick={() => handleOpenEditModal(addr)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all text-xs flex items-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Sửa
                </button>
                <button
                  onClick={() => handleDelete(addr.id)}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all text-xs flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl max-w-xl w-full border border-slate-800 space-y-4 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">
                {editingId ? 'Cập Nhật Địa Chỉ' : 'Thêm Địa Chỉ Mới'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Thanh Nút Tiện Ích: Vị trí hiện tại & Chọn từ Bản đồ */}
            <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-indigo-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-400" /> Tự động điền vị trí:
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isLocatingGPS}
                  onClick={handleGetCurrentGPSLocation}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50"
                >
                  {isLocatingGPS ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Navigation className="w-3.5 h-3.5" />
                  )}
                  <span>Vị trí hiện tại</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsMapModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-indigo-400 text-indigo-300 font-bold text-[11px] flex items-center gap-1.5 transition-all"
                >
                  <MapIcon className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Bản đồ</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmitModal} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Tên người nhận</label>
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn A"
                    value={formData.recipientName}
                    onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    required
                    placeholder="0901234567"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Địa chỉ (Số nhà, Tên đường)</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: 123 Nguyễn Huệ, Tòa nhà Bitexco"
                  value={formData.addressLine1}
                  onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Dynamic Cascading Dropdowns từ dữ liệu thực tế 63 Tỉnh/Thành Việt Nam */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Select Phường / Xã */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Phường / Xã</label>
                  {wards.length > 0 ? (
                    <select
                      value={selectedWardCode}
                      onChange={(e) => {
                        const code = e.target.value;
                        const item = wards.find((w) => String(w.code) === code);
                        handleWardChange(code, item?.name);
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">-- Chọn Phường/Xã --</option>
                      {wards.map((w) => (
                        <option key={w.code} value={w.code}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      placeholder="Phường/Xã"
                      value={formData.ward}
                      onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-white placeholder-slate-500"
                    />
                  )}
                </div>

                {/* Select Quận / Huyện */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Quận / Huyện</label>
                  {districts.length > 0 ? (
                    <select
                      value={selectedDistrictCode}
                      onChange={(e) => {
                        const code = e.target.value;
                        const item = districts.find((d) => String(d.code) === code);
                        handleDistrictChange(code, item?.name);
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">-- Chọn Quận/Huyện --</option>
                      {districts.map((d) => (
                        <option key={d.code} value={d.code}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      placeholder="Quận/Huyện"
                      value={formData.district}
                      onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-white placeholder-slate-500"
                    />
                  )}
                </div>

                {/* Select Tỉnh / Thành phố */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Tỉnh / Thành phố</label>
                  <select
                    value={selectedProvinceCode}
                    onChange={(e) => {
                      const code = e.target.value;
                      const item = provinces.find((p) => String(p.code) === code);
                      handleProvinceChange(code, item?.name);
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Chọn Tỉnh/Thành --</option>
                    {provinces.map((p) => (
                      <option key={p.code} value={p.code}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="rounded border-slate-800 text-indigo-600 focus:ring-0"
                />
                <label htmlFor="isDefault" className="text-xs text-slate-300">
                  Đặt làm địa chỉ mặc định
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/25"
                >
                  {editingId ? 'Lưu Cập Nhật' : 'Tạo Mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Interactive Map Picker Modal */}
      <MapPickerModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        onConfirm={(res) => {
          applyGeocodeResultToForm(res);
          addToast({
            type: 'success',
            title: 'Đã chọn vị trí từ Bản đồ 🗺️',
            message: `Địa chỉ: ${res.fullAddress || res.addressLine1}`,
          });
        }}
      />
    </div>
  );
};
