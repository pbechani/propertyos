// Mock data for the conveyancing system

export const mockCases = [
  {
    id: 'CASE-1045',
    propertyAddress: '123 Oak Street, Springfield',
    buyer: 'John Smith',
    seller: 'Mary Johnson',
    stage: 'Document Collection',
    status: 'Delayed',
    progress: 35,
    daysActive: 45,
    assignedTo: 'Sarah Williams',
    priority: 'High',
    nextDeadline: '2026-03-15',
    value: 450000,
    missingDocuments: ['Seller ID', 'Municipal Clearance Certificate']
  },
  {
    id: 'CASE-1046',
    propertyAddress: '456 Maple Avenue, Riverside',
    buyer: 'Emma Davis',
    seller: 'Robert Brown',
    stage: 'Title Search',
    status: 'On Track',
    progress: 60,
    daysActive: 30,
    assignedTo: 'Michael Chen',
    priority: 'Medium',
    nextDeadline: '2026-03-18',
    value: 680000,
    missingDocuments: []
  },
  {
    id: 'CASE-1047',
    propertyAddress: '789 Pine Road, Lakeside',
    buyer: 'David Wilson',
    seller: 'Lisa Anderson',
    stage: 'Contract Preparation',
    status: 'On Track',
    progress: 75,
    daysActive: 20,
    assignedTo: 'Sarah Williams',
    priority: 'Low',
    nextDeadline: '2026-03-20',
    value: 320000,
    missingDocuments: []
  },
  {
    id: 'CASE-1048',
    propertyAddress: '321 Birch Lane, Hillview',
    buyer: 'Sophia Martinez',
    seller: 'James Taylor',
    stage: 'Document Collection',
    status: 'Delayed',
    progress: 25,
    daysActive: 52,
    assignedTo: 'Michael Chen',
    priority: 'High',
    nextDeadline: '2026-03-13',
    value: 550000,
    missingDocuments: ['Bank Approval', 'Property Inspection Report']
  },
  {
    id: 'CASE-1049',
    propertyAddress: '654 Cedar Court, Parkview',
    buyer: 'Oliver Johnson',
    seller: 'Emily White',
    stage: 'Awaiting Registration',
    status: 'On Track',
    progress: 90,
    daysActive: 15,
    assignedTo: 'Sarah Williams',
    priority: 'Medium',
    nextDeadline: '2026-03-25',
    value: 720000,
    missingDocuments: []
  }
];

export const mockClients = [
  {
    id: 'CLT-001',
    name: 'John Smith',
    type: 'Buyer',
    email: 'john.smith@email.com',
    phone: '+1 555-0101',
    kycStatus: 'Verified',
    activeCases: 1,
    riskScore: 'Low',
    lastActivity: '2026-03-10'
  },
  {
    id: 'CLT-002',
    name: 'Mary Johnson',
    type: 'Seller',
    email: 'mary.j@email.com',
    phone: '+1 555-0102',
    kycStatus: 'Pending',
    activeCases: 1,
    riskScore: 'Low',
    lastActivity: '2026-03-09'
  },
  {
    id: 'CLT-003',
    name: 'Emma Davis',
    type: 'Buyer',
    email: 'emma.davis@email.com',
    phone: '+1 555-0103',
    kycStatus: 'Verified',
    activeCases: 1,
    riskScore: 'Low',
    lastActivity: '2026-03-11'
  },
  {
    id: 'CLT-004',
    name: 'Robert Brown',
    type: 'Seller',
    email: 'r.brown@email.com',
    phone: '+1 555-0104',
    kycStatus: 'Verified',
    activeCases: 1,
    riskScore: 'Medium',
    lastActivity: '2026-03-08'
  }
];

export const mockProperties = [
  {
    id: 'PROP-001',
    address: '123 Oak Street, Springfield',
    type: 'Residential',
    bedrooms: 3,
    bathrooms: 2,
    area: 1850,
    currentOwner: 'Mary Johnson',
    titleStatus: 'Clear',
    mortgageStatus: 'Active',
    value: 450000,
    lastTransferDate: '2018-05-15'
  },
  {
    id: 'PROP-002',
    address: '456 Maple Avenue, Riverside',
    type: 'Residential',
    bedrooms: 4,
    bathrooms: 3,
    area: 2400,
    currentOwner: 'Robert Brown',
    titleStatus: 'Clear',
    mortgageStatus: 'Paid Off',
    value: 680000,
    lastTransferDate: '2015-09-20'
  },
  {
    id: 'PROP-003',
    address: '789 Pine Road, Lakeside',
    type: 'Residential',
    bedrooms: 2,
    bathrooms: 1,
    area: 1200,
    currentOwner: 'Lisa Anderson',
    titleStatus: 'Clear',
    mortgageStatus: 'None',
    value: 320000,
    lastTransferDate: '2020-03-10'
  }
];

