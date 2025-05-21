
"use client";

import { useState, useEffect } from 'react';
import type { AirQualityReading, LocationData } from '@/types';
import { useAirQualityReadings } from '@/hooks/useAirQualityReadings';
import { AirQualityCard } from '@/components/AirQualityCard';
import { HistoricalDataChart } from '@/components/HistoricalDataChart';
import { PersonalizedTips } from '@/components/PersonalizedTips';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Thermometer, Droplets, Wind, Cloudy, CloudFog } from 'lucide-react'; // Removed RefreshCw, MapPin
import { useToast } from '@/hooks/use-toast';
// Removed Button import as refresh button is removed
import dynamic from 'next/dynamic';

const LocationDisplay = dynamic(() => import('@/components/LocationDisplay').then(mod => mod.LocationDisplay), {
  ssr: false,
  loading: () => <div className="col-span-1 sm:col-span-2 xl:col-span-2 h-[138px] flex items-center justify-center rounded-lg border bg-card shadow-sm p-6"><LoadingSpinner text="Loading map..." /></div>,
});


export function HomePageClient() {
  const { readings, loading: airQualityLoading, error: airQualityError } = useAirQualityReadings(96);
  
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLocationLoading, setIsLocationLoading] = useState(true);
  const { toast } = useToast();

  // Derive latestReading (newest) and historicalData (all fetched, oldest to newest)
  const latestReading = readings.length > 0 ? readings[readings.length - 1] : null;
  const historicalData = readings;

  useEffect(() => {
    setIsLocationLoading(true);
    let locationSourceUsed = "none"; // To track if any location source was attempted

    // 1. Prioritize location from the latest Firebase reading itself
    if (latestReading?.latitude && latestReading?.longitude && typeof latestReading.latitude === 'number' && typeof latestReading.longitude === 'number') {
      setLocation({ latitude: latestReading.latitude, longitude: latestReading.longitude });
      setIsLocationLoading(false);
      locationSourceUsed = "firebase_reading";
    } 
    // 2. Fallback to device's GPS if no location from Firebase reading
    else if (navigator.geolocation) {
      locationSourceUsed = "gps_attempt";
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setIsLocationLoading(false);
          locationSourceUsed = "gps_success";
        },
        (error) => {
          if (error.code !== error.PERMISSION_DENIED) {
            console.error(`Error getting location details: ${error.message} (Code: ${error.code})`, error);
          }
          // Only show toast if Firebase didn't provide location either
          if (locationSourceUsed !== "firebase_reading") {
            toast({
              title: error.code === error.PERMISSION_DENIED ? "Location Permission Denied" : "Location Error",
              description: error.code === error.PERMISSION_DENIED ? "Location access was denied." : "Could not retrieve device location.",
              variant: "default",
            });
          }
          setIsLocationLoading(false); // Stop location loading even on error
          locationSourceUsed = "gps_error";
        }
      );
    } else {
      // No Firebase location and no GPS capability
      locationSourceUsed = "gps_unavailable";
      if (locationSourceUsed !== "firebase_reading") { // Avoid redundant toast if firebase location might still come
        toast({
          title: "Location Not Available",
          description: "Could not retrieve location from Firebase or device GPS.",
          variant: "default",
        });
      }
      setIsLocationLoading(false);
    }
    // If no location source was successfully used and we are not already loading, stop loading.
    if (locationSourceUsed === "none" || (locationSourceUsed === "gps_attempt" && !isLocationLoading)) {
       setIsLocationLoading(false);
    }

  }, [latestReading, toast]);

  useEffect(() => {
    if (airQualityError) {
      toast({
        title: "Firebase Data Error",
        description: `Failed to fetch air quality data: ${airQualityError.message}. Please check your connection and Firebase setup.`,
        variant: "destructive",
      });
    }
  }, [airQualityError, toast]);

  const overallLoading = airQualityLoading && readings.length === 0;

  if (overallLoading) { 
    return (
      <div className="container mx-auto p-4 min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <LoadingSpinner text="Loading Air Quality Data from Firebase..." size="lg" />
      </div>
    );
  }

  const locationDataFromFeed = latestReading?.latitude && latestReading?.longitude
    ? { latitude: latestReading.latitude, longitude: latestReading.longitude }
    : null;

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-black to-primary bg-clip-text text-transparent font-sans">
          Air Quality Dashboard
        </h1>
        {/* Refresh button removed as data is now real-time */}
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {latestReading ? (
          <>
            <AirQualityCard 
              title="Temperature" 
              value={latestReading.temperature.toFixed(1)} 
              unit="°C" 
              icon={Thermometer}
              color="text-orange-500"
              description="Ambient temperature"
            />
            <AirQualityCard 
              title="Humidity" 
              value={latestReading.humidity.toFixed(1)} 
              unit="%" 
              icon={Droplets}
              color="text-blue-500"
              description="Relative humidity"
            />
            <AirQualityCard 
              title="CO₂" 
              value={latestReading.co2.toFixed(0)} 
              unit="ppm"
              icon={Wind}
              color={latestReading.co2 > 2000 ? "text-red-500" : latestReading.co2 > 1000 ? "text-yellow-500" : "text-green-500"}
              description="Carbon Dioxide Level"
            />
            <AirQualityCard 
              title="PM2.5" 
              value={latestReading.pm2_5.toFixed(1)}
              unit="μg/m³" 
              icon={CloudFog} 
              color="text-indigo-500"
              description="Particulate Matter <2.5μm"
            />
            <AirQualityCard 
              title="PM10" 
              value={latestReading.pm10.toFixed(1)}
              unit="μg/m³" 
              icon={Cloudy} 
              color="text-slate-500"
              description="Particulate Matter <10μm"
            />
            <LocationDisplay location={location} isLoading={isLocationLoading} className="col-span-1 sm:col-span-2 xl:col-span-2" />
          </>
        ) : (
          !airQualityLoading && <p className="col-span-full text-center text-muted-foreground">Could not load current air quality data from Firebase. Please check your configuration and data source.</p>
        )}
      </section>
      
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Historical Trends</h2>
        {historicalData.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <HistoricalDataChart data={historicalData} dataKey="temperature" title="Temperature Trend (°C)" color="hsl(var(--chart-1))" unit="°C" />
            <HistoricalDataChart data={historicalData} dataKey="co2" title="CO₂ Trend (ppm)" color="hsl(var(--chart-2))" unit="ppm"/>
            <HistoricalDataChart data={historicalData} dataKey="pm2_5" title="PM2.5 Trend (μg/m³)" color="hsl(var(--chart-3))" unit="μg/m³"/>
            <HistoricalDataChart data={historicalData} dataKey="humidity" title="Humidity Trend (%)" color="hsl(var(--chart-4))" unit="%"/>
            <HistoricalDataChart data={historicalData} dataKey="pm10" title="PM10 Trend (μg/m³)" color="hsl(var(--accent))" unit="μg/m³"/>
          </div>
        ) : (
           !airQualityLoading && <p className="text-center text-muted-foreground">No historical data found or failed to load from Firebase. Please check your configuration and data source.</p>
        )}
      </section>

      <section>
        <PersonalizedTips 
          latestReading={latestReading} 
          locationDataFromFeed={locationDataFromFeed} 
          initialLocation={location}
        />
      </section>

      <footer className="text-center py-8 text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} BreatheEasy Mobile. All rights reserved.</p>
        <p>Air quality data is for informational purposes only. Powered by Firebase.</p>
      </footer>
    </div>
  );
}
