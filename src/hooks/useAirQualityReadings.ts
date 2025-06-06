
"use client";

import { useState, useEffect } from 'react';
import type { AirQualityReading } from '@/types';
import { firestore } from '@/lib/firebase'; // Changed to import firestore
import { 
  collection, 
  query as firestoreQuery, // Renamed to avoid conflict with global query
  orderBy, 
  limit, 
  onSnapshot,
  Timestamp as FirestoreTimestamp // Import Firestore Timestamp
} from 'firebase/firestore';

// Helper to safely convert Firestore Timestamp to ISO string
function parseFirestoreTimestampToISO(timestamp: any): string {
  if (timestamp instanceof FirestoreTimestamp) {
    return timestamp.toDate().toISOString();
  }
  if (timestamp && typeof timestamp.toDate === 'function') { // Handle cases where it might be a similar object
    return timestamp.toDate().toISOString();
  }
  console.warn("Received non-Firestore Timestamp object for timestamp field, using current time as fallback:", timestamp);
  return new Date().toISOString(); // Fallback for unexpected types
}

// Simplified parsing for data expected to be in Firestore
// Assumes documents in Firestore 'airQualityReadings' collection
// directly map to AirQualityReading fields (except id and timestamp type).
function parseFirestoreDocToReading(id: string, data: any): AirQualityReading {
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
    timestamp: parseFirestoreTimestampToISO(data.timestamp),
    temperature: data.temperature !== undefined ? safeParseFloat(data.temperature) : 0,
    humidity: data.humidity !== undefined ? safeParseFloat(data.humidity) : 0,
    co2: data.co2 !== undefined ? safeParseInt(data.co2) : 0,
    pm2_5: data.pm2_5 !== undefined ? safeParseFloat(data.pm2_5) : 0,
    pm10: data.pm10 !== undefined ? safeParseFloat(data.pm10) : 0,
    latitude: data.latitude !== undefined ? safeParseFloat(data.latitude) : undefined,
    longitude: data.longitude !== undefined ? safeParseFloat(data.longitude) : undefined,
  };
}


export function useAirQualityReadings(count: number = 96) { // Renamed 'limit' to 'count' to avoid conflict with firestore 'limit'
  const [readings, setReadings] = useState<AirQualityReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    const readingsCollectionPath = 'airQualityReadings'; 
    const readingsColRef = collection(firestore, readingsCollectionPath);
    
    // Query to get the last 'count' readings, ordered by timestamp descending
    const q = firestoreQuery(
      readingsColRef, 
      orderBy('timestamp', 'desc'), 
      limit(count)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      try {
        const readingsArray = querySnapshot.docs.map(doc => {
          return parseFirestoreDocToReading(doc.id, doc.data());
        });
        // As Firestore returns them ordered by timestamp desc, no client-side sort is needed here
        // If you needed them ascending for the chart, you could .reverse() here or query ascending.
        // For now, keeping descending as it matches the previous RTDB logic (latest first).
        setReadings(readingsArray);
        setError(null);
      } catch (err: any) {
        console.error("Error processing Firestore data:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setReadings([]);
      } finally {
        setLoading(false);
      }
    }, (firestoreError) => {
      console.error("Firestore onSnapshot error:", firestoreError);
      setError(firestoreError);
      setReadings([]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [count]); // Dependency array uses 'count'

  return { readings, loading, error };
}
