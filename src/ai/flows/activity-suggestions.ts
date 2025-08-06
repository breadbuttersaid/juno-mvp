'use server';
/**
 * @fileOverview Generates activity suggestions based on journal entries.
 *
 * - generateSuggestions - A function that generates activity suggestions.
 * - GenerateSuggestionsInput - The input type for the generateSuggestions function.
 * - GenerateSuggestionsOutput - The return type for the generateSuggestions function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateSuggestionsInputSchema = z.object({
  entries: z.array(z.string()).describe('An array of recent journal entries.'),
});
export type GenerateSuggestionsInput = z.infer<typeof GenerateSuggestionsInputSchema>;

const ActivitySuggestionSchema = z.object({
  title: z.string().describe('A short, catchy title for the suggested activity.'),
  description: z.string().describe('A brief explanation of why this activity is being suggested and what it involves.'),
});

const GenerateSuggestionsOutputSchema = z.object({
  suggestions: z.array(ActivitySuggestionSchema).describe('A list of 2-3 suggested activities.'),
});
export type GenerateSuggestionsOutput = z.infer<typeof GenerateSuggestionsOutputSchema>;

export async function generateSuggestions(input: GenerateSuggestionsInput): Promise<GenerateSuggestionsOutput> {
  return generateSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSuggestionsPrompt',
  input: { schema: GenerateSuggestionsInputSchema },
  output: { schema: GenerateSuggestionsOutputSchema },
  prompt: `You are a kind and insightful AI friend. Your goal is to help the user by suggesting a few simple, actionable activities based on their recent journal entries. Analyze the themes and moods in their writing and provide 2-3 suggestions that could be helpful or enjoyable for them.

For each suggestion, provide a clear title and a short, encouraging description. Frame your suggestions in a gentle and supportive way.

Journal Entries:
{{#each entries}}
---
{{{this}}}
{{/each}}
---

Based on these entries, here are a few ideas for you:`,
});

const generateSuggestionsFlow = ai.defineFlow(
  {
    name: 'generateSuggestionsFlow',
    inputSchema: GenerateSuggestionsInputSchema,
    outputSchema: GenerateSuggestionsOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);
