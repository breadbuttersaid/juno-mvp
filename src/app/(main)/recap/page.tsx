'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarCheck2, Loader2 } from 'lucide-react';
import { generateWeeklySummary } from '@/lib/actions/journal';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function WeeklyRecapPage() {
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSummary = async () => {
      setIsLoading(true);
      try {
        const result = await generateWeeklySummary();
        if (result.error) {
           toast({ title: 'Weekly Recap', description: result.error });
           setSummary(null); // Set to null to show the message
        } else {
          setSummary(result.summary || 'No summary could be generated.');
        }
      } catch (e) {
        toast({ title: 'Error', description: 'An unexpected error occurred while generating your weekly recap.', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSummary();
  }, [toast]);

  return (
    <div className="space-y-6">
       <div>
        <h1 className="text-3xl font-headline font-bold flex items-center gap-2">
            <CalendarCheck2 /> Weekly Recap
        </h1>
        <p className="text-muted-foreground">
            A look back at your week in thoughts and feelings.
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Your Emotional Summary</CardTitle>
          <CardDescription>
            An AI-powered look at your moods and themes from the last 7 days.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
            </div>
          ) : summary ? (
            <p className="text-foreground/80 whitespace-pre-wrap">{summary}</p>
          ) : (
             <p className="text-muted-foreground text-center py-8">
                Not enough entries in the last 7 days to generate a recap. Keep journaling!
              </p>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
