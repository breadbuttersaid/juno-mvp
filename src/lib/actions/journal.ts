'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { generateAffirmation } from '@/ai/flows/ai-affirmations';
import { summarizeEntries } from '@/ai/flows/ai-summaries';
import { generateSuggestions } from '@/ai/flows/activity-suggestions';
import { generateWeeklySummary as genWeeklySummary } from '@/ai/flows/weekly-summary';
import type { JournalEntry, ActivitySuggestion } from '../types';
import { subDays, isAfter } from 'date-fns';


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
  mood: z.enum(['happy', 'excited', 'neutral', 'sad', 'anxious', 'grateful', 'stressed', 'tired', 'calm', 'inspired']),
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
  
  cachedSummary = null;
  cachedSuggestions = null;

  revalidatePath('/journal');
  revalidatePath('/dashboard');
  revalidatePath('/insights');
  revalidatePath('/recap');
}


export async function getJournalEntries(): Promise<JournalEntry[]> {
    // Return a sorted copy to avoid mutating the original array
    return Promise.resolve([...mockDatabase].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
}

export async function getJournalEntry(id: string): Promise<JournalEntry | undefined> {
  return Promise.resolve(mockDatabase.find(entry => entry.id === id));
}

export async function updateJournalEntry(id: string, values: z.infer<typeof formSchema>) {
  const { content, mood } = values;
  const entryIndex = mockDatabase.findIndex(entry => entry.id === id);

  if (entryIndex === -1) {
    throw new Error('Entry not found');
  }

  const originalEntry = mockDatabase[entryIndex];
  mockDatabase[entryIndex] = {
    ...originalEntry,
    content,
    mood,
    // Preserve other fields
    updated_at: new Date().toISOString(),
  };
  
  // Optionally re-generate affirmation if content has changed
  if (originalEntry.content !== content) {
    generateAffirmation({ journalEntry: content }).then(({ affirmation }) => {
        mockDatabase[entryIndex].ai_affirmation = affirmation;
    });
  }

  cachedSummary = null;
  cachedSuggestions = null;

  revalidatePath('/journal');
  revalidatePath('/dashboard');
  revalidatePath('/insights');
  revalidatePath('/recap');
}

export async function deleteJournalEntry(id: string) {
  const entryIndex = mockDatabase.findIndex(entry => entry.id === id);
  if (entryIndex > -1) {
    mockDatabase.splice(entryIndex, 1);
  } else {
    throw new Error('Entry not found');
  }
  
  cachedSummary = null;
  cachedSuggestions = null;

  revalidatePath('/journal');
  revalidatePath('/dashboard');
  revalidatePath('/insights');
  revalidatePath('/recap');
}

let cachedSummary: { timestamp: number, summary: string } | null = null;
let lastEntryCountForSummary = -1;

export async function generateSummary(): Promise<{ summary?: string, error?: string }> {
    const entries = await getJournalEntries();

    if (entries.length === lastEntryCountForSummary && cachedSummary) {
      if (Date.now() - cachedSummary.timestamp < 5 * 60 * 1000) {
        return { summary: cachedSummary.summary };
      }
    }

    if (entries.length < 1) {
        return { error: 'Not enough entries to generate a summary. Write at least one entry to get started.' };
    }

    try {
        const { summary } = await summarizeEntries({ entries: entries.map(e => e.content) });
        
        lastEntryCountForSummary = entries.length;
        cachedSummary = { summary, timestamp: Date.now() };

        return { summary };
    } catch (e) {
        console.error("AI summary generation failed:", e);
        return { error: 'Failed to generate summary from AI.' };
    }
}

let cachedSuggestions: { timestamp: number, suggestions: ActivitySuggestion[] } | null = null;
let lastEntryCountForSuggestions = -1;

export async function generateActivitySuggestions(): Promise<{ suggestions?: ActivitySuggestion[], error?: string }> {
    const entries = await getJournalEntries();

    if (entries.length === lastEntryCountForSuggestions && cachedSuggestions) {
      if (Date.now() - cachedSuggestions.timestamp < 5 * 60 * 1000) {
        return { suggestions: cachedSuggestions.suggestions };
      }
    }

    if (entries.length < 3) {
        return { error: 'Not enough entries to generate suggestions. Write at least three entries to get started.' };
    }

    try {
        const result = await generateSuggestions({ entries: entries.slice(0, 5).map(e => e.content) });
        
        lastEntryCountForSuggestions = entries.length;
        cachedSuggestions = { suggestions: result.suggestions, timestamp: Date.now() };

        return { suggestions: result.suggestions };
    } catch (e) {
        console.error("AI suggestion generation failed:", e);
        return { error: 'Failed to generate suggestions from AI.' };
    }
}

export async function generateWeeklySummary(): Promise<{ summary?: string, error?: string }> {
    const allEntries = await getJournalEntries();
    const oneWeekAgo = subDays(new Date(), 7);

    const recentEntries = allEntries.filter(entry => 
        isAfter(new Date(entry.created_at), oneWeekAgo)
    );

    if (recentEntries.length < 3) {
        return { error: 'You need at least 3 journal entries in the last week to generate a summary.' };
    }

    try {
        const result = await genWeeklySummary({
            moods: recentEntries.map(e => e.mood),
            entries: recentEntries.map(e => e.content),
        });
        return { summary: result.summary };
    } catch (e) {
        console.error("AI weekly summary generation failed:", e);
        return { error: 'Failed to generate weekly summary from AI.' };
    }
}
