import { Suspense } from 'react';
import EmailVerification from '@/views/EmailVerification';

export default function EmailVerificationPage() {
	return (
		<Suspense fallback={null}>
			<EmailVerification />
		</Suspense>
	);
}
