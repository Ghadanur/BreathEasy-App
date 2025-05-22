
"use client";

import { useState, useEffect } from 'react';
import type { AirQualityReading, FirebaseRawReading } from '@/types';
import { database } from '@/lib/firebase'; // Corrected import path
import { ref, onValue, query, orderByChild, limitToLast, Query } from 'firebase/database'; // Corrected orderByChild
import { parse, formatISO } from 'date-fns';

// Helper to parse Firebase timestamp to ISO string
// Firebase timestamp: "YYYY-MM-DD HH-MM-SS"
// Required ISO format: "YYYY-MM-DDTHH:MM:SS.sssZ"
function parseFirebaseTimestampToISO(timestampStr: string): string {
  if (!timestampStr || typeof timestampStr !== 'string') {
    // Return current time as ISO string if timestamp is invalid or missing
    return new Date().toISOString();
  }
  // Replace the last hyphen with a colon for time part if needed
  const correctedTimestampStr = timestampStr.replace(/ (\d{2})-(\d{2})-(\d{2})$/, ' $1:$2:$3');
  try {
    const dateObj = parse(correctedTimestampStr, 'yyyy-MM-dd HH:mm:ss', new Date());
    if (isNaN(dateObj.getTime())) {
        // Fallback if parsing fails, e.g. if timestamp format is unexpected
        return new Date().toISOString();
    }
    return formatISO(dateObj);
  } catch (e) {
    console.error("Error parsing timestamp:", timestampStr, e);
    return new Date().toISOString(); // Fallback to current time
  }
}


function parseRawReading(id: string, raw: FirebaseRawReading): AirQualityReading {
  // Helper to safely parse numbers, defaulting to 0 if not a valid number
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
    temperature: safeParseFloat(raw.temp?.value),
    humidity: safeParseFloat(raw.humidity?.value),
    co2: safeParseInt(raw.co2?.value),
    pm2_5: safeParseFloat(raw.pm25?.value),
    pm10: safeParseFloat(raw.pm10?.value),
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
    // Path to the parent node containing all 'readingsYYYY-MM-DD_HH-MM-SS' nodes
    const readingsNodePath = 'AirQuality'; 
    const readingsRef = ref(database, readingsNodePath);

    // Query to get the last 'limit' (e.g., 96) readings, ordered by their keys (which are timestamp-based)
    const readingsQuery: Query = query(readingsRef, orderByChild('timestamp'), limitToLast(limit));


    const unsubscribe = onValue(readingsQuery, (snapshot) => {
      try {
        const data = snapshot.val();
        if (data && typeof data === 'object') {
          // Firebase returns an object where keys are the unique IDs (e.g., readingsYYYY-MM-DD_HH-MM-SS)
          const readingsArray = Object.entries(data)
            .map(([id, readingData]) => {
              // Ensure readingData is treated as FirebaseRawReading
              return parseRawReading(id, readingData as FirebaseRawReading);
            })
            // Sort by timestamp descending (most recent first) as orderByChild('timestamp') is ascending
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
