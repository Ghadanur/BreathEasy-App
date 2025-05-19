
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { AirQualityReading, LocationData } from '@/types';
import { fetchLatestAirQuality, fetchHistoricalAirQuality } from '@/lib/airQualityService';
import { AirQualityCard } from '@/components/AirQualityCard';
import { HistoricalDataChart } from '@/components/HistoricalDataChart';
import { PersonalizedTips } from '@/components/PersonalizedTips';
import { LocationDisplay } from '@/components/LocationDisplay';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Thermometer, Droplets, Gauge, CloudDrizzle, CloudRain, CloudLightning } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from './ui/button';
import { RefreshCw } from 'lucide-react';

export function HomePageClient() {
  const [latestReading, setLatestReading] = useState<AirQualityReading | null>(null);
  const [historicalData, setHistoricalData] = useState<AirQualityReading[]>([]);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocationLoading, setIsLocationLoading] = useState(true);
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [latest, historical] = await Promise.all([
        fetchLatestAirQuality(),
        fetchHistoricalAirQuality(96) // Fetch for last 96 entries
      ]);
      
      if (latest) {
        setLatestReading(latest);
      } else {
        toast({
          title: "Warning",
          description: "Could not fetch the latest air quality data. Displaying fallback or no data.",
          variant: "default",
        });
      }
      setHistoricalData(historical || []);

    } catch (error) {
      console.error("Failed to fetch air quality data:", error);
      toast({
        title: "Error",
        description: "Could not fetch air quality data. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    // Attempt to get geolocation only if not already set or explicitly requested
    if (!location && navigator.geolocation) {
      setIsLocationLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            // address: "To be fetched via reverse geocoding" 
          });
          setIsLocationLoading(false);
        },
        (error) => {
          console.error(`Error getting location details: ${error.message} (Code: ${error.code})`, error);
          if (error.code === error.PERMISSION_DENIED) {
            toast({
              title: "Location Permission Denied",
              description: "Location access was denied. Some features might be limited.",
              variant: "default",
            });
          } else {
            toast({
              title: "Location Error",
              description: "Could not retrieve location. Some features might be limited.",
              variant: "default",
            });
          }
          setIsLocationLoading(false);
        }
      );
    } else if (!navigator.geolocation) {
       toast({
        title: "Location Not Supported",
        description: "Geolocation is not supported by your browser.",
        variant: "default",
      });
      setIsLocationLoading(false);
    }
  }, [toast, location]); // Added location to dependency array

  if (isLoading && !latestReading && historicalData.length === 0) { 
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
        <Button onClick={loadData} variant="outline" size="sm" disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {/* Current Readings Section */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {latestReading ? (
          <>
            <AirQualityCard 
              title="Temperature" 
              value={latestReading.temperature.toFixed(1)} 
              unit="°C" 
              icon={Thermometer}
              color="text-orange-500"
              description="Current ambient temperature"
            />
            <AirQualityCard 
              title="Humidity" 
              value={latestReading.humidity.toFixed(1)} 
              unit="%" 
              icon={Droplets}
              color="text-blue-500"
              description="Relative humidity level"
            />
            <AirQualityCard 
              title="AQI" 
              value={latestReading.aqi.toFixed(0)} 
              icon={Gauge}
              color={latestReading.aqi > 100 ? "text-red-500" : latestReading.aqi > 50 ? "text-yellow-500" : "text-green-500"}
              description="Air Quality Index (from Sensor)"
            />
            <LocationDisplay location={location} isLoading={isLocationLoading} />
            <AirQualityCard 
              title="PM1.0" 
              value={latestReading.pm1.toFixed(1)} 
              unit="μg/m³" 
              icon={CloudDrizzle}
              color="text-purple-500"
              description="Particulate Matter <1μm"
            />
            <AirQualityCard 
              title="PM2.5" 
              value={latestReading.pm2_5.toFixed(1)} 
              unit="μg/m³" 
              icon={CloudRain}
              color="text-indigo-500"
              description="Particulate Matter <2.5μm"
            />
            <AirQualityCard 
              title="PM10" 
              value={latestReading.pm10.toFixed(1)} 
              unit="μg/m³" 
              icon={CloudLightning}
              color="text-gray-500"
              description="Particulate Matter <10μm"
            />
          </>
        ) : (
          !isLoading && <p className="col-span-full text-center text-muted-foreground">Could not load current air quality data. Please check your ThingSpeak configuration.</p>
        )}
      </section>
      
      {/* Historical Data Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Historical Trends</h2>
        {historicalData.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <HistoricalDataChart data={historicalData} dataKey="temperature" title="Temperature Trend (°C)" color="hsl(var(--chart-1))" unit="°C" />
            <HistoricalDataChart data={historicalData} dataKey="aqi" title="AQI Trend" chartType="bar" color="hsl(var(--chart-2))" />
            <HistoricalDataChart data={historicalData} dataKey="pm2_5" title="PM2.5 Trend (μg/m³)" color="hsl(var(--chart-3))" unit="μg/m³"/>
            <HistoricalDataChart data={historicalData} dataKey="humidity" title="Humidity Trend (%)" chartType="bar" color="hsl(var(--chart-4))" unit="%"/>
          </div>
        ) : (
           !isLoading && <p className="text-center text-muted-foreground">No historical data found or failed to load. Please check your ThingSpeak configuration.</p>
        )}
      </section>

      {/* Personalized Tips Section */}
      <section>
        <PersonalizedTips latestReading={latestReading} location={location} />
      </section>

      <footer className="text-center py-8 text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} BreatheEasy Mobile. All rights reserved.</p>
        <p>Air quality data is for informational purposes only.</p>
      </footer>
    </div>
  );
}
