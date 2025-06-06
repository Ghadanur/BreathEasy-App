
"use client";

import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle as ShadDialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface AirQualityCardProps {
  title: string;
  value: string | number; 
  unit?: string;
  icon: LucideIcon;
  iconClassName?: string;
  description?: string;
  className?: string;
  onClick?: () => void;
}

export function AirQualityCard({
  title,
  value,
  unit,
  icon: Icon,
  iconClassName,
  description,
  className,
  onClick,
}: AirQualityCardProps) {
  const displayValue = typeof value === 'number' 
    ? value.toFixed(title === "CO₂" || title === "PM2.5" || title === "PM10" ? 0 : 1) 
    : value;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card 
          className={cn(
            "shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer flex flex-col justify-between",
            className
          )}
          onClick={onClick}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon aria-hidden="true" className={cn("h-6 w-6 text-muted-foreground", iconClassName)} />
          </CardHeader>
          <CardContent className="flex flex-col items-start justify-center pt-2 flex-grow"> 
            <div className="text-2xl font-bold text-card-foreground">
              {displayValue}
              {unit && <span className="text-xs text-muted-foreground ml-1">{unit}</span>}
            </div>
            {description && <p className="text-xs text-muted-foreground pt-1">{description}</p>}
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="items-center text-center sm:text-left sm:items-start">
          <div className="flex items-center space-x-3 mb-3">
            <Icon aria-hidden="true" className={cn("h-10 w-10", iconClassName ? iconClassName : "text-muted-foreground")} />
            <ShadDialogTitle className="text-2xl text-card-foreground">{title}</ShadDialogTitle>
          </div>
        </DialogHeader>
        <div className="py-4 text-center sm:text-left">
          <div className="text-5xl font-bold text-card-foreground">
            {displayValue}
            {unit && <span className="text-xl font-medium ml-1 text-muted-foreground">{unit}</span>}
          </div>
          {description && (
            <p className="text-sm text-muted-foreground mt-2">{description}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
