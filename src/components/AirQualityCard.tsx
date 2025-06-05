
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle as ShadDialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface GaugeData {
  value: number;
  maxValue: number;
  strokeColor: string;
}

interface AirQualityCardProps {
  title: string;
  value: string | number; // This will be the primary display value for the text portion
  unit?: string;
  icon: LucideIcon;
  iconClassName?: string; // Tailwind color class for the icon e.g., text-blue-500
  gaugeData?: GaugeData; // Data for the dial/gauge
  description?: string;
  className?: string;
}

const SemiCircleGauge = ({
  value,
  maxValue,
  strokeColor,
  size = 100,
  strokeWidth = 10,
}: GaugeData & { size?: number; strokeWidth?: number }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius; // Half circumference for semi-circle
  const progress = Math.min(Math.max(value, 0), maxValue) / maxValue;
  const offset = circumference * (1 - progress);

  const viewBox = `0 0 ${size} ${size / 2 + strokeWidth / 2}`;

  return (
    <svg width={size} height={size / 2 + strokeWidth / 2} viewBox={viewBox} className="transform -rotate-90 scale-y-[-1]">
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
};

export function AirQualityCard({
  title,
  value,
  unit,
  icon: Icon,
  iconClassName,
  gaugeData,
  description,
  className,
}: AirQualityCardProps) {
  const displayValue = typeof value === 'number' ? value.toFixed(gaugeData && (title === "CO₂" || title === "PM2.5" || title === "PM10") ? 0 : 1) : value;
  const isCircular = !!gaugeData;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className={cn(
          "shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer",
          isCircular
            ? "rounded-full w-48 h-48 flex flex-col items-center justify-center p-4" // Increased size and padding
            : "flex flex-col justify-between",
          className
        )}>
          {isCircular && gaugeData ? (
            <>
              <div className="flex flex-col items-center pt-2"> {/* Adjusted padding */}
                <Icon className={cn("h-7 w-7", iconClassName ? iconClassName : "text-muted-foreground")} /> {/* Increased icon size */}
                <CardTitle className="text-base font-medium text-center mt-2"> {/* Increased title size and margin */}
                  {title}
                </CardTitle>
              </div>

              <div className="relative transform scale-y-[-1] -rotate-90 my-2"> {/* Adjusted margin */}
                <SemiCircleGauge {...gaugeData} size={100} strokeWidth={10} /> {/* Increased gauge size */}
              </div>

              <div className="text-3xl font-bold text-card-foreground pb-2"> {/* Increased value size, adjusted padding */}
                {displayValue}
                {unit && <span className="text-base text-muted-foreground ml-1">{unit}</span>} {/* Increased unit size */}
              </div>
            </>
          ) : (
            <>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className={cn("h-6 w-6 text-muted-foreground", iconClassName)} />
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center pt-2 flex-grow">
                <div className="text-2xl font-bold text-card-foreground">
                  {displayValue}
                  {unit && <span className="text-xs text-muted-foreground ml-1">{unit}</span>}
                </div>
                {description && <p className="text-xs text-muted-foreground pt-1">{description}</p>}
              </CardContent>
            </>
          )}
        </Card>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="items-center text-center sm:text-left sm:items-start">
          <div className="flex items-center space-x-3 mb-3">
            <Icon className={cn("h-10 w-10", iconClassName ? iconClassName : "text-primary")} />
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
