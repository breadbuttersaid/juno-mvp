'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { generateAffirmation } from '@/ai/flows/ai-affirmations';
import { summarizeEntries } from '@/ai/flows/ai-summaries';
import type { JournalEntry } from '../types';
import { createClient } from '@supabase/supabase-js'

// This is a mock database. In a real application, you would use a proper database.
const mockDatabase: JournalEntry[] = [];
let idCounter = 1;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);


const formSchema = z.object({
  mood: z.enum(['happy', 'excited', 'neutral', 'sad', 'anxious']),
  content: z.string().min(1, {
    message: 'Journal entry cannot be empty.',
  }),
});

export async function addJournalEntry(values: z.infer<typeof formSchema>) {
  const { content, mood } = values;

  // 1. Generate Affirmation (optional, can be done in background)
  const affirmationPromise = generateAffirmation({ journalEntry: content });

  // 2. Save entry to Supabase
  const { data, error } = await supabase
    .from('journal_entries')
    .insert([{ 
      content, 
      mood,
      user_id: '1' // Mock user ID
    }])
    .select()
    .single();

  if (error) {
    console.error('Error saving journal entry:', error);
    throw new Error('Failed to save journal entry.');
  }

  const newEntry: JournalEntry = {
      ...data,
      created_at: data.created_at!,
      ai_affirmation: null,
  };

  // Don't wait for affirmation to revalidate, makes UI faster
  revalidatePath('/journal');
  revalidatePath('/dashboard');

  // Update entry with affirmation once it's ready
  affirmationPromise.then(async ({ affirmation }) => {
     await supabase
      .from('journal_entries')
      .update({ ai_affirmation: affirmation })
      .eq('id', newEntry.id);
  });

  return newEntry;
}


export async function getJournalEntries(): Promise<JournalEntry[]> {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching entries:', error);
        return [];
    }
    return data as JournalEntry[];
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
