import { Suspense } from 'react';
import CompanyUserManagement from '@/views/CompanyUserManagement';

export const metadata = { title: 'Company Members | Pribec' };

export default function CompanyUsersPage() {
  return (
    <Suspense fallback={null}>
      <CompanyUserManagement />
    </Suspense>
  );
}
