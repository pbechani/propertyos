import { Suspense } from 'react';
import OAuthConnect from '@/views/OAuthConnect';

export default function OAuthConnectPage() {
	return (
		<Suspense fallback={null}>
			<OAuthConnect />
		</Suspense>
	);
}
