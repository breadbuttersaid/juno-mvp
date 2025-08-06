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
  prompt: `You are an AI journal assistant. Your task is to summarize a collection of journal entries and identify recurring themes and insights.

Journal Entries:
{{#each entries}}
---
{{{this}}}
{{/each}}
---

Summary: Provide a concise summary of the entries, highlighting any recurring themes, emotions, or patterns. Offer insights into the user's thoughts and feelings based on the entries, helping them gain a deeper understanding of themselves.`,
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
