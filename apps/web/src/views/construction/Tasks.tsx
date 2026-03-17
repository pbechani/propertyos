'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Plus, 
  Filter,
  Calendar,
  User,
  AlertCircle,
  CheckCircle2,
  Clock,
  Ban,
  Paperclip,
  FileText,
  Image,
  FileSpreadsheet,
  File,
  GripVertical
} from 'lucide-react';
import { mockTasks, mockProjects } from '@/views/construction/data/mockData';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useNavigate } from '@/lib/router-compat';
import type { Task } from '@/views/construction/types';

type TaskStatus = 'todo' | 'in-progress' | 'review' | 'completed' | 'blocked';

const ITEM_TYPE = 'TASK';

interface DragItem {
  id: string;
  status: TaskStatus;
}

export function Tasks() {
  const [tasks, setTasks] = useState(mockTasks);

  const moveTask = useCallback((taskId: string, newStatus: TaskStatus) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    );
  }, []);

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter(t => t.status === status);
  };

  const todoTasks = getTasksByStatus('todo');
  const inProgressTasks = getTasksByStatus('in-progress');
  const reviewTasks = getTasksByStatus('review');
  const completedTasks = getTasksByStatus('completed');
  const blockedTasks = getTasksByStatus('blocked');

  const getProjectName = (projectId: string) => {
    return mockProjects.find(p => p.id === projectId)?.name || 'Unknown Project';
  };

  const navigate = useNavigate();

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
            <p className="text-gray-500 mt-1">Manage and track all project tasks</p>
          </div>
          <Button
            onClick={() => navigate('/construction/tasks/new')}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Task
          </Button>
        </div>

        {/* Search & Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  placeholder="Search tasks..." 
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

        {/* Task Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-600">To Do</span>
              </div>
              <p className="text-2xl font-bold">{todoTasks.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-gray-600">In Progress</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{inProgressTasks.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-purple-600" />
                <span className="text-sm text-gray-600">Review</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">{reviewTasks.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-sm text-gray-600">Completed</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{completedTasks.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Ban className="w-4 h-4 text-red-600" />
                <span className="text-sm text-gray-600">Blocked</span>
              </div>
              <p className="text-2xl font-bold text-red-600">{blockedTasks.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Task Board */}
        <Tabs defaultValue="board" className="space-y-4">
          <TabsList>
            <TabsTrigger value="board">Board View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
          </TabsList>

          <TabsContent value="board">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {/* To Do Column */}
              <KanbanColumn
                title="To Do"
                status="todo"
                tasks={todoTasks}
                color="gray"
                moveTask={moveTask}
                getProjectName={getProjectName}
              />

              {/* In Progress Column */}
              <KanbanColumn
                title="In Progress"
                status="in-progress"
                tasks={inProgressTasks}
                color="blue"
                moveTask={moveTask}
                getProjectName={getProjectName}
              />

              {/* Review Column */}
              <KanbanColumn
                title="Review"
                status="review"
                tasks={reviewTasks}
                color="purple"
                moveTask={moveTask}
                getProjectName={getProjectName}
              />

              {/* Completed Column */}
              <KanbanColumn
                title="Completed"
                status="completed"
                tasks={completedTasks}
                color="green"
                moveTask={moveTask}
                getProjectName={getProjectName}
              />

              {/* Blocked Column */}
              <KanbanColumn
                title="Blocked"
                status="blocked"
                tasks={blockedTasks}
                color="red"
                moveTask={moveTask}
                getProjectName={getProjectName}
              />
            </div>
          </TabsContent>

          <TabsContent value="list">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attachments</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {tasks.map(task => (
                        <tr key={task.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{task.title}</div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">{task.description}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {getProjectName(task.projectId)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">{task.assignee}</td>
                          <td className="px-6 py-4">
                            <Badge variant={
                              task.status === 'completed' ? 'default' :
                              task.status === 'in-progress' ? 'secondary' :
                              task.status === 'blocked' ? 'destructive' :
                              'outline'
                            }>
                              {task.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant={
                              task.priority === 'critical' || task.priority === 'high' ? 'destructive' :
                              task.priority === 'medium' ? 'secondary' :
                              'outline'
                            }>
                              {task.priority}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            {task.attachments && task.attachments.length > 0 ? (
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Paperclip className="w-4 h-4" />
                                {task.attachments.length}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {new Date(task.dueDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Progress value={task.progress} className="w-20" />
                              <span className="text-sm text-gray-600">{task.progress}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DndProvider>
  );
}

// Kanban Column Component
interface KanbanColumnProps {
  title: string;
  status: TaskStatus;
  tasks: Task[];
  color: string;
  moveTask: (taskId: string, newStatus: TaskStatus) => void;
  getProjectName: (projectId: string) => string;
}

function KanbanColumn({ title, status, tasks, color, moveTask, getProjectName }: KanbanColumnProps) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ITEM_TYPE,
    drop: (item: DragItem) => {
      if (item.status !== status) {
        moveTask(item.id, status);
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  const colorClasses = {
    gray: { dot: 'bg-gray-400', bg: 'bg-gray-50', border: 'border-gray-300' },
    blue: { dot: 'bg-blue-600', bg: 'bg-blue-50', border: 'border-blue-300' },
    purple: { dot: 'bg-purple-600', bg: 'bg-purple-50', border: 'border-purple-300' },
    green: { dot: 'bg-green-600', bg: 'bg-green-50', border: 'border-green-300' },
    red: { dot: 'bg-red-600', bg: 'bg-red-50', border: 'border-red-300' },
  }[color] ?? { dot: 'bg-gray-400', bg: 'bg-gray-50', border: 'border-gray-300' };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-2 h-2 ${colorClasses.dot} rounded-full`} />
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <Badge variant="secondary">{tasks.length}</Badge>
      </div>
      <div
        ref={drop as unknown as React.LegacyRef<HTMLDivElement>}
        className={`space-y-3 min-h-[500px] p-3 rounded-lg transition-colors ${
          isOver ? `${colorClasses.bg} ${colorClasses.border} border-2 border-dashed` : 'bg-transparent'
        }`}
      >
        {tasks.map(task => (
          <DraggableTaskCard 
            key={task.id} 
            task={task} 
            getProjectName={getProjectName}
          />
        ))}
        {tasks.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
}

// Draggable Task Card Component
interface DraggableTaskCardProps {
  task: Task;
  getProjectName: (projectId: string) => string;
}

function DraggableTaskCard({ task, getProjectName }: DraggableTaskCardProps) {
  const [{ isDragging }, drag, dragPreview] = useDrag(() => ({
    type: ITEM_TYPE,
    item: { id: task.id, status: task.status },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const navigate = useNavigate();

  const getFileIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return <FileText className="w-3 h-3 text-red-600" />;
      case 'image':
      case 'jpg':
      case 'png':
        return <Image className="w-3 h-3 text-blue-600" />;
      case 'excel':
      case 'xlsx':
        return <FileSpreadsheet className="w-3 h-3 text-green-600" />;
      default:
        return <File className="w-3 h-3 text-gray-600" />;
    }
  };

  return (
    <div ref={dragPreview as unknown as React.LegacyRef<HTMLDivElement>} style={{ opacity: isDragging ? 0.5 : 1 }}>
      <Card 
        className="hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => navigate(`/construction/tasks/${task.id}`)}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            <div 
              ref={drag as unknown as React.LegacyRef<HTMLDivElement>} 
              className="cursor-grab active:cursor-grabbing mt-1"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="w-4 h-4 text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 mb-1 text-sm">{task.title}</h4>
                  <p className="text-xs text-gray-500 line-clamp-2">{task.description}</p>
                </div>
                <Badge
                  variant={
                    task.priority === 'critical' ? 'destructive' :
                    task.priority === 'high' ? 'destructive' :
                    task.priority === 'medium' ? 'secondary' :
                    'outline'
                  }
                  className="ml-2 text-xs"
                >
                  {task.priority}
                </Badge>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium">{task.progress}%</span>
                  </div>
                  <Progress value={task.progress} className="h-1.5" />
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <User className="w-3 h-3" />
                  <span className="truncate">{task.assignee}</span>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Calendar className="w-3 h-3" />
                  Due: {new Date(task.dueDate).toLocaleDateString()}
                </div>

                {task.attachments && task.attachments.length > 0 && (
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Paperclip className="w-3 h-3 text-gray-500" />
                      <span className="text-xs text-gray-600">
                        {task.attachments.length} Attachment{task.attachments.length > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {task.attachments.slice(0, 2).map((attachment) => (
                        <div 
                          key={attachment.id} 
                          className="flex items-center gap-2 p-1.5 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer"
                        >
                          {getFileIcon(attachment.type)}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-700 truncate">
                              {attachment.name}
                            </p>
                            <p className="text-xs text-gray-500">{attachment.size}</p>
                          </div>
                        </div>
                      ))}
                      {task.attachments.length > 2 && (
                        <div className="text-xs text-gray-500 pl-1">
                          +{task.attachments.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-500">{getProjectName(task.projectId)}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}