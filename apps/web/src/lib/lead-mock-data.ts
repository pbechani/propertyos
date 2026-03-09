// Lead Management mock data — used by all lead views until the backend API is wired up.

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  source: string;
  type: 'buyer' | 'seller' | 'renter' | 'investor';
  timeline: string;
  budget: string;
  preferences: string;
  temperature: 'hot' | 'warm' | 'cold' | 'nurture';
  stage: 'new' | 'contacted' | 'qualified' | 'active' | 'under-contract' | 'closed' | 'lost';
  assignedAgent: string;
  prequalified: boolean;
  notes: string;
  createdAt: string;
  lastContact: string;
  nextFollowUp?: string;
  dealValue?: number;
  closedDate?: string;
  lostReason?: string;
}

export interface LeadTask {
  id: string;
  leadId: string;
  leadName: string;
  title: string;
  type: 'call' | 'email' | 'meeting' | 'follow-up';
  dueDate: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
}

export interface LeadActivity {
  id: string;
  leadId: string;
  leadName: string;
  type: 'email' | 'call' | 'sms' | 'meeting' | 'note' | 'stage-change';
  description: string;
  timestamp: string;
  agent: string;
}

export const mockLeads: Lead[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.j@email.com',
    phone: '(555) 123-4567',
    address: '123 Oak Street',
    source: 'Zillow',
    type: 'buyer',
    timeline: 'Within 3 months',
    budget: '$400k - $550k',
    preferences: '3-4 bed, 2+ bath, Downtown area, modern kitchen',
    temperature: 'hot',
    stage: 'active',
    assignedAgent: 'John Smith',
    prequalified: true,
    notes: 'Pre-approved for $550k. Looking for move-in ready homes. Has two kids, needs good school district.',
    createdAt: '2026-02-15',
    lastContact: '2026-03-06',
    nextFollowUp: '2026-03-08',
    dealValue: 525000,
  },
  {
    id: '2',
    name: 'Michael Chen',
    email: 'mchen@email.com',
    phone: '(555) 234-5678',
    source: 'Website Contact Form',
    type: 'seller',
    timeline: 'Within 6 months',
    budget: '$750k - $850k',
    preferences: 'Single family home in Westside',
    temperature: 'warm',
    stage: 'qualified',
    assignedAgent: 'John Smith',
    prequalified: false,
    notes: 'Wants to sell current home before buying. Needs CMA for 456 Maple Ave.',
    createdAt: '2026-02-20',
    lastContact: '2026-03-05',
    nextFollowUp: '2026-03-09',
    dealValue: 800000,
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    email: 'emily.r@email.com',
    phone: '(555) 345-6789',
    source: 'Facebook Ad',
    type: 'buyer',
    timeline: 'Exploring options',
    budget: '$300k - $400k',
    preferences: '2-3 bed, condo or townhome, near transit',
    temperature: 'nurture',
    stage: 'contacted',
    assignedAgent: 'Jane Doe',
    prequalified: false,
    notes: 'First-time buyer. Exploring different neighborhoods. Needs education on buying process.',
    createdAt: '2026-02-28',
    lastContact: '2026-03-04',
    nextFollowUp: '2026-03-11',
  },
  {
    id: '4',
    name: 'David Thompson',
    email: 'dthompson@email.com',
    phone: '(555) 456-7890',
    source: 'Referral',
    type: 'investor',
    timeline: 'Immediate',
    budget: '$200k - $350k',
    preferences: 'Multi-family properties, fixer-uppers, high ROI',
    temperature: 'hot',
    stage: 'active',
    assignedAgent: 'John Smith',
    prequalified: true,
    notes: 'Cash buyer. Looking for investment properties with 8%+ cap rate.',
    createdAt: '2026-03-01',
    lastContact: '2026-03-06',
    nextFollowUp: '2026-03-07',
    dealValue: 275000,
  },
  {
    id: '5',
    name: 'Jessica Martinez',
    email: 'jmartinez@email.com',
    phone: '(555) 567-8901',
    source: 'Open House',
    type: 'buyer',
    timeline: 'Within 1 month',
    budget: '$600k - $700k',
    preferences: '4 bed, 3 bath, Northside, large yard',
    temperature: 'hot',
    stage: 'under-contract',
    assignedAgent: 'Jane Doe',
    prequalified: true,
    notes: 'Under contract for 789 Pine Street. Inspection scheduled. Family relocating from out of state.',
    createdAt: '2026-02-10',
    lastContact: '2026-03-05',
    dealValue: 675000,
  },
  {
    id: '6',
    name: 'Robert Wilson',
    email: 'rwilson@email.com',
    phone: '(555) 678-9012',
    source: 'Realtor.com',
    type: 'seller',
    timeline: 'Within 3 months',
    budget: '$450k - $500k',
    preferences: 'Ranch style, East side',
    temperature: 'warm',
    stage: 'contacted',
    assignedAgent: 'John Smith',
    prequalified: false,
    notes: 'Wants market analysis. Considering selling to downsize. Empty nesters.',
    createdAt: '2026-03-03',
    lastContact: '2026-03-03',
    nextFollowUp: '2026-03-10',
  },
  {
    id: '7',
    name: 'Amanda Lee',
    email: 'alee@email.com',
    phone: '(555) 789-0123',
    source: 'Instagram Ad',
    type: 'buyer',
    timeline: '6-12 months',
    budget: '$350k - $450k',
    preferences: '3 bed, 2 bath, updated kitchen',
    temperature: 'cold',
    stage: 'new',
    assignedAgent: 'Jane Doe',
    prequalified: false,
    notes: 'Just started looking. Needs to save more for down payment.',
    createdAt: '2026-03-06',
    lastContact: '2026-03-06',
  },
  {
    id: '8',
    name: 'Christopher Brown',
    email: 'cbrown@email.com',
    phone: '(555) 890-1234',
    source: 'Website Contact Form',
    type: 'buyer',
    timeline: 'Within 2 months',
    budget: '$500k - $600k',
    preferences: '3-4 bed, 2.5 bath, Southside, new construction preferred',
    temperature: 'hot',
    stage: 'qualified',
    assignedAgent: 'John Smith',
    prequalified: true,
    notes: 'Pre-qualified for $600k. Very motivated. Moving for new job starting in May.',
    createdAt: '2026-02-25',
    lastContact: '2026-03-06',
    nextFollowUp: '2026-03-08',
    dealValue: 575000,
  },
  {
    id: '9',
    name: 'Lisa Anderson',
    email: 'landerson@email.com',
    phone: '(555) 901-2345',
    source: 'Cold Outreach',
    type: 'seller',
    timeline: 'Exploring options',
    budget: '$550k - $600k',
    preferences: 'Colonial style, Westside',
    temperature: 'cold',
    stage: 'contacted',
    assignedAgent: 'Jane Doe',
    prequalified: false,
    notes: 'Not ready to list yet. Curious about current market value.',
    createdAt: '2026-03-04',
    lastContact: '2026-03-04',
    nextFollowUp: '2026-03-18',
  },
  {
    id: '10',
    name: 'James Taylor',
    email: 'jtaylor@email.com',
    phone: '(555) 012-3456',
    source: 'Zillow',
    type: 'buyer',
    timeline: 'Within 1 month',
    budget: '$800k - $1M',
    preferences: '5 bed, 4 bath, luxury finishes, pool',
    temperature: 'warm',
    stage: 'active',
    assignedAgent: 'John Smith',
    prequalified: true,
    notes: 'Looking at luxury properties. Scheduled 3 showings this weekend.',
    createdAt: '2026-03-02',
    lastContact: '2026-03-06',
    nextFollowUp: '2026-03-07',
    dealValue: 925000,
  },
];

