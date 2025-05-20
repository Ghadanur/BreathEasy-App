
// This is an AI-powered tool that suggests personalized tips to improve air quality, tailored to the user's location and real-time air quality data.

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedAirQualityTipsInputSchema = z.object({
  location: z.string().describe('The user\'s current location.'),
  temperature: z.number().describe('The current temperature in Celsius.'),
  humidity: z.number().describe('The current humidity percentage.'),
  co2Level: z.number().describe('The current CO2 level in ppm (from MQ135 sensor).'),
  particulateMatterPM1: z
    .number()
    .describe('The current PM1.0 particulate matter concentration in μg/m³.'),
  particulateMatterPM2_5: z
    .number()
    .describe('The current PM2.5 particulate matter concentration in μg/m³.'),
  particulateMatterPM10: z
    .number()
    .describe('The current PM10 particulate matter concentration in μg/m³.'),
});

export type PersonalizedAirQualityTipsInput = z.infer<
  typeof PersonalizedAirQualityTipsInputSchema
>;

const PersonalizedAirQualityTipsOutputSchema = z.object({
  tips: z
    .array(z.string())
    .describe(
      'A list of personalized tips to improve air quality based on the user\'s location and real-time air quality data.'
    ),
});

export type PersonalizedAirQualityTipsOutput = z.infer<
  typeof PersonalizedAirQualityTipsOutputSchema
>;

export async function getPersonalizedAirQualityTips(
  input: PersonalizedAirQualityTipsInput
): Promise<PersonalizedAirQualityTipsOutput> {
  return personalizedAirQualityTipsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedAirQualityTipsPrompt',
  input: {schema: PersonalizedAirQualityTipsInputSchema},
  output: {schema: PersonalizedAirQualityTipsOutputSchema},
  prompt: `You are an AI assistant that provides personalized tips to improve air quality based on the user's location and real-time air quality data.

  Location: {{location}}
  Temperature: {{temperature}} °C
  Humidity: {{humidity}}%
  CO2 Level: {{co2Level}} ppm 
  PM1.0: {{particulateMatterPM1}} μg/m³
  PM2.5: {{particulateMatterPM2_5}} μg/m³
  PM10: {{particulateMatterPM10}} μg/m³

  Based on this information, provide a list of personalized tips to help the user improve the air quality in their immediate surroundings.
  The tips should be specific and actionable.
  Consider the CO2 level: if it's high, suggest ventilation.
  Consider particulate matter (PM1.0, PM2.5, PM10): if high, suggest air purifiers, closing windows during high outdoor pollution, etc.
  Provide at least 3-5 distinct tips.
  Tips:
  `,
});

const personalizedAirQualityTipsFlow = ai.defineFlow(
  {
    name: 'personalizedAirQualityTipsFlow',
    inputSchema: PersonalizedAirQualityTipsInputSchema,
    outputSchema: PersonalizedAirQualityTipsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
