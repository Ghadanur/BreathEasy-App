
"use client";

import { useState, useEffect } from 'react';
import type { AirQualityReading, RawFirestoreReading, FirestoreTimestampString } from '@/types';
import { firestore } from '@/lib/firebase'; 
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';

// Helper to parse the Firestore string timestamp "YYYY-MM-DD HH:MM:SS" to ISO string
function parseFirestoreTimestampToISO(firestoreTimestamp: FirestoreTimestampString): string {
  if (!firestoreTimestamp || typeof firestoreTimestamp !== 'string') {
    console.warn("Invalid Firestore timestamp string received for parsing:", firestoreTimestamp);
    return new Date().toISOString(); // Fallback
  }
  // The format "YYYY-MM-DD HH:MM:SS" is directly parsable by the Date constructor
  // by replacing the space with 'T'
  const parsableDateTimeString = firestoreTimestamp.replace(" ", "T");
  const dateObj = new Date(parsableDateTimeString);

  if (isNaN(dateObj.getTime())) {
    console.warn("Failed to parse Firestore timestamp string into valid date:", parsableDateTimeString, "Original:", firestoreTimestamp);
    return new Date().toISOString(); // Fallback
  }
  return dateObj.toISOString();
}

// Parses a Firestore document (structured according to ESP32's uploadToFirestore) into AirQualityReading
function parseFirestoreDocToReading(doc: QueryDocumentSnapshot<DocumentData>): AirQualityReading | null {
  const documentData = doc.data(); // This is the full document, e.g., { fields: { ... } }

  // Check if 'fields' property exists and is an object
  if (!documentData || !documentData.fields || typeof documentData.fields !== 'object') {
    console.warn("Invalid Firestore document: 'fields' property missing or not an object. ID:", doc.id, documentData);
    return null;
  }

  const rawData = documentData.fields as RawFirestoreReading['fields']; // Now rawData is the inner 'fields' object

  const tempValue = rawData.temp?.doubleValue;
  const humidityValue = rawData.humidity?.doubleValue;
  const co2Value = rawData.co2?.doubleValue;
  const pm25Value = rawData.pm25?.doubleValue;
  const pm10Value = rawData.pm10?.doubleValue;
  const latValue = rawData.location?.mapValue?.fields?.latitude?.doubleValue;
  const lonValue = rawData.location?.mapValue?.fields?.longitude?.doubleValue;
  const timestampString = rawData.timestamp?.stringValue;

  if (
    typeof tempValue !== 'number' ||
    typeof humidityValue !== 'number' ||
    typeof co2Value !== 'number' ||
    typeof pm25Value !== 'number' ||
    typeof pm10Value !== 'number' ||
    typeof timestampString !== 'string'
    // Latitude and longitude are optional, but if present, should be numbers.
    // No need to fail parsing if GPS data is temporarily unavailable from sensor.
  ) {
    console.warn("Incomplete or malformed data within 'fields' object in Firestore document:", doc.id, rawData);
    return null;
  }

  return {
    id: doc.id,
    timestamp: parseFirestoreTimestampToISO(timestampString),
    temperature: tempValue,
    humidity: humidityValue,
    co2: co2Value,
    pm2_5: pm25Value,
    pm10: pm10Value,
    latitude: typeof latValue === 'number' ? latValue : undefined,
    longitude: typeof lonValue === 'number' ? lonValue : undefined,
  };
}


export function useAirQualityReadings(count: number = 96) {
  const [readings, setReadings] = useState<AirQualityReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    const readingsColRef = collection(firestore, 'readings');
    
    const dataQuery = query(
      readingsColRef,
      orderBy('fields.timestamp.stringValue', 'desc'), // Corrected: Order by the nested string timestamp
      limit(count)
    );

    const unsubscribe = onSnapshot(dataQuery, (querySnapshot) => {
      try {
        const parsedReadings = querySnapshot.docs
          .map(doc => parseFirestoreDocToReading(doc))
          .filter((reading): reading is AirQualityReading => reading !== null); // Filter out null (invalid) entries
        
        setReadings(parsedReadings);
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
      setError(firestoreError as Error);
      setReadings([]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [count]);

  return { readings, loading, error };
}
