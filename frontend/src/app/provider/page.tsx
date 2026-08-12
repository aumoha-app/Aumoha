'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '../../components/AppShell';
import ProviderDashboard from '../../components/ProviderDashboard';
import { useAuth } from '../../context/AuthContext';

export default function ProviderPage() {
  const router = useRouter();
  const { user, isProvider, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      const role = user?.role;
      const email = user?.email?.toLowerCase();
      const isAllowed = isProvider || role === 'doctor' || role === 'expert' || role === 'admin' || email === 'admin@aumoha.com' || email?.includes('vet') || email?.includes('expert');
      if (!isAllowed) {
        router.replace('/');
      }
    }
  }, [user, isProvider, loading, router]);

  if (loading) {
    return (
      <AppShell>
        <div className="min-h-screen flex items-center justify-center text-stone-400 text-sm">
          Loading Doctor Dashboard...
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <ProviderDashboard />
    </AppShell>
  );
}

