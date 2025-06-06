
"use client";

import { useState, useEffect } from 'react';
import type { AirQualityReading, RTDBRawReading } from '@/types';
import { database } from '@/lib/firebase'; // Import RTDB instance
import { 
  ref, 
  onValue, 
  query as rtdbQuery, // Renamed to avoid conflict
  orderByKey, 
  limitToLast 
} from 'firebase/database';

// Helper to parse the RTDB timestamp "YYYY-MM-DD HH-MM-SS" (time uses hyphens) to ISO string
function parseRTDBTimestampToISO(rtdbTimestamp: string): string {
  if (!rtdbTimestamp || typeof rtdbTimestamp !== 'string') {
    console.warn("Invalid RTDB timestamp received:", rtdbTimestamp);
    return new Date().toISOString(); // Fallback
  }
  // Example: "2024-03-15 10-30-00"
  const parts = rtdbTimestamp.split(' ');
  if (parts.length !== 2) {
    console.warn("RTDB timestamp has unexpected format (space missing):", rtdbTimestamp);
    return new Date().toISOString(); // Fallback
  }
  const datePart = parts[0]; // "YYYY-MM-DD"
  const timePartWithHyphens = parts[1]; // "HH-MM-SS"
  
  // Replace hyphens in time part with colons: "HH:MM:SS"
  const timePartWithColons = timePartWithHyphens.replace(/-/g, ':');
  
  const parsableDateTimeString = `${datePart}T${timePartWithColons}`;
  
  const dateObj = new Date(parsableDateTimeString);
  if (isNaN(dateObj.getTime())) {
    console.warn("Failed to parse RTDB timestamp into valid date:", parsableDateTimeString, "Original:", rtdbTimestamp);
    return new Date().toISOString(); // Fallback
  }
  return dateObj.toISOString();
}

function parseRTDBEntryToReading(id: string, data: RTDBRawReading): AirQualityReading {
  // Basic validation for data structure
  if (!data || typeof data !== 'object' || !data.temp || !data.humidity || !data.co2 || !data.pm25 || !data.pm10 || !data.location || !data.timestamp) {
    console.error("Invalid or incomplete RTDBRawReading structure for ID:", id, data);
    // Return a placeholder or throw an error, depending on desired handling
    // For now, returning a somewhat valid structure with zeros to avoid app crash
    return {
      id: id,
      timestamp: new Date().toISOString(),
      temperature: 0,
      humidity: 0,
      co2: 0,
      pm2_5: 0,
      pm10: 0,
      latitude: undefined,
      longitude: undefined,
    };
  }
  
  return {
    id: id,
    timestamp: parseRTDBTimestampToISO(data.timestamp),
    temperature: data.temp?.value ?? 0,
    humidity: data.humidity?.value ?? 0,
    co2: data.co2?.value ?? 0,
    pm2_5: data.pm25?.value ?? 0,
    pm10: data.pm10?.value ?? 0,
    latitude: data.location?.lat ?? undefined,
    longitude: data.location?.lng ?? undefined,
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
      orderByKey(), // Assumes keys are sortable chronologically e.g., "readingsYYYY-MM-DD_HH-MM-SS"
      limitToLast(count)
    );

    const unsubscribe = onValue(dataQuery, (snapshot) => {
      try {
        if (snapshot.exists()) {
          const rawData = snapshot.val(); // This is an object { key1: value1, key2: value2 }
          const readingsArray = Object.entries(rawData)
            .map(([key, value]) => parseRTDBEntryToReading(key, value as RTDBRawReading))
            // Sort by timestamp descending (most recent first)
            // RTDB limitToLast with orderByKey gives ascending order by key, so we reverse.
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          
          setReadings(readingsArray);
        } else {
          setReadings([]); // No data found
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
