'use client';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { JournalForm } from '@/components/journal-form';
import { useJournalStore } from '@/stores/journal-store';

export function JournalDialog() {
  const { isDialogOpen, closeJournalDialog, selectedEntry } = useJournalStore();

  return (
      <Dialog open={isDialogOpen} onOpenChange={closeJournalDialog}>
          <DialogContent>
              <JournalForm 
                entry={selectedEntry} 
                onSave={closeJournalDialog}
                onCancel={closeJournalDialog}
               />
          </DialogContent>
      </Dialog>
  );
}
