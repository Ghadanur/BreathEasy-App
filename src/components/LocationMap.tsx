
"use client";

import type { LocationData } from '@/types';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import { useEffect, useRef } from 'react'; // Import useEffect and useRef
import { cn } from '@/lib/utils';

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
  const mapInstanceRef = useRef<L.Map | null>(null); // Ref to store the map instance

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
    // This effect's cleanup function will be called when the component unmounts
    // or when mapKey changes (triggering a remount of MapContainer due to its own key prop).
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove(); // Explicitly remove the Leaflet map instance
        mapInstanceRef.current = null;   // Clear the ref
      }
    };
  }, [mapKey]); // Dependency on mapKey ensures cleanup runs if the map is meant to be replaced

  return (
    <Card className={cn(cardBaseClass, className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Current Location</CardTitle>
        <MapPin className="h-6 w-6 text-accent" />
      </CardHeader>
      <CardContent>
        <MapContainer
            key={mapKey} 
            center={position}
            zoom={13}
            scrollWheelZoom={true} 
            style={{ height: '250px', width: '100%', borderRadius: 'var(--radius)' }}
            className="z-0" 
            whenCreated={(map) => { // Capture the map instance
              mapInstanceRef.current = map;
            }}
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
