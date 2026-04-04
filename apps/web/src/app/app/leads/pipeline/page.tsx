import { redirect } from 'next/navigation';

export default function LeadPipelineRedirect() {
  redirect('/app/leads?tab=pipeline');
}
