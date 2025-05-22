
import { useState, useEffect } from 'react';
import { database } from '@/lib/firebase';
import { ref, onValue, query, orderByKey, limitToLast } from 'firebase/database';
import type { AirQualityReading, FirebaseRawReading } from '@/types';
import { parse, formatISO } from 'date-fns';

// Helper function to parse Firebase timestamp string ("YYYY-MM-DD HH-MM-SS") to ISO string
function parseFirebaseTimestampToISO(timestampStr: string): string {
  try {
    // timestampStr from Firebase is "YYYY-MM-DD HH-MM-SS" (time part has hyphens)
    // We need to convert "HH-MM-SS" to "HH:MM:SS" for date-fns parsing.
    const parts = timestampStr.split(' ');
    if (parts.length === 2) {
      const datePart = parts[0]; // "YYYY-MM-DD"
      const timePartWithHyphens = parts[1]; // "HH-MM-SS"
      const timePartWithColons = timePartWithHyphens.replace(/-/g, ':'); // "HH:MM:SS"
      const standardizedTimestampStr = `${datePart} ${timePartWithColons}`;
      const dateObj = parse(standardizedTimestampStr, 'yyyy-MM-dd HH:mm:ss', new Date());
      return formatISO(dateObj);
    }
    // Fallback for unexpected format
    console.warn("Unexpected Firebase timestamp format in hook:", timestampStr);
    return formatISO(new Date());
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
    const readingsNodePath = 'AirQuality';
    const readingsQuery = query(ref(database, readingsNodePath), orderByKey(), limitToLast(limit));

    const unsubscribe = onValue(readingsQuery, (snapshot) => {
      try {
        const data = snapshot.val();
        if (data) {
          const parsedReadings = Object.entries(data).map(([key, rawValue]) => {
            const rawReading = rawValue as FirebaseRawReading;
            try {
              // Robust numeric parsing
              const tempValue = rawReading.temp?.value;
              const humValue = rawReading.humidity?.value;
              const co2Value = rawReading.co2?.value;
              const pm25Value = rawReading.pm25?.value;
              const pm10Value = rawReading.pm10?.value;
              const latValue = rawReading.location?.lat;
              const lonValue = rawReading.location?.lng;

              const reading: AirQualityReading = {
                id: key, 
                timestamp: rawReading.timestamp ? parseFirebaseTimestampToISO(rawReading.timestamp) : formatISO(new Date()),
                temperature: (typeof tempValue === 'number' && !isNaN(tempValue)) ? tempValue : 0,
                humidity: (typeof humValue === 'number' && !isNaN(humValue)) ? humValue : 0,
                co2: (typeof co2Value === 'number' && !isNaN(co2Value)) ? co2Value : 0,
                pm2_5: (typeof pm25Value === 'number' && !isNaN(pm25Value)) ? pm25Value : 0,
                pm10: (typeof pm10Value === 'number' && !isNaN(pm10Value)) ? pm10Value : 0,
                latitude: (typeof latValue === 'number' && !isNaN(latValue)) ? latValue : undefined,
                longitude: (typeof lonValue === 'number' && !isNaN(lonValue)) ? lonValue : undefined,
              };
              return reading;
            } catch (parseError) {
              console.error("Error parsing individual Firebase reading in hook:", parseError, rawValue);
              return null;
            }
          }).filter(Boolean) as AirQualityReading[];
          
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

    return () => unsubscribe();
  }, [limit]);

  return { readings, loading, error };
}
