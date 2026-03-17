import type { AIAgent, AIInsight, AIAnalysis } from '@/views/construction/types';

export const aiAgents: AIAgent[] = [
  {
    id: 'schedule-optimizer',
    name: 'Schedule Optimizer',
    description: 'Analyzes project timelines and suggests optimizations to accelerate delivery and reduce delays',
    icon: 'CalendarClock',
    color: '#3b82f6',
    status: 'active',
    accuracy: 94,
    tasksCompleted: 147,
    timeSaved: '324 hours',
    lastActive: '2 minutes ago',
    capabilities: [
      'Critical path analysis',
      'Resource leveling',
      'Timeline prediction',
      'Dependency optimization',
      'Weather impact forecasting'
    ],
    insights: [
      {
        id: 'ins-1',
        agentId: 'schedule-optimizer',
        type: 'optimization',
        priority: 'high',
        title: 'Parallel Task Opportunity Detected',
        description: 'MEP rough-in and drywall installation can be parallelized in different zones, saving 2 weeks',
        impact: '2 weeks faster',
        confidence: 89,
        timestamp: '5 minutes ago',
        actionable: true,
        actions: [
          { label: 'Apply Optimization', action: 'apply-parallel' },
          { label: 'View Details', action: 'view-details' }
        ]
      },
      {
        id: 'ins-2',
        agentId: 'schedule-optimizer',
        type: 'alert',
        priority: 'critical',
        title: 'Weather Delay Risk',
        description: 'Heavy rain forecasted for next week may delay exterior facade work. Consider rescheduling.',
        impact: '3-5 day delay',
        confidence: 92,
        timestamp: '1 hour ago',
        actionable: true,
        actions: [
          { label: 'Reschedule Tasks', action: 'reschedule' },
          { label: 'View Forecast', action: 'view-forecast' }
        ]
      }
    ],
    automationRules: 5
  },
  {
    id: 'cost-predictor',
    name: 'Cost Predictor',
    description: 'Forecasts project costs, identifies budget overruns, and recommends cost-saving measures',
    icon: 'TrendingUp',
    color: '#10b981',
    status: 'analyzing',
    accuracy: 91,
    tasksCompleted: 203,
    timeSaved: '180 hours',
    lastActive: 'Just now',
    capabilities: [
      'Budget forecasting',
      'Cost variance analysis',
      'Material price tracking',
      'Labor cost optimization',
      'ROI calculation'
    ],
    insights: [
      {
        id: 'ins-3',
        agentId: 'cost-predictor',
        type: 'prediction',
        priority: 'critical',
        title: 'Budget Overrun Predicted',
        description: 'Current spending trajectory indicates 8.5% budget overrun by project completion. Early intervention recommended.',
        impact: '$425K overrun risk',
        confidence: 87,
        timestamp: '10 minutes ago',
        actionable: true,
        actions: [
          { label: 'View Analysis', action: 'view-analysis' },
          { label: 'Cost Reduction Plan', action: 'reduction-plan' }
        ]
      },
      {
        id: 'ins-4',
        agentId: 'cost-predictor',
        type: 'recommendation',
        priority: 'high',
        title: 'Alternative Supplier Identified',
        description: 'Steel supplier ABC Corp offers 12% lower pricing with same delivery timeline',
        impact: 'Save $87K',
        confidence: 95,
        timestamp: '2 hours ago',
        actionable: true,
        actions: [
          { label: 'Compare Quotes', action: 'compare' },
          { label: 'Contact Supplier', action: 'contact' }
        ]
      }
    ],
    automationRules: 8
  },
  {
    id: 'risk-analyzer',
    name: 'Risk Analyzer',
    description: 'Identifies potential risks, assesses impact probability, and suggests mitigation strategies',
    icon: 'ShieldAlert',
    color: '#ef4444',
    status: 'active',
    accuracy: 88,
    tasksCompleted: 156,
    timeSaved: '240 hours',
    lastActive: '15 minutes ago',
    capabilities: [
      'Risk identification',
      'Impact assessment',
      'Probability analysis',
      'Mitigation planning',
      'Trend monitoring'
    ],
    insights: [
      {
        id: 'ins-5',
        agentId: 'risk-analyzer',
        type: 'alert',
        priority: 'critical',
        title: 'Critical Safety Risk Detected',
        description: 'Scaffolding inspection overdue on Level 5. Immediate action required to avoid safety violations.',
        impact: 'Safety violation risk',
        confidence: 98,
        timestamp: '30 minutes ago',
        actionable: true,
        actions: [
          { label: 'Schedule Inspection', action: 'schedule' },
          { label: 'View Safety Log', action: 'safety-log' }
        ]
      },
      {
        id: 'ins-6',
        agentId: 'risk-analyzer',
        type: 'warning',
        priority: 'high',
        title: 'Contractor License Expiring',
        description: 'ABC Electrical license expires in 15 days. Renewal required to continue work.',
        impact: 'Work stoppage risk',
        confidence: 100,
        timestamp: '1 hour ago',
        actionable: true,
        actions: [
          { label: 'Notify Contractor', action: 'notify' },
          { label: 'View License', action: 'view-license' }
        ]
      }
    ],
    automationRules: 12
  },
  {
    id: 'design-reviewer',
    name: 'Design Reviewer',
    description: 'Reviews architectural and engineering designs for errors, conflicts, and compliance issues',
    icon: 'Ruler',
    color: '#8b5cf6',
    status: 'idle',
    accuracy: 96,
    tasksCompleted: 89,
    timeSaved: '520 hours',
    lastActive: '3 hours ago',
    capabilities: [
      'BIM clash detection',
      'Code compliance check',
      'Design optimization',
      'Specification review',
      'Drawing comparison'
    ],
    insights: [
      {
        id: 'ins-7',
        agentId: 'design-reviewer',
        type: 'alert',
        priority: 'high',
        title: 'MEP Clash Detected',
        description: '23 clashes found between HVAC ductwork and structural beams on Level 3. Immediate coordination required.',
        impact: 'Rework prevention',
        confidence: 97,
        timestamp: '4 hours ago',
        actionable: true,
        actions: [
          { label: 'View Clashes', action: 'view-clashes' },
          { label: 'Coordinate Meeting', action: 'meeting' }
        ]
      },
      {
        id: 'ins-8',
        agentId: 'design-reviewer',
        type: 'recommendation',
        priority: 'medium',
        title: 'Design Optimization Available',
        description: 'Column spacing on Level 4 can be optimized to reduce steel usage by 8%',
        impact: 'Save $34K in materials',
        confidence: 84,
        timestamp: '6 hours ago',
        actionable: true,
        actions: [
          { label: 'View Proposal', action: 'view-proposal' },
          { label: 'Run Analysis', action: 'analyze' }
        ]
      }
    ],
    automationRules: 6
  },
  {
    id: 'compliance-checker',
    name: 'Compliance Checker',
    description: 'Monitors regulatory compliance, tracks permits, and ensures adherence to building codes',
    icon: 'FileCheck',
    color: '#f59e0b',
    status: 'active',
    accuracy: 99,
    tasksCompleted: 312,
    timeSaved: '680 hours',
    lastActive: '5 minutes ago',
    capabilities: [
      'Building code verification',
      'Permit tracking',
      'Environmental compliance',
      'OSHA regulation check',
      'Documentation audit'
    ],
    insights: [
      {
        id: 'ins-9',
        agentId: 'compliance-checker',
        type: 'alert',
        priority: 'critical',
        title: 'Permit Expiration Warning',
        description: 'Electrical work permit expires in 7 days. Renewal application must be submitted within 48 hours.',
        impact: 'Work stoppage risk',
        confidence: 100,
        timestamp: '1 hour ago',
        actionable: true,
        actions: [
          { label: 'Start Renewal', action: 'renew' },
          { label: 'View Permit', action: 'view-permit' }
        ]
      },
      {
        id: 'ins-10',
        agentId: 'compliance-checker',
        type: 'recommendation',
        priority: 'medium',
        title: 'LEED Certification Opportunity',
        description: 'Current project practices meet 85% of LEED Silver requirements. Minor adjustments could achieve certification.',
        impact: 'LEED certification',
        confidence: 82,
        timestamp: '3 hours ago',
        actionable: true,
        actions: [
          { label: 'View Requirements', action: 'view-reqs' },
          { label: 'Generate Report', action: 'report' }
        ]
      }
    ],
    automationRules: 15
  },
  {
    id: 'resource-allocator',
    name: 'Resource Allocator',
    description: 'Optimizes allocation of workforce, equipment, and materials across project activities',
    icon: 'Users',
    color: '#ec4899',
    status: 'active',
    accuracy: 92,
    tasksCompleted: 267,
    timeSaved: '420 hours',
    lastActive: '8 minutes ago',
    capabilities: [
      'Crew optimization',
      'Equipment scheduling',
      'Material planning',
      'Capacity analysis',
      'Utilization tracking'
    ],
    insights: [
      {
        id: 'ins-11',
        agentId: 'resource-allocator',
        type: 'optimization',
        priority: 'high',
        title: 'Equipment Underutilization',
        description: 'Tower Crane #2 has 35% idle time. Reassign to Level 6 steel erection to improve utilization.',
        impact: 'Save $12K/week',
        confidence: 91,
        timestamp: '20 minutes ago',
        actionable: true,
        actions: [
          { label: 'Reassign Equipment', action: 'reassign' },
          { label: 'View Schedule', action: 'schedule' }
        ]
      },
      {
        id: 'ins-12',
        agentId: 'resource-allocator',
        type: 'recommendation',
        priority: 'medium',
        title: 'Crew Rebalancing Suggested',
        description: 'Shift 5 carpenters from Level 2 (ahead of schedule) to Level 4 (behind schedule)',
        impact: '3 days faster',
        confidence: 88,
        timestamp: '45 minutes ago',
        actionable: true,
        actions: [
          { label: 'Apply Change', action: 'apply' },
          { label: 'View Impact', action: 'impact' }
        ]
      }
    ],
    automationRules: 9
  },
  {
    id: 'quality-inspector',
    name: 'Quality Inspector',
    description: 'Analyzes site photos, detects defects, and ensures work meets quality standards',
    icon: 'CheckCircle',
    color: '#06b6d4',
    status: 'analyzing',
    accuracy: 93,
    tasksCompleted: 428,
    timeSaved: '890 hours',
    lastActive: 'Just now',
    capabilities: [
      'Photo analysis',
      'Defect detection',
      'Quality scoring',
      'Trend analysis',
      'Specification compliance'
    ],
    insights: [
      {
        id: 'ins-13',
        agentId: 'quality-inspector',
        type: 'alert',
        priority: 'high',
        title: 'Concrete Finish Quality Issue',
        description: 'Photo analysis reveals uneven concrete finish on Level 3 slab. May require grinding and leveling.',
        impact: 'Rework required',
        confidence: 86,
        timestamp: '25 minutes ago',
        actionable: true,
        actions: [
          { label: 'View Photos', action: 'photos' },
          { label: 'Create RFI', action: 'rfi' }
        ]
      },
      {
        id: 'ins-14',
        agentId: 'quality-inspector',
        type: 'recommendation',
        priority: 'medium',
        title: 'Quality Trend Improving',
        description: 'Defect rate decreased 23% over last 2 weeks. Current contractor performance exceeds baseline.',
        impact: 'Quality improvement',
        confidence: 94,
        timestamp: '2 hours ago',
        actionable: false
      }
    ],
    automationRules: 7
  }
];

