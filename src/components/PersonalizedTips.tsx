"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { AirQualityReading, LocationData } from '@/types';
import { getPersonalizedAirQualityTips, type PersonalizedAirQualityTipsOutput } from '@/ai/flows/personalized-air-quality-tips';
import { Lightbulb, Loader2, AlertTriangle } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

interface PersonalizedTipsProps {
  latestReading: AirQualityReading | null;
  location: LocationData | null;
}

export function PersonalizedTips({ latestReading, location: initialLocation }: PersonalizedTipsProps) {
  const [userLocationInput, setUserLocationInput] = useState('');
  const [tips, setTips] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (initialLocation?.address) {
      setUserLocationInput(initialLocation.address);
    } else if (initialLocation) {
      setUserLocationInput(`${initialLocation.latitude.toFixed(4)}, ${initialLocation.longitude.toFixed(4)}`);
    }
  }, [initialLocation]);

  const fetchTips = useCallback(async () => {
    if (!latestReading) {
      toast({ title: "Missing Data", description: "Current air quality data is not available.", variant: "destructive" });
      return;
    }
    if (!userLocationInput && !initialLocation) {
      toast({ title: "Missing Location", description: "Please provide your location.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setError(null);
    setTips([]);

    try {
      const inputData = {
        location: userLocationInput || (initialLocation ? `${initialLocation.latitude}, ${initialLocation.longitude}`: "Unknown Location"),
        temperature: latestReading.temperature,
        humidity: latestReading.humidity,
        airQualityIndex: latestReading.aqi,
        particulateMatterPM2_5: latestReading.pm2_5,
        particulateMatterPM10: latestReading.pm10,
      };
      
      const result: PersonalizedAirQualityTipsOutput = await getPersonalizedAirQualityTips(inputData);
      if (result && result.tips) {
        setTips(result.tips);
      } else {
        setError("Could not retrieve tips. The AI model might have returned an unexpected response.");
      }
    } catch (e) {
      console.error("Error fetching tips:", e);
      const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred.";
      setError(`Failed to get personalized tips: ${errorMessage}`);
      toast({ title: "Error", description: `Failed to get tips: ${errorMessage}`, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [latestReading, userLocationInput, initialLocation, toast]);

  return (
    <Card className="shadow-lg col-span-1 md:col-span-2 lg:col-span-3">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Lightbulb className="h-6 w-6 mr-2 text-primary" />
          Personalized Air Quality Tips
        </CardTitle>
        <CardDescription>
          Get AI-powered suggestions to improve your air quality based on current conditions and your location.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="location-input">Your Location (e.g., City, State or Lat,Lng)</Label>
          <Input
            id="location-input"
            type="text"
            value={userLocationInput}
            onChange={(e) => setUserLocationInput(e.target.value)}
            placeholder={initialLocation ? (initialLocation.address || `${initialLocation.latitude.toFixed(4)}, ${initialLocation.longitude.toFixed(4)}`) : "Enter your location"}
            disabled={isLoading}
          />
        </div>
        <Button onClick={fetchTips} disabled={isLoading || !latestReading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Getting Tips...
            </>
          ) : (
            "Get Fresh Tips"
          )}
        </Button>

        {error && (
          <div className="text-destructive flex items-center gap-2 p-3 bg-destructive/10 rounded-md">
            <AlertTriangle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        )}

        {tips.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Here are your tips:</h3>
            <ScrollArea className="h-[200px] rounded-md border p-4 bg-secondary/30">
              <ul className="space-y-2 list-disc list-inside">
                {tips.map((tip, index) => (
                  <li key={index} className="text-sm">{tip}</li>
                ))}
              </ul>
            </ScrollArea>
          </div>
        )}
      </CardContent>
      {!latestReading && (
         <CardFooter>
            <p className="text-sm text-muted-foreground">Waiting for current air quality data to enable tips...</p>
         </CardFooter>
      )}
    </Card>
  );
}
