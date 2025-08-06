'use client';

import { useState, useTransition, useEffect } from 'react';
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
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Smile, Frown, Meh, Sparkles, Heart, HandHeart, Zap, BatteryLow, Feather, Lightbulb, WandSparkles } from 'lucide-react';
import { addJournalEntry, updateJournalEntry, generateMoodBasedPromptAction } from '@/lib/actions/journal';
import { useToast } from '@/hooks/use-toast';
import type { JournalEntry } from '@/lib/types';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

const moods = [
  { value: 'happy', icon: Smile, label: 'Happy' },
  { value: 'excited', icon: Sparkles, label: 'Excited' },
  { value: 'neutral', icon: Meh, label: 'Neutral' },
  { value: 'sad', icon: Frown, label: 'Sad' },
  { value: 'anxious', icon: Heart, label: 'Anxious' },
  { value: 'grateful', icon: HandHeart, label: 'Grateful' },
  { value: 'stressed', icon: Zap, label: 'Stressed' },
  { value: 'tired', icon: BatteryLow, label: 'Tired' },
  { value: 'calm', icon: Feather, label: 'Calm' },
  { value: 'inspired', icon: Lightbulb, label: 'Inspired' },
] as const;

type MoodValue = typeof moods[number]['value'];

const formSchema = z.object({
  mood: z.enum(moods.map(m => m.value) as [MoodValue, ...MoodValue[]]),
  content: z.string().min(1, {
    message: 'Journal entry cannot be empty.',
  }),
});

type JournalFormProps = {
    entry: JournalEntry | null;
    onSave: () => void;
    onCancel: () => void;
};

export function JournalForm({ entry, onSave, onCancel }: JournalFormProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isPromptLoading, setIsPromptLoading] = useState(false);
  const [prompt, setPrompt] = useState<string | null>(null);
  const isEditing = !!entry;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mood: entry?.mood || 'neutral',
      content: entry?.content || '',
    },
  });
  
  const selectedMood = form.watch('mood');

  useEffect(() => {
    form.reset({
      mood: entry?.mood || 'neutral',
      content: entry?.content || '',
    });
    setPrompt(null);
  }, [entry, form]);
  
  useEffect(() => {
    if (isEditing) return; // Don't fetch prompts when editing

    const getPrompt = async () => {
      setIsPromptLoading(true);
      setPrompt(null);
      try {
        const result = await generateMoodBasedPromptAction({ mood: selectedMood });
        if (result.prompt) {
          setPrompt(result.prompt);
        }
      } catch (error) {
        console.error("Failed to get prompt", error);
      } finally {
        setIsPromptLoading(false);
      }
    };

    getPrompt();
  }, [selectedMood, isEditing]);


  function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
      try {
        if (isEditing) {
          await updateJournalEntry(entry.id, values);
          toast({
            title: 'Success',
            description: 'Your journal entry has been updated.',
          });
        } else {
          await addJournalEntry(values);
          toast({
            title: 'Success',
            description: 'Your journal entry has been saved.',
          });
        }
        onSave();
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

  const handleInsertPrompt = () => {
    if (prompt) {
      const currentContent = form.getValues('content');
      form.setValue('content', currentContent ? `${currentContent}\n\n${prompt}` : prompt);
    }
  };

  return (
    <>
    <DialogHeader>
        <DialogTitle>{isEditing ? 'Edit Entry' : 'New Entry'}</DialogTitle>
        <DialogDescription>
            {isEditing ? 'Make changes to your entry.' : 'Capture your thoughts for today.'}
        </DialogDescription>
    </DialogHeader>
    <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
        <FormField
            control={form.control}
            name="mood"
            render={({ field }) => (
            <FormItem>
                <FormLabel>How are you feeling?</FormLabel>
                <FormControl>
                <div className="flex flex-wrap gap-2 pt-2">
                    {moods.map((mood) => (
                    <Button
                        key={mood.value}
                        type="button"
                        variant={field.value === mood.value ? 'default' : 'outline'}
                        onClick={() => field.onChange(mood.value)}
                        className="flex-grow sm:flex-grow-0"
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
                    placeholder="Let it all out..." 
                    rows={6} 
                    {...field} />
                </FormControl>
                <FormMessage />
            </FormItem>
            )}
        />

        <AnimatePresence>
          {!isEditing && (isPromptLoading || prompt) && (
             <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-sm p-3 bg-secondary/50 border border-secondary rounded-lg"
              >
              {isPromptLoading ? (
                 <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Generating a prompt for you...</span>
                 </div>
              ) : prompt ? (
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                      <p className="font-medium flex items-center gap-2 mb-1 text-primary">
                          <WandSparkles className="h-4 w-4" />
                          AI Suggestion
                      </p>
                      <p className="text-muted-foreground">{prompt}</p>
                  </div>
                  <Button type="button" size="sm" variant="outline" onClick={handleInsertPrompt}>Insert</Button>
                </div>
              ) : null}
             </motion.div>
          )}
        </AnimatePresence>

        <DialogFooter>
            <Button variant="outline" type="button" onClick={onCancel} disabled={isPending}>
                Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Save Changes' : 'Save Entry'}
            </Button>
        </DialogFooter>
        </form>
    </Form>
    </>
  );
}
