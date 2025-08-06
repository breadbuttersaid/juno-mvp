'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { generateAffirmation } from '@/ai/flows/ai-affirmations';
import { summarizeEntries } from '@/ai/flows/ai-summaries';
import type { JournalEntry } from '../types';

// This is a mock database. In a real application, you would use a proper database.
const mockDatabase: JournalEntry[] = [
    {
    id: '1',
    created_at: '2024-08-05T10:00:00Z',
    content: "Feeling really optimistic about the new project. Had a great brainstorming session with the team.",
    mood: 'excited',
    ai_affirmation: "It's wonderful that you're feeling so positive and energized. Your enthusiasm is a powerful asset. Keep nurturing that collaborative spirit!",
    user_id: '1',
  },
  {
    id: '2',
    created_at: '2024-08-04T14:30:00Z',
    content: "A bit of a slow day. Tried to focus but found my mind wandering. Watched a movie in the evening to relax.",
    mood: 'neutral',
    ai_affirmation: "It's okay to have days where focus doesn't come easily. Allowing yourself time to rest and recharge is just as productive as a busy day. Tomorrow is a new opportunity.",
    user_id: '1',
  },
  {
    id: '3',
    created_at: '2024-08-03T21:15:00Z',
    content: "Feeling a little down today. Thinking about past mistakes and feeling some regret. It's hard to shake off sometimes.",
    mood: 'sad',
    ai_affirmation: "It takes courage to confront difficult feelings. Remember that your past doesn't define your present or future. Be kind to yourself; you're navigating your journey with strength.",
    user_id: '1',
  }
];
let idCounter = 4;

const formSchema = z.object({
  mood: z.enum(['happy', 'excited', 'neutral', 'sad', 'anxious']),
  content: z.string().min(1, {
    message: 'Journal entry cannot be empty.',
  }),
});

export async function addJournalEntry(values: z.infer<typeof formSchema>) {
  const { content, mood } = values;

  const newEntry: JournalEntry = {
    id: (idCounter++).toString(),
    created_at: new Date().toISOString(),
    content,
    mood,
    ai_affirmation: null,
    user_id: '1', // Mock user ID
  };
  
  // Generate Affirmation and add to entry in background
  generateAffirmation({ journalEntry: content }).then(({ affirmation }) => {
    const entry = mockDatabase.find(e => e.id === newEntry.id);
    if (entry) {
        entry.ai_affirmation = affirmation;
    }
  });

  mockDatabase.unshift(newEntry);

  revalidatePath('/journal');
  revalidatePath('/dashboard');
  revalidatePath('/insights');

  return newEntry;
}


export async function getJournalEntries(): Promise<JournalEntry[]> {
    // Return a sorted copy to avoid mutating the original array
    return Promise.resolve([...mockDatabase].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
}

let cachedSummary: { timestamp: number, summary: string } | null = null;
let lastEntryCount = 0;


export async function generateSummary(): Promise<{ summary?: string, error?: string }> {
    const entries = await getJournalEntries();

    // If there are no new entries, return the cached summary if available
    if (entries.length === lastEntryCount && cachedSummary) {
      // Regenerate summary every 5 minutes to allow for affirmations to be added
      if (Date.now() - cachedSummary.timestamp < 5 * 60 * 1000) {
        return { summary: cachedSummary.summary };
      }
    }

    if (entries.length < 1) {
        return { error: 'Not enough entries to generate a summary. Write at least one entry to get started.' };
    }

    try {
        const { summary } = await summarizeEntries({ entries: entries.map(e => e.content) });
        
        // Cache the new summary and entry count
        lastEntryCount = entries.length;
        cachedSummary = { summary, timestamp: Date.now() };

        return { summary };
    } catch (e) {
        console.error("AI summary generation failed:", e);
        return { error: 'Failed to generate summary from AI.' };
    }
}