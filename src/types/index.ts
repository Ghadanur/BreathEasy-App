
export interface AirQualityReading {
  id: string; // Firestore document ID or "rtdb-current"
  timestamp: string; // ISO string format (e.g., "2023-10-27T14:30:15.000Z")
  temperature: number; // Celsius
  humidity: number; // Percentage
  co2: number; // CO2 level in ppm
  pm2_5: number; // PM2.5 μg/m³
  pm10: number; // PM10 μg/m³
  latitude?: number; // Optional
  longitude?: number; // Optional
}

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string; // Optional: if reverse geocoding is implemented
}

export interface PersonalizedTip {
  id: string;
  text: string;
}

// Type for the string timestamp as stored in Firestore by the ESP32 or RTDB
export type DateTimeString = string; // Format: "YYYY-MM-DD HH:MM:SS"

// Raw structure of a document from Firestore 'readings' collection,
// based on ESP32's uploadToFirestore function.
export interface RawFirestoreReading {
  fields: {
    temp?: { doubleValue: number };
    humidity?: { doubleValue: number };
    co2?: { doubleValue: number };
    pm25?: { doubleValue: number };
    pm10?: { doubleValue: number };
    location?: {
      mapValue?: {
        fields?: {
          latitude?: { doubleValue: number };
          longitude?: { doubleValue: number };
        };
      };
    };
    timestamp?: { stringValue: DateTimeString };
  };
  name?: string; // Document path
  createTime?: string;
  updateTime?: string;
}

// Structure for /CurrentValues in Realtime Database
export interface RTDBCurrentValues {
  pm25?: number;
  pm10?: number;
  co2?: number;
  temp?: number;
  humidity?: number;
  location?: {
    lat?: number;
    lng?: number;
  };
  lastUpdated?: DateTimeString; // "YYYY-MM-DD HH:MM:SS"
}

// Deprecated types, kept for reference if needed to understand older logic
// Structure for individual sensor metric from Firebase (Legacy or general)
export interface FirebaseSensorMetric {
  value: number;
  unit?: string;
  name?: string;
  description?: string;
  color?: string; // e.g., "rgb(239, 68, 68)"
  bgColor?: string; // e.g., "rgba(239, 68, 68, 0.2)"
}

// Structure for location data from Firebase (Legacy or general)
export interface FirebaseLocation {
  lat: number;
  lng: number;
}

// This is a general structure that was previously assumed for Firebase.
// It might be deprecated if RTDBRawReading is the sole source.
export interface FirebaseRawReading {
  temp: FirebaseSensorMetric;
  humidity: FirebaseSensorMetric;
  co2: FirebaseSensorMetric;
  pm25: FirebaseSensorMetric;
  pm10: FirebaseSensorMetric;
  location: FirebaseLocation;
  timestamp: string; // Expected format "YYYY-MM-DD HH:MM:SS"
}
