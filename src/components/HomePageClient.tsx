
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { AirQualityReading, LocationData } from '@/types';
import { fetchLatestAirQuality, fetchHistoricalAirQuality } from '@/lib/airQualityService';
import { AirQualityCard } from '@/components/AirQualityCard';
import { HistoricalDataChart } from '@/components/HistoricalDataChart';
import { PersonalizedTips } from '@/components/PersonalizedTips';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Thermometer, Droplets, Wind, Cloudy, RefreshCw } from 'lucide-react'; // Removed CloudRain (was for PM1), MapPin
import { useToast } from '@/hooks/use-toast';
import { Button } from './ui/button';
import { LocationDisplay } from '@/components/LocationDisplay'; // Import LocationDisplay

export function HomePageClient() {
  const [latestReading, setLatestReading] = useState<AirQualityReading | null>(null);
  const [historicalData, setHistoricalData] = useState<AirQualityReading[]>([]);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocationLoading, setIsLocationLoading] = useState(true);
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setIsLocationLoading(true);
    try {
      const { reading: latest, channelLocation: tsChannelLocationInfo } = await fetchLatestAirQuality();
      const historical = await fetchHistoricalAirQuality(96);
      
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

      // Prioritize location from the feed data itself (fields 3 & 4)
      if (latest?.latitude && latest?.longitude && typeof latest.latitude === 'number' && typeof latest.longitude === 'number') {
        setLocation({ latitude: latest.latitude, longitude: latest.longitude });
        setIsLocationLoading(false);
      } 
      // Fallback to ThingSpeak channel's general location metadata
      else if (tsChannelLocationInfo && typeof tsChannelLocationInfo.latitude === 'number' && typeof tsChannelLocationInfo.longitude === 'number') {
        setLocation(tsChannelLocationInfo);
        setIsLocationLoading(false);
      } 
      // Fallback to device's GPS
      else if (navigator.geolocation) {
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
              description: error.code === error.PERMISSION_DENIED ? "Location access was denied. Some features might be limited." : "Could not retrieve device location. Some features might be limited.",
              variant: "default",
            });
            setIsLocationLoading(false);
          }
        );
      } else {
        toast({
          title: "Location Not Available",
          description: "Could not retrieve location from any source.",
          variant: "default",
        });
        setIsLocationLoading(false);
      }

    } catch (error) {
      console.error("Failed to fetch air quality data:", error);
      toast({
        title: "Error",
        description: "Could not fetch air quality data. Please try again later.",
        variant: "destructive",
      });
      setIsLocationLoading(false); 
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    loadData();
  }, [loadData]);


  if (isLoading && !latestReading && historicalData.length === 0 && isLocationLoading) { 
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
        <Button onClick={loadData} variant="outline" size="sm" disabled={isLoading || isLocationLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${(isLoading || isLocationLoading) ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
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
              title="CO₂" 
              value={latestReading.co2.toFixed(0)} // from field5 (MQ135)
              unit="ppm"
              icon={Wind}
              color={latestReading.co2 > 2000 ? "text-red-500" : latestReading.co2 > 1000 ? "text-yellow-500" : "text-green-500"}
              description="Carbon Dioxide Level (MQ135)"
            />
            <AirQualityCard 
              title="PM2.5" 
              value={latestReading.pm2_5.toFixed(1)} // from field6
              unit="μg/m³" 
              icon={Cloudy} // Using Cloudy, as CloudRain was for PM1
              color="text-indigo-500"
              description="Particulate Matter <2.5μm"
            />
            <AirQualityCard 
              title="PM10" 
              value={latestReading.pm10.toFixed(1)} // from field7
              unit="μg/m³" 
              icon={Cloudy} 
              color="text-slate-500"
              description="Particulate Matter <10μm"
            />
             <LocationDisplay location={location} isLoading={isLocationLoading} className="col-span-1 sm:col-span-2" />
          </>
        ) : (
          !isLoading && <p className="col-span-full text-center text-muted-foreground">Could not load current air quality data. Please check your ThingSpeak configuration.</p>
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
           !isLoading && <p className="text-center text-muted-foreground">No historical data found or failed to load. Please check your ThingSpeak configuration.</p>
        )}
      </section>

      <section>
        <PersonalizedTips 
          latestReading={latestReading} 
          locationDataFromFeed={latestReading && latestReading.latitude && latestReading.longitude ? {latitude: latestReading.latitude, longitude: latestReading.longitude} : null} 
          initialLocation={location} 
        />
      </section>

      <footer className="text-center py-8 text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} BreatheEasy Mobile. All rights reserved.</p>
        <p>Air quality data is for informational purposes only.</p>
      </footer>
    </div>
  );
}
