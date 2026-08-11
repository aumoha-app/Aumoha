'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '../../components/AppShell';
import ProviderDashboard from '../../components/ProviderDashboard';
import { useAuth } from '../../context/AuthContext';

export default function ProviderPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/');
  }, [router]);

  return null;
}

