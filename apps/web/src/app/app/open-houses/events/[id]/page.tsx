import { OHEventDetailView } from '@/views/open-houses/OHEventDetailView';

export default function Page({ params }: { params: { id: string } }) {
  return <OHEventDetailView id={params.id} />;
}
