import { redirect } from 'next/navigation';

export default function LeadAnalyticsRedirect() {
  redirect('/app/leads?tab=analytics');
}
