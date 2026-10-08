/**
 * =====================================================================
 * TIỆN ÍCH TỐI ƯU HÓA HÌNH ẢNH (IMAGE OPTIMIZER HELPER)
 * - Tự động nén WebP/AVIF và chất lượng phù hợp (f_auto,q_auto) cho Cloudinary
 * - Tối ưu kích thước ảnh từ Unsplash hoặc CDN
 * =====================================================================
 */

export const getOptimizedImageUrl = (url?: string | null, width?: number): string => {
  if (!url || typeof url !== 'string') return '/images/default-court.jpg';
  
  const trimmedUrl = url.trim();
  if (!trimmedUrl) return '/images/default-court.jpg';

  // 1. Tối ưu ảnh Cloudinary (tự động chuyển sang WebP/AVIF và nén thông minh)
  if (trimmedUrl.includes('res.cloudinary.com')) {
    if (trimmedUrl.includes('/image/upload/')) {
      // Đã có transformation hay chưa
      const transform = width ? `f_auto,q_auto,w_${width},c_limit/` : 'f_auto,q_auto/';
      if (!trimmedUrl.includes('f_auto') && !trimmedUrl.includes('q_auto')) {
        return trimmedUrl.replace('/image/upload/', `/image/upload/${transform}`);
      }
    }
  }

  // 2. Tối ưu ảnh Unsplash
  if (trimmedUrl.includes('images.unsplash.com')) {
    const hasParams = trimmedUrl.includes('?');
    const autoParams = 'auto=format&fit=crop&q=80' + (width ? `&w=${width}` : '');
    if (!hasParams) {
      return `${trimmedUrl}?${autoParams}`;
    }
    if (!trimmedUrl.includes('auto=format')) {
      return `${trimmedUrl}&${autoParams}`;
    }
  }

  return trimmedUrl;
};
