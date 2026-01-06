'use client';

import { useState, useEffect } from 'react';

export function SplashScreen({ onComplete }: { onComplete?: () => void } = {}) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div 
      className={`fixed inset-0 flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#4FB6A1] via-[#1E2937] to-[#0F1419] transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      style={{ zIndex: 9999 }}
    >
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#4FB6A1] rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6 px-8">
        <div className="relative w-32 h-32 sm:w-40 sm:h-40">
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full drop-shadow-2xl"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#4FB6A1"
              strokeWidth="0.5"
              opacity="0.3"
            />
            <path
              d="M 50 15 L 50 85 M 50 15 C 30 15 20 30 20 50 C 20 70 30 85 50 85"
              fill="none"
              stroke="#F5F7F6"
              strokeWidth="8"
              strokeLinecap="round"
              className="drop-shadow-lg"
            />
            <path
              d="M 50 25 C 35 25 30 37.5 30 50 C 30 62.5 35 75 50 75"
              fill="none"
              stroke="#4FB6A1"
              strokeWidth="3"
              strokeLinecap="round"
              opacity="0.6"
            />
            <circle
              cx="68"
              cy="50"
              r="4"
              fill="#4FB6A1"
              className="animate-pulse"
            />
          </svg>
        </div>

        <div className="flex flex-col items-center gap-2">
          <h1 className="text-5xl sm:text-6xl font-bold text-[#F5F7F6] tracking-tight">
            Rivryn
          </h1>
          <p className="text-lg sm:text-xl text-[#4FB6A1] font-light tracking-wide">
            Code anywhere
          </p>
        </div>

        <div className="mt-8 flex gap-2">
          <div className="w-2 h-2 rounded-full bg-[#4FB6A1] animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-[#4FB6A1] animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-[#4FB6A1] animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>

      <div className="absolute bottom-8 text-[#F5F7F6] text-xs opacity-40">
        v1.0.0
      </div>
    </div>
  );
}
