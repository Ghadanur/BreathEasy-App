import { AppHeader } from '@/components/AppHeader';
import { HomePageClient } from '@/components/HomePageClient';

export default function Home() {
  return (
    <>
      <AppHeader />
      <main className="flex-1">
        <HomePageClient />
      </main>
    </>
  );
}
