
'use client';

import { Wind, Contrast } from 'lucide-react'; 
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { MouseEventHandler } from 'react'; // Import MouseEventHandler

interface AppHeaderProps {
  isHighContrast?: boolean; // Optional for now, if RootLayout isn't client yet
  toggleHighContrast?: MouseEventHandler<HTMLButtonElement>; // Make it specific
}

export function AppHeader({ isHighContrast, toggleHighContrast }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between"> {/* Added justify-between */}
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Wind aria-hidden="true" className="h-8 w-8 text-primary" /> 
          <span className="font-bold text-xl sm:inline-block bg-gradient-to-r from-primary via-blue-400 to-accent bg-clip-text text-transparent">
            BreatheEasy
          </span>
        </Link>
        
        {/* High Contrast Toggle Button */}
        {toggleHighContrast && ( // Conditionally render if props are passed
            <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleHighContrast} 
                aria-pressed={isHighContrast}
                aria-label={isHighContrast ? "Disable high contrast mode" : "Enable high contrast mode"}
                title={isHighContrast ? "Disable high contrast mode" : "Enable high contrast mode"}
            >
            <Contrast className="h-5 w-5" />
            </Button>
        )}
      </div>
    </header>
  );
}
