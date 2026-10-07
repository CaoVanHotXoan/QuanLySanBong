"use client";

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  ShieldCheck, 
  MapPin, 
  Phone, 
  Mail, 
  Award, 
  Zap, 
  Users, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  Coffee, 
  Shirt, 
  LandPlot,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import HeaderNav from '@/components/HeaderNav';
import Footer from '@/components/Footer';
import { useAppTheme } from '@/hooks/useAppTheme';
import { contentService, AboutUsData } from '@/services/contentService';
import SoccerLoader from '@/components/SoccerLoader';

export default function AboutUsPage() {
  const { isDarkMode } = useAppTheme(true);
  const [aboutData, setAboutData] = useState<AboutUsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchAboutInfo();
  }, []);

  const fetchAboutInfo = async () => {
    setIsLoading(true);
    try {
      const res = await contentService.getAboutUs();
      if (res?.success && res.data) {
        setAboutData(res.data);
      } else {
        setAboutData({
          ten_trung_tam: 'Trung Tâm Thể Thao Soccer247',
          hotline: '0816344504',
          email: 'sinhvienxoan@gmail.com',
          dia_chi: 'Biên Hòa - Đồng Nai',
          link_map: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d125397.66986427306!2d106.74558239014159!3d10.950005799999998!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3174d95267b2d5cb%3A0xbcf4a755a9b736b0!2zVHAuIEJpw6puIEjDsmEsIMSQ4buTbmcgTmFp!5e0!3m2!1svi!2s!5m2!1svi!2s',
          gioi_thieu_ngan: 'Trung tâm thể thao đa năng hiện đại hàng đầu khu vực với hệ thống sân bóng cỏ nhân tạo đạt chuẩn FIFA, hệ thống chiếu sáng LED chống lóa và dịch vụ tiện ích khép kín.',
          bai_viet_about_us: 'Soccer247 ra đời với sứ mệnh mang đến không gian thể thao chuyên nghiệp, hiện đại và tiện lợi nhất cho cộng đồng yêu bóng đá. Chúng tôi trang bị mặt cỏ sợi kim cương cao cấp nhập khẩu, hệ thống thoát nước ngầm tiêu chuẩn, giàn đèn LED công suất cao cùng khu vực căn tin phục vụ giải khát tiện nghi. Hệ thống đặt sân trực tuyến 24/7 giúp khách hàng chủ động chọn sân, giờ đá và thanh toán tự động qua mã QR chỉ trong vài giây.',
          link_facebook: 'https://facebook.com/soccer247',
          link_zalo: 'https://zalo.me/0816344504'
        });
      }
    } catch (e) {
      console.warn('Lỗi lấy About Us:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: <Award className="w-6 h-6 text-emerald-400" />,
      title: 'Mặt Cỏ Đạt Chuẩn FIFA',
      desc: 'Sợi cỏ kim cương đàn hồi cao cấp nhập khẩu, êm ái, chống trơn trượt và giảm thiểu chấn thương dây chằng.'
    },
    {
      icon: <Zap className="w-6 h-6 text-emerald-400" />,
      title: 'Hệ Thống Đèn LED Chống Chói',
      desc: 'Dàn đèn LED chuẩn thi đấu quốc tế phân bổ ánh sáng đồng đều mọi góc sân, đá đêm sắc nét như ban ngày.'
    },
    {
      icon: <Clock className="w-6 h-6 text-emerald-400" />,
      title: 'Đặt Sân Online 24/7 Tức Thì',
      desc: 'Xem lịch trống theo thời gian thực và thanh toán chuyển khoản quét mã QR MB Bank tự động 100% không cần chờ đợi.'
    },
    {
      icon: <Coffee className="w-6 h-6 text-emerald-400" />,
      title: 'Dịch Vụ Tiện Ích Trọn Gói',
      desc: 'Căn tin giải khát, nước điện giải ướp lạnh, cho thuê áo pitch thi đấu, giày và găng tay thủ môn chuyên nghiệp.'
    }
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 font-sans ${
      isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      <Head>
        <title>Về Chúng Tôi | About Us - Soccer247</title>
        <meta name="description" content="Giới thiệu về Trung tâm thể thao Soccer247 - Hệ thống sân bóng đá cỏ nhân tạo hiện đại" />
      </Head>

      <HeaderNav activeTab="about" />

      <main className="pt-20 md:pt-28 pb-20">

        {/* GIỚI THIỆU CHI TIẾT & HÌNH ẢNH */}
        <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Cột trái: Nội dung giới thiệu */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
                <LandPlot className="w-4 h-4" />
                Về Chúng Tôi
              </div>
              <h2 className="text-2xl sm:text-4xl font-black leading-tight">
                {aboutData?.ten_trung_tam || 'Trung Tâm Thể Thao Soccer247'}
              </h2>
              <div className={`text-sm sm:text-base leading-relaxed space-y-4 whitespace-pre-line ${
                isDarkMode ? 'text-slate-300' : 'text-slate-600'
              }`}>
                <p>
                  {aboutData?.bai_viet_about_us || aboutData?.gioi_thieu_ngan}
                </p>
              </div>

              {/* Thông tin nhanh */}
              <div className={`grid grid-cols-2 gap-4 pt-4 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-400">100%</div>
                  <div className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Cỏ nhân tạo đạt chuẩn FIFA</div>
                </div>
                <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-400">24/7</div>
                  <div className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Hệ thống đặt sân & thanh toán tự động</div>
                </div>
              </div>

              {/* Mạng xã hội & Hotline */}
              <div className="flex flex-wrap items-center gap-4 pt-4">
                {aboutData?.link_facebook && (
                  <a
                    href={aboutData.link_facebook}
                    target="_blank"
                    rel="noreferrer"
                    className="px-5 py-2.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-500 text-white transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20"
                  >
                    <span>Facebook Fanpage</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                {aboutData?.link_zalo && (
                  <a
                    href={aboutData.link_zalo}
                    target="_blank"
                    rel="noreferrer"
                    className="px-5 py-2.5 rounded-xl font-bold text-xs bg-cyan-600 hover:bg-cyan-500 text-white transition-all flex items-center gap-2 shadow-lg shadow-cyan-600/20"
                  >
                    <span>Zalo Hỗ Trợ</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>

            {/* Cột phải: Gallery ảnh */}
            <div className="lg:col-span-6 grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="h-48 sm:h-64 rounded-3xl overflow-hidden shadow-xl">
                  <img
                    src="https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=800&q=80"
                    alt="Sân bóng Soccer247"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="h-36 sm:h-48 rounded-3xl overflow-hidden shadow-xl">
                  <img
                    src="https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=800&q=80"
                    alt="Trái bóng sân cỏ"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
              </div>
              <div className="space-y-4 pt-8">
                <div className="h-36 sm:h-48 rounded-3xl overflow-hidden shadow-xl">
                  <img
                    src="https://images.unsplash.com/photo-1511886929837-354d827aae26?auto=format&fit=crop&w=800&q=80"
                    alt="Cầu thủ thi đấu"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="h-48 sm:h-64 rounded-3xl overflow-hidden shadow-xl">
                  <img
                    src="https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80"
                    alt="Khung thành và sân"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* TẠI SAO CHỌN SOCCER247 */}
        <section className={`py-16 border-t ${
          isDarkMode ? 'bg-slate-900/40 border-slate-800/80' : 'bg-slate-100/70 border-slate-200'
        }`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h3 className="text-2xl sm:text-3xl font-black mb-3">Ưu Điểm Vượt Trội Của Soccer247</h3>
              <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Mang đến trải nghiệm đặt sân mượt mà và không gian thi đấu bùng nổ năng lượng thể thao.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-1 ${
                    isDarkMode ? 'bg-slate-900/90 border-slate-800 hover:border-emerald-500/40' : 'bg-white border-slate-200 hover:border-emerald-400'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                    {item.icon}
                  </div>
                  <h4 className="font-bold text-base mb-2">{item.title}</h4>
                  <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
