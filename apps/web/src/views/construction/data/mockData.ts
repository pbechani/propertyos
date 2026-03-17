import { Project, Task, Contractor, Budget, Material, Risk, Issue, Document, AIAgent, Notification, PurchaseOrder, InventoryItem, FinancialData } from '@/views/construction/types';

export const mockProjects: Project[] = [
  {
    id: 'p1',
    name: 'Tower A - Luxury Residential',
    type: 'Residential High-Rise',
    status: 'active',
    location: 'Downtown Manhattan, NY',
    budget: 45000000,
    spent: 28500000,
    progress: 63,
    startDate: '2025-06-01',
    endDate: '2027-03-15',
    manager: 'Sarah Johnson',
    phase: 'Structural Completion',
    riskLevel: 'medium',
    contractors: 12,
    milestones: 8,
    completedMilestones: 5
  },
  {
    id: 'p2',
    name: 'Riverside Commercial Complex',
    type: 'Commercial Office',
    status: 'delayed',
    location: 'Brooklyn, NY',
    budget: 32000000,
    spent: 21000000,
    progress: 58,
    startDate: '2025-08-15',
    endDate: '2026-12-30',
    manager: 'Michael Chen',
    phase: 'MEP Installation',
    riskLevel: 'high',
    contractors: 9,
    milestones: 6,
    completedMilestones: 3
  },
  {
    id: 'p3',
    name: 'GreenTech Industrial Park',
    type: 'Industrial Complex',
    status: 'active',
    location: 'Newark, NJ',
    budget: 67000000,
    spent: 15400000,
    progress: 23,
    startDate: '2026-01-10',
    endDate: '2028-06-20',
    manager: 'David Martinez',
    phase: 'Foundation Work',
    riskLevel: 'low',
    contractors: 15,
    milestones: 10,
    completedMilestones: 2
  },
  {
    id: 'p4',
    name: 'Lakeside Shopping Center',
    type: 'Retail',
    status: 'planning',
    location: 'Queens, NY',
    budget: 28000000,
    spent: 2100000,
    progress: 8,
    startDate: '2026-03-01',
    endDate: '2027-09-15',
    manager: 'Emily Rodriguez',
    phase: 'Planning & Permits',
    riskLevel: 'low',
    contractors: 0,
    milestones: 7,
    completedMilestones: 0
  }
];

export const mockTasks: Task[] = [
  {
    id: 't1',
    projectId: 'p1',
    title: 'Complete Level 15 Concrete Pour',
    description: 'Pour concrete for level 15 structural slab',
    status: 'in-progress',
    priority: 'high',
    assignee: 'BuildTech Construction',
    startDate: '2026-03-05',
    dueDate: '2026-03-12',
    progress: 65,
    dependencies: ['t5'],
    phase: 'Structural',
    contractor: 'BuildTech Construction',
    attachments: [
      { id: 'a1', name: 'structural_plans_v3.pdf', type: 'pdf', size: '2.4 MB' },
      { id: 'a2', name: 'concrete_specs.xlsx', type: 'excel', size: '156 KB' }
    ]
  },
  {
    id: 't2',
    projectId: 'p1',
    title: 'Install MEP Risers (Levels 10-15)',
    description: 'Install mechanical, electrical, and plumbing vertical risers',
    status: 'in-progress',
    priority: 'medium',
    assignee: 'ABC Mechanical',
    startDate: '2026-03-01',
    dueDate: '2026-03-20',
    progress: 42,
    dependencies: ['t1'],
    phase: 'MEP',
    attachments: [
      { id: 'a3', name: 'mep_drawings.pdf', type: 'pdf', size: '5.2 MB' }
    ]
  },
  {
    id: 't3',
    projectId: 'p1',
    title: 'Facade Installation - South Elevation',
    description: 'Install glass curtain wall on south side',
    status: 'todo',
    priority: 'medium',
    assignee: 'GlassTech Solutions',
    startDate: '2026-03-15',
    dueDate: '2026-04-10',
    progress: 0,
    dependencies: ['t1'],
    phase: 'Exterior',
    attachments: [
      { id: 'a4', name: 'facade_details.pdf', type: 'pdf', size: '3.8 MB' },
      { id: 'a5', name: 'glass_specifications.docx', type: 'word', size: '245 KB' },
      { id: 'a6', name: 'elevation_photo.jpg', type: 'image', size: '1.2 MB' }
    ]
  },
  {
    id: 't4',
    projectId: 'p2',
    title: 'Roof Waterproofing',
    description: 'Apply waterproofing membrane to entire roof surface',
    status: 'blocked',
    priority: 'critical',
    assignee: 'ProRoof Systems',
    startDate: '2026-02-28',
    dueDate: '2026-03-10',
    progress: 25,
    dependencies: [],
    phase: 'Roofing',
    contractor: 'ProRoof Systems',
    attachments: []
  },
  {
    id: 't5',
    projectId: 'p1',
    title: 'Level 14 Rebar Installation',
    description: 'Complete rebar placement for level 14',
    status: 'completed',
    priority: 'high',
    assignee: 'SteelWorks Inc',
    startDate: '2026-02-25',
    dueDate: '2026-03-04',
    progress: 100,
    dependencies: [],
    phase: 'Structural',
    attachments: [
      { id: 'a7', name: 'rebar_schedule.pdf', type: 'pdf', size: '890 KB' }
    ]
  },
  {
    id: 't6',
    projectId: 'p2',
    title: 'Electrical Panel Upgrade',
    description: 'Upgrade main electrical distribution panels',
    status: 'review',
    priority: 'high',
    assignee: 'ElectriCorp Services',
    startDate: '2026-03-08',
    dueDate: '2026-03-15',
    progress: 90,
    dependencies: [],
    phase: 'Electrical',
    attachments: [
      { id: 'a8', name: 'electrical_diagram.pdf', type: 'pdf', size: '1.5 MB' },
      { id: 'a9', name: 'inspection_checklist.xlsx', type: 'excel', size: '78 KB' }
    ]
  },
  {
    id: 't7',
    projectId: 'p3',
    title: 'Site Survey and Assessment',
    description: 'Complete topographical survey and soil testing',
    status: 'todo',
    priority: 'high',
    assignee: 'GeoTech Surveyors',
    startDate: '2026-03-20',
    dueDate: '2026-03-28',
    progress: 0,
    dependencies: [],
    phase: 'Pre-Construction',
    attachments: []
  },
  {
    id: 't8',
    projectId: 'p1',
    title: 'HVAC System Installation - Zone A',
    description: 'Install HVAC units and ductwork for zone A',
    status: 'review',
    priority: 'medium',
    assignee: 'ABC Mechanical',
    startDate: '2026-03-10',
    dueDate: '2026-03-25',
    progress: 85,
    dependencies: ['t2'],
    phase: 'MEP',
    attachments: [
      { id: 'a10', name: 'hvac_layout.pdf', type: 'pdf', size: '4.1 MB' }
    ]
  }
];

