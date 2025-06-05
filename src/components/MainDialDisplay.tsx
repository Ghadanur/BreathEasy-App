
"use client";

import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SemiCircleGauge } from '@/components/SemiCircleGauge';
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
    <Card className="shadow-xl flex flex-col items-center justify-center p-6 bg-card/80">
      <CardHeader className="flex flex-col items-center space-y-2 pb-3">
        {Icon && <Icon className={cn("h-10 w-10", iconClassName)} />}
        <CardTitle className="text-2xl font-semibold text-center text-card-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center pt-2"> {/* Removed justify-center */}
        <SemiCircleGauge
          value={value}
          maxValue={maxValue}
          strokeColor={strokeColor}
          size={200}
          strokeWidth={20}
          className="my-4" // Keeping this margin for spacing around the gauge
        />
        <div className="text-5xl font-bold text-card-foreground mt-4"> {/* Keeping this margin for spacing below gauge */}
          {displayValue}
          {unit && <span className="text-xl text-muted-foreground ml-1.5">{unit}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

