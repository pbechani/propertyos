'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  AlertTriangle,
  DollarSign,
  Users,
  ArrowRight,
  Activity,
  Sparkles,
  BarChart3,
  Zap,
  Star,
  AlertCircle,
  ChevronRight,
  Filter
} from 'lucide-react';
import { Link } from '@/lib/router-compat';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart
} from 'recharts';
import { mockProjects } from '@/views/construction/data/mockData';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Advanced Analytics Data
const portfolioData = mockProjects.map(project => ({
  id: project.id,
  name: project.name,
  status: project.status,
  progress: project.progress,
  budget: project.budget,
  spent: project.spent,
  variance: ((project.spent - project.budget * (project.progress / 100)) / project.budget * 100).toFixed(1),
  health: project.progress > 70 && project.spent < project.budget * 0.8 ? 'good' : 
          project.progress < 50 || project.spent > project.budget * 0.9 ? 'poor' : 'fair',
  timeline: project.status === 'delayed' ? 'Behind' : project.status === 'active' ? 'On Track' : 'Planning',
  startDate: project.startDate,
  endDate: project.endDate,
}));

const resourceUtilizationData = [
  { resource: 'Construction Crew', allocated: 85, available: 100, efficiency: 92 },
  { resource: 'Heavy Equipment', allocated: 72, available: 80, efficiency: 88 },
  { resource: 'Site Engineers', allocated: 90, available: 95, efficiency: 95 },
  { resource: 'Safety Personnel', allocated: 65, available: 70, efficiency: 90 },
  { resource: 'Quality Inspectors', allocated: 78, available: 85, efficiency: 87 },
];

const budgetBreakdownData = [
  { category: 'Labor', allocated: 4200000, spent: 3850000, remaining: 350000 },
  { category: 'Materials', allocated: 6500000, spent: 6200000, remaining: 300000 },
  { category: 'Equipment', allocated: 2800000, spent: 2650000, remaining: 150000 },
  { category: 'Permits & Fees', allocated: 500000, spent: 480000, remaining: 20000 },
  { category: 'Contingency', allocated: 1000000, spent: 320000, remaining: 680000 },
];

const contractorPerformanceData = [
  { 
    id: 1,
    name: 'BuildTech Solutions', 
    rating: 4.8, 
    projects: 2,
    onTime: 95, 
    quality: 92,
    safety: 98,
    status: 'excellent'
  },
  { 
    id: 2,
    name: 'Steel & Frame Co.', 
    rating: 4.5, 
    projects: 1,
    onTime: 88, 
    quality: 90,
    safety: 94,
    status: 'good'
  },
  { 
    id: 3,
    name: 'MegaBuild Inc.', 
    rating: 3.9, 
    projects: 1,
    onTime: 75, 
    quality: 82,
    safety: 88,
    status: 'fair'
  },
  { 
    id: 4,
    name: 'Premier Construction', 
    rating: 4.6, 
    projects: 2,
    onTime: 92, 
    quality: 89,
    safety: 96,
    status: 'good'
  },
];

const ganttPreviewData = [
  { task: 'Foundation', start: 0, duration: 15, progress: 100, status: 'completed' },
  { task: 'Structural Frame', start: 15, duration: 20, progress: 65, status: 'active' },
  { task: 'MEP Rough-in', start: 30, duration: 18, progress: 0, status: 'upcoming' },
  { task: 'Exterior Envelope', start: 35, duration: 15, progress: 0, status: 'upcoming' },
  { task: 'Interior Finishes', start: 48, duration: 22, progress: 0, status: 'upcoming' },
];

const aiAlerts = [
  {
    id: 1,
    severity: 'critical',
    title: 'Budget Overrun Risk Detected',
    message: 'Riverside Tower materials spending is trending 15% above forecast for Q1. Immediate action recommended.',
    project: 'Riverside Tower',
    agent: 'Cost Controller AI',
    timestamp: '2 hours ago',
    action: 'Review Vendors'
  },
  {
    id: 2,
    severity: 'warning',
    title: 'Schedule Delay Potential',
    message: 'Weather forecast shows heavy rain next week. Recommend adjusting outdoor work schedule.',
    project: 'Downtown Plaza',
    agent: 'Scheduler AI',
    timestamp: '4 hours ago',
    action: 'Adjust Schedule'
  },
  {
    id: 3,
    severity: 'info',
    title: 'Resource Optimization Opportunity',
    message: 'Construction crew utilization could increase by 12% with schedule reallocation.',
    project: 'Multiple Projects',
    agent: 'Resource Manager AI',
    timestamp: '6 hours ago',
    action: 'View Details'
  },
  {
    id: 4,
    severity: 'warning',
    title: 'Safety Compliance Alert',
    message: 'Harbor View Project approaching inspection deadline. 3 items require attention.',
    project: 'Harbor View',
    agent: 'Compliance AI',
    timestamp: '8 hours ago',
    action: 'View Checklist'
  },
];

