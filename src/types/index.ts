export interface AirQualityReading {
  id: string; // Or number, depending on your data source
  timestamp: string; // ISO string date
  temperature: number; // Celsius
  humidity: number; // Percentage
  aqi: number; // Air Quality Index
  pm1: number; // PM1.0 μg/m³
  pm2_5: number; // PM2.5 μg/m³
  pm10: number; // PM10 μg/m³
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
