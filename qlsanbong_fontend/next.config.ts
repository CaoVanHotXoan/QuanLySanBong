import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/Management%20System/management%20system',
        destination: '/management-system',
      },
      {
        source: '/Management System/management system',
        destination: '/management-system',
      },
      {
        source: '/Management%20System',
        destination: '/management-system',
      },
      {
        source: '/Management System',
        destination: '/management-system',
      },
    ];
  },
};

export default nextConfig;
