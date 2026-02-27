import { Suspense } from 'react';
import MyDashboard from '@/views/MyDashboard';

export const metadata = { title: 'My Dashboard | Pribec' };

export default function MyDashboardPage() {
  return (
    <Suspense fallback={null}>
      <MyDashboard />
    </Suspense>
  );
}
