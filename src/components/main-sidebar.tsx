
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Bot, LayoutDashboard, FileDown, BarChart3 } from 'lucide-react';
import { Sidebar, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Logo } from '@/components/logo';

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/journal', label: 'Journal', icon: BookOpen },
  { href: '/insights', label: 'AI Insights', icon: BarChart3 },
  { href: '/chat', label: 'AI Chat', icon: Bot },
  { href: '/export', label: 'Export', icon: FileDown },
];

export function MainSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar className="border-r-0 md:border-r">
      <div className="flex h-full flex-col">
        <div className="h-16 flex items-center px-4 shrink-0">
          <Link href="/dashboard">
            <Logo />
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto">
          <SidebarMenu className="p-2">
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith(item.href)}
                >
                  <Link href={item.href}>
                    <item.icon className="h-5 w-5" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </div>
      </div>
    </Sidebar>
  );
}
