
"use client";

import { useState, useEffect } from 'react';
import type { AirQualityReading, FirebaseRawReading, FirebaseSensorMetric, FirebaseLocation } from '@/types';
import { database } from '@/lib/firebase';
import { ref, onValue, query, orderByChild, limitToLast, Query } from 'firebase/database';
import { parse, formatISO } from 'date-fns';

// Helper to parse Firebase timestamp to ISO string
// Firebase timestamp: "YYYY-MM-DD HH-MM-SS"
// Required ISO format: "YYYY-MM-DDTHH:MM:SS.sssZ"
function parseFirebaseTimestampToISO(timestampStr: string): string {
  if (!timestampStr || typeof timestampStr !== 'string') {
    return new Date().toISOString();
  }
  // The ESP32 code provides timestamp in "YYYY-MM-DD HH:MM:SS" format.
  // No correction for hyphens in time needed for the field value.
  try {
    const dateObj = parse(timestampStr, 'yyyy-MM-dd HH:mm:ss', new Date());
    if (isNaN(dateObj.getTime())) {
        console.warn("Failed to parse timestamp, using current time:", timestampStr);
        return new Date().toISOString();
    }
    return formatISO(dateObj);
  } catch (e) {
    console.error("Error parsing timestamp:", timestampStr, e);
    return new Date().toISOString(); // Fallback to current time
  }
}


function parseRawReading(id: string, raw: FirebaseRawReading): AirQualityReading {
  const safeParseFloat = (value: any): number => {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  };
  const safeParseInt = (value: any): number => {
    const num = parseInt(value, 10);
    return isNaN(num) ? 0 : num;
  };

  return {
    id: id,
    timestamp: parseFirebaseTimestampToISO(raw.timestamp),
    temperature: raw.temp ? safeParseFloat(raw.temp.value) : 0,
    humidity: raw.humidity ? safeParseFloat(raw.humidity.value) : 0,
    co2: raw.co2 ? safeParseInt(raw.co2.value) : 0,
    pm2_5: raw.pm25 ? safeParseFloat(raw.pm25.value) : 0,
    pm10: raw.pm10 ? safeParseFloat(raw.pm10.value) : 0,
    latitude: raw.location?.lat ? safeParseFloat(raw.location.lat) : undefined,
    longitude: raw.location?.lng ? safeParseFloat(raw.location.lng) : undefined,
  };
}

export function useAirQualityReadings(limit: number = 96) {
  const [readings, setReadings] = useState<AirQualityReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    const readingsNodePath = 'AirQuality'; 
    const readingsRef = ref(database, readingsNodePath);
    const readingsQuery: Query = query(readingsRef, orderByChild('timestamp'), limitToLast(limit));

    const unsubscribe = onValue(readingsQuery, (snapshot) => {
      try {
        const data = snapshot.val();
        if (data && typeof data === 'object') {
          const readingsArray = Object.entries(data)
            .map(([id, readingData]) => {
              return parseRawReading(id, readingData as FirebaseRawReading);
            })
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()); 
          setReadings(readingsArray);
        } else {
          setReadings([]);
        }
        setError(null);
      } catch (err: any) {
        console.error("Error processing Firebase data:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setReadings([]);
      } finally {
        setLoading(false);
      }
    }, (error) => {
      console.error("Firebase onValue error:", error);
      setError(error);
      setReadings([]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [limit]);

  return { readings, loading, error };
}
