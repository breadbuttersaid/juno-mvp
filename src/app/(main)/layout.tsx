import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { MainSidebar } from '@/components/main-sidebar';
import { UserNav } from '@/components/user-nav';

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <SidebarProvider>
      <div className="min-h-screen">
        <MainSidebar />
        <SidebarInset>
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
             <div className="md:hidden">
              <SidebarTrigger />
            </div>
            <div className="hidden md:block"></div> {/* Spacer */}
            <UserNav email="user@example.com" />
          </header>
          <main className="flex-1 p-4 sm:p-6 animate-in fade-in duration-500">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
