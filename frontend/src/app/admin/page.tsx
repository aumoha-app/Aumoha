'use client';

import { useRouter } from 'next/navigation';
import AppShell from '../../components/AppShell';
import AdminDashboard from '../../components/AdminDashboard';
import { useAuth } from '../../context/AuthContext';

export default function AdminPage() {
  const router = useRouter();
  const { loading } = useAuth();

  if (loading) {
    return (
      <AppShell>
        <div className="min-h-screen flex items-center justify-center text-stone-400 text-sm">
          Loading Admin Control Center...
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
