'use server';

/**
 * @fileOverview Generates journal prompts based on the user's mood.
 *
 * - generateMoodBasedPrompt - A function that generates a journal prompt based on the mood.
 * - MoodBasedPromptInput - The input type for the generateMoodBasedPrompt function.
 * - MoodBasedPromptOutput - The return type for the generateMoodBasedPrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MoodBasedPromptInputSchema = z.object({
  mood: z
    .enum(['happy', 'sad', 'neutral'])
    .describe('The current mood of the user.'),
});
export type MoodBasedPromptInput = z.infer<typeof MoodBasedPromptInputSchema>;

const MoodBasedPromptOutputSchema = z.object({
  prompt: z.string().describe('A journal prompt tailored to the user\'s mood.'),
});
export type MoodBasedPromptOutput = z.infer<typeof MoodBasedPromptOutputSchema>;

export async function generateMoodBasedPrompt(
  input: MoodBasedPromptInput
): Promise<MoodBasedPromptOutput> {
  return moodBasedPromptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'moodBasedPrompt',
  input: {schema: MoodBasedPromptInputSchema},
  output: {schema: MoodBasedPromptOutputSchema},
  prompt: `You are a helpful journal prompt generator. Given the user's mood, generate a relevant and thought-provoking journal prompt.

Mood: {{{mood}}}

Prompt:`,
});

const moodBasedPromptFlow = ai.defineFlow(
  {
    name: 'moodBasedPromptFlow',
    inputSchema: MoodBasedPromptInputSchema,
    outputSchema: MoodBasedPromptOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
