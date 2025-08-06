'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Smile, Frown, Meh, Sparkles, Heart } from 'lucide-react';
import { getJournalEntry, updateJournalEntry } from '@/lib/actions/journal';
import { useToast } from '@/hooks/use-toast';
import type { JournalEntry } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

const moods = [
  { value: 'happy', icon: Smile, label: 'Happy' },
  { value: 'excited', icon: Sparkles, label: 'Excited' },
  { value: 'neutral', icon: Meh, label: 'Neutral' },
  { value: 'sad', icon: Frown, label: 'Sad' },
  { value: 'anxious', icon: Heart, label: 'Anxious' },
] as const;

const formSchema = z.object({
  mood: z.enum(['happy', 'excited', 'neutral', 'sad', 'anxious']),
  content: z.string().min(1, {
    message: 'Journal entry cannot be empty.',
  }),
});

export default function EditJournalEntryPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mood: 'neutral',
      content: '',
    },
  });

  useEffect(() => {
    const fetchEntry = async () => {
      setIsLoading(true);
      const entry = await getJournalEntry(params.id);
      if (entry) {
        form.reset({
          mood: entry.mood,
          content: entry.content,
        });
      } else {
         toast({
          title: 'Error',
          description: 'Journal entry not found.',
          variant: 'destructive',
        });
        router.push('/journal');
      }
      setIsLoading(false);
    };
    fetchEntry();
  }, [params.id, form, router, toast]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
      try {
        await updateJournalEntry(params.id, values);
        toast({
          title: 'Success',
          description: 'Your journal entry has been updated.',
        });
      } catch (error) {
        console.error('Failed to update entry', error);
        toast({
          title: 'Error',
          description: 'Could not update your entry. Please try again.',
          variant: 'destructive',
        });
      }
    });
  }
  
  if (isLoading) {
      return (
          <Card>
              <CardHeader>
                  <Skeleton className="h-8 w-1/2" />
                  <Skeleton className="h-4 w-3/4" />
              </CardHeader>
              <CardContent className="space-y-8">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <div className="flex gap-2">
                        <Skeleton className="h-10 w-24" />
                        <Skeleton className="h-10 w-24" />
                        <Skeleton className="h-10 w-24" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                   <Skeleton className="h-10 w-32" />
              </CardContent>
          </Card>
      )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Edit Journal Entry</CardTitle>
          <CardDescription>Make changes to your past thoughts and feelings.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="mood"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>How were you feeling?</FormLabel>
                    <FormControl>
                      <div className="flex flex-wrap gap-2 pt-2">
                        {moods.map((mood) => (
                           <Button
                            key={mood.value}
                            type="button"
                            variant={field.value === mood.value ? 'default' : 'outline'}
                            onClick={() => field.onChange(mood.value)}
                            className="flex-1 min-w-[100px]"
                          >
                            <mood.icon className="mr-2 h-5 w-5" />
                            <span>{mood.label}</span>
                          </Button>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What was on your mind?</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Let it all out... the good, the bad, and everything in between." 
                        rows={8} 
                        {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-2">
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => router.back()} disabled={isPending}>
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
}
