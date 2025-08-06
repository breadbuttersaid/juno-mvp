'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BarChart3, Sparkles } from 'lucide-react';
import { getJournalEntries, generateSummary } from '@/lib/actions/journal';
import type { JournalEntry } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export default function InsightsPage() {
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, startTransition] = useTransition();
  const { toast } = useToast();

  const handleGenerateSummary = async () => {
    startTransition(async () => {
      try {
        const result = await generateSummary();
        if (result.error) {
          toast({ title: 'Error', description: result.error, variant: 'destructive' });
        } else {
          setSummary(result.summary || 'No summary could be generated.');
        }
      } catch (e) {
        toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold flex items-center gap-2">
            <BarChart3 /> AI Insights
          </h1>
          <p className="text-muted-foreground">
            Discover recurring themes and patterns in your journal.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Journal Summary</CardTitle>
          <CardDescription>
            Generate an AI-powered summary of all your entries to get a deeper understanding of your journey.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleGenerateSummary} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Summary of All Entries'
            )}
          </Button>

          {summary && (
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline text-xl">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Your Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/80 whitespace-pre-wrap">{summary}</p>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
