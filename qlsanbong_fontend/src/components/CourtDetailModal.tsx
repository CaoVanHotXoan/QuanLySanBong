import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Star,
  MessageSquare,
  CornerDownRight,
  Trash2,
  Edit2,
  Send,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Zap,
  Users,
  MapPin,
  Clock,
  ArrowRight,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface ReviewItem {
  id: number;
  ma_san: number;
  ma_nguoi_dung: number;
  binh_luan_cha_id: number | null;
  so_sao: number | null;
  noi_dung: string;
  ngay_tao: string;
  trang_thai: boolean;
  ho_ten: string;
  email: string;
  anh_dai_dien: string | null;
  vai_tro: string;
  tra_loi_cho_ho_ten?: string | null;
  tra_loi?: ReviewItem[];
}

interface CourtStats {
  ma_san: number;
  ten_san: string;
  hinh_anh: string | null;
  don_gia_phut: number;
  trang_thai: string;
  tien_ich?: string | null;
  ma_loai_san: number;
  ten_loai: string;
  icon?: string | null;
  diem_trung_binh: number;
  tong_danh_gia: number;
  sao_5: number;
  sao_4: number;
  sao_3: number;
  sao_2: number;
  sao_1: number;
}

interface CourtDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  sanId: number | null;
  onBookNow?: (san: any, targetDate?: string, targetSlot?: any) => void;
  isDarkMode?: boolean;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// Hàm helper lấy biểu tượng và màu sắc theo loại sân thi đấu (Hỗ trợ Custom URL ảnh/SVG hoặc Emoji)
const getSportVisual = (courtData?: CourtStats | null) => {
  const customIcon = (courtData?.icon || "").trim();
  if (customIcon.startsWith("http://") || customIcon.startsWith("https://") || customIcon.startsWith("/") || customIcon.startsWith("data:image")) {
    return {
      icon: (
        <img
          src={customIcon}
          alt={courtData?.ten_loai || "Icon"}
          className="w-full h-full object-contain p-1"
          onError={(e) => {
            (e.currentTarget as HTMLElement).style.display = "none";
          }}
        />
      ),
      gradient: "from-slate-800 to-slate-900 text-white",
      tagBg: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
    };
  }

  const loai = (courtData?.ten_loai || "").toLowerCase().replace(/[đĐ]/g, "d").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const san = (courtData?.ten_san || "").toLowerCase().replace(/[đĐ]/g, "d").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const text = `${loai} ${san}`;

  if (text.includes("pickleball")) {
    return {
      icon: "🏓",
      gradient: "from-amber-500 to-yellow-400 text-slate-950",
      tagBg: "bg-amber-500/15 border-amber-500/30 text-amber-400",
    };
  }
  if (text.includes("bong da") || text.includes("san 5") || text.includes("san 7") || text.includes("futsal") || text.includes("soccer")) {
    return {
      icon: "⚽",
      gradient: "from-emerald-500 to-teal-400 text-slate-950",
      tagBg: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
    };
  }
  if (text.includes("cau long") || text.includes("badminton")) {
    return {
      icon: "🏸",
      gradient: "from-teal-500 to-emerald-400 text-slate-950",
      tagBg: "bg-teal-500/15 border-teal-500/30 text-teal-400",
    };
  }
  if (text.includes("quan vot") || text.includes("tennis")) {
    return {
      icon: "🎾",
      gradient: "from-lime-500 to-green-400 text-slate-950",
      tagBg: "bg-lime-500/15 border-lime-500/30 text-lime-400",
    };
  }
  if (text.includes("bong ro") || text.includes("basketball")) {
    return {
      icon: "🏀",
      gradient: "from-orange-500 to-amber-400 text-slate-950",
      tagBg: "bg-orange-500/15 border-orange-500/30 text-orange-400",
    };
  }
  if (text.includes("bong chuyen") || text.includes("volleyball")) {
    return {
      icon: "🏐",
      gradient: "from-sky-500 to-blue-400 text-slate-950",
      tagBg: "bg-sky-500/15 border-sky-500/30 text-sky-400",
    };
  }
  if (text.includes("bong ban") || text.includes("table tennis") || text.includes("ping pong")) {
    return {
      icon: "🏓",
      gradient: "from-rose-500 to-pink-400 text-slate-950",
      tagBg: "bg-rose-500/15 border-rose-500/30 text-rose-400",
    };
  }

  return {
    icon: "🏟️",
    gradient: "from-emerald-500 to-teal-400 text-slate-950",
    tagBg: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
  };
};

