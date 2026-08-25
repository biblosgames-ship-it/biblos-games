import React from "react";

export interface GoldCoinIconProps {
  className?: string;
  size?: number;
}

export const GoldCoinIcon: React.FC<GoldCoinIconProps> = ({ className = "w-5 h-5", size }) => {
  const style = size ? { width: size, height: size } : undefined;
  return (
    <svg 
      viewBox="0 0 36 36" 
      className={`inline-block drop-shadow-md align-middle shrink-0 ${className}`} 
      style={style}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="goldOuter" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FFE066" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </radialGradient>
        <radialGradient id="goldInner" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#FFFBEB" />
          <stop offset="40%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#D97706" />
        </radialGradient>
        <linearGradient id="goldRim" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#78350F" />
        </linearGradient>
      </defs>
      <circle cx="18" cy="18" r="17" fill="url(#goldOuter)" stroke="url(#goldRim)" strokeWidth="1.5" />
      <circle cx="18" cy="18" r="13.5" stroke="#FDE68A" strokeWidth="1" strokeDasharray="2 1" fill="none" opacity="0.8" />
      <circle cx="18" cy="18" r="12" fill="url(#goldInner)" />
      <path 
        d="M18 9.5 L19.8 14.5 L25 14.5 L20.8 17.6 L22.4 22.5 L18 19.3 L13.6 22.5 L15.2 17.6 L11 14.5 L16.2 14.5 Z" 
        fill="#78350F" 
        opacity="0.9"
      />
      <path 
        d="M18 10.5 L19.4 14.3 L23.5 14.3 L20.1 16.7 L21.4 20.6 L18 18.1 L14.6 20.6 L15.9 16.7 L12.5 14.3 L16.6 14.3 Z" 
        fill="#FEF08A" 
      />
    </svg>
  );
};
