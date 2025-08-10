'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { generateAffirmation } from '@/ai/flows/ai-affirmations';
import { summarizeEntries } from '@/ai/flows/ai-summaries';
import { generateSuggestions } from '@/ai/flows/activity-suggestions';
import { generateWeeklySummary as genWeeklySummary } from '@/ai/flows/weekly-summary';
import { generateMoodBasedPrompt } from '@/ai/flows/mood-based-prompts';
import { generateWritingPrompts } from '@/ai/flows/writing-prompts';
import type { JournalEntry, ActivitySuggestion } from '../types';
import { subDays, isAfter, formatISO } from 'date-fns';
import { getUserFromCookie } from '@/lib/auth';
import { cookies } from 'next/headers';


// This is a mock database. In a real application, you would use a proper database.
const mockDatabase: { [userId: string]: JournalEntry[] } = {
  '1': [ // Pre-populate for the default user
    {
      id: '1',
      created_at: formatISO(subDays(new Date(), 1)),
      content: "Feeling really optimistic about the new project. Had a great brainstorming session with the team.",
      mood: 'excited',
      ai_affirmation: "It's wonderful that you're feeling so positive and energized. Your enthusiasm is a powerful asset. Keep nurturing that collaborative spirit!",
      user_id: '1',
    },
    {
      id: '2',
      created_at: formatISO(subDays(new Date(), 2)),
      content: "A bit of a slow day. Tried to focus but found my mind wandering. Watched a movie in the evening to relax.",
      mood: 'neutral',
      ai_affirmation: "It's okay to have days where focus doesn't come easily. Allowing yourself time to rest and recharge is just as productive as a busy day. Tomorrow is a new opportunity.",
      user_id: '1',
    },
    {
      id: '3',
      created_at: formatISO(subDays(new Date(), 3)),
      content: "Feeling a little down today. Thinking about past mistakes and feeling some regret. It's hard to shake off sometimes.",
      mood: 'sad',
      ai_affirmation: "It takes courage to confront difficult feelings. Remember that your past doesn't define your present or future. Be kind to yourself; you're navigating your journey with strength.",
      user_id: '1',
    }
  ]
};

let idCounter = 4;
// Caching needs to be per-user or disabled in a multi-user context.
// For simplicity in this mock setup, we'll keep it simple, but this is a critical consideration.
let cachedSummaries: { [userId: string]: { timestamp: number, summary: string, entryCount: number } } = {};
let cachedSuggestions: { [userId: string]: { timestamp: number, suggestions: ActivitySuggestion[], entryCount: number } } = {};


const formSchema = z.object({
  mood: z.enum(['happy', 'excited', 'neutral', 'sad', 'anxious', 'grateful', 'stressed', 'tired', 'calm', 'inspired']),
  content: z.string().min(1, {
    message: 'Journal entry cannot be empty.',
  }),
});

async function getUserId(): Promise<string | null> {
    const user = await getUserFromCookie(cookies());
    return user ? user.id : null;
}

export async function addJournalEntry(values: z.infer<typeof formSchema>) {
  const userId = await getUserId();
  if (!userId) throw new Error('User not authenticated');

  const { content, mood } = values;

  const newEntry: JournalEntry = {
    id: (idCounter++).toString(),
    created_at: new Date().toISOString(),
    content,
    mood,
    ai_affirmation: null,
    user_id: userId,
  };
  
  generateAffirmation({ journalEntry: content }).then(({ affirmation }) => {
    const userEntries = mockDatabase[userId];
    if (userEntries) {
      const entry = userEntries.find(e => e.id === newEntry.id);
      if (entry) {
          entry.ai_affirmation = affirmation;
      }
    }
  });
  
  if (!mockDatabase[userId]) {
    mockDatabase[userId] = [];
  }
  mockDatabase[userId].unshift(newEntry);
  
  // Invalidate user-specific cache
  delete cachedSummaries[userId];
  delete cachedSuggestions[userId];

  revalidatePath('/journal');
  revalidatePath('/dashboard');
  revalidatePath('/insights');
  revalidatePath('/recap');
}


