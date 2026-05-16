"use client";

import * as React from "react";
import { useTheme } from "next-themes";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-[60px] h-[30px] rounded-full bg-gray-200 animate-pulse" />
    );
  }

  const isDark = theme === "dark";

  return (
    <div 
      className="cursor-pointer select-none"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <svg width="60" height="30" viewBox="0 0 120 60" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
        <defs>
          <filter id="moon-glow-filter" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {/* Track (Background) */}
        <rect 
          className="transition-colors duration-500 ease-in-out"
          x="0" y="0" width="120" height="60" rx="30" ry="30" 
          fill={isDark ? "#000000" : "#e4e4e7"}
          stroke={isDark ? "#333333" : "none"}
          strokeWidth={isDark ? "2" : "0"}
        />
        
        {/* Thumb Group */}
        <g 
          className="transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(${isDark ? '60px' : '0px'})` }}
        >
          <circle 
            cx="30" cy="30" r="26" 
            fill={isDark ? "#FFFFFF" : "#000000"}
            className="transition-colors duration-500"
            style={{ filter: "drop-shadow(0px 2px 3px rgba(0,0,0,0.2))" }}
          />
          
          <g style={{ transform: "translate(30px, 30px)" }}>
            {/* Sun Icon */}
            <g 
              className="transition-all duration-400 ease-in-out origin-center"
              style={{ 
                opacity: isDark ? 0 : 1,
                transform: isDark ? "scale(0.5) rotate(90deg)" : "scale(1) rotate(0deg)"
              }}
            >
              {/* Sun rays and body - White on Black thumb */}
              <circle cx="0" cy="0" r="9" fill="#FFFFFF" />
              <rect x="-1" y="-16" width="2" height="4" rx="1" fill="#FFFFFF" />
              <rect x="-1" y="12" width="2" height="4" rx="1" fill="#FFFFFF" />
              <rect x="-16" y="-1" width="4" height="2" rx="1" fill="#FFFFFF" />
              <rect x="12" y="-1" width="4" height="2" rx="1" fill="#FFFFFF" />
              <rect x="-10" y="-10" width="2" height="4" rx="1" transform="rotate(45 -9 -8)" fill="#FFFFFF" />
              <rect x="8" y="8" width="2" height="4" rx="1" transform="rotate(45 9 10)" fill="#FFFFFF" />
              <rect x="-10" y="8" width="2" height="4" rx="1" transform="rotate(-45 -9 10)" fill="#FFFFFF" />
              <rect x="8" y="-10" width="2" height="4" rx="1" transform="rotate(-45 9 -8)" fill="#FFFFFF" />
            </g>

            {/* Moon Icon */}
            <g 
              className="transition-all duration-400 ease-in-out origin-center"
              style={{ 
                opacity: isDark ? 1 : 0,
                transform: isDark ? "scale(1) rotate(0deg)" : "scale(0.5) rotate(-30deg)"
              }}
            >
              {/* Moon body - Black on White thumb */}
              <path 
                d="M-2,-11 C-8,-11 -13,-6 -13,0 C-13,6 -8,11 -2,11 C-4,8 -5,4 -5,0 C-5,-4 -4,-8 -2,-11 Z" 
                transform="scale(1.4) translate(4,0)"
                fill="#000000"
              />
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
}
