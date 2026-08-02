'use client';

import { useRouter } from 'next/navigation';
import AppShell from '../../components/AppShell';
import Marketplace from '../../components/Marketplace';

export default function MarketplacePage() {
  const router = useRouter();

  return (
    <AppShell>
      <Marketplace onOpenAdmin={() => router.push('/admin')} />
    </AppShell>
  );
}
