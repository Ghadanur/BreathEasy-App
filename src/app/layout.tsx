
import type { Metadata } from 'next';
import { Inter, Geist_Mono } from 'next/font/google'; // Import Inter, remove Roboto and EB_Garamond
import './globals.css';
import 'leaflet/dist/leaflet.css'; // Import Leaflet CSS here
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
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
        suppressHydrationWarning={true}
        className={cn(
          inter.variable, // Use Inter
          geistMono.variable, 
          "antialiased font-sans" // font-sans will now map to Inter via Tailwind config
        )}
      >
        {/* Orb Container & Page Background Gradient */}
        <div 
          className={cn(
            "fixed inset-0 z-0 overflow-hidden",
            "bg-gradient-to-br from-[hsl(180,50%,92%)] via-[hsl(120,40%,93%)] to-[hsl(50,70%,95%)]" // Cyan -> Green -> Sunshine gradient
          )}
        >
          {/* Orb 1 - Shine Color */}
          <div 
            className="absolute -top-20 -left-20 w-72 h-72 bg-[hsl(50,70%,90%)] rounded-full animate-float filter blur-3xl opacity-70" 
          ></div>
          {/* Orb 2 - Shine Color */}
          <div 
            className="absolute -bottom-20 -right-10 w-96 h-96 bg-[hsl(50,70%,90%)] rounded-full animate-float-delayed filter blur-3xl opacity-60"
          ></div>
          {/* Orb 3 - Shine Color */}
          <div 
            className="absolute top-1/3 left-1/3 w-60 h-60 bg-[hsl(50,70%,90%)] rounded-full animate-float filter blur-3xl opacity-50"
          ></div>
        </div>

        {/* Main Content Wrapper - sits on top of orbs */}
        <div className={cn(
          "min-h-screen flex flex-col",
          "bg-transparent", // Main content area is transparent to show orbs + gradient behind
          "relative z-10" 
        )}>
          {children}
        </div>
        <Toaster />
      </body>
    </html>
  );
}
