import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trophy, CalendarHeart } from 'lucide-react';
import type { JournalEntry } from '@/lib/types';
import { generateWeeklySummary } from '@/ai/flows/weekly-summary';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';

async function getJournalData() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { entries: [], streak: 0 };

  const { data: entries, error } = await supabase
    .from('journal_entries')
    .select('id, created_at, mood, content')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching entries:', error);
    return { entries: [], streak: 0 };
  }

  const streak = calculateStreak(entries as Pick<JournalEntry, 'created_at'>[]);
  return { entries: (entries as JournalEntry[]) || [], streak };
}

function calculateStreak(entries: Pick<JournalEntry, 'created_at'>[]): number {
  if (entries.length === 0) return 0;

  const entryDates = new Set(
    entries.map((entry) => new Date(entry.created_at).toDateString())
  );

  let currentStreak = 0;
  let currentDate = new Date();

  // Check for today's entry
  if (entryDates.has(currentDate.toDateString())) {
    currentStreak++;
  } else {
    // If no entry today, check starting from yesterday
    currentDate.setDate(currentDate.getDate() - 1);
  }

  while (entryDates.has(currentDate.toDateString())) {
    currentStreak++;
    currentDate.setDate(currentDate.getDate() - 1);
  }
  
  return currentStreak;
}


async function WeeklySummary({ entries }: { entries: JournalEntry[] }) {
  const today = new Date();
  const startOfThisWeek = startOfWeek(today, { weekStartsOn: 1 });
  const endOfThisWeek = endOfWeek(today, { weekStartsOn: 1 });

  const weeklyEntries = entries.filter(entry => {
    const entryDate = new Date(entry.created_at);
    return entryDate >= startOfThisWeek && entryDate <= endOfThisWeek;
  });

  if (weeklyEntries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-headline">
            <CalendarHeart className="h-5 w-5" />
            Your Weekly Summary
          </CardTitle>
          <CardDescription>
            {format(startOfThisWeek, 'MMM d')} - {format(endOfThisWeek, 'MMM d')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No entries this week. Write a journal entry to get your first summary!
          </p>
        </CardContent>
      </Card>
    );
  }

  const { summary } = await generateWeeklySummary({
    moods: weeklyEntries.map(e => e.mood),
    entries: weeklyEntries.map(e => e.content),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline">
          <CalendarHeart className="h-5 w-5" />
          Your Weekly Summary
        </CardTitle>
         <CardDescription>
          {format(startOfThisWeek, 'MMM d')} - {format(endOfThisWeek, 'MMM d')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-foreground/80 whitespace-pre-wrap">{summary}</p>
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const { entries, streak } = await getJournalData();
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-headline font-bold">
        Welcome, {user?.email?.split('@')[0] || 'friend'}!
      </h1>
      <p className="text-muted-foreground">
        Here's a look at your mindful journey.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
              <Trophy className="h-5 w-5" />
              Journaling Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-bold">{streak}</p>
            <p className="text-muted-foreground">{streak === 1 ? 'day in a row' : 'days in a row'}. Keep it up!</p>
          </CardContent>
        </Card>
        
        <WeeklySummary entries={entries} />
      </div>
    </div>
  );
}
