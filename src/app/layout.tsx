import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'BreatheEasy Mobile',
  description: 'Monitor and improve your air quality.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body 
        className={cn(
          geistSans.variable, 
          geistMono.variable, 
          "antialiased font-sans"
        )}
      >
        <div className={cn(
          "min-h-screen flex flex-col",
          "bg-gradient-to-br from-[hsl(180,50%,75%)] to-[hsl(95,45%,80%)]" // Adjusted gradient to be milder
        )}>
          {children}
        </div>
        <Toaster />
      </body>
    </html>
  );
}
