
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
    <Card className="shadow-xl rounded-full w-96 h-96 p-4 flex flex-col items-center justify-center gap-3 bg-card/80">
      <CardHeader className="flex flex-col items-center space-y-1 p-0"> {/* Removed padding, rely on parent gap */}
        {Icon && <Icon className={cn("h-8 w-8", iconClassName)} />}
        <CardTitle className="text-xl font-semibold text-center text-card-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center p-0"> {/* Removed padding, rely on parent gap */}
        <CircularGauge
          value={value}
          maxValue={maxValue}
          strokeColor={strokeColor}
          size={160} 
          strokeWidth={16}
          className="my-2" 
        />
        <div className="text-4xl font-bold text-card-foreground mt-2"> 
          {displayValue}
          {unit && <span className="text-lg text-muted-foreground ml-1.5">{unit}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
