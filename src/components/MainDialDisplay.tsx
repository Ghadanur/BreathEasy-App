
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
}

// Base configuration for XL screens, others will scale from this
const xlDimsConfigBase = {
  cardSizeClass: 'w-[28rem] h-[28rem]', // 448px
  cardOverallPadding: 'p-5', 
  cardInternalGap: 'gap-2', 
  baseGaugeSize: 280, 
  iconSizeRatio: 1/6, 
  titleFontSizeRatio: 1/11, 
  strokeWidthRatio: 1/12, 
  valueFontSizeRatio: 1/5, 
  unitFontSizeRatio: 1/12, 
  gaugeMarginClasses: 'my-0', 
};

const calculateDimensions = (screenWidth: number): Dimensions => {
  let baseConfig = xlDimsConfigBase;

  if (screenWidth < 640) { // xs, e.g., up to 639px
    baseConfig = {
      ...xlDimsConfigBase,
      cardSizeClass: 'w-64 h-64', // 256px
      baseGaugeSize: 160,
      cardOverallPadding: 'p-3',
      cardInternalGap: 'gap-1',
    };
  } else if (screenWidth < 768) { // sm, e.g., 640px to 767px
    baseConfig = {
      ...xlDimsConfigBase,
      cardSizeClass: 'w-72 h-72', // 288px
      baseGaugeSize: 180,
      cardOverallPadding: 'p-3',
      cardInternalGap: 'gap-1',
    };
  } else if (screenWidth < 1024) { // md, e.g., 768px to 1023px
    baseConfig = {
      ...xlDimsConfigBase,
      cardSizeClass: 'w-80 h-80', // 320px
      baseGaugeSize: 200,
      cardOverallPadding: 'p-4',
      cardInternalGap: 'gap-2',
    };
  } else if (screenWidth < 1280) { // lg, e.g., 1024px to 1279px
    baseConfig = {
      ...xlDimsConfigBase,
      cardSizeClass: 'w-96 h-96', // 384px
      baseGaugeSize: 240,
      cardOverallPadding: 'p-4',
      cardInternalGap: 'gap-2',
    };
  }
  // For xl (1280px and up), the initial `xlDimsConfigBase` is used.

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
  const [dims, setDims] = useState<Dimensions>(calculateDimensions(1280)); 

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
  const gaugePercentage = Math.round((value / maxValue) * 100);
  const gaugeAriaLabel = `${title}: ${displayValue}${unit || ''}. This is ${gaugePercentage}% of the maximum value.`;

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
            aria-hidden="true"
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
        "relative flex items-center justify-center p-0 transition-all duration-300 ease-in-out mt-auto mb-auto", 
        `w-[${dims.baseGaugeSize}px] h-[${dims.baseGaugeSize}px]` 
      )}>
        <CircularGauge
          role="img"
          aria-label={gaugeAriaLabel}
          value={value}
          maxValue={maxValue}
          strokeColor={strokeColor}
          size={dims.baseGaugeSize} 
          strokeWidth={dims.gaugeStrokeWidthPx}
          className={cn(dims.gaugeMarginClasses, "transition-all duration-300 ease-in-out")}
        />
        <div
          className={cn(
            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
            "flex flex-col items-center text-center pointer-events-none"
          )}
        >
          <div
            className="font-bold text-card-foreground"
            style={{ fontSize: `${dims.valueFontSizePx}px`, lineHeight: '1' }}
          >
            {displayValue}
          </div>
          {unit && (
            <span
              className="text-muted-foreground" 
              style={{ fontSize: `${dims.unitFontSizePx}px`, lineHeight: '1' }}
            >
              {unit}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
