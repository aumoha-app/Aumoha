'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AppShell from '../../components/AppShell';
import MohallaCircle from '../../components/MohallaCircle';
import { useAuth } from '../../context/AuthContext';

function CircleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const viewParam = (searchParams.get('view') as 'home' | 'members' | 'impact' | 'updates' | null) || 'home';

  const handleNavigate = (tab: string) => {
    if (tab === 'home') router.push('/');
    else if (tab === 'marketplace') router.push('/marketplace');
    else if (tab === 'report' || tab === 'sos') router.push('/sos');
    else if (tab === 'profile') router.push('/profile');
    else if (tab === 'petcare') router.push('/pet-care');
  };

  return (
    <MohallaCircle setActiveTab={handleNavigate} userAddress={user?.address} view={viewParam} />
  );
}

export default function CirclePage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-8 text-center text-stone-600 font-bold font-serif">Loading Mohalla Circle...</div>}>
        <CircleContent />
      </Suspense>
    </AppShell>
  );
}
