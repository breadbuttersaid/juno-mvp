'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, CalendarHeart, PlusCircle, ArrowRight } from 'lucide-react';
import type { JournalEntry } from '@/lib/types';
import { format, subDays, startOfWeek, endOfWeek, parseISO } from 'date-fns';
import { getJournalEntries } from '@/lib/actions/journal';
import Link from 'next/link';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
  ChartStyle,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

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

function MoodChart({ entries }: { entries: JournalEntry[] }) {
  const last7Days = Array.from({ length: 7 }).map((_, i) => subDays(new Date(), i)).reverse();

  const data = last7Days.map(date => {
    const entry = entries.find(e => format(parseISO(e.created_at), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'));
    return {
      date: format(date, 'EEE'),
      mood: entry ? entry.mood : 'none',
      value: entry ? { happy: 3, neutral: 2, sad: 1 }[entry.mood] : 0,
    };
  });

  const chartConfig = {
    value: {
      label: "Mood",
    },
    happy: {
      label: "Happy",
      color: "hsl(var(--chart-1))",
    },
    neutral: {
      label: "Neutral",
      color: "hsl(var(--chart-2))",
    },
    sad: {
      label: "Sad",
      color: "hsl(var(--chart-3))",
    },
     none: {
      label: "No Entry",
      color: "hsl(var(--muted))",
    }
  } satisfies ChartConfig;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Mood Tracker</CardTitle>
        <CardDescription>Your mood over the last 7 days.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
          <BarChart accessibilityLayer data={data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <YAxis hide={true} domain={[0, 3]} />
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Bar dataKey="value" radius={8}>
                {data.map((d) => (
                    <div key={d.date} style={{ '--color': `hsl(var(--${d.mood}))` }} />
                ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function RecentEntries({ entries }: { entries: JournalEntry[] }) {
  const recent = entries.slice(0, 3);
  return (
     <Card>
      <CardHeader>
        <CardTitle>Recent Entries</CardTitle>
        <CardDescription>A quick look at your latest thoughts.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {recent.length > 0 ? (
          recent.map(entry => (
            <div key={entry.id} className="p-4 rounded-lg border bg-secondary/30">
              <p className="font-semibold text-sm text-foreground mb-1">{format(parseISO(entry.created_at), 'MMMM d, yyyy')}</p>
              <p className="line-clamp-2 text-sm text-muted-foreground">{entry.content}</p>
            </div>
          ))
        ) : (
          <p className="text-muted-foreground text-sm">No recent entries. Start writing!</p>
        )}
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getJournalData() {
      try {
        const fetchedEntries = (await getJournalEntries()) as JournalEntry[];
        setEntries(fetchedEntries || []);
        setStreak(calculateStreak(fetchedEntries as Pick<JournalEntry, 'created_at'>[]));
      } catch (error) {
        console.error("Failed to fetch journal data", error);
      } finally {
        setLoading(false);
      }
    }
    getJournalData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-6 w-3/4" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
            <Skeleton className="h-40 lg:col-span-3" />
            <Skeleton className="h-64 md:col-span-2 lg:col-span-3" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome, friend!
        </h1>
        <p className="text-muted-foreground">
          Here's a look at your mindful journey.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Journaling Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-bold">{streak}</p>
            <p className="text-muted-foreground">{streak === 1 ? 'day in a row' : 'days in a row'}. Keep it up!</p>
          </CardContent>
        </Card>

        <Card className="flex flex-col justify-center items-center gap-4 bg-primary/10 border-primary/20">
            <CardContent className="pt-6 text-center">
                 <h2 className="text-2xl font-bold text-foreground">Ready to write?</h2>
                 <p className="text-muted-foreground mb-4">Create a new entry to capture your thoughts.</p>
                <Button asChild size="lg">
                <Link href="/journal/new">
                    <PlusCircle className="mr-2 h-5 w-5" />
                    New Journal Entry
                </Link>
                </Button>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Total Entries</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-5xl font-bold">{entries.length}</p>
                 <p className="text-muted-foreground">{entries.length === 1 ? 'entry so far' : 'entries so far'}.</p>
            </CardContent>
        </Card>
      
        <div className="md:col-span-2 lg:col-span-3">
             <MoodChart entries={entries} />
        </div>
        <div className="md:col-span-2 lg:col-span-3">
          <RecentEntries entries={entries} />
        </div>
        
      </div>
    </div>
  );
}
