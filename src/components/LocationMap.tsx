
"use client";

import type { LocationData } from '@/types';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
// Leaflet CSS is now in layout.tsx

// Fix for default Leaflet marker icon issue with Webpack/Next.js
// This ensures markers are displayed correctly.
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface LocationMapProps {
  location: LocationData | null;
  isLoading: boolean;
  className?: string;
}

export function LocationMap({ location, isLoading, className }: LocationMapProps) {
  const cardBaseClass = "shadow-lg";
  const mapInstanceRef = useRef<L.Map | null>(null); 

  if (isLoading) {
    return (
      <Card className={cn(cardBaseClass, className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Location Map</CardTitle>
          <MapPin className="h-6 w-6 text-accent animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="h-[250px] flex items-center justify-center bg-muted/50 rounded-md">
            <p className="text-sm text-muted-foreground">Loading map...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
    return (
      <Card className={cn(cardBaseClass, className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Location Map</CardTitle>
          <MapPin className="h-6 w-6 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="h-[250px] flex items-center justify-center bg-muted/50 rounded-md">
            <p className="text-sm text-muted-foreground">Location data not available for map.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const position: [number, number] = [location.latitude, location.longitude];
  const mapKey = `map-${location.latitude}-${location.longitude}`;

  useEffect(() => {
    // This effect handles the cleanup of the map instance.
    // It captures the current map instance when the effect for a specific mapKey is set up.
    const mapInstanceToCleanUp = mapInstanceRef.current;

    return () => {
      // When the component unmounts or mapKey changes, this cleanup function runs.
      if (mapInstanceToCleanUp && typeof mapInstanceToCleanUp.remove === 'function') {
        mapInstanceToCleanUp.remove();
      }
      // If the instance being cleaned up is the one currently in the ref, nullify the ref.
      // This is important because whenCreated will set a new instance if the mapKey changes.
      if (mapInstanceRef.current === mapInstanceToCleanUp) {
        mapInstanceRef.current = null;
      }
    };
  }, [mapKey]); // Re-run this effect if mapKey changes

  return (
    <Card className={cn(cardBaseClass, className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Current Location</CardTitle>
        <MapPin className="h-6 w-6 text-accent" />
      </CardHeader>
      <CardContent>
        <MapContainer
            id={mapKey} 
            key={mapKey} 
            whenCreated={(map) => {
              // If there was an old map instance (e.g. from a previous render with the same key, unlikely but defensive)
              // remove it before assigning the new one.
              if (mapInstanceRef.current && mapInstanceRef.current !== map) {
                mapInstanceRef.current.remove();
              }
              mapInstanceRef.current = map;
            }}
            center={position}
            zoom={13}
            scrollWheelZoom={true} 
            style={{ height: '250px', width: '100%', borderRadius: 'var(--radius)' }}
            className="z-0" 
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={position}>
            <Popup>
              {location.address ? location.address : `Lat: ${location.latitude.toFixed(4)}, Lon: ${location.longitude.toFixed(4)}`}
            </Popup>
          </Marker>
        </MapContainer>
      </CardContent>
    </Card>
  );
}

export default LocationMap;
