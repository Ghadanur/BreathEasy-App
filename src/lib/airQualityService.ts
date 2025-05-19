
import type { AirQualityReading } from '@/types';
import { formatISO } from 'date-fns';

// Environment variables (ensure these are set in your .env.local file with NEXT_PUBLIC_ prefix)
const THINGSPEAK_CHANNEL_ID = process.env.NEXT_PUBLIC_THINGSPEAK_CHANNEL_ID;
const THINGSPEAK_READ_API_KEY = process.env.NEXT_PUBLIC_THINGSPEAK_READ_API_KEY;

const BASE_URL = `https://api.thingspeak.com/channels/${THINGSPEAK_CHANNEL_ID}`;

// Assumed ThingSpeak Field Mapping:
// field1: Temperature (°C)
// field2: Humidity (%)
// field3: AQI (Air Quality Index)
// field4: PM1.0 (μg/m³)
// field5: PM2.5 (μg/m³)
// field6: PM10 (μg/m³)

interface ThingSpeakFeed {
  created_at: string;
  entry_id: number;
  field1: string | null; // Temperature
  field2: string | null; // Humidity
  field3: string | null; // AQI
  field4: string | null; // PM1.0
  field5: string | null; // PM2.5
  field6: string | null; // PM10
  // Add more fields if your channel has them
}

interface ThingSpeakResponse {
  channel: {
    id: number;
    name: string;
    latitude: string;
    longitude: string;
    field1: string;
    field2: string;
    field3: string;
    field4: string;
    field5: string;
    field6: string;
    created_at: string;
    updated_at: string;
    last_entry_id: number;
  };
  feeds: ThingSpeakFeed[];
}

function parseFeedToAirQualityReading(feed: ThingSpeakFeed): AirQualityReading {
  return {
    id: feed.entry_id.toString(),
    timestamp: formatISO(new Date(feed.created_at)),
    temperature: parseFloat(feed.field1 || '0'),
    humidity: parseFloat(feed.field2 || '0'),
    aqi: parseFloat(feed.field3 || '0'),
    pm1: parseFloat(feed.field4 || '0'),
    pm2_5: parseFloat(feed.field5 || '0'),
    pm10: parseFloat(feed.field6 || '0'),
  };
}

export async function fetchLatestAirQuality(): Promise<AirQualityReading | null> {
  if (!THINGSPEAK_CHANNEL_ID || !THINGSPEAK_READ_API_KEY) {
    console.error("ThingSpeak environment variables NEXT_PUBLIC_THINGSPEAK_CHANNEL_ID or NEXT_PUBLIC_THINGSPEAK_READ_API_KEY are not configured in your .env file. Please set them to fetch data.");
    return null; // Return null if config is missing, UI will handle this
  }

  const url = `${BASE_URL}/feeds.json?api_key=${THINGSPEAK_READ_API_KEY}&results=1`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`ThingSpeak API error: ${response.status} ${response.statusText}`);
      const errorBody = await response.text();
      console.error("Error body:", errorBody);
      return null;
    }
    const data = await response.json() as ThingSpeakResponse;
    if (data.feeds && data.feeds.length > 0) {
      return parseFeedToAirQualityReading(data.feeds[0]);
    }
    return null;
  } catch (error) {
    console.error("Failed to fetch latest air quality data from ThingSpeak:", error);
    return null;
  }
}

export async function fetchHistoricalAirQuality(results: number = 96): Promise<AirQualityReading[]> {
  if (!THINGSPEAK_CHANNEL_ID || !THINGSPEAK_READ_API_KEY) {
    console.error("ThingSpeak environment variables NEXT_PUBLIC_THINGSPEAK_CHANNEL_ID or NEXT_PUBLIC_THINGSPEAK_READ_API_KEY are not configured for historical data. Please set them in your .env file.");
    return []; // Return empty array if config is missing
  }

  const url = `${BASE_URL}/feeds.json?api_key=${THINGSPEAK_READ_API_KEY}&results=${results}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`ThingSpeak API error for historical data: ${response.status} ${response.statusText}`);
      const errorBody = await response.text();
      console.error("Error body:", errorBody);
      return [];
    }
    const data = await response.json() as ThingSpeakResponse;
    if (data.feeds && data.feeds.length > 0) {
      return data.feeds.map(parseFeedToAirQualityReading).filter(reading => reading !== null) as AirQualityReading[];
    }
    return [];
  } catch (error) {
    console.error("Failed to fetch historical air quality data from ThingSpeak:", error);
    return [];
  }
}
