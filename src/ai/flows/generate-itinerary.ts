'use server';

/**
 * @fileOverview An AI flow to generate a travel itinerary.
 *
 * - generateItinerary - A function that creates an optimized route from a list of stops.
 * - ItineraryInput - The input type for the generateItinerary function.
 * - ItineraryOutput - The return type for the generateItinerary function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ItineraryInputSchema = z.object({
  vehicle: z.string().describe('The vehicle assigned for the route.'),
  stops: z.array(z.string()).describe('An unordered list of locations to visit.'),
});
export type ItineraryInput = z.infer<typeof ItineraryInputSchema>;

const ItineraryOutputSchema = z.object({
  totalDistance: z.string().describe('The estimated total distance of the trip in kilometers.'),
  totalTime: z.string().describe('The estimated total travel time.'),
  optimizedStops: z.array(
    z.object({
      location: z.string().describe('The name of the stop.'),
      note: z.string().describe('A brief, useful note for the driver about this stop (e.g., "pick up documents", "deliver fertilizer").'),
    })
  ).describe('The list of stops in an optimized order.'),
});
export type ItineraryOutput = z.infer<typeof ItineraryOutputSchema>;

export async function generateItinerary(input: ItineraryInput): Promise<ItineraryOutput> {
  return generateItineraryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateItineraryPrompt',
  input: { schema: ItineraryInputSchema },
  output: { schema: ItineraryOutputSchema },
  prompt: `You are an expert logistics planner for an agricultural company.
Your task is to create an optimized travel itinerary based on a list of stops.

Vehicle: {{{vehicle}}}
Stops to visit:
{{#each stops}}
- {{{this}}}
{{/each}}

Instructions:
1.  **Optimize the Route:** Determine the most logical and efficient order for the given stops. The starting point is always the company's main office.
2.  **Estimate Totals:** Provide a rough estimate for the total distance and total travel time. Be realistic.
3.  **Provide Notes:** For each stop, add a concise, actionable note. Infer the likely purpose of the visit (e.g., if the stop name sounds like a supplier, the note could be "pick up supplies"; if it sounds like a farm, "deliver fertilizer").
4.  **Output:** Generate the response in the specified JSON format. The entire output must be in Spanish.
`,
});

const generateItineraryFlow = ai.defineFlow(
  {
    name: 'generateItineraryFlow',
    inputSchema: ItineraryInputSchema,
    outputSchema: ItineraryOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
