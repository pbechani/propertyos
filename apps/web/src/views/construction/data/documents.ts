import type { DocumentFolder, Document, DocumentActivity } from '@/views/construction/types';

export const documentFolders: DocumentFolder[] = [
  {
    id: 'plans',
    name: 'Plans & Drawings',
    icon: 'FileText',
    color: '#3b82f6',
    parentId: null,
    documentCount: 24,
    totalSize: '456 MB',
    lastModified: '2 hours ago'
  },
  {
    id: 'architectural',
    name: 'Architectural',
    icon: 'Home',
    color: '#3b82f6',
    parentId: 'plans',
    documentCount: 12,
    totalSize: '189 MB',
    lastModified: '2 hours ago'
  },
  {
    id: 'structural',
    name: 'Structural',
    icon: 'Building2',
    color: '#3b82f6',
    parentId: 'plans',
    documentCount: 8,
    totalSize: '156 MB',
    lastModified: '1 day ago'
  },
  {
    id: 'mep',
    name: 'MEP',
    icon: 'Zap',
    color: '#3b82f6',
    parentId: 'plans',
    documentCount: 4,
    totalSize: '111 MB',
    lastModified: '3 hours ago'
  },
  {
    id: 'permits',
    name: 'Permits & Approvals',
    icon: 'FileCheck',
    color: '#10b981',
    parentId: null,
    documentCount: 15,
    totalSize: '45 MB',
    lastModified: '1 day ago'
  },
  {
    id: 'building-permits',
    name: 'Building Permits',
    icon: 'ClipboardCheck',
    color: '#10b981',
    parentId: 'permits',
    documentCount: 8,
    totalSize: '23 MB',
    lastModified: '1 day ago'
  },
  {
    id: 'environmental',
    name: 'Environmental',
    icon: 'Leaf',
    color: '#10b981',
    parentId: 'permits',
    documentCount: 5,
    totalSize: '18 MB',
    lastModified: '3 days ago'
  },
  {
    id: 'contracts',
    name: 'Contracts',
    icon: 'FileSignature',
    color: '#f59e0b',
    parentId: null,
    documentCount: 18,
    totalSize: '67 MB',
    lastModified: '4 hours ago'
  },
  {
    id: 'main-contract',
    name: 'Main Contract',
    icon: 'FileText',
    color: '#f59e0b',
    parentId: 'contracts',
    documentCount: 3,
    totalSize: '12 MB',
    lastModified: '2 weeks ago'
  },
  {
    id: 'subcontracts',
    name: 'Subcontracts',
    icon: 'Files',
    color: '#f59e0b',
    parentId: 'contracts',
    documentCount: 12,
    totalSize: '45 MB',
    lastModified: '4 hours ago'
  },
  {
    id: 'rfis',
    name: 'RFIs',
    icon: 'HelpCircle',
    color: '#8b5cf6',
    parentId: null,
    documentCount: 32,
    totalSize: '89 MB',
    lastModified: '30 minutes ago'
  },
  {
    id: 'submittals',
    name: 'Submittals',
    icon: 'Send',
    color: '#ec4899',
    parentId: null,
    documentCount: 28,
    totalSize: '234 MB',
    lastModified: '1 hour ago'
  },
  {
    id: 'reports',
    name: 'Reports',
    icon: 'BarChart3',
    color: '#06b6d4',
    parentId: null,
    documentCount: 45,
    totalSize: '123 MB',
    lastModified: '5 hours ago'
  },
  {
    id: 'photos',
    name: 'Site Photos',
    icon: 'Camera',
    color: '#ef4444',
    parentId: null,
    documentCount: 342,
    totalSize: '1.2 GB',
    lastModified: '15 minutes ago'
  },
  {
    id: 'specifications',
    name: 'Specifications',
    icon: 'FileSpreadsheet',
    color: '#14b8a6',
    parentId: null,
    documentCount: 16,
    totalSize: '78 MB',
    lastModified: '2 days ago'
  }
];

