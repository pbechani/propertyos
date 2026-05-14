import { Suspense } from 'react';
import CompanyRoleSelector from '@/views/CompanyRoleSelector';

export const metadata = { title: 'Select Role | Pribec' };

export default function CompanyRoleSelectorPage() {
  return (
    <Suspense fallback={null}>
      <CompanyRoleSelector />
    </Suspense>
  );
}
