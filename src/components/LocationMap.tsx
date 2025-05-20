
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
  const mapInstanceRef = useRef<L.Map | null>(null); // Ref to store the Leaflet Map instance

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
    // Capture the current map instance from the ref when the effect sets up.
    const currentMapInstance = mapInstanceRef.current;
    
    // console.log('LocationMap effect: mapKey', mapKey, 'map instance to attach/curr:', currentMapInstance ? 'exists' : 'null');

    return () => {
      // console.log('LocationMap CLEANUP: mapKey', mapKey, 'map instance to remove:', currentMapInstance ? 'exists' : 'null');
      if (currentMapInstance) {
        currentMapInstance.remove();
        // console.log('LocationMap CLEANUP: map.remove() called for mapKey', mapKey);
      }
    };
  }, [mapKey]); // Dependency on mapKey ensures cleanup runs if the map is meant to be replaced, or on unmount.

  return (
    <Card className={cn(cardBaseClass, className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Current Location</CardTitle>
        <MapPin className="h-6 w-6 text-accent" />
      </CardHeader>
      <CardContent>
        <MapContainer
            id={mapKey} // Explicitly set DOM ID for Leaflet
            ref={(instance: L.Map | null) => { mapInstanceRef.current = instance; }} // Assign the Leaflet Map instance to this ref
            key={mapKey} // React key for reconciliation
            center={position}
            zoom={13}
            scrollWheelZoom={true} 
            style={{ height: '250px', width: '100%', borderRadius: 'var(--radius)' }}
            className="z-0" // Ensures map tiles are below popups/markers if needed
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
