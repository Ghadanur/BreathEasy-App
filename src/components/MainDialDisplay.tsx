
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
  cardSize: string;
  cardPadding: string;
  cardGap: string;
  iconSize: string;
  titleSize: string;
  gaugeSize: number;
  gaugeStrokeWidth: number;
  gaugeMargin: string;
  valueSize: string;
  unitSize: string;
  valueMarginTop: string;
}

// Default dimensions (for XL screens and up)
const defaultDims: Dimensions = {
  cardSize: 'w-96 h-96',
  cardPadding: 'p-4',
  cardGap: 'gap-3',
  iconSize: 'h-10 w-10',
  titleSize: 'text-2xl',
  gaugeSize: 180,
  gaugeStrokeWidth: 18,
  gaugeMargin: 'my-2',
  valueSize: 'text-5xl',
  unitSize: 'text-xl',
  valueMarginTop: 'mt-2',
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
  const [dims, setDims] = useState<Dimensions>(defaultDims);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) { // Base (xs)
        setDims({
          cardSize: 'w-56 h-56', cardPadding: 'p-2', cardGap: 'gap-1',
          iconSize: 'h-6 w-6', titleSize: 'text-base',
          gaugeSize: 100, gaugeStrokeWidth: 10, gaugeMargin: 'my-1',
          valueSize: 'text-2xl', unitSize: 'text-xs', valueMarginTop: 'mt-1',
        });
      } else if (width < 768) { // sm
        setDims({
          cardSize: 'w-64 h-64', cardPadding: 'p-3', cardGap: 'gap-2',
          iconSize: 'h-7 w-7', titleSize: 'text-lg',
          gaugeSize: 120, gaugeStrokeWidth: 12, gaugeMargin: 'my-1',
          valueSize: 'text-3xl', unitSize: 'text-sm', valueMarginTop: 'mt-1',
        });
      } else if (width < 1024) { // md
        setDims({
          cardSize: 'w-72 h-72', cardPadding: 'p-3', cardGap: 'gap-2',
          iconSize: 'h-8 w-8', titleSize: 'text-xl',
          gaugeSize: 140, gaugeStrokeWidth: 14, gaugeMargin: 'my-2',
          valueSize: 'text-4xl', unitSize: 'text-base', valueMarginTop: 'mt-2',
        });
      } else if (width < 1280) { // lg
        setDims({
          cardSize: 'w-80 h-80', cardPadding: 'p-4', cardGap: 'gap-3',
          iconSize: 'h-8 w-8', titleSize: 'text-xl',
          gaugeSize: 160, gaugeStrokeWidth: 16, gaugeMargin: 'my-2',
          valueSize: 'text-4xl', unitSize: 'text-lg', valueMarginTop: 'mt-2',
        });
      } else { // xl and up
        setDims(defaultDims);
      }
    };

    handleResize(); // Set initial dimensions
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const displayValue = value.toFixed(title === "CO₂" || title === "PM2.5" || title === "PM10" || title.includes("PM") ? 0 : 1);

  return (
    <Card className={cn(
      "shadow-xl rounded-full flex flex-col items-center justify-center bg-card/80 transition-all duration-300 ease-in-out",
      dims.cardSize,
      dims.cardPadding,
      dims.cardGap
    )}>
      <CardHeader className={cn("flex flex-col items-center space-y-1 p-0")}>
        {Icon && <Icon className={cn(dims.iconSize, iconClassName, "transition-all duration-300 ease-in-out")} />}
        <CardTitle className={cn(
          "font-semibold text-center text-card-foreground transition-all duration-300 ease-in-out",
          dims.titleSize
        )}>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className={cn("flex flex-col items-center p-0")}>
        <CircularGauge
          value={value}
          maxValue={maxValue}
          strokeColor={strokeColor}
          size={dims.gaugeSize}
          strokeWidth={dims.gaugeStrokeWidth}
          className={cn(dims.gaugeMargin, "transition-all duration-300 ease-in-out")}
        />
        <div className={cn(
          "font-bold text-card-foreground transition-all duration-300 ease-in-out",
          dims.valueSize,
          dims.valueMarginTop
        )}>
          {displayValue}
          {unit && <span className={cn(
            "text-muted-foreground ml-1.5 transition-all duration-300 ease-in-out",
            dims.unitSize
            )}>{unit}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
