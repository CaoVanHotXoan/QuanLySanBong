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

  // Hàm thực hiện hiệu ứng gợn tròn lan tỏa từ nút bấm khi đổi theme
  const applyThemeWithTransition = useCallback((nextVal: boolean, event?: React.MouseEvent | MouseEvent | any) => {
    const updateThemeDOMAndState = () => {
      setIsDarkModeState(nextVal);
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
    };

    // Kiểm tra trình duyệt có hỗ trợ View Transitions API hay không và người dùng có tắt hiệu ứng không
    if (
      typeof document === 'undefined' ||
      !(document as any).startViewTransition ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      updateThemeDOMAndState();
      return;
    }

    // Xác định tọa độ tâm hiệu ứng từ nút bấm
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;

    if (event && typeof event.clientX === 'number' && typeof event.clientY === 'number' && (event.clientX !== 0 || event.clientY !== 0)) {
      x = event.clientX;
      y = event.clientY;
    } else if (event && event.currentTarget && typeof event.currentTarget.getBoundingClientRect === 'function') {
      const rect = event.currentTarget.getBoundingClientRect();
      x = rect.left + rect.width / 2;
      y = rect.top + rect.height / 2;
    }

    // Bán kính tối đa để vòng tròn bao trùm toàn bộ 4 góc màn hình
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = (document as any).startViewTransition(() => {
      updateThemeDOMAndState();
    });

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ];

      document.documentElement.animate(
        {
          clipPath: clipPath,
        },
        {
          duration: 500,
          easing: 'ease-in-out',
          pseudoElement: '::view-transition-new(root)',
        }
      );
    });
  }, []);

  // Hàm chuyển đổi bật / tắt theme
  const toggleTheme = useCallback((event?: React.MouseEvent | MouseEvent | any) => {
    setIsDarkModeState((current) => {
      const nextVal = !current;
      applyThemeWithTransition(nextVal, event);
      return nextVal;
    });
  }, [applyThemeWithTransition]);

  const setIsDarkMode = useCallback((value: boolean | ((prev: boolean) => boolean), event?: React.MouseEvent | MouseEvent | any) => {
    setIsDarkModeState((current) => {
      const nextVal = typeof value === 'function' ? value(current) : value;
      applyThemeWithTransition(nextVal, event);
      return nextVal;
    });
  }, [applyThemeWithTransition]);

  return { isDarkMode, setIsDarkMode, toggleTheme, mounted };
}
