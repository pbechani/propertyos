'use client';

import { useState } from 'react';
import { useParams, useNavigate } from '@/lib/router-compat';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Calendar,
  User,
  Paperclip,
  Download,
  Upload,
  MessageSquare,
  Edit,
  CheckCircle2,
  Circle,
  TrendingUp,
  FileText,
  Image,
  FileSpreadsheet,
  File,
  Send,
  ThumbsUp,
  MoreVertical,
  Flag,
  Users,
  Target
} from 'lucide-react';
import { mockTasks, mockProjects, mockTaskComments, mockActivityLog, mockTaskTimeline } from '@/views/construction/data/mockData';

export function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [newComment, setNewComment] = useState('');

  const task = mockTasks.find(t => t.id === id);
  const project = task ? mockProjects.find(p => p.id === task.projectId) : null;
  const comments = mockTaskComments.filter(c => c.taskId === id);
  const activities = mockActivityLog.filter(a => a.taskId === id);
  const timeline = mockTaskTimeline.filter(t => t.taskId === id);

  if (!task || !project) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Task not found</h2>
          <Button onClick={() => navigate('/construction/tasks')}>Back to Tasks</Button>
        </div>
      </div>
    );
  }

  const getFileIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return <FileText className="w-8 h-8 text-red-600" />;
      case 'image':
      case 'jpg':
      case 'png':
        return <Image className="w-8 h-8 text-blue-600" />;
      case 'excel':
      case 'xlsx':
        return <FileSpreadsheet className="w-8 h-8 text-green-600" />;
      case 'word':
      case 'docx':
        return <FileText className="w-8 h-8 text-blue-700" />;
      default:
        return <File className="w-8 h-8 text-gray-600" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'in-progress':
        return <Circle className="w-5 h-5 text-blue-600 fill-blue-600" />;
      case 'upcoming':
        return <Circle className="w-5 h-5 text-gray-400" />;
      default:
        return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'status_change':
        return <TrendingUp className="w-4 h-4 text-blue-600" />;
      case 'progress_update':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'attachment_added':
        return <Paperclip className="w-4 h-4 text-purple-600" />;
      case 'assignee_changed':
        return <User className="w-4 h-4 text-orange-600" />;
      case 'comment_added':
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'priority_changed':
        return <Flag className="w-4 h-4 text-red-600" />;
      case 'due_date_changed':
        return <Calendar className="w-4 h-4 text-indigo-600" />;
      default:
        return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <Button variant="ghost" onClick={() => navigate('/construction/tasks')} className="pl-0">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tasks
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{task.title}</h1>
              <Badge
                variant={
                  task.priority === 'critical' ? 'destructive' :
                  task.priority === 'high' ? 'destructive' :
                  task.priority === 'medium' ? 'secondary' :
                  'outline'
                }
              >
                {task.priority}
              </Badge>
              <Badge variant={
                task.status === 'completed' ? 'default' :
                task.status === 'in-progress' ? 'secondary' :
                task.status === 'blocked' ? 'destructive' :
                'outline'
              }>
                {task.status}
              </Badge>
            </div>
            <p className="text-gray-500">
              {project.name} • {task.phase}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Edit className="w-4 h-4 mr-2" />
            Edit Task
          </Button>
          <Button variant="outline">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Task Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Task Description
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 leading-relaxed">{task.description}</p>
              
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Start Date</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-900">
                        {new Date(task.startDate).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Due Date</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-900">
                        {new Date(task.dueDate).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Progress</span>
                    <span className="text-lg font-bold text-gray-900">{task.progress}%</span>
                  </div>
                  <Progress value={task.progress} className="h-3" />
                </div>
              </div>

              {task.dependencies && task.dependencies.length > 0 && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-gray-900 mb-2">Dependencies</p>
                  <div className="flex flex-wrap gap-2">
                    {task.dependencies.map(depId => {
                      const depTask = mockTasks.find(t => t.id === depId);
                      return depTask ? (
                        <Badge key={depId} variant="outline" className="cursor-pointer hover:bg-gray-100">
                          <Target className="w-3 h-3 mr-1" />
                          {depTask.title}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attachments */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Paperclip className="w-5 h-5 text-blue-600" />
                  Attachments
                  {task.attachments && task.attachments.length > 0 && (
                    <Badge variant="secondary">{task.attachments.length}</Badge>
                  )}
                </CardTitle>
                <Button variant="outline" size="sm">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {task.attachments && task.attachments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {task.attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer group"
                    >
                      <div className="flex-shrink-0">
                        {getFileIcon(attachment.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate text-sm">
                          {attachment.name}
                        </p>
                        <p className="text-xs text-gray-500">{attachment.size}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Paperclip className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No attachments yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Comments Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                Comments
                <Badge variant="secondary">{comments.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* New Comment Input */}
              <div className="space-y-3">
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[100px]"
                />
                <div className="flex justify-end">
                  <Button>
                    <Send className="w-4 h-4 mr-2" />
                    Post Comment
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Existing Comments */}
              <div className="space-y-6">
                {comments.map((comment) => (
                  <div key={comment.id} className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-blue-100 text-blue-700">
                          {comment.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-gray-900">{comment.author}</span>
                            <Badge variant="outline" className="text-xs">
                              {comment.authorRole}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {formatTimestamp(comment.timestamp)}
                            </span>
                          </div>
                          <p className="text-gray-700 leading-relaxed">{comment.content}</p>
                        </div>
                        <div className="flex items-center gap-4 mt-2 ml-4">
                          <button className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600">
                            <ThumbsUp className="w-3 h-3" />
                            <span>{comment.likes}</span>
                          </button>
                          <button className="text-sm text-gray-600 hover:text-blue-600">
                            Reply
                          </button>
                        </div>

                        {/* Replies */}
                        {comment.replies && comment.replies.length > 0 && (
                          <div className="ml-8 mt-4 space-y-3">
                            {comment.replies.map((reply) => (
                              <div key={reply.id} className="flex items-start gap-3">
                                <Avatar className="w-8 h-8">
                                  <AvatarFallback className="bg-gray-100 text-gray-700 text-xs">
                                    {reply.avatar}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-medium text-sm text-gray-900">{reply.author}</span>
                                      <Badge variant="outline" className="text-xs">
                                        {reply.authorRole}
                                      </Badge>
                                      <span className="text-xs text-gray-500">
                                        {formatTimestamp(reply.timestamp)}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-700">{reply.content}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Assigned Users */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="w-5 h-5 text-blue-600" />
                Assigned Team
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-blue-600 text-white">
                      {task.assignee.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-gray-900">{task.assignee}</p>
                    <p className="text-xs text-gray-500">Primary Assignee</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-purple-100 text-purple-700 text-xs">
                    SJ
                  </AvatarFallback>
                </Avatar>
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-green-100 text-green-700 text-xs">
                    MC
                  </AvatarFallback>
                </Avatar>
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-orange-100 text-orange-700 text-xs">
                    DK
                  </AvatarFallback>
                </Avatar>
                <button className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-blue-500 hover:text-blue-500">
                  <span className="text-lg">+</span>
                </button>
              </div>

              <Button variant="outline" className="w-full">
                <User className="w-4 h-4 mr-2" />
                Manage Team
              </Button>
            </CardContent>
          </Card>

          {/* Task Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Task Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Project</p>
                <p className="font-medium text-gray-900">{project.name}</p>
              </div>
              <Separator />
              <div>
                <p className="text-xs text-gray-500 mb-1">Phase</p>
                <Badge variant="outline">{task.phase}</Badge>
              </div>
              <Separator />
              <div>
                <p className="text-xs text-gray-500 mb-1">Created</p>
                <p className="text-sm text-gray-700">March 5, 2026</p>
              </div>
              <Separator />
              <div>
                <p className="text-xs text-gray-500 mb-1">Last Updated</p>
                <p className="text-sm text-gray-700">2 hours ago</p>
              </div>
            </CardContent>
          </Card>

          {/* Timeline & Activity Tabs */}
          <Card>
            <Tabs defaultValue="timeline" className="w-full">
              <CardHeader className="pb-3">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent>
                <TabsContent value="timeline" className="mt-0">
                  <div className="space-y-4">
                    {timeline.map((item, index) => (
                      <div key={item.id} className="relative">
                        {index !== timeline.length - 1 && (
                          <div className="absolute left-2.5 top-8 bottom-0 w-0.5 bg-gray-200" />
                        )}
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {getStatusIcon(item.status)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-gray-900">{item.milestone}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge 
                                variant={
                                  item.status === 'completed' ? 'default' :
                                  item.status === 'in-progress' ? 'secondary' :
                                  'outline'
                                }
                                className="text-xs"
                              >
                                {item.status}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {new Date(item.date).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </span>
                            </div>
                            {item.completedBy && (
                              <p className="text-xs text-gray-600 mt-1">
                                by {item.completedBy}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="activity" className="mt-0">
                  <div className="space-y-4">
                    {activities.map((activity, index) => (
                      <div key={activity.id} className="relative">
                        {index !== activities.length - 1 && (
                          <div className="absolute left-2 top-6 bottom-0 w-0.5 bg-gray-200" />
                        )}
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            {getActivityIcon(activity.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-700">
                              <span className="font-medium text-gray-900">{activity.user}</span>
                              {' '}{activity.action}{' '}
                              {activity.from && (
                                <>
                                  <span className="font-medium">{activity.from}</span>
                                  {' to '}
                                </>
                              )}
                              {(activity.to || activity.value) && (
                                <span className="font-medium">{activity.to || activity.value}</span>
                              )}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {formatTimestamp(activity.timestamp)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
}
