
'use client'; // RootLayout needs to be a client component for useState and useEffect

import { Inter, Geist_Mono } from 'next/font/google';
import './globals.css';
import 'leaflet/dist/leaflet.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { AppHeader } from '@/components/AppHeader'; // AppHeader will be passed toggle function
import { useState, useEffect } from 'react';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// Removed metadata export as it's not allowed in 'use client' components.
// If global metadata is needed, it should be handled in a Server Component,
// or individual pages can define their own metadata.

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isHighContrast, setIsHighContrast] = useState(false);

  useEffect(() => {
    const storedPreference = localStorage.getItem('highContrastEnabled');
    let initialValue = false;
    if (storedPreference !== null) {
      initialValue = storedPreference === 'true';
    } else {
      // If no stored preference, check system preference as a default
      if (typeof window !== 'undefined' && window.matchMedia('(prefers-contrast: more)').matches) {
        initialValue = true;
      }
    }
    setIsHighContrast(initialValue);
  }, []); // Runs once on mount to load initial preference

  useEffect(() => {
    // Apply class and save preference when isHighContrast changes
    if (isHighContrast) {
      document.documentElement.classList.add('high-contrast');
      localStorage.setItem('highContrastEnabled', 'true');
    } else {
      document.documentElement.classList.remove('high-contrast');
      localStorage.setItem('highContrastEnabled', 'false');
    }
  }, [isHighContrast]);

  const toggleHighContrast = () => {
    setIsHighContrast(prev => !prev);
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning={true}
        className={cn(
          inter.variable,
          geistMono.variable,
          "antialiased font-sans"
        )}
      >
        {/* Orb Container & Page Background Gradient */}
        <div
          id="background-effects-container" // Added ID to target for hiding
          className={cn(
            "fixed inset-0 z-0 overflow-hidden",
            "bg-gradient-to-br from-[hsl(180,50%,92%)] via-[hsl(120,40%,93%)] to-[hsl(50,70%,95%)]"
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
          "bg-transparent",
          "relative z-10"
        )}>
          {/* AppHeader is now rendered here and passed props */}
          <AppHeader
            isHighContrast={isHighContrast}
            toggleHighContrast={toggleHighContrast}
          />
          {children}
        </div>
        <Toaster />
      </body>
    </html>
  );
}
