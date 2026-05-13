'use client';

import CustomerDashboard from '@/components/dashboard/CustomerDashboard';
import { ProtectedRoute } from '@/context/ProtectedRoute';
import { useAuth } from '@/context/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

function HomeContent() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user?.role === 'admin') {
      router.replace('/admin');
    }
  }, [router, user?.role]);

  if (user?.role === 'admin') {
    return null;
  }

  return <CustomerDashboard />;
}

export default function Home() {
  return (
    <ProtectedRoute>
      <HomeContent />
    </ProtectedRoute>
  );
}
