// src/ai/flows/ai-summaries.ts
'use server';

/**
 * @fileOverview Summarizes journal entries to identify recurring themes and provide insights.
 *
 * - summarizeEntries - A function that summarizes journal entries.
 * - SummarizeEntriesInput - The input type for the summarizeEntries function.
 * - SummarizeEntriesOutput - The return type for the summarizeEntries function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeEntriesInputSchema = z.object({
  entries: z.array(z.string()).describe('An array of journal entries to summarize.'),
});
export type SummarizeEntriesInput = z.infer<typeof SummarizeEntriesInputSchema>;

const SummarizeEntriesOutputSchema = z.object({
  summary: z.string().describe('A summary of the journal entries, highlighting recurring themes and insights.'),
});
export type SummarizeEntriesOutput = z.infer<typeof SummarizeEntriesOutputSchema>;

export async function summarizeEntries(input: SummarizeEntriesInput): Promise<SummarizeEntriesOutput> {
  return summarizeEntriesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeEntriesPrompt',
  input: {schema: SummarizeEntriesInputSchema},
  output: {schema: SummarizeEntriesOutputSchema},
  prompt: `You are a warm, supportive, and insightful AI friend. Your purpose is to act as a personal guide for the user on their mindfulness journey. You have been reading their journal entries and want to share some reflections with them in a gentle, caring, and encouraging way.

Speak directly to the user in the first person (e.g., "I've been reading your entries and I noticed...", "It seems like you've been feeling...", "I'm here for you as you navigate this.").

Your response should be more than just a summary. It should be a thoughtful reflection that helps the user feel seen and understood. Point out patterns, celebrate progress, and offer gentle encouragement for challenges. Act as their guide and friend.

Journal Entries:
{{#each entries}}
---
{{{this}}}
{{/each}}
---

My thoughts for you:`,
});

const summarizeEntriesFlow = ai.defineFlow(
  {
    name: 'summarizeEntriesFlow',
    inputSchema: SummarizeEntriesInputSchema,
    outputSchema: SummarizeEntriesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
