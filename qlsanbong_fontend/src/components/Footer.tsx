import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Phone, Mail, MapPin } from 'lucide-react';
import { useAppTheme } from '@/hooks/useAppTheme';
import { contentService, AboutUsData } from '@/services/contentService';

// SoccerBall Icon SVG chuẩn màu đen trắng đồng bộ toàn bộ trang web
const SoccerBallIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="9.5" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.5" />
    <polygon points="12,7.5 15.5,10 14.2,14 9.8,14 8.5,10" fill="#0F172A" stroke="#0F172A" strokeWidth="0.5" />
    <line x1="12" y1="7.5" x2="12" y2="2.5" stroke="#0F172A" strokeWidth="1.3" />
    <line x1="15.5" y1="10" x2="20.5" y2="8" stroke="#0F172A" strokeWidth="1.3" />
    <line x1="14.2" y1="14" x2="18" y2="19" stroke="#0F172A" strokeWidth="1.3" />
    <line x1="9.8" y1="14" x2="6" y2="19" stroke="#0F172A" strokeWidth="1.3" />
    <line x1="8.5" y1="10" x2="3.5" y2="8" stroke="#0F172A" strokeWidth="1.3" />
    <path d="M9.5 2.8C10.3 2.6 11.1 2.5 12 2.5C12.9 2.5 13.7 2.6 14.5 2.8L13.8 5.5L10.2 5.5L9.5 2.8Z" fill="#0F172A" />
    <path d="M21.2 9.5C21.4 10.3 21.5 11.1 21.5 12C21.5 12.8 21.4 13.5 21.2 14.3L18.5 13L18.5 11L21.2 9.5Z" fill="#0F172A" />
    <path d="M2.8 9.5L5.5 11L5.5 13L2.8 14.3C2.6 13.5 2.5 12.8 2.5 12C2.5 11.1 2.6 10.3 2.8 9.5Z" fill="#0F172A" />
    <path d="M14.5 21.2C13.7 21.4 12.9 21.5 12 21.5C11.1 21.5 10.3 21.4 9.5 21.2L10.2 18.5L13.8 18.5L14.5 21.2Z" fill="#0F172A" />
  </svg>
);

// Hàm tự động bóc tách link src chuẩn từ mã iframe hoặc đường dẫn URL
const extractMapSrc = (raw: string | undefined | null): string => {
  if (!raw) {
    return 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d125397.66986427306!2d106.74558239014159!3d10.950005799999998!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3174d95267b2d5cb%3A0xbcf4a755a9b736b0!2zVHAuIEJpw6puIEjDsmEsIMSQ4buTbmcgTmFp!5e0!3m2!1svi!2s!5m2!1svi!2s';
  }
  const trimmed = raw.trim();
  const match = trimmed.match(/src=["']([^"']+)["']/i);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
};

export default function Footer() {
  const { isDarkMode } = useAppTheme(true);
  const [aboutData, setAboutData] = useState<AboutUsData | null>(null);

  useEffect(() => {
    let isMounted = true;
    contentService.getAboutUs()
      .then((res) => {
        if (isMounted && res?.success && res.data) {
          setAboutData(res.data);
        }
      })
      .catch((err) => {
        console.warn('Footer getAboutUs error:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const tenTrungTam = aboutData?.ten_trung_tam || 'SOCCER247';
  const gioiThieu = aboutData?.gioi_thieu_ngan || 'Trung tâm thể thao đa năng hiện đại. Toàn bộ quy trình đặt sân, tính giá và thanh toán được quản lý tự động bởi hệ thống Soccer247.';
  const hotline = aboutData?.hotline || '0816344504';
  const email = aboutData?.email || 'sinhvienxoan@gmail.com';
  const diaChi = aboutData?.dia_chi || 'Biên Hòa - Đồng Nai';
  const linkMap = extractMapSrc(aboutData?.link_map);

  return (
    <footer id="chinh-sach-lien-he" className={`border-t pt-16 pb-12 transition-colors duration-300 ${
      isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-900 text-slate-100 border-slate-800'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pb-16 border-b border-slate-800/80">
          
          {/* Cột 1: Thông tin thương hiệu & Liên hệ */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                <SoccerBallIcon className="w-6 h-6" />
              </div>
              <span className="text-2xl font-black text-white tracking-wide">
                {tenTrungTam.toUpperCase().includes('SOCCER') ? (
                  <>
                    {tenTrungTam.split(/(247)/i)[0]}
                    <span className="text-emerald-400">247</span>
                  </>
                ) : (
                  tenTrungTam
                )}
              </span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-lg">
              {gioiThieu}
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs text-slate-400">Hotline đặt sân:</div>
                  <a href={`tel:${hotline}`} className="font-bold text-white text-base font-mono hover:text-emerald-400 transition-colors">
                    {hotline}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm text-slate-300">
                <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs text-slate-400">Email:</div>
                  <a href={`mailto:${email}`} className="font-bold text-white hover:text-emerald-400 transition-colors">
                    {email}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm text-slate-300">
                <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs text-slate-400">Địa chỉ cụm sân:</div>
                  <div className="font-bold text-white">{diaChi}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Cột 2: Bản đồ Google Maps */}
          <div className="lg:col-span-6 space-y-4">
            <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-400" />
              Bản Đồ Vị Trí Cụm Sân
            </h3>
            <div className="w-full h-56 rounded-2xl overflow-hidden border border-slate-800 shadow-xl relative bg-slate-900">
              <iframe
                title="Bản đồ Soccer247"
                src={linkMap}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                className="w-full h-full grayscale contrast-125 opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
              />
            </div>
          </div>

        </div>

        {/* Bản quyền & Điều hướng liên quan */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© 2026 {tenTrungTam}. Đặt Sân Thể Thao Nhanh Chóng & Chuyên Nghiệp.</p>
          <div className="flex items-center gap-6">
            <Link href="/about-us" className="hover:text-emerald-400 transition-colors">Giới thiệu</Link>
            <Link href="/tin-tuc" className="hover:text-emerald-400 transition-colors">Tin tức & Sự kiện</Link>
            <Link href="/lien-he" className="hover:text-emerald-400 transition-colors">Gửi phản hồi</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
