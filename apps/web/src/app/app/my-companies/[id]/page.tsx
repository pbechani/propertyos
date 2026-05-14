import { Suspense } from 'react';
import CompanyStatus from '@/views/CompanyStatus';

export const metadata = { title: 'Company Status | Pribec' };

export default function CompanyStatusPage() {
  return (
    <Suspense fallback={null}>
      <CompanyStatus />
    </Suspense>
  );
}
