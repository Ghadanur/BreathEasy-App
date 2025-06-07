
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
  const documentData = doc.data() as RawFirestoreReading; // Cast to the expected raw structure
  const docId = doc.id;

  console.log(`[parseFirestoreDocToReading] Attempting to parse document ID: ${docId}. Raw document data:`, JSON.parse(JSON.stringify(documentData)));


  if (!documentData) {
    console.warn(`[parseFirestoreDocToReading] Document ID: ${docId} - No data found in document snapshot.`);
    return null;
  }

  // The ESP32 code structures data under a top-level 'fields' object in the document.
  const rawDataFields = documentData.fields;

  if (typeof rawDataFields !== 'object' || rawDataFields === null) {
    console.warn(`[parseFirestoreDocToReading] Document ID: ${docId} - 'fields' property is missing, not an object, or null. Document data:`, JSON.parse(JSON.stringify(documentData)));
    return null;
  }
  
  console.log(`[parseFirestoreDocToReading] Document ID: ${docId} - Found 'fields' object:`, JSON.parse(JSON.stringify(rawDataFields)));


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

  const validationIssues: string[] = [];
  if (typeof tempValue !== 'number') validationIssues.push(`tempValue (raw: ${JSON.stringify(rawDataFields.temp)}) is not a number.`);
  else if (isNaN(tempValue)) validationIssues.push(`tempValue (raw: ${JSON.stringify(rawDataFields.temp)}) is NaN.`);

  if (typeof humidityValue !== 'number') validationIssues.push(`humidityValue (raw: ${JSON.stringify(rawDataFields.humidity)}) is not a number.`);
  else if (isNaN(humidityValue)) validationIssues.push(`humidityValue (raw: ${JSON.stringify(rawDataFields.humidity)}) is NaN.`);
  
  if (typeof co2Value !== 'number') validationIssues.push(`co2Value (raw: ${JSON.stringify(rawDataFields.co2)}) is not a number.`);
  else if (isNaN(co2Value)) validationIssues.push(`co2Value (raw: ${JSON.stringify(rawDataFields.co2)}) is NaN.`);

  if (typeof pm25Value !== 'number') validationIssues.push(`pm25Value (raw: ${JSON.stringify(rawDataFields.pm25)}) is not a number.`);
  else if (isNaN(pm25Value)) validationIssues.push(`pm25Value (raw: ${JSON.stringify(rawDataFields.pm25)}) is NaN.`);

  if (typeof pm10Value !== 'number') validationIssues.push(`pm10Value (raw: ${JSON.stringify(rawDataFields.pm10)}) is not a number.`);
  else if (isNaN(pm10Value)) validationIssues.push(`pm10Value (raw: ${JSON.stringify(rawDataFields.pm10)}) is NaN.`);
  
  // Latitude and longitude are optional in AirQualityReading
  // If location object and its sub-fields exist, then lat/lon should be numbers or undefined (if keys are missing)
  if (rawDataFields.location?.mapValue?.fields) {
    if (latValue !== undefined && typeof latValue !== 'number') {
        validationIssues.push(`latValue (raw: ${JSON.stringify(rawDataFields.location.mapValue.fields.latitude)}) is present but not a number.`);
    } else if (latValue !== undefined && isNaN(latValue)) {
        validationIssues.push(`latValue (raw: ${JSON.stringify(rawDataFields.location.mapValue.fields.latitude)}) is NaN.`);
    }
    if (lonValue !== undefined && typeof lonValue !== 'number') {
        validationIssues.push(`lonValue (raw: ${JSON.stringify(rawDataFields.location.mapValue.fields.longitude)}) is present but not a number.`);
    } else if (lonValue !== undefined && isNaN(lonValue)) {
        validationIssues.push(`lonValue (raw: ${JSON.stringify(rawDataFields.location.mapValue.fields.longitude)}) is NaN.`);
    }
  } else if (rawDataFields.location !== undefined) { 
     validationIssues.push(`location object exists but is malformed (raw: ${JSON.stringify(rawDataFields.location)}).`);
  }

  if (isoTimestamp === null) validationIssues.push(`timestampString ('${timestampString}') failed to parse or was missing (raw: ${JSON.stringify(rawDataFields.timestamp)}).`);

  if (validationIssues.length > 0) {
    console.warn(`[parseFirestoreDocToReading] Document ID: ${docId} - Incomplete or malformed data. Issues: ${validationIssues.join('; ')}. Raw 'fields' data:`, JSON.parse(JSON.stringify(rawDataFields)));
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
    latitude: (typeof latValue === 'number' && !isNaN(latValue)) ? latValue : undefined,
    longitude: (typeof lonValue === 'number' && !isNaN(lonValue)) ? lonValue : undefined,
  };
}


export function useAirQualityReadings(count: number = 96) { 
  const [readings, setReadings] = useState<AirQualityReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    console.log(`[useAirQualityReadings] Hook activated. Fetching last ${count} readings.`);
    
    const readingsColRef = collection(firestore, 'readings');

    const dataQuery = query(
      readingsColRef,
      orderBy('fields.timestamp.stringValue', 'desc'), // Order by the string timestamp within fields
      limit(count)
    );

    console.log("[useAirQualityReadings] Subscribing to Firestore 'readings' collection with query:", dataQuery);

    const unsubscribe = onSnapshot(dataQuery, (querySnapshot) => {
      console.log(`[useAirQualityReadings] Snapshot received. Processing ${querySnapshot.docs.length} document(s).`);
      try {
        if (querySnapshot.empty) {
          console.warn("[useAirQualityReadings] Firestore query returned an empty snapshot for 'readings' collection. Ensure data is being written by ESP32 to this collection, security rules allow reads, and the collection name is correct.");
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

    // Cleanup function
    return () => {
      console.log("[useAirQualityReadings] Unsubscribing from Firestore 'readings' collection.");
      unsubscribe();
    };
  }, [count]); // Re-run effect if count changes

  return { readings, loading, error };
}
    