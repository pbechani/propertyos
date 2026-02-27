import { Suspense } from 'react';
import CompanyActivityLogs from '@/views/CompanyActivityLogs';

export const metadata = { title: 'Activity Logs | Pribec' };

export default function CompanyActivitiesPage() {
  return (
    <Suspense fallback={null}>
      <CompanyActivityLogs />
    </Suspense>
  );
}
