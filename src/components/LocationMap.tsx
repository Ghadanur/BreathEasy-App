
"use client";

import type { LocationData } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import type L from 'leaflet';
import { useEffect, useRef, useState } from 'react';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface LocationMapProps {
  location: LocationData | null;
  isLoading: boolean;
  className?: string;
}

function LocationMapComponent({ location, isLoading, className }: LocationMapProps) {
  const cardBaseClass = "shadow-lg";
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [leafletIcon, setLeafletIcon] = useState<L.Icon | undefined>(undefined);

  useEffect(() => {
    // Create icon on client mount
    if (typeof window !== 'undefined') {
        const LModule = require('leaflet') as typeof L;
         setLeafletIcon(new LModule.Icon({
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41],
        }));
    }
  }, []); // Empty dependency array ensures this runs once on mount

  const mapKey = location ? `map-${location.latitude}-${location.longitude}` : 'map-loading-or-no-location';
  
  useEffect(() => {
    const currentMap = mapInstanceRef.current;
    return () => {
      if (currentMap) {
        currentMap.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mapKey]); 

  if (isLoading) {
    return (
      <Card className={cn(cardBaseClass, className, "col-span-1 sm:col-span-2")}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Location</CardTitle>
          <MapPin className="h-6 w-6 text-accent animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center bg-muted/50 rounded-md">
            <LoadingSpinner text="Loading map..." />
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
        <div key={`map-wrapper-${mapKey}`} className="h-[200px] rounded-md overflow-hidden">
          {typeof window !== 'undefined' && leafletIcon ? (
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
              <Marker position={position} icon={leafletIcon}>
                <Popup>
                  Lat: {location.latitude.toFixed(4)}, Lon: {location.longitude.toFixed(4)} <br />
                  {location.address && <>{location.address}<br /></>}
                  Approximate location.
                </Popup>
              </Marker>
            </MapContainer>
          ) : (
            <div className="h-full flex items-center justify-center bg-muted/50 rounded-md">
              <LoadingSpinner text="Initializing map resources..." />
            </div>
          )}
        </div>
        {location.address && <p className="text-xs text-muted-foreground pt-2">{location.address}</p>}
      </CardContent>
    </Card>
  );
}

export default LocationMapComponent; // Default export