export default function CourtDetailModal({
  isOpen,
  onClose,
  sanId,
  onBookNow,
  isDarkMode = true,
}: CourtDetailModalProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [courtData, setCourtData] = useState<CourtStats | null>(null);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [totalReviewsCount, setTotalReviewsCount] = useState<number>(0);

  // Ref container để giữ nguyên vị trí cuộn màn hình khi thêm / trả lời / xóa / sửa bình luận
  const modalScrollRef = useRef<HTMLDivElement>(null);

  // Current logged in user
  const [currentUser, setCurrentUser] = useState<any>(null);

  // New review form states
  const [ratingInput, setRatingInput] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [commentInput, setCommentInput] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error" | ""; text: string }>({
    type: "",
    text: "",
  });

  // Reply state
  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const [replyInput, setReplyInput] = useState<string>("");
  const [isSubmittingReply, setIsSubmittingReply] = useState<boolean>(false);

  // State xác nhận xóa bình luận dạng Modal (thay thế window.confirm mặc định của trình duyệt)
  const [commentToDelete, setCommentToDelete] = useState<number | null>(null);
  const [isDeletingComment, setIsDeletingComment] = useState<boolean>(false);

  // State chỉnh sửa bình luận / câu trả lời
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editContentInput, setEditContentInput] = useState<string>("");
  const [editRatingInput, setEditRatingInput] = useState<number>(5);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState<boolean>(false);

  // State ẩn / hiện câu trả lời (mặc định các câu trả lời bị ẩn, chỉ khi bấm "Xem ... câu trả lời" mới hiện)
  const [expandedCommentIds, setExpandedCommentIds] = useState<Record<number, boolean>>({});

  const toggleReplies = (commentId: number) => {
    setExpandedCommentIds((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  // Tính tổng số câu trả lời con cháu của một bình luận
  const countTotalReplies = (item: ReviewItem): number => {
    if (!item.tra_loi || item.tra_loi.length === 0) return 0;
    return item.tra_loi.reduce((acc, curr) => acc + 1 + countTotalReplies(curr), 0);
  };

  // Tìm ID của bình luận gốc chứa targetId để tự động mở rộng khi gửi trả lời thành công
  const findRootCommentId = (comments: ReviewItem[], targetId: number): number | null => {
    for (const c of comments) {
      if (c.id === targetId) return c.id;
      const hasChild = (item: ReviewItem): boolean => {
        if (!item.tra_loi) return false;
        for (const ch of item.tra_loi) {
          if (ch.id === targetId || hasChild(ch)) return true;
        }
        return false;
      };
      if (hasChild(c)) return c.id;
    }
    return null;
  };

  // Sync current user from localStorage
  useEffect(() => {
    try {
      const savedAuth = localStorage.getItem("auth_user") || localStorage.getItem("soccer_current_user");
      if (savedAuth) {
        setCurrentUser(JSON.parse(savedAuth));
      } else {
        setCurrentUser(null);
      }
    } catch {
      setCurrentUser(null);
    }
  }, [isOpen]);

  // Fetch court details and reviews (silent = true không hủy mount màn hình, giúp giữ nguyên vị trí cuộn)
  const fetchCourtReviews = async (courtId: number, silent: boolean = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      const res = await fetch(`${API_BASE_URL}/reviews/san/${courtId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setCourtData(json.data.san);
        setReviews(json.data.danh_sach || []);
        setTotalReviewsCount(json.data.tong_binh_luan || 0);
      }
    } catch (err) {
      console.error("Lỗi tải chi tiết sân & đánh giá:", err);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (isOpen && sanId) {
      fetchCourtReviews(sanId);
      setReplyingToId(null);
      setReplyInput("");
      setFeedbackMsg({ type: "", text: "" });
      setExpandedCommentIds({});
    }
  }, [isOpen, sanId]);

  if (!isOpen || !sanId) return null;

  // Handle submit main review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setFeedbackMsg({
        type: "error",
        text: "Vui lòng đăng nhập để gửi đánh giá hoặc bình luận!",
      });
      return;
    }

    if (!commentInput.trim()) {
      setFeedbackMsg({ type: "error", text: "Vui lòng nhập nội dung nhận xét!" });
      return;
    }

    setIsSubmitting(true);
    setFeedbackMsg({ type: "", text: "" });
    const savedScroll = modalScrollRef.current?.scrollTop;

    try {
      const token = localStorage.getItem("auth_token") || localStorage.getItem("token") || "";
      const res = await fetch(`${API_BASE_URL}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ma_san: sanId,
          so_sao: ratingInput,
          noi_dung: commentInput.trim(),
          ma_nguoi_dung: currentUser.id,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setFeedbackMsg({ type: "success", text: "🎉 Cảm ơn bạn đã gửi đánh giá!" });
        setCommentInput("");
        setRatingInput(5);
        await fetchCourtReviews(sanId, true);
        if (modalScrollRef.current && savedScroll !== undefined) {
          modalScrollRef.current.scrollTop = savedScroll;
        }
      } else {
        setFeedbackMsg({ type: "error", text: json.message || "Gửi đánh giá thất bại!" });
      }
    } catch (err: any) {
      setFeedbackMsg({ type: "error", text: err.message || "Lỗi kết nối máy chủ!" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle submit reply (hỗ trợ trả lời mọi tầng bình luận / câu trả lời con)
  const handleSubmitReply = async (parentId: number) => {
    if (!currentUser) {
      setFeedbackMsg({
        type: "error",
        text: "Vui lòng đăng nhập để gửi câu trả lời!",
      });
      return;
    }

    if (!replyInput.trim()) return;

    setIsSubmittingReply(true);
    const savedScroll = modalScrollRef.current?.scrollTop;

    try {
      const token = localStorage.getItem("auth_token") || localStorage.getItem("token") || "";
      const res = await fetch(`${API_BASE_URL}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ma_san: sanId,
          binh_luan_cha_id: parentId,
          noi_dung: replyInput.trim(),
          ma_nguoi_dung: currentUser.id,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setReplyingToId(null);
        setReplyInput("");
        setFeedbackMsg({ type: "success", text: "🎉 Đã gửi câu trả lời thành công!" });
        // Tự động mở rộng nhánh câu trả lời vừa gửi để người dùng nhìn thấy ngay
        const rootId = findRootCommentId(reviews, parentId);
        setExpandedCommentIds((prev) => ({
          ...prev,
          [parentId]: true,
          ...(rootId ? { [rootId]: true } : {}),
        }));
        await fetchCourtReviews(sanId, true);
        if (modalScrollRef.current && savedScroll !== undefined) {
          modalScrollRef.current.scrollTop = savedScroll;
        }
      } else {
        setFeedbackMsg({ type: "error", text: json.message || "Không thể gửi câu trả lời!" });
      }
    } catch (err: any) {
      setFeedbackMsg({ type: "error", text: "Lỗi khi gửi câu trả lời: " + err.message });
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // Xác định người dùng có phải là Quản trị viên (Admin)
  const isCurrentUserAdmin = Boolean(
    currentUser && (
      (currentUser.vai_tro || "").toString().trim().toUpperCase() === "ADMIN" ||
      (currentUser.vai_tro || "").toString().trim().toUpperCase() === "QUAN_TRI" ||
      (currentUser.vai_tro || "").toString().trim().toUpperCase() === "QUAN_TRI_VIEN" ||
      currentUser.MaVaiTro === 1 ||
      (currentUser.email || "").toString().toLowerCase() === "xoancao2.0@gmail.com" ||
      (currentUser.email || "").toString().toLowerCase() === "admin@soccer247.vn"
    )
  );

  // Chỉ người tạo bình luận hoặc Quản trị viên mới có quyền xem icon và thao tác Xóa / Sửa
  const canManageComment = (authorId: number) => {
    if (!currentUser) return false;
    return currentUser.id === authorId || isCurrentUserAdmin;
  };

  // Mở chế độ chỉnh sửa bình luận / câu trả lời
  const handleStartEdit = (item: { id: number; noi_dung: string; so_sao?: number | null }) => {
    setEditingCommentId(item.id);
    setEditContentInput(item.noi_dung || "");
    setEditRatingInput(item.so_sao || 5);
  };

  // Hủy chế độ chỉnh sửa
  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditContentInput("");
  };

  // Lưu chỉnh sửa bình luận / câu trả lời (giữ nguyên scroll)
  const handleSaveEdit = async (commentId: number, isReply: boolean = false) => {
    if (!editContentInput.trim()) {
      setFeedbackMsg({ type: "error", text: "Nội dung bình luận không được để trống!" });
      return;
    }

    setIsSubmittingEdit(true);
    const savedScroll = modalScrollRef.current?.scrollTop;

    try {
      const token = localStorage.getItem("auth_token") || localStorage.getItem("token") || "";
      const res = await fetch(`${API_BASE_URL}/reviews/${commentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ma_nguoi_dung: currentUser?.id,
          noi_dung: editContentInput.trim(),
          so_sao: isReply ? null : editRatingInput,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setFeedbackMsg({ type: "success", text: "🎉 Đã cập nhật bình luận thành công!" });
        setEditingCommentId(null);
        setEditContentInput("");
        if (sanId) {
          await fetchCourtReviews(sanId, true);
          if (modalScrollRef.current && savedScroll !== undefined) {
            modalScrollRef.current.scrollTop = savedScroll;
          }
        }
      } else {
        setFeedbackMsg({ type: "error", text: json.message || "Không thể cập nhật bình luận!" });
      }
    } catch (err: any) {
      setFeedbackMsg({ type: "error", text: "Lỗi khi cập nhật bình luận: " + err.message });
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Mở modal xác nhận xóa bình luận
  const handleDeleteComment = (commentId: number) => {
    setCommentToDelete(commentId);
  };

  // Xác nhận thực hiện xóa bình luận từ modal (giữ nguyên scroll)
  const confirmDeleteComment = async () => {
    if (!commentToDelete) return;

    setIsDeletingComment(true);
    const savedScroll = modalScrollRef.current?.scrollTop;

    try {
      const token = localStorage.getItem("auth_token") || localStorage.getItem("token") || "";
      const res = await fetch(`${API_BASE_URL}/reviews/${commentToDelete}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ma_nguoi_dung: currentUser?.id,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setFeedbackMsg({ type: "success", text: "🎉 Đã xóa bình luận thành công!" });
        if (sanId) {
          await fetchCourtReviews(sanId, true);
          if (modalScrollRef.current && savedScroll !== undefined) {
            modalScrollRef.current.scrollTop = savedScroll;
          }
        }
      } else {
        setFeedbackMsg({ type: "error", text: json.message || "Không thể xóa bình luận!" });
      }
    } catch (err: any) {
      setFeedbackMsg({ type: "error", text: "Lỗi khi xóa bình luận: " + err.message });
    } finally {
      setIsDeletingComment(false);
      setCommentToDelete(null);
    }
  };

  // Format relative time (e.g. 5 phút trước, Hôm nay, Hôm qua...)
  const formatTimeAgo = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);

      if (diffSec < 60) return "Vừa xong";
      if (diffMin < 60) return `${diffMin} phút trước`;
      if (diffHour < 24) return `${diffHour} giờ trước`;
      if (diffDay === 1) return "Hôm qua";
      if (diffDay < 7) return `${diffDay} ngày trước`;
      return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  // Default court banner if not present
  const courtImage =
    courtData?.hinh_anh ||
    "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=1000&q=80";

  const hourlyPrice = (courtData?.don_gia_phut || 300) * 60;

  const getCourtAmenities = (typeName?: string) => {
    const lower = (typeName || "").toLowerCase();
    if (lower.includes("bóng rổ") || lower.includes("basketball")) {
      return [
        "Mặt sân bóng rổ tiêu chuẩn thi đấu, chống trơn trượt",
        "Hệ thống đèn LED cao áp chuẩn thi đấu ban đêm",
        "Khán đài mini, phòng thay đồ, bãi xe ô tô/xe máy miễn phí",
        "Có sẵn bóng rổ thi đấu, nước uống và bảng điểm",
      ];
    }
    if (lower.includes("cầu lông") || lower.includes("badminton")) {
      return [
        "Thảm sàn Taraflex chuyên dụng êm ái, bám chân",
        "Hệ thống đèn chống lóa đạt chuẩn thi đấu",
        "Khán đài mini, phòng thay đồ, bãi xe ô tô/xe máy miễn phí",
        "Có sẵn vợt, quả cầu lông và nước uống phục vụ",
      ];
    }
    if (lower.includes("quần vợt") || lower.includes("tennis") || lower.includes("pickleball")) {
      return [
        "Mặt sân cứng tiêu chuẩn quốc tế, độ nảy bóng chuẩn",
        "Hệ thống đèn LED cao áp chiếu sáng phủ đều sân",
        "Khu vực nghỉ ngơi có mái che, bãi xe miễn phí",
        "Có sẵn bóng thi đấu, nước uống giải khát",
      ];
    }
    return [
      "Mặt cỏ nhân tạo FIFA 2 sao êm ái, chống trơn trượt",
      "Hệ thống đèn LED cao áp chuẩn thi đấu ban đêm",
      "Khán đài mini, phòng thay đồ, bãi xe ô tô/xe máy miễn phí",
      "Có sẵn bóng thi đấu, nước uống và áo tập",
    ];
  };

  // Trích xuất danh sách tiện ích từ CSDL thật hoặc fallback thông minh
  const parseAmenities = (rawTienIch?: string | null, typeName?: string): string[] => {
    if (rawTienIch && typeof rawTienIch === "string" && rawTienIch.trim()) {
      const trimmed = rawTienIch.trim();
      // Parse JSON array nếu CSDL lưu dạng mảng chuỗi
      if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map((item: any) => String(item).trim()).filter(Boolean);
          }
        } catch {}
      }
      // Phân tách theo dấu xuống dòng
      if (trimmed.includes("\n")) {
        const lines = trimmed.split("\n").map((l) => l.trim().replace(/^[-*•]\s*/, "")).filter(Boolean);
        if (lines.length > 0) return lines;
      }
      // Phân tách theo dấu chấm phẩy
      if (trimmed.includes(";")) {
        const parts = trimmed.split(";").map((l) => l.trim()).filter(Boolean);
        if (parts.length > 0) return parts;
      }
      return [trimmed];
    }
    return getCourtAmenities(typeName);
  };

  const courtAmenities = parseAmenities(courtData?.tien_ich, courtData?.ten_loai);

  // Hàm hiển thị bình luận hoặc câu trả lời đệ quy nhiều lớp
  const renderCommentNode = (item: ReviewItem, depth: number = 0) => {
    const isAuthorAdmin =
      item.vai_tro === "ADMIN" ||
      item.vai_tro === "QUAN_TRI" ||
      (item.email && item.email.toLowerCase() === "xoancao2.0@gmail.com") ||
      (item.email && item.email.toLowerCase() === "admin@soccer247.vn") ||
      item.ma_nguoi_dung === 1;

    const isRoot = depth === 0;
    const totalReplies = countTotalReplies(item);
    const hasReplies = Boolean(item.tra_loi && item.tra_loi.length > 0);
    // Mặc định câu trả lời bị ẩn, chỉ khi nhấn "Xem ... câu trả lời" mới hiện ra.
    // Nếu ở cấp con (depth > 0), khi nhánh gốc đã mở thì hiện các câu trả lời bên trong,
    // hoặc người dùng có thể chủ động ẩn/hiện từng nhánh nếu muốn.
    const isExpanded = isRoot
      ? Boolean(expandedCommentIds[item.id])
      : expandedCommentIds[item.id] !== false;

    return (
      <div
        key={item.id}
        className={`transition-colors ${
          isRoot
            ? `p-4 rounded-2xl border space-y-3 ${
                isDarkMode
                  ? "bg-slate-950/50 border-slate-800"
                  : "bg-white border-slate-200 shadow-md"
              }`
            : `p-2.5 sm:p-3 rounded-xl border space-y-2 ${
                isAuthorAdmin
                  ? isDarkMode
                    ? "bg-emerald-950/20 border-emerald-500/30"
                    : "bg-emerald-50/80 border-emerald-200"
                  : isDarkMode
                    ? "bg-slate-900/60 border-slate-800/80"
                    : "bg-slate-50 border-slate-200"
              }`
        }`}
      >
        {/* HEADER: AVATAR, TÊN, HUY HIỆU, SAO, THỜI GIAN & NÚT SỬA/XÓA */}
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-center gap-2">
            {/* Avatar */}
            <div
              className={`rounded-full relative flex items-center justify-center font-bold text-white shrink-0 overflow-hidden shadow-sm ${
                isRoot
                  ? "w-9 h-9 bg-gradient-to-tr from-emerald-600 to-teal-500 text-xs"
                  : isAuthorAdmin
                    ? "w-6 h-6 bg-emerald-500 text-slate-950 font-black text-[9px]"
                    : isDarkMode
                      ? "w-6 h-6 bg-slate-800 text-slate-300 text-[9px]"
                      : "w-6 h-6 bg-slate-200 text-slate-700 text-[9px]"
              }`}
            >
              {item.anh_dai_dien ? (
                <>
                  <img
                    src={item.anh_dai_dien}
                    alt={item.ho_ten || "Avatar"}
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                    className="w-full h-full object-cover relative z-10"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      const fallback = e.currentTarget.parentElement?.querySelector(".avatar-fallback-text");
                      if (fallback) (fallback as HTMLElement).style.display = "flex";
                    }}
                  />
                  <span className="avatar-fallback-text hidden absolute inset-0 items-center justify-center w-full h-full">
                    {item.ho_ten ? item.ho_ten.substring(0, 2).toUpperCase() : (isAuthorAdmin ? "QT" : "KH")}
                  </span>
                </>
              ) : (
                <span>
                  {item.ho_ten ? item.ho_ten.substring(0, 2).toUpperCase() : (isAuthorAdmin ? "QT" : "KH")}
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className={`font-bold ${
                    isRoot
                      ? `text-xs ${isDarkMode ? "text-white" : "text-slate-900"}`
                      : `text-[11px] ${isDarkMode ? "text-white" : "text-slate-900"}`
                  }`}
                >
                  {item.ho_ten}
                </span>

                {isAuthorAdmin ? (
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase flex items-center gap-0.5 ${
                      isRoot
                        ? "bg-rose-500/20 text-rose-500 border border-rose-500/30"
                        : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                    }`}
                  >
                    <ShieldCheck className="w-2.5 h-2.5" />
                    <span>{isRoot ? "Quản trị viên" : "BQL Sân bóng"}</span>
                  </span>
                ) : (
                  <span
                    className={`font-medium ${
                      isRoot
                        ? `text-[10px] ${isDarkMode ? "text-slate-400" : "text-slate-500"}`
                        : `text-[9px] ${isDarkMode ? "text-slate-400" : "text-slate-500"}`
                    }`}
                  >
                    {isRoot ? "Khách hàng" : "Khách"}
                  </span>
                )}

                {/* Nhãn Đang trả lời cho ai (nếu có ở các tầng phản hồi) */}
                {!isRoot && item.tra_loi_cho_ho_ten && (
                  <span className="text-[10px] font-semibold text-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/20 px-1.5 py-0.5 rounded flex items-center gap-0.5 border border-emerald-500/25">
                    <CornerDownRight className="w-2.5 h-2.5 shrink-0" />
                    <span>@{item.tra_loi_cho_ho_ten}</span>
                  </span>
                )}

                <span
                  className={`text-[9px] ${
                    isDarkMode ? "text-slate-500" : "text-slate-400"
                  }`}
                >
                  • {formatTimeAgo(item.ngay_tao)}
                </span>
              </div>

              {/* Dãy sao nếu có (ở bình luận gốc) */}
              {isRoot && item.so_sao && item.so_sao > 0 && (
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3 h-3 ${
                          s <= item.so_sao!
                            ? "text-amber-400 fill-amber-400"
                            : isDarkMode ? "text-slate-700" : "text-slate-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* CÁC NÚT THAO TÁC: CHỈ HIỂN THỊ ICON SỬA & XÓA CHO CHỦ BÌNH LUẬN VÀ ADMIN */}
          {canManageComment(item.ma_nguoi_dung) && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => handleStartEdit(item)}
                title="Chỉnh sửa bình luận"
                className={`text-slate-400 hover:text-emerald-500 rounded transition-colors cursor-pointer hover:bg-emerald-500/10 ${
                  isRoot ? "p-1" : "p-0.5"
                }`}
              >
                <Edit2 className={isRoot ? "w-3.5 h-3.5" : "w-3 h-3"} />
              </button>
              <button
                type="button"
                onClick={() => handleDeleteComment(item.id)}
                title="Xóa bình luận"
                className={`text-slate-400 hover:text-rose-500 rounded transition-colors cursor-pointer hover:bg-rose-500/10 ${
                  isRoot ? "p-1" : "p-0.5"
                }`}
              >
                <Trash2 className={isRoot ? "w-3.5 h-3.5" : "w-3 h-3"} />
              </button>
            </div>
          )}
        </div>

        {/* NỘI DUNG HOẶC KHUNG CHỈNH SỬA BÌNH LUẬN */}
        {editingCommentId === item.id ? (
          <div
            className={`mt-2 rounded-xl border space-y-2.5 animate-in fade-in duration-200 ${
              isRoot ? "p-3.5" : "p-2.5"
            } ${
              isDarkMode
                ? "bg-slate-900 border-emerald-500/40"
                : "bg-slate-50 border-emerald-400"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-500 flex items-center gap-1.5">
                <Edit2 className="w-3.5 h-3.5" />
                <span>Chỉnh sửa nội dung</span>
              </span>
              {/* Cho phép sửa sao nếu là bình luận gốc */}
              {isRoot && (
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setEditRatingInput(s)}
                      className="p-0.5 cursor-pointer hover:scale-125 transition-transform"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          s <= editRatingInput
                            ? "text-amber-400 fill-amber-400"
                            : isDarkMode ? "text-slate-700" : "text-slate-300"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-amber-500 ml-1">
                    ({editRatingInput}★)
                  </span>
                </div>
              )}
            </div>

            <textarea
              rows={isRoot ? 3 : 2}
              value={editContentInput}
              onChange={(e) => setEditContentInput(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:border-emerald-500 border transition-colors ${
                isDarkMode
                  ? "bg-slate-950 border-slate-700 text-white"
                  : "bg-white border-slate-300 text-slate-900"
              }`}
              maxLength={1000}
              autoFocus
            />

            <div className="flex justify-end items-center gap-2">
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={isSubmittingEdit}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  isDarkMode
                    ? "text-slate-400 hover:text-white bg-slate-800"
                    : "text-slate-600 hover:text-slate-900 bg-slate-200"
                }`}
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isSubmittingEdit || !editContentInput.trim()}
                onClick={() => handleSaveEdit(item.id, !isRoot)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-black text-slate-950 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-all"
              >
                {isSubmittingEdit ? (
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                <span>Lưu thay đổi</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            <p
              className={`text-xs leading-relaxed ${
                isRoot
                  ? `pl-11 ${isDarkMode ? "text-slate-200" : "text-slate-700"}`
                  : `pl-8 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`
              }`}
            >
              {item.noi_dung}
            </p>

            {/* NÚT BẤM TRẢ LỜI CỦA BÌNH LUẬN & TẤT CẢ CÂU TRẢ LỜI CON */}
            <div className={`${isRoot ? "pl-11" : "pl-8"} flex items-center gap-3 pt-0.5`}>
              <button
                type="button"
                onClick={() => {
                  if (replyingToId === item.id) {
                    setReplyingToId(null);
                    setReplyInput("");
                  } else {
                    setReplyingToId(item.id);
                    setReplyInput("");
                  }
                }}
                className={`text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                  isDarkMode
                    ? "text-emerald-400 hover:text-emerald-300"
                    : "text-emerald-600 hover:text-emerald-700"
                }`}
              >
                <CornerDownRight className="w-3 h-3" />
                <span>{replyingToId === item.id ? "Hủy trả lời" : "Trả lời"}</span>
              </button>
            </div>
          </>
        )}

        {/* KHUNG NHẬP CÂU TRẢ LỜI CHO ITEM NÀY (INLINE REPLY FORM) */}
        {replyingToId === item.id && (
          <div
            className={`${isRoot ? "ml-11" : "ml-8"} mt-2 p-3 rounded-xl border space-y-2 animate-in fade-in duration-200 ${
              isDarkMode
                ? "bg-slate-900 border-emerald-500/30"
                : "bg-slate-50 border-emerald-500/40"
            }`}
          >
            <span
              className={`text-[11px] font-bold flex items-center gap-1.5 ${
                isDarkMode ? "text-slate-300" : "text-slate-700"
              }`}
            >
              <CornerDownRight className="w-3 h-3 text-emerald-500" />
              <span>Trả lời @{item.ho_ten}:</span>
            </span>
            <textarea
              rows={2}
              value={replyInput}
              onChange={(e) => setReplyInput(e.target.value)}
              placeholder={`Nhập câu trả lời của bạn gửi đến @${item.ho_ten}...`}
              className={`w-full px-3 py-1.5 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors border ${
                isDarkMode
                  ? "bg-slate-950 border-slate-700 text-white"
                  : "bg-white border-slate-300 text-slate-900"
              }`}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setReplyingToId(null);
                  setReplyInput("");
                }}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                  isDarkMode
                    ? "text-slate-400 hover:text-white bg-slate-800"
                    : "text-slate-600 hover:text-slate-900 bg-slate-200"
                }`}
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isSubmittingReply || !replyInput.trim()}
                onClick={() => handleSubmitReply(item.id)}
                className="px-3 py-1 rounded-lg text-[11px] font-black text-slate-950 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 flex items-center gap-1 cursor-pointer"
              >
                {isSubmittingReply ? "Đang gửi..." : "Gửi trả lời"}
              </button>
            </div>
          </div>
        )}

        {/* KHU VỰC CÂU TRẢ LỜI CON (ẨN / HIỆN CÂU TRẢ LỜI) */}
        {hasReplies && (
          <>
            {/* Khi đang ẩn: hiển thị nút "Xem ... câu trả lời" */}
            {!isExpanded && (
              <div className={`${isRoot ? "pl-11" : "pl-8"} pt-1`}>
                <button
                  type="button"
                  onClick={() => toggleReplies(item.id)}
                  className="inline-flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 hover:underline transition-all cursor-pointer group"
                >
                  <span className="w-5 sm:w-6 h-[1.5px] bg-emerald-500/60 group-hover:bg-emerald-400 transition-colors" />
                  <ChevronDown className="w-3.5 h-3.5 transition-transform group-hover:translate-y-0.5" />
                  <span>Xem {totalReplies} câu trả lời</span>
                </button>
              </div>
            )}

            {/* Khi được mở: hiển thị toàn bộ danh sách câu trả lời con và nút "Ẩn câu trả lời" */}
            {isExpanded && (
              <div className="space-y-2">
                <div
                  className={`pt-2 space-y-2.5 border-l-2 ${
                    isRoot
                      ? "ml-4 sm:ml-11 pl-3 sm:pl-4 border-slate-200 dark:border-slate-800"
                      : "ml-2 sm:ml-4 pl-2.5 sm:pl-3 border-emerald-500/25"
                  }`}
                >
                  {item.tra_loi!.map((childReply) => renderCommentNode(childReply, depth + 1))}
                </div>

                <div className={`${isRoot ? "pl-11" : "pl-8"} pt-0.5`}>
                  <button
                    type="button"
                    onClick={() => toggleReplies(item.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:underline transition-all cursor-pointer group"
                  >
                    <span className="w-4 h-[1.5px] bg-slate-400/50 group-hover:bg-slate-400 transition-colors" />
                    <ChevronUp className="w-3.5 h-3.5 transition-transform group-hover:-translate-y-0.5" />
                    <span>Ẩn câu trả lời</span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[999999] flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-hidden animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-5xl xl:max-w-6xl max-h-[92vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 ${isDarkMode
            ? "bg-slate-900 border-slate-700/80 text-white shadow-black/90"
            : "bg-white border-slate-200 text-slate-900 shadow-2xl"
          }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER MODAL CỐ ĐỊNH */}
        <div
          className={`px-4 py-3 sm:px-6 sm:py-3.5 border-b flex items-center justify-between gap-3 shrink-0 ${isDarkMode ? "bg-slate-950/95 border-slate-800" : "bg-slate-50 border-slate-200"
            }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {(() => {
              const visual = getSportVisual(courtData);
              return (
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr ${visual.gradient} flex items-center justify-center text-lg sm:text-xl shadow-md shrink-0 border border-white/20 select-none`}>
                  <span>{visual.icon}</span>
                </div>
              );
            })()}
            <div className="min-w-0">
              <h2 className={`text-sm sm:text-base font-black truncate leading-tight flex items-center gap-2 ${
                isDarkMode ? "text-white" : "text-slate-900"
              }`}>
                <span>{courtData?.ten_san || "Chi Tiết Sân Bóng"}</span>
                {courtData && (
                  <span className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                    isDarkMode
                      ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                      : "bg-emerald-50 border-emerald-200 text-emerald-700"
                  }`}>
                    {courtData.ten_loai}
                  </span>
                )}
              </h2>
              <p className={`text-[11px] truncate ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                Xem hình ảnh, tiện ích, bảng giá và nhận xét từ người chơi
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 shrink-0 ${
              isDarkMode
                ? "bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700"
                : "bg-slate-200/80 hover:bg-slate-300 text-slate-700 hover:text-slate-900 border-slate-300"
            }`}
            title="Đóng cửa sổ"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* THÂN MODAL DẠNG NGANG GỌN GÀNG */}
        <div
          ref={modalScrollRef}
          className={`flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 ${
            isDarkMode ? "bg-slate-900/50" : "bg-slate-50/70"
          }`}
        >
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className={`text-xs font-semibold ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                Đang tải chi tiết và đánh giá sân...
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* CỘT TRÁI (COL-SPAN-5): THÔNG TIN SÂN, BẢNG GIÁ, TIỆN ÍCH & NÚT ĐẶT SÂN */}
              <div className="lg:col-span-5 flex flex-col gap-3.5">
                {/* ẢNH THỰC TẾ SÂN DẠNG NGANG LANDSCAPE */}
                <div className={`w-full aspect-[16/10] relative rounded-2xl overflow-hidden border group shadow-md shrink-0 ${
                  isDarkMode ? "border-slate-800" : "border-slate-200"
                }`}>
                  <img
                    src={courtImage}
                    alt={courtData?.ten_san}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent flex flex-col justify-between p-3.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase shadow-sm ${
                        courtData?.trang_thai === "SAN_SANG"
                          ? "bg-emerald-500 text-slate-950"
                          : "bg-amber-500 text-slate-950"
                      }`}>
                        {courtData?.trang_thai === "SAN_SANG" ? "Sẵn sàng thi đấu" : "Đang bảo trì"}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-950/80 text-white backdrop-blur-sm border border-slate-700">
                        {courtData?.ten_loai}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-sm text-amber-400 border border-amber-400/30 text-[11px] font-black">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>{courtData?.diem_trung_binh ? Number(courtData.diem_trung_binh).toFixed(1) : "5.0"}</span>
                        </div>
                        <span className="text-[11px] text-slate-300 font-medium drop-shadow">
                          ({courtData?.tong_danh_gia || 0} đánh giá)
                        </span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-black text-white drop-shadow-md">
                        {courtData?.ten_san}
                      </h3>
                    </div>
                  </div>
                </div>

                {/* BẢNG GIÁ THUÊ SÂN */}
                <div className={`p-3.5 rounded-2xl border ${
                  isDarkMode ? "bg-slate-950/60 border-slate-800" : "bg-emerald-50/50 border-emerald-100"
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[11px] font-bold uppercase tracking-wider ${
                      isDarkMode ? "text-slate-400" : "text-slate-600"
                    }`}>
                      Bảng giá thuê sân
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                      Giá niêm yết
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className={`p-2.5 rounded-xl border ${
                      isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
                    }`}>
                      <p className={`text-[10px] font-medium ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                        Theo giờ (60 phút)
                      </p>
                      <p className={`text-base sm:text-lg font-black mt-0.5 ${
                        isDarkMode ? "text-emerald-400" : "text-emerald-600"
                      }`}>
                        {hourlyPrice.toLocaleString("vi-VN")} đ
                      </p>
                    </div>
                    <div className={`p-2.5 rounded-xl border ${
                      isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
                    }`}>
                      <p className={`text-[10px] font-medium ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                        Theo ca (30 phút)
                      </p>
                      <p className={`text-base sm:text-lg font-black mt-0.5 ${
                        isDarkMode ? "text-teal-400" : "text-teal-600"
                      }`}>
                        {(hourlyPrice / 2).toLocaleString("vi-VN")} đ
                      </p>
                    </div>
                  </div>
                </div>

                {/* TIỆN ÍCH & ĐẶC QUYỀN SÂN (DỮ LIỆU THẬT TỪ CSDL) */}
                <div className={`p-3.5 rounded-2xl border space-y-2.5 ${
                  isDarkMode ? "bg-slate-950/60 border-slate-800" : "bg-white border-slate-200"
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] font-bold uppercase tracking-wider block ${
                      isDarkMode ? "text-slate-400" : "text-slate-600"
                    }`}>
                      Tiện ích & Đặc quyền sân
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      isDarkMode
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    }`}>
                      Chuẩn cơ sở vật chất
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {courtAmenities.map((amenity, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span className={`text-[11px] font-medium leading-snug break-words ${
                          isDarkMode ? "text-slate-300" : "text-slate-700"
                        }`}>
                          {amenity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* NÚT ĐẶT SÂN NGAY */}
                <button
                  type="button"
                  onClick={() => {
                    if (onBookNow && courtData) {
                      onBookNow(courtData);
                    }
                    onClose();
                  }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-95"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>Chọn Giờ & Đặt Sân Này Ngay</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* CỘT PHẢI (COL-SPAN-7): ĐÁNH GIÁ, FORM GỬI & DANH SÁCH BÌNH LUẬN */}
              <div className="lg:col-span-7 flex flex-col gap-3.5">
                {/* THỐNG KÊ ĐÁNH GIÁ TỔNG QUAN */}
                <div className={`p-4 rounded-2xl border ${
                  isDarkMode
                    ? "bg-slate-950/60 border-slate-800"
                    : "bg-white border-slate-200 shadow-sm"
                }`}>
                  <div className="grid grid-cols-12 gap-3 items-center">
                    {/* ĐIỂM TRUNG BÌNH */}
                    <div className={`col-span-4 flex flex-col items-center justify-center text-center pr-3 border-r ${
                      isDarkMode ? "border-slate-800" : "border-slate-200"
                    }`}>
                      <span className="text-3xl sm:text-4xl font-black text-amber-500 leading-none">
                        {courtData?.diem_trung_binh ? Number(courtData.diem_trung_binh).toFixed(1) : "5.0"}
                      </span>
                      <div className="flex items-center gap-0.5 my-1.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${s <= Math.round(courtData?.diem_trung_binh || 5)
                                ? "text-amber-400 fill-amber-400"
                                : isDarkMode ? "text-slate-700" : "text-slate-300"
                              }`}
                          />
                        ))}
                      </div>
                      <span className={`text-[11px] ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                        Dựa trên <strong>{courtData?.tong_danh_gia || 0}</strong> lượt đánh giá
                      </span>
                    </div>

                    {/* THANH PHÂN PHỐI SỐ SAO */}
                    <div className="col-span-8 space-y-1 pl-1">
                      {[5, 4, 3, 2, 1].map((starNum) => {
                        const count = (courtData as any)?.[`sao_${starNum}`] || 0;
                        const total = courtData?.tong_danh_gia || 1;
                        const pct = Math.round((count / total) * 100);
                        return (
                          <div key={starNum} className={`flex items-center gap-2 text-[11px] ${
                            isDarkMode ? "text-slate-400" : "text-slate-600"
                          }`}>
                            <span className={`w-8 text-right font-bold flex items-center justify-end gap-0.5 ${
                              isDarkMode ? "text-slate-300" : "text-slate-700"
                            }`}>
                              <span>{starNum}</span>
                              <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                            </span>
                            <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${
                              isDarkMode ? "bg-slate-800" : "bg-slate-100 border border-slate-200"
                            }`}>
                              <div
                                className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className={`w-6 text-right font-mono text-[10px] ${
                              isDarkMode ? "text-slate-400" : "text-slate-500"
                            }`}>{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* FORM GỬI ĐÁNH GIÁ & BÌNH LUẬN */}
                <div className={`p-4 rounded-2xl border space-y-2.5 ${
                  isDarkMode
                    ? "bg-slate-950/80 border-slate-800"
                    : "bg-white border-slate-200 shadow-sm"
                }`}>
                  <div className="flex items-center justify-between">
                    <h4 className={`text-xs font-black flex items-center gap-1.5 ${
                      isDarkMode ? "text-white" : "text-slate-900"
                    }`}>
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Viết Đánh Giá Của Bạn</span>
                    </h4>
                    {currentUser && (
                      <span className={`text-[11px] ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                        Đang đánh giá với tên: <strong className={isDarkMode ? "text-emerald-400" : "text-emerald-700"}>{currentUser.ho_ten || currentUser.hoTen}</strong>
                      </span>
                    )}
                  </div>

                  {feedbackMsg.text && (
                    <div
                      className={`p-2 rounded-xl text-xs flex items-center gap-1.5 ${feedbackMsg.type === "success"
                          ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                          : "bg-rose-500/15 border border-rose-500/30 text-rose-400"
                        }`}
                    >
                      {feedbackMsg.type === "success" ? (
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      )}
                      <span>{feedbackMsg.text}</span>
                    </div>
                  )}

                  {currentUser ? (
                    <form onSubmit={handleSubmitReview} className="space-y-2.5">
                      {/* CHỌN SỐ SAO */}
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className={`text-xs font-semibold ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                          Chấm điểm:
                        </span>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <button
                              type="button"
                              key={s}
                              onMouseEnter={() => setHoverRating(s)}
                              onMouseLeave={() => setHoverRating(0)}
                              onClick={() => setRatingInput(s)}
                              className="p-0.5 cursor-pointer transition-transform hover:scale-125 focus:outline-none"
                            >
                              <Star
                                className={`w-4 h-4 transition-colors ${s <= (hoverRating || ratingInput)
                                    ? "text-amber-400 fill-amber-400"
                                    : isDarkMode ? "text-slate-700" : "text-slate-300"
                                  }`}
                              />
                            </button>
                          ))}
                        </div>
                        <span className="text-[11px] font-bold text-amber-500">
                          {ratingInput === 5
                            ? "Tuyệt vời (5★)"
                            : ratingInput === 4
                              ? "Rất tốt (4★)"
                              : ratingInput === 3
                                ? "Bình thường (3★)"
                                : ratingInput === 2
                                  ? "Chưa hài lòng (2★)"
                                  : "Tệ (1★)"}
                        </span>
                      </div>

                      {/* Ô NHẬP NHẬN XÉT */}
                      <div className="relative">
                        <textarea
                          rows={2}
                          value={commentInput}
                          onChange={(e) => setCommentInput(e.target.value)}
                          placeholder="Chia sẻ trải nghiệm thi đấu tại sân này (mặt sân, đèn chiếu sáng, dịch vụ hỗ trợ...)"
                          className={`w-full px-3 py-2 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors border ${
                            isDarkMode
                              ? "bg-slate-900 border-slate-700 text-white"
                              : "bg-slate-50 border-slate-200 text-slate-900"
                          }`}
                          required
                          maxLength={1000}
                        />
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {isSubmitting ? (
                            <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                          <span>Gửi Đánh Giá</span>
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className={`p-3 rounded-xl border text-center space-y-1.5 ${
                      isDarkMode
                        ? "bg-slate-900 border-slate-800 text-slate-400"
                        : "bg-slate-50 border-slate-200 text-slate-600"
                    }`}>
                      <p className="text-xs">
                        Bạn cần đăng nhập tài khoản để có thể chấm điểm và gửi bình luận đánh giá cho sân này.
                      </p>
                      <span className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        isDarkMode
                          ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/25"
                          : "text-emerald-700 bg-emerald-50 border border-emerald-200"
                      }`}>
                        Vui lòng đăng nhập từ menu đầu trang
                      </span>
                    </div>
                  )}
                </div>

                {/* DANH SÁCH BÌNH LUẬN & TRẢ LỜI */}
                <div className="space-y-3">
                  <div className={`flex items-center justify-between border-b pb-1.5 ${
                    isDarkMode ? "border-slate-800" : "border-slate-200"
                  }`}>
                    <h4 className={`text-xs font-black flex items-center gap-1.5 ${
                      isDarkMode ? "text-white" : "text-slate-900"
                    }`}>
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Nhận Xét Từ Cộng Đồng Người Chơi</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                        isDarkMode ? "text-emerald-400 bg-emerald-500/15" : "text-emerald-700 bg-emerald-100"
                      }`}>
                        {totalReviewsCount}
                      </span>
                    </h4>
                  </div>

                  {reviews.length === 0 ? (
                    <div className={`py-6 text-center text-xs ${
                      isDarkMode ? "text-slate-500" : "text-slate-400"
                    }`}>
                      <MessageSquare className={`w-6 h-6 mx-auto mb-1.5 ${
                        isDarkMode ? "text-slate-700" : "text-slate-300"
                      }`} />
                      <p>Chưa có bình luận nào cho sân này. Hãy là người đầu tiên đánh giá!</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                      {reviews.map((rev) => renderCommentNode(rev, 0))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL XÁC NHẬN XÓA BÌNH LUẬN (DẠNG MODAL ĐẸP THAY THẾ WINDOW.CONFIRM) */}
      {commentToDelete !== null && (
        <div
          className="fixed inset-0 z-[9999999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => {
            if (!isDeletingComment) setCommentToDelete(null);
          }}
        >
          <div
            className={`relative w-full max-w-sm rounded-3xl border p-6 shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-200 ${
              isDarkMode
                ? "bg-slate-900 border-slate-700/80 text-white"
                : "bg-white border-slate-200 text-slate-900 shadow-2xl"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ICON THÙNG RÁC ĐỎ NỔI BẬT */}
            <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
              <Trash2 className="w-8 h-8 stroke-[2.2]" />
            </div>

            <div className="space-y-1.5">
              <h3 className={`text-lg font-black ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                Xác nhận xóa bình luận
              </h3>
              <p className={`text-xs leading-relaxed ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                Bạn có chắc chắn muốn xóa bình luận này không? Hành động này sẽ xóa vĩnh viễn và không thể hoàn tác.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCommentToDelete(null)}
                disabled={isDeletingComment}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  isDarkMode
                    ? "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                    : "border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={confirmDeleteComment}
                disabled={isDeletingComment}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs shadow-lg shadow-rose-600/30 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
              >
                {isDeletingComment ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>{isDeletingComment ? "Đang xóa..." : "Xác nhận xóa"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

