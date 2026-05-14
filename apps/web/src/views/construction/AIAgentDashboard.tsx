'use client';

import { useState } from 'react';
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Sparkles,
  CalendarClock,
  TrendingUp,
  ShieldAlert,
  Ruler,
  FileCheck,
  Users,
  CheckCircle,
  Activity,
  Zap,
  AlertTriangle,
  Clock,
  Send,
  Settings,
  Play,
  BarChart3,
  MessageSquare,
  Download,
  Brain,
  Target,
  Lightbulb,
  ArrowRight,
  ChevronRight,
  Info
} from 'lucide-react';
import { aiAgents, agentStats, activeAnalyses, allInsights } from '@/views/construction/data/ai-agents';
import type { AIAgent, ChatMessage } from '@/views/construction/types';

const iconMap: Record<string, any> = {
  CalendarClock,
  TrendingUp,
  ShieldAlert,
  Ruler,
  FileCheck,
  Users,
  CheckCircle
};

export function AIAgentDashboard() {
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'agent',
      content: 'Hello! I\'m your AI assistant. I can help you optimize your construction project. What would you like to know?',
      timestamp: '2 minutes ago',
      agentName: 'AI Assistant'
    }
  ]);
  const [messageInput, setMessageInput] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  const filteredInsights = allInsights.filter(insight => {
    if (filterPriority !== 'all' && insight.priority !== filterPriority) return false;
    if (filterType !== 'all' && insight.type !== filterType) return false;
    return true;
  });

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageInput,
      timestamp: 'Just now'
    };

    setChatMessages([...chatMessages, userMessage]);
    setMessageInput('');

    // Simulate AI response
    setTimeout(() => {
      const agentResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        content: 'I\'ve analyzed your question. Based on current project data, I recommend reviewing the critical path tasks that are at risk of delay. Would you like me to generate a detailed report?',
        timestamp: 'Just now',
        agentName: selectedAgent?.name || 'AI Assistant'
      };
      setChatMessages(prev => [...prev, agentResponse]);
    }, 1000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'analyzing': return 'bg-blue-100 text-blue-800 animate-pulse';
      case 'idle': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'recommendation': return <Lightbulb className="w-4 h-4" />;
      case 'alert': return <AlertTriangle className="w-4 h-4" />;
      case 'optimization': return <Zap className="w-4 h-4" />;
      case 'prediction': return <TrendingUp className="w-4 h-4" />;
      case 'warning': return <ShieldAlert className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            AI Command Center
          </h1>
          <p className="text-gray-500 mt-1">7 Specialized AI Agents Working for Your Project</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setChatOpen(true)}>
            <MessageSquare className="w-4 h-4 mr-2" />
            Ask AI
          </Button>
          <Button>
            <Settings className="w-4 h-4 mr-2" />
            Configure
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Brain className="w-5 h-5 text-purple-600" />
              <Badge variant="secondary">{agentStats.totalAgents}</Badge>
            </div>
            <p className="text-sm text-gray-600">Total Agents</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-5 h-5 text-green-600" />
              <Badge className="bg-green-100 text-green-800">{agentStats.activeAgents}</Badge>
            </div>
            <p className="text-sm text-gray-600">Active Now</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Lightbulb className="w-5 h-5 text-yellow-600" />
              <Badge className="bg-yellow-100 text-yellow-800">{agentStats.totalInsights}</Badge>
            </div>
            <p className="text-sm text-gray-600">Insights</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <Badge className="bg-red-100 text-red-800">{agentStats.criticalInsights}</Badge>
            </div>
            <p className="text-sm text-gray-600">Critical</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <Badge variant="secondary">{agentStats.totalTasksCompleted}</Badge>
            </div>
            <p className="text-sm text-gray-600">Tasks Done</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-5 h-5 text-indigo-600" />
              <Badge className="bg-indigo-100 text-indigo-800">{agentStats.averageAccuracy}%</Badge>
            </div>
            <p className="text-sm text-gray-600">Avg Accuracy</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="w-5 h-5 text-cyan-600" />
              <Badge className="bg-cyan-100 text-cyan-800">{agentStats.activeAnalyses}</Badge>
            </div>
            <p className="text-sm text-gray-600">Analyzing</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="agents" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto">
          <TabsTrigger value="agents">AI Agents</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="analyses">Active Analyses</TabsTrigger>
        </TabsList>

        {/* AI Agents Tab */}
        <TabsContent value="agents" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {aiAgents.map((agent) => {
              const IconComponent = iconMap[agent.icon];
              return (
                <Card 
                  key={agent.id} 
                  className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-gray-300"
                  onClick={() => setSelectedAgent(agent)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-3">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${agent.color}20` }}
                      >
                        {IconComponent && <IconComponent className="w-6 h-6" style={{ color: agent.color }} />}
                      </div>
                      <Badge className={getStatusColor(agent.status)}>
                        {agent.status}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{agent.name}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{agent.description}</p>
                  </CardHeader>
                  <CardContent>
                    {/* Performance Metrics */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Accuracy</span>
                        <div className="flex items-center gap-2">
                          <Progress value={agent.accuracy} className="w-20 h-2" />
                          <span className="text-sm font-semibold text-gray-900">{agent.accuracy}%</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-gray-500">Tasks Completed</p>
                          <p className="text-lg font-bold text-gray-900">{agent.tasksCompleted}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Time Saved</p>
                          <p className="text-lg font-bold text-gray-900">{agent.timeSaved}</p>
                        </div>
                      </div>
                    </div>

                    {/* Insights Preview */}
                    {agent.insights.length > 0 && (
                      <div className="border-t pt-3">
                        <p className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-1">
                          <Lightbulb className="w-3 h-3" />
                          Latest Insights
                        </p>
                        <div className="space-y-2">
                          {agent.insights.slice(0, 2).map((insight) => (
                            <div 
                              key={insight.id}
                              className={`p-2 rounded-lg border text-xs ${getPriorityColor(insight.priority)}`}
                            >
                              <div className="flex items-start gap-2">
                                {getTypeIcon(insight.type)}
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{insight.title}</p>
                                  <p className="text-xs opacity-80 mt-0.5">{insight.impact}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 mt-4">
                      <Button 
                        size="sm" 
                        className="flex-1"
                        style={{ backgroundColor: agent.color }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAgent(agent);
                          setChatOpen(true);
                        }}
                      >
                        <MessageSquare className="w-3 h-3 mr-1" />
                        Chat
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAgent(agent);
                        }}
                      >
                        <ArrowRight className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Priority:</span>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant={filterPriority === 'all' ? 'default' : 'outline'}
                      onClick={() => setFilterPriority('all')}
                    >
                      All
                    </Button>
                    <Button 
                      size="sm" 
                      variant={filterPriority === 'critical' ? 'default' : 'outline'}
                      onClick={() => setFilterPriority('critical')}
                    >
                      Critical
                    </Button>
                    <Button 
                      size="sm" 
                      variant={filterPriority === 'high' ? 'default' : 'outline'}
                      onClick={() => setFilterPriority('high')}
                    >
                      High
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Type:</span>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant={filterType === 'all' ? 'default' : 'outline'}
                      onClick={() => setFilterType('all')}
                    >
                      All
                    </Button>
                    <Button 
                      size="sm" 
                      variant={filterType === 'alert' ? 'default' : 'outline'}
                      onClick={() => setFilterType('alert')}
                    >
                      Alerts
                    </Button>
                    <Button 
                      size="sm" 
                      variant={filterType === 'recommendation' ? 'default' : 'outline'}
                      onClick={() => setFilterType('recommendation')}
                    >
                      Recommendations
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Insights List */}
          <div className="space-y-4">
            {filteredInsights.map((insight) => {
              const agent = aiAgents.find(a => a.id === insight.agentId);
              const IconComponent = agent ? iconMap[agent.icon] : Sparkles;
              
              return (
                <Card key={insight.id} className="border-l-4" style={{ borderLeftColor: agent?.color || '#6b7280' }}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Agent Icon */}
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${agent?.color || '#6b7280'}20` }}
                      >
                        {IconComponent && <IconComponent className="w-5 h-5" style={{ color: agent?.color || '#6b7280' }} />}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={getPriorityColor(insight.priority)}>
                                {insight.priority}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {getTypeIcon(insight.type)}
                                <span className="ml-1">{insight.type}</span>
                              </Badge>
                              <span className="text-xs text-gray-500">{insight.timestamp}</span>
                            </div>
                            <h3 className="font-semibold text-gray-900">{insight.title}</h3>
                          </div>
                        </div>

                        <p className="text-sm text-gray-600 mb-3">{insight.description}</p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="w-4 h-4 text-green-600" />
                              <span className="text-sm font-medium text-gray-900">{insight.impact}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Target className="w-4 h-4 text-blue-600" />
                              <span className="text-sm text-gray-600">{insight.confidence}% confidence</span>
                            </div>
                            {agent && (
                              <Badge variant="secondary" className="text-xs">
                                {agent.name}
                              </Badge>
                            )}
                          </div>

                          {insight.actionable && insight.actions && (
                            <div className="flex gap-2">
                              {insight.actions.map((action, idx) => (
                                <Button key={idx} size="sm" variant={idx === 0 ? 'default' : 'outline'}>
                                  {action.label}
                                  <ChevronRight className="w-3 h-3 ml-1" />
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Active Analyses Tab */}
        <TabsContent value="analyses" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeAnalyses.map((analysis) => {
              const agent = aiAgents.find(a => a.id === analysis.agentId);
              const IconComponent = agent ? iconMap[agent.icon] : Sparkles;

              return (
                <Card key={analysis.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${agent?.color || '#6b7280'}20` }}
                      >
                        {IconComponent && <IconComponent className="w-6 h-6" style={{ color: agent?.color || '#6b7280' }} />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-900">{analysis.type}</h3>
                          <Badge className={
                            analysis.status === 'completed' ? 'bg-green-100 text-green-800' :
                            analysis.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                            analysis.status === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }>
                            {analysis.status}
                          </Badge>
                        </div>
                        
                        {agent && (
                          <p className="text-sm text-gray-600 mb-3">by {agent.name}</p>
                        )}

                        {analysis.status === 'in-progress' && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Progress</span>
                              <span className="font-semibold text-gray-900">{analysis.progress}%</span>
                            </div>
                            <Progress value={analysis.progress} className="h-2" />
                          </div>
                        )}

                        {analysis.status === 'completed' && analysis.result && (
                          <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                            <p className="text-xs font-medium text-gray-700">Results:</p>
                            {Object.entries(analysis.result).map(([key, value]) => (
                              <div key={key} className="flex justify-between text-sm">
                                <span className="text-gray-600">{key}:</span>
                                <span className="font-medium text-gray-900">{String(value)}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            Started {analysis.startedAt}
                          </div>
                          {analysis.status === 'completed' && (
                            <Button size="sm" variant="outline">
                              <Download className="w-3 h-3 mr-1" />
                              Export
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Start New Analysis */}
          <Card className="border-dashed border-2">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Play className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Start New Analysis</h3>
              <p className="text-sm text-gray-600 mb-4">
                Run custom analyses across your project data using AI agents
              </p>
              <Button>
                <Play className="w-4 h-4 mr-2" />
                Configure Analysis
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Agent Details Dialog */}
      {selectedAgent && !chatOpen && (
        <Dialog open={!!selectedAgent} onOpenChange={() => setSelectedAgent(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-4">
                <div 
                  className="w-16 h-16 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${selectedAgent.color}20` }}
                >
                  {iconMap[selectedAgent.icon] && 
                    React.createElement(iconMap[selectedAgent.icon], { 
                      className: "w-8 h-8", 
                      style: { color: selectedAgent.color } 
                    })
                  }
                </div>
                <div>
                  <DialogTitle className="text-2xl">{selectedAgent.name}</DialogTitle>
                  <DialogDescription>{selectedAgent.description}</DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-6">
              {/* Performance Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Accuracy</p>
                      <div className="flex items-end gap-2">
                        <p className="text-3xl font-bold text-gray-900">{selectedAgent.accuracy}%</p>
                        <TrendingUp className="w-5 h-5 text-green-600 mb-1" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Tasks Completed</p>
                      <p className="text-3xl font-bold text-gray-900">{selectedAgent.tasksCompleted}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Time Saved</p>
                      <p className="text-3xl font-bold text-gray-900">{selectedAgent.timeSaved}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Automation Rules</p>
                      <p className="text-3xl font-bold text-gray-900">{selectedAgent.automationRules}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Capabilities */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Capabilities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedAgent.capabilities.map((capability, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-gray-700">{capability}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Insights & Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedAgent.insights.map((insight) => (
                      <div key={insight.id} className={`p-4 rounded-lg border-2 ${getPriorityColor(insight.priority)}`}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(insight.type)}
                            <h4 className="font-semibold">{insight.title}</h4>
                          </div>
                          <Badge variant="outline" className="text-xs">{insight.confidence}% confidence</Badge>
                        </div>
                        <p className="text-sm mb-2">{insight.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{insight.impact}</span>
                          {insight.actions && (
                            <div className="flex gap-2">
                              {insight.actions.map((action, idx) => (
                                <Button key={idx} size="sm" variant={idx === 0 ? 'default' : 'outline'}>
                                  {action.label}
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setSelectedAgent(null)}>
                  Close
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline">
                    <Settings className="w-4 h-4 mr-2" />
                    Configure
                  </Button>
                  <Button 
                    style={{ backgroundColor: selectedAgent.color }}
                    onClick={() => {
                      setChatOpen(true);
                    }}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Chat with Agent
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* AI Chat Dialog */}
      {chatOpen && (
        <Dialog open={chatOpen} onOpenChange={setChatOpen}>
          <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div>
                  <DialogTitle>
                    {selectedAgent ? selectedAgent.name : 'AI Assistant'}
                  </DialogTitle>
                  <DialogDescription>
                    Ask questions and get AI-powered insights
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-gray-50 rounded-lg">
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-200 text-gray-900'
                    }`}
                  >
                    {message.role === 'agent' && message.agentName && (
                      <p className="text-xs font-semibold mb-1 opacity-70">{message.agentName}</p>
                    )}
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                      {message.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <div className="flex gap-2">
              <Input
                placeholder="Ask me anything about your project..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1"
              />
              <Button onClick={handleSendMessage}>
                <Send className="w-4 h-4" />
              </Button>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => {
                  setMessageInput('What are the critical risks in my project?');
                }}
              >
                Critical Risks
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => {
                  setMessageInput('How can I optimize my schedule?');
                }}
              >
                Schedule Optimization
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => {
                  setMessageInput('Show me budget predictions');
                }}
              >
                Budget Forecast
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}