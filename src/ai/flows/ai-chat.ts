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
  })).optional().describe('The previous journal entries of the user.'),
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
  prompt: `You are a supportive AI friend engaging in a conversation with a user who is journaling.
  Your goal is to provide encouragement, understanding, and helpful advice based on their journal entries and current message.

  Here are some guidelines for our conversation:
  - Acknowledge and validate the user's feelings.
  - Offer gentle advice or alternative perspectives.
  - Proactively ask questions about previous entries to show you remember and care.
  - Offer support and follow-up on important events or feelings they've mentioned before.
  - Keep your responses concise and easy to understand.
  - Use a tone that is warm, empathetic, and encouraging. Avoid being overly clinical or prescriptive.

  {% if previousEntries %}
  Previous Journal Entries:
  {% each previousEntries as |entry| %}
  Entry ID: {{entry.id}}
  Date: {{entry.date}}
  Mood: {{entry.mood}}
  Text: {{entry.text}}
  {% endeach %}
  {% endif %}

  User Message: {{{message}}}
  Response:
  `,
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