const weeklyPerformanceData = [
  { week: 'W1', productivity: 88, quality: 92, safety: 95, cost: 85 },
  { week: 'W2', productivity: 90, quality: 89, safety: 94, cost: 87 },
  { week: 'W3', productivity: 85, quality: 91, safety: 96, cost: 83 },
  { week: 'W4', productivity: 92, quality: 93, safety: 97, cost: 89 },
];

export function AdvancedDashboard() {
  const activeProjects = mockProjects.filter(p => p.status === 'active' || p.status === 'delayed').length;
  const totalBudget = mockProjects.reduce((sum, p) => sum + p.budget, 0);
  const totalSpent = mockProjects.reduce((sum, p) => sum + p.spent, 0);
  const avgProgress = Math.round(mockProjects.reduce((sum, p) => sum + p.progress, 0) / mockProjects.length);
  const criticalAlerts = aiAlerts.filter(a => a.severity === 'critical').length;

  return (
    <div className="space-y-6">
      {/* Header with Quick Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Advanced Analytics Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time insights across your project portfolio</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <Button size="sm">
            <BarChart3 className="w-4 h-4 mr-2" />
            Custom Report
          </Button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Portfolio Health</span>
              <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">{avgProgress}%</span>
              <Badge className="bg-green-100 text-green-700 border-0 text-xs">+5.2%</Badge>
            </div>
            <p className="text-xs text-gray-500 mt-2">{activeProjects} active projects</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Total Budget</span>
              <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">${(totalBudget / 1000000).toFixed(1)}M</span>
              <Badge className="bg-green-100 text-green-700 border-0 text-xs">-2.1%</Badge>
            </div>
            <p className="text-xs text-gray-500 mt-2">${(totalSpent / 1000000).toFixed(1)}M utilized</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Resource Utilization</span>
              <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">78%</span>
              <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">+3.4%</Badge>
            </div>
            <p className="text-xs text-gray-500 mt-2">Across all resources</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">AI Alerts</span>
              <div className="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-orange-600" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">{criticalAlerts}</span>
              <Badge className="bg-red-100 text-red-700 border-0 text-xs">Critical</Badge>
            </div>
            <p className="text-xs text-gray-500 mt-2">{aiAlerts.length} total alerts</p>
          </CardContent>
        </Card>
      </div>

      {/* Project Portfolio Overview Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Project Portfolio Overview</CardTitle>
              <CardDescription>Real-time status of all active construction projects</CardDescription>
            </div>
            <Link to="/construction/projects">
              <Button variant="outline" size="sm">
                View All Projects
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead className="text-right">Budget</TableHead>
                <TableHead className="text-right">Spent</TableHead>
                <TableHead className="text-right">Variance</TableHead>
                <TableHead>Health</TableHead>
                <TableHead>Timeline</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {portfolioData.map((project) => (
                <TableRow key={project.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">{project.name}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        project.status === 'active' ? 'default' : 
                        project.status === 'delayed' ? 'destructive' : 
                        'secondary'
                      }
                      className="text-xs"
                    >
                      {project.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={project.progress} className="w-16 h-2" />
                      <span className="text-sm font-medium">{project.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    ${(project.budget / 1000000).toFixed(2)}M
                  </TableCell>
                  <TableCell className="text-right">
                    ${(project.spent / 1000000).toFixed(2)}M
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={`font-medium ${
                      parseFloat(project.variance) > 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {parseFloat(project.variance) > 0 ? '+' : ''}{project.variance}%
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${
                        project.health === 'good' ? 'bg-green-500' :
                        project.health === 'fair' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`} />
                      <span className="text-sm capitalize">{project.health}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`text-sm ${
                      project.timeline === 'On Track' ? 'text-green-600' :
                      project.timeline === 'Behind' ? 'text-red-600' :
                      'text-gray-600'
                    }`}>
                      {project.timeline}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gantt Chart Preview */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Schedule Overview</CardTitle>
                <CardDescription>Riverside Tower - Project Timeline</CardDescription>
              </div>
              <Link to="/construction/schedule">
                <Button variant="ghost" size="sm">
                  Full Gantt
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {ganttPreviewData.map((item, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">{item.task}</span>
                    <span className="text-xs text-gray-500">{item.progress}%</span>
                  </div>
                  <div className="relative h-8 bg-gray-100 rounded">
                    <div 
                      className="absolute h-full bg-blue-200 rounded"
                      style={{ 
                        left: `${(item.start / 70) * 100}%`, 
                        width: `${(item.duration / 70) * 100}%` 
                      }}
                    >
                      <div 
                        className={`h-full rounded ${
                          item.status === 'completed' ? 'bg-green-500' :
                          item.status === 'active' ? 'bg-blue-500' :
                          'bg-gray-300'
                        }`}
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Resource Utilization */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Resource Utilization</CardTitle>
            <CardDescription>Current allocation vs. capacity</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={resourceUtilizationData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <YAxis dataKey="resource" type="category" width={130} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="allocated" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                <Bar dataKey="available" fill="#e5e7eb" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Budget Analytics */}
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Budget Analytics by Category</CardTitle>
            <CardDescription>Allocated vs. spent across major categories</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={budgetBreakdownData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="allocated" fill="#94a3b8" name="Allocated" />
                <Bar dataKey="spent" fill="#3b82f6" name="Spent" />
                <Bar dataKey="remaining" fill="#10b981" name="Remaining" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Weekly Performance Metrics */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Performance Metrics</CardTitle>
            <CardDescription>Last 4 weeks average</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={weeklyPerformanceData.slice(-1)}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="week" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Radar 
                  name="Productivity" 
                  dataKey="productivity" 
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.3} 
                />
                <Radar 
                  name="Quality" 
                  dataKey="quality" 
                  stroke="#10b981" 
                  fill="#10b981" 
                  fillOpacity={0.3} 
                />
                <Radar 
                  name="Safety" 
                  dataKey="safety" 
                  stroke="#8b5cf6" 
                  fill="#8b5cf6" 
                  fillOpacity={0.3} 
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Contractor Performance & AI Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contractor Performance */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Contractor Performance</CardTitle>
                <CardDescription>Key metrics and ratings</CardDescription>
              </div>
              <Link to="/construction/contractors">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {contractorPerformanceData.map((contractor) => (
                <div key={contractor.id} className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                    {contractor.name.substring(0, 2)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-sm text-gray-900">{contractor.name}</h4>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-semibold">{contractor.rating}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-gray-600">On-Time</span>
                        <div className="flex items-center gap-1 mt-1">
                          <Progress value={contractor.onTime} className="h-1 flex-1" />
                          <span className="font-semibold text-gray-900">{contractor.onTime}%</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Quality</span>
                        <div className="flex items-center gap-1 mt-1">
                          <Progress value={contractor.quality} className="h-1 flex-1" />
                          <span className="font-semibold text-gray-900">{contractor.quality}%</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Safety</span>
                        <div className="flex items-center gap-1 mt-1">
                          <Progress value={contractor.safety} className="h-1 flex-1" />
                          <span className="font-semibold text-gray-900">{contractor.safety}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Alerts */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  AI Alerts & Recommendations
                </CardTitle>
                <CardDescription>Intelligent insights require attention</CardDescription>
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
              {aiAlerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className={`p-3 rounded-lg border-l-4 ${
                    alert.severity === 'critical' ? 'bg-red-50 border-red-500' :
                    alert.severity === 'warning' ? 'bg-orange-50 border-orange-500' :
                    'bg-blue-50 border-blue-500'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      alert.severity === 'critical' ? 'bg-red-100' :
                      alert.severity === 'warning' ? 'bg-orange-100' :
                      'bg-blue-100'
                    }`}>
                      {alert.severity === 'critical' ? (
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      ) : alert.severity === 'warning' ? (
                        <AlertTriangle className="w-4 h-4 text-orange-600" />
                      ) : (
                        <Zap className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-semibold text-sm text-gray-900">{alert.title}</h4>
                        <span className="text-xs text-gray-500 whitespace-nowrap">{alert.timestamp}</span>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{alert.message}</p>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {alert.project}
                        </Badge>
                        <Button variant="link" size="sm" className="h-6 text-xs p-0">
                          {alert.action} →
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
