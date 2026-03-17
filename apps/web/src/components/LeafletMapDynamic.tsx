import dynamic from 'next/dynamic';
import type { LeafletMapProps } from './LeafletMap';

const LeafletMapDynamic = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center text-sm text-gray-500 bg-gray-100">
      Loading map…
    </div>
  ),
});

export type { LeafletMapProps };
export default LeafletMapDynamic;
