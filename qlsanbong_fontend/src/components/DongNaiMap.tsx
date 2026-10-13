"use client";

import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink, Navigation, ShieldCheck, MapPin } from 'lucide-react';

interface DongNaiMapProps {
  linkMap?: string;
  className?: string;
  isDarkMode?: boolean;
  diaChi?: string;
  tenTrungTam?: string;
}

// Tọa độ giới hạn hành chính Tỉnh Đồng Nai
// [Nam, Tây] đến [Bắc, Đông]
const DONG_NAI_BOUNDS: [[number, number], [number, number]] = [
  [10.55, 106.65], // Tây Nam: Giáp ranh Nhơn Trạch / TP.HCM / Long An
  [11.60, 107.75]  // Đông Bắc: Rừng Cát Tiên / Tân Phú / Xuân Lộc giáp Bình Thuận
];

// Hàm bóc tách tọa độ kinh độ & vĩ độ từ đường link Google Maps nếu có
const extractCoordinates = (url?: string | null): [number, number] => {
  if (!url) return [10.952591, 106.802762];
  try {
    // Kiểu 1: !2d106.802762!3d10.952591
    const matchPb = url.match(/!2d([0-9.]+)!3d([0-9.]+)/);
    if (matchPb) {
      return [parseFloat(matchPb[2]), parseFloat(matchPb[1])];
    }
    // Kiểu 2: @10.952591,106.802762
    const matchAt = url.match(/@([0-9.]+),([0-9.]+)/);
    if (matchAt) {
      return [parseFloat(matchAt[1]), parseFloat(matchAt[2])];
    }
    // Kiểu 3: q=10.952591,106.802762
    const matchQ = url.match(/q=([0-9.]+),([0-9.]+)/);
    if (matchQ) {
      return [parseFloat(matchQ[1]), parseFloat(matchQ[2])];
    }
  } catch (_e) {}
  // Mặc định: Vị trí trung tâm TP. Biên Hòa, Đồng Nai
  return [10.952591, 106.802762];
};

