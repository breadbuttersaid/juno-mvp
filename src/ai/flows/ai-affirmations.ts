// src/ai/flows/ai-affirmations.ts
'use server';
/**
 * @fileOverview Provides personalized affirmations and advice based on journal entries.
 *
 * - generateAffirmation - A function that generates affirmations based on the journal entry.
 * - GenerateAffirmationInput - The input type for the generateAffirmation function.
 * - GenerateAffirmationOutput - The return type for the generateAffirmation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateAffirmationInputSchema = z.object({
  journalEntry: z.string().describe('The user journal entry to generate affirmations for.'),
});
export type GenerateAffirmationInput = z.infer<typeof GenerateAffirmationInputSchema>;

const GenerateAffirmationOutputSchema = z.object({
  affirmation: z.string().describe('The generated affirmation or advice based on the journal entry.'),
});
export type GenerateAffirmationOutput = z.infer<typeof GenerateAffirmationOutputSchema>;

export async function generateAffirmation(input: GenerateAffirmationInput): Promise<GenerateAffirmationOutput> {
  return generateAffirmationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateAffirmationPrompt',
  input: {schema: GenerateAffirmationInputSchema},
  output: {schema: GenerateAffirmationOutputSchema},
  prompt: `You are a supportive AI friend, providing affirmations and advice based on journal entries.

  Based on the following journal entry, provide a personalized affirmation or piece of advice to support the user in dealing with their specific struggles. Focus on best-practice mental health suggestions. Speak in a warm, empathetic and human-like way.

  Journal Entry: {{{journalEntry}}}
  `,
});

const generateAffirmationFlow = ai.defineFlow(
  {
    name: 'generateAffirmationFlow',
    inputSchema: GenerateAffirmationInputSchema,
    outputSchema: GenerateAffirmationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
