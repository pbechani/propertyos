import ProtectedRoute from '@/components/ProtectedRoute';
import { AiCommandCenter } from '@/views/AiCommandCenter';

export default function Page() {
  return (
    <ProtectedRoute requireCompanyAdmin>
      <AiCommandCenter />
    </ProtectedRoute>
  );
}
