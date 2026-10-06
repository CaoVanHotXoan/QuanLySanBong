import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'APP_THEME_DARK';
const THEME_CHANGE_EVENT = 'app-theme-changed';

/**
 * Hook đồng bộ chế độ Sáng / Tối (Dark / Light Mode) thời gian thực trên tất cả các trang
 * Tự động lưu vào localStorage và đồng bộ ngay lập tức giữa Trang Chủ, Dashboard, POS, Lịch Sử...
 */
export function useAppTheme(defaultDark: boolean = true) {
  const [isDarkMode, setIsDarkModeState] = useState<boolean>(defaultDark);

  // Đọc theme đã lưu từ localStorage ngay khi component mount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(STORAGE_KEY);
      if (savedTheme !== null) {
        const isDark = savedTheme === 'true';
        setIsDarkModeState(isDark);
        if (isDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } else {
        // Nếu chưa từng cài đặt, đặt mặc định là Tối (dark mode)
        localStorage.setItem(STORAGE_KEY, defaultDark ? 'true' : 'false');
        localStorage.setItem('theme', defaultDark ? 'dark' : 'light');
        if (defaultDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    } catch (_err) {
      // Bỏ qua nếu môi trường không có localStorage
    }

    // Lắng nghe sự kiện đổi theme từ các trang / component khác trong cùng tab
    const handleCustomThemeEvent = (event: any) => {
      if (typeof event.detail === 'boolean') {
        setIsDarkModeState(event.detail);
        if (event.detail) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    };

    // Lắng nghe sự kiện storage từ các tab trình duyệt khác
    const handleStorageEvent = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && event.newValue !== null) {
        const isDark = event.newValue === 'true';
        setIsDarkModeState(isDark);
        if (isDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } else if (event.key === 'theme' && event.newValue !== null) {
        const isDark = event.newValue === 'dark';
        setIsDarkModeState(isDark);
        if (isDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    };

    window.addEventListener(THEME_CHANGE_EVENT, handleCustomThemeEvent);
    window.addEventListener('storage', handleStorageEvent);

    return () => {
      window.removeEventListener(THEME_CHANGE_EVENT, handleCustomThemeEvent);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, [defaultDark]);

  // Hàm cập nhật theme và thông báo cho toàn bộ các trang khác
  const setIsDarkMode = useCallback((value: boolean | ((prev: boolean) => boolean)) => {
    setIsDarkModeState((prev) => {
      const nextVal = typeof value === 'function' ? value(prev) : value;
      try {
        localStorage.setItem(STORAGE_KEY, nextVal ? 'true' : 'false');
        localStorage.setItem('theme', nextVal ? 'dark' : 'light');
        if (nextVal) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: nextVal }));
      } catch (_err) {}
      return nextVal;
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDarkMode((prev) => !prev);
  }, [setIsDarkMode]);

  return { isDarkMode, setIsDarkMode, toggleTheme };
}
