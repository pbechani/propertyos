import { Suspense } from 'react';
import LoginEnhanced from '@/views/LoginEnhanced';

export default function LoginPage() {
	return (
		<Suspense fallback={null}>
			<LoginEnhanced />
		</Suspense>
	);
}
