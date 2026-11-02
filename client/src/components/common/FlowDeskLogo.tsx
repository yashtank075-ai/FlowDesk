import React from 'react';

interface FlowDeskLogoProps {
  size?: number | string;
  className?: string;
  rounded?: string;
  showAura?: boolean;
}

export const FlowDeskLogo: React.FC<FlowDeskLogoProps> = ({
  size = 28,
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
        viewBox="0 0 36 36"
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
        <rect width="36" height="36" rx="9" fill="url(#fd-logo-grad)" />

        {/* Left vertical backbone (stem of F and spine of D) */}
        <rect x="7" y="7" width="4.5" height="22" rx="2" fill="#FFFFFF" />

        {/* D Outer Loop & F Top arm with balanced inner counter */}
        <path
          d="M 11.5 7 H 19 C 25.5 7 29 11.2 29 18 C 29 24.8 25.5 29 19 29 H 11.5 C 10.4 29 9.5 28.1 9.5 27 C 9.5 25.9 10.4 25 11.5 25 H 19 C 23.2 25 24.8 22 24.8 18 C 24.8 14 23.2 11 19 11 H 11.5 V 7 Z"
          fill="#FFFFFF"
        />

        {/* F Middle Bar (Dynamic horizontal flow) */}
        <rect x="11.5" y="15.8" width="8" height="4.2" rx="1.8" fill="#FFFFFF" />
      </svg>
    </div>
  );
};

export default FlowDeskLogo;
