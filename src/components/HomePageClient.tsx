
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
import { useAirQualityReadings } from '@/hooks/useAirQualityReadings'; // For Firestore historical data
import { useCurrentRtdbReading } from '@/hooks/useCurrentRtdbReading'; // For RTDB current data
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
const humidityGaugeColor = "hsl(210, 70%, 50%)"; // Primary Blue: hsl(210, 70%, 50%)
const pm25GaugeColor = "hsl(270, 60%, 65%)"; // Purple: hsl(270, 60%, 65%)
const pm10GaugeColor = "hsl(240, 60%, 60%)"; // Indigo: hsl(240, 60%, 60%)


const getCo2ConfigValues = (co2Value: number): { iconClassName: string; strokeColor: string } => {
  if (co2Value > 2000) {
    return { iconClassName: "text-red-500", strokeColor: "hsl(0, 84.2%, 60.2%)" }; // Destructive Red
  } else if (co2Value > 1000) {
    return { iconClassName: "text-yellow-500", strokeColor: "hsl(45, 100%, 55%)" }; // Yellow
  }
  return { iconClassName: "text-green-500", strokeColor: "hsl(120, 70%, 45%)" }; // Green
};

const getCO2StatusText = (value: number): string => {
  if (value > 5000) return "Hazardous";
  if (value > 2000 && value <= 5000) return "Unhealthy";
  if (value > 1000 && value <= 2000) return "Poor air quality";
  if (value > 450 && value <= 1000) return "Acceptable indoor";
  return "Fresh / Normal Outdoor"; // 0-450 ppm
};

const getPM25StatusText = (value: number): string => {
  if (value >= 250.5) return "Hazardous";
  if (value >= 150.5 && value < 250.5) return "Very Unhealthy";
  if (value >= 55.5 && value < 150.5) return "Unhealthy";
  if (value >= 35.5 && value < 55.5) return "Unhealthy for Sensitive Groups";
  if (value >= 12.1 && value < 35.5) return "Moderate";
  return "Good"; // 0-12.0
};

