import axios from 'axios';

export interface Province {
  code: number | string;
  name: string;
}

export interface District {
  code: number | string;
  name: string;
  provinceCode?: number | string;
}

export interface Ward {
  code: number | string;
  name: string;
  districtCode?: number | string;
}

export interface ReverseGeocodeResult {
  addressLine1: string;
  ward?: string;
  district?: string;
  city?: string;
  fullAddress?: string;
  lat?: number;
  lng?: number;
}

// Open API cho Tỉnh/Thành Việt Nam
const API_BASE = 'https://provinces.open-api.vn/api';

// Cache trong bộ nhớ để load siêu nhanh
let cachedProvinces: Province[] | null = null;
const cachedDistrictsMap = new Map<string, District[]>();
const cachedWardsMap = new Map<string, Ward[]>();

export const vnLocationService = {
  // Lấy danh sách 63 Tỉnh/Thành phố
  async getProvinces(): Promise<Province[]> {
    if (cachedProvinces && cachedProvinces.length > 0) {
      return cachedProvinces;
    }
    try {
      const res = await axios.get(`${API_BASE}/p/`);
      const data = res.data.map((item: any) => ({
        code: item.code,
        name: item.name,
      }));
      cachedProvinces = data;
      return data;
    } catch (err) {
      console.warn('Lỗi kết nối Open API Tỉnh/Thành, sử dụng dữ liệu dự phòng.', err);
      return FALLBACK_PROVINCES;
    }
  },

  // Lấy danh sách Quận/Huyện theo Mã Tỉnh/Thành
  async getDistricts(provinceCode: number | string): Promise<District[]> {
    const key = String(provinceCode);
    if (cachedDistrictsMap.has(key)) {
      return cachedDistrictsMap.get(key)!;
    }
    try {
      const res = await axios.get(`${API_BASE}/p/${provinceCode}?depth=2`);
      const districts = (res.data.districts || []).map((item: any) => ({
        code: item.code,
        name: item.name,
        provinceCode,
      }));
      cachedDistrictsMap.set(key, districts);
      return districts;
    } catch (err) {
      console.warn('Lỗi lấy Quận/Huyện từ Open API.', err);
      return [];
    }
  },

  // Lấy danh sách Phường/Xã theo Mã Quận/Huyện
  async getWards(districtCode: number | string): Promise<Ward[]> {
    const key = String(districtCode);
    if (cachedWardsMap.has(key)) {
      return cachedWardsMap.get(key)!;
    }
    try {
      const res = await axios.get(`${API_BASE}/d/${districtCode}?depth=2`);
      const wards = (res.data.wards || []).map((item: any) => ({
        code: item.code,
        name: item.name,
        districtCode,
      }));
      cachedWardsMap.set(key, wards);
      return wards;
    } catch (err) {
      console.warn('Lỗi lấy Phường/Xã từ Open API.', err);
      return [];
    }
  },

  // Giải ngược tọa độ GPS (lat, lng) sang tên Địa chỉ thực tế (Nominatim OpenStreetMap)
  async reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult> {
    try {
      const res = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=vi`
      );

      const addr = res.data?.address || {};
      const houseNumber = addr.house_number || '';
      const road = addr.road || addr.street || addr.pedestrian || '';
      
      // Ghép đường/số nhà
      const addressLine1 = [houseNumber, road].filter(Boolean).join(' ').trim() || addr.amenity || addr.building || 'Địa chỉ chọn từ bản đồ';

      // Xử lý Phường / Xã
      const ward = addr.ward || addr.suburb || addr.quarter || addr.neighbourhood || addr.village || '';

      // Xử lý Quận / Huyện
      const district = addr.district || addr.city_district || addr.county || addr.town || '';

      // Xử lý Tỉnh / Thành phố
      const city = addr.city || addr.state || addr.province || '';

      return {
        addressLine1,
        ward,
        district,
        city,
        fullAddress: res.data?.display_name || '',
        lat,
        lng,
      };
    } catch (err) {
      console.error('Lỗi Reverse Geocoding:', err);
      return {
        addressLine1: 'Vị trí đã chọn',
        lat,
        lng,
      };
    }
  },
};

// Dữ liệu dự phòng siêu tốc nếu mất mạng
const FALLBACK_PROVINCES: Province[] = [
  { code: 1, name: 'Thành phố Hà Nội' },
  { code: 79, name: 'Thành phố Hồ Chí Minh' },
  { code: 48, name: 'Thành phố Đà Nẵng' },
  { code: 31, name: 'Thành phố Hải Phòng' },
  { code: 92, name: 'Thành phố Cần Thơ' },
  { code: 46, name: 'Tỉnh Thừa Thiên Huế' },
  { code: 60, name: 'Tỉnh Đồng Nai' },
  { code: 74, name: 'Tỉnh Bình Dương' },
  { code: 77, name: 'Tỉnh Bà Rịa - Vũng Tàu' },
  { code: 68, name: 'Tỉnh Lâm Đồng' },
];
