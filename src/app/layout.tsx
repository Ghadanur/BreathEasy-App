import type { Metadata } from 'next';
import { Roboto, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto',
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
          roboto.variable, 
          geistMono.variable, 
          "antialiased font-sans" // font-sans will now use Roboto via Tailwind config
        )}
      >
        <div className={cn(
          "min-h-screen flex flex-col",
          "bg-gradient-to-br from-[hsl(180,30%,92%)] to-[hsl(95,25%,95%)]" // Even further lightened and desaturated gradient
        )}>
          {children}
        </div>
        <Toaster />
      </body>
    </html>
  );
}