export const mockContractors: Contractor[] = [
  {
    id: 'c1',
    name: 'BuildTech Construction',
    type: 'General Contractor',
    rating: 4.8,
    projectsCompleted: 47,
    activeProjects: 3,
    performance: 92,
    license: 'GC-NY-2024-1847',
    licenseExpiry: '2027-06-30',
    insurance: 'INS-NY-8847392',
    insuranceExpiry: '2026-12-31',
    specialties: ['High-Rise', 'Structural', 'Concrete'],
    status: 'active',
    contact: 'John Peterson',
    email: 'john@buildtech.com',
    phone: '+1 (212) 555-0123',
    website: 'www.buildtech-construction.com',
    address: '450 Park Avenue, New York, NY 10022',
    yearEstablished: 2008,
    employeeCount: 85,
    description: 'BuildTech Construction is a leading general contractor specializing in high-rise commercial and residential projects. With over 15 years of experience, we deliver exceptional quality and safety standards.',
    certifications: ['LEED Certified', 'OSHA 30-Hour', 'ISO 9001:2015'],
    safetyRating: 95,
    onTimeDelivery: 88,
    qualityScore: 92,
    communicationScore: 90,
    licenses: [
      {
        id: 'l1',
        type: 'General Contractor License',
        number: 'GC-NY-2024-1847',
        issuedBy: 'New York State Department of Buildings',
        issueDate: '2024-06-15',
        expiryDate: '2027-06-30',
        status: 'active'
      },
      {
        id: 'l2',
        type: 'Specialty Contractor - Concrete',
        number: 'SC-CON-2024-9821',
        issuedBy: 'NYC DOB',
        issueDate: '2024-07-01',
        expiryDate: '2027-07-01',
        status: 'active'
      }
    ],
    insurancePolicies: [
      {
        id: 'i1',
        type: 'General Liability',
        provider: 'Travelers Insurance',
        policyNumber: 'GL-8847392-2024',
        coverage: '$5,000,000',
        effectiveDate: '2024-01-01',
        expiryDate: '2026-12-31',
        status: 'active'
      },
      {
        id: 'i2',
        type: 'Workers Compensation',
        provider: 'Liberty Mutual',
        policyNumber: 'WC-4521789-2024',
        coverage: '$2,000,000',
        effectiveDate: '2024-01-01',
        expiryDate: '2026-12-31',
        status: 'active'
      },
      {
        id: 'i3',
        type: 'Professional Liability',
        provider: 'AIG',
        policyNumber: 'PL-7893214-2024',
        coverage: '$3,000,000',
        effectiveDate: '2024-01-01',
        expiryDate: '2026-12-31',
        status: 'active'
      }
    ],
    pastProjects: [
      {
        id: 'pp1',
        name: 'Manhattan Plaza Tower',
        client: 'Silverstein Properties',
        value: 45000000,
        duration: '18 months',
        completionDate: '2025-11-20',
        rating: 4.9
      },
      {
        id: 'pp2',
        name: 'Brooklyn Heights Residential',
        client: 'Forest City Ratner',
        value: 32000000,
        duration: '14 months',
        completionDate: '2025-06-15',
        rating: 4.7
      },
      {
        id: 'pp3',
        name: 'Financial District Office Complex',
        client: 'Brookfield Properties',
        value: 58000000,
        duration: '22 months',
        completionDate: '2024-12-10',
        rating: 4.8
      },
      {
        id: 'pp4',
        name: 'Queens Commercial Center',
        client: 'Related Companies',
        value: 28000000,
        duration: '12 months',
        completionDate: '2024-08-30',
        rating: 4.6
      }
    ],
    paymentHistory: [
      {
        id: 'ph1',
        projectId: 'p1',
        projectName: 'Metropolitan Heights Tower',
        amount: 2500000,
        dueDate: '2026-02-28',
        paidDate: '2026-02-25',
        status: 'paid',
        invoiceNumber: 'INV-2024-0245'
      },
      {
        id: 'ph2',
        projectId: 'p1',
        projectName: 'Metropolitan Heights Tower',
        amount: 1800000,
        dueDate: '2026-03-15',
        paidDate: '2026-03-14',
        status: 'paid',
        invoiceNumber: 'INV-2024-0289'
      },
      {
        id: 'ph3',
        projectId: 'p1',
        projectName: 'Metropolitan Heights Tower',
        amount: 2200000,
        dueDate: '2026-03-31',
        status: 'pending',
        invoiceNumber: 'INV-2024-0312'
      }
    ]
  },
  {
    id: 'c2',
    name: 'ABC Mechanical',
    type: 'MEP Contractor',
    rating: 4.6,
    projectsCompleted: 89,
    activeProjects: 7,
    performance: 88,
    license: 'MEP-NY-2023-4521',
    licenseExpiry: '2027-03-15',
    insurance: 'INS-NY-7745821',
    insuranceExpiry: '2026-09-30',
    specialties: ['HVAC', 'Plumbing', 'Electrical'],
    status: 'active',
    contact: 'Maria Santos',
    email: 'maria@abcmech.com',
    phone: '+1 (212) 555-0456',
    website: 'www.abcmechanical.com',
    address: '789 Industrial Parkway, Long Island City, NY 11101',
    yearEstablished: 2012,
    employeeCount: 62,
    description: 'ABC Mechanical provides comprehensive MEP solutions for commercial and residential projects. Our certified technicians deliver innovative and energy-efficient systems.',
    certifications: ['NATE Certified', 'EPA 608 Universal', 'Master Electrician License'],
    safetyRating: 91,
    onTimeDelivery: 85,
    qualityScore: 89,
    communicationScore: 87,
    licenses: [
      {
        id: 'l3',
        type: 'MEP Contractor License',
        number: 'MEP-NY-2023-4521',
        issuedBy: 'New York State',
        issueDate: '2023-03-10',
        expiryDate: '2027-03-15',
        status: 'active'
      }
    ],
    insurancePolicies: [
      {
        id: 'i4',
        type: 'General Liability',
        provider: 'Hartford Insurance',
        policyNumber: 'GL-7745821-2023',
        coverage: '$3,000,000',
        effectiveDate: '2023-09-01',
        expiryDate: '2026-09-30',
        status: 'active'
      }
    ],
    pastProjects: [
      {
        id: 'pp5',
        name: 'Hudson Yards HVAC Installation',
        client: 'Related-Oxford',
        value: 8500000,
        duration: '10 months',
        completionDate: '2025-09-15',
        rating: 4.7
      },
      {
        id: 'pp6',
        name: 'JFK Terminal Mechanical Systems',
        client: 'Port Authority NY/NJ',
        value: 12000000,
        duration: '16 months',
        completionDate: '2025-03-20',
        rating: 4.5
      }
    ],
    paymentHistory: [
      {
        id: 'ph4',
        projectId: 'p1',
        projectName: 'Metropolitan Heights Tower',
        amount: 850000,
        dueDate: '2026-02-15',
        paidDate: '2026-02-18',
        status: 'paid',
        invoiceNumber: 'INV-ABC-0156'
      },
      {
        id: 'ph5',
        projectId: 'p1',
        projectName: 'Metropolitan Heights Tower',
        amount: 920000,
        dueDate: '2026-03-20',
        status: 'pending',
        invoiceNumber: 'INV-ABC-0178'
      }
    ]
  },
  {
    id: 'c3',
    name: 'ProRoof Systems',
    type: 'Roofing Specialist',
    rating: 4.3,
    projectsCompleted: 124,
    activeProjects: 5,
    performance: 75,
    license: 'RF-NY-2024-9384',
    licenseExpiry: '2026-08-20',
    insurance: 'INS-NY-2293847',
    insuranceExpiry: '2026-07-15',
    specialties: ['Waterproofing', 'Membrane Systems', 'Metal Roofing'],
    status: 'active',
    contact: 'Robert Williams',
    email: 'robert@proroof.com',
    phone: '+1 (718) 555-0789',
    website: 'www.proroofystems.com',
    address: '1250 Brooklyn Avenue, Brooklyn, NY 11203',
    yearEstablished: 2015,
    employeeCount: 38,
    description: 'ProRoof Systems specializes in commercial roofing solutions with expertise in waterproofing and membrane installation.',
    certifications: ['GAF Master Elite', 'Firestone Master Contractor'],
    safetyRating: 82,
    onTimeDelivery: 78,
    qualityScore: 80,
    communicationScore: 75,
    licenses: [
      {
        id: 'l4',
        type: 'Roofing Contractor License',
        number: 'RF-NY-2024-9384',
        issuedBy: 'NYC DOB',
        issueDate: '2024-08-15',
        expiryDate: '2026-08-20',
        status: 'active'
      }
    ],
    insurancePolicies: [
      {
        id: 'i5',
        type: 'General Liability',
        provider: 'State Farm',
        policyNumber: 'GL-2293847-2024',
        coverage: '$2,000,000',
        effectiveDate: '2024-07-01',
        expiryDate: '2026-07-15',
        status: 'active'
      }
    ],
    pastProjects: [
      {
        id: 'pp7',
        name: 'Chelsea Market Roof Replacement',
        client: 'Jamestown Properties',
        value: 1800000,
        duration: '6 months',
        completionDate: '2025-10-05',
        rating: 4.4
      }
    ],
    paymentHistory: [
      {
        id: 'ph6',
        projectId: 'p2',
        projectName: 'Greenpoint Residential Complex',
        amount: 450000,
        dueDate: '2026-03-10',
        status: 'overdue',
        invoiceNumber: 'INV-PRF-0089'
      }
    ]
  }
];

