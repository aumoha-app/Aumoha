'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '../components/AppShell';
import MinimalHome from '../components/MinimalHome';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <AppShell backdropImage="/backdrop-sunlight.png">
      <main className="w-full max-w-3xl md:max-w-4xl mx-auto flex flex-col gap-6 transition-all duration-300">
        <MinimalHome
          userName={user?.fullName || 'Welcome to Aumoha'}
          onSosClick={() => router.push('/sos')}
          onVetCareClick={() => router.push('/vet-consult')}
          onExpertSupportClick={() => router.push('/expert-support')}
          onPetServicesClick={() => router.push('/pet-care')}
          onCommunityClick={(view?: string) => router.push(view ? `/circle?view=${view}` : '/circle')}
          onMarketplaceClick={() => router.push('/marketplace')}
        />
      </main>
    </AppShell>
  );
}

