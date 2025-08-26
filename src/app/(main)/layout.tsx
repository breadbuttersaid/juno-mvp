'use client';

import { HeaderNav } from '@/components/header-nav';
import { JournalDialog } from '@/components/journal-dialog';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <div className="min-h-screen flex flex-col">
          <header className="sticky top-0 z-50 flex h-16 items-center border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
             <HeaderNav />
          </header>
          <main className="flex-1 p-4 sm:p-6 animate-in fade-in duration-500">
            {children}
          </main>
          <JournalDialog />
      </div>
  );
}
