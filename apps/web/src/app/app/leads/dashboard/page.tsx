import { redirect } from 'next/navigation';

export default function LeadDashboardRedirect() {
  redirect('/app/leads?tab=dashboard');
}
