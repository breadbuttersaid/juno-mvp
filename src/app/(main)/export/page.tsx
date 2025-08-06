import ExportClient from '@/components/export-client';
import type { JournalEntry } from '@/lib/types';
import { FileDown, BookOpen } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getJournalEntries } from '@/lib/actions/journal';


export default async function ExportPage() {
  const entries = await getJournalEntries();

  return (
    <div className="space-y-6">
       <div>
          <h1 className="text-3xl font-headline font-bold flex items-center gap-2">
            <FileDown /> Export Entries
          </h1>
          <p className="text-muted-foreground">
            Save a copy of your journal entries as a PDF.
          </p>
        </div>
      <Card className="printable-area">
        <CardHeader className="no-print">
            <CardTitle className="font-headline">Your Journal Archive</CardTitle>
            <CardDescription>
                Select a month to view and export your entries.
            </CardDescription>
        </CardHeader>
        <CardContent>
          <ExportClient entries={entries} />
        </CardContent>
      </Card>
    </div>
  );
}
