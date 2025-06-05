
"use client";

import { useState, useEffect } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CircularGauge } from '@/components/CircularGauge';
import { cn } from '@/lib/utils';

interface MainDialDisplayProps {
  title: string;
  value: number;
  unit?: string;
  icon?: LucideIcon;
  iconClassName?: string;
  maxValue: number;
  strokeColor: string;
}

interface Dimensions {
  // Tailwind classes for the card's container
  cardContainerClasses: string; 
  
  // Base size for the gauge, drives other internal element sizes
  baseGaugeSize: number; 
  
  // Calculated numeric values for internal elements
  iconSizePx: number;
  titleFontSizePx: number;
  gaugeStrokeWidthPx: number;
  valueFontSizePx: number;
  unitFontSizePx: number;

  // Tailwind classes for internal layout/spacing
  cardHeaderPadding: string;
  cardContentPadding: string;
  cardInternalGap: string; 
  gaugeMarginClasses: string;
  valueContainerMarginTop: string;
}

// Define base dimensions for the largest size (e.g., XL)
// Card size: w-96 h-96 (384px). Base Gauge: 180px.
const xlDimsConfig = {
  cardContainerClasses: 'w-96 h-96',
  cardHeaderPadding: 'p-0', // No padding for header itself
  cardContentPadding: 'p-0', // No padding for content itself
  cardInternalGap: 'gap-3', // Gap between header and content blocks
  baseGaugeSize: 180,
  iconSizeRatio: 1/4.5,     // Icon size relative to baseGaugeSize
  titleFontSizeRatio: 1/7.5, // Title font size relative to baseGaugeSize
  strokeWidthRatio: 1/10,   // Gauge stroke width relative to baseGaugeSize
  valueFontSizeRatio: 1/3.75, // Value font size relative to baseGaugeSize
  unitFontSizeRatio: 1/9,     // Unit font size relative to baseGaugeSize
  gaugeMarginClasses: 'my-2',
  valueContainerMarginTop: 'mt-2',
};

const calculateDimensions = (screenWidth: number): Dimensions => {
  let config = xlDimsConfig; // Start with XL as default

  // Determine base config based on screen width
  if (screenWidth < 640) { // xs
    config = {
      ...xlDimsConfig,
      cardContainerClasses: 'w-56 h-56',
      baseGaugeSize: 100,
      cardInternalGap: 'gap-1',
      gaugeMarginClasses: 'my-1',
      valueContainerMarginTop: 'mt-1',
    };
  } else if (screenWidth < 768) { // sm
    config = {
      ...xlDimsConfig,
      cardContainerClasses: 'w-64 h-64',
      baseGaugeSize: 120,
      cardInternalGap: 'gap-2',
      gaugeMarginClasses: 'my-1',
      valueContainerMarginTop: 'mt-1',
    };
  } else if (screenWidth < 1024) { // md
    config = {
      ...xlDimsConfig,
      cardContainerClasses: 'w-72 h-72',
      baseGaugeSize: 140,
      cardInternalGap: 'gap-2',
    };
  } else if (screenWidth < 1280) { // lg
    config = {
      ...xlDimsConfig,
      cardContainerClasses: 'w-80 h-80',
      baseGaugeSize: 160,
    };
  }
  // For xl and up, the initial `config` (xlDimsConfig) is used.

  return {
    cardContainerClasses: cn(config.cardContainerClasses, 'p-4'), // Apply overall padding to the card
    cardHeaderPadding: config.cardHeaderPadding,
    cardContentPadding: config.cardContentPadding,
    cardInternalGap: config.cardInternalGap,
    baseGaugeSize: config.baseGaugeSize,
    iconSizePx: Math.round(config.baseGaugeSize * config.iconSizeRatio),
    titleFontSizePx: Math.round(config.baseGaugeSize * config.titleFontSizeRatio),
    gaugeStrokeWidthPx: Math.round(config.baseGaugeSize * config.strokeWidthRatio),
    valueFontSizePx: Math.round(config.baseGaugeSize * config.valueFontSizeRatio),
    unitFontSizePx: Math.round(config.baseGaugeSize * config.unitFontSizeRatio),
    gaugeMarginClasses: config.gaugeMarginClasses,
    valueContainerMarginTop: config.valueContainerMarginTop,
  };
};


export function MainDialDisplay({
  title,
  value,
  unit,
  icon: Icon,
  iconClassName,
  maxValue,
  strokeColor,
}: MainDialDisplayProps) {
  // Initialize with default dimensions for server render / no window
  const [dims, setDims] = useState<Dimensions>(calculateDimensions(1280)); // Default to XL size

  useEffect(() => {
    const handleResize = () => {
      setDims(calculateDimensions(window.innerWidth));
    };

    if (typeof window !== 'undefined') {
      handleResize(); // Set initial dimensions based on client's screen width
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  const displayValue = value.toFixed(title === "CO₂" || title === "PM2.5" || title === "PM10" || title.includes("PM") ? 0 : 1);

  return (
    <Card className={cn(
      "shadow-xl rounded-full flex flex-col items-center justify-center bg-card/80 transition-all duration-300 ease-in-out",
      dims.cardContainerClasses, // This includes w-X h-X and overall padding
      dims.cardInternalGap      // This adds gap between header and content blocks
    )}>
      <CardHeader className={cn(
        "flex flex-col items-center space-y-1 transition-all duration-300 ease-in-out",
        dims.cardHeaderPadding // Should be p-0
      )}>
        {Icon && (
          <Icon 
            className={cn(iconClassName, "transition-all duration-300 ease-in-out")} 
            style={{ width: `${dims.iconSizePx}px`, height: `${dims.iconSizePx}px`}}
          />
        )}
        <CardTitle 
          className={cn("font-semibold text-center text-card-foreground transition-all duration-300 ease-in-out")}
          style={{ fontSize: `${dims.titleFontSizePx}px` }}
        >
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className={cn(
        "flex flex-col items-center transition-all duration-300 ease-in-out",
        dims.cardContentPadding // Should be p-0
      )}>
        <CircularGauge
          value={value}
          maxValue={maxValue}
          strokeColor={strokeColor}
          size={dims.baseGaugeSize}
          strokeWidth={dims.gaugeStrokeWidthPx}
          className={cn(dims.gaugeMarginClasses, "transition-all duration-300 ease-in-out")}
        />
        <div 
          className={cn("font-bold text-card-foreground transition-all duration-300 ease-in-out", dims.valueContainerMarginTop)}
          style={{ fontSize: `${dims.valueFontSizePx}px` }}
        >
          {displayValue}
          {unit && (
            <span 
              className={cn("text-muted-foreground ml-1.5 transition-all duration-300 ease-in-out")}
              style={{ fontSize: `${dims.unitFontSizePx}px` }}
            >
              {unit}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
