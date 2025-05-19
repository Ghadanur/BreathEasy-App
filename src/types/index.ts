export interface AirQualityReading {
  id: string; // Or number, depending on your data source
  timestamp: string; // ISO string date
  temperature: number; // Celsius
  humidity: number; // Percentage
  co2: number; // CO2 level in ppm (formerly aqi)
  pm10_sensor_alternate: number; // PM10 μg/m³ from an alternate sensor/field (formerly pm1)
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
