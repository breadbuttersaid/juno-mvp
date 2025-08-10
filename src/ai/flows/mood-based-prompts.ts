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
    .enum(['happy', 'sad', 'neutral', 'excited', 'anxious', 'grateful', 'stressed', 'tired', 'calm', 'inspired'])
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
  prompt: `You are a gentle and insightful journal prompt generator. Your goal is to provide a single, thought-provoking prompt that helps the user explore their feelings. The prompt should be creative, encouraging, and tailored to their stated mood.

Guidelines for Different Moods:
- If the mood is "happy," "excited," or "inspired," ask a question that helps them savor and understand the source of their joy.
- If the mood is "sad," "anxious," or "stressed," offer a gentle, compassionate question that allows them to explore their feelings without judgment. Frame it as an invitation, not a demand.
- If the mood is "grateful" or "calm," provide a prompt that helps them deepen that feeling.
- If the mood is "neutral" or "tired," ask a simple, low-pressure question to help them check in with themselves.

User's Mood: {{{mood}}}

Based on this mood, provide one creative and encouraging journal prompt:`,
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