export const mockPurchaseOrders: PurchaseOrder[] = [
  {
    id: 'po1',
    poNumber: 'PO-2026-0345',
    projectId: 'p1',
    projectName: 'Metropolitan Heights Tower',
    supplier: 'BuildMart Supply Co.',
    supplierId: 's1',
    items: [
      {
        id: 'i1',
        material: 'Concrete - Grade 40',
        category: 'Structural Materials',
        quantity: 500,
        unit: 'cubic yards',
        unitPrice: 120,
        totalPrice: 60000
      },
      {
        id: 'i2',
        material: 'Rebar #8',
        category: 'Structural Materials',
        quantity: 15000,
        unit: 'lbs',
        unitPrice: 0.85,
        totalPrice: 12750
      }
    ],
    totalValue: 72750,
    deliveryDate: '2026-03-20',
    orderDate: '2026-03-05',
    status: 'approved',
    requestedBy: 'Michael Chen',
    approvedBy: 'Sarah Johnson',
    approvalDate: '2026-03-06',
    deliveryAddress: '250 Park Avenue, New York, NY 10177',
    notes: 'Deliver to north entrance. Site contact: John Peterson',
    trackingNumber: 'TRK-98234-NYC',
    expectedDelivery: '2026-03-20',
    paymentTerms: 'Net 30',
    shippingMethod: 'Ground - Standard'
  },
  {
    id: 'po2',
    poNumber: 'PO-2026-0346',
    projectId: 'p1',
    projectName: 'Metropolitan Heights Tower',
    supplier: 'Elite Steel Solutions',
    supplierId: 's2',
    items: [
      {
        id: 'i3',
        material: 'Structural Steel Beams',
        category: 'Structural Materials',
        quantity: 250,
        unit: 'tons',
        unitPrice: 1200,
        totalPrice: 300000
      }
    ],
    totalValue: 300000,
    deliveryDate: '2026-03-25',
    orderDate: '2026-03-08',
    status: 'in-transit',
    requestedBy: 'David Kim',
    approvedBy: 'Sarah Johnson',
    approvalDate: '2026-03-09',
    deliveryAddress: '250 Park Avenue, New York, NY 10177',
    notes: 'Requires crane for unloading',
    trackingNumber: 'TRK-98456-NYC',
    expectedDelivery: '2026-03-25',
    paymentTerms: 'Net 45',
    shippingMethod: 'Freight - Express'
  },
  {
    id: 'po3',
    poNumber: 'PO-2026-0347',
    projectId: 'p2',
    projectName: 'Greenpoint Residential Complex',
    supplier: 'Premier HVAC Supplies',
    supplierId: 's3',
    items: [
      {
        id: 'i4',
        material: 'HVAC Units - Commercial Grade',
        category: 'MEP Equipment',
        quantity: 12,
        unit: 'units',
        unitPrice: 8500,
        totalPrice: 102000
      },
      {
        id: 'i5',
        material: 'Ductwork - Galvanized Steel',
        category: 'MEP Materials',
        quantity: 2000,
        unit: 'linear feet',
        unitPrice: 15,
        totalPrice: 30000
      }
    ],
    totalValue: 132000,
    deliveryDate: '2026-03-28',
    orderDate: '2026-03-10',
    status: 'pending-approval',
    requestedBy: 'Maria Santos',
    deliveryAddress: '145 Greenpoint Avenue, Brooklyn, NY 11222',
    notes: 'Coordinate delivery with site manager',
    expectedDelivery: '2026-03-28',
    paymentTerms: 'Net 30',
    shippingMethod: 'Ground - Standard'
  },
  {
    id: 'po4',
    poNumber: 'PO-2026-0348',
    projectId: 'p1',
    projectName: 'Metropolitan Heights Tower',
    supplier: 'BuildMart Supply Co.',
    supplierId: 's1',
    items: [
      {
        id: 'i6',
        material: 'Electrical Wiring - 12 AWG',
        category: 'Electrical Materials',
        quantity: 5000,
        unit: 'feet',
        unitPrice: 0.45,
        totalPrice: 2250
      },
      {
        id: 'i7',
        material: 'Circuit Breakers - 200A',
        category: 'Electrical Equipment',
        quantity: 25,
        unit: 'units',
        unitPrice: 185,
        totalPrice: 4625
      },
      {
        id: 'i8',
        material: 'Conduit - EMT 1"',
        category: 'Electrical Materials',
        quantity: 1000,
        unit: 'feet',
        unitPrice: 2.5,
        totalPrice: 2500
      }
    ],
    totalValue: 9375,
    deliveryDate: '2026-03-15',
    orderDate: '2026-02-28',
    status: 'delivered',
    requestedBy: 'James Wilson',
    approvedBy: 'Sarah Johnson',
    approvalDate: '2026-03-01',
    deliveryAddress: '250 Park Avenue, New York, NY 10177',
    trackingNumber: 'TRK-97892-NYC',
    expectedDelivery: '2026-03-15',
    actualDelivery: '2026-03-14',
    paymentTerms: 'Net 30',
    shippingMethod: 'Ground - Standard'
  },
  {
    id: 'po5',
    poNumber: 'PO-2026-0349',
    projectId: 'p3',
    projectName: 'Downtown Innovation Hub',
    supplier: 'Precision Glass & Glazing',
    supplierId: 's4',
    items: [
      {
        id: 'i9',
        material: 'Tempered Glass Panels',
        category: 'Facade Materials',
        quantity: 180,
        unit: 'panels',
        unitPrice: 850,
        totalPrice: 153000
      }
    ],
    totalValue: 153000,
    deliveryDate: '2026-04-10',
    orderDate: '2026-03-12',
    status: 'approved',
    requestedBy: 'Robert Chen',
    approvedBy: 'Emily Davis',
    approvalDate: '2026-03-13',
    deliveryAddress: '789 Innovation Drive, Manhattan, NY 10001',
    notes: 'Fragile - Handle with care. Requires covered storage.',
    trackingNumber: 'TRK-98567-NYC',
    expectedDelivery: '2026-04-10',
    paymentTerms: 'Net 45',
    shippingMethod: 'Freight - White Glove'
  },
  {
    id: 'po6',
    poNumber: 'PO-2026-0350',
    projectId: 'p2',
    projectName: 'Greenpoint Residential Complex',
    supplier: 'Urban Plumbing Wholesale',
    supplierId: 's5',
    items: [
      {
        id: 'i10',
        material: 'Copper Pipe - 3/4"',
        category: 'Plumbing Materials',
        quantity: 3000,
        unit: 'feet',
        unitPrice: 3.75,
        totalPrice: 11250
      },
      {
        id: 'i11',
        material: 'PVC Drainage Pipe - 4"',
        category: 'Plumbing Materials',
        quantity: 1500,
        unit: 'feet',
        unitPrice: 2.25,
        totalPrice: 3375
      },
      {
        id: 'i12',
        material: 'Fixtures - Premium Bath Suite',
        category: 'Plumbing Fixtures',
        quantity: 45,
        unit: 'sets',
        unitPrice: 1200,
        totalPrice: 54000
      }
    ],
    totalValue: 68625,
    deliveryDate: '2026-03-30',
    orderDate: '2026-03-11',
    status: 'draft',
    requestedBy: 'Maria Santos',
    deliveryAddress: '145 Greenpoint Avenue, Brooklyn, NY 11222',
    notes: 'Draft - Pending final fixture selection',
    expectedDelivery: '2026-03-30',
    paymentTerms: 'Net 30',
    shippingMethod: 'Ground - Standard'
  },
  {
    id: 'po7',
    poNumber: 'PO-2026-0351',
    projectId: 'p1',
    projectName: 'Metropolitan Heights Tower',
    supplier: 'BuildMart Supply Co.',
    supplierId: 's1',
    items: [
      {
        id: 'i13',
        material: 'Concrete - Grade 50',
        category: 'Structural Materials',
        quantity: 300,
        unit: 'cubic yards',
        unitPrice: 135,
        totalPrice: 40500
      }
    ],
    totalValue: 40500,
    deliveryDate: '2026-03-18',
    orderDate: '2026-03-04',
    status: 'partially-delivered',
    requestedBy: 'Michael Chen',
    approvedBy: 'Sarah Johnson',
    approvalDate: '2026-03-05',
    deliveryAddress: '250 Park Avenue, New York, NY 10177',
    trackingNumber: 'TRK-98001-NYC',
    expectedDelivery: '2026-03-18',
    notes: '200 cubic yards delivered on 3/18. Remaining 100 scheduled for 3/22',
    paymentTerms: 'Net 30',
    shippingMethod: 'Ground - Standard'
  },
  {
    id: 'po8',
    poNumber: 'PO-2026-0352',
    projectId: 'p3',
    projectName: 'Downtown Innovation Hub',
    supplier: 'Tech Systems Integration',
    supplierId: 's6',
    items: [
      {
        id: 'i14',
        material: 'Building Management System',
        category: 'Smart Building',
        quantity: 1,
        unit: 'system',
        unitPrice: 125000,
        totalPrice: 125000
      },
      {
        id: 'i15',
        material: 'Sensors - IoT Temperature',
        category: 'Smart Building',
        quantity: 200,
        unit: 'units',
        unitPrice: 75,
        totalPrice: 15000
      }
    ],
    totalValue: 140000,
    deliveryDate: '2026-04-15',
    orderDate: '2026-02-20',
    status: 'cancelled',
    requestedBy: 'Robert Chen',
    deliveryAddress: '789 Innovation Drive, Manhattan, NY 10001',
    notes: 'Cancelled - Switching to different vendor',
    paymentTerms: 'Net 60',
    shippingMethod: 'Freight - Express'
  }
];

