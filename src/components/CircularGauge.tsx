
"use client";

import { cn } from '@/lib/utils';

interface CircularGaugeProps {
  value: number;
  maxValue: number;
  strokeColor: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function CircularGauge({
  value,
  maxValue,
  strokeColor,
  size = 100, // Default size
  strokeWidth = 10, // Default stroke width
  className,
}: CircularGaugeProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(value, 0), maxValue) / maxValue;
  const offset = circumference * (1 - progress);

  const center = size / 2;
  const viewBox = `0 0 ${size} ${size}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      className={cn(className)}
    >
      {/* Background track */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="hsl(var(--muted))" // Muted color for the track
        strokeWidth={strokeWidth}
      />
      {/* Foreground progress */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{
          transform: 'rotate(-90deg)', // Start from the top
          transformOrigin: '50% 50%',
          transition: 'stroke-dashoffset 0.3s ease-out',
        }}
      />
    </svg>
  );
}
