'use client';

import { useRouter } from 'next/navigation';
import AppShell from '../../components/AppShell';
import AdminDashboard from '../../components/AdminDashboard';

export default function AdminPage() {
  const router = useRouter();

  return (
    <AppShell>
      <AdminDashboard onClose={() => router.push('/profile')} />
    </AppShell>
  );
}
