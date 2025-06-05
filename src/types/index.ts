
export interface AirQualityReading {
  id: string; // Firebase node key (e.g., readingsYYYY-MM-DD_HH-MM-SS)
  timestamp: string; // ISO string format (e.g., "2023-10-27T14:30:15.000Z")
  temperature: number; // Celsius
  humidity: number; // Percentage
  co2: number; // CO2 level in ppm (from MQ135/Firebase 'co2.value')
  pm2_5: number; // PM2.5 μg/m³ (from Firebase 'pm25.value')
  pm10: number; // PM10 μg/m³ (from Firebase 'pm10.value')
  latitude?: number; // Optional: from Firebase 'location.lat'
  longitude?: number; // Optional: from Firebase 'location.lng'
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

// Structure for individual sensor metric from Firebase
export interface FirebaseSensorMetric {
  value: number;
  unit?: string;
  name?: string;
  description?: string;
  color?: string; // e.g., "rgb(239, 68, 68)"
  bgColor?: string; // e.g., "rgba(239, 68, 68, 0.2)"
}

// Structure for location data from Firebase
export interface FirebaseLocation {
  lat: number;
  lng: number;
}

// This is the expected structure from Firebase for a single reading entry
// based on the provided ESP32 C++ code.
export interface FirebaseRawReading {
  temp: FirebaseSensorMetric;
  humidity: FirebaseSensorMetric;
  co2: FirebaseSensorMetric;
  pm25: FirebaseSensorMetric;
  pm10: FirebaseSensorMetric;
  location: FirebaseLocation;
  timestamp: string; // Expected format "YYYY-MM-DD HH:MM:SS"
}
