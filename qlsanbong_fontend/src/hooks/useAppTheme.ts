import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'APP_THEME_DARK';
const THEME_CHANGE_EVENT = 'app-theme-changed';

/**
 * Hook đồng bộ chế độ Sáng / Tối (Dark / Light Mode) thời gian thực trên tất cả các trang:
 * Trang Chủ, Tin Tức, About Us, Liên Hệ, Dashboard, POS...
 */
export function useAppTheme(defaultDark: boolean = true) {
  // Luôn khởi tạo cùng một giá trị mặc định trên cả Server (SSR) và Client để tránh Hydration Mismatch
  const [isDarkMode, setIsDarkModeState] = useState<boolean>(defaultDark);
  const [mounted, setMounted] = useState<boolean>(false);

  // Đồng bộ class trên thẻ <html> và localStorage sau khi mount (chỉ chạy ở Client)
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('theme');
      let currentDark = defaultDark;
      if (saved !== null) {
        currentDark = saved === 'true' || saved === 'dark';
      } else {
        currentDark = document.documentElement.classList.contains('dark') || defaultDark;
        localStorage.setItem(STORAGE_KEY, currentDark ? 'true' : 'false');
        localStorage.setItem('theme', currentDark ? 'dark' : 'light');
      }

      setIsDarkModeState(currentDark);
      if (currentDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (_err) {}

    // Lắng nghe sự kiện đổi theme từ HeaderNav hoặc bất kỳ component nào trong cùng tab
    const handleCustomThemeEvent = (event: any) => {
      const dark = typeof event.detail === 'boolean' ? event.detail : (event.detail === 'dark' || event.detail === 'true');
      setIsDarkModeState(dark);
      if (dark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    // Lắng nghe sự kiện storage từ các tab khác
    const handleStorageEvent = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY || event.key === 'theme') {
        const dark = event.newValue === 'true' || event.newValue === 'dark';
        setIsDarkModeState(dark);
        if (dark) {
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

  // Hàm chuyển đổi bật / tắt theme
  const toggleTheme = useCallback(() => {
    setIsDarkModeState((current) => {
      const nextVal = !current;
      try {
        localStorage.setItem(STORAGE_KEY, nextVal ? 'true' : 'false');
        localStorage.setItem('theme', nextVal ? 'dark' : 'light');
        if (nextVal) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        // Phát sự kiện ra window để tất cả các component (HeaderNav, Page...) đồng loạt cập nhật
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: nextVal }));
        }, 0);
      } catch (_err) {}
      return nextVal;
    });
  }, []);

  const setIsDarkMode = useCallback((value: boolean | ((prev: boolean) => boolean)) => {
    setIsDarkModeState((current) => {
      const nextVal = typeof value === 'function' ? value(current) : value;
      try {
        localStorage.setItem(STORAGE_KEY, nextVal ? 'true' : 'false');
        localStorage.setItem('theme', nextVal ? 'dark' : 'light');
        if (nextVal) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: nextVal }));
        }, 0);
      } catch (_err) {}
      return nextVal;
    });
  }, []);

  return { isDarkMode, setIsDarkMode, toggleTheme, mounted };
}
