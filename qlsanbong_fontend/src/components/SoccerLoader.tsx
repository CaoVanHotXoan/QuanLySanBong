import React from 'react';

/**
 * SVG Trái Banh Bóng Đá Chuẩn (Soccer Ball)
 */
export const SoccerBallIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Vỏ ngoài trái bóng */}
    <circle cx="50" cy="50" r="46" fill="#FFFFFF" stroke="#0f172a" strokeWidth="4" />
    
    {/* Ngũ giác trung tâm */}
    <polygon points="50,33 66,45 60,64 40,64 34,45" fill="#0f172a" />
    
    {/* Các ngũ giác và mảng đen viền ngoài */}
    <polygon points="50,4 62,18 38,18" fill="#0f172a" />
    <polygon points="86,18 96,36 82,34" fill="#0f172a" />
    <polygon points="94,66 78,82 82,64" fill="#0f172a" />
    <polygon points="6,66 22,82 18,64" fill="#0f172a" />
    <polygon points="14,18 4,36 18,34" fill="#0f172a" />

    {/* Các đường may / rãnh bóng kết nối */}
    <line x1="50" y1="18" x2="50" y2="33" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
    <line x1="82" y1="34" x2="66" y2="45" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
    <line x1="82" y1="64" x2="60" y2="64" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
    <line x1="18" y1="64" x2="40" y2="64" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
    <line x1="18" y1="34" x2="34" y2="45" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />

    <line x1="62" y1="18" x2="82" y2="34" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
    <line x1="38" y1="18" x2="18" y2="34" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
    <line x1="82" y1="64" x2="78" y2="82" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
    <line x1="18" y1="64" x2="22" y2="82" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
    <line x1="40" y1="64" x2="22" y2="82" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
    <line x1="60" y1="64" x2="78" y2="82" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

interface SoccerLoaderProps {
  message?: string;
  fullScreen?: boolean;
}

/**
 * Hiệu ứng Loading hình 12 Trái Banh xoay tròn (Thay thế khối spinner truyền thống)
 */
export default function SoccerLoader({
  message = "Đang tải dữ liệu...",
  fullScreen = true,
}: SoccerLoaderProps) {
  // 12 vị trí góc quanh vòng tròn (30 độ mỗi quả bóng)
  const balls = Array.from({ length: 12 });
  const radius = 48; // Bán kính vòng xoay (px)

  const content = (
    <div className="flex flex-col items-center justify-center gap-6 select-none animate-fade-in">
      {/* Vòng xoay 12 trái banh bóng đá */}
      <div className="relative w-32 h-32 flex items-center justify-center">
        {balls.map((_, i) => {
          const angleDeg = i * 30 - 90; // Bắt đầu từ vị trí 12h
          const angleRad = (angleDeg * Math.PI) / 180;
          const x = Math.round(Math.cos(angleRad) * radius);
          const y = Math.round(Math.sin(angleRad) * radius);
          const delay = ((i / 12) * 1.0 - 1.0).toFixed(2);

          return (
            <div
              key={i}
              className="absolute transition-all"
              style={{
                transform: `translate(${x}px, ${y}px)`,
                animation: `soccerSpinFade 1.1s linear infinite`,
                animationDelay: `${delay}s`,
              }}
            >
              <div className="w-5 h-5 rounded-full shadow-md filter drop-shadow-sm hover:scale-110 transition-transform">
                <SoccerBallIcon className="w-5 h-5" />
              </div>
            </div>
          );
        })}

        {/* Trái banh trung tâm phát sáng nhẹ */}
        <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center animate-pulse">
          <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
        </div>
      </div>

      {/* Dòng chữ thông báo tải dữ liệu */}
      {message && (
        <div className="flex flex-col items-center gap-1.5 text-center">
          <div className="text-sm font-black tracking-wide text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-4 py-1.5 rounded-full shadow-lg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>{message}</span>
          </div>
          <span className="text-[11px] font-medium text-slate-400">Vui lòng chờ trong giây lát...</span>
        </div>
      )}

      <style jsx global>{`
        @keyframes soccerSpinFade {
          0% {
            opacity: 1;
            transform: scale(1.15) translate(var(--tw-translate-x, 0), var(--tw-translate-y, 0));
          }
          50% {
            opacity: 0.35;
            transform: scale(0.9) translate(var(--tw-translate-x, 0), var(--tw-translate-y, 0));
          }
          100% {
            opacity: 0.12;
            transform: scale(0.8) translate(var(--tw-translate-x, 0), var(--tw-translate-y, 0));
          }
        }
      `}</style>
    </div>
  );

  if (!fullScreen) {
    return <div className="py-12 flex items-center justify-center">{content}</div>;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/85 backdrop-blur-md transition-all duration-300">
      {content}
    </div>
  );
}
