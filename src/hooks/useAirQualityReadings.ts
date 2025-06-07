
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
    console.warn("[parseFirestoreTimestampToISO] Invalid or missing Firestore timestamp string for parsing:", firestoreTimestamp);
    return null;
  }
  const parsableDateTimeString = firestoreTimestamp.replace(" ", "T");
  const dateObj = new Date(parsableDateTimeString);

  if (isNaN(dateObj.getTime())) {
    console.warn("[parseFirestoreTimestampToISO] Failed to parse Firestore timestamp string into valid date:", parsableDateTimeString, "Original:", firestoreTimestamp);
    return null;
  }
  return dateObj.toISOString();
}

// Parses a Firestore document (structured according to ESP32's uploadToFirestore) into AirQualityReading
function parseFirestoreDocToReading(doc: QueryDocumentSnapshot<DocumentData>): AirQualityReading | null {
  const documentData = doc.data();
  const docId = doc.id;

  if (!documentData) {
    console.warn(`[parseFirestoreDocToReading] Document ID: ${docId} - No data found.`);
    return null;
  }

  if (typeof documentData.fields !== 'object' || documentData.fields === null) {
    console.warn(`[parseFirestoreDocToReading] Document ID: ${docId} - 'fields' property is missing, not an object, or null. Document data:`, JSON.stringify(documentData));
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

  const validationIssues: string[] = [];
  if (typeof tempValue !== 'number') validationIssues.push(`tempValue (raw: ${rawData.temp?.doubleValue}) is not a number.`);
  if (typeof humidityValue !== 'number') validationIssues.push(`humidityValue (raw: ${rawData.humidity?.doubleValue}) is not a number.`);
  if (typeof co2Value !== 'number') validationIssues.push(`co2Value (raw: ${rawData.co2?.doubleValue}) is not a number.`);
  if (typeof pm25Value !== 'number') validationIssues.push(`pm25Value (raw: ${rawData.pm25?.doubleValue}) is not a number.`);
  if (typeof pm10Value !== 'number') validationIssues.push(`pm10Value (raw: ${rawData.pm10?.doubleValue}) is not a number.`);
  if (isoTimestamp === null) validationIssues.push(`timestampString ('${timestampString}') failed to parse or was missing.`);

  if (validationIssues.length > 0) {
    console.warn(`[parseFirestoreDocToReading] Document ID: ${docId} - Incomplete or malformed data. Issues: ${validationIssues.join('; ')}. Raw fields data:`, JSON.stringify(rawData));
    return null;
  }

  return {
    id: docId,
    timestamp: isoTimestamp!, // Not null here due to validation
    temperature: tempValue!,
    humidity: humidityValue!,
    co2: co2Value!,
    pm2_5: pm25Value!,
    pm10: pm10Value!,
    latitude: typeof latValue === 'number' ? latValue : undefined,
    longitude: typeof lonValue === 'number' ? lonValue : undefined,
  };
}


export function useAirQualityReadings(count: number = 96) { // Default count for historical data
  const [readings, setReadings] = useState<AirQualityReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const readingsColRef = collection(firestore, 'readings');

    const dataQuery = query(
      readingsColRef,
      orderBy('fields.timestamp.stringValue', 'desc'),
      limit(count)
    );

    const unsubscribe = onSnapshot(dataQuery, (querySnapshot) => {
      try {
        if (querySnapshot.empty) {
          console.log("[useAirQualityReadings] Firestore query returned an empty snapshot for 'readings' collection.");
        }
        const parsedReadings = querySnapshot.docs
          .map(doc => parseFirestoreDocToReading(doc))
          .filter((reading): reading is AirQualityReading => reading !== null);

        if (querySnapshot.docs.length > 0 && parsedReadings.length === 0) {
          console.warn("[useAirQualityReadings] Firestore query returned documents, but all failed parsing. Check parsing logic and data structure in Firestore for 'readings' collection.");
        }
        
        setReadings(parsedReadings);
        setError(null);
      } catch (err: any) {
        console.error("[useAirQualityReadings] Error processing Firestore data snapshot:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setReadings([]);
      } finally {
        setLoading(false);
      }
    }, (firestoreError) => {
      console.error("[useAirQualityReadings] Firestore onSnapshot error:", firestoreError);
      setError(firestoreError);
      setReadings([]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [count]);

  return { readings, loading, error };
}