export const mockDocuments = [
  {
    id: 'DOC-001',
    name: 'Sale Agreement - CASE-1045',
    type: 'Contract',
    caseId: 'CASE-1045',
    uploadDate: '2026-02-15',
    status: 'Signed',
    uploadedBy: 'John Smith',
    size: '2.4 MB',
    aiAnalysis: 'Complete - No issues detected'
  },
  {
    id: 'DOC-002',
    name: 'Title Deed - PROP-001',
    type: 'Title Document',
    caseId: 'CASE-1045',
    uploadDate: '2026-02-18',
    status: 'Verified',
    uploadedBy: 'Sarah Williams',
    size: '1.8 MB',
    aiAnalysis: 'Verified - Ownership confirmed'
  },
  {
    id: 'DOC-003',
    name: 'ID Document - John Smith',
    type: 'Identity',
    caseId: 'CASE-1045',
    uploadDate: '2026-02-16',
    status: 'Verified',
    uploadedBy: 'John Smith',
    size: '856 KB',
    aiAnalysis: 'KYC Verified'
  },
  {
    id: 'DOC-004',
    name: 'Bank Pre-Approval Letter',
    type: 'Financial',
    caseId: 'CASE-1046',
    uploadDate: '2026-02-20',
    status: 'Approved',
    uploadedBy: 'Emma Davis',
    size: '445 KB',
    aiAnalysis: 'Financing confirmed - $680,000'
  },
  {
    id: 'DOC-005',
    name: 'Property Inspection Report',
    type: 'Compliance',
    caseId: 'CASE-1046',
    uploadDate: '2026-02-22',
    status: 'Complete',
    uploadedBy: 'Michael Chen',
    size: '3.2 MB',
    aiAnalysis: 'No major issues found'
  }
];

export const mockFinancials = [
  {
    id: 'INV-001',
    caseId: 'CASE-1045',
    type: 'Legal Fees',
    amount: 4500,
    status: 'Pending',
    dueDate: '2026-03-20',
    client: 'John Smith'
  },
  {
    id: 'INV-002',
    caseId: 'CASE-1046',
    type: 'Transfer Duty',
    amount: 34000,
    status: 'Paid',
    dueDate: '2026-03-10',
    client: 'Emma Davis',
    paidDate: '2026-03-08'
  },
  {
    id: 'INV-003',
    caseId: 'CASE-1047',
    type: 'Legal Fees',
    amount: 3200,
    status: 'Paid',
    dueDate: '2026-03-05',
    client: 'David Wilson',
    paidDate: '2026-03-04'
  },
  {
    id: 'PAY-001',
    caseId: 'CASE-1046',
    type: 'Deposit',
    amount: 68000,
    status: 'Received',
    date: '2026-02-25',
    client: 'Emma Davis',
    accountType: 'Escrow'
  }
];

export const aiInsights = [
  {
    type: 'warning',
    priority: 'High',
    message: 'Case CASE-1045 is missing critical documents',
    details: 'Seller ID and Municipal Clearance Certificate required',
    timestamp: '2026-03-11 09:30',
    action: 'Contact seller for documents'
  },
  {
    type: 'alert',
    priority: 'High',
    message: 'Case CASE-1048 delayed over 50 days',
    details: 'Awaiting bank approval and property inspection',
    timestamp: '2026-03-11 08:15',
    action: 'Follow up with bank'
  },
  {
    type: 'info',
    priority: 'Medium',
    message: 'Ownership conflict detected in PROP-002',
    details: 'Previous owner claim requires verification',
    timestamp: '2026-03-10 16:45',
    action: 'Review title history'
  },
  {
    type: 'success',
    priority: 'Low',
    message: 'Case CASE-1049 ready for registration',
    details: 'All documents complete and verified',
    timestamp: '2026-03-11 10:00',
    action: 'Submit to registry'
  }
];

export const workflowStats = {
  activeCases: 5,
  delayedCases: 2,
  completedThisMonth: 8,
  pendingDocuments: 4,
  complianceAlerts: 1,
  revenue: 45600,
  escrowBalance: 234000
};

export const tasksList = [
  {
    id: 'TSK-001',
    caseId: 'CASE-1045',
    title: 'Request seller ID document',
    assignedTo: 'Sarah Williams',
    dueDate: '2026-03-13',
    priority: 'High',
    status: 'Pending'
  },
  {
    id: 'TSK-002',
    caseId: 'CASE-1045',
    title: 'Obtain municipal clearance certificate',
    assignedTo: 'Sarah Williams',
    dueDate: '2026-03-15',
    priority: 'High',
    status: 'Pending'
  },
  {
    id: 'TSK-003',
    caseId: 'CASE-1048',
    title: 'Follow up with bank for approval',
    assignedTo: 'Michael Chen',
    dueDate: '2026-03-13',
    priority: 'High',
    status: 'In Progress'
  },
  {
    id: 'TSK-004',
    caseId: 'CASE-1046',
    title: 'Complete title search verification',
    assignedTo: 'Michael Chen',
    dueDate: '2026-03-18',
    priority: 'Medium',
    status: 'In Progress'
  },
  {
    id: 'TSK-005',
    caseId: 'CASE-1049',
    title: 'Submit transfer documents to registry',
    assignedTo: 'Sarah Williams',
    dueDate: '2026-03-25',
    priority: 'Medium',
    status: 'Pending'
  }
];

export const activityLog = [
  {
    id: 'ACT-001',
    timestamp: '2026-03-11 10:30',
    user: 'AI Agent',
    action: 'Detected missing documents in CASE-1045',
    type: 'alert'
  },
  {
    id: 'ACT-002',
    timestamp: '2026-03-11 09:15',
    user: 'Emma Davis',
    action: 'Uploaded property inspection report',
    type: 'document'
  },
  {
    id: 'ACT-003',
    timestamp: '2026-03-11 08:45',
    user: 'Sarah Williams',
    action: 'Updated case CASE-1045 status',
    type: 'case'
  },
  {
    id: 'ACT-004',
    timestamp: '2026-03-10 16:30',
    user: 'AI Agent',
    action: 'Completed document analysis for DOC-005',
    type: 'ai'
  },
  {
    id: 'ACT-005',
    timestamp: '2026-03-10 14:20',
    user: 'Michael Chen',
    action: 'Sent payment reminder to John Smith',
    type: 'communication'
  }
];
