'use client';

import { useRouter } from 'next/navigation';
import AppShell from '../../components/AppShell';
import Profile from '../../components/Profile';

export default function ProfilePage() {
  const router = useRouter();

  return (
    <AppShell>
      <Profile onOpenAdmin={() => router.push('/admin')} />
    </AppShell>
  );
}
