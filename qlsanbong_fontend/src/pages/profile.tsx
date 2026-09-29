import React from "react";
import Head from "next/head";
import Profile from "../profile/profile";

export default function ProfilePage() {
  return (
    <>
      <Head>
        <title>Thông Tin Cá Nhân | Hệ Thống Quản Lý Sân Bóng</title>
        <meta name="description" content="Quản lý thông tin tài khoản cá nhân" />
      </Head>
      <Profile />
    </>
  );
}
