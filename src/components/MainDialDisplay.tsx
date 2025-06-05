
"use client";

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

export function MainDialDisplay({
  title,
  value,
  unit,
  icon: Icon,
  iconClassName,
  maxValue,
  strokeColor,
}: MainDialDisplayProps) {
  const displayValue = value.toFixed(title === "CO₂" || title === "PM2.5" || title === "PM10" || title.includes("PM") ? 0 : 1);

  return (
    <Card className="shadow-xl flex flex-col items-center justify-center p-6 bg-card/80 rounded-full w-96 h-96">
      <CardHeader className="flex flex-col items-center space-y-1 pb-2"> {/* Reduced space-y and pb */}
        {Icon && <Icon className={cn("h-8 w-8", iconClassName)} />} {/* Reduced icon size */}
        <CardTitle className="text-xl font-semibold text-center text-card-foreground"> {/* Reduced title size */}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center pt-2">
        <CircularGauge
          value={value}
          maxValue={maxValue}
          strokeColor={strokeColor}
          size={160} // Reduced gauge size
          strokeWidth={16} // Reduced stroke width
          className="my-3" // Adjusted margin
        />
        <div className="text-4xl font-bold text-card-foreground mt-3"> {/* Reduced value size and margin */}
          {displayValue}
          {unit && <span className="text-lg text-muted-foreground ml-1.5">{unit}</span>} {/* Reduced unit size */}
        </div>
      </CardContent>
    </Card>
  );
}

