import React from 'react';

interface FlowDeskLogoProps {
  size?: number | string;
  className?: string;
  rounded?: string;
  showAura?: boolean;
}

export const FlowDeskLogo: React.FC<FlowDeskLogoProps> = ({
  size = 32,
  className = '',
  rounded = 'rounded-xl',
  showAura = false,
}) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative flex items-center justify-center shrink-0 ${rounded} overflow-hidden ${
        showAura ? 'shadow-md shadow-indigo-500/20 ring-1 ring-white/20' : ''
      } ${className}`}
    >
      <svg
        viewBox="0 0 40 40"
        width="100%"
        height="100%"
        className="w-full h-full block"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="fd-logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#4F46E5" />
          </linearGradient>
        </defs>

        {/* Clean rounded container */}
        <rect width="40" height="40" rx="10" fill="url(#fd-logo-grad)" />

        {/* F Vertical Stem */}
        <rect x="8" y="8" width="5" height="24" rx="2.5" fill="#FFFFFF" />

        {/* F Top Arm */}
        <rect x="11" y="8" width="12" height="5" rx="2.5" fill="#FFFFFF" />

        {/* F Middle Arm (Flow bar) */}
        <rect x="11" y="17.5" width="9" height="4.5" rx="2.25" fill="#FFFFFF" />

        {/* D Right Loop */}
        <path
          d="M 19 8 H 23 C 29.5 8 33 13 33 20 C 33 27 29.5 32 23 32 H 11 C 9.6 32 8.5 30.9 8.5 29.5 C 8.5 28.1 9.6 27 11 27 H 22.5 C 26.2 27 28 23.8 28 20 C 28 16.2 26.2 13 22.5 13 H 19 Z"
          fill="#FFFFFF"
        />
      </svg>
    </div>
  );
};

export default FlowDeskLogo;
