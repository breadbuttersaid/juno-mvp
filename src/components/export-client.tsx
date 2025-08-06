'use client';

import { useState, useMemo } from 'react';
import type { JournalEntry } from '@/lib/types';
import { format, parseISO, getMonth, getYear, startOfMonth } from 'date-fns';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Printer, BookOpen } from 'lucide-react';

type MonthOption = {
  value: string;
  label: string;
};

export default function ExportClient({ entries }: { entries: JournalEntry[] }) {
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  const monthOptions = useMemo<MonthOption[]>(() => {
    const months = new Set<string>();
    entries.forEach(entry => {
      const monthKey = format(startOfMonth(parseISO(entry.created_at)), 'yyyy-MM');
      months.add(monthKey);
    });
    return Array.from(months)
      .map(monthKey => ({
        value: monthKey,
        label: format(new Date(monthKey), 'MMMM yyyy'),
      }))
      .sort((a, b) => b.value.localeCompare(a.value));
  }, [entries]);

  const filteredEntries = useMemo(() => {
    if (!selectedMonth) return [];
    const [year, month] = selectedMonth.split('-').map(Number);
    return entries.filter(entry => {
      const entryDate = parseISO(entry.created_at);
      return getYear(entryDate) === year && getMonth(entryDate) + 1 === month;
    });
  }, [selectedMonth, entries]);
  
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center no-print">
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Select a month..." />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handlePrint} disabled={filteredEntries.length === 0}>
          <Printer className="mr-2 h-4 w-4" />
          Export to PDF
        </Button>
      </div>

      <div className="print-content space-y-8 pt-4">
        {selectedMonth && (
            <div className="text-center hidden print:block mb-8">
                <h1 className="text-3xl font-bold font-headline">Juno Mindful Journal</h1>
                <h2 className="text-xl text-gray-600">
                    {format(new Date(selectedMonth), 'MMMM yyyy')}
                </h2>
            </div>
        )}
        {filteredEntries.length > 0 ? (
          filteredEntries.map(entry => (
            <div key={entry.id} className="printable-entry space-y-2 break-inside-avoid">
              <h3 className="text-xl font-bold font-headline border-b pb-2">
                {format(parseISO(entry.created_at), 'MMMM d, yyyy')}
              </h3>
              <p className="text-gray-700 whitespace-pre-wrap">{entry.content}</p>
            </div>
          ))
        ) : (
          <div className="text-center py-16 border-2 border-dashed rounded-lg no-print">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-lg font-medium">
              {selectedMonth ? 'No entries for this month' : 'Please select a month'}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {selectedMonth ? 'Choose another month to view your entries.' : 'Select a month from the dropdown to begin.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
