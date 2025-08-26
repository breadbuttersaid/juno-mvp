
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Bot, LayoutDashboard, FileDown, BarChart3, CalendarCheck2, Menu, CircleUser, Moon, Sun } from 'lucide-react';
import { Logo } from '@/components/logo';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useTheme } from 'next-themes';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuPortal, DropdownMenuSubContent } from './ui/dropdown-menu';

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/journal', label: 'Journal', icon: BookOpen },
  { href: '/insights', label: 'Insights', icon: BarChart3 },
  { href: '/recap', label: 'Recap', icon: CalendarCheck2 },
  { href: '/chat', label: 'Juno\'s Corner', icon: Bot },
];

export function HeaderNav() {
  const pathname = usePathname();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { setTheme } = useTheme();

  const handleLinkClick = () => {
    setIsSheetOpen(false);
  };

  const desktopNav = (
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
  );

  const mobileNav = (
    <div className="md:hidden">
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Open menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          </SheetHeader>
          <nav className="grid gap-6 text-lg font-medium pt-4">
            <Link href="/dashboard" className="mb-6" onClick={handleLinkClick}>
              <Logo />
            </Link>
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleLinkClick}
                className={cn(
                  "flex items-center gap-4 rounded-lg px-3 py-2 transition-colors hover:text-primary",
                  pathname.startsWith(item.href) ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
             <Link
                href='/export'
                onClick={handleLinkClick}
                className={cn(
                    "flex items-center gap-4 rounded-lg px-3 py-2 transition-colors hover:text-primary",
                    pathname.startsWith('/export') ? 'text-foreground' : 'text-muted-foreground'
                  )}
              >
                <FileDown className="h-5 w-5" />
                Export
              </Link>
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );

  const profileMenu = (
     <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="icon" className="rounded-full">
            <CircleUser className="h-5 w-5" />
            <span className="sr-only">Toggle user menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
            <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                    <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="ml-2">Appearance</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                        <DropdownMenuItem onClick={() => setTheme("light")}>Light</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme("dark")}>Dark</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme("system")}>System</DropdownMenuItem>
                    </DropdownMenuSubContent>
                </DropdownMenuPortal>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <Link href="/export" className='flex items-center w-full'>
                    <FileDown className="h-4 w-4 mr-2" />
                    Export Entries
                </Link>
            </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
  )

  return (
    <nav className="flex w-full items-center">
      <Link href="/dashboard" className="mr-6">
        <Logo />
      </Link>
      
      <div className='flex-1'>
        {desktopNav}
      </div>
      
      <div className="hidden md:flex items-center gap-2">
        {profileMenu}
      </div>

      {mobileNav}
    </nav>
  );
}
