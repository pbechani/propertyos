import type { SiteLog, SitePhoto } from '@/views/construction/types';

export const mockSitePhotos: SitePhoto[] = [
  {
    id: 'photo1',
    projectId: 'p1',
    projectName: 'Metropolitan Heights Tower',
    url: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=300',
    fileName: 'foundation-progress-001.jpg',
    uploadDate: '2026-03-12',
    uploadedBy: 'John Smith',
    description: 'Foundation concrete pouring - East section',
    location: 'Foundation Level - East Wing',
    phase: 'Foundation',
    tags: ['foundation', 'concrete', 'progress'],
    fileSize: '2.4 MB',
    dimensions: { width: 4032, height: 3024 }
  },
  {
    id: 'photo2',
    projectId: 'p1',
    projectName: 'Metropolitan Heights Tower',
    url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=300',
    fileName: 'steel-framework-012.jpg',
    uploadDate: '2026-03-11',
    uploadedBy: 'Sarah Johnson',
    description: 'Steel framework installation - Floor 8',
    location: 'Floor 8 - North Side',
    phase: 'Structural',
    tags: ['structural', 'steel', 'floor-8'],
    fileSize: '3.1 MB',
    dimensions: { width: 4032, height: 3024 }
  },
  {
    id: 'photo3',
    projectId: 'p1',
    projectName: 'Metropolitan Heights Tower',
    url: 'https://images.unsplash.com/photo-1590856029826-c7a73a4bed0a?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1590856029826-c7a73a4bed0a?w=300',
    fileName: 'electrical-rough-in-045.jpg',
    uploadDate: '2026-03-10',
    uploadedBy: 'Mike Chen',
    description: 'Electrical conduit installation complete',
    location: 'Floor 10 - Electrical Room',
    phase: 'MEP',
    tags: ['electrical', 'mep', 'floor-10'],
    fileSize: '1.8 MB',
    dimensions: { width: 3024, height: 4032 }
  },
  {
    id: 'photo4',
    projectId: 'p1',
    projectName: 'Metropolitan Heights Tower',
    url: 'https://images.unsplash.com/photo-1572981779307-38b8cobb2407?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1572981779307-38b8cobb2407?w=300',
    fileName: 'hvac-installation-023.jpg',
    uploadDate: '2026-03-09',
    uploadedBy: 'David Martinez',
    description: 'HVAC ductwork installation progress',
    location: 'Floor 7 - HVAC Chase',
    phase: 'MEP',
    tags: ['hvac', 'mep', 'ductwork'],
    fileSize: '2.7 MB',
    dimensions: { width: 4032, height: 3024 }
  },
  {
    id: 'photo5',
    projectId: 'p1',
    projectName: 'Metropolitan Heights Tower',
    url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=300',
    fileName: 'exterior-facade-008.jpg',
    uploadDate: '2026-03-08',
    uploadedBy: 'Lisa Thompson',
    description: 'Curtain wall installation - South facade',
    location: 'Exterior - South Side',
    phase: 'Facade',
    tags: ['facade', 'curtain-wall', 'exterior'],
    fileSize: '3.5 MB',
    dimensions: { width: 4032, height: 3024 }
  },
  {
    id: 'photo6',
    projectId: 'p1',
    projectName: 'Metropolitan Heights Tower',
    url: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=300',
    fileName: 'safety-inspection-015.jpg',
    uploadDate: '2026-03-07',
    uploadedBy: 'Angela Brown',
    description: 'Weekly safety inspection - All zones clear',
    location: 'Site Wide',
    phase: 'Safety',
    tags: ['safety', 'inspection', 'compliance'],
    fileSize: '2.1 MB',
    dimensions: { width: 3024, height: 4032 }
  },
  {
    id: 'photo7',
    projectId: 'p1',
    projectName: 'Metropolitan Heights Tower',
    url: 'https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=300',
    fileName: 'plumbing-rough-in-034.jpg',
    uploadDate: '2026-03-06',
    uploadedBy: 'Robert Kim',
    description: 'Plumbing rough-in completed - Floors 5-7',
    location: 'Floors 5-7 - Plumbing Cores',
    phase: 'MEP',
    tags: ['plumbing', 'mep', 'rough-in'],
    fileSize: '2.9 MB',
    dimensions: { width: 4032, height: 3024 }
  },
  {
    id: 'photo8',
    projectId: 'p1',
    projectName: 'Metropolitan Heights Tower',
    url: 'https://images.unsplash.com/photo-1599809275671-b5942cabc7a2?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1599809275671-b5942cabc7a2?w=300',
    fileName: 'interior-framing-056.jpg',
    uploadDate: '2026-03-05',
    uploadedBy: 'Jennifer Lee',
    description: 'Interior wall framing - Office spaces',
    location: 'Floor 6 - Office Area',
    phase: 'Interior',
    tags: ['interior', 'framing', 'walls'],
    fileSize: '2.2 MB',
    dimensions: { width: 4032, height: 3024 }
  },
  {
    id: 'photo9',
    projectId: 'p2',
    projectName: 'Riverside Medical Center',
    url: 'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=300',
    fileName: 'site-preparation-002.jpg',
    uploadDate: '2026-03-04',
    uploadedBy: 'Carlos Rodriguez',
    description: 'Site preparation and grading complete',
    location: 'Site Perimeter',
    phase: 'Site Work',
    tags: ['site-work', 'preparation', 'grading'],
    fileSize: '3.8 MB',
    dimensions: { width: 4032, height: 3024 }
  },
  {
    id: 'photo10',
    projectId: 'p1',
    projectName: 'Metropolitan Heights Tower',
    url: 'https://images.unsplash.com/photo-1597476374767-be32c480e0f6?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1597476374767-be32c480e0f6?w=300',
    fileName: 'concrete-delivery-018.jpg',
    uploadDate: '2026-03-03',
    uploadedBy: 'Thomas Anderson',
    description: 'Concrete delivery and placement',
    location: 'Floor 9 - Deck Pour',
    phase: 'Structural',
    tags: ['concrete', 'structural', 'delivery'],
    fileSize: '2.6 MB',
    dimensions: { width: 3024, height: 4032 }
  },
  {
    id: 'photo11',
    projectId: 'p1',
    projectName: 'Metropolitan Heights Tower',
    url: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=300',
    fileName: 'tower-crane-setup-001.jpg',
    uploadDate: '2026-03-02',
    uploadedBy: 'Patricia Green',
    description: 'Tower crane installation and setup',
    location: 'Site Center - Crane Base',
    phase: 'Site Work',
    tags: ['crane', 'equipment', 'setup'],
    fileSize: '4.2 MB',
    dimensions: { width: 4032, height: 3024 }
  },
  {
    id: 'photo12',
    projectId: 'p1',
    projectName: 'Metropolitan Heights Tower',
    url: 'https://images.unsplash.com/photo-1632778492631-e1e716d40648?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1632778492631-e1e716d40648?w=300',
    fileName: 'rebar-placement-027.jpg',
    uploadDate: '2026-03-01',
    uploadedBy: 'James Wilson',
    description: 'Rebar placement and tie-down',
    location: 'Floor 8 - Deck Prep',
    phase: 'Structural',
    tags: ['rebar', 'structural', 'preparation'],
    fileSize: '3.3 MB',
    dimensions: { width: 4032, height: 3024 }
  }
];

