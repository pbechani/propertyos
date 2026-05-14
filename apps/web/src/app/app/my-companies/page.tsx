import { Suspense } from 'react';
import MyCompanies from '@/views/MyCompanies';

export const metadata = { title: 'My Companies | Pribec' };

export default function MyCompaniesPage() {
  return (
    <Suspense fallback={null}>
      <MyCompanies />
    </Suspense>
  );
}
