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
    newEntry.ai_affirmation = affirmation;
  });

  mockDatabase.unshift(newEntry);

  revalidatePath('/journal');
  revalidatePath('/dashboard');

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
