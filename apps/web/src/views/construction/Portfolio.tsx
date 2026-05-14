'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Building2, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';
import { mockProjects } from '@/views/construction/data/mockData';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const portfolioPerformance = [
  { month: 'Oct', budget: 85, progress: 78 },
  { month: 'Nov', budget: 88, progress: 82 },
  { month: 'Dec', budget: 86, progress: 85 },
  { month: 'Jan', budget: 92, progress: 88 },
  { month: 'Feb', budget: 89, progress: 87 },
  { month: 'Mar', budget: 91, progress: 90 },
];

export function Portfolio() {
  const totalBudget = mockProjects.reduce((sum, p) => sum + p.budget, 0);
  const avgProgress = Math.round(mockProjects.reduce((sum, p) => sum + p.progress, 0) / mockProjects.length);
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Portfolio Management</h1>
        <p className="text-gray-500 mt-1">Overview of all projects and investments</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Projects</p>
                <p className="text-3xl font-bold mt-2">{mockProjects.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Investment</p>
                <p className="text-3xl font-bold mt-2">${(totalBudget / 1000000).toFixed(0)}M</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Progress</p>
                <p className="text-3xl font-bold mt-2">{avgProgress}%</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">At Risk</p>
                <p className="text-3xl font-bold mt-2">
                  {mockProjects.filter(p => p.riskLevel === 'high' || p.riskLevel === 'critical').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Performance Trends</CardTitle>
            <CardDescription>Budget adherence vs Progress</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={portfolioPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="budget" stroke="#3b82f6" strokeWidth={2} name="Budget %" />
                <Line type="monotone" dataKey="progress" stroke="#8b5cf6" strokeWidth={2} name="Progress %" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Investment by Project Type</CardTitle>
            <CardDescription>Budget allocation (in millions)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mockProjects.map(p => ({ name: p.type.split(' ')[0], budget: p.budget / 1000000 }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="budget" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Projects Overview</CardTitle>
          <CardDescription>Detailed portfolio breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockProjects.map((project) => (
              <div key={project.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{project.name}</h4>
                    <p className="text-sm text-gray-500">{project.type} • {project.location}</p>
                  </div>
                  <Badge variant={
                    project.status === 'active' ? 'default' :
                    project.status === 'delayed' ? 'destructive' :
                    'secondary'
                  }>
                    {project.status}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Budget</p>
                      <p className="font-medium">${(project.budget / 1000000).toFixed(1)}M</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Spent</p>
                      <p className="font-medium">${(project.spent / 1000000).toFixed(1)}M</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Phase</p>
                      <p className="font-medium">{project.phase}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Risk</p>
                      <Badge variant={
                        project.riskLevel === 'low' ? 'default' :
                        project.riskLevel === 'medium' ? 'secondary' :
                        'destructive'
                      }>
                        {project.riskLevel}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
