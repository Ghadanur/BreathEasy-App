
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface AirQualityCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  description?: string;
  className?: string;
  color?: string; // Tailwind color class for the icon e.g., text-blue-500
}

export function AirQualityCard({ title, value, unit, icon: Icon, description, className, color }: AirQualityCardProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className={cn("shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer", className)}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className={cn("h-6 w-6 text-muted-foreground", color)} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {value}
              {unit && <span className="text-xs text-muted-foreground ml-1">{unit}</span>}
            </div>
            {description && <p className="text-xs text-muted-foreground pt-1">{description}</p>}
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="items-center text-center sm:text-left sm:items-start">
          <div className="flex items-center space-x-3 mb-3">
            <Icon className={cn("h-10 w-10 text-primary")} />
            <DialogTitle className="text-2xl">{title}</DialogTitle>
          </div>
        </DialogHeader>
        <div className="py-4 text-center sm:text-left">
          <div className="text-2xl font-bold text-primary"> {/* Changed to text-primary */}
            {value}
            {unit && <span className="text-xs text-primary/80 ml-1">{unit}</span>} {/* Changed to text-primary with opacity */}
          </div>
          {description && (
            <p className="text-sm mt-2">{description}</p> // Kept default dialog text color for description
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
