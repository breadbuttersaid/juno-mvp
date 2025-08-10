import Image from 'next/image';
import { cn } from '@/lib/utils';
import LogoSvg from './logo.svg';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 text-2xl font-bold text-foreground", className)}>
      <Image src={LogoSvg} alt="Juno Logo" className="h-10 w-10" />
      <h1 className="font-headline tracking-wide">Juno</h1>
    </div>
  );
}
