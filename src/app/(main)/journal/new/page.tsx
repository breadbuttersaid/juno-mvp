'use client';

import { useState, useTransition } from 'react';
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
import { cn } from '@/lib/utils';
import { addJournalEntry } from '@/lib/actions/journal';
import { useToast } from '@/hooks/use-toast';

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

export default function NewJournalEntryPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mood: 'neutral',
      content: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
      try {
        await addJournalEntry(values);
        // Reset form for next entry, keeping the selected mood.
        form.reset({ mood: values.mood, content: '' }); 
        router.refresh(); // Refresh router to reflect new entry in other components
      } catch (error) {
        console.error('Failed to save entry', error);
        toast({
          title: 'Error',
          description: 'Could not save your entry. Please try again.',
          variant: 'destructive',
        });
      }
    });
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-3xl">New Journal Entry</CardTitle>
          <CardDescription>Capture your thoughts as they happen throughout the day.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="mood"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>How are you feeling right now?</FormLabel>
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
                    <FormLabel>What's on your mind?</FormLabel>
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
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Entry
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
}
