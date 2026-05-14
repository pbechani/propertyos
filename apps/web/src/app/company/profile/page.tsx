import { Suspense } from 'react';
import CompanyProfile from '@/views/CompanyProfile';

export const metadata = { title: 'Company Profile | Pribec' };

export default function CompanyProfilePage() {
  return (
    <Suspense fallback={null}>
      <CompanyProfile />
    </Suspense>
  );
}
