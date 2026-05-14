import type { ScheduleTask, ProjectPhase } from '@/views/construction/types';

export const projectPhases: ProjectPhase[] = [
  {
    id: 'phase-1',
    name: 'Site Preparation',
    color: '#3b82f6',
    startDate: '2026-01-15',
    endDate: '2026-02-28',
    progress: 100,
    budget: 1500000,
    tasksCount: 5
  },
  {
    id: 'phase-2',
    name: 'Foundation',
    color: '#8b5cf6',
    startDate: '2026-03-01',
    endDate: '2026-04-30',
    progress: 85,
    budget: 2500000,
    tasksCount: 6
  },
  {
    id: 'phase-3',
    name: 'Structural Framework',
    color: '#10b981',
    startDate: '2026-05-01',
    endDate: '2026-08-15',
    progress: 45,
    budget: 4200000,
    tasksCount: 8
  },
  {
    id: 'phase-4',
    name: 'MEP Systems',
    color: '#f59e0b',
    startDate: '2026-07-01',
    endDate: '2026-10-31',
    progress: 15,
    budget: 3100000,
    tasksCount: 7
  },
  {
    id: 'phase-5',
    name: 'Interior Finishes',
    color: '#ec4899',
    startDate: '2026-09-01',
    endDate: '2026-12-15',
    progress: 0,
    budget: 2800000,
    tasksCount: 6
  },
  {
    id: 'phase-6',
    name: 'Exterior & Landscaping',
    color: '#06b6d4',
    startDate: '2026-11-01',
    endDate: '2027-01-31',
    progress: 0,
    budget: 1400000,
    tasksCount: 4
  }
];

