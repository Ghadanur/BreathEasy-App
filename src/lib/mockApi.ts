import type { AirQualityReading } from '@/types';
import { subDays, formatISO } from 'date-fns';

// Mock function to simulate fetching latest air quality data
export async function fetchLatestAirQuality(): Promise<AirQualityReading> {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        id: 'latest',
        timestamp: formatISO(new Date()),
        temperature: 22 + Math.random() * 5, // Random temp between 22-27°C
        humidity: 40 + Math.random() * 20,   // Random humidity between 40-60%
        aqi: 20 + Math.random() * 80,        // Random AQI between 20-100
        pm1: 5 + Math.random() * 10,         // Random PM1.0
        pm2_5: 10 + Math.random() * 15,      // Random PM2.5
        pm10: 15 + Math.random() * 20,       // Random PM10
      });
    }, 500); // Simulate network delay
  });
}

// Mock function to simulate fetching historical air quality data
export async function fetchHistoricalAirQuality(days: number = 7): Promise<AirQualityReading[]> {
  return new Promise(resolve => {
    setTimeout(() => {
      const data: AirQualityReading[] = [];
      const today = new Date();
      for (let i = 0; i < days; i++) {
        const date = subDays(today, i);
        data.push({
          id: `hist-${i}`,
          timestamp: formatISO(date),
          temperature: 20 + Math.random() * 10,
          humidity: 35 + Math.random() * 25,
          aqi: 15 + Math.random() * 100,
          pm1: 3 + Math.random() * 12,
          pm2_5: 8 + Math.random() * 20,
          pm10: 12 + Math.random() * 25,
        });
      }
      resolve(data.reverse()); // Oldest first
    }, 800); // Simulate network delay
  });
}
