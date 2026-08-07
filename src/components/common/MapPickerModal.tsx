import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { X, MapPin, Search, Navigation, Check, Loader2 } from 'lucide-react';
import { vnLocationService, type ReverseGeocodeResult } from '../../services/vnLocationService';

// Fix icon mặc định của Leaflet khi build bundler Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (result: ReverseGeocodeResult) => void;
  initialLat?: number;
  initialLng?: number;
}

interface SuggestionItem {
  display_name: string;
  lat: string;
  lon: string;
}

export const MapPickerModal: React.FC<MapPickerModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  initialLat = 10.7769, // Tọa độ mặc định HCM (hoặc Hà Nội 21.0285)
  initialLng = 106.7009,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>({
    lat: initialLat,
    lng: initialLng,
  });
  const [selectedAddress, setSelectedAddress] = useState<ReverseGeocodeResult | null>(null);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Gợi ý tìm kiếm tự động (Autocomplete Suggestions)
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  // Load Reverse Geocode cho tọa độ ban đầu
  const updateAddressForCoords = async (lat: number, lng: number) => {
    try {
      setIsLoadingAddress(true);
      setCurrentCoords({ lat, lng });
      const result = await vnLocationService.reverseGeocode(lat, lng);
      setSelectedAddress(result);
    } catch (err) {
      console.error('Lỗi lấy thông tin vị trí:', err);
    } finally {
      setIsLoadingAddress(false);
    }
  };

  // Debounced Autocomplete Search gợi ý khi gõ
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsLoadingSuggestions(true);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            searchQuery.trim() + ', Việt Nam'
          )}&limit=5&accept-language=vi`
        );
        const data = await res.json();
        if (data && Array.isArray(data)) {
          setSuggestions(data);
          setShowSuggestions(true);
        }
      } catch (err) {
        console.error('Lỗi lấy gợi ý tìm kiếm:', err);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click ra ngoài để ẩn bảng gợi ý
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    // Khởi tạo Leaflet Map nếu chưa có
    if (!mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [currentCoords.lat, currentCoords.lng],
        zoom: 15,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Thêm Marker có thể kéo rơ (draggable)
      const marker = L.marker([currentCoords.lat, currentCoords.lng], {
        draggable: true,
      }).addTo(map);

      marker.on('dragend', () => {
        const position = marker.getLatLng();
        updateAddressForCoords(position.lat, position.lng);
      });

      // Lắng nghe sự kiện click trực tiếp lên bản đồ
      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        updateAddressForCoords(lat, lng);
        setShowSuggestions(false);
      });

      mapRef.current = map;
      markerRef.current = marker;

      // Lấy thông tin địa chỉ đầu tiên
      updateAddressForCoords(currentCoords.lat, currentCoords.lng);
    } else {
      mapRef.current.invalidateSize();
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [isOpen]);

  // Chọn 1 gợi ý từ bảng Đề Xuất
  const handleSelectSuggestion = (item: SuggestionItem) => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    setSearchQuery(item.display_name.split(',')[0]);
    setShowSuggestions(false);

    if (mapRef.current && markerRef.current) {
      mapRef.current.setView([lat, lon], 16);
      markerRef.current.setLatLng([lat, lon]);
      updateAddressForCoords(lat, lon);
    }
  };

  // Tìm kiếm thủ công khi bấm Enter hoặc nút Tìm kiếm
  const handleSearchLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setShowSuggestions(false);
    try {
      setIsSearching(true);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery.trim() + ', Việt Nam'
        )}&limit=1&accept-language=vi`
      );
      const data = await res.json();

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);

        if (mapRef.current && markerRef.current) {
          mapRef.current.setView([lat, lon], 16);
          markerRef.current.setLatLng([lat, lon]);
          updateAddressForCoords(lat, lon);
        }
      }
    } catch (err) {
      console.error('Lỗi tìm kiếm vị trí:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Định vị Vị trí GPS hiện tại trên bản đồ
  const handleFlyToGPS = () => {
    setShowSuggestions(false);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          if (mapRef.current && markerRef.current) {
            mapRef.current.setView([lat, lng], 17);
            markerRef.current.setLatLng([lat, lng]);
            updateAddressForCoords(lat, lng);
          }
        },
        () => {
          alert('Không thể truy cập GPS vị trí thiết bị. Vui lòng cho phép quyền truy cập vị trí trong trình duyệt.');
        }
      );
    }
  };

  const handleConfirmSelect = () => {
    if (selectedAddress) {
      onConfirm(selectedAddress);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="glass-panel w-full max-w-3xl rounded-3xl border border-slate-800 shadow-2xl flex flex-col h-[85vh] max-h-[700px] overflow-hidden animate-fade-in relative">
        {/* Header Modal */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 flex items-center justify-center text-indigo-400 border border-indigo-500/30">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white tracking-tight">Chọn Vị Trí Giao Hàng Trên Bản Đồ</h3>
              <p className="text-[11px] text-slate-400">Click hoặc kéo thả ghim màu đỏ để chọn vị trí chính xác</p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thanh Tìm Kiếm Vị Trí & Bảng Đề Xuất Autocomplete */}
        <div className="p-3 bg-slate-950/90 border-b border-slate-800 flex items-center gap-2 shrink-0 z-20 relative">
          <div ref={searchContainerRef} className="flex-1 relative">
            <form onSubmit={handleSearchLocation} className="relative flex items-center">
              <input
                type="text"
                placeholder="Nhập tên địa danh, tòa nhà, con đường..."
                value={searchQuery}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-20 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3" />
              <button
                type="submit"
                disabled={isSearching}
                className="absolute right-1 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold transition-all disabled:opacity-50"
              >
                {isSearching || isLoadingSuggestions ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Tìm kiếm'}
              </button>
            </form>

            {/* Bảng Đề Xuất Autocomplete Menu Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 backdrop-blur-xl divide-y divide-slate-800/60 max-h-60 overflow-y-auto animate-fade-in">
                {suggestions.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSuggestion(item)}
                    className="w-full p-3 text-left hover:bg-indigo-600/20 transition-all flex items-start gap-2.5 group"
                  >
                    <MapPin className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white group-hover:text-indigo-300 truncate">
                        {item.display_name.split(',')[0]}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {item.display_name}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleFlyToGPS}
            title="Định vị GPS vị trí của tôi"
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500 hover:bg-indigo-600/10 text-indigo-400 text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Vị trí của tôi</span>
          </button>
        </div>

        {/* Container chứa Bản Đồ Leaflet */}
        <div className="flex-1 w-full relative">
          <div ref={mapContainerRef} className="w-full h-full z-0" />
        </div>

        {/* Footer Hiển thị Địa chỉ đã chọn & Nút Xác Nhận */}
        <div className="p-4 bg-slate-900/90 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-start gap-2.5 min-w-0 w-full sm:w-auto flex-1">
            <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-slate-400 block">Địa chỉ được chọn:</span>
              {isLoadingAddress ? (
                <div className="flex items-center gap-1.5 text-xs text-indigo-400 animate-pulse mt-0.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang truy xuất thông tin địa chỉ...</span>
                </div>
              ) : (
                <p className="text-xs font-semibold text-white truncate max-w-xl">
                  {selectedAddress?.fullAddress || selectedAddress?.addressLine1 || 'Chưa chọn vị trí'}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-800 transition-all"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              disabled={isLoadingAddress || !selectedAddress}
              onClick={handleConfirmSelect}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>Xác Nhận Vị Trí</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
