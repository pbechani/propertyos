import { Suspense } from 'react';
import Listings from '@/views/Listings';

export default function PublicListingsPage() {
  return (
    <Suspense fallback={null}>
      <Listings />
    </Suspense>
  );
}