export default function DongNaiMap({
  linkMap,
  className = "w-full h-full",
  isDarkMode = true,
  diaChi = "Biên Hòa - Đồng Nai",
  tenTrungTam = "Trung Tâm Thể Thao Soccer247"
}: DongNaiMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [coords, setCoords] = useState<[number, number]>([10.952591, 106.802762]);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    const extracted = extractCoordinates(linkMap);
    setCoords(extracted);
  }, [linkMap]);

  useEffect(() => {
    let isMounted = true;

    const initMap = async () => {
      if (!mapContainerRef.current) return;

      // Xóa instance cũ nếu đã tồn tại để tránh leak hoặc lỗi container
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      try {
        const L = await import('leaflet');
        if (!isMounted || !mapContainerRef.current) return;

        // Tạo bản đồ với giới hạn thu nhỏ nghiêm ngặt trong Tỉnh Đồng Nai
        const map = L.map(mapContainerRef.current, {
          center: coords,
          zoom: 13,
          minZoom: 10, // GIỚI HẠN THU NHỎ: Không thể thu nhỏ nhỏ hơn tỉnh Đồng Nai
          maxZoom: 18, // Cho phép phóng to tối đa để xem sân bóng và đường phố
          maxBounds: DONG_NAI_BOUNDS, // GIỚI HẠN PHẠM VI: Toàn bộ tỉnh Đồng Nai
          maxBoundsViscosity: 1.0, // Chống cuộn ra ngoài tỉnh (độ cản 100% giữ nguyên trong tỉnh)
          zoomControl: false // Chúng ta dùng custom zoom control hoặc đặt góc thuận tiện
        });

        // Đặt zoom control ở góc dưới bên phải
        L.control.zoom({ position: 'bottomright' }).addTo(map);

        // Lớp bản đồ OpenStreetMap chất lượng cao hiển thị chi tiết tên đường tiếng Việt
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap',
          maxZoom: 19
        }).addTo(map);

        // Marker vị trí sân bóng với icon trái bóng đẹp mắt
        const soccerIcon = L.divIcon({
          className: 'custom-soccer-marker',
          html: `
            <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; cursor: pointer;">
              <span style="position: absolute; width: 40px; height: 40px; background: rgba(16, 185, 129, 0.4); border-radius: 50%; animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;"></span>
              <div style="position: relative; width: 34px; height: 34px; background: #059669; border: 2.5px solid #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(0,0,0,0.5);">
                <span style="font-size: 18px; line-height: 1;">⚽</span>
              </div>
            </div>
          `,
          iconSize: [44, 44],
          iconAnchor: [22, 22],
          popupAnchor: [0, -22]
        });

        const marker = L.marker(coords, { icon: soccerIcon }).addTo(map);

        // Popup thông tin sân
        const googleMapsDirectUrl = `https://www.google.com/maps/search/?api=1&query=${coords[0]},${coords[1]}`;
        const popupContent = `
          <div style="text-align: center; font-family: system-ui, sans-serif; padding: 6px; min-width: 170px;">
            <div style="font-weight: 800; font-size: 13px; color: #047857; margin-bottom: 2px;">${tenTrungTam}</div>
            <div style="font-size: 11px; color: #475569; margin-bottom: 8px;">${diaChi}</div>
            <a href="${googleMapsDirectUrl}" target="_blank" rel="noreferrer" 
               style="display: inline-block; padding: 5px 12px; background: #059669; color: #ffffff; border-radius: 8px; font-size: 11px; font-weight: 700; text-decoration: none; box-shadow: 0 2px 6px rgba(5, 150, 105, 0.3);">
              Chỉ đường trên Google Maps ↗
            </a>
          </div>
        `;
        marker.bindPopup(popupContent);

        mapInstanceRef.current = map;
        setIsLoaded(true);

        // Fix render sau khi DOM sẵn sàng
        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
          }
        }, 200);
      } catch (err) {
        console.error('Lỗi khởi tạo bản đồ Đồng Nai:', err);
      }
    };

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [coords, tenTrungTam, diaChi]);

  // Nút trở về vị trí sân
  const handleResetToField = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(coords, 14, { duration: 1 });
    }
  };

  const googleMapsUrl = linkMap && linkMap.startsWith('http') 
    ? linkMap 
    : `https://www.google.com/maps/search/?api=1&query=${coords[0]},${coords[1]}`;

  return (
    <div className={`relative w-full h-full overflow-hidden select-none isolate ${className}`}>
      {/* Vùng chứa bản đồ Leaflet */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-full z-0" 
        style={{ background: isDarkMode ? '#0f172a' : '#f8fafc' }}
      />

      {/* Huy hiệu thông báo phạm vi bản đồ */}
      <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/85 backdrop-blur-md border border-emerald-500/30 text-[10px] text-emerald-300 font-bold shadow-lg pointer-events-none">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span>Khu vực: Tỉnh Đồng Nai (Đã khóa phạm vi)</span>
      </div>

      {/* Các nút tiện ích trên bản đồ */}
      <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-2">
        <button
          type="button"
          onClick={handleResetToField}
          title="Đưa bản đồ về vị trí sân bóng"
          className="px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-emerald-600 text-white text-[11px] font-semibold border border-slate-700 hover:border-emerald-500 shadow-md transition-all flex items-center gap-1 backdrop-blur-md"
        >
          <Navigation className="w-3 h-3 text-emerald-400 hover:text-white" />
          <span>Vị trí sân</span>
        </button>

        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noreferrer"
          title="Mở trên ứng dụng Google Maps"
          className="px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-emerald-600 text-white text-[11px] font-semibold border border-slate-700 hover:border-emerald-500 shadow-md transition-all flex items-center gap-1 backdrop-blur-md"
        >
          <span>Google Maps</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
