
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
  cardSizeClass: string; 
  baseGaugeSize: number; 
  iconSizePx: number;
  titleFontSizePx: number;
  gaugeStrokeWidthPx: number;
  valueFontSizePx: number;
  unitFontSizePx: number;
  cardOverallPadding: string; 
  cardInternalGap: string; 
  gaugeMarginClasses: string;
  valueContainerMarginTop: string;
}

// Define base dimensions and ratios for the largest size (e.g., XL)
// These ratios determine how internal elements scale relative to baseGaugeSize
const baseRatios = {
  iconSizeRatio: 1 / 4.5,
  titleFontSizeRatio: 1 / 7.5,
  strokeWidthRatio: 1 / 10,
  valueFontSizeRatio: 1 / 3.75,
  unitFontSizeRatio: 1 / 9,
};

const calculateDimensions = (screenWidth: number): Dimensions => {
  let config;

  if (screenWidth < 640) { // xs
    config = {
      cardSizeClass: 'w-64 h-64', // 256px
      baseGaugeSize: 120,
      cardOverallPadding: 'p-3',
      cardInternalGap: 'gap-1',
      gaugeMarginClasses: 'my-1',
      valueContainerMarginTop: 'mt-1',
    };
  } else if (screenWidth < 768) { // sm
    config = {
      cardSizeClass: 'w-72 h-72', // 288px
      baseGaugeSize: 140,
      cardOverallPadding: 'p-4',
      cardInternalGap: 'gap-2',
      gaugeMarginClasses: 'my-1',
      valueContainerMarginTop: 'mt-1',
    };
  } else if (screenWidth < 1024) { // md
    config = {
      cardSizeClass: 'w-80 h-80', // 320px
      baseGaugeSize: 160,
      cardOverallPadding: 'p-4',
      cardInternalGap: 'gap-2',
      gaugeMarginClasses: 'my-2',
      valueContainerMarginTop: 'mt-2',
    };
  } else if (screenWidth < 1280) { // lg
    config = {
      cardSizeClass: 'w-96 h-96', // 384px
      baseGaugeSize: 200,
      cardOverallPadding: 'p-5',
      cardInternalGap: 'gap-3',
      gaugeMarginClasses: 'my-2',
      valueContainerMarginTop: 'mt-2',
    };
  } else { // xl and up
    config = {
      cardSizeClass: 'w-[26rem] h-[26rem]', // 416px
      baseGaugeSize: 220,
      cardOverallPadding: 'p-6',
      cardInternalGap: 'gap-4',
      gaugeMarginClasses: 'my-3',
      valueContainerMarginTop: 'mt-3',
    };
  }

  return {
    ...config,
    iconSizePx: Math.round(config.baseGaugeSize * baseRatios.iconSizeRatio),
    titleFontSizePx: Math.round(config.baseGaugeSize * baseRatios.titleFontSizeRatio),
    gaugeStrokeWidthPx: Math.round(config.baseGaugeSize * baseRatios.strokeWidthRatio),
    valueFontSizePx: Math.round(config.baseGaugeSize * baseRatios.valueFontSizeRatio),
    unitFontSizePx: Math.round(config.baseGaugeSize * baseRatios.unitFontSizeRatio),
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
  const [dims, setDims] = useState<Dimensions>(calculateDimensions(1280)); // Default to XL size for SSR

  useEffect(() => {
    const handleResize = () => {
      setDims(calculateDimensions(window.innerWidth));
    };

    if (typeof window !== 'undefined') {
      handleResize(); 
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
        "flex flex-col items-center space-y-1 p-0 transition-all duration-300 ease-in-out"
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
        "flex flex-col items-center p-0 transition-all duration-300 ease-in-out"
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
              className={cn("text-muted-foreground ml-1 transition-all duration-300 ease-in-out")}
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
