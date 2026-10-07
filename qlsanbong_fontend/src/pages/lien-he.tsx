"use client";

import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  MessageSquare,
  Sparkles,
  Loader2,
  CalendarCheck2
} from 'lucide-react';
import HeaderNav from '@/components/HeaderNav';
import Footer from '@/components/Footer';
import { useAppTheme } from '@/hooks/useAppTheme';
import { contentService, LienHePayload, AboutUsData } from '@/services/contentService';

export default function LienHePage() {
  const { isDarkMode } = useAppTheme(true);
  const [aboutData, setAboutData] = useState<AboutUsData | null>(null);

  const [formData, setFormData] = useState<LienHePayload>({
    ho_ten: '',
    email: '',
    so_dien_thoai: '',
    tieu_de: 'Đặt sân sự kiện / Giải đấu',
    noi_dung: '',
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  React.useEffect(() => {
    contentService.getAboutUs()
      .then(res => {
        if (res?.success && res.data) {
          setAboutData(res.data);
        }
      })
      .catch(err => console.warn('LienHe getAboutUs error:', err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitStatus(null);

    const phoneDigits = formData.so_dien_thoai.replace(/\D/g, '');

    if (!formData.ho_ten.trim() || !formData.noi_dung.trim()) {
      setSubmitStatus({
        type: 'error',
        message: 'Vui lòng điền đầy đủ Họ và tên và Nội dung liên hệ!',
      });
      return;
    }

    if (phoneDigits.length !== 10 || !phoneDigits.startsWith('0')) {
      setSubmitStatus({
        type: 'error',
        message: 'Số điện thoại không hợp lệ! Vui lòng nhập đúng 10 chữ số (Ví dụ: 0912345678).',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await contentService.sendLienHe(formData);
      if (res?.success) {
        setSubmitStatus({
          type: 'success',
          message: res.message || 'Gửi liên hệ thành công! Ban quản lý Soccer247 sẽ liên hệ lại với bạn trong thời gian sớm nhất.',
        });
        setFormData({
          ho_ten: '',
          email: '',
          so_dien_thoai: '',
          tieu_de: 'Đặt sân sự kiện / Giải đấu',
          noi_dung: '',
        });
      } else {
        setSubmitStatus({
          type: 'error',
          message: res.message || 'Không thể gửi tin nhắn lúc này. Vui lòng liên hệ Hotline 0816344504!',
        });
      }
    } catch (error: any) {
      console.error('Lỗi gửi liên hệ:', error);
      setSubmitStatus({
        type: 'error',
        message: error.message || 'Lỗi kết nối máy chủ. Vui lòng thử lại sau!',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 font-sans ${
      isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      <Head>
        <title>Liên Hệ & Góp Ý | Soccer247</title>
        <meta name="description" content="Liên hệ với ban quản trị sân thể thao Soccer247 để đặt lịch giải đấu, sự kiện hoặc gửi ý kiến đóng góp." />
      </Head>

      <HeaderNav activeTab="contact" />

      <main className="pt-28 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* HERO TITLE */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mb-4">
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            Hỗ Trợ & Chăm Sóc Khách Hàng 24/7
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight mb-4">
            Liên Hệ Với <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Soccer247</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            Bạn có câu hỏi về việc đặt sân, tổ chức giải bóng đá doanh nghiệp hay muốn đóng góp ý kiến để hoàn thiện chất lượng dịch vụ? Hãy gửi tin nhắn cho chúng tôi ngay bên dưới.
          </p>
        </div>

        {/* GRID FORM LIÊN HỆ & THÔNG TIN TRỰC TIẾP */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* CỘT TRÁI: FORM LIÊN HỆ */}
          <div className={`lg:col-span-7 p-6 sm:p-10 rounded-3xl border ${
            isDarkMode ? 'bg-slate-900/70 border-slate-800 shadow-2xl' : 'bg-white border-slate-200 shadow-xl'
          }`}>
            <h2 className="text-xl sm:text-2xl font-black mb-2 flex items-center gap-2">
              <Send className="w-5 h-5 text-emerald-400" />
              Gửi Tin Nhắn Cho Ban Quản Lý
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mb-6">
              Mọi ý kiến của bạn sẽ được lưu trữ trực tiếp trên hệ thống và xử lý trong vòng 30 phút.
            </p>

            {submitStatus && (
              <div className={`p-4 rounded-2xl mb-6 flex items-start gap-3 text-xs sm:text-sm ${
                submitStatus.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
              }`}>
                {submitStatus.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                )}
                <span>{submitStatus.message}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-bold mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Họ và tên <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.ho_ten}
                    onChange={(e) => setFormData({ ...formData, ho_ten: e.target.value })}
                    placeholder="Nguyễn Văn A"
                    className={`w-full px-4 py-3 rounded-xl text-xs sm:text-sm outline-none border transition-all ${
                      isDarkMode 
                        ? 'bg-slate-950 border-slate-800 text-slate-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50' 
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500 focus:bg-white'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-bold mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Số điện thoại (10 số) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    inputMode="numeric"
                    value={formData.so_dien_thoai}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setFormData({ ...formData, so_dien_thoai: digits });
                    }}
                    placeholder="0912345678"
                    className={`w-full px-4 py-3 rounded-xl text-xs sm:text-sm outline-none border transition-all ${
                      isDarkMode 
                        ? 'bg-slate-950 border-slate-800 text-slate-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50' 
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500 focus:bg-white'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-bold mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Địa chỉ Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@example.com"
                    className={`w-full px-4 py-3 rounded-xl text-xs sm:text-sm outline-none border transition-all ${
                      isDarkMode 
                        ? 'bg-slate-950 border-slate-800 text-slate-100 focus:border-emerald-500' 
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500 focus:bg-white'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-bold mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Chủ đề / Nhu cầu liên hệ
                  </label>
                  <select
                    value={formData.tieu_de}
                    onChange={(e) => setFormData({ ...formData, tieu_de: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl text-xs sm:text-sm outline-none border transition-all ${
                      isDarkMode 
                        ? 'bg-slate-950 border-slate-800 text-slate-100 focus:border-emerald-500' 
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500 focus:bg-white'
                    }`}
                  >
                    <option value="Đặt sân sự kiện / Giải đấu">Đặt sân sự kiện / Giải đấu</option>
                    <option value="Thuê sân định kỳ theo tháng">Thuê sân định kỳ theo tháng</option>
                    <option value="Tìm đối thủ đá giao hữu">Tìm đối thủ đá giao hữu</option>
                    <option value="Khiếu nại / Góp ý dịch vụ">Khiếu nại / Góp ý dịch vụ</option>
                    <option value="Khác">Nhu cầu khác</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Nội dung chi tiết <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.noi_dung}
                  onChange={(e) => setFormData({ ...formData, noi_dung: e.target.value })}
                  placeholder="Vui lòng nhập chi tiết thông tin bạn muốn trao đổi cùng Soccer247..."
                  className={`w-full px-4 py-3 rounded-xl text-xs sm:text-sm outline-none border transition-all resize-none ${
                    isDarkMode 
                      ? 'bg-slate-950 border-slate-800 text-slate-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50' 
                      : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500 focus:bg-white'
                  }`}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl font-black text-xs sm:text-sm bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang gửi tin nhắn...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Gửi Liên Hệ Ngay</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* CỘT PHẢI: THÔNG TIN TRỰC TIẾP & BẢN ĐỒ */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Box Thông tin liên hệ trực tiếp */}
            <div className={`p-6 sm:p-8 rounded-3xl border space-y-6 ${
              isDarkMode ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200 shadow-xl'
            }`}>
              <h3 className="text-lg font-black flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                Thông Tin Trực Tiếp
              </h3>

              <div className={`space-y-4 text-xs sm:text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Hotline tư vấn & Đặt sân:</div>
                    <div className={`font-bold text-base font-mono ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {aboutData?.hotline || '0816344504'}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Hòm thư điện tử:</div>
                    <div className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {aboutData?.email || 'sinhvienxoan@gmail.com'}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Thời gian mở cửa:</div>
                    <div className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>06:00 - 19:00 (Tất cả các ngày trong tuần)</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Địa chỉ trung tâm:</div>
                    <div className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {aboutData?.dia_chi || 'Biên Hòa - Đồng Nai'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Box Đặt sân nhanh */}
            <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border border-emerald-500/30">
              <h4 className="font-black text-sm text-white flex items-center gap-2 mb-1">
                <CalendarCheck2 className="w-4 h-4 text-emerald-400" />
                Cần sân đá bóng gấp hôm nay?
              </h4>
              <p className="text-xs text-slate-400 mb-4">
                Xem ma trận lịch trống và giữ chỗ tự động chỉ trong 30 giây trên trang chủ.
              </p>
              <Link
                href="/#ma-tran-lich-san"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-md shadow-emerald-500/20"
              >
                📅 Xem Lịch Sân Trống
              </Link>
            </div>

          </div>

        </div>

      </main>

      <Footer />
    </div>
  );
}
