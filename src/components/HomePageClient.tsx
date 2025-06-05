
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { AirQualityReading, LocationData } from '@/types';
import { AirQualityCard } from '@/components/AirQualityCard';
import { MainDialDisplay } from '@/components/MainDialDisplay';
import { HistoricalDataChart } from '@/components/HistoricalDataChart';
import { PersonalizedTips } from '@/components/PersonalizedTips';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Thermometer, Droplets, MountainSnow, CloudFog, Cloudy, LucideIcon } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useAirQualityReadings } from '@/hooks/useAirQualityReadings';
import { cn } from '@/lib/utils';

const LocationMap = dynamic(() => import('@/components/LocationMap').then(mod => mod.default), {
  ssr: false,
  loading: () => <div className="col-span-1 sm:col-span-2 lg:col-span-2 xl:col-span-4 h-[230px] flex items-center justify-center rounded-lg border bg-card shadow-sm p-6"><LoadingSpinner text="Loading location..." /></div>,
});

interface DialConfig {
  key: keyof Pick<AirQualityReading, 'temperature' | 'humidity' | 'co2' | 'pm2_5' | 'pm10'>;
  title: string;
  maxValue: number;
  baseStrokeColor: string | ((value: number) => string);
  unit?: string;
  icon: LucideIcon;
  iconClassName: string;
  description: string;
}

const tempGaugeColor = "hsl(30, 90%, 60%)"; // Orange
const humidityGaugeColor = "hsl(var(--primary))"; // Blue
const pm25GaugeColor = "hsl(var(--chart-4))"; // Purple
const pm10GaugeColor = "hsl(var(--chart-3))"; // Indigo

const getCo2ConfigValues = (co2Value: number): { iconClassName: string; strokeColor: string } => {
  if (co2Value > 2000) {
    return { iconClassName: "text-red-500", strokeColor: "hsl(var(--destructive))" };
  } else if (co2Value > 1000) {
    return { iconClassName: "text-yellow-500", strokeColor: "hsl(45, 100%, 55%)" };
  }
  return { iconClassName: "text-green-500", strokeColor: "hsl(120, 70%, 45%)" };
};

const DIAL_CONFIGS: Record<string, Omit<DialConfig, 'key'>> = {
  temperature: {
    title: "Temperature",
    maxValue: 50,
    baseStrokeColor: tempGaugeColor,
    unit: "°C",
    icon: Thermometer,
    iconClassName: "text-orange-500",
    description: "Ambient temperature",
  },
  humidity: {
    title: "Humidity",
    maxValue: 100,
    baseStrokeColor: humidityGaugeColor,
    unit: "%",
    icon: Droplets,
    iconClassName: "text-blue-500",
    description: "Relative humidity",
  },
  co2: {
    title: "CO₂",
    maxValue: 3000,
    baseStrokeColor: (value: number) => getCo2ConfigValues(value).strokeColor,
    unit: "ppm",
    icon: MountainSnow,
    iconClassName: "", // Will be set dynamically
    description: "Carbon Dioxide Level (MQ135)",
  },
  pm2_5: {
    title: "PM2.5",
    maxValue: 100,
    baseStrokeColor: pm25GaugeColor,
    unit: "μg/m³",
    icon: CloudFog,
    iconClassName: "text-indigo-500",
    description: "Fine Particulate Matter (<2.5μm)",
  },
  pm10: {
    title: "PM10",
    maxValue: 200,
    baseStrokeColor: pm10GaugeColor,
    unit: "μg/m³",
    icon: Cloudy,
    iconClassName: "text-slate-500",
    description: "Coarse Particulate Matter (<10μm)",
  },
};


