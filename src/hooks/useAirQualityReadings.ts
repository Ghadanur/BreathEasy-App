
import { useState, useEffect } from 'react';
import { database } from '@/lib/firebase';
import { ref, onValue, query, orderByKey, limitToLast } from 'firebase/database';
import type { AirQualityReading, FirebaseRawReading } from '@/types';
import { parse, formatISO } from 'date-fns';

// Helper function to parse Firebase timestamp string ("YYYY-MM-DD HH:MM:SS") to ISO string
function parseFirebaseTimestampToISO(timestampStr: string): string {
  try {
    // Assuming timestampStr is "YYYY-MM-DD HH:MM:SS" (potentially with hyphens in time part from ESP code)
    // Standardize the time part to use colons if it has hyphens
    const standardizedTimestampStr = timestampStr.replace(/(\d{2})-(\d{2})-(\d{2})$/, '$1:$2:$3');
    const dateObj = parse(standardizedTimestampStr, 'yyyy-MM-dd HH:mm:ss', new Date());
    return formatISO(dateObj);
  } catch (error) {
    console.error("Error parsing Firebase timestamp in hook:", timestampStr, error);
    // Fallback to current time if parsing fails
    return formatISO(new Date()); 
  }
}

export function useAirQualityReadings(limit: number = 96) {
  const [readings, setReadings] = useState<AirQualityReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const readingsNodePath = 'AirQuality/readings';
    const readingsQuery = query(ref(database, readingsNodePath), orderByKey(), limitToLast(limit));

    const unsubscribe = onValue(readingsQuery, (snapshot) => {
      try {
        const data = snapshot.val();
        if (data) {
          const parsedReadings = Object.entries(data).map(([key, rawValue]) => {
            const rawReading = rawValue as FirebaseRawReading;
            try {
              const reading: AirQualityReading = {
                id: key, // Firebase key e.g., "2024-07-23_10-15-00"
                timestamp: rawReading.timestamp ? parseFirebaseTimestampToISO(rawReading.timestamp) : formatISO(new Date()),
                temperature: rawReading.temp?.value ?? 0,
                humidity: rawReading.humidity?.value ?? 0,
                co2: rawReading.co2?.value ?? 0,
                pm2_5: rawReading.pm25?.value ?? 0,
                pm10: rawReading.pm10?.value ?? 0,
                latitude: rawReading.location?.lat ?? undefined,
                longitude: rawReading.location?.lng ?? undefined,
              };
              return reading;
            } catch (parseError) {
              console.error("Error parsing individual Firebase reading in hook:", parseError, rawValue);
              return null;
            }
          }).filter(Boolean) as AirQualityReading[];
          
          // limitToLast with orderByKey returns data sorted ascending by key.
          // This means readings are oldest to newest, which is good for charts.
          setReadings(parsedReadings);
        } else {
          setReadings([]);
        }
        setLoading(false);
      } catch (err: any) {
        console.error("Error processing Firebase data in hook:", err);
        setError(err);
        setLoading(false);
      }
    }, (firebaseError: Error) => {
      console.error("Firebase onValue error in hook:", firebaseError);
      setError(firebaseError);
      setLoading(false);
    });

    return () => unsubscribe(); // Cleanup subscription on component unmount
  }, [limit]); // Re-subscribe if the limit changes

  return { readings, loading, error };
}
