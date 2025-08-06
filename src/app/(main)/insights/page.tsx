'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BarChart3, Sparkles, WandSparkles } from 'lucide-react';
import { generateSummary, generateActivitySuggestions } from '@/lib/actions/journal';
import type { ActivitySuggestion } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function InsightsPage() {
  const [summary, setSummary] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<ActivitySuggestion[]>([]);
  const [isSummaryLoading, setIsSummaryLoading] = useState(true);
  const [areSuggestionsLoading, setAreSuggestionsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSummary = async () => {
      setIsSummaryLoading(true);
      try {
        const result = await generateSummary();
        if (result.error) {
          if (!result.error.includes('Not enough entries')) {
            toast({ title: 'Error', description: result.error, variant: 'destructive' });
          }
          setSummary(result.error);
        } else {
          setSummary(result.summary || 'No summary could be generated.');
        }
      } catch (e) {
        toast({ title: 'Error', description: 'An unexpected error occurred while generating summary.', variant: 'destructive' });
      } finally {
        setIsSummaryLoading(false);
      }
    };

    const fetchSuggestions = async () => {
      setAreSuggestionsLoading(true);
      try {
        const result = await generateActivitySuggestions();
        if (result.error) {
           if (!result.error.includes('Not enough entries')) {
            toast({ title: 'Error', description: result.error, variant: 'destructive' });
          }
          // Don't display "not enough entries" error for suggestions, just show empty state.
        } else {
          setSuggestions(result.suggestions || []);
        }
      } catch (e) {
         toast({ title: 'Error', description: 'An unexpected error occurred while generating suggestions.', variant: 'destructive' });
      } finally {
        setAreSuggestionsLoading(false);
      }
    };
    
    fetchSummary();
    fetchSuggestions();
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
      
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Your Automated Summary
            </CardTitle>
            <CardDescription>
              An AI-powered summary of your entries to help you get a deeper understanding of your journey.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isSummaryLoading ? (
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

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <WandSparkles className="h-5 w-5 text-primary" />
              Activity Suggestions
            </CardTitle>
            <CardDescription>
              Friendly suggestions from your AI companion based on your recent entries.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {areSuggestionsLoading ? (
               <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
               </div>
            ) : suggestions.length > 0 ? (
               suggestions.map((suggestion, index) => (
                <div key={index} className="p-3 rounded-lg border bg-secondary/30">
                  <p className="font-semibold text-sm text-foreground mb-1">{suggestion.title}</p>
                  <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm text-center py-8">
                Write a few more entries to get personalized activity suggestions.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
