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
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Loader2, Smile, Frown, Meh, Sparkles, Heart } from 'lucide-react';
import { addJournalEntry, updateJournalEntry } from '@/lib/actions/journal';
import { useToast } from '@/hooks/use-toast';
import type { JournalEntry } from '@/lib/types';

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

type JournalFormProps = {
    entry: JournalEntry | null;
    onSave: () => void;
    onCancel: () => void;
};

export function JournalForm({ entry, onSave, onCancel }: JournalFormProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const isEditing = !!entry;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mood: entry?.mood || 'neutral',
      content: entry?.content || '',
    },
  });
  
  useEffect(() => {
    form.reset({
      mood: entry?.mood || 'neutral',
      content: entry?.content || '',
    });
  }, [entry, form]);


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
                    placeholder="Let it all out..." 
                    rows={6} 
                    {...field} />
                </FormControl>
                <FormMessage />
            </FormItem>
            )}
        />
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
