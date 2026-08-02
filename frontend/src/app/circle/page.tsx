'use client';

import { useRouter } from 'next/navigation';
import AppShell from '../../components/AppShell';
import MohallaCircle from '../../components/MohallaCircle';
import { useAuth } from '../../context/AuthContext';

export default function CirclePage() {
  const router = useRouter();
  const { user } = useAuth();

  const handleNavigate = (tab: string) => {
    if (tab === 'home') router.push('/');
    else if (tab === 'marketplace') router.push('/marketplace');
    else if (tab === 'report' || tab === 'sos') router.push('/sos');
    else if (tab === 'profile') router.push('/profile');
    else if (tab === 'petcare') router.push('/pet-care');
  };

  return (
    <AppShell>
      <MohallaCircle setActiveTab={handleNavigate} userAddress={user?.address} />
    </AppShell>
  );
}
