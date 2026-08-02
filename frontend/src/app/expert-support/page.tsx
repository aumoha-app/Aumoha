'use client';

import { useRouter } from 'next/navigation';
import AppShell from '../../components/AppShell';
import ExpertSupport from '../../components/ExpertSupport';

export default function ExpertSupportPage() {
  const router = useRouter();

  const handleNavigate = (tab: string) => {
    if (tab === 'home') router.push('/');
    else if (tab === 'marketplace') router.push('/marketplace');
    else if (tab === 'report') router.push('/sos');
    else if (tab === 'circle') router.push('/circle');
    else if (tab === 'profile') router.push('/profile');
    else if (tab === 'vetconsult') router.push('/vet-consult');
  };

  return (
    <AppShell>
      <ExpertSupport setActiveTab={handleNavigate} />
    </AppShell>
  );
}