export const activeAnalyses: AIAnalysis[] = [
  {
    id: 'analysis-1',
    agentId: 'cost-predictor',
    type: 'Budget Forecast Analysis',
    status: 'in-progress',
    progress: 67,
    startedAt: '10 minutes ago'
  },
  {
    id: 'analysis-2',
    agentId: 'schedule-optimizer',
    type: 'Critical Path Analysis',
    status: 'completed',
    progress: 100,
    startedAt: '2 hours ago',
    completedAt: '1 hour ago',
    result: {
      criticalTasks: 13,
      floatDays: 8,
      recommendations: 3
    }
  },
  {
    id: 'analysis-3',
    agentId: 'quality-inspector',
    type: 'Site Photo Analysis (247 photos)',
    status: 'in-progress',
    progress: 84,
    startedAt: '30 minutes ago'
  },
  {
    id: 'analysis-4',
    agentId: 'risk-analyzer',
    type: 'Weekly Risk Assessment',
    status: 'pending',
    progress: 0,
    startedAt: '5 minutes ago'
  }
];

export const allInsights: AIInsight[] = aiAgents.flatMap(agent => agent.insights);

export const agentStats = {
  totalAgents: aiAgents.length,
  activeAgents: aiAgents.filter(a => a.status === 'active' || a.status === 'analyzing').length,
  totalInsights: allInsights.length,
  criticalInsights: allInsights.filter(i => i.priority === 'critical').length,
  totalTasksCompleted: aiAgents.reduce((sum, agent) => sum + agent.tasksCompleted, 0),
  averageAccuracy: Math.round(aiAgents.reduce((sum, agent) => sum + agent.accuracy, 0) / aiAgents.length),
  activeAnalyses: activeAnalyses.filter(a => a.status === 'in-progress').length
};
