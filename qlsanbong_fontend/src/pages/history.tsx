import React from "react";
import Head from "next/head";
import History from "./History/History";

export default function HistoryPage() {
  return (
    <>
      <Head>
        <title>Lịch Sử Đặt Sân | Soccer247</title>
        <meta name="description" content="Xem chi tiết lịch sử đặt sân bóng và trạng thái thanh toán" />
      </Head>
      <History />
    </>
  );
}
