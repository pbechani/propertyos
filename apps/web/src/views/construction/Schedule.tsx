'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Download, Filter, ZoomIn, ZoomOut } from 'lucide-react';
import { mockTasks, mockProjects } from '@/views/construction/data/mockData';

export function Schedule() {
  const getProjectName = (projectId: string) => {
    return mockProjects.find(p => p.id === projectId)?.name || 'Unknown';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Schedule</h1>
          <p className="text-gray-500 mt-1">Project timeline and Gantt chart view</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Timeline Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm">
                <Calendar className="w-4 h-4 mr-2" />
                March 2026
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">Day</Button>
                <Button variant="outline" size="sm">Week</Button>
                <Button size="sm">Month</Button>
                <Button variant="outline" size="sm">Quarter</Button>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon">
                <ZoomOut className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon">
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gantt Chart Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Project Timeline</CardTitle>
          <CardDescription>Gantt chart showing all tasks and dependencies</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {/* Timeline Header */}
            <div className="flex border-b border-gray-200 pb-2 mb-4">
              <div className="w-80 flex-shrink-0 font-medium text-sm text-gray-600">Task</div>
              <div className="flex-1 grid grid-cols-7 gap-2 text-xs text-gray-600 text-center">
                <div>Mar 1-5</div>
                <div>Mar 6-10</div>
                <div>Mar 11-15</div>
                <div>Mar 16-20</div>
                <div>Mar 21-25</div>
                <div>Mar 26-31</div>
                <div>Apr 1-5</div>
              </div>
            </div>

            {/* Task Rows */}
            <div className="space-y-2">
              {mockTasks.map((task, _index) => {
                const startDate = new Date(task.startDate);
                const startDay = startDate.getDate();
                
                // Simple positioning for demo
                const gridColumn = `${Math.floor(startDay / 5) + 1} / span 2`;

                return (
                  <div key={task.id} className="flex items-center group hover:bg-gray-50 py-2">
                    <div className="w-80 flex-shrink-0 pr-4">
                      <div className="font-medium text-sm text-gray-900">{task.title}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">{getProjectName(task.projectId)}</Badge>
                        <span className="text-xs text-gray-500">{task.assignee}</span>
                      </div>
                    </div>
                    <div className="flex-1 grid grid-cols-7 gap-2 relative">
                      <div 
                        className="h-8 rounded flex items-center px-2 text-xs text-white font-medium"
                        style={{
                          gridColumn: gridColumn,
                          backgroundColor: 
                            task.status === 'completed' ? '#22c55e' :
                            task.status === 'in-progress' ? '#3b82f6' :
                            task.status === 'blocked' ? '#ef4444' :
                            '#8b5cf6'
                        }}
                      >
                        {task.progress}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-400" />
              <span className="text-sm text-gray-600">To Do</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-600" />
              <span className="text-sm text-gray-600">In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-600" />
              <span className="text-sm text-gray-600">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-600" />
              <span className="text-sm text-gray-600">Blocked</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Critical Path */}
      <Card>
        <CardHeader>
          <CardTitle>Critical Path Analysis</CardTitle>
          <CardDescription>Tasks that directly impact project completion</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockTasks.filter(t => t.priority === 'high' || t.priority === 'critical').map(task => (
              <div key={task.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <Badge variant={task.priority === 'critical' ? 'destructive' : 'secondary'}>
                      {task.priority}
                    </Badge>
                    <span className="font-medium">{task.title}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{task.assignee} • {getProjectName(task.projectId)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {new Date(task.startDate).toLocaleDateString()} - {new Date(task.dueDate).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{task.progress}% complete</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
