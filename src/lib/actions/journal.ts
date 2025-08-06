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
  mood: z.enum(['happy', 'sad', 'neutral']),
  content: z.string().min(10, {
    message: 'Journal entry must be at least 10 characters.',
  }),
});

export async function addJournalEntry(values: z.infer<typeof formSchema>) {
  // 1. Generate Affirmation
  const { affirmation } = await generateAffirmation({ journalEntry: values.content });

  // 2. Save entry to mock database
  const newEntry: JournalEntry = {
    id: (idCounter++).toString(),
    created_at: new Date().toISOString(),
    user_id: '1', // Mock user ID
    mood: values.mood,
    content: values.content,
    ai_affirmation: affirmation,
  };
  
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
        return { error: 'Not enough entries to generate a summary. Write at least one entry.' };
    }

    try {
        const { summary } = await summarizeEntries({ entries: entries.map(e => e.content) });
        return { summary };
    } catch (e) {
        console.error("AI summary generation failed:", e);
        return { error: 'Failed to generate summary from AI.' };
    }
}
