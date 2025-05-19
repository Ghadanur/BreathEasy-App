import type { Metadata } from 'next';
import { Roboto, Geist_Mono, EB_Garamond } from 'next/font/google';
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

const ebGaramond = EB_Garamond({
  weight: ['400', '500', '700', '800'], // Added more weights for flexibility
  style: ['normal', 'italic'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-eb-garamond',
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
        suppressHydrationWarning={true}
        className={cn(
          roboto.variable, 
          geistMono.variable, 
          ebGaramond.variable, // Added EB Garamond variable
          "antialiased font-sans" 
        )}
      >
        <div className={cn(
          "min-h-screen flex flex-col",
          "bg-gradient-to-br from-[hsl(180,30%,92%)] via-[hsl(50,70%,94%)] to-[hsl(95,25%,95%)]"
        )}>
          {children}
        </div>
        <Toaster />
      </body>
    </html>
  );
}
