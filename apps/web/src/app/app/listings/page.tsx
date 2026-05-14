import { Suspense } from 'react';
import Listings from '@/views/Listings';

export default function ListingsPage() {
	return (
		<Suspense fallback={null}>
			<Listings />
		</Suspense>
	);
}
