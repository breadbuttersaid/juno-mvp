import { HeaderNav } from '@/components/header-nav';
import { UserNav } from '@/components/user-nav';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getUserFromCookie } from '@/lib/auth';

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUserFromCookie(cookies());

  if (!user) {
    redirect('/login');
  }

  return (
      <div className="min-h-screen flex flex-col">
          <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
             <HeaderNav />
             <UserNav email={user.email} />
          </header>
          <main className="flex-1 p-4 sm:p-6 animate-in fade-in duration-500">
            {children}
          </main>
      </div>
  );
}
