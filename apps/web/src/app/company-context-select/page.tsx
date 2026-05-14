import { Suspense } from 'react';
import CompanyContextSelect from '@/views/CompanyContextSelect';

export const metadata = { title: 'Select Company | Pribec' };

export default function CompanyContextSelectPage() {
  return (
    <Suspense fallback={null}>
      <CompanyContextSelect />
    </Suspense>
  );
}
