
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
function parseFirestoreTimestampToISO(firestoreTimestamp: FirestoreTimestampString | undefined): string | null {
  if (!firestoreTimestamp || typeof firestoreTimestamp !== 'string') {
    console.warn("Invalid or missing Firestore timestamp string for parsing:", firestoreTimestamp);
    return null; 
  }
  // The format "YYYY-MM-DD HH:MM:SS" is directly parsable by the Date constructor
  // by replacing the space with 'T'
  const parsableDateTimeString = firestoreTimestamp.replace(" ", "T");
  const dateObj = new Date(parsableDateTimeString);

  if (isNaN(dateObj.getTime())) {
    console.warn("Failed to parse Firestore timestamp string into valid date:", parsableDateTimeString, "Original:", firestoreTimestamp);
    return null; 
  }
  return dateObj.toISOString();
}

// Parses a Firestore document (structured according to ESP32's uploadToFirestore) into AirQualityReading
function parseFirestoreDocToReading(doc: QueryDocumentSnapshot<DocumentData>): AirQualityReading | null {
  const documentData = doc.data(); 

  if (!documentData || !documentData.fields || typeof documentData.fields !== 'object') {
    console.warn("Invalid Firestore document: 'fields' property missing or not an object. ID:", doc.id, documentData);
    return null;
  }

  const rawData = documentData.fields as RawFirestoreReading['fields'];

  const tempValue = rawData.temp?.doubleValue;
  const humidityValue = rawData.humidity?.doubleValue;
  const co2Value = rawData.co2?.doubleValue;
  const pm25Value = rawData.pm25?.doubleValue;
  const pm10Value = rawData.pm10?.doubleValue;
  const latValue = rawData.location?.mapValue?.fields?.latitude?.doubleValue;
  const lonValue = rawData.location?.mapValue?.fields?.longitude?.doubleValue;
  const timestampString = rawData.timestamp?.stringValue;

  const isoTimestamp = parseFirestoreTimestampToISO(timestampString);

  if (
    typeof tempValue !== 'number' ||
    typeof humidityValue !== 'number' ||
    typeof co2Value !== 'number' ||
    typeof pm25Value !== 'number' ||
    typeof pm10Value !== 'number' ||
    isoTimestamp === null // Check if timestamp parsing failed
  ) {
    let reason = "";
    if (typeof tempValue !== 'number') reason += "tempValue invalid; ";
    if (typeof humidityValue !== 'number') reason += "humidityValue invalid; ";
    if (typeof co2Value !== 'number') reason += "co2Value invalid; ";
    if (typeof pm25Value !== 'number') reason += "pm25Value invalid; ";
    if (typeof pm10Value !== 'number') reason += "pm10Value invalid; ";
    if (isoTimestamp === null) reason += "timestamp invalid; ";
    console.warn(`Incomplete or malformed data in Firestore document ID: ${doc.id}. Reason: ${reason} Raw fields:`, rawData);
    return null;
  }

  return {
    id: doc.id,
    timestamp: isoTimestamp,
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
    setError(null); // Clear previous errors on new effect run
    const readingsColRef = collection(firestore, 'readings');
    
    const dataQuery = query(
      readingsColRef,
      orderBy('fields.timestamp.stringValue', 'desc'), 
      limit(count)
    );

    const unsubscribe = onSnapshot(dataQuery, (querySnapshot) => {
      try {
        const parsedReadings = querySnapshot.docs
          .map(doc => parseFirestoreDocToReading(doc))
          .filter((reading): reading is AirQualityReading => reading !== null); 
        
        setReadings(parsedReadings);
        setError(null); 
      } catch (err: any) {
        console.error("Error processing Firestore data snapshot:", err);
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
  }, [count]);

  return { readings, loading, error };
}
