
"use client";

import { cn } from '@/lib/utils';

interface SemiCircleGaugeProps {
  value: number;
  maxValue: number;
  strokeColor: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function SemiCircleGauge({
  value,
  maxValue,
  strokeColor,
  size = 100,
  strokeWidth = 10,
  className,
}: SemiCircleGaugeProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius; // Half circumference for semi-circle
  const progress = Math.min(Math.max(value, 0), maxValue) / maxValue;
  const offset = circumference * (1 - progress);

  const viewBox = `0 0 ${size} ${size / 2 + strokeWidth / 2}`;

  return (
    <svg 
      width={size} 
      height={size / 2 + strokeWidth / 2} 
      viewBox={viewBox} 
      className={cn("transform -rotate-90 scale-y-[-1]", className)}
    >
      {/* Background track */}
      <path
        d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
        fill="none"
        stroke="hsl(var(--muted))" // Muted color for the track
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* Foreground progress */}
      <path
        d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.3s ease-out' }}
      />
    </svg>
  );
}
