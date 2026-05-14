'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { 
  Search, 
  Plus, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Users,
  TrendingUp,
  AlertCircle,
  Filter
} from 'lucide-react';
import { Link } from '@/lib/router-compat';
import { mockProjects } from '@/views/construction/data/mockData';

export function Projects() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-500 mt-1">Manage your construction projects</p>
        </div>
        <Link to="/construction/projects/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                placeholder="Search projects..." 
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Project Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">2</p>
              <p className="text-sm text-gray-600 mt-1">Active Projects</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">1</p>
              <p className="text-sm text-gray-600 mt-1">Delayed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">1</p>
              <p className="text-sm text-gray-600 mt-1">Planning</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">$172M</p>
              <p className="text-sm text-gray-600 mt-1">Total Portfolio</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {mockProjects.map((project) => (
          <Link key={project.id} to={`/construction/projects/${project.id}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{project.name}</h3>
                    <p className="text-sm text-gray-500">{project.type}</p>
                  </div>
                  <Badge
                    variant={
                      project.status === 'active' ? 'default' :
                      project.status === 'delayed' ? 'destructive' :
                      project.status === 'completed' ? 'default' :
                      'secondary'
                    }
                  >
                    {project.status}
                  </Badge>
                </div>

                <div className="space-y-4">
                  {/* Location */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    {project.location}
                  </div>

                  {/* Progress */}
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600">Overall Progress</span>
                      <span className="font-medium">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} />
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                    <div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <DollarSign className="w-4 h-4" />
                        Budget
                      </div>
                      <p className="font-medium">${(project.budget / 1000000).toFixed(1)}M</p>
                      <p className="text-xs text-gray-500">
                        ${(project.spent / 1000000).toFixed(1)}M spent
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <Calendar className="w-4 h-4" />
                        Timeline
                      </div>
                      <p className="font-medium">{project.phase}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(project.endDate).toLocaleDateString()}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <Users className="w-4 h-4" />
                        Contractors
                      </div>
                      <p className="font-medium">{project.contractors} Active</p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        {project.riskLevel === 'low' ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <AlertCircle className="w-4 h-4" />
                        )}
                        Risk Level
                      </div>
                      <Badge
                        variant={
                          project.riskLevel === 'low' ? 'default' :
                          project.riskLevel === 'medium' ? 'secondary' :
                          'destructive'
                        }
                      >
                        {project.riskLevel}
                      </Badge>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <span className="text-sm text-gray-600">
                      Managed by {project.manager}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {project.completedMilestones}/{project.milestones} Milestones
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}