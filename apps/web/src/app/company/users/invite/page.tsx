import { Suspense } from 'react';
import CompanyInviteUser from '@/views/CompanyInviteUser';

export const metadata = { title: 'Invite Member | Pribec' };

export default function CompanyInviteUserPage() {
  return (
    <Suspense fallback={null}>
      <CompanyInviteUser />
    </Suspense>
  );
}