export const mockLeadTasks: LeadTask[] = [
  {
    id: '1',
    leadId: '1',
    leadName: 'Sarah Johnson',
    title: 'Schedule property showing - 456 Elm St',
    type: 'meeting',
    dueDate: '2026-03-08',
    completed: false,
    priority: 'high',
  },
  {
    id: '2',
    leadId: '4',
    leadName: 'David Thompson',
    title: 'Send investment property comps',
    type: 'email',
    dueDate: '2026-03-07',
    completed: false,
    priority: 'high',
  },
  {
    id: '3',
    leadId: '8',
    leadName: 'Christopher Brown',
    title: 'Follow-up call on new construction options',
    type: 'call',
    dueDate: '2026-03-08',
    completed: false,
    priority: 'high',
  },
  {
    id: '4',
    leadId: '2',
    leadName: 'Michael Chen',
    title: 'Deliver CMA report',
    type: 'email',
    dueDate: '2026-03-09',
    completed: false,
    priority: 'medium',
  },
  {
    id: '5',
    leadId: '10',
    leadName: 'James Taylor',
    title: 'Confirm weekend showings',
    type: 'call',
    dueDate: '2026-03-07',
    completed: false,
    priority: 'high',
  },
];

export const mockLeadActivities: LeadActivity[] = [
  {
    id: '1',
    leadId: '1',
    leadName: 'Sarah Johnson',
    type: 'email',
    description: 'Sent property listings matching criteria',
    timestamp: '2026-03-06T14:30:00',
    agent: 'John Smith',
  },
  {
    id: '2',
    leadId: '4',
    leadName: 'David Thompson',
    type: 'call',
    description: 'Discussed investment strategy and ROI expectations',
    timestamp: '2026-03-06T11:15:00',
    agent: 'John Smith',
  },
  {
    id: '3',
    leadId: '8',
    leadName: 'Christopher Brown',
    type: 'meeting',
    description: 'Met at new construction site - very interested',
    timestamp: '2026-03-06T10:00:00',
    agent: 'John Smith',
  },
  {
    id: '4',
    leadId: '5',
    leadName: 'Jessica Martinez',
    type: 'stage-change',
    description: 'Moved to Under Contract',
    timestamp: '2026-03-05T16:45:00',
    agent: 'Jane Doe',
  },
  {
    id: '5',
    leadId: '2',
    leadName: 'Michael Chen',
    type: 'sms',
    description: 'Confirmed appointment for CMA presentation',
    timestamp: '2026-03-05T13:20:00',
    agent: 'John Smith',
  },
];
