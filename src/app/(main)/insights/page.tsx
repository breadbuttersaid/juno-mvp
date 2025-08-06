'use client';

import { useState, useTransition, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BarChart3, Sparkles } from 'lucide-react';
import { getJournalEntries, generateSummary } from '@/lib/actions/journal';
import type { JournalEntry } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function InsightsPage() {
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSummary = async () => {
      setIsLoading(true);
      try {
        const result = await generateSummary();
        if (result.error) {
          // Don't show a toast for "not enough entries", just show the message.
          if (!result.error.includes('Not enough entries')) {
            toast({ title: 'Error', description: result.error, variant: 'destructive' });
          }
          setSummary(result.error);
        } else {
          setSummary(result.summary || 'No summary could be generated.');
        }
      } catch (e) {
        toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchSummary();
  }, [toast]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold flex items-center gap-2">
            <BarChart3 /> My Insights
          </h1>
          <p className="text-muted-foreground">
            Discover recurring themes and patterns in your journal.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Your Automated Summary
          </CardTitle>
          <CardDescription>
            Here is an AI-powered summary of all your entries, helping you get a deeper understanding of your journey.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
             <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
             </div>
          ) : (
            <p className="text-foreground/80 whitespace-pre-wrap">{summary}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
