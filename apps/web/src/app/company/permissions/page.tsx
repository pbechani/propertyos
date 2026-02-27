import { Suspense } from 'react';
import CompanyPermissions from '@/views/CompanyPermissions';

export const metadata = { title: 'Company Permissions | Pribec' };

export default function CompanyPermissionsPage() {
  return (
    <Suspense fallback={null}>
      <CompanyPermissions />
    </Suspense>
  );
}
