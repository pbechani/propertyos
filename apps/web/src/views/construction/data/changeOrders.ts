import type { ChangeOrder } from '@/views/construction/types';

export const mockChangeOrders: ChangeOrder[] = [
  {
    id: 'co1',
    changeId: 'CO-2026-001',
    projectId: 'p1',
    projectName: 'Metropolitan Heights Tower',
    title: 'Additional Fire Suppression System Upgrades',
    description: 'Install enhanced fire suppression system in mechanical rooms on floors 15-20 to meet updated fire code requirements. Includes new sprinkler heads, enhanced control panel, and additional water supply piping.',
    reason: 'Updated local fire code requirements issued after initial design approval. Fire marshal inspection revealed need for enhanced coverage in mechanical spaces.',
    category: 'regulatory',
    costImpact: 285000,
    scheduleImpact: 12,
    status: 'approved',
    approvalStage: 'approved',
    priority: 'high',
    requestedBy: 'Robert Lee',
    requestedByRole: 'Safety Director',
    requestDate: '2026-02-15',
    requiredByDate: '2026-04-01',
    approvals: [
      {
        stage: 'Technical Review',
        approver: 'David Chen',
        role: 'Chief Engineer',
        status: 'approved',
        date: '2026-02-18',
        comments: 'Design reviewed and approved. Will require coordination with MEP contractor.'
      },
      {
        stage: 'Cost Review',
        approver: 'Michael Roberts',
        role: 'Cost Manager',
        status: 'approved',
        date: '2026-02-20',
        comments: 'Budget impact acceptable. Recommend using contingency funds.'
      },
      {
        stage: 'Client Approval',
        approver: 'James Morrison',
        role: 'Client Project Manager',
        status: 'approved',
        date: '2026-02-22',
        comments: 'Approved. Safety compliance is priority.'
      },
      {
        stage: 'Final Approval',
        approver: 'Sarah Johnson',
        role: 'Project Manager',
        status: 'approved',
        date: '2026-02-23',
        comments: 'Change order approved for implementation.'
      }
    ],
    affectedAreas: ['Floors 15-20', 'Mechanical Rooms', 'Fire Protection Systems'],
    attachments: [
      { id: 'att1', name: 'fire-code-update-2026.pdf', type: 'PDF', size: '2.3 MB' },
      { id: 'att2', name: 'revised-sprinkler-plan.dwg', type: 'DWG', size: '8.1 MB' }
    ],
    implementationDate: '2026-03-01',
    finalCost: 278500,
    finalScheduleImpact: 10
  },
  {
    id: 'co2',
    changeId: 'CO-2026-002',
    projectId: 'p1',
    projectName: 'Metropolitan Heights Tower',
    title: 'Structural Reinforcement - Foundation East Wing',
    description: 'Additional steel reinforcement and micro-piling required in east wing foundation area due to unexpected soil conditions discovered during excavation.',
    reason: 'Geotechnical investigation revealed softer soil conditions than anticipated in boring logs. Additional bearing capacity required to meet structural design loads.',
    category: 'site-conditions',
    costImpact: 425000,
    scheduleImpact: 18,
    status: 'implemented',
    approvalStage: 'approved',
    priority: 'critical',
    requestedBy: 'David Chen',
    requestedByRole: 'Structural Engineer',
    requestDate: '2026-01-20',
    requiredByDate: '2026-02-10',
    approvals: [
      {
        stage: 'Technical Review',
        approver: 'Thomas Wilson',
        role: 'Senior Structural Engineer',
        status: 'approved',
        date: '2026-01-22',
        comments: 'Engineering analysis confirms need for additional foundation support.'
      },
      {
        stage: 'Cost Review',
        approver: 'Michael Roberts',
        role: 'Cost Manager',
        status: 'approved',
        date: '2026-01-24',
        comments: 'Significant cost impact but unavoidable. Recommend expedited approval.'
      },
      {
        stage: 'Client Approval',
        approver: 'James Morrison',
        role: 'Client Project Manager',
        status: 'approved',
        date: '2026-01-26',
        comments: 'Structural integrity is non-negotiable. Approved.'
      },
      {
        stage: 'Final Approval',
        approver: 'Sarah Johnson',
        role: 'Project Manager',
        status: 'approved',
        date: '2026-01-27',
        comments: 'Approved. Fast-track implementation to minimize schedule impact.'
      }
    ],
    affectedAreas: ['Foundation Level', 'East Wing', 'Structural Systems'],
    implementationDate: '2026-02-01',
    finalCost: 418750,
    finalScheduleImpact: 15
  },
  {
    id: 'co3',
    changeId: 'CO-2026-003',
    projectId: 'p1',
    projectName: 'Metropolitan Heights Tower',
    title: 'Lobby Design Enhancement - Premium Finishes',
    description: 'Upgrade main lobby finishes from standard to premium materials including Italian marble flooring, custom chandelier, and enhanced millwork package.',
    reason: 'Client request to enhance building prestige and market positioning. Updated branding strategy requires elevated lobby experience.',
    category: 'client-request',
    costImpact: 650000,
    scheduleImpact: 8,
    status: 'under-review',
    approvalStage: 'client-approval',
    priority: 'medium',
    requestedBy: 'Lisa Anderson',
    requestedByRole: 'Design Manager',
    requestDate: '2026-03-05',
    requiredByDate: '2026-04-15',
    approvals: [
      {
        stage: 'Technical Review',
        approver: 'Jennifer Martinez',
        role: 'Senior Architect',
        status: 'approved',
        date: '2026-03-08',
        comments: 'Design integration verified. Material lead times require immediate decision.'
      },
      {
        stage: 'Cost Review',
        approver: 'Michael Roberts',
        role: 'Cost Manager',
        status: 'approved',
        date: '2026-03-10',
        comments: 'Cost estimate validated. Awaiting client budget approval.'
      },
      {
        stage: 'Client Approval',
        approver: 'James Morrison',
        role: 'Client Project Manager',
        status: 'pending',
        comments: 'Under review by client executive team.'
      },
      {
        stage: 'Final Approval',
        approver: 'Sarah Johnson',
        role: 'Project Manager',
        status: 'pending'
      }
    ],
    affectedAreas: ['Main Lobby', 'Building Entrance', 'Interior Finishes'],
    attachments: [
      { id: 'att3', name: 'lobby-enhancement-renderings.pdf', type: 'PDF', size: '15.2 MB' },
      { id: 'att4', name: 'material-specifications.xlsx', type: 'XLSX', size: '1.8 MB' }
    ]
  },
  {
    id: 'co4',
    changeId: 'CO-2026-004',
    projectId: 'p2',
    projectName: 'Riverside Medical Center',
    title: 'Medical Gas System Expansion',
    description: 'Expand medical gas distribution system to include additional operating rooms and ICU beds per revised hospital capacity plan.',
    reason: 'Client increased facility capacity requirements based on regional healthcare demand analysis. Additional 4 OR suites and 12 ICU beds added to program.',
    category: 'scope',
    costImpact: 520000,
    scheduleImpact: 21,
    status: 'submitted',
    approvalStage: 'technical-review',
    priority: 'high',
    requestedBy: 'Patricia Brown',
    requestedByRole: 'Medical Equipment Planner',
    requestDate: '2026-03-01',
    requiredByDate: '2026-04-30',
    approvals: [
      {
        stage: 'Technical Review',
        approver: 'Mark Stevens',
        role: 'MEP Director',
        status: 'pending',
        comments: 'Engineering review in progress. Preliminary assessment shows feasibility.'
      },
      {
        stage: 'Cost Review',
        approver: 'Andrew Collins',
        role: 'Senior Estimator',
        status: 'pending'
      },
      {
        stage: 'Client Approval',
        approver: 'Dr. Richard Hamilton',
        role: 'Medical Director',
        status: 'pending'
      },
      {
        stage: 'Final Approval',
        approver: 'Thomas Wilson',
        role: 'Project Director',
        status: 'pending'
      }
    ],
    affectedAreas: ['Operating Rooms', 'ICU Floor', 'Central Medical Gas Plant', 'Mechanical Rooms'],
    attachments: [
      { id: 'att5', name: 'capacity-expansion-plan.pdf', type: 'PDF', size: '4.5 MB' }
    ]
  },
  {
    id: 'co5',
    changeId: 'CO-2026-005',
    projectId: 'p1',
    projectName: 'Metropolitan Heights Tower',
    title: 'Value Engineering - HVAC System Optimization',
    description: 'Optimize HVAC system by implementing variable refrigerant flow (VRF) technology instead of traditional chilled water system. Provides better efficiency and lower operating costs.',
    reason: 'Value engineering initiative to reduce long-term operating expenses and improve building sustainability rating. ROI analysis shows 6-year payback period.',
    category: 'value-engineering',
    costImpact: -185000, // Cost savings
    scheduleImpact: 0,
    status: 'approved',
    approvalStage: 'approved',
    priority: 'medium',
    requestedBy: 'Michael Roberts',
    requestedByRole: 'Cost Manager',
    requestDate: '2026-02-10',
    requiredByDate: '2026-03-15',
    approvals: [
      {
        stage: 'Technical Review',
        approver: 'Mark Stevens',
        role: 'MEP Director',
        status: 'approved',
        date: '2026-02-14',
        comments: 'VRF system meets all performance requirements. Recommend approval.'
      },
      {
        stage: 'Cost Review',
        approver: 'Sarah Johnson',
        role: 'Project Manager',
        status: 'approved',
        date: '2026-02-16',
        comments: 'Cost savings validated. Energy modeling shows 22% reduction in HVAC costs.'
      },
      {
        stage: 'Client Approval',
        approver: 'James Morrison',
        role: 'Client Project Manager',
        status: 'approved',
        date: '2026-02-18',
        comments: 'Excellent value engineering. Improves LEED rating. Approved.'
      },
      {
        stage: 'Final Approval',
        approver: 'David Chen',
        role: 'Chief Engineer',
        status: 'approved',
        date: '2026-02-19',
        comments: 'Approved for implementation.'
      }
    ],
    affectedAreas: ['HVAC Systems', 'Mechanical Rooms', 'All Floors'],
    implementationDate: '2026-02-25',
    finalCost: -185000,
    finalScheduleImpact: 0
  },
  {
    id: 'co6',
    changeId: 'CO-2026-006',
    projectId: 'p1',
    projectName: 'Metropolitan Heights Tower',
    title: 'Curtain Wall Design Modification',
    description: 'Modify south facade curtain wall system to enhance solar performance and reduce glare in office spaces. Updated glass specification and shading devices.',
    reason: 'Tenant feedback during pre-leasing indicated concerns about solar heat gain and glare. Enhanced system improves tenant comfort and energy efficiency.',
    category: 'design',
    costImpact: 340000,
    scheduleImpact: 14,
    status: 'rejected',
    approvalStage: 'rejected',
    priority: 'low',
    requestedBy: 'Jennifer Martinez',
    requestedByRole: 'Senior Architect',
    requestDate: '2026-02-25',
    requiredByDate: '2026-04-01',
    approvals: [
      {
        stage: 'Technical Review',
        approver: 'David Chen',
        role: 'Chief Engineer',
        status: 'approved',
        date: '2026-02-28',
        comments: 'Technical solution is sound. Performance benefits validated.'
      },
      {
        stage: 'Cost Review',
        approver: 'Michael Roberts',
        role: 'Cost Manager',
        status: 'approved',
        date: '2026-03-02',
        comments: 'Cost is reasonable for scope. Recommend client consideration.'
      },
      {
        stage: 'Client Approval',
        approver: 'James Morrison',
        role: 'Client Project Manager',
        status: 'rejected',
        date: '2026-03-05',
        comments: 'Cost benefit does not justify investment at this stage. Current system meets specifications.'
      },
      {
        stage: 'Final Approval',
        approver: 'Sarah Johnson',
        role: 'Project Manager',
        status: 'rejected',
        date: '2026-03-05',
        comments: 'Change order rejected per client decision.'
      }
    ],
    affectedAreas: ['South Facade', 'Curtain Wall', 'Office Floors 8-25']
  },
  {
    id: 'co7',
    changeId: 'CO-2026-007',
    projectId: 'p3',
    projectName: 'Oakwood Corporate Campus',
    title: 'Underground Utility Relocation',
    description: 'Relocate existing underground utilities (water main, storm sewer) discovered in new building footprint. Utilities not shown on site survey.',
    reason: 'Unforeseen site condition. Existing utilities not documented in available records. Discovered during excavation.',
    category: 'unforeseen',
    costImpact: 195000,
    scheduleImpact: 10,
    status: 'approved',
    approvalStage: 'approved',
    priority: 'critical',
    requestedBy: 'Carlos Rodriguez',
    requestedByRole: 'Site Manager',
    requestDate: '2026-03-08',
    requiredByDate: '2026-03-15',
    approvals: [
      {
        stage: 'Technical Review',
        approver: 'Thomas Wilson',
        role: 'Civil Engineer',
        status: 'approved',
        date: '2026-03-09',
        comments: 'Relocation plan developed. Must coordinate with city utilities department.'
      },
      {
        stage: 'Cost Review',
        approver: 'Michael Roberts',
        role: 'Cost Manager',
        status: 'approved',
        date: '2026-03-10',
        comments: 'Unforeseen condition. Recommend using owner contingency.'
      },
      {
        stage: 'Client Approval',
        approver: 'Rebecca Foster',
        role: 'Owner Representative',
        status: 'approved',
        date: '2026-03-11',
        comments: 'Unavoidable. Approved for immediate action.'
      },
      {
        stage: 'Final Approval',
        approver: 'James Cooper',
        role: 'Program Manager',
        status: 'approved',
        date: '2026-03-11',
        comments: 'Approved. Expedite to minimize schedule impact.'
      }
    ],
    affectedAreas: ['Building Footprint', 'Site Utilities', 'Excavation Area'],
    implementationDate: '2026-03-12'
  },
  {
    id: 'co8',
    changeId: 'CO-2026-008',
    projectId: 'p1',
    projectName: 'Metropolitan Heights Tower',
    title: 'Elevator Cab Interior Upgrade',
    description: 'Upgrade elevator cab interiors with premium finishes including wood veneer paneling, LED lighting, and digital displays in all passenger elevators.',
    reason: 'Client request to enhance tenant experience and align with premium building positioning.',
    category: 'client-request',
    costImpact: 280000,
    scheduleImpact: 6,
    status: 'under-review',
    approvalStage: 'cost-review',
    priority: 'low',
    requestedBy: 'Lisa Anderson',
    requestedByRole: 'Design Manager',
    requestDate: '2026-03-10',
    requiredByDate: '2026-05-01',
    approvals: [
      {
        stage: 'Technical Review',
        approver: 'David Chen',
        role: 'Chief Engineer',
        status: 'approved',
        date: '2026-03-12',
        comments: 'Coordinated with elevator manufacturer. Lead time acceptable.'
      },
      {
        stage: 'Cost Review',
        approver: 'Michael Roberts',
        role: 'Cost Manager',
        status: 'pending',
        comments: 'Cost review in progress. Awaiting vendor quotes.'
      },
      {
        stage: 'Client Approval',
        approver: 'James Morrison',
        role: 'Client Project Manager',
        status: 'pending'
      },
      {
        stage: 'Final Approval',
        approver: 'Sarah Johnson',
        role: 'Project Manager',
        status: 'pending'
      }
    ],
    affectedAreas: ['All Passenger Elevators', 'Lobby Level', 'Interior Finishes'],
    attachments: [
      { id: 'att6', name: 'elevator-cab-finishes.pdf', type: 'PDF', size: '6.8 MB' }
    ]
  },
  {
    id: 'co9',
    changeId: 'CO-2026-009',
    projectId: 'p2',
    projectName: 'Riverside Medical Center',
    title: 'Isolation Room Negative Pressure System',
    description: 'Add negative pressure isolation capabilities to 8 patient rooms to meet updated infectious disease protocols.',
    reason: 'Updated healthcare guidelines require enhanced isolation capacity for infectious disease management.',
    category: 'regulatory',
    costImpact: 385000,
    scheduleImpact: 15,
    status: 'approved',
    approvalStage: 'approved',
    priority: 'high',
    requestedBy: 'Dr. Amanda Foster',
    requestedByRole: 'Medical Director',
    requestDate: '2026-02-20',
    requiredByDate: '2026-04-15',
    approvals: [
      {
        stage: 'Technical Review',
        approver: 'Mark Stevens',
        role: 'MEP Director',
        status: 'approved',
        date: '2026-02-23',
        comments: 'HVAC modifications designed. Meets all infection control requirements.'
      },
      {
        stage: 'Cost Review',
        approver: 'Andrew Collins',
        role: 'Senior Estimator',
        status: 'approved',
        date: '2026-02-25',
        comments: 'Cost validated. Essential for facility accreditation.'
      },
      {
        stage: 'Client Approval',
        approver: 'Dr. Richard Hamilton',
        role: 'Medical Director',
        status: 'approved',
        date: '2026-02-27',
        comments: 'Critical for patient safety and regulatory compliance. Approved.'
      },
      {
        stage: 'Final Approval',
        approver: 'Thomas Wilson',
        role: 'Project Director',
        status: 'approved',
        date: '2026-02-28',
        comments: 'Approved for implementation.'
      }
    ],
    affectedAreas: ['Patient Rooms', 'HVAC Systems', 'Isolation Ward'],
    implementationDate: '2026-03-05',
    finalCost: 385000,
    finalScheduleImpact: 15
  },
  {
    id: 'co10',
    changeId: 'CO-2026-010',
    projectId: 'p1',
    projectName: 'Metropolitan Heights Tower',
    title: 'Rooftop Amenity Deck Addition',
    description: 'Add rooftop amenity deck with outdoor seating, landscaping, and BBQ facilities for tenant use.',
    reason: 'Market research shows rooftop amenities increase tenant attraction and retention. Competitive buildings in area offer similar features.',
    category: 'scope',
    costImpact: 875000,
    scheduleImpact: 25,
    status: 'draft',
    approvalStage: 'pending',
    priority: 'medium',
    requestedBy: 'Sarah Johnson',
    requestedByRole: 'Project Manager',
    requestDate: '2026-03-12',
    requiredByDate: '2026-05-15',
    approvals: [
      {
        stage: 'Technical Review',
        approver: 'David Chen',
        role: 'Chief Engineer',
        status: 'pending',
        comments: 'Structural analysis required for rooftop loading.'
      },
      {
        stage: 'Cost Review',
        approver: 'Michael Roberts',
        role: 'Cost Manager',
        status: 'pending'
      },
      {
        stage: 'Client Approval',
        approver: 'James Morrison',
        role: 'Client Project Manager',
        status: 'pending'
      },
      {
        stage: 'Final Approval',
        approver: 'Sarah Johnson',
        role: 'Project Manager',
        status: 'pending'
      }
    ],
    affectedAreas: ['Rooftop', 'Structural Systems', 'Building Amenities']
  },
  {
    id: 'co11',
    changeId: 'CO-2026-011',
    projectId: 'p1',
    projectName: 'Metropolitan Heights Tower',
    title: 'Parking Structure Lighting Upgrade',
    description: 'Upgrade parking structure lighting from standard fixtures to LED with motion sensors and enhanced security lighting.',
    reason: 'Value engineering opportunity to reduce energy costs and improve tenant security perception.',
    category: 'value-engineering',
    costImpact: 95000,
    scheduleImpact: 4,
    status: 'approved',
    approvalStage: 'approved',
    priority: 'low',
    requestedBy: 'Robert Lee',
    requestedByRole: 'Safety Director',
    requestDate: '2026-02-05',
    requiredByDate: '2026-03-30',
    approvals: [
      {
        stage: 'Technical Review',
        approver: 'Mark Stevens',
        role: 'MEP Director',
        status: 'approved',
        date: '2026-02-08',
        comments: 'LED system provides better light levels and energy savings.'
      },
      {
        stage: 'Cost Review',
        approver: 'Michael Roberts',
        role: 'Cost Manager',
        status: 'approved',
        date: '2026-02-10',
        comments: '3-year payback on energy savings. Good investment.'
      },
      {
        stage: 'Client Approval',
        approver: 'James Morrison',
        role: 'Client Project Manager',
        status: 'approved',
        date: '2026-02-12',
        comments: 'Enhanced security and energy savings. Approved.'
      },
      {
        stage: 'Final Approval',
        approver: 'Sarah Johnson',
        role: 'Project Manager',
        status: 'approved',
        date: '2026-02-13',
        comments: 'Approved for implementation.'
      }
    ],
    affectedAreas: ['Parking Structure', 'Electrical Systems', 'Security'],
    implementationDate: '2026-02-20',
    finalCost: 92500,
    finalScheduleImpact: 3
  },
  {
    id: 'co12',
    changeId: 'CO-2026-012',
    projectId: 'p2',
    projectName: 'Riverside Medical Center',
    title: 'Emergency Generator Capacity Increase',
    description: 'Increase emergency generator capacity from 2000kW to 2500kW to support expanded medical equipment load.',
    reason: 'Medical equipment schedule shows higher power requirements than original estimates. Critical for life safety systems.',
    category: 'design',
    costImpact: 265000,
    scheduleImpact: 8,
    status: 'implemented',
    approvalStage: 'approved',
    priority: 'critical',
    requestedBy: 'Mark Stevens',
    requestedByRole: 'MEP Director',
    requestDate: '2026-01-25',
    requiredByDate: '2026-02-20',
    approvals: [
      {
        stage: 'Technical Review',
        approver: 'Chris Taylor',
        role: 'Electrical Engineer',
        status: 'approved',
        date: '2026-01-27',
        comments: 'Load calculations verified. Larger generator required.'
      },
      {
        stage: 'Cost Review',
        approver: 'Andrew Collins',
        role: 'Senior Estimator',
        status: 'approved',
        date: '2026-01-29',
        comments: 'Critical system. Cost is reasonable for capacity increase.'
      },
      {
        stage: 'Client Approval',
        approver: 'Dr. Richard Hamilton',
        role: 'Medical Director',
        status: 'approved',
        date: '2026-01-31',
        comments: 'Emergency power is essential. Must not compromise.'
      },
      {
        stage: 'Final Approval',
        approver: 'Thomas Wilson',
        role: 'Project Director',
        status: 'approved',
        date: '2026-02-01',
        comments: 'Approved. Expedite generator procurement.'
      }
    ],
    affectedAreas: ['Emergency Power', 'Generator Room', 'Electrical Distribution'],
    implementationDate: '2026-02-10',
    finalCost: 258000,
    finalScheduleImpact: 7
  }
];
