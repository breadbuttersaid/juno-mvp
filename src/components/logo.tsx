import { BrainCircuit } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 text-2xl font-bold text-foreground", className)}>
      <div className="p-2 bg-primary/20 rounded-lg">
        <BrainCircuit className="h-6 w-6 text-primary-foreground" />
      </div>
      <h1 className="font-headline tracking-wide">Juno</h1>
    </div>
  );
}
