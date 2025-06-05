
"use client";

import { cn } from '@/lib/utils';
import React from 'react';

interface CircularGaugeProps {
  value: number;
  maxValue: number;
  strokeColor: string; // Expected to be an HSL string e.g., "hsl(30, 90%, 60%)"
  size?: number;
  strokeWidth?: number;
  className?: string;
}

// Helper function to parse HSL and lighten it
function lightenHsl(hslColor: string, amount: number = 20): string {
  const match = hslColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (!match) {
    // If it's not a simple HSL string (e.g., a CSS variable or named color),
    // we can't easily lighten it programmatically here.
    // For simplicity, return the original color or a fallback.
    // A more robust solution might involve a color library or expecting specific formats.
    return hslColor; 
  }

  let h = parseInt(match[1]);
  let s = parseInt(match[2]);
  let l = parseInt(match[3]);

  l = Math.min(100, l + amount); // Increase lightness, cap at 100%
  return `hsl(${h}, ${s}%, ${l}%)`;
}

export function CircularGauge({
  value,
  maxValue,
  strokeColor,
  size = 100,
  strokeWidth = 10,
  className,
}: CircularGaugeProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(value, 0), maxValue) / maxValue;
  const offset = circumference * (1 - progress);

  const center = size / 2;
  const viewBox = `0 0 ${size} ${size}`;

  const gradientId = React.useId();
  const lighterStrokeColor = lightenHsl(strokeColor, 15); // Lighten by 15%

  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      className={cn(className)}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: strokeColor, stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: lighterStrokeColor, stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      {/* Background track */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="hsl(var(--muted))"
        strokeWidth={strokeWidth}
      />
      {/* Foreground progress */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={`url(#${gradientId})`} // Apply the gradient
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{
          transform: 'rotate(-90deg)',
          transformOrigin: '50% 50%',
          transition: 'stroke-dashoffset 0.3s ease-out',
        }}
      />
    </svg>
  );
}
