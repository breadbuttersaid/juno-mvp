import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import { Alegreya } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';

const alegreya = Alegreya({ subsets: ['latin'], variable: '--font-sans' });


export const metadata: Metadata = {
  title: 'Juno: Mindful Journal',
  description: 'An AI-powered journal for mindfulness and self-reflection.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${alegreya.className} font-body bg-background text-foreground`}>
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            {children}
            <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
