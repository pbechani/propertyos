'use client';

import { useParams, Link } from '@/lib/router-compat';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  CheckCircle2,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';
import { mockProjects, mockTasks, mockBudgets, mockRisks } from '@/views/construction/data/mockData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function ProjectDetail() {
  const { id } = useParams();
  const project = mockProjects.find(p => p.id === id);
  
  if (!project) {
    return <div>Project not found</div>;
  }

  const projectTasks = mockTasks.filter(t => t.projectId === id);
  const projectBudgets = mockBudgets.filter(b => b.projectId === id);
  const projectRisks = mockRisks.filter(r => r.projectId === id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link to="/construction/projects">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Button>
        </Link>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-gray-500 mt-1">{project.type}</p>
          </div>
          <Badge
            variant={
              project.status === 'active' ? 'default' :
              project.status === 'delayed' ? 'destructive' :
              'secondary'
            }
            className="text-sm px-3 py-1"
          >
            {project.status}
          </Badge>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Progress</p>
                <p className="text-2xl font-bold">{project.progress}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Budget</p>
                <p className="text-2xl font-bold">${(project.budget / 1000000).toFixed(1)}M</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Contractors</p>
                <p className="text-2xl font-bold">{project.contractors}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Risk Level</p>
                <p className="text-2xl font-bold capitalize">{project.riskLevel}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Details */}
      <Card>
        <CardHeader>
          <CardTitle>Project Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <MapPin className="w-4 h-4" />
                Location
              </div>
              <p className="font-medium">{project.location}</p>
            </div>

            <div>
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <Calendar className="w-4 h-4" />
                Start Date
              </div>
              <p className="font-medium">{new Date(project.startDate).toLocaleDateString()}</p>
            </div>

            <div>
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <Calendar className="w-4 h-4" />
                End Date
              </div>
              <p className="font-medium">{new Date(project.endDate).toLocaleDateString()}</p>
            </div>

            <div>
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <Users className="w-4 h-4" />
                Project Manager
              </div>
              <p className="font-medium">{project.manager}</p>
            </div>

            <div>
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <CheckCircle2 className="w-4 h-4" />
                Current Phase
              </div>
              <p className="font-medium">{project.phase}</p>
            </div>

            <div>
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <DollarSign className="w-4 h-4" />
                Spent
              </div>
              <p className="font-medium">${(project.spent / 1000000).toFixed(2)}M of ${(project.budget / 1000000).toFixed(1)}M</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks ({projectTasks.length})</TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
          <TabsTrigger value="risks">Risks ({projectRisks.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Budget Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Budget by Category</CardTitle>
                <CardDescription>Allocated vs Spent</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={projectBudgets}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="allocated" fill="#3b82f6" name="Allocated" />
                    <Bar dataKey="spent" fill="#8b5cf6" name="Spent" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Milestones */}
            <Card>
              <CardHeader>
                <CardTitle>Milestones</CardTitle>
                <CardDescription>{project.completedMilestones} of {project.milestones} completed</CardDescription>
              </CardHeader>
              <CardContent>
                <Progress value={(project.completedMilestones / project.milestones) * 100} className="mb-4" />
                <div className="space-y-3">
                  {['Foundation Complete', 'Structural Frame', 'MEP Rough-in', 'Facade Installation'].map((milestone, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <span className="text-sm font-medium">{milestone}</span>
                      <Badge variant={index < project.completedMilestones ? 'default' : 'secondary'}>
                        {index < project.completedMilestones ? 'Complete' : 'Pending'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <div className="space-y-3">
            {projectTasks.map((task) => (
              <Card key={task.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{task.title}</h4>
                      <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                    </div>
                    <Badge
                      variant={
                        task.status === 'completed' ? 'default' :
                        task.status === 'in-progress' ? 'secondary' :
                        task.status === 'blocked' ? 'destructive' :
                        'outline'
                      }
                    >
                      {task.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>Assignee: {task.assignee}</span>
                    <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                    <Badge variant="outline">{task.priority}</Badge>
                  </div>
                  <Progress value={task.progress} className="mt-3" />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="budget" className="space-y-4">
          <div className="space-y-3">
            {projectBudgets.map((budget) => (
              <Card key={budget.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">{budget.category}</h4>
                    <Badge variant={budget.variance < 0 ? 'destructive' : 'default'}>
                      {budget.variance > 0 ? '+' : ''}{budget.variance.toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Allocated</p>
                      <p className="font-medium">${(budget.allocated / 1000000).toFixed(2)}M</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Spent</p>
                      <p className="font-medium">${(budget.spent / 1000000).toFixed(2)}M</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Committed</p>
                      <p className="font-medium">${(budget.committed / 1000000).toFixed(2)}M</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Remaining</p>
                      <p className="font-medium">${(budget.remaining / 1000000).toFixed(2)}M</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="risks" className="space-y-4">
          <div className="space-y-3">
            {projectRisks.map((risk) => (
              <Card key={risk.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{risk.title}</h4>
                      <p className="text-sm text-gray-500 mt-1">{risk.description}</p>
                    </div>
                    <Badge
                      variant={
                        risk.severity === 'critical' ? 'destructive' :
                        risk.severity === 'high' ? 'destructive' :
                        risk.severity === 'medium' ? 'secondary' :
                        'outline'
                      }
                    >
                      {risk.severity}
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Impact: </span>
                      <span>{risk.impact}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Mitigation: </span>
                      <span>{risk.mitigation}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <Badge variant="outline">{risk.category}</Badge>
                      <span className="text-gray-600">Owner: {risk.owner}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
