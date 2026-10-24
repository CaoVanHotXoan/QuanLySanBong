import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. Tìm tệp OpenAPI.yaml duy nhất trong thư mục backend hoặc lân cận
  const candidates = [
    path.resolve(process.cwd(), '../qlsanbong_backend/OpenAPI.yaml'),
    path.resolve(process.cwd(), 'OpenAPI.yaml'),
    path.resolve(__dirname, '../../../../qlsanbong_backend/OpenAPI.yaml'),
  ];

  for (const filePath of candidates) {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      res.setHeader('Content-Type', 'text/yaml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=300');
      return res.status(200).send(content);
    }
  }

  // 2. Dự phòng: Nếu deploy tách biệt môi trường, lấy từ máy chủ Backend
  const backendBase = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') || 'https://qlsbbackend.vercel.app';
  try {
    const backendRes = await fetch(`${backendBase}/OpenAPI.yaml`);
    if (backendRes.ok) {
      const content = await backendRes.text();
      res.setHeader('Content-Type', 'text/yaml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=300');
      return res.status(200).send(content);
    }
  } catch {
    // Backend chưa chạy
  }

  return res.status(404).send('# Không tìm thấy tệp OpenAPI.yaml');
}
