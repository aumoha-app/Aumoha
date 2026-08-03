'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '../../components/AppShell';
import AdminDashboard from '../../components/AdminDashboard';
import { useAuth } from '../../context/AuthContext';

export default function AdminPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      const email = user?.email?.toLowerCase();
      const isAdminEmail = email === 'admin@aumoha.com' || email === 'ananya.patra@aumoha.com';
      const isAllowed = user?.role === 'admin' || isAdminEmail;
      if (!isAllowed) {
        router.replace('/');
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <AppShell>
        <div className="min-h-screen flex items-center justify-center text-stone-400 text-sm">
          Checking admin permissions...
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <AdminDashboard onClose={() => router.push('/profile')} />
    </AppShell>
  );
}
