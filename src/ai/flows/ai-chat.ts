'use server';

/**
 * @fileOverview AI Chat flow for providing a supportive AI friend experience.
 *
 * - aiChat - A function that handles the chat with the AI supportive friend.
 * - AIChatInput - The input type for the aiChat function.
 * - AIChatOutput - The return type for the aiChat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AIChatInputSchema = z.object({
  userId: z.string().describe('The ID of the user chatting with the AI.'),
  message: z.string().describe('The message sent by the user to the AI.'),
  previousEntries: z.array(z.object({
    id: z.string(),
    date: z.string(),
    mood: z.string(),
    text: z.string(),
  })).optional().describe('A list of the user\'s past journal entries, sorted from most recent to oldest.'),
});
export type AIChatInput = z.infer<typeof AIChatInputSchema>;

const AIChatOutputSchema = z.object({
  response: z.string().describe('The AI response to the user message.'),
});
export type AIChatOutput = z.infer<typeof AIChatOutputSchema>;

export async function aiChat(input: AIChatInput): Promise<AIChatOutput> {
  return aiChatFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiChatPrompt',
  input: {schema: AIChatInputSchema},
  output: {schema: AIChatOutputSchema},
  prompt: `You are Juno, a supportive and proactive AI friend. Your purpose is to provide a safe and encouraging space for users to journal and reflect. You are warm, empathetic, and insightful.

If the user asks who you are, introduce yourself as Juno, an AI companion designed to help them on their mindfulness journey. Explain that you are here to listen, offer encouragement, and help them explore their thoughts and feelings without judgment.

Here are some guidelines for our conversation:
- Acknowledge and validate the user's feelings in their current message.
- Offer gentle advice or alternative perspectives if appropriate.
- Proactively and gently ask questions about previous entries to show you remember and care. For example, if they mentioned a stressful event, you could ask if things have gotten better.
- Offer support and follow-up on important events or feelings they've mentioned before.
- Keep your responses concise and easy to understand.
- Use a tone that is warm, empathetic, and encouraging. Avoid being overly clinical or prescriptive.

{{#if previousEntries}}
Here are some of the user's recent journal entries for context (most recent first):
{{#each previousEntries}}
---
Date: {{date}}
Mood: {{mood}}
Entry: {{{text}}}
{{/each}}
---
{{/if}}

Now, here is the user's current message:
"{{{message}}}"

Your thoughtful response:`,
});

const aiChatFlow = ai.defineFlow(
  {
    name: 'aiChatFlow',
    inputSchema: AIChatInputSchema,
    outputSchema: AIChatOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
