
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
function lightenHsl(hslColor: string, amount: number = 15): string {
  // Regex to match hsl(H, S%, L%) allowing for integer or float values for H, S, L
  const match = hslColor.match(/hsl\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)%\s*,\s*(\d+(?:\.\d+)?)%\s*\)/);
  if (!match) {
    // Fallback if the color string is not in the expected HSL format
    // This might happen if a CSS variable name or another color format is passed unexpectedly.
    console.warn("lightenHsl: Could not parse HSL color string:", hslColor);
    return hslColor; 
  }

  let h = parseFloat(match[1]);
  let s = parseFloat(match[2]);
  let l = parseFloat(match[3]);

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
  const lighterStrokeColor = lightenHsl(strokeColor, 15); 

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
