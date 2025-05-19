import type { LocationData } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

interface LocationDisplayProps {
  location: LocationData | null;
  isLoading?: boolean;
}

export function LocationDisplay({ location, isLoading }: LocationDisplayProps) {
  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Current Location</CardTitle>
        <MapPin className="h-6 w-6 text-accent" />
      </CardHeader>
      <CardContent>
        {isLoading && <p className="text-sm text-muted-foreground">Fetching location...</p>}
        {!isLoading && location ? (
          <>
            <div className="text-lg font-semibold">
              Lat: {location.latitude.toFixed(4)}, Lon: {location.longitude.toFixed(4)}
            </div>
            {location.address && <p className="text-xs text-muted-foreground">{location.address}</p>}
          </>
        ) : (
          !isLoading && <p className="text-sm text-muted-foreground">Location data not available. Please enable location services.</p>
        )}
      </CardContent>
    </Card>
  );
}
