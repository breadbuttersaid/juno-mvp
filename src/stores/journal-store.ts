import { create } from 'zustand';
import type { JournalEntry } from '@/lib/types';

type JournalState = {
  entries: JournalEntry[];
  isDialogOpen: boolean;
  selectedEntry: JournalEntry | null;
  setEntries: (entries: JournalEntry[]) => void;
  openJournalDialog: (entry: JournalEntry | null) => void;
  closeJournalDialog: () => void;
};

export const useJournalStore = create<JournalState>((set) => ({
  entries: [],
  isDialogOpen: false,
  selectedEntry: null,
  setEntries: (entries) => set({ entries }),
  openJournalDialog: (entry) => set({ isDialogOpen: true, selectedEntry: entry }),
  closeJournalDialog: () => set({ isDialogOpen: false, selectedEntry: null }),
}));
