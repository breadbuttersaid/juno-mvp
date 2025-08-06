import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Smile, Frown, Meh } from 'lucide-react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import type { JournalEntry } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { getJournalEntries } from '@/lib/actions/journal';

function MoodIcon({ mood, className }: { mood: JournalEntry['mood']; className?: string }) {
  const props = { className: className || 'h-5 w-5' };
  switch (mood) {
    case 'happy':
      return <Smile {...props} />;
    case 'sad':
      return <Frown {...props} />;
    case 'neutral':
      return <Meh {...props} />;
    default:
      return null;
  }
}

export default async function JournalPage() {
  const entries = await getJournalEntries();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold">My Journal</h1>
          <p className="text-muted-foreground">A collection of your thoughts and feelings.</p>
        </div>
        <Button asChild>
          <Link href="/journal/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Entry
          </Link>
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
                   <Badge variant="secondary" className="capitalize flex items-center gap-1.5 py-1 px-2.5">
                    <MoodIcon mood={entry.mood} className="h-4 w-4" />
                    <span>{entry.mood}</span>
                   </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-3 text-foreground/80 whitespace-pre-wrap">{entry.content}</p>
              </CardContent>
              <CardFooter>
                 <Button variant="link" asChild className="p-0 h-auto">
                    <Link href={`/journal?view=${entry.id}`} scroll={false}>Read more</Link>
                 </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