export const documents: Document[] = [
  // Architectural Plans
  {
    id: 'doc-001',
    name: 'Ground Floor Plan - Rev C',
    folderId: 'architectural',
    type: 'pdf',
    size: '12.4 MB',
    uploadedBy: 'David Chen',
    uploadedDate: '2026-04-12',
    lastModified: '2 hours ago',
    status: 'approved',
    version: '1.3',
    versionHistory: [
      { version: '1.3', uploadedBy: 'David Chen', uploadedDate: '2026-04-12', size: '12.4 MB', changes: 'Updated stairwell dimensions per RFI-045' },
      { version: '1.2', uploadedBy: 'David Chen', uploadedDate: '2026-04-05', size: '12.1 MB', changes: 'Revised column grid spacing' },
      { version: '1.1', uploadedBy: 'Jennifer Martinez', uploadedDate: '2026-03-28', size: '11.8 MB', changes: 'Initial revision' }
    ],
    tags: ['floor-plan', 'ground-floor', 'critical'],
    description: 'Ground floor architectural plan with updated dimensions',
    accessLevel: 'internal',
    approvers: [
      { name: 'Sarah Johnson', status: 'approved', date: '2026-04-13', comments: 'Approved for construction' },
      { name: 'Michael Brown', status: 'approved', date: '2026-04-13' }
    ]
  },
  {
    id: 'doc-002',
    name: 'Typical Floor Plan - Levels 2-5',
    folderId: 'architectural',
    type: 'pdf',
    size: '15.2 MB',
    uploadedBy: 'Jennifer Martinez',
    uploadedDate: '2026-04-10',
    lastModified: '1 day ago',
    status: 'approved',
    version: '2.1',
    versionHistory: [
      { version: '2.1', uploadedBy: 'Jennifer Martinez', uploadedDate: '2026-04-10', size: '15.2 MB', changes: 'Added fire escape details' },
      { version: '2.0', uploadedBy: 'Jennifer Martinez', uploadedDate: '2026-03-30', size: '14.9 MB', changes: 'Major revision per client feedback' }
    ],
    tags: ['floor-plan', 'typical', 'levels-2-5'],
    accessLevel: 'internal',
    approvers: [
      { name: 'Sarah Johnson', status: 'approved', date: '2026-04-11' }
    ]
  },
  {
    id: 'doc-003',
    name: 'Exterior Elevation - North',
    folderId: 'architectural',
    type: 'pdf',
    size: '18.7 MB',
    uploadedBy: 'David Chen',
    uploadedDate: '2026-04-08',
    lastModified: '4 days ago',
    status: 'approved',
    version: '1.5',
    versionHistory: [
      { version: '1.5', uploadedBy: 'David Chen', uploadedDate: '2026-04-08', size: '18.7 MB', changes: 'Updated facade materials' }
    ],
    tags: ['elevation', 'exterior', 'north-face'],
    accessLevel: 'internal'
  },
  {
    id: 'doc-004',
    name: 'Section A-A',
    folderId: 'architectural',
    type: 'dwg',
    size: '8.3 MB',
    uploadedBy: 'Jennifer Martinez',
    uploadedDate: '2026-04-07',
    lastModified: '5 days ago',
    status: 'pending-review',
    version: '1.0',
    versionHistory: [
      { version: '1.0', uploadedBy: 'Jennifer Martinez', uploadedDate: '2026-04-07', size: '8.3 MB', changes: 'Initial upload' }
    ],
    tags: ['section', 'detail'],
    accessLevel: 'internal',
    approvers: [
      { name: 'Sarah Johnson', status: 'pending' },
      { name: 'Michael Brown', status: 'pending' }
    ]
  },

  // Structural Plans
  {
    id: 'doc-005',
    name: 'Foundation Plan',
    folderId: 'structural',
    type: 'pdf',
    size: '22.1 MB',
    uploadedBy: 'Robert Lee',
    uploadedDate: '2026-04-11',
    lastModified: '1 day ago',
    status: 'approved',
    version: '3.0',
    versionHistory: [
      { version: '3.0', uploadedBy: 'Robert Lee', uploadedDate: '2026-04-11', size: '22.1 MB', changes: 'Updated pile cap details' },
      { version: '2.2', uploadedBy: 'Robert Lee', uploadedDate: '2026-03-25', size: '21.5 MB', changes: 'Revised rebar schedule' }
    ],
    tags: ['foundation', 'structural', 'critical'],
    description: 'Complete foundation plan with pile details',
    accessLevel: 'internal',
    approvers: [
      { name: 'Michael Brown', status: 'approved', date: '2026-04-12' }
    ]
  },
  {
    id: 'doc-006',
    name: 'Steel Frame - Level 3 to 6',
    folderId: 'structural',
    type: 'pdf',
    size: '19.8 MB',
    uploadedBy: 'Robert Lee',
    uploadedDate: '2026-04-09',
    lastModified: '3 days ago',
    status: 'approved',
    version: '2.3',
    versionHistory: [
      { version: '2.3', uploadedBy: 'Robert Lee', uploadedDate: '2026-04-09', size: '19.8 MB', changes: 'Updated connection details' }
    ],
    tags: ['steel', 'structural', 'levels-3-6'],
    accessLevel: 'internal'
  },
  {
    id: 'doc-007',
    name: 'Structural Calculations Report',
    folderId: 'structural',
    type: 'pdf',
    size: '45.3 MB',
    uploadedBy: 'Robert Lee',
    uploadedDate: '2026-03-15',
    lastModified: '4 weeks ago',
    status: 'approved',
    version: '1.0',
    versionHistory: [
      { version: '1.0', uploadedBy: 'Robert Lee', uploadedDate: '2026-03-15', size: '45.3 MB', changes: 'Final calculations' }
    ],
    tags: ['calculations', 'engineering', 'reference'],
    accessLevel: 'confidential'
  },

  // MEP Plans
  {
    id: 'doc-008',
    name: 'HVAC Floor Plan - Level 2',
    folderId: 'mep',
    type: 'pdf',
    size: '14.6 MB',
    uploadedBy: 'Kevin Zhang',
    uploadedDate: '2026-04-12',
    lastModified: '3 hours ago',
    status: 'pending-review',
    version: '1.2',
    versionHistory: [
      { version: '1.2', uploadedBy: 'Kevin Zhang', uploadedDate: '2026-04-12', size: '14.6 MB', changes: 'Resolved clash with structural beams' },
      { version: '1.1', uploadedBy: 'Kevin Zhang', uploadedDate: '2026-04-05', size: '14.2 MB', changes: 'Updated duct routing' }
    ],
    tags: ['hvac', 'mep', 'level-2'],
    accessLevel: 'internal',
    approvers: [
      { name: 'Robert Lee', status: 'pending' }
    ]
  },
  {
    id: 'doc-009',
    name: 'Electrical Riser Diagram',
    folderId: 'mep',
    type: 'pdf',
    size: '9.2 MB',
    uploadedBy: 'Kevin Zhang',
    uploadedDate: '2026-04-10',
    lastModified: '2 days ago',
    status: 'approved',
    version: '1.4',
    versionHistory: [
      { version: '1.4', uploadedBy: 'Kevin Zhang', uploadedDate: '2026-04-10', size: '9.2 MB', changes: 'Added emergency power circuits' }
    ],
    tags: ['electrical', 'mep', 'riser'],
    accessLevel: 'internal'
  },

  // Building Permits
  {
    id: 'doc-010',
    name: 'Building Permit - Main Structure',
    folderId: 'building-permits',
    type: 'pdf',
    size: '3.8 MB',
    uploadedBy: 'Sarah Johnson',
    uploadedDate: '2026-01-15',
    lastModified: '3 months ago',
    status: 'approved',
    version: '1.0',
    versionHistory: [
      { version: '1.0', uploadedBy: 'Sarah Johnson', uploadedDate: '2026-01-15', size: '3.8 MB', changes: 'Approved permit' }
    ],
    tags: ['permit', 'building', 'approved'],
    description: 'Main building permit - Valid until Jan 2027',
    accessLevel: 'public'
  },
  {
    id: 'doc-011',
    name: 'Electrical Work Permit',
    folderId: 'building-permits',
    type: 'pdf',
    size: '2.1 MB',
    uploadedBy: 'Sarah Johnson',
    uploadedDate: '2026-03-20',
    lastModified: '3 weeks ago',
    status: 'approved',
    version: '1.0',
    versionHistory: [
      { version: '1.0', uploadedBy: 'Sarah Johnson', uploadedDate: '2026-03-20', size: '2.1 MB', changes: 'Permit issued' }
    ],
    tags: ['permit', 'electrical', 'active'],
    description: 'Electrical permit expires April 27, 2026',
    accessLevel: 'public'
  },

  // Contracts
  {
    id: 'doc-012',
    name: 'General Contractor Agreement',
    folderId: 'main-contract',
    type: 'pdf',
    size: '4.5 MB',
    uploadedBy: 'Sarah Johnson',
    uploadedDate: '2025-12-10',
    lastModified: '4 months ago',
    status: 'approved',
    version: '1.0',
    versionHistory: [
      { version: '1.0', uploadedBy: 'Sarah Johnson', uploadedDate: '2025-12-10', size: '4.5 MB', changes: 'Executed contract' }
    ],
    tags: ['contract', 'legal', 'signed'],
    accessLevel: 'confidential'
  },
  {
    id: 'doc-013',
    name: 'ABC Electrical - Subcontract',
    folderId: 'subcontracts',
    type: 'pdf',
    size: '3.2 MB',
    uploadedBy: 'Patricia Brown',
    uploadedDate: '2026-02-15',
    lastModified: '2 months ago',
    status: 'approved',
    version: '1.1',
    versionHistory: [
      { version: '1.1', uploadedBy: 'Patricia Brown', uploadedDate: '2026-02-15', size: '3.2 MB', changes: 'Amendment 1 - Scope addition' },
      { version: '1.0', uploadedBy: 'Patricia Brown', uploadedDate: '2026-01-20', size: '3.0 MB', changes: 'Original contract' }
    ],
    tags: ['subcontract', 'electrical', 'abc-electrical'],
    accessLevel: 'confidential'
  },
  {
    id: 'doc-014',
    name: 'XYZ Plumbing - Subcontract',
    folderId: 'subcontracts',
    type: 'pdf',
    size: '2.9 MB',
    uploadedBy: 'Patricia Brown',
    uploadedDate: '2026-04-12',
    lastModified: '4 hours ago',
    status: 'pending-review',
    version: '1.0',
    versionHistory: [
      { version: '1.0', uploadedBy: 'Patricia Brown', uploadedDate: '2026-04-12', size: '2.9 MB', changes: 'Initial contract draft' }
    ],
    tags: ['subcontract', 'plumbing', 'xyz-plumbing'],
    accessLevel: 'confidential',
    approvers: [
      { name: 'Sarah Johnson', status: 'pending' },
      { name: 'Michael Brown', status: 'pending' }
    ]
  },

  // RFIs
  {
    id: 'doc-015',
    name: 'RFI-045 - Stairwell Dimensions',
    folderId: 'rfis',
    type: 'pdf',
    size: '1.8 MB',
    uploadedBy: 'Thomas Wilson',
    uploadedDate: '2026-04-12',
    lastModified: '30 minutes ago',
    status: 'approved',
    version: '1.0',
    versionHistory: [
      { version: '1.0', uploadedBy: 'Thomas Wilson', uploadedDate: '2026-04-12', size: '1.8 MB', changes: 'RFI response received' }
    ],
    tags: ['rfi', 'architectural', 'closed'],
    description: 'Clarification on stairwell clear width requirements',
    accessLevel: 'internal',
    approvers: [
      { name: 'David Chen', status: 'approved', date: '2026-04-12', comments: 'Proceed with 1500mm clear width' }
    ]
  },
  {
    id: 'doc-016',
    name: 'RFI-046 - HVAC Equipment Clearance',
    folderId: 'rfis',
    type: 'pdf',
    size: '2.3 MB',
    uploadedBy: 'Carlos Rodriguez',
    uploadedDate: '2026-04-11',
    lastModified: '1 day ago',
    status: 'pending-review',
    version: '1.0',
    versionHistory: [
      { version: '1.0', uploadedBy: 'Carlos Rodriguez', uploadedDate: '2026-04-11', size: '2.3 MB', changes: 'RFI submitted' }
    ],
    tags: ['rfi', 'mep', 'open'],
    description: 'Requesting additional clearance around AHU-02',
    accessLevel: 'internal',
    approvers: [
      { name: 'Kevin Zhang', status: 'pending' }
    ]
  },

  // Submittals
  {
    id: 'doc-017',
    name: 'Submittal - Structural Steel Shop Drawings',
    folderId: 'submittals',
    type: 'pdf',
    size: '28.4 MB',
    uploadedBy: 'Thomas Wilson',
    uploadedDate: '2026-04-12',
    lastModified: '1 hour ago',
    status: 'pending-review',
    version: '2.0',
    versionHistory: [
      { version: '2.0', uploadedBy: 'Thomas Wilson', uploadedDate: '2026-04-12', size: '28.4 MB', changes: 'Resubmitted with corrections' },
      { version: '1.0', uploadedBy: 'Thomas Wilson', uploadedDate: '2026-04-03', size: '27.8 MB', changes: 'Initial submission' }
    ],
    tags: ['submittal', 'structural', 'shop-drawings'],
    accessLevel: 'internal',
    approvers: [
      { name: 'Robert Lee', status: 'pending' },
      { name: 'Michael Brown', status: 'pending' }
    ]
  },
  {
    id: 'doc-018',
    name: 'Submittal - Curtain Wall System',
    folderId: 'submittals',
    type: 'pdf',
    size: '34.2 MB',
    uploadedBy: 'Jennifer Martinez',
    uploadedDate: '2026-04-10',
    lastModified: '2 days ago',
    status: 'approved',
    version: '1.0',
    versionHistory: [
      { version: '1.0', uploadedBy: 'Jennifer Martinez', uploadedDate: '2026-04-10', size: '34.2 MB', changes: 'Product data and test reports' }
    ],
    tags: ['submittal', 'facade', 'approved'],
    accessLevel: 'internal',
    approvers: [
      { name: 'David Chen', status: 'approved', date: '2026-04-11', comments: 'Approved as noted' }
    ]
  },

  // Reports
  {
    id: 'doc-019',
    name: 'Weekly Progress Report - Week 16',
    folderId: 'reports',
    type: 'pdf',
    size: '5.6 MB',
    uploadedBy: 'Sarah Johnson',
    uploadedDate: '2026-04-12',
    lastModified: '5 hours ago',
    status: 'approved',
    version: '1.0',
    versionHistory: [
      { version: '1.0', uploadedBy: 'Sarah Johnson', uploadedDate: '2026-04-12', size: '5.6 MB', changes: 'Weekly update' }
    ],
    tags: ['report', 'progress', 'weekly'],
    accessLevel: 'internal'
  },
  {
    id: 'doc-020',
    name: 'Monthly Cost Report - March 2026',
    folderId: 'reports',
    type: 'xlsx',
    size: '2.8 MB',
    uploadedBy: 'Michael Brown',
    uploadedDate: '2026-04-01',
    lastModified: '11 days ago',
    status: 'approved',
    version: '1.0',
    versionHistory: [
      { version: '1.0', uploadedBy: 'Michael Brown', uploadedDate: '2026-04-01', size: '2.8 MB', changes: 'Monthly financial summary' }
    ],
    tags: ['report', 'financial', 'monthly'],
    accessLevel: 'confidential'
  },

  // Site Photos
  {
    id: 'doc-021',
    name: 'Foundation Pour - North Section',
    folderId: 'photos',
    type: 'jpg',
    size: '4.2 MB',
    uploadedBy: 'Carlos Rodriguez',
    uploadedDate: '2026-04-12',
    lastModified: '15 minutes ago',
    status: 'approved',
    version: '1.0',
    versionHistory: [
      { version: '1.0', uploadedBy: 'Carlos Rodriguez', uploadedDate: '2026-04-12', size: '4.2 MB', changes: 'Site photo upload' }
    ],
    tags: ['photo', 'foundation', 'progress'],
    description: 'Foundation concrete pour in progress',
    accessLevel: 'internal'
  },
  {
    id: 'doc-022',
    name: 'Steel Erection - Level 4',
    folderId: 'photos',
    type: 'jpg',
    size: '3.8 MB',
    uploadedBy: 'Thomas Wilson',
    uploadedDate: '2026-04-11',
    lastModified: '1 day ago',
    status: 'approved',
    version: '1.0',
    versionHistory: [
      { version: '1.0', uploadedBy: 'Thomas Wilson', uploadedDate: '2026-04-11', size: '3.8 MB', changes: 'Site photo upload' }
    ],
    tags: ['photo', 'steel', 'level-4'],
    accessLevel: 'internal'
  },

  // Specifications
  {
    id: 'doc-023',
    name: 'Technical Specifications - Division 03',
    folderId: 'specifications',
    type: 'pdf',
    size: '12.7 MB',
    uploadedBy: 'Robert Lee',
    uploadedDate: '2026-03-01',
    lastModified: '6 weeks ago',
    status: 'approved',
    version: '2.0',
    versionHistory: [
      { version: '2.0', uploadedBy: 'Robert Lee', uploadedDate: '2026-03-01', size: '12.7 MB', changes: 'Updated concrete specifications' },
      { version: '1.0', uploadedBy: 'Robert Lee', uploadedDate: '2026-02-15', size: '12.3 MB', changes: 'Initial specs' }
    ],
    tags: ['specifications', 'concrete', 'division-03'],
    accessLevel: 'internal'
  },
  {
    id: 'doc-024',
    name: 'Product Specification - Curtain Wall',
    folderId: 'specifications',
    type: 'pdf',
    size: '8.9 MB',
    uploadedBy: 'Jennifer Martinez',
    uploadedDate: '2026-03-15',
    lastModified: '4 weeks ago',
    status: 'approved',
    version: '1.0',
    versionHistory: [
      { version: '1.0', uploadedBy: 'Jennifer Martinez', uploadedDate: '2026-03-15', size: '8.9 MB', changes: 'Manufacturer specifications' }
    ],
    tags: ['specifications', 'facade', 'product-data'],
    accessLevel: 'internal'
  }
];

