
"use client";

import type { LocationData } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import type L from 'leaflet';
import { useEffect, useState } from 'react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Dialog, DialogContent, DialogHeader, DialogTitle as ShadDialogTitle, DialogTrigger } from '@/components/ui/dialog';

// This component is responsible for displaying the location on a map.
export default function LocationMap({ location, isLoading, className }: LocationMapProps) {
  const cardBaseClass = "shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer";
  const [leafletIcon, setLeafletIcon] = useState<L.Icon | undefined>(undefined);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const LModule = require('leaflet') as typeof L;
      if (LModule.Icon.Default.prototype._getIconUrl) {
        delete LModule.Icon.Default.prototype._getIconUrl;
      }
      LModule.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
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
  }, []);

  const mapKey = location ? `map-${location.latitude}-${location.longitude}` : 'map-loading-or-no-location';
  const position: L.LatLngExpression | undefined = location ? [location.latitude, location.longitude] : undefined;

  const renderMapContent = (isDialog: boolean) => {
    if (isLoading) {
      return (
        <div className={cn("flex items-center justify-center bg-muted/50 rounded-md", isDialog ? "h-[70vh]" : "h-[200px]")}>
          <LoadingSpinner text="Fetching location..." />
        </div>
      );
    }
    if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number' || !position) {
      return (
        <div className={cn("flex items-center justify-center bg-destructive/10 rounded-md", isDialog ? "h-[70vh]" : "h-[200px]")}>
          <p className="text-sm text-destructive-foreground">Location data not available.</p>
        </div>
      );
    }
    return (
      <div key={`map-wrapper-${mapKey}-${isDialog}`} className={cn("rounded-md overflow-hidden", isDialog ? "h-[70vh]" : "h-[200px]")}>
        {typeof window !== 'undefined' && leafletIcon ? (
          <MapContainer
            key={mapKey} 
            center={position}
            zoom={isDialog ? 15 : 13} // Slightly more zoom in dialog
            scrollWheelZoom={isDialog} 
            style={{ height: '100%', width: '100%' }}
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
    );
  };

  const headerIcon = isLoading ? <MapPin className="h-6 w-6 text-accent animate-pulse" /> : 
                     (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') ? <AlertTriangle className="h-6 w-6 text-destructive" /> :
                     <MapPin className="h-6 w-6 text-accent" />;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className={cn(cardBaseClass, className)}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Location</CardTitle>
            {headerIcon}
          </CardHeader>
          <CardContent>
            {renderMapContent(false)}
            {location?.address && !isLoading && <p className="text-xs text-muted-foreground pt-2">{location.address}</p>}
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl h-[85vh] flex flex-col p-4">
        <DialogHeader className="pb-2">
          {/* Removed text-white to use default dialog title color */}
          <ShadDialogTitle className="text-lg font-semibold">Sensor Location</ShadDialogTitle>
        </DialogHeader>
        <div className="flex-grow">
          {renderMapContent(true)}
        </div>
         {location?.address && !isLoading && <p className="text-sm text-muted-foreground pt-2 text-center">{location.address}</p>}
      </DialogContent>
    </Dialog>
  );
}

interface LocationMapProps {
  location: LocationData | null;
  isLoading: boolean;
  className?: string;
}

