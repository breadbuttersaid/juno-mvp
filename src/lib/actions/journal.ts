'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { generateAffirmation } from '@/ai/flows/ai-affirmations';
import { summarizeEntries } from '@/ai/flows/ai-summaries';
import type { JournalEntry } from '../types';

const formSchema = z.object({
  mood: z.enum(['happy', 'sad', 'neutral']),
  content: z.string().min(10, {
    message: 'Journal entry must be at least 10 characters.',
  }),
});

export async function addJournalEntry(values: z.infer<typeof formSchema>) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  // 1. Generate Affirmation
  const { affirmation } = await generateAffirmation({ journalEntry: values.content });

  // 2. Save entry to database
  const { data, error } = await supabase
    .from('journal_entries')
    .insert({
      user_id: user.id,
      mood: values.mood,
      content: values.content,
      ai_affirmation: affirmation,
    })
    .select()
    .single();

  if (error) {
    console.error('Supabase error:', error);
    throw new Error('Failed to save journal entry.');
  }

  revalidatePath('/journal');
  revalidatePath('/dashboard');

  return data as JournalEntry;
}


export async function getJournalEntries(): Promise<JournalEntry[]> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id);
    
    if (error) {
        console.error('Error fetching entries for summary:', error);
        return [];
    }
    return data || [];
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
