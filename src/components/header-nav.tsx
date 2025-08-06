'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Bot, LayoutDashboard, FileDown, BarChart3 } from 'lucide-react';
import { Logo } from '@/components/logo';
import { cn } from '@/lib/utils';

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/journal', label: 'Journal', icon: BookOpen },
  { href: '/insights', label: 'AI Insights', icon: BarChart3 },
  { href: '/chat', label: 'AI Chat', icon: Bot },
  { href: '/export', label: 'Export', icon: FileDown },
];

export function HeaderNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-6">
      <Link href="/dashboard" className="mr-4">
        <Logo />
      </Link>
      <div className="hidden md:flex items-center gap-4">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
              pathname.startsWith(item.href) ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
