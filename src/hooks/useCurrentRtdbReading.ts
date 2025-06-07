
"use client";

import { useState, useEffect } from 'react';
import type { AirQualityReading, RTDBCurrentValues, DateTimeString } from '@/types';
import { database } from '@/lib/firebase';
import { ref, onValue, off } from 'firebase/database';

// Helper to parse "YYYY-MM-DD HH:MM:SS" to ISO string
function parseDateTimeStringToISO(dateTimeString: DateTimeString | undefined): string | null {
  if (!dateTimeString || typeof dateTimeString !== 'string') {
    console.warn("Invalid or missing DateTimeString for parsing:", dateTimeString);
    return null;
  }
  const parsableDateTimeString = dateTimeString.replace(" ", "T");
  const dateObj = new Date(parsableDateTimeString);

  if (isNaN(dateObj.getTime())) {
    console.warn("Failed to parse DateTimeString into valid date:", parsableDateTimeString, "Original:", dateTimeString);
    return null;
  }
  return dateObj.toISOString();
}

function parseRTDBCurrentToReading(data: RTDBCurrentValues | null): AirQualityReading | null {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const { temp, humidity, co2, pm25, pm10, location, lastUpdated } = data;

  // Basic validation
  if (
    typeof temp !== 'number' ||
    typeof humidity !== 'number' ||
    typeof co2 !== 'number' ||
    typeof pm25 !== 'number' ||
    typeof pm10 !== 'number' ||
    typeof lastUpdated !== 'string'
  ) {
    console.warn("Invalid or incomplete RTDBCurrentValues structure:", data);
    return null;
  }

  const isoTimestamp = parseDateTimeStringToISO(lastUpdated);
  if (!isoTimestamp) {
    console.warn("Failed to parse lastUpdated timestamp from RTDB data:", data);
    return null;
  }

  return {
    id: "rtdb-current",
    timestamp: isoTimestamp,
    temperature: temp,
    humidity: humidity,
    co2: co2,
    pm2_5: pm25,
    pm10: pm10,
    latitude: location?.lat,
    longitude: location?.lng,
  };
}

export function useCurrentRtdbReading() {
  const [currentReading, setCurrentReading] = useState<AirQualityReading | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    const rtdbRef = ref(database, '/CurrentValues');

    const listener = onValue(rtdbRef, (snapshot) => {
      try {
        const data = snapshot.val() as RTDBCurrentValues | null;
        const parsedReading = parseRTDBCurrentToReading(data);
        setCurrentReading(parsedReading);
        setError(null);
      } catch (err: any) {
        console.error("Error processing RTDB /CurrentValues snapshot:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setCurrentReading(null);
      } finally {
        setLoading(false);
      }
    }, (rtdbError) => {
      console.error("RTDB onValue error for /CurrentValues:", rtdbError);
      setError(rtdbError);
      setCurrentReading(null);
      setLoading(false);
    });

    // Cleanup listener on component unmount
    return () => {
      off(rtdbRef, 'value', listener);
    };
  }, []);

  return { currentReading, loadingRtdb: loading, errorRtdb: error };
}
