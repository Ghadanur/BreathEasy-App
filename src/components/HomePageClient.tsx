
"use client";

import { useState, useEffect } from 'react';
import type { AirQualityReading, LocationData } from '@/types';
import { useAirQualityReadings } from '@/hooks/useAirQualityReadings';
import { AirQualityCard } from '@/components/AirQualityCard';
import { HistoricalDataChart } from '@/components/HistoricalDataChart';
import { PersonalizedTips } from '@/components/PersonalizedTips';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Thermometer, Droplets, Wind, Cloudy, CloudFog } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import dynamic from 'next/dynamic';

const LocationMap = dynamic(() => import('@/components/LocationMap').then(mod => mod.default), {
  ssr: false,
  loading: () => <div className="col-span-1 sm:col-span-2 xl:col-span-2 h-[230px] flex items-center justify-center rounded-lg border bg-card shadow-sm p-6"><LoadingSpinner text="Loading location..." /></div>,
});


export function HomePageClient() {
  const { readings: historicalData, loading: airQualityLoading, error: airQualityError } = useAirQualityReadings(96);
  const latestReading = historicalData && historicalData.length > 0 ? historicalData[0] : null;

  const [location, setLocation] = useState<LocationData | null>(null);
  // isLocationLoading is now directly tied to airQualityLoading for simplicity,
  // as location comes from the same data feed.
  const { toast } = useToast();

  useEffect(() => {
    if (latestReading?.latitude && latestReading?.longitude) {
      setLocation({
        latitude: latestReading.latitude,
        longitude: latestReading.longitude,
        // Optionally, you could implement reverse geocoding here if desired,
        // but for now, we'll just use lat/lon from the feed.
      });
    } else if (!airQualityLoading && latestReading) {
      // If loading is done, and latestReading exists but has no location,
      // set location to null explicitly.
      setLocation(null);
      // toast({
      //   title: "Location Data Missing",
      //   description: "Location data (latitude/longitude) is not available in the latest air quality reading from Firebase.",
      //   variant: "default",
      // });
    } else if (!airQualityLoading && !latestReading) {
      // If loading is done and there's no latest reading at all.
      setLocation(null);
    }
  }, [latestReading, airQualityLoading, toast]);

  if (airQualityLoading && historicalData.length === 0) {
    return (
      <div className="container mx-auto p-4 min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <LoadingSpinner text="Loading Air Quality Data..." size="lg" />
      </div>
    );
  }

  if (airQualityError) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-2xl font-bold text-destructive mb-4">Error Loading Data</h1>
        <p className="text-muted-foreground">Could not load air quality data from Firebase. Please check your connection and configuration.</p>
        <p className="text-xs text-muted-foreground mt-2">Details: {airQualityError.message}</p>
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
            {/* Pass airQualityLoading as isLoading prop to LocationMap */}
            <LocationMap location={location} isLoading={airQualityLoading} className="col-span-1 sm:col-span-2 xl:col-span-2" />
          </>
        ) : (
          !airQualityLoading && <p className="col-span-full text-center text-muted-foreground">No current air quality data available.</p>
        )}
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Historical Trends</h2>
        {historicalData.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <HistoricalDataChart data={historicalData} dataKey="temperature" title="Temperature Trend (°C)" color="hsl(var(--chart-1))" unit="°C" />
            <HistoricalDataChart data={historicalData} dataKey="co2" title="CO₂ Trend (ppm)" color="hsl(var(--chart-2))" unit="ppm" />
            <HistoricalDataChart data={historicalData} dataKey="pm2_5" title="PM2.5 Trend (μg/m³)" color="hsl(var(--chart-3))" unit="μg/m³" />
            <HistoricalDataChart data={historicalData} dataKey="humidity" title="Humidity Trend (%)" color="hsl(var(--chart-4))" unit="%" />
            <HistoricalDataChart data={historicalData} dataKey="pm10" title="PM10 Trend (μg/m³)" color="hsl(var(--accent))" unit="μg/m³" />
          </div>
        ) : (
          !airQualityLoading && <p className="text-center text-muted-foreground">No historical data available.</p>
        )}
      </section>

      <section>
        <PersonalizedTips
          latestReading={latestReading}
          // Pass the location derived from Firebase feed
          derivedLocation={location} 
        />
      </section>

      <footer className="text-center py-8 text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} BreatheEasy Mobile. All rights reserved.</p>
        <p>Air quality data provided by ESP32 sensor network via Firebase.</p>
      </footer>
    </div>
  );
}
