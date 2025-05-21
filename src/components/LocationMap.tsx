
"use client";

import type { LocationData } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import type L from 'leaflet';
import { useEffect, useRef } from 'react';

interface LocationMapProps {
  location: LocationData | null;
  isLoading: boolean;
  className?: string;
}

// Default icon for Leaflet markers (resolves potential issues with default icon paths)
const createDefaultIcon = (): L.Icon | undefined => {
  if (typeof window !== 'undefined') {
    // Ensure Leaflet is only required on the client-side
    const LModule = require('leaflet') as typeof L;
    return new LModule.Icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });
  }
  return undefined;
};


export function LocationMap({ location, isLoading, className }: LocationMapProps) {
  const cardBaseClass = "shadow-lg";
  const mapInstanceRef = useRef<L.Map | null>(null);
  // Generate a unique key for the map. Changes when location data changes.
  const mapKey = location ? `map-${location.latitude}-${location.longitude}` : 'map-loading-or-no-location';
  
  // Create icon instance. This will be undefined on SSR.
  const defaultIcon = createDefaultIcon();

  useEffect(() => {
    // Cleanup function for the Leaflet map instance
    // This effect runs when mapKey changes, or when the component unmounts.
    const currentMap = mapInstanceRef.current;
    return () => {
      if (currentMap) {
        currentMap.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mapKey]); // Depend on mapKey to re-run cleanup when the underlying map should change

  if (isLoading) {
    return (
      <Card className={cn(cardBaseClass, className, "col-span-1 sm:col-span-2")}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Location</CardTitle>
          <MapPin className="h-6 w-6 text-accent animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center bg-muted/50 rounded-md">
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
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center bg-destructive/10 rounded-md">
            <p className="text-sm text-destructive-foreground">Location data not available.</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const position: L.LatLngExpression = [location.latitude, location.longitude];

  return (
    <Card className={cn(cardBaseClass, className, "col-span-1 sm:col-span-2")}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Current Location</CardTitle>
        <MapPin className="h-6 w-6 text-accent" />
      </CardHeader>
      <CardContent>
        {/* Keying the wrapper div as well */}
        <div key={`map-wrapper-${mapKey}`} className="h-[200px] rounded-md overflow-hidden">
          {/* Ensure MapContainer only renders on client AND when defaultIcon is ready */}
          {typeof window !== 'undefined' && defaultIcon && (
            <MapContainer
              id={mapKey} 
              key={mapKey} 
              center={position}
              zoom={13}
              scrollWheelZoom={false}
              style={{ height: '100%', width: '100%' }}
              className="z-0"
              whenCreated={(mapInstance) => {
                mapInstanceRef.current = mapInstance;
              }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={position} icon={defaultIcon}>
                <Popup>
                  Lat: {location.latitude.toFixed(4)}, Lon: {location.longitude.toFixed(4)} <br />
                  {location.address && <>{location.address}<br /></>}
                  Approximate location.
                </Popup>
              </Marker>
            </MapContainer>
          )}
        </div>
        {location.address && <p className="text-xs text-muted-foreground pt-2">{location.address}</p>}
      </CardContent>
    </Card>
  );
}

export default LocationMap;
