import ProtectedRoute from '@/components/ProtectedRoute';
import AdminVerificationPanel from '@/views/AdminVerificationPanel';

export default function Page() {
  return (
    <ProtectedRoute requiredRole="admin">
      <AdminVerificationPanel />
    </ProtectedRoute>
  );
}