export const documentActivities: DocumentActivity[] = [
  {
    id: 'act-001',
    documentId: 'doc-001',
    action: 'approved',
    user: 'Sarah Johnson',
    timestamp: '2 hours ago',
    details: 'Approved for construction'
  },
  {
    id: 'act-002',
    documentId: 'doc-001',
    action: 'viewed',
    user: 'Thomas Wilson',
    timestamp: '3 hours ago'
  },
  {
    id: 'act-003',
    documentId: 'doc-001',
    action: 'uploaded',
    user: 'David Chen',
    timestamp: '2 hours ago',
    details: 'Version 1.3 uploaded'
  },
  {
    id: 'act-004',
    documentId: 'doc-008',
    action: 'uploaded',
    user: 'Kevin Zhang',
    timestamp: '3 hours ago',
    details: 'Version 1.2 uploaded - Resolved clashes'
  },
  {
    id: 'act-005',
    documentId: 'doc-015',
    action: 'approved',
    user: 'David Chen',
    timestamp: '30 minutes ago',
    details: 'RFI response approved'
  },
  {
    id: 'act-006',
    documentId: 'doc-017',
    action: 'uploaded',
    user: 'Thomas Wilson',
    timestamp: '1 hour ago',
    details: 'Version 2.0 resubmitted with corrections'
  },
  {
    id: 'act-007',
    documentId: 'doc-021',
    action: 'uploaded',
    user: 'Carlos Rodriguez',
    timestamp: '15 minutes ago',
    details: 'New site photo added'
  },
  {
    id: 'act-008',
    documentId: 'doc-019',
    action: 'shared',
    user: 'Sarah Johnson',
    timestamp: '4 hours ago',
    details: 'Shared with project team'
  }
];

export const documentStats = {
  totalDocuments: documents.length,
  totalFolders: documentFolders.filter(f => f.parentId === null).length,
  totalSize: '2.4 GB',
  pendingApprovals: documents.filter(d => d.status === 'pending-review').length,
  approvedToday: documents.filter(d => 
    d.approvers?.some(a => a.status === 'approved' && a.date === '2026-04-13')
  ).length,
  recentUploads: documents.filter(d => d.lastModified.includes('hours') || d.lastModified.includes('minutes')).length
};
