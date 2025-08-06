'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { generateAffirmation } from '@/ai/flows/ai-affirmations';
import { summarizeEntries } from '@/ai/flows/ai-summaries';
import type { JournalEntry } from '../types';

// This is a mock database. In a real application, you would use a proper database.
const mockDatabase: JournalEntry[] = [];
let idCounter = 1;

const formSchema = z.object({
  mood: z.enum(['happy', 'excited', 'neutral', 'sad', 'anxious']),
  content: z.string().min(1, {
    message: 'Journal entry cannot be empty.',
  }),
});

export async function addJournalEntry(values: z.infer<typeof formSchema>) {
  // 1. Generate Affirmation (optional, can be done in background)
  const affirmationPromise = generateAffirmation({ journalEntry: values.content });

  // 2. Save entry to mock database
  const newEntry: JournalEntry = {
    id: (idCounter++).toString(),
    created_at: new Date().toISOString(),
    user_id: '1', // Mock user ID
    mood: values.mood,
    content: values.content,
    ai_affirmation: null, // Set initially to null
  };
  
  mockDatabase.unshift(newEntry);

  // Don't wait for affirmation to revalidate, makes UI faster
  revalidatePath('/journal');
  revalidatePath('/dashboard');

  // Update entry with affirmation once it's ready
  affirmationPromise.then(({ affirmation }) => {
    const entryIndex = mockDatabase.findIndex(e => e.id === newEntry.id);
    if (entryIndex !== -1) {
      mockDatabase[entryIndex].ai_affirmation = affirmation;
    }
  });


  return newEntry;
}


export async function getJournalEntries(): Promise<JournalEntry[]> {
    return Promise.resolve(mockDatabase);
}

export async function generateSummary(): Promise<{ summary?: string, error?: string }> {
    const entries = await getJournalEntries();

    if (entries.length < 1) {
        return { error: 'Not enough entries to generate a summary. Write at least one entry to get started.' };
    }

    try {
        const { summary } = await summarizeEntries({ entries: entries.map(e => e.content) });
        return { summary };
    } catch (e) {
        console.error("AI summary generation failed:", e);
        return { error: 'Failed to generate summary from AI.' };
    }
}
