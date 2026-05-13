'use client';

import CustomerDashboard from '@/components/dashboard/CustomerDashboard';
import { ProtectedRoute } from '@/context/ProtectedRoute';

export default function AccountsPage() {
  return (
    <ProtectedRoute>
      <CustomerDashboard activeNav="Accounts" />
    </ProtectedRoute>
  );
}