const getPM10StatusText = (value: number): string => {
  if (value >= 425) return "Hazardous";
  if (value >= 355 && value < 425) return "Very Unhealthy";
  if (value >= 255 && value < 355) return "Unhealthy";
  if (value >= 155 && value < 255) return "Unhealthy for Sensitive Groups";
  if (value >= 55 && value < 155) return "Moderate";
  return "Good"; // 0-54
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
    iconClassName: "", 
    description: "CO2 Concentration",
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

const chartColorMapping: Record<keyof typeof DIAL_CONFIGS, string | ((value: number) => string)> = {
  temperature: tempGaugeColor,
  humidity: humidityGaugeColor,
  co2: (value: number) => getCo2ConfigValues(value).strokeColor,
  pm2_5: pm25GaugeColor,
  pm10: pm10GaugeColor,
};


export function HomePageClient() {
  const { readings: historicalData, loading: firestoreLoading, error: firestoreError } = useAirQualityReadings(96);
  const { currentReading: rtdbReading, loadingRtdb, errorRtdb } = useCurrentRtdbReading();

  const [location, setLocation] = useState<LocationData | null>(null);
  const [activeDialKey, setActiveDialKey] = useState<keyof typeof DIAL_CONFIGS>('temperature');

  const latestReading = rtdbReading ?? (historicalData && historicalData.length > 0 ? historicalData[0] : null);
  const overallLoading = firestoreLoading || loadingRtdb;


  useEffect(() => {
    if (latestReading?.latitude && latestReading?.longitude) {
      setLocation({
        latitude: latestReading.latitude,
        longitude: latestReading.longitude,
      });
    } else if (!overallLoading && latestReading) {
      setLocation(null);
    } else if (!overallLoading && !latestReading) {
        setLocation(null);
    }
  }, [latestReading, overallLoading]);


  if (overallLoading && !latestReading && historicalData.length === 0) {
    return (
      <div className="container mx-auto p-4 min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <LoadingSpinner text="Loading Air Quality Data..." size="lg" />
      </div>
    );
  }

  if (firestoreError || errorRtdb) {
    const errorToShow = firestoreError || errorRtdb;
    return (
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-2xl font-bold text-destructive mb-4">Error Loading Data</h1>
        <p className="text-muted-foreground">Could not load air quality data. Please check your connection and configuration.</p>
        {errorToShow && <p className="text-xs text-muted-foreground mt-2">Details: {errorToShow.message}</p>}
      </div>
    );
  }

  const currentMainDialConfig = DIAL_CONFIGS[activeDialKey];
  const currentValueForMainDial = latestReading && currentMainDialConfig ? latestReading[activeDialKey as keyof AirQualityReading] as number : 0;

  let currentStrokeColorForMainDial = typeof currentMainDialConfig?.baseStrokeColor === 'function'
    ? currentMainDialConfig.baseStrokeColor(currentValueForMainDial)
    : currentMainDialConfig?.baseStrokeColor || "hsl(var(--muted))";

  let currentIconClassNameForMainDial = currentMainDialConfig?.iconClassName;
  if (activeDialKey === 'co2' && currentMainDialConfig) {
    currentIconClassNameForMainDial = getCo2ConfigValues(currentValueForMainDial).iconClassName;
  }

  const activeChartConfig = DIAL_CONFIGS[activeDialKey];


  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight font-sans bg-gradient-to-r from-black to-primary bg-clip-text text-transparent [.high-contrast_&]:bg-none [.high-contrast_&]:text-foreground">
          Air Quality Dashboard
        </h1>
      </div>

      {latestReading && activeDialKey && currentMainDialConfig && activeChartConfig && (
         <section className="mb-6 md:mb-8 flex flex-col md:flex-row md:justify-around items-center md:items-start gap-6 md:gap-8">
          <div className="flex flex-col items-center w-full md:w-auto">
            <MainDialDisplay
              title={currentMainDialConfig.title}
              value={currentValueForMainDial}
              maxValue={currentMainDialConfig.maxValue}
              strokeColor={currentStrokeColorForMainDial}
              unit={currentMainDialConfig.unit}
              icon={currentMainDialConfig.icon}
              iconClassName={currentIconClassNameForMainDial}
            />
          </div>

          {(historicalData.length > 0) && (
            <div className="w-full md:flex-1 md:max-w-2xl lg:max-w-4xl mt-6 md:mt-0 flex flex-col gap-6 md:gap-8">
              <HistoricalDataChart
                  data={historicalData}
                  dataKey={activeDialKey as keyof AirQualityReading}
                  title={`${activeChartConfig.title} Trend`}
                  color={currentStrokeColorForMainDial}
                  unit={activeChartConfig.unit}
              />
            </div>
          )}
        </section>
      )}


      <section className="flex flex-wrap justify-center gap-4 md:gap-6">
        {latestReading ? (
          <>
            {Object.entries(DIAL_CONFIGS).map(([key, config]) => {
                const cardValue = latestReading[key as keyof AirQualityReading] as number ?? 0;
                let iconClass = config.iconClassName;
                let cardDescription = config.description;

                if (key === 'co2') {
                  const co2Vals = getCo2ConfigValues(cardValue);
                  iconClass = co2Vals.iconClassName;
                  cardDescription = `${config.description} - Level: ${getCO2StatusText(cardValue)}`;
                } else if (key === 'pm2_5') {
                  cardDescription = `${config.description} - Level: ${getPM25StatusText(cardValue)}`;
                } else if (key === 'pm10') {
                  cardDescription = `${config.description} - Level: ${getPM10StatusText(cardValue)}`;
                }

                return (
                  <div key={key} className="w-full max-w-xs sm:max-w-sm md:w-60">
                    <AirQualityCard
                      title={config.title}
                      value={cardValue}
                      unit={config.unit}
                      icon={config.icon}
                      iconClassName={iconClass}
                      description={cardDescription}
                      onClick={() => setActiveDialKey(key as keyof typeof DIAL_CONFIGS)}
                    />
                  </div>
                );
            })}
          </>
        ) : (
          !overallLoading && <p className="col-span-full text-center text-muted-foreground">No current air quality data available.</p>
        )}
      </section>

      <LocationMap location={location} isLoading={overallLoading} className="col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-5" />


      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Historical Trends</h2>
        {historicalData.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {Object.keys(DIAL_CONFIGS)
              .filter(key => key !== activeDialKey && DIAL_CONFIGS[key as keyof typeof DIAL_CONFIGS])
              .map(keyStr => {
                const key = keyStr as keyof typeof DIAL_CONFIGS;
                const config = DIAL_CONFIGS[key];
                if (!config) return null;

                let colorForChart: string;
                const colorMapEntry = chartColorMapping[key];
                const valueForColor = latestReading?.[key as keyof AirQualityReading] as number ?? 0;

                if (typeof colorMapEntry === 'function') {
                  colorForChart = colorMapEntry(valueForColor);
                } else {
                  colorForChart = colorMapEntry;
                }

                return (
                  <HistoricalDataChart
                    key={key}
                    data={historicalData}
                    dataKey={key as keyof AirQualityReading}
                    title={`${config.title} Trend`}
                    color={colorForChart}
                    unit={config.unit}
                  />
                );
            })}
          </div>
        ) : (
          !firestoreLoading && <p className="text-center text-muted-foreground">No historical data available.</p>
        )}
      </section>

      <section className="my-6 md:my-8 flex justify-center">
        <div className="w-full max-w-lg">
          <PersonalizedTips
            latestReading={latestReading}
            derivedLocation={location}
          />
        </div>
      </section>

      <footer className="text-center py-8 text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} BreatheEasy Mobile. All rights reserved.</p>
        <p>Air quality data provided by ESP32 sensor network via Firebase.</p>
      </footer>
    </div>
  );
}
