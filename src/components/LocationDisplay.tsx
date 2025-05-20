
"use client";

import type { LocationData } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LocationDisplayProps {
  location: LocationData | null;
  isLoading: boolean;
  className?: string;
}

export function LocationDisplay({ location, isLoading, className }: LocationDisplayProps) {
  const cardBaseClass = "shadow-lg";

  if (isLoading) {
    return (
      <Card className={cn(cardBaseClass, className, "col-span-1 sm:col-span-2")}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Location</CardTitle>
          <MapPin className="h-6 w-6 text-accent animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="h-[60px] flex items-center justify-center bg-muted/50 rounded-md">
            <p className="text-sm text-muted-foreground">Fetching location...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
    return (
      <Card className={cn(cardBaseClass, className, "col-span-1 sm:col-span-2")}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Location</CardTitle>
          <MapPin className="h-6 w-6 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="h-[60px] flex items-center justify-center bg-muted/50 rounded-md">
            <p className="text-sm text-muted-foreground">Location data not available.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(cardBaseClass, className, "col-span-1 sm:col-span-2")}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Current Location</CardTitle>
        <MapPin className="h-6 w-6 text-accent" />
      </CardHeader>
      <CardContent>
        <div className="text-lg font-semibold">
          Lat: {location.latitude.toFixed(4)}, Lon: {location.longitude.toFixed(4)}
        </div>
        {location.address && <p className="text-xs text-muted-foreground pt-1">{location.address}</p>}
      </CardContent>
    </Card>
  );
}

export default LocationDisplay;
