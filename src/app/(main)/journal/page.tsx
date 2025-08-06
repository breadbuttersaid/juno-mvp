'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Smile, Frown, Meh, Sparkles, Heart } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { JournalEntry } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { getJournalEntries } from '@/lib/actions/journal';
import { JournalEntryActions } from '@/components/journal-entry-actions';
import { JournalForm } from '@/components/journal-form';
import { Dialog, DialogContent } from '@/components/ui/dialog';

function MoodIcon({ mood, className }: { mood: JournalEntry['mood']; className?: string }) {
  const props = { className: className || 'h-5 w-5' };
  switch (mood) {
    case 'happy':
      return <Smile {...props} />;
    case 'excited':
      return <Sparkles {...props} />;
    case 'sad':
      return <Frown {...props} />;
    case 'anxious':
      return <Heart {...props} />;
    case 'neutral':
      return <Meh {...props} />;
    default:
      return null;
  }
}

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

  useEffect(() => {
    async function fetchEntries() {
      const fetchedEntries = await getJournalEntries();
      setEntries(fetchedEntries);
    }
    fetchEntries();
  }, [isDialogOpen]); // Refetch when dialog closes

  const handleNewEntry = () => {
    setSelectedEntry(null);
    setIsDialogOpen(true);
  };

  const handleEditEntry = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    setIsDialogOpen(true);
  };
  
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedEntry(null);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-headline font-bold">My Journal</h1>
            <p className="text-muted-foreground">A collection of your thoughts and feelings.</p>
          </div>
          <Button onClick={handleNewEntry}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Entry
          </Button>
        </div>
        
        {entries.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <h2 className="text-xl font-semibold">No entries yet</h2>
            <p className="text-muted-foreground mt-2">Start your journey by writing your first entry.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {entries.map(entry => (
              <Card key={entry.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="font-headline text-2xl">
                        {format(parseISO(entry.created_at), 'MMMM d, yyyy')}
                      </CardTitle>
                      <CardDescription>
                        {format(parseISO(entry.created_at), 'eeee, p')}
                      </CardDescription>
                    </div>
                     <div className="flex items-center gap-4">
                       <Badge variant="secondary" className="capitalize flex items-center gap-1.5 py-1 px-2.5">
                        <MoodIcon mood={entry.mood} className="h-4 w-4" />
                        <span>{entry.mood}</span>
                       </Badge>
                       <JournalEntryActions entry={entry} onEdit={handleEditEntry} />
                     </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-3 text-foreground/80 whitespace-pre-wrap">{entry.content}</p>
                </CardContent>
                {entry.content.length > 200 && ( // Example length check
                   <CardFooter>
                     <Button variant="link" asChild className="p-0 h-auto">
                        {/* In a real app, you might open a detail view */}
                        <div>Read more</div>
                     </Button>
                  </CardFooter>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
              <JournalForm 
                entry={selectedEntry} 
                onSave={handleCloseDialog}
                onCancel={handleCloseDialog}
               />
          </DialogContent>
      </Dialog>
    </>
  );
}
