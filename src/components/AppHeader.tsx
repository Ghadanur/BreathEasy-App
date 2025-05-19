import { AirVent } from 'lucide-react';
import Link from 'next/link';

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <AirVent className="h-8 w-8 text-primary" />
          <span className="font-bold text-xl sm:inline-block bg-gradient-to-r from-primary via-blue-400 to-accent bg-clip-text text-transparent">
            BreatheEasy
          </span>
        </Link>
        {/* Future navigation items can go here */}
      </div>
    </header>
  );
}
