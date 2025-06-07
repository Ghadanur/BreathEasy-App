
// Removed AppHeader import as it's now rendered in RootLayout
import { HomePageClient } from '@/components/HomePageClient';

export default function Home() {
  return (
    <>
      {/* AppHeader is now in RootLayout and handles its own state for HOC toggle */}
      <main className="flex-1">
        <HomePageClient />
      </main>
    </>
  );
}
