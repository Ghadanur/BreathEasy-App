
"use client";

import { useState, useEffect } from 'react';
import type { AirQualityReading, DateTimeString } from '@/types';
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

// Helper to parse "YYYY-MM-DD HH:MM:SS" to ISO string
function parseDateTimeStringToISO(dateTimeString: DateTimeString | undefined): string | null {
  if (!dateTimeString || typeof dateTimeString !== 'string') {
    console.warn("[parseDateTimeStringToISO] Invalid or missing DateTimeString for parsing:", dateTimeString);
    return null;
  }
  const parsableDateTimeString = dateTimeString.replace(" ", "T"); // Convert space to 'T'
  const dateObj = new Date(parsableDateTimeString);

  if (isNaN(dateObj.getTime())) {
    console.warn("[parseDateTimeStringToISO] Failed to parse DateTimeString into valid date:", parsableDateTimeString, "Original:", dateTimeString);
    return null;
  }
  return dateObj.toISOString();
}

// Parses a Firestore document into AirQualityReading
// This version expects a flat structure as described by the user.
function parseFirestoreDocToReading(doc: QueryDocumentSnapshot<DocumentData>): AirQualityReading | null {
  const documentData = doc.data();
  const docId = doc.id;

  console.log(`[parseFirestoreDocToReading] Attempting to parse document ID: ${docId}. Raw document data:`, JSON.parse(JSON.stringify(documentData)));

  if (!documentData || typeof documentData !== 'object') {
    console.warn(`[parseFirestoreDocToReading] Document ID: ${docId} - No data found or data is not an object.`);
    return null;
  }

  const tempValue = documentData.temp;
  const humidityValue = documentData.humidity;
  const co2Value = documentData.co2;
  const pm25Value = documentData.pm25;
  const pm10Value = documentData.pm10;
  const locationData = documentData.location; // Expected to be a map { latitude: number, longitude: number }
  const timestampString = documentData.timestamp; // Expected to be "YYYY-MM-DD HH:MM:SS"

  const isoTimestamp = parseDateTimeStringToISO(timestampString);

  const validationIssues: string[] = [];
  if (typeof tempValue !== 'number') validationIssues.push(`tempValue (raw: ${JSON.stringify(tempValue)}) is not a number.`);
  else if (isNaN(tempValue)) validationIssues.push(`tempValue (raw: ${JSON.stringify(tempValue)}) is NaN.`);

  if (typeof humidityValue !== 'number') validationIssues.push(`humidityValue (raw: ${JSON.stringify(humidityValue)}) is not a number.`);
  else if (isNaN(humidityValue)) validationIssues.push(`humidityValue (raw: ${JSON.stringify(humidityValue)}) is NaN.`);

  if (typeof co2Value !== 'number') validationIssues.push(`co2Value (raw: ${JSON.stringify(co2Value)}) is not a number.`);
  else if (isNaN(co2Value)) validationIssues.push(`co2Value (raw: ${JSON.stringify(co2Value)}) is NaN.`);

  if (typeof pm25Value !== 'number') validationIssues.push(`pm25Value (raw: ${JSON.stringify(pm25Value)}) is not a number.`);
  else if (isNaN(pm25Value)) validationIssues.push(`pm25Value (raw: ${JSON.stringify(pm25Value)}) is NaN.`);

  if (typeof pm10Value !== 'number') validationIssues.push(`pm10Value (raw: ${JSON.stringify(pm10Value)}) is not a number.`);
  else if (isNaN(pm10Value)) validationIssues.push(`pm10Value (raw: ${JSON.stringify(pm10Value)}) is NaN.`);

  let latValue: number | undefined = undefined;
  let lonValue: number | undefined = undefined;

  if (locationData && typeof locationData === 'object') {
    if (typeof locationData.latitude === 'number' && !isNaN(locationData.latitude)) {
      latValue = locationData.latitude;
    } else {
      validationIssues.push(`location.latitude (raw: ${JSON.stringify(locationData.latitude)}) is not a valid number.`);
    }
    if (typeof locationData.longitude === 'number' && !isNaN(locationData.longitude)) {
      lonValue = locationData.longitude;
    } else {
      validationIssues.push(`location.longitude (raw: ${JSON.stringify(locationData.longitude)}) is not a valid number.`);
    }
  } else {
    // Location is optional, but if present and not an object, it's an issue for this structure.
    // If location is simply missing, that's fine.
    if (documentData.hasOwnProperty('location')) {
        validationIssues.push(`location field (raw: ${JSON.stringify(locationData)}) is present but not a valid map/object.`);
    }
  }

  if (isoTimestamp === null) validationIssues.push(`timestampString ('${timestampString}') failed to parse or was missing.`);

  if (validationIssues.length > 0) {
    console.warn(`[parseFirestoreDocToReading] Document ID: ${docId} - Incomplete or malformed data. Issues: ${validationIssues.join('; ')}. Raw data:`, JSON.parse(JSON.stringify(documentData)));
    return null;
  }

  console.log(`[parseFirestoreDocToReading] Successfully parsed document ID: ${docId}`);

  return {
    id: docId,
    timestamp: isoTimestamp!,
    temperature: tempValue!,
    humidity: humidityValue!,
    co2: co2Value!,
    pm2_5: pm25Value!,
    pm10: pm10Value!,
    latitude: latValue,
    longitude: lonValue,
  };
}


