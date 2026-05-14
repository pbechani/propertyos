'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Calendar,
  ChevronRight,
  ChevronDown,
  Download,
  Plus,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  TrendingUp,
  Flag,
  ChevronLeft,
  CalendarDays,
  ListTree
} from 'lucide-react';
import { scheduleTasks, projectPhases } from '@/views/construction/data/schedule';
import type { ScheduleTask } from '@/views/construction/types';

type ViewMode = 'days' | 'weeks' | 'months';
type GroupBy = 'none' | 'phase' | 'status' | 'priority';

export function ProjectSchedule() {
  const [viewMode, setViewMode] = useState<ViewMode>('weeks');
  const [groupBy, setGroupBy] = useState<GroupBy>('phase');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPhase, setFilterPhase] = useState('all');
  const [showCriticalPath, setShowCriticalPath] = useState(true);
  const [showMilestones, setShowMilestones] = useState(true);
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set(projectPhases.map(p => p.id)));
  const [selectedTask, setSelectedTask] = useState<ScheduleTask | null>(null);
  const [currentDate] = useState(new Date('2026-04-15')); // Current project date

  // Calculate project timeline bounds
  const timelineBounds = useMemo(() => {
    const allDates = scheduleTasks.flatMap(task => [
      new Date(task.startDate),
      new Date(task.endDate)
    ]);
    return {
      start: new Date(Math.min(...allDates.map(d => d.getTime()))),
      end: new Date(Math.max(...allDates.map(d => d.getTime())))
    };
  }, []);

  // Generate timeline columns based on view mode
  const timelineColumns = useMemo(() => {
    const columns: Date[] = [];
    const current = new Date(timelineBounds.start);
    
    while (current <= timelineBounds.end) {
      columns.push(new Date(current));
      
      if (viewMode === 'days') {
        current.setDate(current.getDate() + 1);
      } else if (viewMode === 'weeks') {
        current.setDate(current.getDate() + 7);
      } else {
        current.setMonth(current.getMonth() + 1);
      }
    }
    
    return columns;
  }, [timelineBounds, viewMode]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return scheduleTasks.filter(task => {
      if (filterStatus !== 'all' && task.status !== filterStatus) return false;
      if (filterPhase !== 'all' && task.phase !== filterPhase) return false;
      if (!showCriticalPath && task.isCriticalPath) return false;
      if (!showMilestones && task.isMilestone) return false;
      return true;
    });
  }, [filterStatus, filterPhase, showCriticalPath, showMilestones]);

  // Group tasks
  const groupedTasks = useMemo(() => {
    if (groupBy === 'none') {
      return [{ id: 'all', name: 'All Tasks', tasks: filteredTasks }];
    }
    
    if (groupBy === 'phase') {
      return projectPhases.map(phase => ({
        ...phase,
        tasks: filteredTasks.filter(t => t.phase === phase.id)
      })).filter(g => g.tasks.length > 0);
    }
    
    if (groupBy === 'status') {
      const statuses = ['not-started', 'in-progress', 'completed', 'delayed', 'on-hold'];
      return statuses.map(status => ({
        id: status,
        name: status.replace('-', ' ').toUpperCase(),
        tasks: filteredTasks.filter(t => t.status === status)
      })).filter(g => g.tasks.length > 0);
    }
    
    if (groupBy === 'priority') {
      const priorities = ['critical', 'high', 'medium', 'low'];
      return priorities.map(priority => ({
        id: priority,
        name: priority.toUpperCase(),
        tasks: filteredTasks.filter(t => t.priority === priority)
      })).filter(g => g.tasks.length > 0);
    }
    
    return [];
  }, [groupBy, filteredTasks]);

  // Calculate task position and width
  const getTaskPosition = (task: ScheduleTask) => {
    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.endDate);
    const totalDays = Math.ceil((timelineBounds.end.getTime() - timelineBounds.start.getTime()) / (1000 * 60 * 60 * 24));
    const startDays = Math.ceil((taskStart.getTime() - timelineBounds.start.getTime()) / (1000 * 60 * 60 * 24));
    const duration = Math.ceil((taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    return {
      left: `${(startDays / totalDays) * 100}%`,
      width: `${(duration / totalDays) * 100}%`
    };
  };

  const togglePhase = (phaseId: string) => {
    const newExpanded = new Set(expandedPhases);
    if (newExpanded.has(phaseId)) {
      newExpanded.delete(phaseId);
    } else {
      newExpanded.add(phaseId);
    }
    setExpandedPhases(newExpanded);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in-progress': return 'bg-blue-500';
      case 'delayed': return 'bg-red-500';
      case 'on-hold': return 'bg-yellow-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'delayed': return 'bg-red-100 text-red-800';
      case 'on-hold': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      default: return 'text-green-600';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: viewMode === 'months' ? 'numeric' : undefined
    });
  };

  const calculateProjectStats = () => {
    const total = scheduleTasks.length;
    const completed = scheduleTasks.filter(t => t.status === 'completed').length;
    const inProgress = scheduleTasks.filter(t => t.status === 'in-progress').length;
    const delayed = scheduleTasks.filter(t => t.status === 'delayed').length;
    const milestones = scheduleTasks.filter(t => t.isMilestone).length;
    const criticalPath = scheduleTasks.filter(t => t.isCriticalPath).length;
    
    return { total, completed, inProgress, delayed, milestones, criticalPath };
  };

  const stats = calculateProjectStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Project Schedule</h1>
          <p className="text-gray-500 mt-1">Metropolitan Heights Tower - Construction Timeline</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <ListTree className="w-5 h-5 text-gray-600" />
              <Badge variant="secondary">{stats.total}</Badge>
            </div>
            <p className="text-sm text-gray-600">Total Tasks</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <Badge className="bg-green-100 text-green-800">{stats.completed}</Badge>
            </div>
            <p className="text-sm text-gray-600">Completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <Badge className="bg-blue-100 text-blue-800">{stats.inProgress}</Badge>
            </div>
            <p className="text-sm text-gray-600">In Progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <Badge className="bg-red-100 text-red-800">{stats.delayed}</Badge>
            </div>
            <p className="text-sm text-gray-600">Delayed</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Flag className="w-5 h-5 text-purple-600" />
              <Badge className="bg-purple-100 text-purple-800">{stats.milestones}</Badge>
            </div>
            <p className="text-sm text-gray-600">Milestones</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 text-orange-600" />
              <Badge className="bg-orange-100 text-orange-800">{stats.criticalPath}</Badge>
            </div>
            <p className="text-sm text-gray-600">Critical Path</p>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* View Mode */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">View Mode</label>
              <Select value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="days">Daily View</SelectItem>
                  <SelectItem value="weeks">Weekly View</SelectItem>
                  <SelectItem value="months">Monthly View</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Group By */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Group By</label>
              <Select value={groupBy} onValueChange={(value) => setGroupBy(value as GroupBy)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Grouping</SelectItem>
                  <SelectItem value="phase">Project Phase</SelectItem>
                  <SelectItem value="status">Task Status</SelectItem>
                  <SelectItem value="priority">Priority Level</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filter Status */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Status Filter</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="not-started">Not Started</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="delayed">Delayed</SelectItem>
                  <SelectItem value="on-hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filter Phase */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Phase Filter</label>
              <Select value={filterPhase} onValueChange={setFilterPhase}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Phases</SelectItem>
                  {projectPhases.map(phase => (
                    <SelectItem key={phase.id} value={phase.id}>
                      {phase.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Toggle Options */}
          <div className="flex flex-wrap gap-4 mt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showCriticalPath}
                onChange={(e) => setShowCriticalPath(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Show Critical Path</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showMilestones}
                onChange={(e) => setShowMilestones(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Show Milestones</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Gantt Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5" />
              Timeline View
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm">
                Today
              </Button>
              <Button variant="outline" size="sm">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-[1200px]">
              {/* Timeline Header */}
              <div className="grid grid-cols-12 gap-0 border-b-2 border-gray-300 bg-gray-50">
                <div className="col-span-3 p-4 border-r-2 border-gray-300">
                  <p className="font-semibold text-gray-900">Task Name</p>
                </div>
                <div className="col-span-9 relative">
                  <div className="flex h-full">
                    {timelineColumns.map((date, index) => (
                      <div
                        key={index}
                        className="flex-1 p-2 border-r border-gray-200 text-center"
                        style={{ minWidth: '60px' }}
                      >
                        <p className="text-xs font-medium text-gray-700">
                          {formatDate(date)}
                        </p>
                      </div>
                    ))}
                  </div>
                  {/* Current Date Indicator */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                    style={{
                      left: `${((currentDate.getTime() - timelineBounds.start.getTime()) / 
                        (timelineBounds.end.getTime() - timelineBounds.start.getTime())) * 100}%`
                    }}
                  >
                    <div className="absolute -top-1 -left-2 w-4 h-4 bg-red-500 rounded-full border-2 border-white" />
                  </div>
                </div>
              </div>

              {/* Tasks */}
              {groupedTasks.map((group, _groupIndex) => (
                <div key={group.id}>
                  {/* Group Header (for phase grouping) */}
                  {groupBy === 'phase' && 'color' in group && (
                    <div 
                      className="grid grid-cols-12 gap-0 border-b border-gray-200 bg-gray-50 cursor-pointer hover:bg-gray-100"
                      onClick={() => togglePhase(group.id)}
                    >
                      <div className="col-span-3 p-3 border-r border-gray-200 flex items-center gap-2">
                        {expandedPhases.has(group.id) ? (
                          <ChevronDown className="w-4 h-4 text-gray-600" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-600" />
                        )}
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: group.color }}
                        />
                        <span className="font-semibold text-gray-900">{group.name}</span>
                        <Badge variant="secondary" className="ml-2">
                          {group.tasks.length}
                        </Badge>
                      </div>
                      <div className="col-span-9 p-3">
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <Progress value={group.progress} className="h-2" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">{group.progress}%</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tasks in Group */}
                  {(!groupBy || groupBy === 'none' || groupBy !== 'phase' || expandedPhases.has(group.id)) && 
                    group.tasks.map((task, _taskIndex) => (
                      <div
                        key={task.id}
                        className="grid grid-cols-12 gap-0 border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedTask(task)}
                      >
                        {/* Task Info */}
                        <div className="col-span-3 p-3 border-r border-gray-200">
                          <div className="flex items-center gap-2">
                            {task.isMilestone && (
                              <Flag className="w-4 h-4 text-purple-600 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {task.name}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className={`${getStatusBadge(task.status)} text-xs`}>
                                  {task.status}
                                </Badge>
                                {task.isCriticalPath && (
                                  <Badge className="bg-orange-100 text-orange-800 text-xs">
                                    Critical
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Timeline Bar */}
                        <div className="col-span-9 p-3 relative">
                          <div className="relative h-8">
                            <div
                              className={`absolute h-full rounded ${
                                task.isMilestone 
                                  ? 'w-2 h-2 top-3 transform rotate-45' 
                                  : ''
                              } ${
                                task.isCriticalPath 
                                  ? 'bg-orange-500 border-2 border-orange-700' 
                                  : getStatusColor(task.status)
                              } transition-all hover:shadow-lg`}
                              style={task.isMilestone ? {
                                left: getTaskPosition(task).left,
                                width: '12px',
                                height: '12px'
                              } : getTaskPosition(task)}
                            >
                              {!task.isMilestone && (
                                <div className="h-full flex items-center px-2">
                                  <div className="flex-1 bg-white/30 rounded-full h-1.5">
                                    <div
                                      className="bg-white rounded-full h-full"
                                      style={{ width: `${task.progress}%` }}
                                    />
                                  </div>
                                  <span className="ml-2 text-xs font-medium text-white">
                                    {task.progress}%
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  }
                </div>
              ))}

              {filteredTasks.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>No tasks match the current filters</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-3 bg-green-500 rounded" />
              <span className="text-sm text-gray-700">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-3 bg-blue-500 rounded" />
              <span className="text-sm text-gray-700">In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-3 bg-gray-400 rounded" />
              <span className="text-sm text-gray-700">Not Started</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-3 bg-orange-500 rounded border-2 border-orange-700" />
              <span className="text-sm text-gray-700">Critical Path</span>
            </div>
            <div className="flex items-center gap-2">
              <Flag className="w-5 h-5 text-purple-600" />
              <span className="text-sm text-gray-700">Milestone</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task Details Dialog */}
      {selectedTask && (
        <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedTask.isMilestone && <Flag className="w-5 h-5 text-purple-600" />}
                {selectedTask.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Status and Progress */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-2">Status</p>
                  <Badge className={getStatusBadge(selectedTask.status)}>
                    {selectedTask.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-2">Priority</p>
                  <Badge className={`${getPriorityColor(selectedTask.priority)} bg-opacity-10`}>
                    {selectedTask.priority}
                  </Badge>
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-500">Progress</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedTask.progress}%</p>
                </div>
                <Progress value={selectedTask.progress} className="h-3" />
              </div>

              {/* Timeline */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Start Date</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(selectedTask.startDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">End Date</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(selectedTask.endDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Duration</p>
                  <p className="text-sm font-medium text-gray-900">{selectedTask.duration} days</p>
                </div>
              </div>

              {/* Resources */}
              <div>
                <p className="text-sm text-gray-500 mb-2">Assigned Team</p>
                <div className="flex flex-wrap gap-2">
                  {selectedTask.assignedTo.map((person, index) => (
                    <Badge key={index} variant="secondary">
                      <Users className="w-3 h-3 mr-1" />
                      {person}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Equipment & Cost */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-2">Equipment</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedTask.resources.equipment.map((item, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-2">Budget</p>
                  <p className="text-lg font-bold text-gray-900">
                    ${selectedTask.cost.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Dependencies */}
              {selectedTask.dependencies.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Dependencies</p>
                  <div className="space-y-2">
                    {selectedTask.dependencies.map(depId => {
                      const depTask = scheduleTasks.find(t => t.id === depId);
                      return depTask ? (
                        <div key={depId} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          <CheckCircle className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700">{depTask.name}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* Special Flags */}
              <div className="flex gap-4">
                {selectedTask.isCriticalPath && (
                  <Badge className="bg-orange-100 text-orange-800">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Critical Path
                  </Badge>
                )}
                {selectedTask.isMilestone && (
                  <Badge className="bg-purple-100 text-purple-800">
                    <Flag className="w-3 h-3 mr-1" />
                    Milestone
                  </Badge>
                )}
              </div>

              {/* Notes */}
              {selectedTask.notes && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Notes</p>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                    {selectedTask.notes}
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedTask(null)}>
                Close
              </Button>
              <Button>
                Edit Task
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
