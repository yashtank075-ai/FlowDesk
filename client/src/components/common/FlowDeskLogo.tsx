import React from 'react';

interface FlowDeskLogoProps {
  size?: number | string;
  className?: string;
  rounded?: string;
  showAura?: boolean;
}

export const FlowDeskLogo: React.FC<FlowDeskLogoProps> = ({
  size = 24,
  className = '',
  rounded = 'rounded-xl',
  showAura = false,
}) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative flex items-center justify-center shrink-0 ${rounded} overflow-hidden ${
        showAura ? 'shadow-md shadow-indigo-500/25 ring-1 ring-white/20' : ''
      } ${className}`}
    >
      <svg
        viewBox="0 0 32 32"
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
          <linearGradient id="fd-logo-inner" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#EEF2FF" />
          </linearGradient>
        </defs>

        {/* Background container */}
        <rect width="32" height="32" rx="7.5" fill="url(#fd-logo-grad)" />

        {/* Left vertical stem (F stem / D spine) */}
        <rect x="6.5" y="6.5" width="4.5" height="19" rx="1.5" fill="url(#fd-logo-inner)" />

        {/* Outer D loop and F top bar */}
        <path
          d="M 10 6.5 H 17.5 C 22.5 6.5 25.5 10 25.5 16 C 25.5 22 22.5 25.5 17.5 25.5 H 10 V 21 H 17 C 19.8 21 21.2 19 21.2 16 C 21.2 13 19.8 11 17 11 H 10 Z"
          fill="url(#fd-logo-inner)"
        />

        {/* Middle crossbar forming the distinct F */}
        <rect x="10" y="14" width="6.5" height="4" rx="1.2" fill="url(#fd-logo-inner)" />
      </svg>
    </div>
  );
};

export default FlowDeskLogo;

