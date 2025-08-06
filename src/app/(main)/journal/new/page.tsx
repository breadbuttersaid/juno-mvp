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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Sparkles, Wand2, Smile, Frown, Meh } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { JournalEntry } from '@/lib/types';
import { generateMoodBasedPrompt } from '@/ai/flows/mood-based-prompts';
import { addJournalEntry } from '@/lib/actions/journal';
import { useToast } from '@/hooks/use-toast';

const moods = [
  { value: 'happy', icon: Smile, label: 'Happy' },
  { value: 'sad', icon: Frown, label: 'Sad' },
  { value: 'neutral', icon: Meh, label: 'Neutral' },
] as const;

type Mood = (typeof moods)[number]['value'];

const formSchema = z.object({
  mood: z.enum(['happy', 'sad', 'neutral']),
  content: z.string().min(10, {
    message: 'Journal entry must be at least 10 characters.',
  }),
});

export default function NewJournalEntryPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isPromptLoading, setIsPromptLoading] = useTransition();
  const [affirmation, setAffirmation] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mood: 'neutral',
      content: '',
    },
  });

  async function handleGeneratePrompt() {
    setIsPromptLoading(async () => {
      try {
        const { prompt } = await generateMoodBasedPrompt({ mood: form.getValues('mood') });
        form.setValue('content', form.getValues('content') + prompt);
      } catch (error) {
        console.error('Failed to generate prompt', error);
        toast({
          title: 'Error',
          description: 'Could not generate a prompt. Please try again.',
          variant: 'destructive',
        });
      }
    });
  }

  function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
      try {
        const newEntry = await addJournalEntry(values);
        if (newEntry?.ai_affirmation) {
          setAffirmation(newEntry.ai_affirmation);
        } else {
          router.push('/journal');
        }
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
          <CardDescription>How are you feeling today? Capture your thoughts.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="mood"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select your mood</FormLabel>
                    <FormControl>
                      <div className="flex gap-2 pt-2">
                        {moods.map((mood) => (
                          <Button
                            key={mood.value}
                            type="button"
                            variant={field.value === mood.value ? 'default' : 'outline'}
                            onClick={() => field.onChange(mood.value)}
                            className={cn('flex-1 justify-center gap-2', {
                              'bg-primary/20 text-primary-foreground': field.value === mood.value
                            })}
                          >
                            <mood.icon className="h-5 w-5" />
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
                    <div className="flex justify-between items-center">
                      <FormLabel>Your entry</FormLabel>
                      <Button type="button" variant="ghost" size="sm" onClick={handleGeneratePrompt} disabled={isPromptLoading}>
                        {isPromptLoading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Wand2 className="mr-2 h-4 w-4" />
                        )}
                        Generate Prompt
                      </Button>
                    </div>
                    <FormControl>
                      <Textarea placeholder="Tell me about your day..." rows={10} {...field} />
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

      <Dialog open={!!affirmation} onOpenChange={() => { setAffirmation(null); router.push('/journal'); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-headline text-2xl">
              <Sparkles className="h-6 w-6 text-primary" />
              A Thought For You
            </DialogTitle>
            <DialogDescription className="pt-4 text-foreground/80 text-base">
              {affirmation}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
