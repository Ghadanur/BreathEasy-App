
"use client";

import { useState, useEffect } from 'react';
import type { AirQualityReading, LocationData } from '@/types';
import { AirQualityCard } from '@/components/AirQualityCard';
import { HistoricalDataChart } from '@/components/HistoricalDataChart';
import { PersonalizedTips } from '@/components/PersonalizedTips';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Thermometer, Droplets, MountainSnow, CloudFog, Cloudy } from 'lucide-react'; // Wind removed as it's not used for a card
import dynamic from 'next/dynamic';
import { useAirQualityReadings } from '@/hooks/useAirQualityReadings';

const LocationMap = dynamic(() => import('@/components/LocationMap').then(mod => mod.default), {
  ssr: false,
  loading: () => <div className="col-span-1 sm:col-span-2 lg:col-span-2 xl:col-span-4 h-[230px] flex items-center justify-center rounded-lg border bg-card shadow-sm p-6"><LoadingSpinner text="Loading location..." /></div>,
});


export function HomePageClient() {
  const { readings: historicalData, loading: airQualityLoading, error: airQualityError } = useAirQualityReadings(96);
  const latestReading = historicalData && historicalData.length > 0 ? historicalData[0] : null;

  const [location, setLocation] = useState<LocationData | null>(null);

  useEffect(() => {
    if (latestReading?.latitude && latestReading?.longitude) {
      setLocation({
        latitude: latestReading.latitude,
        longitude: latestReading.longitude,
      });
    } else if (!airQualityLoading && latestReading) {
      setLocation(null);
    } else if (!airQualityLoading && !latestReading) {
      setLocation(null);
    }
  }, [latestReading, airQualityLoading]);


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

  // Gauge configurations
  let co2IconClassName = "text-green-500";
  let co2GaugeStrokeColor = "hsl(120, 70%, 45%)"; // Green

  if (latestReading && latestReading.co2 > 2000) {
    co2IconClassName = "text-red-500";
    co2GaugeStrokeColor = "hsl(var(--destructive))"; // Red
  } else if (latestReading && latestReading.co2 > 1000) {
    co2IconClassName = "text-yellow-500";
    co2GaugeStrokeColor = "hsl(45, 100%, 55%)"; // Yellow
  }
  
  const tempGaugeColor = "hsl(30, 90%, 60%)"; // Orange
  const humidityGaugeColor = "hsl(var(--primary))"; // Blue
  const pm25GaugeColor = "hsl(var(--chart-4))"; // Purple
  const pm10GaugeColor = "hsl(var(--chart-3))"; // Indigo

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
              value={latestReading.temperature}
              unit="°C"
              icon={Thermometer}
              iconClassName="text-orange-500"
              gaugeData={{ value: latestReading.temperature, maxValue: 50, strokeColor: tempGaugeColor }}
              description="Ambient temperature"
            />
            <AirQualityCard
              title="Humidity"
              value={latestReading.humidity}
              unit="%"
              icon={Droplets}
              iconClassName="text-blue-500"
              gaugeData={{ value: latestReading.humidity, maxValue: 100, strokeColor: humidityGaugeColor }}
              description="Relative humidity"
            />
            <AirQualityCard
              title="CO₂"
              value={latestReading.co2}
              unit="ppm"
              icon={MountainSnow}
              iconClassName={co2IconClassName}
              gaugeData={{ value: latestReading.co2, maxValue: 3000, strokeColor: co2GaugeStrokeColor }}
              description="Carbon Dioxide Level (MQ135)"
            />
             <AirQualityCard
              title="PM2.5"
              value={latestReading.pm2_5}
              unit="μg/m³"
              icon={CloudFog}
              iconClassName="text-indigo-500"
              gaugeData={{ value: latestReading.pm2_5, maxValue: 100, strokeColor: pm25GaugeColor }}
              description="Fine Particulate Matter (<2.5μm)"
            />
            <AirQualityCard
              title="PM10"
              value={latestReading.pm10} // Keep this for text display
              unit="μg/m³"
              icon={Cloudy}
              iconClassName="text-slate-500"
              gaugeData={{ value: latestReading.pm10, maxValue: 200, strokeColor: pm10GaugeColor }}
              description="Coarse Particulate Matter (<10μm)"
            />
            <LocationMap location={location} isLoading={airQualityLoading} className="col-span-1 sm:col-span-2 lg:col-span-2 xl:col-span-4" />
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
            <HistoricalDataChart data={historicalData} dataKey="co2" title="CO₂ Trend (ppm)" color={co2GaugeStrokeColor} unit="ppm" />
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
