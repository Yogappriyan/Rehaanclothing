import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  inverted?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  inverted = false,
}) => {
  const sizeClasses = {
    sm: 'h-8 sm:h-10',
    md: 'h-9 sm:h-12',
    lg: 'h-16 sm:h-20',
  };

  return (
    <div className={`flex items-center gap-1.5 sm:gap-2.5 shrink-0 ${className}`}>
      <div className="relative overflow-hidden rounded-full p-0.5 border border-[#E9DFD0]/60 shadow-xs bg-[#FAF8F4] shrink-0">
        <img
          src="/Logore.jpeg"
          alt="Rehaan Clothing Logo"
          className={`${sizeClasses[size]} w-auto object-contain transition-transform duration-300 group-hover:scale-105`}
          onError={(e) => {
            // Graceful fallback if image doesn't load
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      </div>
      {showText && (
        <div className="flex flex-col text-left select-none shrink-0">
          <span
            className={`font-editorial tracking-wide font-normal ${
              size === 'lg' ? 'text-xl sm:text-2xl' : size === 'sm' ? 'text-base sm:text-lg' : 'text-base sm:text-xl'
            } ${inverted ? 'text-[#FAF8F4]' : 'text-[#292522]'}`}
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Rehaan
          </span>
          <span
            className={`text-[8px] sm:text-[9px] uppercase tracking-[0.2em] sm:tracking-[0.25em] font-medium ${
              inverted ? 'text-[#E9DFD0]' : 'text-[#9A8568]'
            }`}
          >
            Clothing
          </span>
        </div>
      )}
    </div>
  );
};
