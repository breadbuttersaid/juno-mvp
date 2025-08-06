'use server';

/**
 * @fileOverview Generates contextual writing prompts based on what the user has already typed in their journal entry.
 * 
 * - generateWritingPrompts - A function that generates contextual prompts.
 * - GenerateWritingPromptsInput - The input type for the function.
 * - GenerateWritingPromptsOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const GenerateWritingPromptsInputSchema = z.object({
  entrySoFar: z.string().describe('The portion of the journal entry the user has written so far.'),
});
export type GenerateWritingPromptsInput = z.infer<typeof GenerateWritingPromptsInputSchema>;

export const GenerateWritingPromptsOutputSchema = z.object({
  prompts: z.array(z.string()).describe('An array of 2-3 short, relevant follow-up questions or prompts to help the user continue writing.'),
});
export type GenerateWritingPromptsOutput = z.infer<typeof GenerateWritingPromptsOutputSchema>;

export async function generateWritingPrompts(input: GenerateWritingPromptsInput): Promise<GenerateWritingPromptsOutput> {
  return generateWritingPromptsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'writingPromptsGenerator',
  input: { schema: GenerateWritingPromptsInputSchema },
  output: { schema: GenerateWritingPromptsOutputSchema },
  prompt: `You are a gentle and intuitive journal writing assistant. The user is writing a journal entry and might be stuck. 
  Your goal is to provide 2-3 short, thoughtful follow-up questions or prompts to help them dig deeper into their thoughts and feelings.

  - The prompts should be directly related to the content of their entry so far.
  - Keep the prompts concise and open-ended.
  - If the user's entry is very short or generic, provide some gentle, general prompts.
  - Frame the prompts as questions.

  Here is the user's journal entry so far:
  "{{{entrySoFar}}}"

  Based on this, generate your suggested prompts.`,
});


const generateWritingPromptsFlow = ai.defineFlow(
  {
    name: 'generateWritingPromptsFlow',
    inputSchema: GenerateWritingPromptsInputSchema,
    outputSchema: GenerateWritingPromptsOutputSchema,
  },
  async (input) => {
    // If the entry is too short, don't call the AI.
    if (input.entrySoFar.trim().length < 15) {
      return { prompts: [] };
    }
    const { output } = await prompt(input);
    return output!;
  }
);
