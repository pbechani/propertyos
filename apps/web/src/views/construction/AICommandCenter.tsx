'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Sparkles, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { mockAIAgents, mockNotifications } from '@/views/construction/data/mockData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const agentActivityData = [
  { day: 'Mon', tasks: 142 },
  { day: 'Tue', tasks: 168 },
  { day: 'Wed', tasks: 195 },
  { day: 'Thu', tasks: 183 },
  { day: 'Fri', tasks: 210 },
  { day: 'Sat', tasks: 156 },
  { day: 'Sun', tasks: 124 },
];

export function AICommandCenter() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Command Center</h1>
          <p className="text-gray-500 mt-1">Interact with AI agents and view insights</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm text-gray-600">All systems operational</span>
        </div>
      </div>

      {/* AI Chat Interface */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <CardTitle>AI Assistant</CardTitle>
          </div>
          <CardDescription>Ask questions about your projects, budgets, risks, and more</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Sample Conversation */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-4 max-h-96 overflow-y-auto">
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                  AI
                </div>
                <div className="flex-1 bg-white rounded-lg p-3 shadow-sm">
                  <p className="text-sm">Hello! I'm your AI Project Manager. How can I help you today?</p>
                </div>
              </div>
              
              <div className="flex gap-3 flex-row-reverse">
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                  SJ
                </div>
                <div className="flex-1 bg-purple-50 rounded-lg p-3">
                  <p className="text-sm">Why is the Riverside Complex delayed?</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                  AI
                </div>
                <div className="flex-1 bg-white rounded-lg p-3 shadow-sm">
                  <p className="text-sm mb-2">Based on my analysis:</p>
                  <ul className="text-sm space-y-1 ml-4 list-disc">
                    <li>Roofing subcontractor is 4 days behind schedule</li>
                    <li>Material delivery delays (waterproofing membrane)</li>
                    <li>Weather caused 2-day delay last week</li>
                    <li>Estimated total delay: 6-7 days</li>
                  </ul>
                  <p className="text-sm mt-2">I recommend expediting material orders and adding weekend crew for catch-up.</p>
                </div>
              </div>
            </div>

            {/* Input */}
            <div className="flex gap-2">
              <Input placeholder="Ask AI anything about your projects..." className="flex-1" />
              <Button>
                <Send className="w-4 h-4" />
              </Button>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm">Generate Progress Report</Button>
              <Button variant="outline" size="sm">Budget Forecast</Button>
              <Button variant="outline" size="sm">Risk Analysis</Button>
              <Button variant="outline" size="sm">Schedule Optimization</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Agents Status */}
        <Card>
          <CardHeader>
            <CardTitle>AI Agent Workforce</CardTitle>
            <CardDescription>{mockAIAgents.length} specialized agents monitoring your projects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockAIAgents.map((agent) => (
                <div key={agent.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900">{agent.name}</h4>
                        <Badge variant={
                          agent.status === 'active' ? 'default' :
                          agent.status === 'processing' ? 'secondary' :
                          'outline'
                        }>
                          {agent.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">{agent.specialty}</p>
                    </div>
                    <Sparkles className={`w-5 h-5 ${
                      agent.status === 'active' ? 'text-green-600' :
                      agent.status === 'processing' ? 'text-blue-600' :
                      'text-gray-400'
                    }`} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Tasks Completed</p>
                      <p className="font-medium text-lg">{agent.tasksCompleted.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Accuracy</p>
                      <div className="flex items-center gap-2">
                        <Progress value={agent.accuracy} className="flex-1" />
                        <span className="font-medium">{agent.accuracy}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle>AI Activity This Week</CardTitle>
            <CardDescription>Total tasks processed by all agents</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={agentActivityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="tasks" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights & Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>AI-Generated Insights & Alerts</CardTitle>
          <CardDescription>Recent notifications from AI agents</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockNotifications.map((notification) => (
              <div key={notification.id} className={`flex items-start gap-3 p-4 border rounded-lg ${
                !notification.read ? 'bg-blue-50 border-blue-200' : 'border-gray-200'
              }`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  notification.type === 'error' ? 'bg-red-100' :
                  notification.type === 'warning' ? 'bg-orange-100' :
                  notification.type === 'success' ? 'bg-green-100' :
                  'bg-blue-100'
                }`}>
                  {notification.type === 'error' || notification.type === 'warning' ? (
                    <AlertCircle className={`w-5 h-5 ${
                      notification.type === 'error' ? 'text-red-600' : 'text-orange-600'
                    }`} />
                  ) : (
                    <CheckCircle2 className={`w-5 h-5 ${
                      notification.type === 'success' ? 'text-green-600' : 'text-blue-600'
                    }`} />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="font-medium text-gray-900">{notification.title}</h4>
                    <Badge variant={notification.priority === 'high' ? 'destructive' : 'outline'} className="text-xs">
                      {notification.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Source: {notification.source}</span>
                    <span>{new Date(notification.timestamp).toLocaleString()}</span>
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