export const mockInventoryItems: InventoryItem[] = [
  {
    id: 'inv1',
    materialName: 'Concrete - Grade 40',
    category: 'Structural Materials',
    quantity: 850,
    unit: 'cubic yards',
    minimumStock: 200,
    reorderPoint: 300,
    supplier: 'BuildMart Supply Co.',
    supplierId: 's1',
    location: 'Main Warehouse - Zone A',
    locationId: 'loc1',
    unitCost: 120,
    totalValue: 102000,
    lastRestocked: '2026-03-08',
    status: 'in-stock',
    sku: 'CON-G40-001',
    description: 'High-strength concrete mix for structural applications'
  },
  {
    id: 'inv2',
    materialName: 'Rebar #8',
    category: 'Structural Materials',
    quantity: 4500,
    unit: 'lbs',
    minimumStock: 5000,
    reorderPoint: 7500,
    supplier: 'Elite Steel Solutions',
    supplierId: 's2',
    location: 'Main Warehouse - Zone B',
    locationId: 'loc2',
    unitCost: 0.85,
    totalValue: 3825,
    lastRestocked: '2026-03-05',
    status: 'low-stock',
    sku: 'RBR-8-002',
    description: 'Grade 60 deformed steel reinforcing bar'
  },
  {
    id: 'inv3',
    materialName: 'Structural Steel Beams',
    category: 'Structural Materials',
    quantity: 125,
    unit: 'tons',
    minimumStock: 50,
    reorderPoint: 75,
    supplier: 'Elite Steel Solutions',
    supplierId: 's2',
    location: 'Outdoor Storage - Yard 1',
    locationId: 'loc3',
    unitCost: 1200,
    totalValue: 150000,
    lastRestocked: '2026-03-01',
    status: 'in-stock',
    sku: 'STL-BM-003',
    description: 'Wide flange I-beams for structural support'
  },
  {
    id: 'inv4',
    materialName: 'HVAC Units - Commercial Grade',
    category: 'MEP Equipment',
    quantity: 3,
    unit: 'units',
    minimumStock: 5,
    reorderPoint: 8,
    supplier: 'Premier HVAC Supplies',
    supplierId: 's3',
    location: 'Equipment Storage - Building C',
    locationId: 'loc4',
    unitCost: 8500,
    totalValue: 25500,
    lastRestocked: '2026-02-15',
    status: 'low-stock',
    sku: 'HVAC-CM-004',
    description: '10-ton commercial HVAC units with variable speed'
  },
  {
    id: 'inv5',
    materialName: 'Electrical Wiring - 12 AWG',
    category: 'Electrical Materials',
    quantity: 12000,
    unit: 'feet',
    minimumStock: 3000,
    reorderPoint: 5000,
    supplier: 'BuildMart Supply Co.',
    supplierId: 's1',
    location: 'Main Warehouse - Zone C',
    locationId: 'loc5',
    unitCost: 0.45,
    totalValue: 5400,
    lastRestocked: '2026-03-10',
    status: 'in-stock',
    sku: 'ELC-WR-005',
    description: 'Copper electrical wiring, NM-B cable'
  },
  {
    id: 'inv6',
    materialName: 'Tempered Glass Panels',
    category: 'Facade Materials',
    quantity: 45,
    unit: 'panels',
    minimumStock: 20,
    reorderPoint: 30,
    supplier: 'Precision Glass & Glazing',
    supplierId: 's4',
    location: 'Secure Storage - Building D',
    locationId: 'loc6',
    unitCost: 850,
    totalValue: 38250,
    lastRestocked: '2026-03-12',
    status: 'in-stock',
    sku: 'GLS-TMP-006',
    description: 'Low-E tempered safety glass, 1/2 inch thick'
  },
  {
    id: 'inv7',
    materialName: 'Copper Pipe - 3/4"',
    category: 'Plumbing Materials',
    quantity: 8000,
    unit: 'feet',
    minimumStock: 2000,
    reorderPoint: 3500,
    supplier: 'Urban Plumbing Wholesale',
    supplierId: 's5',
    location: 'Main Warehouse - Zone C',
    locationId: 'loc5',
    unitCost: 3.75,
    totalValue: 30000,
    lastRestocked: '2026-03-09',
    status: 'in-stock',
    sku: 'PLM-CP-007',
    description: 'Type L copper tubing for water supply'
  },
  {
    id: 'inv8',
    materialName: 'PVC Drainage Pipe - 4"',
    category: 'Plumbing Materials',
    quantity: 0,
    unit: 'feet',
    minimumStock: 1000,
    reorderPoint: 1500,
    supplier: 'Urban Plumbing Wholesale',
    supplierId: 's5',
    location: 'Main Warehouse - Zone C',
    locationId: 'loc5',
    unitCost: 2.25,
    totalValue: 0,
    lastRestocked: '2026-02-28',
    status: 'out-of-stock',
    sku: 'PLM-PVC-008',
    description: 'Schedule 40 PVC drain waste vent pipe'
  },
  {
    id: 'inv9',
    materialName: 'Drywall - 1/2" Standard',
    category: 'Finishing Materials',
    quantity: 850,
    unit: 'sheets',
    minimumStock: 200,
    reorderPoint: 350,
    supplier: 'BuildMart Supply Co.',
    supplierId: 's1',
    location: 'Main Warehouse - Zone D',
    locationId: 'loc7',
    unitCost: 12,
    totalValue: 10200,
    lastRestocked: '2026-03-11',
    status: 'in-stock',
    sku: 'FIN-DRY-009',
    description: 'Standard gypsum board, 4x8 sheets'
  },
  {
    id: 'inv10',
    materialName: 'Insulation - Fiberglass R-19',
    category: 'Insulation Materials',
    quantity: 125,
    unit: 'rolls',
    minimumStock: 100,
    reorderPoint: 150,
    supplier: 'BuildMart Supply Co.',
    supplierId: 's1',
    location: 'Main Warehouse - Zone E',
    locationId: 'loc8',
    unitCost: 45,
    totalValue: 5625,
    lastRestocked: '2026-03-07',
    status: 'in-stock',
    sku: 'INS-FBG-010',
    description: 'Fiberglass batt insulation for walls'
  },
  {
    id: 'inv11',
    materialName: 'Paint - Interior Latex',
    category: 'Finishing Materials',
    quantity: 45,
    unit: 'gallons',
    minimumStock: 50,
    reorderPoint: 75,
    supplier: 'BuildMart Supply Co.',
    supplierId: 's1',
    location: 'Main Warehouse - Zone D',
    locationId: 'loc7',
    unitCost: 35,
    totalValue: 1575,
    lastRestocked: '2026-03-06',
    status: 'low-stock',
    sku: 'FIN-PNT-011',
    description: 'Premium interior latex paint, white base'
  },
  {
    id: 'inv12',
    materialName: 'Roofing Membrane - TPO',
    category: 'Roofing Materials',
    quantity: 15,
    unit: 'rolls',
    minimumStock: 10,
    reorderPoint: 15,
    supplier: 'ProRoof Systems',
    supplierId: 's6',
    location: 'Outdoor Storage - Yard 2',
    locationId: 'loc9',
    unitCost: 850,
    totalValue: 12750,
    lastRestocked: '2026-03-04',
    status: 'in-stock',
    sku: 'ROOF-TPO-012',
    description: '60-mil TPO roofing membrane, white'
  },
  {
    id: 'inv13',
    materialName: 'Ceramic Floor Tiles',
    category: 'Finishing Materials',
    quantity: 3500,
    unit: 'sq ft',
    minimumStock: 1000,
    reorderPoint: 1500,
    supplier: 'BuildMart Supply Co.',
    supplierId: 's1',
    location: 'Main Warehouse - Zone D',
    locationId: 'loc7',
    unitCost: 4.5,
    totalValue: 15750,
    lastRestocked: '2026-03-10',
    status: 'in-stock',
    sku: 'FIN-TLE-013',
    description: 'Porcelain ceramic floor tiles, 12x12'
  },
  {
    id: 'inv14',
    materialName: 'LED Light Fixtures',
    category: 'Electrical Equipment',
    quantity: 8,
    unit: 'units',
    minimumStock: 15,
    reorderPoint: 25,
    supplier: 'BuildMart Supply Co.',
    supplierId: 's1',
    location: 'Equipment Storage - Building C',
    locationId: 'loc4',
    unitCost: 125,
    totalValue: 1000,
    lastRestocked: '2026-02-20',
    status: 'low-stock',
    sku: 'ELC-LED-014',
    description: 'Commercial LED troffer fixtures, 2x4'
  },
  {
    id: 'inv15',
    materialName: 'Lumber - 2x4x8 SPF',
    category: 'Framing Materials',
    quantity: 2200,
    unit: 'pieces',
    minimumStock: 500,
    reorderPoint: 800,
    supplier: 'BuildMart Supply Co.',
    supplierId: 's1',
    location: 'Outdoor Storage - Yard 1',
    locationId: 'loc3',
    unitCost: 6.5,
    totalValue: 14300,
    lastRestocked: '2026-03-13',
    status: 'in-stock',
    sku: 'FRM-LMB-015',
    description: 'Kiln-dried spruce-pine-fir framing lumber'
  },
  {
    id: 'inv16',
    materialName: 'Concrete Blocks - 8"',
    category: 'Masonry Materials',
    quantity: 4800,
    unit: 'blocks',
    minimumStock: 1000,
    reorderPoint: 1500,
    supplier: 'BuildMart Supply Co.',
    supplierId: 's1',
    location: 'Outdoor Storage - Yard 2',
    locationId: 'loc9',
    unitCost: 2.25,
    totalValue: 10800,
    lastRestocked: '2026-03-02',
    status: 'in-stock',
    sku: 'MAS-BLK-016',
    description: 'Standard concrete masonry units, 8x8x16'
  },
  {
    id: 'inv17',
    materialName: 'Screws - Construction Grade',
    category: 'Hardware & Fasteners',
    quantity: 85000,
    unit: 'pieces',
    minimumStock: 20000,
    reorderPoint: 30000,
    supplier: 'BuildMart Supply Co.',
    supplierId: 's1',
    location: 'Main Warehouse - Zone F',
    locationId: 'loc10',
    unitCost: 0.05,
    totalValue: 4250,
    lastRestocked: '2026-03-11',
    status: 'in-stock',
    sku: 'HRD-SCR-017',
    description: 'Galvanized construction screws, assorted sizes'
  },
  {
    id: 'inv18',
    materialName: 'Concrete - Grade 50',
    category: 'Structural Materials',
    quantity: 1500,
    unit: 'cubic yards',
    minimumStock: 100,
    reorderPoint: 200,
    supplier: 'BuildMart Supply Co.',
    supplierId: 's1',
    location: 'Main Warehouse - Zone A',
    locationId: 'loc1',
    unitCost: 135,
    totalValue: 202500,
    lastRestocked: '2026-03-12',
    status: 'overstocked',
    sku: 'CON-G50-018',
    description: 'Ultra high-strength concrete for critical structures'
  }
];

