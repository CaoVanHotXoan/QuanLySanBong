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

    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleComplete);
      router.events.off("routeChangeError", handleComplete);
    };
  }, [router]);

  return (
    <>
      {isPageChanging && <SoccerLoader message="Đang chuyển trang & tải dữ liệu..." fullScreen={true} />}
      <Component {...pageProps} />
    </>
  );
}