export function HomePageClient() {
  const { readings: historicalData, loading: airQualityLoading, error: airQualityError } = useAirQualityReadings(96);
  const latestReading = historicalData && historicalData.length > 0 ? historicalData[0] : null;

  const [location, setLocation] = useState<LocationData | null>(null);
  const [activeDialKey, setActiveDialKey] = useState<keyof typeof DIAL_CONFIGS>('temperature');

  useEffect(() => {
    if (latestReading?.latitude && latestReading?.longitude) {
      setLocation({
        latitude: latestReading.latitude,
        longitude: latestReading.longitude,
      });
    } else if (!airQualityLoading && latestReading) {
      setLocation(null); // Explicitly set to null if no coordinates
    } else if (!airQualityLoading && !latestReading) {
        setLocation(null); // Also set to null if no readings at all
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
  
  const currentMainDialConfig = DIAL_CONFIGS[activeDialKey];
  const currentValueForMainDial = latestReading && currentMainDialConfig ? latestReading[activeDialKey as keyof AirQualityReading] as number : 0;
  
  let currentStrokeColorForMainDial = typeof currentMainDialConfig?.baseStrokeColor === 'function'
    ? currentMainDialConfig.baseStrokeColor(currentValueForMainDial)
    : currentMainDialConfig?.baseStrokeColor || "hsl(var(--muted))";

  let currentIconClassNameForMainDial = currentMainDialConfig?.iconClassName;
  if (activeDialKey === 'co2') {
    currentIconClassNameForMainDial = getCo2ConfigValues(currentValueForMainDial).iconClassName;
  }

  const activeExpandedCardConfig = DIAL_CONFIGS[activeDialKey];
  const activeExpandedCardValue = latestReading && activeExpandedCardConfig ? latestReading[activeDialKey as keyof AirQualityReading] as number : 0;
  let activeExpandedCardIconClassName = activeExpandedCardConfig?.iconClassName;
  if (activeDialKey === 'co2') {
    activeExpandedCardIconClassName = getCo2ConfigValues(activeExpandedCardValue).iconClassName;
  }


  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-black to-primary bg-clip-text text-transparent font-sans">
          Air Quality Dashboard
        </h1>
      </div>

      {/* Main Circular Dial Display */}
      {latestReading && currentMainDialConfig && (
        <section className="mb-6 md:mb-8 flex justify-center">
          <MainDialDisplay
            title={currentMainDialConfig.title}
            value={currentValueForMainDial}
            maxValue={currentMainDialConfig.maxValue}
            strokeColor={currentStrokeColorForMainDial}
            unit={currentMainDialConfig.unit}
            icon={currentMainDialConfig.icon}
            iconClassName={currentIconClassNameForMainDial}
          />
        </section>
      )}

      {/* Expanded Rectangular Card for the Active Metric */}
      {latestReading && activeDialKey && activeExpandedCardConfig && (
         <section className="mb-6 md:mb-8 flex justify-center">
          <div className="w-full max-w-xs sm:max-w-sm md:w-64"> {/* Constrain width */}
            <AirQualityCard
              title={activeExpandedCardConfig.title}
              value={activeExpandedCardValue}
              unit={activeExpandedCardConfig.unit}
              icon={activeExpandedCardConfig.icon}
              iconClassName={activeExpandedCardIconClassName}
              description={activeExpandedCardConfig.description}
              // No onClick needed to change activeDialKey as it's already active
              // No specific "active" styling (like a ring) needed here as its presence implies it's active
            />
          </div>
        </section>
      )}

      {/* Grid of Other Selectable Cards */}
      <section className="flex flex-wrap justify-center gap-4 md:gap-6">
        {latestReading ? (
          <>
            {Object.entries(DIAL_CONFIGS)
              .filter(([key]) => key !== activeDialKey) // Filter out the card that is currently "expanded"
              .map(([key, config]) => {
                const cardValue = latestReading[key as keyof AirQualityReading] as number;
                let iconClass = config.iconClassName;
                
                if (key === 'co2') {
                  const co2Vals = getCo2ConfigValues(cardValue);
                  iconClass = co2Vals.iconClassName;
                }

                return (
                  <div key={key} className="w-full max-w-xs sm:max-w-sm md:w-60"> {/* Wrapper for consistent width */}
                    <AirQualityCard
                      title={config.title}
                      value={cardValue}
                      unit={config.unit}
                      icon={config.icon}
                      iconClassName={iconClass}
                      description={config.description}
                      onClick={() => setActiveDialKey(key as keyof typeof DIAL_CONFIGS)}
                      // No active ring styling needed here as the active card is shown separately
                    />
                  </div>
                );
            })}
          </>
        ) : (
          !airQualityLoading && <p className="col-span-full text-center text-muted-foreground">No current air quality data available.</p>
        )}
      </section>
      
      <LocationMap location={location} isLoading={airQualityLoading} className="col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-5" />


      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Historical Trends</h2>
        {historicalData.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <HistoricalDataChart data={historicalData} dataKey="temperature" title="Temperature Trend (°C)" color="hsl(var(--chart-1))" unit="°C" />
            <HistoricalDataChart data={historicalData} dataKey="co2" title="CO₂ Trend (ppm)" color={getCo2ConfigValues(latestReading?.co2 ?? 0).strokeColor} unit="ppm" />
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

    