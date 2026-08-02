'use client';

import { useRouter } from 'next/navigation';
import AppShell from '../../components/AppShell';
import VetConsultation from '../../components/VetConsultation';

export default function VetConsultPage() {
  const router = useRouter();

  const handleNavigate = (tab: string) => {
    if (tab === 'home') router.push('/');
    else if (tab === 'marketplace') router.push('/marketplace');
    else if (tab === 'report') router.push('/sos');
    else if (tab === 'circle') router.push('/circle');
    else if (tab === 'profile') router.push('/profile');
  };

  return (
    <AppShell bgColor="#F5F2EC">
      <VetConsultation setActiveTab={handleNavigate} />
    </AppShell>
  );
}
