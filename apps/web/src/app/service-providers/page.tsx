import { Suspense } from 'react';
import ServiceProviderMarketplace from '@/views/ServiceProviderMarketplace';

export default function ServiceProvidersPage() {
	return (
		<Suspense fallback={null}>
			<ServiceProviderMarketplace />
		</Suspense>
	);
}