export const scheduleTasks: ScheduleTask[] = [
  // Phase 1: Site Preparation
  {
    id: 'task-1',
    name: 'Site Survey & Geotechnical Investigation',
    phase: 'phase-1',
    startDate: '2026-01-15',
    endDate: '2026-01-25',
    duration: 10,
    progress: 100,
    status: 'completed',
    priority: 'critical',
    assignedTo: ['David Chen', 'Jennifer Martinez'],
    dependencies: [],
    isMilestone: true,
    isCriticalPath: true,
    resources: {
      crew: 5,
      equipment: ['Survey Equipment', 'Drilling Rig']
    },
    cost: 85000,
    notes: 'Completed ahead of schedule'
  },
  {
    id: 'task-2',
    name: 'Site Clearing & Demolition',
    phase: 'phase-1',
    startDate: '2026-01-26',
    endDate: '2026-02-05',
    duration: 10,
    progress: 100,
    status: 'completed',
    priority: 'high',
    assignedTo: ['Thomas Wilson'],
    dependencies: ['task-1'],
    isMilestone: false,
    isCriticalPath: true,
    resources: {
      crew: 12,
      equipment: ['Excavator', 'Dump Trucks', 'Bulldozer']
    },
    cost: 125000
  },
  {
    id: 'task-3',
    name: 'Utility Relocation & Installation',
    phase: 'phase-1',
    startDate: '2026-02-06',
    endDate: '2026-02-15',
    duration: 9,
    progress: 100,
    status: 'completed',
    priority: 'critical',
    assignedTo: ['Robert Lee', 'Kevin Zhang'],
    dependencies: ['task-2'],
    isMilestone: false,
    isCriticalPath: true,
    resources: {
      crew: 8,
      equipment: ['Trencher', 'Backhoe']
    },
    cost: 180000
  },
  {
    id: 'task-4',
    name: 'Temporary Facilities Setup',
    phase: 'phase-1',
    startDate: '2026-02-10',
    endDate: '2026-02-18',
    duration: 8,
    progress: 100,
    status: 'completed',
    priority: 'medium',
    assignedTo: ['Patricia Brown'],
    dependencies: ['task-2'],
    isMilestone: false,
    isCriticalPath: false,
    resources: {
      crew: 6,
      equipment: ['Mobile Crane', 'Forklift']
    },
    cost: 95000
  },
  {
    id: 'task-5',
    name: 'Site Grading & Drainage',
    phase: 'phase-1',
    startDate: '2026-02-16',
    endDate: '2026-02-28',
    duration: 12,
    progress: 100,
    status: 'completed',
    priority: 'high',
    assignedTo: ['Carlos Rodriguez'],
    dependencies: ['task-3'],
    isMilestone: true,
    isCriticalPath: true,
    resources: {
      crew: 10,
      equipment: ['Grader', 'Compactor', 'Excavator']
    },
    cost: 165000
  },

  // Phase 2: Foundation
  {
    id: 'task-6',
    name: 'Foundation Excavation',
    phase: 'phase-2',
    startDate: '2026-03-01',
    endDate: '2026-03-12',
    duration: 11,
    progress: 100,
    status: 'completed',
    priority: 'critical',
    assignedTo: ['David Chen', 'Thomas Wilson'],
    dependencies: ['task-5'],
    isMilestone: false,
    isCriticalPath: true,
    resources: {
      crew: 15,
      equipment: ['Excavator', 'Dump Trucks']
    },
    cost: 285000
  },
  {
    id: 'task-7',
    name: 'Footings & Grade Beams',
    phase: 'phase-2',
    startDate: '2026-03-13',
    endDate: '2026-03-25',
    duration: 12,
    progress: 100,
    status: 'completed',
    priority: 'critical',
    assignedTo: ['Jennifer Martinez'],
    dependencies: ['task-6'],
    isMilestone: false,
    isCriticalPath: true,
    resources: {
      crew: 18,
      equipment: ['Concrete Mixer', 'Concrete Pump', 'Vibrators']
    },
    cost: 420000
  },
  {
    id: 'task-8',
    name: 'Foundation Waterproofing',
    phase: 'phase-2',
    startDate: '2026-03-26',
    endDate: '2026-04-02',
    duration: 7,
    progress: 100,
    status: 'completed',
    priority: 'high',
    assignedTo: ['Robert Lee'],
    dependencies: ['task-7'],
    isMilestone: false,
    isCriticalPath: true,
    resources: {
      crew: 8,
      equipment: ['Spray Equipment']
    },
    cost: 145000
  },
  {
    id: 'task-9',
    name: 'Basement Slab Pour',
    phase: 'phase-2',
    startDate: '2026-04-03',
    endDate: '2026-04-15',
    duration: 12,
    progress: 90,
    status: 'in-progress',
    priority: 'critical',
    assignedTo: ['David Chen', 'Patricia Brown'],
    dependencies: ['task-8'],
    isMilestone: false,
    isCriticalPath: true,
    resources: {
      crew: 20,
      equipment: ['Concrete Pump', 'Power Trowel', 'Laser Screed']
    },
    cost: 520000
  },
  {
    id: 'task-10',
    name: 'Foundation Curing & Testing',
    phase: 'phase-2',
    startDate: '2026-04-16',
    endDate: '2026-04-25',
    duration: 9,
    progress: 60,
    status: 'in-progress',
    priority: 'critical',
    assignedTo: ['Jennifer Martinez', 'Kevin Zhang'],
    dependencies: ['task-9'],
    isMilestone: false,
    isCriticalPath: true,
    resources: {
      crew: 4,
      equipment: ['Testing Equipment']
    },
    cost: 75000
  },
  {
    id: 'task-11',
    name: 'Foundation Completion Milestone',
    phase: 'phase-2',
    startDate: '2026-04-30',
    endDate: '2026-04-30',
    duration: 1,
    progress: 0,
    status: 'not-started',
    priority: 'critical',
    assignedTo: ['David Chen'],
    dependencies: ['task-10'],
    isMilestone: true,
    isCriticalPath: true,
    resources: {
      crew: 0,
      equipment: []
    },
    cost: 0
  },

  // Phase 3: Structural Framework
  {
    id: 'task-12',
    name: 'Ground Floor Column Installation',
    phase: 'phase-3',
    startDate: '2026-05-01',
    endDate: '2026-05-15',
    duration: 14,
    progress: 100,
    status: 'completed',
    priority: 'critical',
    assignedTo: ['Thomas Wilson', 'Carlos Rodriguez'],
    dependencies: ['task-11'],
    isMilestone: false,
    isCriticalPath: true,
    resources: {
      crew: 25,
      equipment: ['Tower Crane', 'Mobile Crane', 'Welding Equipment']
    },
    cost: 680000
  },
  {
    id: 'task-13',
    name: 'Level 1-3 Floor Slabs',
    phase: 'phase-3',
    startDate: '2026-05-16',
    endDate: '2026-06-10',
    duration: 25,
    progress: 80,
    status: 'in-progress',
    priority: 'critical',
    assignedTo: ['David Chen', 'Jennifer Martinez'],
    dependencies: ['task-12'],
    isMilestone: false,
    isCriticalPath: true,
    resources: {
      crew: 30,
      equipment: ['Concrete Pump', 'Tower Crane', 'Formwork']
    },
    cost: 1250000
  },
  {
    id: 'task-14',
    name: 'Level 4-6 Steel Erection',
    phase: 'phase-3',
    startDate: '2026-06-11',
    endDate: '2026-07-08',
    duration: 27,
    progress: 35,
    status: 'in-progress',
    priority: 'critical',
    assignedTo: ['Thomas Wilson'],
    dependencies: ['task-13'],
    isMilestone: false,
    isCriticalPath: true,
    resources: {
      crew: 28,
      equipment: ['Tower Crane', 'Welding Equipment']
    },
    cost: 1450000
  },
  {
    id: 'task-15',
    name: 'Roof Structure Installation',
    phase: 'phase-3',
    startDate: '2026-07-09',
    endDate: '2026-07-30',
    duration: 21,
    progress: 0,
    status: 'not-started',
    priority: 'critical',
    assignedTo: ['Carlos Rodriguez'],
    dependencies: ['task-14'],
    isMilestone: false,
    isCriticalPath: true,
    resources: {
      crew: 22,
      equipment: ['Tower Crane', 'Welding Equipment']
    },
    cost: 780000
  },
  {
    id: 'task-16',
    name: 'Structural Inspections',
    phase: 'phase-3',
    startDate: '2026-07-31',
    endDate: '2026-08-10',
    duration: 10,
    progress: 0,
    status: 'not-started',
    priority: 'critical',
    assignedTo: ['Jennifer Martinez', 'Robert Lee'],
    dependencies: ['task-15'],
    isMilestone: false,
    isCriticalPath: true,
    resources: {
      crew: 6,
      equipment: ['Testing Equipment']
    },
    cost: 125000
  },
  {
    id: 'task-17',
    name: 'Structural Framework Milestone',
    phase: 'phase-3',
    startDate: '2026-08-15',
    endDate: '2026-08-15',
    duration: 1,
    progress: 0,
    status: 'not-started',
    priority: 'critical',
    assignedTo: ['David Chen'],
    dependencies: ['task-16'],
    isMilestone: true,
    isCriticalPath: true,
    resources: {
      crew: 0,
      equipment: []
    },
    cost: 0
  },

  // Phase 4: MEP Systems
  {
    id: 'task-18',
    name: 'Electrical Rough-In (Levels 1-3)',
    phase: 'phase-4',
    startDate: '2026-07-01',
    endDate: '2026-07-28',
    duration: 27,
    progress: 45,
    status: 'in-progress',
    priority: 'high',
    assignedTo: ['Kevin Zhang'],
    dependencies: ['task-13'],
    isMilestone: false,
    isCriticalPath: false,
    resources: {
      crew: 15,
      equipment: ['Conduit Benders', 'Cable Pullers']
    },
    cost: 425000
  },
  {
    id: 'task-19',
    name: 'HVAC Ductwork Installation',
    phase: 'phase-4',
    startDate: '2026-07-15',
    endDate: '2026-08-25',
    duration: 41,
    progress: 20,
    status: 'in-progress',
    priority: 'high',
    assignedTo: ['Robert Lee'],
    dependencies: ['task-13'],
    isMilestone: false,
    isCriticalPath: false,
    resources: {
      crew: 18,
      equipment: ['Sheet Metal Tools', 'Lifts']
    },
    cost: 680000
  },
  {
    id: 'task-20',
    name: 'Plumbing Rough-In',
    phase: 'phase-4',
    startDate: '2026-07-20',
    endDate: '2026-09-05',
    duration: 47,
    progress: 15,
    status: 'in-progress',
    priority: 'high',
    assignedTo: ['Patricia Brown'],
    dependencies: ['task-13'],
    isMilestone: false,
    isCriticalPath: false,
    resources: {
      crew: 12,
      equipment: ['Pipe Threading Machine', 'Soldering Equipment']
    },
    cost: 520000
  },
  {
    id: 'task-21',
    name: 'Fire Protection Systems',
    phase: 'phase-4',
    startDate: '2026-08-15',
    endDate: '2026-09-30',
    duration: 46,
    progress: 0,
    status: 'not-started',
    priority: 'critical',
    assignedTo: ['Robert Lee'],
    dependencies: ['task-17'],
    isMilestone: false,
    isCriticalPath: false,
    resources: {
      crew: 10,
      equipment: ['Pipe Threading Equipment']
    },
    cost: 385000
  },
  {
    id: 'task-22',
    name: 'MEP Coordination & Testing',
    phase: 'phase-4',
    startDate: '2026-10-01',
    endDate: '2026-10-25',
    duration: 24,
    progress: 0,
    status: 'not-started',
    priority: 'critical',
    assignedTo: ['Kevin Zhang', 'Jennifer Martinez'],
    dependencies: ['task-18', 'task-19', 'task-20', 'task-21'],
    isMilestone: false,
    isCriticalPath: false,
    resources: {
      crew: 8,
      equipment: ['Testing Equipment']
    },
    cost: 165000
  },
  {
    id: 'task-23',
    name: 'MEP Systems Milestone',
    phase: 'phase-4',
    startDate: '2026-10-31',
    endDate: '2026-10-31',
    duration: 1,
    progress: 0,
    status: 'not-started',
    priority: 'critical',
    assignedTo: ['David Chen'],
    dependencies: ['task-22'],
    isMilestone: true,
    isCriticalPath: false,
    resources: {
      crew: 0,
      equipment: []
    },
    cost: 0
  },

  // Phase 5: Interior Finishes
  {
    id: 'task-24',
    name: 'Drywall Installation',
    phase: 'phase-5',
    startDate: '2026-09-01',
    endDate: '2026-10-05',
    duration: 34,
    progress: 0,
    status: 'not-started',
    priority: 'high',
    assignedTo: ['Carlos Rodriguez'],
    dependencies: ['task-22'],
    isMilestone: false,
    isCriticalPath: false,
    resources: {
      crew: 20,
      equipment: ['Scaffolding', 'Lifts']
    },
    cost: 425000
  },
  {
    id: 'task-25',
    name: 'Flooring Installation',
    phase: 'phase-5',
    startDate: '2026-10-06',
    endDate: '2026-11-10',
    duration: 35,
    progress: 0,
    status: 'not-started',
    priority: 'high',
    assignedTo: ['Patricia Brown'],
    dependencies: ['task-24'],
    isMilestone: false,
    isCriticalPath: false,
    resources: {
      crew: 16,
      equipment: ['Floor Sanders', 'Tile Cutters']
    },
    cost: 680000
  },
  {
    id: 'task-26',
    name: 'Interior Painting',
    phase: 'phase-5',
    startDate: '2026-11-11',
    endDate: '2026-12-05',
    duration: 24,
    progress: 0,
    status: 'not-started',
    priority: 'medium',
    assignedTo: ['Thomas Wilson'],
    dependencies: ['task-25'],
    isMilestone: false,
    isCriticalPath: false,
    resources: {
      crew: 14,
      equipment: ['Spray Equipment', 'Scaffolding']
    },
    cost: 285000
  },
  {
    id: 'task-27',
    name: 'Fixture & Equipment Installation',
    phase: 'phase-5',
    startDate: '2026-11-20',
    endDate: '2026-12-10',
    duration: 20,
    progress: 0,
    status: 'not-started',
    priority: 'high',
    assignedTo: ['Kevin Zhang'],
    dependencies: ['task-25'],
    isMilestone: false,
    isCriticalPath: false,
    resources: {
      crew: 12,
      equipment: ['Hand Tools', 'Lifts']
    },
    cost: 520000
  },
  {
    id: 'task-28',
    name: 'Interior Finishes Milestone',
    phase: 'phase-5',
    startDate: '2026-12-15',
    endDate: '2026-12-15',
    duration: 1,
    progress: 0,
    status: 'not-started',
    priority: 'critical',
    assignedTo: ['David Chen'],
    dependencies: ['task-26', 'task-27'],
    isMilestone: true,
    isCriticalPath: false,
    resources: {
      crew: 0,
      equipment: []
    },
    cost: 0
  },

  // Phase 6: Exterior & Landscaping
  {
    id: 'task-29',
    name: 'Exterior Facade Installation',
    phase: 'phase-6',
    startDate: '2026-11-01',
    endDate: '2026-12-10',
    duration: 39,
    progress: 0,
    status: 'not-started',
    priority: 'high',
    assignedTo: ['Carlos Rodriguez'],
    dependencies: ['task-17'],
    isMilestone: false,
    isCriticalPath: false,
    resources: {
      crew: 18,
      equipment: ['Tower Crane', 'Scaffolding']
    },
    cost: 825000
  },
  {
    id: 'task-30',
    name: 'Site Paving & Hardscape',
    phase: 'phase-6',
    startDate: '2026-12-11',
    endDate: '2027-01-10',
    duration: 30,
    progress: 0,
    status: 'not-started',
    priority: 'medium',
    assignedTo: ['Thomas Wilson'],
    dependencies: ['task-28', 'task-29'],
    isMilestone: false,
    isCriticalPath: false,
    resources: {
      crew: 15,
      equipment: ['Paver', 'Compactor']
    },
    cost: 385000
  },
  {
    id: 'task-31',
    name: 'Landscaping & Irrigation',
    phase: 'phase-6',
    startDate: '2027-01-11',
    endDate: '2027-01-25',
    duration: 14,
    progress: 0,
    status: 'not-started',
    priority: 'low',
    assignedTo: ['Patricia Brown'],
    dependencies: ['task-30'],
    isMilestone: false,
    isCriticalPath: false,
    resources: {
      crew: 10,
      equipment: ['Trencher', 'Planting Equipment']
    },
    cost: 165000
  },
  {
    id: 'task-32',
    name: 'Project Completion & Handover',
    phase: 'phase-6',
    startDate: '2027-01-31',
    endDate: '2027-01-31',
    duration: 1,
    progress: 0,
    status: 'not-started',
    priority: 'critical',
    assignedTo: ['David Chen', 'Sarah Johnson'],
    dependencies: ['task-31'],
    isMilestone: true,
    isCriticalPath: true,
    resources: {
      crew: 0,
      equipment: []
    },
    cost: 0
  }
];