export const mockFinancialData: FinancialData = {
  projectId: 'p1',
  projectName: 'Metropolitan Heights Tower',
  totalBudget: 42500000,
  spentToDate: 28350000,
  committed: 6200000,
  remaining: 7950000,
  forecastTotal: 43800000,
  variance: -1300000,
  variancePercentage: -3.1,
  categories: [
    {
      category: 'Labor',
      budgeted: 12500000,
      spent: 8750000,
      committed: 1500000,
      remaining: 2250000,
      percentage: 70
    },
    {
      category: 'Materials',
      budgeted: 15000000,
      spent: 10200000,
      committed: 2800000,
      remaining: 2000000,
      percentage: 68
    },
    {
      category: 'Equipment',
      budgeted: 5500000,
      spent: 3850000,
      committed: 950000,
      remaining: 700000,
      percentage: 70
    },
    {
      category: 'Subcontractors',
      budgeted: 6000000,
      spent: 4100000,
      committed: 800000,
      remaining: 1100000,
      percentage: 68.3
    },
    {
      category: 'Permits & Fees',
      budgeted: 1200000,
      spent: 980000,
      committed: 50000,
      remaining: 170000,
      percentage: 81.7
    },
    {
      category: 'Contingency',
      budgeted: 1800000,
      spent: 320000,
      committed: 100000,
      remaining: 1380000,
      percentage: 17.8
    },
    {
      category: 'Professional Services',
      budgeted: 500000,
      spent: 150000,
      committed: 0,
      remaining: 350000,
      percentage: 30
    }
  ],
  monthlyData: [
    {
      month: 'Sep 2025',
      budgeted: 2100000,
      actual: 1950000,
      forecast: 1950000,
      cashIn: 2500000,
      cashOut: 1950000,
      netCashFlow: 550000
    },
    {
      month: 'Oct 2025',
      budgeted: 2800000,
      actual: 2650000,
      forecast: 2650000,
      cashIn: 3200000,
      cashOut: 2650000,
      netCashFlow: 550000
    },
    {
      month: 'Nov 2025',
      budgeted: 2800000,
      actual: 3150000,
      forecast: 3150000,
      cashIn: 3500000,
      cashOut: 3150000,
      netCashFlow: 350000
    },
    {
      month: 'Dec 2025',
      budgeted: 3500000,
      actual: 3600000,
      forecast: 3600000,
      cashIn: 3800000,
      cashOut: 3600000,
      netCashFlow: 200000
    },
    {
      month: 'Jan 2026',
      budgeted: 4200000,
      actual: 4250000,
      forecast: 4250000,
      cashIn: 4500000,
      cashOut: 4250000,
      netCashFlow: 250000
    },
    {
      month: 'Feb 2026',
      budgeted: 4800000,
      actual: 4950000,
      forecast: 4950000,
      cashIn: 5200000,
      cashOut: 4950000,
      netCashFlow: 250000
    },
    {
      month: 'Mar 2026',
      budgeted: 5200000,
      actual: 5800000,
      forecast: 5800000,
      cashIn: 6000000,
      cashOut: 5800000,
      netCashFlow: 200000
    },
    {
      month: 'Apr 2026',
      budgeted: 4500000,
      actual: 0,
      forecast: 5200000,
      cashIn: 5400000,
      cashOut: 5200000,
      netCashFlow: 200000
    },
    {
      month: 'May 2026',
      budgeted: 3800000,
      actual: 0,
      forecast: 4100000,
      cashIn: 4300000,
      cashOut: 4100000,
      netCashFlow: 200000
    },
    {
      month: 'Jun 2026',
      budgeted: 3200000,
      actual: 0,
      forecast: 3500000,
      cashIn: 3700000,
      cashOut: 3500000,
      netCashFlow: 200000
    },
    {
      month: 'Jul 2026',
      budgeted: 2600000,
      actual: 0,
      forecast: 2800000,
      cashIn: 3000000,
      cashOut: 2800000,
      netCashFlow: 200000
    },
    {
      month: 'Aug 2026',
      budgeted: 2100000,
      actual: 0,
      forecast: 2400000,
      cashIn: 2600000,
      cashOut: 2400000,
      netCashFlow: 200000
    }
  ],
  expenses: [
    {
      id: 'exp1',
      date: '2026-03-10',
      category: 'Materials',
      description: 'Structural steel beams delivery',
      vendor: 'Elite Steel Solutions',
      amount: 285000,
      status: 'paid',
      invoiceNumber: 'INV-2026-0345'
    },
    {
      id: 'exp2',
      date: '2026-03-09',
      category: 'Labor',
      description: 'Weekly payroll - Week 12',
      vendor: 'Internal Payroll',
      amount: 425000,
      status: 'paid',
      invoiceNumber: 'PAY-2026-012'
    },
    {
      id: 'exp3',
      date: '2026-03-08',
      category: 'Equipment',
      description: 'Tower crane rental - March',
      vendor: 'Metro Equipment Rentals',
      amount: 95000,
      status: 'approved',
      invoiceNumber: 'INV-2026-0348'
    },
    {
      id: 'exp4',
      date: '2026-03-07',
      category: 'Subcontractors',
      description: 'Electrical rough-in work',
      vendor: 'Apex Electrical Contractors',
      amount: 185000,
      status: 'pending',
      invoiceNumber: 'INV-2026-0351'
    },
    {
      id: 'exp5',
      date: '2026-03-06',
      category: 'Materials',
      description: 'Concrete Grade 40 delivery',
      vendor: 'BuildMart Supply Co.',
      amount: 72750,
      status: 'paid',
      invoiceNumber: 'INV-2026-0352'
    },
    {
      id: 'exp6',
      date: '2026-03-05',
      category: 'Professional Services',
      description: 'Structural engineering consultation',
      vendor: 'Smith & Associates Engineering',
      amount: 28500,
      status: 'approved',
      invoiceNumber: 'INV-2026-0355'
    },
    {
      id: 'exp7',
      date: '2026-03-04',
      category: 'Equipment',
      description: 'Generator fuel and maintenance',
      vendor: 'Power Solutions Inc.',
      amount: 12400,
      status: 'paid',
      invoiceNumber: 'INV-2026-0358'
    },
    {
      id: 'exp8',
      date: '2026-03-03',
      category: 'Subcontractors',
      description: 'HVAC system installation',
      vendor: 'Climate Control Specialists',
      amount: 320000,
      status: 'pending',
      invoiceNumber: 'INV-2026-0362'
    },
    {
      id: 'exp9',
      date: '2026-03-02',
      category: 'Labor',
      description: 'Weekly payroll - Week 11',
      vendor: 'Internal Payroll',
      amount: 418000,
      status: 'paid',
      invoiceNumber: 'PAY-2026-011'
    },
    {
      id: 'exp10',
      date: '2026-03-01',
      category: 'Materials',
      description: 'Plumbing fixtures and materials',
      vendor: 'Urban Plumbing Wholesale',
      amount: 68625,
      status: 'approved',
      invoiceNumber: 'INV-2026-0365'
    }
  ]
};

