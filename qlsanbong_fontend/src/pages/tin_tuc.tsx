"use client";

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  Search, 
  Calendar, 
  Eye, 
  ChevronRight, 
  Sparkles, 
  Tag, 
  ArrowRight,
  TrendingUp,
  ArrowLeft,
  Share2,
  CheckCircle2,
  Clock,
  Flame
} from 'lucide-react';
import HeaderNav from '@/components/HeaderNav';
import Footer from '@/components/Footer';
import { useAppTheme } from '@/hooks/useAppTheme';
import { contentService, TinTucItem, LoaiTinTuc } from '@/services/contentService';
import SoccerLoader from '@/components/SoccerLoader';

export default function TinTucPage() {
  const router = useRouter();
  const { id } = router.query;
  const { isDarkMode } = useAppTheme(true);

  // Listing state
  const [loaiTinList, setLoaiTinList] = useState<LoaiTinTuc[]>([]);
  const [selectedLoaiId, setSelectedLoaiId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [newsList, setNewsList] = useState<TinTucItem[]>([]);
  const [isListLoading, setIsListLoading] = useState<boolean>(true);

  // Detail state
  const [article, setArticle] = useState<TinTucItem | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<TinTucItem[]>([]);
  const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Fallback default news
  const defaultNews: TinTucItem[] = [
    {
      id: 1,
      ma_loai_tin: 1,
      ten_loai: 'Sự kiện & Giải đấu',
      tieu_de: 'Khởi tranh Giải Bóng Đá Tứ Hùng Soccer247 Cup 2026',
      tom_tat: 'Giải đấu thường niên quy tụ 16 đội bóng phong trào hàng đầu khu vực với tổng giải thưởng lên tới 50 triệu đồng.',
      noi_dung: `Soccer247 chính thức công bố thể lệ và danh sách đăng ký giải bóng đá Tứ Hùng mùa xuân 2026.\n\nGiải đấu quy tụ 16 đội bóng phong trào xuất sắc nhất trên địa bàn Biên Hòa và các khu vực lân cận. Các đội sẽ thi đấu theo thể thức loại trực tiếp kết hợp vòng bảng để tìm ra nhà vô địch nhận cúp và phần thưởng 50.000.000 VNĐ.\n\nĐặc quyền dành cho các đội tham gia:\n- Được cấp miễn phí trang phục thi đấu cao cấp mang thương hiệu Soccer247.\n- Miễn phí toàn bộ nước uống điện giải trong suốt thời gian thi đấu.\n- Toàn bộ các trận đấu được truyền thông, quay phát trực tiếp với bình luận viên chuyên nghiệp.\n\nHãy nhanh tay đăng ký đội bóng của bạn tại quầy lễ tân trung tâm hoặc liên hệ Hotline: 0816344504!`,
      hinh_anh: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80',
      luot_xem: 128,
      ngay_dang: new Date().toISOString(),
      trang_thai: 1
    },
    {
      id: 2,
      ma_loai_tin: 2,
      ten_loai: 'Kinh nghiệm & Kỹ thuật',
      tieu_de: 'Bí quyết chọn giày đá bóng sân cỏ nhân tạo chuẩn xác nhất',
      tom_tat: 'Hướng dẫn chi tiết cách chọn form giày, đế TF phù hợp để hạn chế tối đa chấn thương lật cổ chân và tối ưu tốc độ.',
      noi_dung: 'Mặt sân cỏ nhân tạo có đặc thù độ bám và độ lún khác với sân cỏ tự nhiên. Khi thi đấu trên sân cỏ nhân tạo mini 5 người hoặc 7 người, lựa chọn đúng loại giày đinh TF (Turf) cao su sẽ giúp bạn có những pha bứt tốc tự tin và bảo vệ cổ chân tốt nhất.',
      hinh_anh: 'https://images.unsplash.com/photo-1511886929837-354d827aae26?auto=format&fit=crop&w=1200&q=80',
      luot_xem: 89,
      ngay_dang: new Date(Date.now() - 86400000 * 2).toISOString(),
      trang_thai: 1
    },
    {
      id: 3,
      ma_loai_tin: 3,
      ten_loai: 'Khuyến mãi & Ưu đãi',
      tieu_de: 'Ưu Đãi Vàng Giờ Vàng: Giảm 20% Cho Khung Giờ Sáng Sớm & Đêm Muộn',
      tom_tat: 'Áp dụng cho tất cả các khách hàng đặt sân trực tuyến qua hệ thống Soccer247 vào các khung giờ từ 06:00 - 08:00 và sau 21:30.',
      noi_dung: 'Nhằm khuyến khích tinh thần rèn luyện thể thao nâng cao sức khỏe, Soccer247 tung chương trình ưu đãi cực khủng giảm ngay 20% tổng tiền sân khi đặt online.',
      hinh_anh: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
      luot_xem: 256,
      ngay_dang: new Date(Date.now() - 86400000 * 5).toISOString(),
      trang_thai: 1
    }
  ];

  // Fetch list data
  useEffect(() => {
    fetchListData();
  }, [selectedLoaiId]);

  // Fetch detail data when id query exists
  useEffect(() => {
    if (id) {
      fetchArticleDetail(id as string);
    } else {
      setArticle(null);
    }
  }, [id]);

  const fetchListData = async () => {
    setIsListLoading(true);
    try {
      // 1. Fetch categories
      const loaiRes = await contentService.getLoaiTin();
      if (loaiRes?.success && loaiRes.data?.length > 0) {
        setLoaiTinList(loaiRes.data);
      } else {
        setLoaiTinList([
          { id: 1, ten_loai: 'Sự kiện & Giải đấu', trang_thai: 1 },
          { id: 2, ten_loai: 'Kinh nghiệm & Kỹ thuật', trang_thai: 1 },
          { id: 3, ten_loai: 'Khuyến mãi & Ưu đãi', trang_thai: 1 },
          { id: 4, ten_loai: 'Thông báo nội bộ', trang_thai: 1 }
        ]);
      }

      // 2. Fetch news
      const newsRes = await contentService.getTinTucList({
        ma_loai_tin: selectedLoaiId || undefined,
        tu_khoa: searchQuery || undefined,
      });

      if (newsRes?.success && newsRes.data?.length > 0) {
        setNewsList(newsRes.data);
      } else {
        let filtered = defaultNews;
        if (selectedLoaiId) {
          filtered = filtered.filter((n) => n.ma_loai_tin === selectedLoaiId);
        }
        if (searchQuery) {
          filtered = filtered.filter((n) =>
            n.tieu_de.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (n.tom_tat && n.tom_tat.toLowerCase().includes(searchQuery.toLowerCase()))
          );
        }
        setNewsList(filtered);
      }
    } catch (error) {
      console.warn('Lỗi lấy dữ liệu tin tức:', error);
      let filtered = defaultNews;
      if (selectedLoaiId) {
        filtered = filtered.filter((n) => n.ma_loai_tin === selectedLoaiId);
      }
      setNewsList(filtered);
    } finally {
      setIsListLoading(false);
    }
  };

  const fetchArticleDetail = async (artId: string) => {
    setIsDetailLoading(true);
    try {
      const res = await contentService.getTinTucDetail(artId);
      if (res?.success && res.data) {
        setArticle(res.data);
      } else {
        const found = defaultNews.find((n) => String(n.id) === String(artId)) || defaultNews[0];
        setArticle(found);
      }

      // Fetch related news
      const relatedRes = await contentService.getTinTucList({ limit: 4 });
      if (relatedRes?.success && relatedRes.data) {
        setRelatedArticles(relatedRes.data.filter((a) => String(a.id) !== String(artId)));
      } else {
        setRelatedArticles(defaultNews.filter((a) => String(a.id) !== String(artId)));
      }
    } catch (error) {
      console.warn('Lỗi tải bài viết:', error);
      const found = defaultNews.find((n) => String(n.id) === String(artId)) || defaultNews[0];
      setArticle(found);
      setRelatedArticles(defaultNews.filter((a) => String(a.id) !== String(artId)));
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchListData();
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const featuredArticle = newsList.length > 0 ? newsList[0] : null;
  const remainingArticles = newsList.length > 1 ? newsList.slice(1) : [];

  return (
    <div className={`min-h-screen transition-colors duration-300 font-sans ${
      isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      <Head>
        <title>
          {id && article 
            ? `${article.tieu_de} | Soccer247`
            : 'Tin Tức & Sự Kiện Thể Thao | Soccer247'}
        </title>
        <meta 
          name="description" 
          content={id && article?.tom_tat ? article.tom_tat : "Cập nhật tin tức giải đấu, ưu đãi đặt sân và kỹ thuật bóng đá tại Soccer247"} 
        />
      </Head>

      <HeaderNav activeTab="news" />

      {/* =====================================================================
          VIEW 1: CHI TIẾT BÀI VIẾT (KHI CÓ QUERY ?id=...)
          ===================================================================== */}
      {id ? (
        <main className="pt-28 pb-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Nút quay lại & Breadcrumb */}
          <div className="flex items-center justify-between gap-4 mb-8">
            <button
              onClick={() => router.push('/tin_tuc')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isDarkMode 
                  ? 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800' 
                  : 'bg-white border border-slate-200 text-slate-700 hover:text-black hover:bg-slate-100'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại danh sách tin</span>
            </button>

            <button
              onClick={handleShare}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                copied
                  ? 'bg-emerald-500 text-slate-950'
                  : isDarkMode
                  ? 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-emerald-400'
                  : 'bg-white border border-slate-200 text-slate-700 hover:text-emerald-600'
              }`}
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  <span>Đã sao chép link!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span>Chia sẻ bài viết</span>
                </>
              )}
            </button>
          </div>

          {isDetailLoading ? (
            <div className="py-24 flex flex-col items-center justify-center">
              <SoccerLoader message="Đang tải chi tiết bài viết..." />
            </div>
          ) : !article ? (
            <div className="text-center py-20">
              <h2 className="text-2xl font-bold">Không tìm thấy bài viết</h2>
              <button 
                onClick={() => router.push('/tin_tuc')}
                className="mt-4 inline-block text-emerald-500 hover:underline cursor-pointer font-bold"
              >
                Quay về trang Tin Tức
              </button>
            </div>
          ) : (
            <article className={`rounded-3xl border p-6 sm:p-10 transition-all ${
              isDarkMode ? 'bg-slate-900/70 border-slate-800 shadow-2xl' : 'bg-white border-slate-200 shadow-xl'
            }`}>
              {/* Header bài viết */}
              <div className={`mb-6 border-b pb-6 ${isDarkMode ? 'border-slate-800/60' : 'border-slate-200'}`}>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mb-4">
                  <Tag className="w-3.5 h-3.5" />
                  {article.ten_loai || 'Tin tức'}
                </div>

                <h1 className="text-2xl sm:text-4xl font-black leading-tight mb-4">
                  {article.tieu_de}
                </h1>

                <div className={`flex flex-wrap items-center gap-6 text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-emerald-400" />
                    Ngày đăng: {new Date(article.ngay_dang).toLocaleDateString('vi-VN')}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-emerald-400" />
                    {article.luot_xem || 0} lượt xem
                  </span>
                </div>
              </div>

              {/* Ảnh đại diện bài viết */}
              {article.hinh_anh && (
                <div className="w-full h-80 sm:h-[450px] rounded-2xl overflow-hidden mb-8 shadow-xl">
                  <img
                    src={article.hinh_anh}
                    alt={article.tieu_de}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Tóm tắt */}
              {article.tom_tat && (
                <div className={`p-4 sm:p-5 rounded-2xl font-semibold text-sm sm:text-base mb-8 border-l-4 border-emerald-500 ${
                  isDarkMode ? 'bg-slate-950/60 text-slate-200' : 'bg-emerald-50/70 text-slate-800'
                }`}>
                  {article.tom_tat}
                </div>
              )}

              {/* Nội dung chi tiết */}
              <div className={`max-w-none text-sm sm:text-base leading-relaxed space-y-4 whitespace-pre-line ${
                isDarkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                {article.noi_dung}
              </div>
            </article>
          )}

          {/* CÁC TIN TỨC LIÊN QUAN */}
          {relatedArticles.length > 0 && (
            <div className="mt-16">
              <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                <ChevronRight className="w-5 h-5 text-emerald-400" />
                Bài Viết Liên Quan Khác
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedArticles.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => router.push(`/tin_tuc?id=${item.id}`)}
                    className={`rounded-2xl border p-4 cursor-pointer transition-all hover:-translate-y-1 ${
                      isDarkMode 
                        ? 'bg-slate-900/60 border-slate-800 hover:border-emerald-500/40' 
                        : 'bg-white border-slate-200 hover:border-emerald-400'
                    }`}
                  >
                    <div className="h-36 rounded-xl overflow-hidden mb-3">
                      <img
                        src={item.hinh_anh || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80'}
                        alt={item.tieu_de}
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="text-[11px] text-emerald-400 font-bold mb-1">{item.ten_loai || 'Tin tức'}</div>
                    <h4 className="font-bold text-xs line-clamp-2 hover:text-emerald-400 transition-colors">
                      {item.tieu_de}
                    </h4>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      ) : (
        /* =====================================================================
           VIEW 2: DANH SÁCH TẤT CẢ BÀI VIẾT (KHI KHÔNG CÓ QUERY ?id=...)
           ===================================================================== */
        <main className="pt-28 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* BỘ LỌC DANH MỤC & THANH TÌM KIẾM */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-10">
            
            {/* Tabs Loại tin */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
              <button
                onClick={() => setSelectedLoaiId(null)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedLoaiId === null
                    ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 scale-105'
                    : isDarkMode
                    ? 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                    : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                🔥 Tất cả
              </button>
              {loaiTinList.map((loai) => (
                <button
                  key={loai.id}
                  onClick={() => setSelectedLoaiId(loai.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    selectedLoaiId === loai.id
                      ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 scale-105'
                      : isDarkMode
                      ? 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                      : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {loai.ten_loai}
                </button>
              ))}
            </div>

            {/* Search Box */}
            <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm bài viết..."
                className={`w-full pl-10 pr-20 py-2 rounded-xl text-xs outline-none border transition-all ${
                  isDarkMode
                    ? 'bg-slate-900 border-slate-800 text-slate-200 focus:border-emerald-500/50'
                    : 'bg-white border-slate-200 text-slate-800 focus:border-emerald-500'
                }`}
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] rounded-lg transition-all cursor-pointer"
              >
                Tìm
              </button>
            </form>

          </div>

          {/* DANH SÁCH BÀI VIẾT */}
          {isListLoading ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <SoccerLoader message="Đang tải danh sách tin tức..." />
            </div>
          ) : newsList.length === 0 ? (
            <div className={`p-12 text-center rounded-2xl border ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}`}>
              <Sparkles className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold">Không tìm thấy bài viết nào</h3>
              <p className="text-sm text-slate-400 mt-1">Vui lòng thử chọn chuyên mục khác hoặc từ khóa tìm kiếm mới.</p>
            </div>
          ) : (
            <div className="space-y-12">
              
              {/* 1. BÀI VIẾT NỔI BẬT NHẤT */}
              {featuredArticle && (
                <div className={`rounded-3xl border overflow-hidden transition-all duration-300 hover:shadow-2xl ${
                  isDarkMode ? 'bg-slate-900/80 border-slate-800 hover:border-emerald-500/40' : 'bg-white border-slate-200 hover:border-emerald-400'
                }`}>
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                    <div className="lg:col-span-7 relative h-72 sm:h-96 overflow-hidden">
                      <img
                        src={featuredArticle.hinh_anh || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80'}
                        alt={featuredArticle.tieu_de}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500 text-slate-950 shadow-md">
                          {featuredArticle.ten_loai || 'Tin Mới Nhất'}
                        </span>
                      </div>
                    </div>
                    <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-4 text-xs text-slate-400 mb-3">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                            {new Date(featuredArticle.ngay_dang).toLocaleDateString('vi-VN')}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Eye className="w-3.5 h-3.5 text-emerald-400" />
                            {featuredArticle.luot_xem || 0} lượt xem
                          </span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black mb-3 line-clamp-2 leading-snug">
                          <Link href={`/tin_tuc?id=${featuredArticle.id}`} className="hover:text-emerald-400 transition-colors">
                            {featuredArticle.tieu_de}
                          </Link>
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-400 line-clamp-3 leading-relaxed mb-6">
                          {featuredArticle.tom_tat || featuredArticle.noi_dung}
                        </p>
                      </div>

                      <Link
                        href={`/tin_tuc?id=${featuredArticle.id}`}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 border border-emerald-500/30 transition-all w-fit group"
                      >
                        <span>Đọc bài viết</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. GRID CÁC BÀI VIẾT KHÁC */}
              {remainingArticles.length > 0 && (
                <div>
                  <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                    Tin Tức Thể Thao Mới Nhất
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {remainingArticles.map((item) => (
                      <article
                        key={item.id}
                        className={`rounded-2xl border overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                          isDarkMode
                            ? 'bg-slate-900/60 border-slate-800 hover:border-emerald-500/40'
                            : 'bg-white border-slate-200 hover:border-emerald-400'
                        }`}
                      >
                        <div className="relative h-48 overflow-hidden">
                          <img
                            src={item.hinh_anh || 'https://images.unsplash.com/photo-1511886929837-354d827aae26?auto=format&fit=crop&w=800&q=80'}
                            alt={item.tieu_de}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                          <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-slate-950/80 text-emerald-400 backdrop-blur-md border border-slate-700">
                            {item.ten_loai || 'Tin tức'}
                          </span>
                        </div>

                        <div className="p-5 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-3 text-[11px] text-slate-400 mb-2">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-emerald-400" />
                                {new Date(item.ngay_dang).toLocaleDateString('vi-VN')}
                              </span>
                              <span className="flex items-center gap-1">
                                <Eye className="w-3 h-3 text-emerald-400" />
                                {item.luot_xem || 0}
                              </span>
                            </div>

                            <h4 className="font-bold text-sm sm:text-base mb-2 line-clamp-2 leading-snug">
                              <Link href={`/tin_tuc?id=${item.id}`} className="hover:text-emerald-400 transition-colors">
                                {item.tieu_de}
                              </Link>
                            </h4>

                            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
                              {item.tom_tat || item.noi_dung}
                            </p>
                          </div>

                          <Link
                            href={`/tin_tuc?id=${item.id}`}
                            className="text-xs font-bold text-emerald-500 hover:text-emerald-400 flex items-center gap-1 mt-auto pt-2 border-t border-slate-800/40"
                          >
                            Xem chi tiết <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

        </main>
      )}

      <Footer />
    </div>
  );
}
