import ProtectedRoute from '@/components/ProtectedRoute';
import AdminFinanceView from '@/views/AdminFinanceView';

export const metadata = { title: 'Escrow & Finance — Admin' };

export default function Page() {
  return (
    <ProtectedRoute requireCompanyAdmin>
      <AdminFinanceView />
    </ProtectedRoute>
  );
}
