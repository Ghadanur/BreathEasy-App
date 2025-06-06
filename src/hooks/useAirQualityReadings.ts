
"use client";

import { useState, useEffect } from 'react';
import type { AirQualityReading, RTDBRawReading } from '@/types';
import { database } from '@/lib/firebase';
import { 
  ref, 
  onValue, 
  query as rtdbQuery,
  orderByKey, 
  limitToLast 
} from 'firebase/database';

// Helper to parse the RTDB timestamp "YYYY-MM-DD HH-MM-SS" (time uses hyphens) to ISO string
function parseRTDBTimestampToISO(rtdbTimestamp: string): string {
  if (!rtdbTimestamp || typeof rtdbTimestamp !== 'string') {
    console.warn("Invalid RTDB timestamp received for parsing:", rtdbTimestamp);
    return new Date().toISOString(); // Fallback
  }
  const parts = rtdbTimestamp.split(' ');
  if (parts.length !== 2) {
    console.warn("RTDB timestamp has unexpected format (space missing):", rtdbTimestamp);
    return new Date().toISOString(); // Fallback
  }
  const datePart = parts[0]; 
  const timePartWithHyphens = parts[1];
  
  const timePartWithColons = timePartWithHyphens.replace(/-/g, ':');
  
  const parsableDateTimeString = `${datePart}T${timePartWithColons}`;
  
  const dateObj = new Date(parsableDateTimeString);
  if (isNaN(dateObj.getTime())) {
    console.warn("Failed to parse RTDB timestamp into valid date:", parsableDateTimeString, "Original:", rtdbTimestamp);
    return new Date().toISOString(); // Fallback
  }
  return dateObj.toISOString();
}

// Updated to return null for invalid data
function parseRTDBEntryToReading(id: string, data: RTDBRawReading): AirQualityReading | null {
  // Stricter validation for data structure and essential nested properties
  if (!data || typeof data !== 'object' || 
      !data.temp || typeof data.temp.value !== 'number' ||
      !data.humidity || typeof data.humidity.value !== 'number' ||
      !data.co2 || typeof data.co2.value !== 'number' ||
      !data.pm25 || typeof data.pm25.value !== 'number' ||
      !data.pm10 || typeof data.pm10.value !== 'number' ||
      !data.location || typeof data.location.lat !== 'number' || typeof data.location.lng !== 'number' ||
      !data.timestamp || typeof data.timestamp !== 'string') {
    console.warn("Invalid or incomplete RTDBRawReading structure for ID:", id, data);
    return null; // Return null for invalid entries
  }
  
  return {
    id: id,
    timestamp: parseRTDBTimestampToISO(data.timestamp),
    temperature: data.temp.value,
    humidity: data.humidity.value,
    co2: data.co2.value,
    pm2_5: data.pm25.value,
    pm10: data.pm10.value,
    latitude: data.location.lat,
    longitude: data.location.lng,
  };
}

export function useAirQualityReadings(count: number = 96) {
  const [readings, setReadings] = useState<AirQualityReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    const readingsPath = 'AirQuality'; 
    const readingsRef = ref(database, readingsPath);
    
    const dataQuery = rtdbQuery(
      readingsRef,
      orderByKey(), 
      limitToLast(count)
    );

    const unsubscribe = onValue(dataQuery, (snapshot) => {
      try {
        if (snapshot.exists()) {
          const rawData = snapshot.val();
          const parsedReadings = Object.entries(rawData)
            .map(([key, value]) => parseRTDBEntryToReading(key, value as RTDBRawReading))
            .filter((reading): reading is AirQualityReading => reading !== null); // Filter out null (invalid) entries
          
          // Sort by timestamp descending (most recent first)
          // RTDB limitToLast with orderByKey gives ascending order by key, so we reverse.
          parsedReadings.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          
          setReadings(parsedReadings);
        } else {
          setReadings([]); 
        }
        setError(null);
      } catch (err: any) {
        console.error("Error processing RTDB data:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setReadings([]);
      } finally {
        setLoading(false);
      }
    }, (rtdbError) => {
      console.error("RTDB onValue error:", rtdbError);
      setError(rtdbError as Error);
      setReadings([]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [count]);

  return { readings, loading, error };
}
