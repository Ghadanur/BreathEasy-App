
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { AirQualityReading, LocationData } from '@/types';
import { fetchLatestAirQuality, fetchHistoricalAirQuality } from '@/lib/airQualityService'; // Updated service
import { AirQualityCard } from '@/components/AirQualityCard';
import { HistoricalDataChart } from '@/components/HistoricalDataChart';
import { PersonalizedTips } from '@/components/PersonalizedTips';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Thermometer, Droplets, Wind, Cloudy, RefreshCw, CloudFog, MapPin } from 'lucide-react'; // Added MapPin
import { useToast } from '@/hooks/use-toast';
import { Button } from './ui/button';
import { LocationDisplay } from './LocationDisplay'; // Using text display for now

export function HomePageClient() {
  const [latestReading, setLatestReading] = useState<AirQualityReading | null>(null);
  const [historicalData, setHistoricalData] = useState<AirQualityReading[]>([]);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocationLoading, setIsLocationLoading] = useState(true); // Still useful for GPS fallback
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setIsLocationLoading(true); // Reset for each load attempt
    try {
      // fetchLatestAirQuality now returns an object { reading: AirQualityReading | null, channelLocation: LocationData | null }
      const { reading: latest, channelLocation: firebaseLocation } = await fetchLatestAirQuality();
      const historical = await fetchHistoricalAirQuality(96); // Fetch last 96 readings
      
      if (latest) {
        setLatestReading(latest);
      } else {
        toast({
          title: "Warning",
          description: "Could not fetch the latest air quality data from Firebase. Displaying fallback or no data.",
          variant: "default",
        });
      }
      setHistoricalData(historical || []);

      // Location logic:
      // 1. Prioritize location from the latest Firebase reading itself
      if (latest?.latitude && latest?.longitude) {
        setLocation({ latitude: latest.latitude, longitude: latest.longitude });
        setIsLocationLoading(false);
      }
      // 2. Fallback to channelLocation from Firebase service (if it was derived differently, though usually same as above)
      else if (firebaseLocation) {
        setLocation(firebaseLocation);
        setIsLocationLoading(false);
      }
      // 3. Fallback to device's GPS if no location from Firebase
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
              description: error.code === error.PERMISSION_DENIED ? "Location access was denied. Some features might be limited." : "Could not retrieve device location. Firebase also provided no location. Some features might be limited.",
              variant: "default",
            });
            setIsLocationLoading(false); // Stop loading even on error
          }
        );
      } else {
        // No Firebase location and no GPS capability
        toast({
          title: "Location Not Available",
          description: "Could not retrieve location from Firebase or device GPS.",
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
      // Ensure loading states are reset even on generic catch
      setIsLocationLoading(false); 
    } finally {
      setIsLoading(false); // Overall data loading
    }
  }, [toast]);
  
  useEffect(() => {
    loadData();
  }, [loadData]);


  if (isLoading && !latestReading && historicalData.length === 0 && isLocationLoading) { 
    return (
      <div className="container mx-auto p-4 min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <LoadingSpinner text="Loading Air Quality Data from Firebase..." size="lg" />
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
              description="Ambient temperature" // Updated description from Firebase if available, else default
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
              icon={Wind} // Icon for CO2
              color={latestReading.co2 > 2000 ? "text-red-500" : latestReading.co2 > 1000 ? "text-yellow-500" : "text-green-500"}
              description="Carbon Dioxide Level"
            />
             <AirQualityCard 
              title="PM2.5" 
              value={latestReading.pm2_5.toFixed(1)} // pm2_5 from Firebase 'pm25.value'
              unit="μg/m³" 
              icon={CloudFog} 
              color="text-indigo-500"
              description="Particulate Matter <2.5μm"
            />
            <AirQualityCard 
              title="PM10" 
              value={latestReading.pm10.toFixed(1)} // pm10 from Firebase 'pm10.value'
              unit="μg/m³" 
              icon={Cloudy} 
              color="text-slate-500"
              description="Particulate Matter <10μm"
            />
            {/* Using LocationDisplay for text-based location for now */}
            <LocationDisplay location={location} isLoading={isLocationLoading} className="col-span-1 sm:col-span-2 xl:col-span-2" />
          </>
        ) : (
          !isLoading && <p className="col-span-full text-center text-muted-foreground">Could not load current air quality data from Firebase. Please check your configuration and data source.</p>
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
           !isLoading && <p className="text-center text-muted-foreground">No historical data found or failed to load from Firebase. Please check your configuration and data source.</p>
        )}
      </section>

      <section>
        <PersonalizedTips 
          latestReading={latestReading} 
          locationDataFromFeed={latestReading && latestReading.latitude && latestReading.longitude ? {latitude: latestReading.latitude, longitude: latestReading.longitude} : null} 
          initialLocation={location} // This is the location resolved from Firebase or GPS
        />
      </section>

      <footer className="text-center py-8 text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} BreatheEasy Mobile. All rights reserved.</p>
        <p>Air quality data is for informational purposes only. Powered by Firebase.</p>
      </footer>
    </div>
  );
}
