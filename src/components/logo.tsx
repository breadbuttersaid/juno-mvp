import Image from 'next/image';
import { cn } from '@/lib/utils';
import LogoSvg from './logo.svg';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 text-2xl font-bold text-foreground", className)}>
      <div className="p-2 bg-primary/20 rounded-lg">
         <Image src={LogoSvg} alt="Juno Logo" className="h-6 w-6" />
      </div>
      <h1 className="font-headline tracking-wide">Juno</h1>
    </div>
  );
}
