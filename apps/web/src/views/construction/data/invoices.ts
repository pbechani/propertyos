import type { Invoice } from '@/views/construction/types';

export const mockInvoices: Invoice[] = [
  {
    id: 'inv1',
    invoiceNumber: 'INV-2026-001',
    contractor: 'Michael Chen',
    contractorId: 'c1',
    contractorCompany: 'Elite Steel Solutions',
    amount: 285000,
    subtotal: 285000,
    dueDate: '2026-03-25',
    issueDate: '2026-03-01',
    status: 'approved',
    category: 'Materials',
    projectId: 'p1',
    projectName: 'Metropolitan Heights Tower',
    description: 'Structural steel beams and materials - Phase 2',
    paymentTerms: 'Net 30',
    lineItems: [
      {
        id: 'li1',
        description: 'Wide flange I-beams W24x76',
        quantity: 45,
        unitPrice: 4500,
        total: 202500
      },
      {
        id: 'li2',
        description: 'Steel columns W14x120',
        quantity: 20,
        unitPrice: 3200,
        total: 64000
      },
      {
        id: 'li3',
        description: 'Connection plates and hardware',
        quantity: 1,
        unitPrice: 18500,
        total: 18500
      }
    ],
    attachments: [
      {
        name: 'invoice-INV-2026-001.pdf',
        url: '/documents/invoices/inv-2026-001.pdf',
        size: '1.2 MB'
      }
    ],
    approvedBy: 'Sarah Johnson',
    approvedDate: '2026-03-10'
  },
  {
    id: 'inv2',
    invoiceNumber: 'INV-2026-002',
    contractor: 'David Martinez',
    contractorId: 'c2',
    contractorCompany: 'Apex Electrical Contractors',
    amount: 185000,
    subtotal: 175000,
    taxAmount: 10000,
    dueDate: '2026-03-15',
    issueDate: '2026-02-28',
    status: 'overdue',
    category: 'Labor',
    projectId: 'p1',
    projectName: 'Metropolitan Heights Tower',
    description: 'Electrical rough-in installation - Floors 8-12',
    paymentTerms: 'Net 15',
    lineItems: [
      {
        id: 'li4',
        description: 'Labor - Electrical rough-in',
        quantity: 320,
        unitPrice: 450,
        total: 144000
      },
      {
        id: 'li5',
        description: 'Conduit and wire materials',
        quantity: 1,
        unitPrice: 31000,
        total: 31000
      }
    ],
    attachments: [
      {
        name: 'invoice-INV-2026-002.pdf',
        url: '/documents/invoices/inv-2026-002.pdf',
        size: '890 KB'
      }
    ],
    notes: 'Payment overdue - follow up required'
  },
  {
    id: 'inv3',
    invoiceNumber: 'INV-2026-003',
    contractor: 'Lisa Thompson',
    contractorId: 'c3',
    contractorCompany: 'Premier HVAC Supplies',
    amount: 425000,
    subtotal: 425000,
    dueDate: '2026-04-01',
    issueDate: '2026-03-05',
    status: 'pending',
    category: 'Equipment',
    projectId: 'p1',
    projectName: 'Metropolitan Heights Tower',
    description: 'HVAC system equipment and installation',
    paymentTerms: 'Net 30',
    lineItems: [
      {
        id: 'li6',
        description: 'Commercial HVAC units (10-ton)',
        quantity: 8,
        unitPrice: 45000,
        total: 360000
      },
      {
        id: 'li7',
        description: 'Ductwork and venting materials',
        quantity: 1,
        unitPrice: 42000,
        total: 42000
      },
      {
        id: 'li8',
        description: 'Control systems and thermostats',
        quantity: 12,
        unitPrice: 1917,
        total: 23000
      }
    ],
    attachments: [
      {
        name: 'invoice-INV-2026-003.pdf',
        url: '/documents/invoices/inv-2026-003.pdf',
        size: '1.5 MB'
      },
      {
        name: 'equipment-specs.pdf',
        url: '/documents/specs/hvac-specs.pdf',
        size: '3.2 MB'
      }
    ]
  },
  {
    id: 'inv4',
    invoiceNumber: 'INV-2026-004',
    contractor: 'Robert Kim',
    contractorId: 'c4',
    contractorCompany: 'Urban Plumbing Wholesale',
    amount: 156800,
    subtotal: 156800,
    dueDate: '2026-03-30',
    issueDate: '2026-03-08',
    status: 'approved',
    category: 'Materials',
    projectId: 'p2',
    projectName: 'Riverside Medical Center',
    description: 'Plumbing fixtures and materials - Phase 1',
    paymentTerms: 'Net 30',
    lineItems: [
      {
        id: 'li9',
        description: 'Commercial grade toilets',
        quantity: 45,
        unitPrice: 850,
        total: 38250
      },
      {
        id: 'li10',
        description: 'Sinks and faucets',
        quantity: 60,
        unitPrice: 425,
        total: 25500
      },
      {
        id: 'li11',
        description: 'Copper piping 3/4" Type L',
        quantity: 2800,
        unitPrice: 3.75,
        total: 10500
      },
      {
        id: 'li12',
        description: 'PVC drainage pipes and fittings',
        quantity: 1,
        unitPrice: 82550,
        total: 82550
      }
    ],
    approvedBy: 'Mark Williams',
    approvedDate: '2026-03-11'
  },
  {
    id: 'inv5',
    invoiceNumber: 'INV-2026-005',
    contractor: 'Jennifer Lee',
    contractorId: 'c5',
    contractorCompany: 'BuildMart Supply Co.',
    amount: 95500,
    subtotal: 95500,
    dueDate: '2026-04-05',
    issueDate: '2026-03-10',
    status: 'pending',
    category: 'Materials',
    projectId: 'p1',
    projectName: 'Metropolitan Heights Tower',
    description: 'Concrete and masonry materials',
    paymentTerms: 'Net 30',
    lineItems: [
      {
        id: 'li13',
        description: 'Concrete Grade 40 - 250 cubic yards',
        quantity: 250,
        unitPrice: 120,
        total: 30000
      },
      {
        id: 'li14',
        description: 'Rebar #8 Grade 60',
        quantity: 15000,
        unitPrice: 0.85,
        total: 12750
      },
      {
        id: 'li15',
        description: 'Concrete blocks 8x8x16',
        quantity: 8500,
        unitPrice: 2.25,
        total: 19125
      },
      {
        id: 'li16',
        description: 'Mortar and grout mix',
        quantity: 425,
        unitPrice: 78,
        total: 33150
      },
      {
        id: 'li17',
        description: 'Delivery and pumping services',
        quantity: 1,
        unitPrice: 475,
        total: 475
      }
    ]
  },
  {
    id: 'inv6',
    invoiceNumber: 'INV-2026-006',
    contractor: 'Carlos Rodriguez',
    contractorId: 'c6',
    contractorCompany: 'Precision Glass & Glazing',
    amount: 325000,
    subtotal: 325000,
    dueDate: '2026-03-20',
    issueDate: '2026-03-01',
    status: 'paid',
    category: 'Materials',
    projectId: 'p1',
    projectName: 'Metropolitan Heights Tower',
    description: 'Curtain wall and glazing system',
    paymentTerms: 'Net 20',
    lineItems: [
      {
        id: 'li18',
        description: 'Low-E tempered glass panels',
        quantity: 280,
        unitPrice: 950,
        total: 266000
      },
      {
        id: 'li19',
        description: 'Aluminum framing system',
        quantity: 1,
        unitPrice: 45000,
        total: 45000
      },
      {
        id: 'li20',
        description: 'Installation hardware and sealants',
        quantity: 1,
        unitPrice: 14000,
        total: 14000
      }
    ],
    approvedBy: 'Sarah Johnson',
    approvedDate: '2026-03-08',
    paidDate: '2026-03-18',
    paymentMethod: 'Wire Transfer'
  },
  {
    id: 'inv7',
    invoiceNumber: 'INV-2026-007',
    contractor: 'Angela Brown',
    contractorId: 'c7',
    contractorCompany: 'SafeWork Construction Safety',
    amount: 28500,
    subtotal: 28500,
    dueDate: '2026-03-28',
    issueDate: '2026-03-05',
    status: 'approved',
    category: 'Safety & Compliance',
    projectId: 'p1',
    projectName: 'Metropolitan Heights Tower',
    description: 'Monthly safety equipment and training',
    paymentTerms: 'Net 30',
    lineItems: [
      {
        id: 'li21',
        description: 'Safety harnesses and equipment',
        quantity: 45,
        unitPrice: 285,
        total: 12825
      },
      {
        id: 'li22',
        description: 'Hard hats and PPE',
        quantity: 120,
        unitPrice: 65,
        total: 7800
      },
      {
        id: 'li23',
        description: 'Safety training sessions',
        quantity: 1,
        unitPrice: 7875,
        total: 7875
      }
    ],
    approvedBy: 'Sarah Johnson',
    approvedDate: '2026-03-09'
  },
  {
    id: 'inv8',
    invoiceNumber: 'INV-2026-008',
    contractor: 'Thomas Anderson',
    contractorId: 'c8',
    contractorCompany: 'Metro Equipment Rentals',
    amount: 142000,
    subtotal: 142000,
    dueDate: '2026-04-10',
    issueDate: '2026-03-12',
    status: 'draft',
    category: 'Equipment Rental',
    projectId: 'p1',
    projectName: 'Metropolitan Heights Tower',
    description: 'Heavy equipment rental - March 2026',
    paymentTerms: 'Net 30',
    lineItems: [
      {
        id: 'li24',
        description: 'Tower crane rental - 1 month',
        quantity: 1,
        unitPrice: 95000,
        total: 95000
      },
      {
        id: 'li25',
        description: 'Scissor lifts (3 units)',
        quantity: 3,
        unitPrice: 8500,
        total: 25500
      },
      {
        id: 'li26',
        description: 'Concrete pump rental',
        quantity: 5,
        unitPrice: 2700,
        total: 13500
      },
      {
        id: 'li27',
        description: 'Generator 500kW',
        quantity: 1,
        unitPrice: 8000,
        total: 8000
      }
    ],
    notes: 'Draft invoice - pending final approval'
  },
  {
    id: 'inv9',
    invoiceNumber: 'INV-2026-009',
    contractor: 'Patricia Green',
    contractorId: 'c9',
    contractorCompany: 'Climate Control Specialists',
    amount: 68900,
    subtotal: 68900,
    dueDate: '2026-03-22',
    issueDate: '2026-03-03',
    status: 'rejected',
    category: 'Labor',
    projectId: 'p2',
    projectName: 'Riverside Medical Center',
    description: 'HVAC installation services',
    paymentTerms: 'Net 20',
    lineItems: [
      {
        id: 'li28',
        description: 'HVAC installation labor',
        quantity: 180,
        unitPrice: 325,
        total: 58500
      },
      {
        id: 'li29',
        description: 'System testing and commissioning',
        quantity: 1,
        unitPrice: 10400,
        total: 10400
      }
    ],
    notes: 'Rejected - pricing discrepancy needs resolution'
  },
  {
    id: 'inv10',
    invoiceNumber: 'INV-2026-010',
    contractor: 'James Wilson',
    contractorId: 'c10',
    contractorCompany: 'ProRoof Systems',
    amount: 215000,
    subtotal: 215000,
    dueDate: '2026-04-15',
    issueDate: '2026-03-11',
    status: 'pending',
    category: 'Materials & Labor',
    projectId: 'p3',
    projectName: 'Oakwood Corporate Campus',
    description: 'Roofing materials and installation',
    paymentTerms: 'Net 35',
    lineItems: [
      {
        id: 'li30',
        description: 'TPO roofing membrane 60-mil',
        quantity: 45,
        unitPrice: 2800,
        total: 126000
      },
      {
        id: 'li31',
        description: 'Insulation boards R-30',
        quantity: 320,
        unitPrice: 125,
        total: 40000
      },
      {
        id: 'li32',
        description: 'Installation labor',
        quantity: 1,
        unitPrice: 49000,
        total: 49000
      }
    ]
  }
];
