'use server';
/**
 * @fileOverview Generates a weekly summary of a user's emotions based on their tracked moods and journal entries.
 *
 * - generateWeeklySummary - A function that generates the weekly summary.
 * - GenerateWeeklySummaryInput - The input type for the generateWeeklySummary function.
 * - GenerateWeeklySummaryOutput - The return type for the generateWeeklySummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateWeeklySummaryInputSchema = z.object({
  moods: z
    .array(z.string())
    .describe('An array of mood emojis tracked daily during the week.'),
  entries: z
    .array(z.string())
    .describe('An array of journal entries written during the week.'),
});
export type GenerateWeeklySummaryInput = z.infer<
  typeof GenerateWeeklySummaryInputSchema
>;

const GenerateWeeklySummaryOutputSchema = z.object({
  summary: z
    .string()
    .describe(
      'A summary of the user\'s emotions and thoughts throughout the week, highlighting overall sentiment trends.'
    ),
});
export type GenerateWeeklySummaryOutput = z.infer<
  typeof GenerateWeeklySummaryOutputSchema
>;

export async function generateWeeklySummary(
  input: GenerateWeeklySummaryInput
): Promise<GenerateWeeklySummaryOutput> {
  return generateWeeklySummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'weeklySummaryPrompt',
  input: {schema: GenerateWeeklySummaryInputSchema},
  output: {schema: GenerateWeeklySummaryOutputSchema},
  prompt: `You are a personal journal assistant that analyzes a user's mood and written journal entries to provide a weekly summary of their emotions and thoughts.

  Moods: {{moods}}
  Entries: {{entries}}

  Analyze the provided moods and entries to identify recurring themes, sentiment trends, and significant events or feelings. Provide a concise summary that helps the user reflect on their week and understand their emotional state.
  Ensure that the weekly summary is in a warm, supportive, and understanding tone.
  Write a summary that is no more than 200 words.
  `,
});

const generateWeeklySummaryFlow = ai.defineFlow(
  {
    name: 'generateWeeklySummaryFlow',
    inputSchema: GenerateWeeklySummaryInputSchema,
    outputSchema: GenerateWeeklySummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
