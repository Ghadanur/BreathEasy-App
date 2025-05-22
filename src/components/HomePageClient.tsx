
"use client";

import { useState, useEffect } from 'react';
import type { AirQualityReading, LocationData } from '@/types';
import { AirQualityCard } from '@/components/AirQualityCard';
import { HistoricalDataChart } from '@/components/HistoricalDataChart';
import { PersonalizedTips } from '@/components/PersonalizedTips';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Thermometer, Droplets, Wind, Cloudy, CloudFog } from 'lucide-react'; // Leaf was changed to Wind, then Lungs, then back to Leaf, then Wind. Keeping Wind.
import { useToast } from '@/hooks/use-toast';
import dynamic from 'next/dynamic';

const LocationMap = dynamic(() => import('@/components/LocationMap').then(mod => mod.default), {
  ssr: false,
  loading: () => <div className="col-span-1 sm:col-span-2 xl:col-span-2 h-[230px] flex items-center justify-center rounded-lg border bg-card shadow-sm p-6"><LoadingSpinner text="Loading map..." /></div>,
});

// Mock Data
const mockLatestReading: AirQualityReading = {
  id: 'mock-reading-latest',
  timestamp: new Date().toISOString(),
  temperature: 26.2,
  humidity: 58.5,
  co2: 480,
  pm2_5: 15.3,
  pm10: 30.7,
  latitude: 24.8607, // Default to Karachi for mock
  longitude: 67.0011,
};

const mockHistoricalData: AirQualityReading[] = Array.from({ length: 24 }, (_, i) => {
  const d = new Date();
  d.setHours(d.getHours() - (23 - i)); // Last 24 hours
  return {
    id: `mock-hist-${i}`,
    timestamp: d.toISOString(),
    temperature: 20 + Math.random() * 10, // 20-30
    humidity: 40 + Math.random() * 30,    // 40-70
    co2: 400 + Math.random() * 200,       // 400-600
    pm2_5: 5 + Math.random() * 20,        // 5-25
    pm10: 10 + Math.random() * 40,       // 10-50
    latitude: 24.8607,
    longitude: 67.0011,
  };
});


export function HomePageClient() {
  // Use mock data
  const latestReading = mockLatestReading;
  const historicalData = mockHistoricalData;
  
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLocationLoading, setIsLocationLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    setIsLocationLoading(true);
    // Attempt to use location from mock data first
    if (latestReading?.latitude && latestReading?.longitude) {
      setLocation({ latitude: latestReading.latitude, longitude: latestReading.longitude });
      setIsLocationLoading(false);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setIsLocationLoading(false);
        },
        (error) => {
          if (error.code !== error.PERMISSION_DENIED) {
            console.error(`Error getting location details: ${error.message} (Code: ${error.code})`, error);
          }
          toast({
            title: error.code === error.PERMISSION_DENIED ? "Location Permission Denied" : "Location Error",
            description: error.code === error.PERMISSION_DENIED ? "Location access was denied. Displaying default location." : "Could not retrieve device location. Displaying default location.",
            variant: "default",
          });
          // Fallback to mock location if GPS fails or is denied
          setLocation({ latitude: mockLatestReading.latitude!, longitude: mockLatestReading.longitude! });
          setIsLocationLoading(false);
        }
      );
    } else { // GPS not available
      toast({
        title: "Location Not Available",
        description: "Device GPS not available. Displaying default location.",
        variant: "default",
      });
      setLocation({ latitude: mockLatestReading.latitude!, longitude: mockLatestReading.longitude! });
      setIsLocationLoading(false);
    }
  }, [latestReading, toast]);


  // No overall loading for mock data, but keep structure if we reintroduce async data later
  const overallLoading = false; // Since data is mocked

  if (overallLoading) { 
    return (
      <div className="container mx-auto p-4 min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <LoadingSpinner text="Loading Air Quality Data..." size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-black to-primary bg-clip-text text-transparent font-sans">
          Air Quality Dashboard
        </h1>
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
             <LocationMap location={location} isLoading={isLocationLoading} className="col-span-1 sm:col-span-2 xl:col-span-2" />
          </>
        ) : (
           <p className="col-span-full text-center text-muted-foreground">Could not load current air quality data. Using mock data.</p>
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
           <p className="text-center text-muted-foreground">No historical data available. Displaying mock trends.</p>
        )}
      </section>

      <section>
        <PersonalizedTips 
          latestReading={latestReading} 
          locationDataFromFeed={location} // Use the resolved location (mock or GPS)
          initialLocation={location} 
        />
      </section>

      <footer className="text-center py-8 text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} BreatheEasy Mobile. All rights reserved.</p>
        <p>Air quality data is for informational purposes only. Currently displaying mock data.</p>
      </footer>
    </div>
  );
}
