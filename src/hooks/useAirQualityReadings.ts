
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
  // Firestore timestamp is "YYYY-MM-DD HH:MM:SS". We need "YYYY-MM-DDTHH:MM:SS" for Date constructor.
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
  const documentData = doc.data() as RawFirestoreReading; // Cast the raw doc data
  const docId = doc.id;

  if (!documentData) {
    console.warn(`[parseFirestoreDocToReading] Document ID: ${docId} - No data found in document snapshot.`);
    return null;
  }

  // The ESP32 code structures data under a top-level 'fields' object in the document.
  const rawDataFields = documentData.fields;

  if (typeof rawDataFields !== 'object' || rawDataFields === null) {
    console.warn(`[parseFirestoreDocToReading] Document ID: ${docId} - 'fields' property is missing, not an object, or null. Document data:`, JSON.stringify(documentData));
    return null;
  }

  // Extract values using optional chaining and check types
  const tempValue = rawDataFields.temp?.doubleValue;
  const humidityValue = rawDataFields.humidity?.doubleValue;
  const co2Value = rawDataFields.co2?.doubleValue;
  const pm25Value = rawDataFields.pm25?.doubleValue;
  const pm10Value = rawDataFields.pm10?.doubleValue;
  const latValue = rawDataFields.location?.mapValue?.fields?.latitude?.doubleValue;
  const lonValue = rawDataFields.location?.mapValue?.fields?.longitude?.doubleValue;
  const timestampString = rawDataFields.timestamp?.stringValue;

  const isoTimestamp = parseFirestoreTimestampToISO(timestampString);

  // Stricter validation log
  const validationIssues: string[] = [];
  if (typeof tempValue !== 'number') validationIssues.push(`tempValue (raw: ${JSON.stringify(rawDataFields.temp)}) is not a number.`);
  if (typeof humidityValue !== 'number') validationIssues.push(`humidityValue (raw: ${JSON.stringify(rawDataFields.humidity)}) is not a number.`);
  if (typeof co2Value !== 'number') validationIssues.push(`co2Value (raw: ${JSON.stringify(rawDataFields.co2)}) is not a number.`);
  if (typeof pm25Value !== 'number') validationIssues.push(`pm25Value (raw: ${JSON.stringify(rawDataFields.pm25)}) is not a number.`);
  if (typeof pm10Value !== 'number') validationIssues.push(`pm10Value (raw: ${JSON.stringify(rawDataFields.pm10)}) is not a number.`);
  
  // Latitude and longitude are optional in AirQualityReading, but if location object exists, they should be numbers
  if (rawDataFields.location?.mapValue?.fields) {
    if (typeof latValue !== 'number' && latValue !== undefined) validationIssues.push(`latValue (raw: ${JSON.stringify(rawDataFields.location.mapValue.fields.latitude)}) is not a number when location object exists.`);
    if (typeof lonValue !== 'number' && lonValue !== undefined) validationIssues.push(`lonValue (raw: ${JSON.stringify(rawDataFields.location.mapValue.fields.longitude)}) is not a number when location object exists.`);
  } else if (rawDataFields.location !== undefined) { // location object itself exists but maybe not mapValue or fields
     validationIssues.push(`location object exists but is malformed (raw: ${JSON.stringify(rawDataFields.location)}).`);
  }


  if (isoTimestamp === null) validationIssues.push(`timestampString ('${timestampString}') failed to parse or was missing (raw: ${JSON.stringify(rawDataFields.timestamp)}).`);

  if (validationIssues.length > 0) {
    console.warn(`[parseFirestoreDocToReading] Document ID: ${docId} - Incomplete or malformed data. Issues: ${validationIssues.join('; ')}. Raw 'fields' data:`, JSON.stringify(rawDataFields));
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
    // Latitude and longitude can be undefined if not present or if the full path doesn't resolve
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
    const readingsColRef = collection(firestore, 'readings'); // Collection name from ESP32 code

    // Query ordered by the string timestamp within the 'fields' object
    const dataQuery = query(
      readingsColRef,
      orderBy('fields.timestamp.stringValue', 'desc'),
      limit(count)
    );

    const unsubscribe = onSnapshot(dataQuery, (querySnapshot) => {
      try {
        if (querySnapshot.empty) {
          console.log("[useAirQualityReadings] Firestore query returned an empty snapshot for 'readings' collection. Ensure data is being written by ESP32, security rules allow reads, and the collection name is correct.");
          setReadings([]); // Ensure readings are cleared if snapshot is empty
        } else {
            const parsedReadings = querySnapshot.docs
            .map(doc => parseFirestoreDocToReading(doc))
            .filter((reading): reading is AirQualityReading => reading !== null);

          if (querySnapshot.docs.length > 0 && parsedReadings.length === 0) {
            console.warn("[useAirQualityReadings] Firestore query returned documents, but ALL failed parsing. Check parsing logic in 'parseFirestoreDocToReading' and data structure in Firestore for 'readings' collection. See previous logs from 'parseFirestoreDocToReading' for details on parsing failures for individual documents.");
          } else if (parsedReadings.length < querySnapshot.docs.length) {
            console.log(`[useAirQualityReadings] Parsed ${parsedReadings.length} valid readings out of ${querySnapshot.docs.length} documents fetched. Some documents may have failed parsing; check warnings from 'parseFirestoreDocToReading'.`);
          } else if (parsedReadings.length > 0) {
            console.log(`[useAirQualityReadings] Successfully parsed ${parsedReadings.length} historical readings from Firestore.`);
          }
          setReadings(parsedReadings);
        }
        setError(null);
      } catch (err: any) {
        console.error("[useAirQualityReadings] Error processing Firestore data snapshot:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setReadings([]); // Clear readings on error
      } finally {
        setLoading(false);
      }
    }, (firestoreError) => {
      console.error("[useAirQualityReadings] Firestore onSnapshot error. This often indicates a permissions issue (check security rules), network problem, or incorrect Firestore setup (e.g., project ID).", firestoreError);
      setError(firestoreError);
      setReadings([]); // Clear readings on error
      setLoading(false);
    });

    return () => unsubscribe();
  }, [count]);

  return { readings, loading, error };
}
