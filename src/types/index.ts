export interface AirQualityReading {
  id: string; // Or number, depending on your data source
  timestamp: string; // ISO string date
  temperature: number; // Celsius
  humidity: number; // Percentage
  co2: number; // CO2 level in ppm (from MQ135 mapped to field5)
  // PM1.0 is removed as per new field mapping
  pm2_5: number; // PM2.5 μg/m³ (from field6)
  pm10: number; // PM10 μg/m³ (from field7)
  latitude?: number; // Optional: from field3
  longitude?: number; // Optional: from field4
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
