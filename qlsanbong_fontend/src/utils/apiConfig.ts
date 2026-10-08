/**
 * =====================================================================
 * CẤU HÌNH ĐƯỜNG DẪN API & SOCKET.IO CHO MÔI TRƯỜNG DEV & VERCEL ONLINE
 * =====================================================================
 */

export const getApiBaseUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;

  // Kiểm tra nếu đang chạy trên trình duyệt thực tế (Vercel, domain public)
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    // Nếu biến môi trường bị thiếu hoặc đang trỏ về localhost -> Tự động chuyển sang Backend Online
    if (!envUrl || envUrl.includes('localhost') || envUrl.includes('127.0.0.1')) {
      return 'https://qlsbbackend.vercel.app/api';
    }
    return envUrl;
  }

  // Khi chạy local dev
  return envUrl || 'http://localhost:5000/api';
};

export const getSocketUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_SOCKET_URL;

  // Kiểm tra nếu đang chạy trên trình duyệt thực tế (Vercel, domain public)
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    if (!envUrl || envUrl.includes('localhost') || envUrl.includes('127.0.0.1')) {
      return 'https://qlsbbackend.vercel.app';
    }
    return envUrl;
  }

  return envUrl || 'http://localhost:5000';
};
