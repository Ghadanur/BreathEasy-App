
import type { AirQualityReading, LocationData } from '@/types';
import { formatISO } from 'date-fns';

// Environment variables
const THINGSPEAK_CHANNEL_ID = process.env.NEXT_PUBLIC_THINGSPEAK_CHANNEL_ID;
const THINGSPEAK_READ_API_KEY = process.env.NEXT_PUBLIC_THINGSPEAK_READ_API_KEY;

const BASE_URL = `https://api.thingspeak.com/channels/${THINGSPEAK_CHANNEL_ID}`;

// ThingSpeak Field Mapping (based on provided Arduino code):
// field1: Temperature (°C)
// field2: Humidity (%)
// field3: Latitude
// field4: Longitude
// field5: MQ135 (CO2 ppm or general AQI)
// field6: PM1.0 (μg/m³)
// field7: PM2.5 (μg/m³)
// field8: PM10 (μg/m³)

interface ThingSpeakFeed {
  created_at: string;
  entry_id: number;
  field1: string | null; // Temperature
  field2: string | null; // Humidity
  field3: string | null; // Latitude
  field4: string | null; // Longitude
  field5: string | null; // MQ135 (CO2/AQI)
  field6: string | null; // PM1.0
  field7: string | null; // PM2.5
  field8: string | null; // PM10
}

interface ThingSpeakChannel {
  id: number;
  name: string;
  latitude: string | null;
  longitude: string | null;
  field1: string; // Corresponds to Temperature
  field2: string; // Corresponds to Humidity
  field3: string; // Corresponds to Latitude (also in feed)
  field4: string; // Corresponds to Longitude (also in feed)
  field5: string; // Corresponds to MQ135
  field6: string; // Corresponds to PM1.0
  field7: string; // Corresponds to PM2.5
  field8: string; // Corresponds to PM10
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
  channelLocation: LocationData | null; // General location from channel settings
}

function parseFeedToAirQualityReading(feed: ThingSpeakFeed): AirQualityReading {
  const reading: AirQualityReading = {
    id: feed.entry_id.toString(),
    timestamp: formatISO(new Date(feed.created_at)),
    temperature: parseFloat(feed.field1 || '0'),
    humidity: parseFloat(feed.field2 || '0'),
    co2: parseFloat(feed.field5 || '0'), // MQ135 mapped to co2
    pm1: parseFloat(feed.field6 || '0'),
    pm2_5: parseFloat(feed.field7 || '0'),
    pm10: parseFloat(feed.field8 || '0'),
  };

  // Parse latitude and longitude from feed if available
  const lat = parseFloat(feed.field3 || '');
  const lon = parseFloat(feed.field4 || '');

  if (!isNaN(lat) && lat !== 0) { // Assuming 0 might be an uninitialized value for feed lat
    reading.latitude = lat;
  }
  if (!isNaN(lon) && lon !== 0) { // Assuming 0 might be an uninitialized value for feed lon
    reading.longitude = lon;
  }
  
  return reading;
}

export async function fetchLatestAirQuality(): Promise<FetchLatestAirQualityResult> {
  const result: FetchLatestAirQualityResult = { reading: null, channelLocation: null };

  if (!THINGSPEAK_CHANNEL_ID || !THINGSPEAK_READ_API_KEY) {
    console.error("ThingSpeak environment variables NEXT_PUBLIC_THINGSPEAK_CHANNEL_ID or NEXT_PUBLIC_THINGSPEAK_READ_API_KEY are not configured. Please set them in your .env file.");
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

    // Set channelLocation from the feed's lat/lon first if available in the reading
    if (result.reading?.latitude && result.reading?.longitude) {
      result.channelLocation = {
        latitude: result.reading.latitude,
        longitude: result.reading.longitude,
      };
    } 
    // Fallback to channel's general latitude/longitude if feed doesn't have specific lat/lon
    // or if result.reading is null but channel data exists
    else if (data.channel && data.channel.latitude && data.channel.longitude) {
      const channelLat = parseFloat(data.channel.latitude);
      const channelLon = parseFloat(data.channel.longitude);
      if (!isNaN(channelLat) && !isNaN(channelLon) && (channelLat !== 0 || channelLon !== 0)) {
        result.channelLocation = { latitude: channelLat, longitude: channelLon };
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

  // Request more fields for historical data if they are to be charted
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