export const mockBudgets: Budget[] = [
  {
    id: 'b1',
    projectId: 'p1',
    category: 'Structural',
    allocated: 12000000,
    spent: 8400000,
    committed: 2100000,
    remaining: 1500000,
    variance: -12.5
  },
  {
    id: 'b2',
    projectId: 'p1',
    category: 'MEP Systems',
    allocated: 9500000,
    spent: 5700000,
    committed: 3200000,
    remaining: 600000,
    variance: 6.3
  },
  {
    id: 'b3',
    projectId: 'p1',
    category: 'Facade & Exterior',
    allocated: 7200000,
    spent: 4100000,
    committed: 2800000,
    remaining: 300000,
    variance: -4.2
  },
  {
    id: 'b4',
    projectId: 'p1',
    category: 'Interior Finishes',
    allocated: 8100000,
    spent: 3200000,
    committed: 1800000,
    remaining: 3100000,
    variance: 2.5
  },
  {
    id: 'b5',
    projectId: 'p1',
    category: 'Site Work',
    allocated: 3800000,
    spent: 3400000,
    committed: 200000,
    remaining: 200000,
    variance: -5.3
  }
];

export const mockMaterials: Material[] = [
  {
    id: 'm1',
    name: 'Concrete - High Strength',
    category: 'Structural Materials',
    supplier: 'Manhattan Concrete Co.',
    quantity: 450,
    unit: 'cubic yards',
    unitPrice: 185,
    totalCost: 83250,
    deliveryDate: '2026-03-10',
    status: 'ordered'
  },
  {
    id: 'm2',
    name: 'Steel Rebar #8',
    category: 'Structural Materials',
    supplier: 'Northeast Steel Supply',
    quantity: 28000,
    unit: 'lbs',
    unitPrice: 0.85,
    totalCost: 23800,
    deliveryDate: '2026-03-08',
    status: 'in-transit'
  },
  {
    id: 'm3',
    name: 'Curtain Wall Panels',
    category: 'Facade',
    supplier: 'GlassTech Solutions',
    quantity: 124,
    unit: 'panels',
    unitPrice: 4500,
    totalCost: 558000,
    deliveryDate: '2026-03-20',
    status: 'ordered'
  },
  {
    id: 'm4',
    name: 'HVAC Units - Commercial Grade',
    category: 'MEP',
    supplier: 'Climate Control Systems',
    quantity: 8,
    unit: 'units',
    unitPrice: 12500,
    totalCost: 100000,
    deliveryDate: '2026-03-05',
    status: 'delayed'
  }
];

