import { Suspense } from 'react';
import AcceptInvitation from '@/views/AcceptInvitation';

export const metadata = { title: 'Accept Invitation | Pribec' };

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={null}>
      <AcceptInvitation />
    </Suspense>
  );
}
