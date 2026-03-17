'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  Building2,
  ArrowRight,
  Activity,
  Calendar,
  Target,
  Sparkles,
  Camera
} from 'lucide-react';
import { Link } from '@/lib/router-compat';
import { 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer
} from 'recharts';
import { mockProjects, mockIssues } from '@/views/construction/data/mockData';
import React from 'react';

// Sample data for investor dashboard
const budgetProgressData = [
  { month: 'Oct', budget: 8500, spent: 8200, projected: 8300 },
  { month: 'Nov', budget: 9200, spent: 9600, projected: 9400 },
  { month: 'Dec', budget: 10100, spent: 9800, projected: 10000 },
  { month: 'Jan', budget: 11500, spent: 11200, projected: 11300 },
  { month: 'Feb', budget: 12800, spent: 13100, projected: 12900 },
  { month: 'Mar', budget: 14200, spent: 13900, projected: 14100 },
];

const milestones = [
  { 
    id: 1, 
    name: 'Foundation Complete', 
    date: 'Feb 15, 2026', 
    status: 'completed',
    completion: 100 
  },
  { 
    id: 2, 
    name: 'Structural Framing', 
    date: 'Mar 20, 2026', 
    status: 'in-progress',
    completion: 65 
  },
  { 
    id: 3, 
    name: 'MEP Installation', 
    date: 'Apr 30, 2026', 
    status: 'upcoming',
    completion: 0 
  },
  { 
    id: 4, 
    name: 'Interior Finishes', 
    date: 'Jun 15, 2026', 
    status: 'upcoming',
    completion: 0 
  },
];

const sitePhotos = [
  { id: 1, title: 'North Wing Progress', date: 'Mar 10, 2026', url: 'construction-site-aerial' },
  { id: 2, title: 'Foundation Work', date: 'Mar 8, 2026', url: 'construction-foundation' },
  { id: 3, title: 'Structural Steel', date: 'Mar 5, 2026', url: 'construction-steel-beams' },
  { id: 4, title: 'Site Overview', date: 'Mar 1, 2026', url: 'construction-equipment' },
];

const aiInsights = [
  {
    id: 1,
    type: 'positive',
    title: 'Project On Track',
    message: 'Current progress indicates on-time delivery with 95% confidence.',
    agent: 'Project Manager AI'
  },
  {
    id: 2,
    type: 'warning',
    title: 'Budget Alert',
    message: 'Material costs trending 3% above forecast. Recommend vendor review.',
    agent: 'Cost Controller AI'
  },
  {
    id: 3,
    type: 'info',
    title: 'Weather Impact',
    message: 'Favorable weather next 2 weeks. Opportunity to accelerate outdoor work.',
    agent: 'Scheduler AI'
  },
];

