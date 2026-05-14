import { Suspense } from 'react';
import MakeOfferForm from '@/views/MakeOfferForm';

type Props = { params: Promise<{ propertyId: string }> };

export async function generateMetadata({ params }: Props) {
  const { propertyId } = await params;
  return { title: `Make Offer · ${propertyId.slice(0, 8).toUpperCase()} | BuildTrust` };
}

export default async function MakeOfferPage({ params }: Props) {
  const { propertyId } = await params;
  return (
    <Suspense fallback={null}>
      <MakeOfferForm propertyId={propertyId} />
    </Suspense>
  );
}
