import React from 'react';

interface BrandLogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  theme?: 'light' | 'dark';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  showText = true,
  size = 'md',
  theme = 'light',
}) => {
  const iconSize = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-11 h-11' : 'w-9 h-9';
  const textTitleSize = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm';
  const textSubSize = size === 'sm' ? 'text-[9px]' : size === 'lg' ? 'text-[11px]' : 'text-[10px]';

  const isDark = theme === 'dark';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`relative flex ${iconSize} shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-0.5 shadow-md shadow-blue-900/20 ring-1 ring-blue-500/30`}>
        <svg
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full p-1.5"
        >
          <defs>
            <linearGradient id="brandLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#c7d2fe" />
            </linearGradient>
            <linearGradient id="barGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#93c5fd" stopOpacity="0.7" />
            </linearGradient>
          </defs>
          {/* Hexagonal / Diamond Circuit Frame */}
          <path
            d="M18 3L31 10.5V25.5L18 33L5 25.5V10.5L18 3Z"
            stroke="url(#brandLogoGrad)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Performance Pulse Bars */}
          <rect x="10.5" y="18" width="3" height="7" rx="1" fill="url(#barGrad)" />
          <rect x="16.5" y="12" width="3" height="13" rx="1" fill="url(#brandLogoGrad)" />
          <rect x="22.5" y="15" width="3" height="10" rx="1" fill="url(#barGrad)" />
          {/* Top Peak Node */}
          <circle cx="18" cy="7" r="1.8" fill="#38bdf8" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col overflow-hidden">
          <span className={`${textTitleSize} font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'} leading-snug truncate`}>
            BGES BEKASI
          </span>
          <span className={`${textSubSize} font-semibold tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase truncate`}>
            Performance Portal
          </span>
        </div>
      )}
    </div>
  );
};
