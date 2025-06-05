
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
  // Tailwind classes for the card's container (w-X h-X)
  cardSizeClass: string; 
  
  // Base size for the gauge, drives other internal element sizes
  baseGaugeSize: number; 
  
  // Calculated numeric values for internal elements
  iconSizePx: number;
  titleFontSizePx: number;
  gaugeStrokeWidthPx: number;
  valueFontSizePx: number;
  unitFontSizePx: number;

  // Tailwind classes for internal layout/spacing
  // Overall padding for the card content area
  cardOverallPadding: string; 
  // Gap between header and content blocks within the card
  cardInternalGap: string; 
  // Margin for the gauge element
  gaugeMarginClasses: string;
  // Margin top for the value/unit container
  valueContainerMarginTop: string;
}

// Define base dimensions and ratios for the largest size (e.g., XL)
const xlDimsConfigBase = {
  cardSizeClass: 'w-96 h-96', // Tailwind class for outer card size
  cardOverallPadding: 'p-4', // Overall padding
  cardInternalGap: 'gap-3', // Gap between header and content blocks
  baseGaugeSize: 180, // Main driver for internal scaling
  iconSizeRatio: 1/4.5,
  titleFontSizeRatio: 1/7.5,
  strokeWidthRatio: 1/10,
  valueFontSizeRatio: 1/3.75,
  unitFontSizeRatio: 1/9,
  gaugeMarginClasses: 'my-2', // Margin for the gauge
  valueContainerMarginTop: 'mt-2', // Margin top for the value/unit container
};

const calculateDimensions = (screenWidth: number): Dimensions => {
  let
   
baseConfig = xlDimsConfigBase;

  if (screenWidth < 640) { // xs
    baseConfig = {
      ...xlDimsConfigBase,
      cardSizeClass: 'w-56 h-56',
      baseGaugeSize: 100,
      cardInternalGap: 'gap-1',
      gaugeMarginClasses: 'my-1',
      valueContainerMarginTop: 'mt-1',
      // cardOverallPadding remains p-4 or could be adjusted, e.g. p-3
    };
  } else if (screenWidth < 768) { // sm
    baseConfig = {
      ...xlDimsConfigBase,
      cardSizeClass: 'w-64 h-64',
      baseGaugeSize: 120,
      cardInternalGap: 'gap-1', // Kept smaller gap for sm
      gaugeMarginClasses: 'my-1',
      valueContainerMarginTop: 'mt-1',
      // cardOverallPadding remains p-4
    };
  } else if (screenWidth < 1024) { // md
    baseConfig = {
      ...xlDimsConfigBase,
      cardSizeClass: 'w-72 h-72',
      baseGaugeSize: 140,
      cardInternalGap: 'gap-2',
      gaugeMarginClasses: 'my-2', // Corrected: Explicitly set
      valueContainerMarginTop: 'mt-2', // Corrected: Explicitly set
    };
  } else if (screenWidth < 1280) { // lg
    baseConfig = {
      ...xlDimsConfigBase,
      cardSizeClass: 'w-80 h-80',
      baseGaugeSize: 160,
      cardInternalGap: 'gap-2', // Kept gap-2 for lg
      gaugeMarginClasses: 'my-2', // Corrected: Explicitly set
      valueContainerMarginTop: 'mt-2', // Corrected: Explicitly set
    };
  }
  // For xl and up, the initial `baseConfig` (xlDimsConfigBase) is used.

  return {
    cardSizeClass: baseConfig.cardSizeClass,
    cardOverallPadding: baseConfig.cardOverallPadding,
    cardInternalGap: baseConfig.cardInternalGap,
    baseGaugeSize: baseConfig.baseGaugeSize,
    iconSizePx: Math.round(baseConfig.baseGaugeSize * baseConfig.iconSizeRatio),
    titleFontSizePx: Math.round(baseConfig.baseGaugeSize * baseConfig.titleFontSizeRatio),
    gaugeStrokeWidthPx: Math.round(baseConfig.baseGaugeSize * baseConfig.strokeWidthRatio),
    valueFontSizePx: Math.round(baseConfig.baseGaugeSize * baseConfig.valueFontSizeRatio),
    unitFontSizePx: Math.round(baseConfig.baseGaugeSize * baseConfig.unitFontSizeRatio),
    gaugeMarginClasses: baseConfig.gaugeMarginClasses,
    valueContainerMarginTop: baseConfig.valueContainerMarginTop,
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
      dims.cardSizeClass, 
      dims.cardOverallPadding,
      dims.cardInternalGap      
    )}>
      <CardHeader className={cn(
        "flex flex-col items-center space-y-1 p-0 transition-all duration-300 ease-in-out" // p-0 to ensure parent padding controls layout
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
        "flex flex-col items-center p-0 transition-all duration-300 ease-in-out" // p-0 to ensure parent padding controls layout
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
              className={cn("text-muted-foreground ml-1 transition-all duration-300 ease-in-out")} // Changed ml-1.5 to ml-1
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
