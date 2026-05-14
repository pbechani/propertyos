'use client';

import { CreateListing } from '@/components/CreateListing';
import { useRouter } from 'next/navigation';

export default function NewPropertyPage() {
  const router = useRouter();
  return (
    <CreateListing
      onClose={() => router.push('/app/agent')}
      onSuccess={(id) => router.push(`/app/property/${id}`)}
    />
  );
}