export const mockRisks: Risk[] = [
  {
    id: 'r1',
    projectId: 'p1',
    projectName: 'Skyline Tower',
    title: 'Potential Steel Supply Shortage',
    description: 'Steel supplier indicated possible delays due to increased demand',
    category: 'schedule',
    severity: 'medium',
    probability: 'medium',
    impact: 'medium',
    mitigationPlan: 'Identified alternative suppliers and increased buffer stock',
    mitigation: 'Identified alternative suppliers and increased buffer stock',
    status: 'monitoring',
    owner: 'Sarah Johnson',
    ownerRole: 'Project Manager',
    dateIdentified: '2026-02-15'
  },
  {
    id: 'r2',
    projectId: 'p2',
    projectName: 'Riverfront Complex',
    title: 'Roofing Contractor Performance Issues',
    description: 'Contractor missing deadlines and quality concerns',
    category: 'quality',
    severity: 'high',
    probability: 'high',
    impact: 'high',
    mitigationPlan: 'Daily monitoring, performance improvement plan, backup contractor identified',
    mitigation: 'Daily monitoring, performance improvement plan, backup contractor identified',
    status: 'identified',
    owner: 'Michael Chen',
    ownerRole: 'Site Engineer',
    dateIdentified: '2026-03-01'
  },
  {
    id: 'r3',
    projectId: 'p1',
    projectName: 'Skyline Tower',
    title: 'Weather-Related Delays',
    description: 'Forecasted heavy precipitation during critical concrete pours',
    category: 'schedule',
    severity: 'low',
    probability: 'medium',
    impact: 'low',
    mitigationPlan: 'Flexible scheduling, covered work areas, weather monitoring',
    mitigation: 'Flexible scheduling, covered work areas, weather monitoring',
    status: 'monitoring',
    owner: 'Sarah Johnson',
    ownerRole: 'Project Manager',
    dateIdentified: '2026-03-05'
  }
];

export const mockIssues: Issue[] = [
  {
    id: 'i1',
    projectId: 'p2',
    title: 'Roof Waterproofing Behind Schedule',
    description: 'Roofing contractor is 4 days behind schedule due to material delays and workforce shortage',
    type: 'delay',
    priority: 'critical',
    status: 'open',
    assignee: 'Michael Chen',
    reportedBy: 'Site Supervisor',
    reportedDate: '2026-03-02'
  },
  {
    id: 'i2',
    projectId: 'p1',
    title: 'Concrete Quality Concerns - Level 14',
    description: 'Test results show concrete strength below specification in section B',
    type: 'quality',
    priority: 'high',
    status: 'in-progress',
    assignee: 'Quality Control Team',
    reportedBy: 'QC Inspector',
    reportedDate: '2026-03-04'
  },
  {
    id: 'i3',
    projectId: 'p1',
    title: 'Safety Incident - Minor Fall',
    description: 'Worker slipped on wet surface, minor injury, required first aid',
    type: 'safety',
    priority: 'high',
    status: 'resolved',
    assignee: 'Safety Manager',
    reportedBy: 'Site Supervisor',
    reportedDate: '2026-03-01',
    resolvedDate: '2026-03-02'
  }
];

export const mockDocuments: Document[] = [
  {
    id: 'd1',
    name: 'Tower A - Structural Drawings Rev 3',
    folderId: 'f1',
    type: 'drawing',
    category: 'Engineering',
    size: '24.5 MB',
    uploadedBy: 'Engineering Team',
    uploadedDate: '2026-02-28',
    lastModified: '2026-02-28',
    status: 'approved',
    version: '3.0',
    versionHistory: [],
    tags: ['structural', 'levels-10-15', 'revision'],
    accessLevel: 'internal'
  },
  {
    id: 'd2',
    name: 'BuildTech Master Contract',
    folderId: 'f2',
    type: 'contract',
    category: 'Legal',
    size: '2.1 MB',
    uploadedBy: 'Legal Department',
    uploadedDate: '2025-05-15',
    lastModified: '2025-05-15',
    status: 'approved',
    version: '1.0',
    versionHistory: [],
    tags: ['contract', 'general-contractor', 'executed'],
    accessLevel: 'confidential'
  },
  {
    id: 'd3',
    name: 'Building Permit - Phase 2',
    folderId: 'f3',
    type: 'permit',
    category: 'Compliance',
    size: '1.8 MB',
    uploadedBy: 'Permits Team',
    uploadedDate: '2026-01-10',
    lastModified: '2026-01-10',
    status: 'approved',
    version: '1.0',
    versionHistory: [],
    tags: ['permit', 'phase-2', 'approved'],
    accessLevel: 'internal'
  },
  {
    id: 'd4',
    name: 'Weekly Progress Report - Week 12',
    folderId: 'f4',
    type: 'report',
    category: 'Project Management',
    size: '3.2 MB',
    uploadedBy: 'Sarah Johnson',
    uploadedDate: '2026-03-07',
    lastModified: '2026-03-07',
    status: 'approved',
    version: '1.0',
    versionHistory: [],
    tags: ['progress', 'weekly', 'march-2026'],
    accessLevel: 'internal'
  }
];

export const mockAIAgents: AIAgent[] = [
  {
    id: 'ai1',
    name: 'AI Project Manager',
    description: 'Oversees project coordination and status tracking',
    icon: '🤖',
    color: 'blue',
    role: 'Project Oversight',
    specialty: 'Project Status & Coordination',
    status: 'active',
    tasksCompleted: 1247,
    accuracy: 94,
    timeSaved: '320 hours',
    lastActive: '2026-03-12T09:00:00',
    capabilities: ['Status Tracking', 'Resource Allocation', 'Timeline Management'],
    insights: [],
    automationRules: 12
  },
  {
    id: 'ai2',
    name: 'AI Scheduler',
    description: 'Optimizes project schedules and timelines',
    icon: '📅',
    color: 'green',
    role: 'Schedule Optimization',
    specialty: 'Timeline Analysis & Optimization',
    status: 'active',
    tasksCompleted: 892,
    accuracy: 91,
    timeSaved: '240 hours',
    lastActive: '2026-03-12T08:30:00',
    capabilities: ['Schedule Optimization', 'Critical Path Analysis', 'Resource Leveling'],
    insights: [],
    automationRules: 8
  },
  {
    id: 'ai3',
    name: 'AI Cost Controller',
    description: 'Monitors budgets and forecasts financial outcomes',
    icon: '💰',
    color: 'purple',
    role: 'Financial Analysis',
    specialty: 'Budget Monitoring & Forecasting',
    status: 'active',
    tasksCompleted: 1534,
    accuracy: 96,
    timeSaved: '480 hours',
    lastActive: '2026-03-12T09:15:00',
    capabilities: ['Budget Monitoring', 'Cost Forecasting', 'Variance Analysis'],
    insights: [],
    automationRules: 15
  },
  {
    id: 'ai4',
    name: 'AI Procurement Agent',
    description: 'Manages supply chain and material procurement',
    icon: '📦',
    color: 'orange',
    role: 'Supply Chain',
    specialty: 'Supplier & Material Management',
    status: 'idle',
    tasksCompleted: 743,
    accuracy: 89,
    timeSaved: '180 hours',
    lastActive: '2026-03-11T17:00:00',
    capabilities: ['Supplier Matching', 'Price Comparison', 'Order Tracking'],
    insights: [],
    automationRules: 6
  },
  {
    id: 'ai5',
    name: 'AI Risk Analyzer',
    description: 'Predicts risks and suggests mitigation strategies',
    icon: '⚠️',
    color: 'red',
    role: 'Risk Management',
    specialty: 'Risk Prediction & Mitigation',
    status: 'processing',
    tasksCompleted: 628,
    accuracy: 93,
    timeSaved: '150 hours',
    lastActive: '2026-03-12T09:10:00',
    capabilities: ['Risk Prediction', 'Impact Assessment', 'Mitigation Planning'],
    insights: [],
    automationRules: 10
  },
  {
    id: 'ai6',
    name: 'AI Compliance Agent',
    description: 'Tracks regulatory compliance and permit requirements',
    icon: '📋',
    color: 'teal',
    role: 'Regulatory Compliance',
    specialty: 'Permits & Regulations',
    status: 'active',
    tasksCompleted: 456,
    accuracy: 97,
    timeSaved: '120 hours',
    lastActive: '2026-03-12T08:45:00',
    capabilities: ['Compliance Tracking', 'Permit Management', 'Regulation Updates'],
    insights: [],
    automationRules: 9
  },
  {
    id: 'ai7',
    name: 'AI Document Analyst',
    description: 'Processes and analyzes contracts and construction drawings',
    icon: '📄',
    color: 'indigo',
    role: 'Document Processing',
    specialty: 'Contract & Drawing Analysis',
    status: 'idle',
    tasksCompleted: 982,
    accuracy: 95,
    timeSaved: '290 hours',
    lastActive: '2026-03-11T16:30:00',
    capabilities: ['Document Classification', 'Contract Analysis', 'Drawing Comparison'],
    insights: [],
    automationRules: 7
  }
];

