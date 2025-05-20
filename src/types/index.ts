export interface AirQualityReading {
  id: string; // Or number, depending on your data source
  timestamp: string; // ISO string date
  temperature: number; // Celsius
  humidity: number; // Percentage
  co2: number; // CO2 level in ppm (from MQ135 mapped to field5)
  pm1: number; // PM1.0 μg/m³ (from field6)
  pm2_5: number; // PM2.5 μg/m³ (from field7)
  pm10: number; // PM10 μg/m³ (from field8)
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
