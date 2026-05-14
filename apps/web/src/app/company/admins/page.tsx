import { Suspense } from 'react';
import CompanyAdminManagement from '@/views/CompanyAdminManagement';

export const metadata = { title: 'Company Admins | Pribec' };

export default function CompanyAdminsPage() {
  return (
    <Suspense fallback={null}>
      <CompanyAdminManagement />
    </Suspense>
  );
}
