import { Suspense } from 'react';
import CompanyRegistration from '@/views/CompanyRegistration';

export const metadata = { title: 'Register Your Company | Pribec' };

export default function CompanyRegistrationPage() {
  return (
    <Suspense fallback={null}>
      <CompanyRegistration />
    </Suspense>
  );
}
