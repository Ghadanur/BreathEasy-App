
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

// This is the expected structure from Firebase for a single reading entry
export interface FirebaseRawReading {
  temp: { value: number; unit?: string; name?: string; description?: string };
  humidity: { value: number; unit?: string; name?: string; description?: string };
  co2: { value: number; unit?: string; name?: string; description?: string };
  pm25: { value: number; unit?: string; name?: string; description?: string }; // Note: 'pm25' in Firebase
  pm10: { value: number; unit?: string; name?: string; description?: string };
  location: { lat: number; lng: number };
  timestamp: string; // "YYYY-MM-DD HH:MM:SS"
}
