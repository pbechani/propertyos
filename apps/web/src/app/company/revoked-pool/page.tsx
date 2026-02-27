import { Suspense } from 'react';
import CompanyRevokedPool from '@/views/CompanyRevokedPool';

export const metadata = { title: 'Revoked Pool | Pribec' };

export default function CompanyRevokedPoolPage() {
  return (
    <Suspense fallback={null}>
      <CompanyRevokedPool />
    </Suspense>
  );
}
