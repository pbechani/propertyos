import { Suspense } from 'react';
import CompanyDashboard from '@/views/CompanyDashboard';

export const metadata = { title: 'Company Dashboard | Pribec' };

export default function CompanyDashboardPage() {
  return (
    <Suspense fallback={null}>
      <CompanyDashboard />
    </Suspense>
  );
}