export async function getJournalEntries(): Promise<JournalEntry[]> {
    const userId = await getUserId();
    if (!userId) return [];
    
    const userEntries = mockDatabase[userId] || [];
    return [...userEntries].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function getJournalEntry(id: string): Promise<JournalEntry | undefined> {
  const userId = await getUserId();
  if (!userId) return undefined;
  
  return (mockDatabase[userId] || []).find(entry => entry.id === id);
}

export async function updateJournalEntry(id: string, values: z.infer<typeof formSchema>) {
  const userId = await getUserId();
  if (!userId) throw new Error('User not authenticated');

  const { content, mood } = values;
  const userEntries = mockDatabase[userId] || [];
  const entryIndex = userEntries.findIndex(entry => entry.id === id);

  if (entryIndex === -1) {
    throw new Error('Entry not found');
  }

  const originalEntry = userEntries[entryIndex];
  mockDatabase[userId][entryIndex] = {
    ...originalEntry,
    content,
    mood,
    updated_at: new Date().toISOString(),
  };
  
  if (originalEntry.content !== content) {
    generateAffirmation({ journalEntry: content }).then(({ affirmation }) => {
        mockDatabase[userId][entryIndex].ai_affirmation = affirmation;
    });
  }

  delete cachedSummaries[userId];
  delete cachedSuggestions[userId];

  revalidatePath('/journal');
  revalidatePath('/dashboard');
  revalidatePath('/insights');
  revalidatePath('/recap');
}

export async function deleteJournalEntry(id: string) {
  const userId = await getUserId();
  if (!userId) throw new Error('User not authenticated');
  
  const userEntries = mockDatabase[userId] || [];
  const entryIndex = userEntries.findIndex(entry => entry.id === id);

  if (entryIndex > -1) {
    mockDatabase[userId].splice(entryIndex, 1);
  } else {
    throw new Error('Entry not found');
  }
  
  delete cachedSummaries[userId];
  delete cachedSuggestions[userId];

  revalidatePath('/journal');
  revalidatePath('/dashboard');
  revalidatePath('/insights');
  revalidatePath('/recap');
}

export async function generateSummary(): Promise<{ summary?: string, error?: string }> {
    const userId = await getUserId();
    if (!userId) return { error: 'User not authenticated' };

    const entries = await getJournalEntries();
    const cached = cachedSummaries[userId];
    
    if (cached && cached.entryCount === entries.length) {
      if (Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5-minute cache
        return { summary: cached.summary };
      }
    }

    if (entries.length < 1) {
        return { error: 'Not enough entries to generate a summary. Write at least one entry to get started.' };
    }

    try {
        const { summary } = await summarizeEntries({ entries: entries.map(e => e.content) });
        
        cachedSummaries[userId] = { summary, timestamp: Date.now(), entryCount: entries.length };
        return { summary };
    } catch (e) {
        console.error("AI summary generation failed:", e);
        return { error: 'Failed to generate summary from AI.' };
    }
}

export async function generateActivitySuggestions(): Promise<{ suggestions?: ActivitySuggestion[], error?: string }> {
    const userId = await getUserId();
    if (!userId) return { error: 'User not authenticated' };
    
    const entries = await getJournalEntries();
    const cached = cachedSuggestions[userId];

    if (cached && cached.entryCount === entries.length) {
       if (Date.now() - cached.timestamp < 5 * 60 * 1000) {
        return { suggestions: cached.suggestions };
      }
    }
    
    if (entries.length < 3) {
        return { error: 'Not enough entries to generate suggestions. Write at least three entries to get started.' };
    }

    try {
        const result = await generateSuggestions({ entries: entries.slice(0, 5).map(e => e.content) });
        
        cachedSuggestions[userId] = { suggestions: result.suggestions, timestamp: Date.now(), entryCount: entries.length };

        return { suggestions: result.suggestions };
    } catch (e) {
        console.error("AI suggestion generation failed:", e);
        return { error: 'Failed to generate suggestions from AI.' };
    }
}

export async function generateWeeklySummary(): Promise<{ summary?: string, error?: string }> {
    const userId = await getUserId();
    if (!userId) return { error: 'User not authenticated' };

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


const moodPromptSchema = z.object({
  mood: z.enum(['happy', 'excited', 'neutral', 'sad', 'anxious', 'grateful', 'stressed', 'tired', 'calm', 'inspired']),
});

export async function generateMoodBasedPromptAction(values: z.infer<typeof moodPromptSchema>): Promise<{ prompt?: string, error?: string}> {
  try {
    const result = await generateMoodBasedPrompt({ mood: values.mood });
    return { prompt: result.prompt };
  } catch (e) {
    console.error("Mood prompt generation failed:", e);
    return { error: 'Failed to generate prompt from AI.' };
  }
}

const GenerateWritingPromptsInputSchema = z.object({
  entrySoFar: z.string().describe('The portion of the journal entry the user has written so far.'),
});

export async function generateWritingPromptsAction(values: z.infer<typeof GenerateWritingPromptsInputSchema>): Promise<{ prompts?: string[], error?: string}> {
  try {
    const result = await generateWritingPrompts({ entrySoFar: values.entrySoFar });
    return { prompts: result.prompts };
  } catch (e) {
    console.error("Writing prompt generation failed:", e);
    return { error: 'Failed to generate prompts from AI.' };
  }
}