export function useAirQualityReadings(count: number = 96) {
  const [readings, setReadings] = useState<AirQualityReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    console.log(`[useAirQualityReadings] Hook activated. Fetching last ${count} readings from Firestore.`);

    const readingsColRef = collection(firestore, 'readings');
    // Order by the top-level 'timestamp' string field
    const dataQuery = query(
      readingsColRef,
      orderBy('timestamp', 'desc'),
      limit(count)
    );

    console.log("[useAirQualityReadings] Subscribing to Firestore 'readings' collection with query:", dataQuery);

    const unsubscribe = onSnapshot(dataQuery, (querySnapshot) => {
      console.log(`[useAirQualityReadings] Snapshot received. Processing ${querySnapshot.docs.length} document(s).`);
      try {
        if (querySnapshot.empty) {
          console.warn("[useAirQualityReadings] Firestore query returned an empty snapshot for 'readings' collection. Ensure data is being written, security rules allow reads, and the collection name is correct.");
          setReadings([]);
        } else {
          console.log(`[useAirQualityReadings] Received ${querySnapshot.docs.length} document(s) from Firestore. Attempting to parse...`);

          const parsedReadings = querySnapshot.docs
            .map(doc => parseFirestoreDocToReading(doc))
            .filter((reading): reading is AirQualityReading => reading !== null);

          if (querySnapshot.docs.length > 0 && parsedReadings.length === 0) {
            console.error("[useAirQualityReadings] CRITICAL: Firestore query returned documents, but ALL failed parsing. Check parsing logic in 'parseFirestoreDocToReading' and data structure in Firestore for 'readings' collection. See previous logs from 'parseFirestoreDocToReading' for details on parsing failures for individual documents.");
          } else if (parsedReadings.length < querySnapshot.docs.length) {
            console.warn(`[useAirQualityReadings] Parsed ${parsedReadings.length} valid readings out of ${querySnapshot.docs.length} documents fetched. Some documents may have failed parsing; check warnings from 'parseFirestoreDocToReading'.`);
          } else if (parsedReadings.length > 0) {
            console.log(`[useAirQualityReadings] Successfully parsed ${parsedReadings.length} historical readings from Firestore.`);
          }
          setReadings(parsedReadings);
          console.log("[useAirQualityReadings] Final parsed readings state:", parsedReadings);
        }
        setError(null);
      } catch (err: any) {
        console.error("[useAirQualityReadings] Error processing Firestore data snapshot:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setReadings([]);
      } finally {
        setLoading(false);
        console.log("[useAirQualityReadings] Loading state set to false.");
      }
    }, (firestoreError) => {
      console.error("[useAirQualityReadings] Firestore onSnapshot error. This often indicates a permissions issue (check security rules), network problem, or incorrect Firestore setup (e.g., project ID). Error details:", firestoreError);
      setError(firestoreError);
      setReadings([]);
      setLoading(false);
      console.log("[useAirQualityReadings] Loading state set to false due to onSnapshot error.");
    });

    return () => {
      console.log("[useAirQualityReadings] Unsubscribing from Firestore 'readings' collection.");
      unsubscribe();
    };
  }, [count]);

  return { readings, loading, error };
}
