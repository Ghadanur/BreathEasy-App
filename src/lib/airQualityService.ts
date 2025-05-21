
import type { AirQualityReading, LocationData, FirebaseRawReading } from '@/types';
import { database } from './firebase'; // Firebase setup
import { ref, query, orderByChild, limitToLast, get, orderByKey } from 'firebase/database';
import { parse, formatISO } from 'date-fns';

const READINGS_PATH = '/AirQuality'; // Base path in your RTDB, actual readings under e.g. /AirQuality/readings...

export interface FetchLatestAirQualityResult {
  reading: AirQualityReading | null;
  channelLocation: LocationData | null; // For consistency, though it comes from the reading itself now
}

function parseFirebaseTimestamp(timestampStr: string): string {
  // Firebase timestamp is "YYYY-MM-DD HH:MM:SS"
  // Need to convert to a format that Date constructor or date-fns parse can handle reliably
  // 'yyyy-MM-dd HH:mm:ss' is a common format date-fns parse can handle
  try {
    const dateObj = parse(timestampStr, 'yyyy-MM-dd HH:mm:ss', new Date());
    return formatISO(dateObj);
  } catch (error) {
    console.error("Error parsing Firebase timestamp:", timestampStr, error);
    return formatISO(new Date()); // Fallback to now
  }
}

function parseFirebaseReading(key: string, data: FirebaseRawReading): AirQualityReading | null {
  if (!data || typeof data !== 'object') {
    console.warn(`Invalid data for key ${key}:`, data);
    return null;
  }
  try {
    const reading: AirQualityReading = {
      id: key.replace('readings',''), // Clean up the key if it includes "readings" prefix
      timestamp: data.timestamp ? parseFirebaseTimestamp(data.timestamp) : formatISO(new Date()),
      temperature: data.temp?.value ?? 0,
      humidity: data.humidity?.value ?? 0,
      co2: data.co2?.value ?? 0,
      pm2_5: data.pm25?.value ?? 0, // Firebase has 'pm25', our type uses 'pm2_5'
      pm10: data.pm10?.value ?? 0,
      latitude: data.location?.lat ?? undefined,
      longitude: data.location?.lng ?? undefined,
    };
    return reading;
  } catch (error) {
    console.error(`Error parsing Firebase reading for key ${key}:`, error, "Data:", data);
    return null;
  }
}

export async function fetchLatestAirQuality(): Promise<FetchLatestAirQualityResult> {
  const result: FetchLatestAirQualityResult = { reading: null, channelLocation: null };

  if (!process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL) {
    console.error("Firebase Database URL is not configured. Please set NEXT_PUBLIC_FIREBASE_DATABASE_URL in your .env file.");
    return result;
  }

  try {
    const readingsNodePath = `${READINGS_PATH}/readings`; // e.g. /AirQuality/readings
    const readingsRef = ref(database, readingsNodePath);
    // Data is keyed by "readings" + "YYYY-MM-DD_HH-MM-SS" (e.g. readings2024-07-15_10-30-45)
    // Order by key and get the last one
    const q = query(readingsRef, orderByKey(), limitToLast(1));
    const snapshot = await get(q);

    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => { // Should only be one child
        const key = childSnapshot.key;
        const data = childSnapshot.val() as FirebaseRawReading;
        if (key && data) {
          const parsed = parseFirebaseReading(key, data);
          if (parsed) {
            result.reading = parsed;
            if (parsed.latitude && parsed.longitude) {
              result.channelLocation = { latitude: parsed.latitude, longitude: parsed.longitude };
            }
          }
        }
      });
    } else {
      console.warn("No Firebase data found at path:", readingsNodePath);
    }
    return result;
  } catch (error) {
    console.error("Failed to fetch latest air quality data from Firebase:", error);
    return result;
  }
}

export async function fetchHistoricalAirQuality(results: number = 96): Promise<AirQualityReading[]> {
  if (!process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL) {
    console.error("Firebase Database URL is not configured for historical data. Please set NEXT_PUBLIC_FIREBASE_DATABASE_URL.");
    return [];
  }
  
  try {
    const readingsNodePath = `${READINGS_PATH}/readings`;
    const readingsRef = ref(database, readingsNodePath);
    const q = query(readingsRef, orderByKey(), limitToLast(results));
    const snapshot = await get(q);

    const historicalReadings: AirQualityReading[] = [];
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const key = childSnapshot.key;
        const data = childSnapshot.val() as FirebaseRawReading;
        if (key && data) {
          const parsed = parseFirebaseReading(key, data);
          if (parsed) {
            historicalReadings.push(parsed);
          }
        }
      });
    } else {
       console.warn("No historical Firebase data found at path:", readingsNodePath);
    }
    // Firebase returns in ascending order by key, reverse if you want most recent first
    // However, limitToLast already gets the "last N", which are the most recent.
    // The order of iteration of snapshot.forEach is ascending by key.
    // So we might want to reverse it if the chart expects newest first.
    // Or handle order in chart. For now, return as received.
    return historicalReadings;
  } catch (error) {
    console.error("Failed to fetch historical air quality data from Firebase:", error);
    return [];
  }
}