export function Dashboard() {
  // Get primary active project for investor view
  const primaryProject = mockProjects.find(p => p.id === 'p1') || mockProjects[0];
  const totalBudget = primaryProject.budget;
  const totalSpent = primaryProject.spent;
  const budgetRemaining = totalBudget - totalSpent;
  const percentSpent = (totalSpent / totalBudget) * 100;
  const projectProgress = primaryProject.progress;
  
  const criticalRisks = mockIssues.filter(i => i.priority === 'critical' && i.status !== 'resolved').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Project Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-white/20 text-white border-white/30">Active Project</Badge>
              <Badge className="bg-green-500/90 text-white border-0">On Track</Badge>
            </div>
            <h1 className="text-3xl font-bold mb-2">{primaryProject.name}</h1>
            <p className="text-blue-100 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              {primaryProject.location}
            </p>
          </div>
          <Link to="/construction/projects">
            <Button variant="secondary" size="sm">
              View Details
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        {/* Large Progress Indicator */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <div className="flex items-center justify-between mb-3">
            <span className="text-lg font-medium">Overall Project Progress</span>
            <span className="text-3xl font-bold">{projectProgress}%</span>
          </div>
          <Progress value={projectProgress} className="h-3 bg-white/20" />
          <div className="flex items-center justify-between mt-3 text-sm text-blue-100">
            <span>Started: {primaryProject.startDate}</span>
            <span>Expected Completion: {primaryProject.endDate}</span>
          </div>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Budget Summary */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Budget Overview</CardTitle>
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-sm text-gray-600">Total Budget</span>
                <span className="text-2xl font-bold text-gray-900">
                  ${(totalBudget / 1000000).toFixed(2)}M
                </span>
              </div>
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-sm text-gray-600">Spent</span>
                <span className="text-lg font-semibold text-gray-700">
                  ${(totalSpent / 1000000).toFixed(2)}M
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-gray-600">Remaining</span>
                <span className="text-lg font-semibold text-green-600">
                  ${(budgetRemaining / 1000000).toFixed(2)}M
                </span>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2 text-sm">
                <span className="text-gray-600">Budget Utilized</span>
                <span className="font-semibold text-gray-900">{percentSpent.toFixed(1)}%</span>
              </div>
              <Progress value={percentSpent} className="h-2" />
            </div>
            <div className="flex items-center gap-2 pt-2 text-sm">
              <TrendingDown className="w-4 h-4 text-green-600" />
              <span className="text-green-600 font-medium">2.1% under budget</span>
            </div>
          </CardContent>
        </Card>

        {/* Timeline Status */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Timeline Status</CardTitle>
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-sm text-gray-600">Project Duration</span>
                <span className="text-2xl font-bold text-gray-900">18 mo</span>
              </div>
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-sm text-gray-600">Elapsed</span>
                <span className="text-lg font-semibold text-gray-700">12 mo</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-gray-600">Remaining</span>
                <span className="text-lg font-semibold text-blue-600">6 mo</span>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2 text-sm">
                <span className="text-gray-600">Time Progress</span>
                <span className="font-semibold text-gray-900">67%</span>
              </div>
              <Progress value={67} className="h-2" />
            </div>
            <div className="flex items-center gap-2 pt-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-green-600 font-medium">On schedule</span>
            </div>
          </CardContent>
        </Card>

        {/* Risk Overview */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Risk Overview</CardTitle>
              <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Critical Risks</span>
                <Badge variant="destructive" className="text-xs">{criticalRisks}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">High Priority</span>
                <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">2</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Medium Priority</span>
                <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-700">5</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Resolved</span>
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">12</Badge>
              </div>
            </div>
            <div className="pt-2 border-t">
              <Link to="/construction/risks">
                <Button variant="ghost" size="sm" className="w-full justify-center">
                  View Risk Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Trend Chart */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Budget Performance Trend</CardTitle>
              <CardDescription>Monthly budget vs actual spend comparison</CardDescription>
            </div>
            <Badge variant="outline">Last 6 Months</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={budgetProgressData}>
              <defs>
                <linearGradient id="colorBudget" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="budget" 
                stroke="#3b82f6" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorBudget)" 
              />
              <Area 
                type="monotone" 
                dataKey="spent" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorSpent)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Milestones */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  Project Milestones
                </CardTitle>
                <CardDescription>Key deliverables and completion dates</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {milestones.map((milestone, index) => (
                <div key={milestone.id} className="relative pl-8">
                  {/* Timeline connector */}
                  {index < milestones.length - 1 && (
                    <div className="absolute left-3 top-8 bottom-0 w-0.5 bg-gray-200" />
                  )}
                  
                  {/* Status indicator */}
                  <div className={`absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center ${
                    milestone.status === 'completed' ? 'bg-green-100' :
                    milestone.status === 'in-progress' ? 'bg-blue-100' :
                    'bg-gray-100'
                  }`}>
                    {milestone.status === 'completed' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : milestone.status === 'in-progress' ? (
                      <Activity className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Clock className="w-4 h-4 text-gray-400" />
                    )}
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900">{milestone.name}</h4>
                        <p className="text-sm text-gray-500 mt-1">{milestone.date}</p>
                      </div>
                      <Badge 
                        variant={
                          milestone.status === 'completed' ? 'default' :
                          milestone.status === 'in-progress' ? 'secondary' :
                          'outline'
                        }
                        className="text-xs"
                      >
                        {milestone.status === 'completed' ? 'Complete' :
                         milestone.status === 'in-progress' ? 'In Progress' :
                         'Upcoming'}
                      </Badge>
                    </div>
                    {milestone.status === 'in-progress' && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-1 text-xs">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-semibold text-gray-900">{milestone.completion}%</span>
                        </div>
                        <Progress value={milestone.completion} className="h-1.5" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Insights */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  AI Insights & Recommendations
                </CardTitle>
                <CardDescription>Intelligent analysis and suggestions</CardDescription>
              </div>
              <Link to="/construction/ai">
                <Button variant="ghost" size="sm">
                  AI Center
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {aiInsights.map((insight) => (
                <div 
                  key={insight.id} 
                  className={`p-4 rounded-lg border-l-4 ${
                    insight.type === 'positive' ? 'bg-green-50 border-green-500' :
                    insight.type === 'warning' ? 'bg-orange-50 border-orange-500' :
                    'bg-blue-50 border-blue-500'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      insight.type === 'positive' ? 'bg-green-100' :
                      insight.type === 'warning' ? 'bg-orange-100' :
                      'bg-blue-100'
                    }`}>
                      {insight.type === 'positive' ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : insight.type === 'warning' ? (
                        <AlertTriangle className="w-4 h-4 text-orange-600" />
                      ) : (
                        <Sparkles className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-sm mb-1">
                        {insight.title}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">
                        {insight.message}
                      </p>
                      <p className="text-xs text-gray-500">
                        — {insight.agent}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Latest Site Photos */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-600" />
                Latest Site Photos
              </CardTitle>
              <CardDescription>Recent progress documentation</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              View Gallery
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {sitePhotos.map((photo) => (
              <SitePhotoCard key={photo.id} photo={photo} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Site Photo Component
function SitePhotoCard({ photo }: { photo: typeof sitePhotos[0] }) {
  const [imageUrl, setImageUrl] = React.useState<string>('');

  React.useEffect(() => {
    // Simulating image loading - in real app, would fetch from API
    setImageUrl(`https://source.unsplash.com/400x300/?${photo.url}`);
  }, [photo.url]);

  return (
    <div className="group relative overflow-hidden rounded-lg border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer">
      <div className="aspect-[4/3] bg-gray-100">
        {imageUrl && (
          <img 
            src={imageUrl} 
            alt={photo.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        )}
      </div>
      <div className="p-3 bg-white">
        <h4 className="font-medium text-sm text-gray-900 truncate">{photo.title}</h4>
        <p className="text-xs text-gray-500 mt-1">{photo.date}</p>
      </div>
    </div>
  );
}
