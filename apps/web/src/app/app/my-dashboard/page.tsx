import { Suspense } from 'react';
import BuyerDashboardEnhanced from '@/views/BuyerDashboardEnhanced';

export const metadata = { title: 'My Dashboard | Pribec' };

export default function MyDashboardPage() {
  return (
    <Suspense fallback={null}>
      <BuyerDashboardEnhanced />
    </Suspense>
  );
}
