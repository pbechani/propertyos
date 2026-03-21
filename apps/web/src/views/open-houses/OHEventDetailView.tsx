// @ts-nocheck
"use client";
import { useRouter } from 'next/navigation';
import { OpenHouseDetailView } from '@/components/open-houses/OpenHouseDetailView';

export function OHEventDetailView({ id }: { id: string }) {
  const router = useRouter();
  return <OpenHouseDetailView id={id} onBack={() => router.back()} />;
}
