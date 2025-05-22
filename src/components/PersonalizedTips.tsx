
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
import { Dialog, DialogContent, DialogHeader, DialogTitle as ShadDialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface PersonalizedTipsProps {
  latestReading: AirQualityReading | null;
  derivedLocation: LocationData | null;
}

export function PersonalizedTips({ latestReading, derivedLocation }: PersonalizedTipsProps) {
  const [userLocationInput, setUserLocationInput] = useState('');
  const [tips, setTips] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (derivedLocation?.address) {
      setUserLocationInput(derivedLocation.address);
    } else if (derivedLocation?.latitude && derivedLocation?.longitude) {
      setUserLocationInput(`${derivedLocation.latitude.toFixed(4)}, ${derivedLocation.longitude.toFixed(4)}`);
    } else {
        setUserLocationInput('');
    }
  }, [derivedLocation]);

  const fetchTips = useCallback(async () => {
    if (!latestReading) {
      toast({ title: "Missing Data", description: "Current air quality data is not available to generate tips.", variant: "destructive" });
      return;
    }
    
    let locationStringForAI = "Unknown Location";
    if (userLocationInput) {
        locationStringForAI = userLocationInput;
    } else if (derivedLocation?.latitude && derivedLocation?.longitude) {
        locationStringForAI = `${derivedLocation.latitude.toFixed(4)}, ${derivedLocation.longitude.toFixed(4)}`;
    } else if (latestReading.latitude && latestReading.longitude) {
        locationStringForAI = `${latestReading.latitude.toFixed(4)}, ${latestReading.longitude.toFixed(4)}`;
    }

    if (locationStringForAI === "Unknown Location") {
         toast({ title: "Missing Location", description: "Please provide your location or ensure it's available from the data feed to get tips.", variant: "destructive" });
         return;
    }

    setIsLoading(true);
    setError(null);
    setTips([]);

    try {
      const inputData = {
        location: locationStringForAI,
        temperature: latestReading.temperature,
        humidity: latestReading.humidity,
        co2Level: latestReading.co2,
        particulateMatterPM2_5: latestReading.pm2_5,
        particulateMatterPM10: latestReading.pm10,
      };
      
      const result: PersonalizedAirQualityTipsOutput = await getPersonalizedAirQualityTips(inputData);
      if (result && result.tips && result.tips.length > 0) {
        setTips(result.tips);
      } else {
        setError("Could not retrieve tips. The AI model might have returned an unexpected response or no tips.");
        if (result && result.tips && result.tips.length === 0) {
           toast({ title: "No Tips Generated", description: "The AI model did not generate any tips for the current conditions.", variant: "default" });
        }
      }
    } catch (e) {
      console.error("Error fetching tips:", e);
      const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred.";
      setError(`Failed to get personalized tips: ${errorMessage}`);
      toast({ title: "Error", description: `Failed to get tips: ${errorMessage}`, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [latestReading, userLocationInput, derivedLocation, toast]);

  const cardTitle = "Personalized Air Quality Tips";

  const cardContent = (
    <>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Lightbulb className="h-6 w-6 mr-2 text-primary" />
          {cardTitle}
        </CardTitle>
        <CardDescription>
          Get AI-powered suggestions to improve your air quality based on current conditions and your location (from data feed or your input).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="location-input-dialog">Your Location (e.g., City, State or Lat,Lng)</Label>
          <Input
            id={isLoading ? "location-input-disabled" : "location-input-dialog"} // Ensure unique ID if rendered twice
            type="text"
            value={userLocationInput}
            onChange={(e) => setUserLocationInput(e.target.value)}
            placeholder={
              (derivedLocation?.latitude && derivedLocation?.longitude) 
                ? `${derivedLocation.latitude.toFixed(4)}, ${derivedLocation.longitude.toFixed(4)}`
                : (latestReading?.latitude && latestReading?.longitude)
                  ? `${latestReading.latitude.toFixed(4)}, ${latestReading.longitude.toFixed(4)}`
                  : "Enter your location"
            }
            disabled={isLoading}
            onClick={(e) => e.stopPropagation()} // Prevent dialog from closing when clicking input
          />
        </div>
        <Button onClick={(e) => { e.stopPropagation(); fetchTips(); }} disabled={isLoading || !latestReading}>
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
    </>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="shadow-lg col-span-1 md:col-span-2 lg:col-span-3 cursor-pointer hover:shadow-xl transition-shadow duration-300">
          {/* Display a summarized version or just the header in the card trigger */}
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lightbulb className="h-6 w-6 mr-2 text-primary" />
              {cardTitle}
            </CardTitle>
            <CardDescription>
              Click to view and get AI-powered suggestions.
            </CardDescription>
          </CardHeader>
           <CardContent>
            {tips.length > 0 ? (
              <p className="text-sm text-muted-foreground">
                Currently showing {tips.length} tip(s). Click to see details and refresh.
              </p>
            ) : error ? (
              <p className="text-sm text-destructive">Error fetching tips. Click to retry.</p>
            ) : isLoading ? (
              <p className="text-sm text-muted-foreground">Loading tips...</p>
            ) : (
              <p className="text-sm text-muted-foreground">Click to generate personalized air quality tips.</p>
            )}
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg md:max-w-xl lg:max-w-2xl max-h-[85vh] flex flex-col">
         <DialogHeader>
            <ShadDialogTitle className="flex items-center text-white">
              <Lightbulb className="h-6 w-6 mr-2 text-white" />
              {cardTitle}
            </ShadDialogTitle>
          </DialogHeader>
        <ScrollArea className="flex-grow overflow-y-auto">
          <div className="p-1"> {/* Add slight padding if content touches edges */}
            {/* Render the full card content within the dialog */}
            {/* We need to reconstruct the inner parts of the card for the dialog */}
            <div className="pt-4 space-y-4"> {/* Mimic CardContent spacing */}
              <CardDescription className="text-white/90 px-6"> {/* Re-add description for context in dialog */}
                Get AI-powered suggestions to improve your air quality based on current conditions and your location.
              </CardDescription>
              <div className="px-6"> {/* Mimic CardContent padding */}
                <Label htmlFor="location-input-dialog-main" className="text-white/90">Your Location (e.g., City, State or Lat,Lng)</Label>
                <Input
                  id="location-input-dialog-main"
                  type="text"
                  value={userLocationInput}
                  onChange={(e) => setUserLocationInput(e.target.value)}
                  placeholder={
                    (derivedLocation?.latitude && derivedLocation?.longitude) 
                      ? `${derivedLocation.latitude.toFixed(4)}, ${derivedLocation.longitude.toFixed(4)}`
                      : (latestReading?.latitude && latestReading?.longitude)
                        ? `${latestReading.latitude.toFixed(4)}, ${latestReading.longitude.toFixed(4)}`
                        : "Enter your location"
                  }
                  disabled={isLoading}
                  className="bg-white/10 text-white placeholder:text-white/60 border-white/30 focus:ring-primary"
                  onClick={(e) => e.stopPropagation()} 
                />
              </div>
              <div className="px-6"> {/* Mimic CardContent padding */}
                <Button onClick={(e) => { e.stopPropagation(); fetchTips(); }} disabled={isLoading || !latestReading} className="w-full">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Getting Tips...
                    </>
                  ) : (
                    "Get Fresh Tips"
                  )}
                </Button>
              </div>

              {error && (
                <div className="text-red-300 flex items-center gap-2 p-3 bg-red-900/30 rounded-md mx-6">
                  <AlertTriangle className="h-5 w-5" />
                  <p>{error}</p>
                </div>
              )}

              {tips.length > 0 && (
                <div className="mt-6 px-6">
                  <h3 className="text-lg font-semibold mb-2 text-white">Here are your tips:</h3>
                  <ScrollArea className="h-[200px] rounded-md border border-white/20 p-4 bg-white/5">
                    <ul className="space-y-2 list-disc list-inside text-white/90">
                      {tips.map((tip, index) => (
                        <li key={index} className="text-sm">{tip}</li>
                      ))}
                    </ul>
                  </ScrollArea>
                </div>
              )}
            </div>
            {!latestReading && (
              <div className="p-6 pt-4 text-sm text-white/70"> {/* Mimic CardFooter */}
                  <p>Waiting for current air quality data to enable tips...</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