export const mockSiteLogs: SiteLog[] = [
  {
    id: 'log1',
    projectId: 'p1',
    projectName: 'Metropolitan Heights Tower',
    date: '2026-03-12',
    weather: {
      condition: 'Partly Cloudy',
      temperature: 68,
      temperatureUnit: 'F',
      precipitation: 'None'
    },
    workersOnSite: {
      total: 87,
      breakdown: [
        { category: 'General Labor', count: 32 },
        { category: 'Electricians', count: 15 },
        { category: 'Plumbers', count: 12 },
        { category: 'Steel Workers', count: 18 },
        { category: 'Safety Officers', count: 4 },
        { category: 'Site Management', count: 6 }
      ]
    },
    workCompleted: [
      {
        id: 'wc1',
        description: 'Completed electrical rough-in for Floor 10 East Wing',
        location: 'Floor 10 - East Wing',
        completionPercentage: 100
      },
      {
        id: 'wc2',
        description: 'Steel beam installation for Floor 12 - 60% complete',
        location: 'Floor 12',
        completionPercentage: 60
      },
      {
        id: 'wc3',
        description: 'HVAC ductwork installation Floor 7 South section',
        location: 'Floor 7 - South',
        completionPercentage: 85
      },
      {
        id: 'wc4',
        description: 'Concrete deck pour Floor 9 completed and curing',
        location: 'Floor 9',
        completionPercentage: 100
      }
    ],
    issuesEncountered: [
      {
        id: 'issue1',
        type: 'delay',
        severity: 'medium',
        description: 'Concrete delivery delayed by 2 hours due to traffic',
        status: 'resolved',
        resolution: 'Adjusted schedule, no impact to critical path'
      },
      {
        id: 'issue2',
        type: 'equipment',
        severity: 'low',
        description: 'Minor hydraulic leak on scissor lift #3',
        status: 'resolved',
        resolution: 'Maintenance performed, equipment back in service'
      }
    ],
    photos: [mockSitePhotos[0], mockSitePhotos[1]],
    notes: 'Excellent progress today. All safety protocols followed. Weather conditions favorable for exterior work.',
    reportedBy: 'Sarah Johnson',
    reportedByRole: 'Site Manager',
    submittedAt: '2026-03-12T18:30:00Z',
    status: 'submitted'
  },
  {
    id: 'log2',
    projectId: 'p1',
    projectName: 'Metropolitan Heights Tower',
    date: '2026-03-11',
    weather: {
      condition: 'Sunny',
      temperature: 72,
      temperatureUnit: 'F',
      precipitation: 'None'
    },
    workersOnSite: {
      total: 92,
      breakdown: [
        { category: 'General Labor', count: 35 },
        { category: 'Electricians', count: 16 },
        { category: 'Plumbers', count: 14 },
        { category: 'Steel Workers', count: 20 },
        { category: 'Safety Officers', count: 3 },
        { category: 'Site Management', count: 4 }
      ]
    },
    workCompleted: [
      {
        id: 'wc5',
        description: 'Foundation waterproofing inspection passed',
        location: 'Foundation Level',
        completionPercentage: 100
      },
      {
        id: 'wc6',
        description: 'Curtain wall installation South facade progress',
        location: 'South Facade - Floors 5-7',
        completionPercentage: 45
      }
    ],
    issuesEncountered: [
      {
        id: 'issue3',
        type: 'safety',
        severity: 'high',
        description: 'Improper PPE usage observed on Floor 11',
        status: 'resolved',
        resolution: 'Safety briefing conducted, workers retrained'
      }
    ],
    photos: [mockSitePhotos[2], mockSitePhotos[3]],
    reportedBy: 'John Smith',
    reportedByRole: 'Assistant Site Manager',
    submittedAt: '2026-03-11T17:45:00Z',
    status: 'submitted'
  }
];