export const mockNotifications: Notification[] = [
  {
    id: 'n1',
    type: 'warning',
    title: 'Budget Alert',
    message: 'Tower A - Facade budget variance exceeds threshold (-4.2%)',
    timestamp: '2026-03-12T09:15:00',
    read: false,
    priority: 'high',
    source: 'AI Cost Controller'
  },
  {
    id: 'n2',
    type: 'error',
    title: 'Critical Issue',
    message: 'Riverside Complex - Roofing contractor 4 days behind schedule',
    timestamp: '2026-03-12T08:30:00',
    read: false,
    priority: 'high',
    source: 'AI Scheduler'
  },
  {
    id: 'n3',
    type: 'success',
    title: 'Milestone Completed',
    message: 'Tower A - Level 14 structural work completed ahead of schedule',
    timestamp: '2026-03-12T07:45:00',
    read: false,
    priority: 'medium',
    source: 'AI Project Manager'
  },
  {
    id: 'n4',
    type: 'info',
    title: 'Material Delivery Update',
    message: 'Steel Rebar #8 shipment in transit, expected delivery March 8',
    timestamp: '2026-03-11T16:20:00',
    read: true,
    priority: 'low',
    source: 'AI Procurement Agent'
  },
  {
    id: 'n5',
    type: 'warning',
    title: 'Risk Alert',
    message: 'New risk identified: Potential steel supply shortage for Tower A',
    timestamp: '2026-03-11T14:10:00',
    read: true,
    priority: 'medium',
    source: 'AI Risk Analyzer'
  }
];

export const mockTaskComments = [
  {
    id: 'c1',
    taskId: 't1',
    author: 'Sarah Johnson',
    authorRole: 'Project Manager',
    avatar: 'SJ',
    content: 'The concrete pour for level 15 is scheduled for tomorrow morning at 6 AM. All safety protocols must be in place before we start.',
    timestamp: '2026-03-11T14:30:00',
    likes: 3,
    replies: [
      {
        id: 'c1-r1',
        author: 'Michael Chen',
        authorRole: 'Site Engineer',
        avatar: 'MC',
        content: 'Confirmed. Safety barriers and testing equipment are already set up.',
        timestamp: '2026-03-11T15:45:00',
      }
    ]
  },
  {
    id: 'c2',
    taskId: 't1',
    author: 'David Kim',
    authorRole: 'Structural Engineer',
    avatar: 'DK',
    content: 'Weather forecast looks good for the next 48 hours. We should have optimal curing conditions.',
    timestamp: '2026-03-11T16:20:00',
    likes: 5,
    replies: []
  },
  {
    id: 'c3',
    taskId: 't1',
    author: 'BuildTech Construction',
    authorRole: 'General Contractor',
    avatar: 'BT',
    content: 'Our team will have 12 workers on site starting at 5:30 AM for setup. Concrete trucks are confirmed for 6 AM arrival.',
    timestamp: '2026-03-12T08:15:00',
    likes: 2,
    replies: []
  }
];

export const mockActivityLog = [
  {
    id: 'a1',
    taskId: 't1',
    type: 'status_change',
    user: 'Sarah Johnson',
    action: 'changed status from',
    from: 'To Do',
    to: 'In Progress',
    timestamp: '2026-03-05T09:00:00'
  },
  {
    id: 'a2',
    taskId: 't1',
    type: 'progress_update',
    user: 'Michael Chen',
    action: 'updated progress to',
    value: '65%',
    timestamp: '2026-03-11T17:30:00'
  },
  {
    id: 'a3',
    taskId: 't1',
    type: 'attachment_added',
    user: 'David Kim',
    action: 'added attachment',
    value: 'structural_plans_v3.pdf',
    timestamp: '2026-03-05T11:20:00'
  },
  {
    id: 'a4',
    taskId: 't1',
    type: 'assignee_changed',
    user: 'Sarah Johnson',
    action: 'assigned task to',
    value: 'BuildTech Construction',
    timestamp: '2026-03-05T09:15:00'
  },
  {
    id: 'a5',
    taskId: 't1',
    type: 'comment_added',
    user: 'Sarah Johnson',
    action: 'added a comment',
    timestamp: '2026-03-11T14:30:00'
  },
  {
    id: 'a6',
    taskId: 't1',
    type: 'priority_changed',
    user: 'Sarah Johnson',
    action: 'changed priority from',
    from: 'Medium',
    to: 'High',
    timestamp: '2026-03-06T10:00:00'
  },
  {
    id: 'a7',
    taskId: 't1',
    type: 'due_date_changed',
    user: 'Michael Chen',
    action: 'changed due date to',
    value: 'March 12, 2026',
    timestamp: '2026-03-07T13:45:00'
  },
  {
    id: 'a8',
    taskId: 't1',
    type: 'attachment_added',
    user: 'BuildTech Construction',
    action: 'added attachment',
    value: 'concrete_specs.xlsx',
    timestamp: '2026-03-08T16:00:00'
  }
];

export const mockTaskTimeline = [
  {
    id: 'tl1',
    taskId: 't1',
    date: '2026-03-05',
    milestone: 'Task Created',
    description: 'Task initiated and assigned',
    status: 'completed',
    completedBy: 'Sarah Johnson'
  },
  {
    id: 'tl2',
    taskId: 't1',
    date: '2026-03-05',
    milestone: 'Planning Phase',
    description: 'Review structural drawings and specifications',
    status: 'completed',
    completedBy: 'David Kim'
  },
  {
    id: 'tl3',
    taskId: 't1',
    date: '2026-03-08',
    milestone: 'Materials Delivered',
    description: 'Concrete and rebar materials on site',
    status: 'completed',
    completedBy: 'BuildTech Construction'
  },
  {
    id: 'tl4',
    taskId: 't1',
    date: '2026-03-11',
    milestone: 'Pre-Pour Inspection',
    description: 'Site inspection and safety checks completed',
    status: 'in-progress',
    completedBy: 'Michael Chen'
  },
  {
    id: 'tl5',
    taskId: 't1',
    date: '2026-03-12',
    milestone: 'Concrete Pour',
    description: 'Execute level 15 concrete pour',
    status: 'upcoming',
    completedBy: null
  },
  {
    id: 'tl6',
    taskId: 't1',
    date: '2026-03-12',
    milestone: 'Quality Check',
    description: 'Post-pour inspection and documentation',
    status: 'upcoming',
    completedBy: null
  }
];