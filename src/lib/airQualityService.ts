
import type { AirQualityReading, LocationData } from '@/types';
import { formatISO } from 'date-fns';

// Environment variables (ensure these are set in your .env.local file with NEXT_PUBLIC_ prefix)
const THINGSPEAK_CHANNEL_ID = process.env.NEXT_PUBLIC_THINGSPEAK_CHANNEL_ID;
const THINGSPEAK_READ_API_KEY = process.env.NEXT_PUBLIC_THINGSPEAK_READ_API_KEY;

const BASE_URL = `https://api.thingspeak.com/channels/${THINGSPEAK_CHANNEL_ID}`;

// ThingSpeak Field Mapping:
// field1: Temperature (°C)
// field2: Humidity (%)
// field3: CO2 (ppm)
// field4: PM10 (μg/m³) - Alternate Sensor
// field5: PM2.5 (μg/m³)
// field6: PM10 (μg/m³) - Main Sensor

interface ThingSpeakFeed {
  created_at: string;
  entry_id: number;
  field1: string | null; // Temperature
  field2: string | null; // Humidity
  field3: string | null; // CO2
  field4: string | null; // PM10 (Alternate Sensor)
  field5: string | null; // PM2.5
  field6: string | null; // PM10 (Main Sensor)
}

interface ThingSpeakChannel {
  id: number;
  name: string;
  latitude: string | null; // Latitude can be null
  longitude: string | null; // Longitude can be null
  field1: string;
  field2: string;
  field3: string;
  field4: string;
  field5: string;
  field6: string;
  created_at: string;
  updated_at: string;
  last_entry_id: number;
}

interface ThingSpeakResponse {
  channel: ThingSpeakChannel;
  feeds: ThingSpeakFeed[];
}

export interface FetchLatestAirQualityResult {
  reading: AirQualityReading | null;
  channelLocation: LocationData | null;
}

function parseFeedToAirQualityReading(feed: ThingSpeakFeed): AirQualityReading {
  return {
    id: feed.entry_id.toString(),
    timestamp: formatISO(new Date(feed.created_at)),
    temperature: parseFloat(feed.field1 || '0'),
    humidity: parseFloat(feed.field2 || '0'),
    co2: parseFloat(feed.field3 || '0'),
    pm10_sensor_alternate: parseFloat(feed.field4 || '0'),
    pm2_5: parseFloat(feed.field5 || '0'),
    pm10: parseFloat(feed.field6 || '0'),
  };
}

export async function fetchLatestAirQuality(): Promise<FetchLatestAirQualityResult> {
  const result: FetchLatestAirQualityResult = { reading: null, channelLocation: null };

  if (!THINGSPEAK_CHANNEL_ID || !THINGSPEAK_READ_API_KEY) {
    console.error("ThingSpeak environment variables NEXT_PUBLIC_THINGSPEAK_CHANNEL_ID or NEXT_PUBLIC_THINGSPEAK_READ_API_KEY are not configured in your .env file. Please set them to fetch data.");
    return result;
  }

  const url = `${BASE_URL}/feeds.json?api_key=${THINGSPEAK_READ_API_KEY}&results=1`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`ThingSpeak API error: ${response.status} ${response.statusText}`);
      const errorBody = await response.text();
      console.error("Error body:", errorBody);
      return result;
    }
    const data = await response.json() as ThingSpeakResponse;

    if (data.feeds && data.feeds.length > 0) {
      result.reading = parseFeedToAirQualityReading(data.feeds[0]);
    }

    if (data.channel && data.channel.latitude && data.channel.longitude) {
      const lat = parseFloat(data.channel.latitude);
      const lon = parseFloat(data.channel.longitude);
      // Check if parsing resulted in valid numbers (not NaN)
      // ThingSpeak might return "0.000000" or null for unconfigured locations.
      // A simple check for NaN is good, but also consider if 0,0 is a valid "not set" marker for your channel.
      if (!isNaN(lat) && !isNaN(lon) && (lat !== 0 || lon !== 0)) { // Assuming 0,0 might mean "not set"
        result.channelLocation = { latitude: lat, longitude: lon };
      }
    }
    return result;
  } catch (error) {
    console.error("Failed to fetch latest air quality data from ThingSpeak:", error);
    return result;
  }
}

export async function fetchHistoricalAirQuality(results: number = 96): Promise<AirQualityReading[]> {
  if (!THINGSPEAK_CHANNEL_ID || !THINGSPEAK_READ_API_KEY) {
    console.error("ThingSpeak environment variables NEXT_PUBLIC_THINGSPEAK_CHANNEL_ID or NEXT_PUBLIC_THINGSPEAK_READ_API_KEY are not configured for historical data. Please set them in your .env file.");
    return [];
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
