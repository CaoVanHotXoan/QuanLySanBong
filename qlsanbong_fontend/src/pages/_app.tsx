import "@/styles/globals.css";
import "@/styles/login.css";
import "@/styles/profile.css";
import "@/styles/history.css";
import type { AppProps } from "next/app";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import SoccerLoader from "@/components/SoccerLoader";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [isPageChanging, setIsPageChanging] = useState<boolean>(false);

  useEffect(() => {
    const handleStart = (url: string) => {
      if (url !== router.asPath) {
        setIsPageChanging(true);
      }
    };
    const handleComplete = () => {
      // Đợi hiệu ứng render hoàn tất mới tắt loading
      setTimeout(() => {
        setIsPageChanging(false);
      }, 300);
    };

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleComplete);
    router.events.on("routeChangeError", handleComplete);

    // Đồng bộ theme toàn cục khi ứng dụng khởi chạy
    const applyTheme = (isDark: boolean) => {
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    try {
      const savedTheme = localStorage.getItem('APP_THEME_DARK');
      const legacyTheme = localStorage.getItem('theme');
      const isDark = savedTheme !== null ? savedTheme === 'true' : (legacyTheme !== null ? legacyTheme === 'dark' : true);
      applyTheme(isDark);
      if (savedTheme === null) localStorage.setItem('APP_THEME_DARK', isDark ? 'true' : 'false');
      if (legacyTheme === null) localStorage.setItem('theme', isDark ? 'dark' : 'light');
    } catch (_e) {}

    const handleThemeEvent = (e: any) => {
      if (typeof e.detail === 'boolean') applyTheme(e.detail);
    };
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'APP_THEME_DARK' && e.newValue !== null) {
        applyTheme(e.newValue === 'true');
      } else if (e.key === 'theme' && e.newValue !== null) {
        applyTheme(e.newValue === 'dark');
      }
    };

    window.addEventListener('app-theme-changed', handleThemeEvent);
    window.addEventListener('storage', handleStorage);

    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleComplete);
      router.events.off("routeChangeError", handleComplete);
      window.removeEventListener('app-theme-changed', handleThemeEvent);
      window.removeEventListener('storage', handleStorage);
    };
  }, [router]);

  return (
    <>
      {isPageChanging && <SoccerLoader message="Đang chuyển trang & tải dữ liệu..." fullScreen={true} />}
      <Component {...pageProps} />
    </>
  );
}
