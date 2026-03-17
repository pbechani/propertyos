'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, BarChart3, Calendar, DollarSign, Users, Sparkles } from 'lucide-react';

const reportTemplates = [
  {
    id: 1,
    name: 'Executive Summary',
    description: 'High-level overview for stakeholders',
    icon: FileText,
    frequency: 'Monthly',
    lastGenerated: '2026-03-01',
    ai: true
  },
  {
    id: 2,
    name: 'Budget Performance Report',
    description: 'Detailed financial analysis and forecasts',
    icon: DollarSign,
    frequency: 'Weekly',
    lastGenerated: '2026-03-08',
    ai: true
  },
  {
    id: 3,
    name: 'Project Progress Report',
    description: 'Task completion and milestone tracking',
    icon: BarChart3,
    frequency: 'Weekly',
    lastGenerated: '2026-03-08',
    ai: false
  },
  {
    id: 4,
    name: 'Contractor Performance',
    description: 'Contractor ratings and compliance status',
    icon: Users,
    frequency: 'Monthly',
    lastGenerated: '2026-03-01',
    ai: true
  },
  {
    id: 5,
    name: 'Risk & Issue Summary',
    description: 'Active risks and mitigation strategies',
    icon: FileText,
    frequency: 'Bi-weekly',
    lastGenerated: '2026-03-05',
    ai: true
  },
  {
    id: 6,
    name: 'Schedule Analysis',
    description: 'Timeline adherence and critical path',
    icon: Calendar,
    frequency: 'Weekly',
    lastGenerated: '2026-03-08',
    ai: true
  }
];

export function Reports() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-500 mt-1">Generate insights and export reports</p>
        </div>
        <Button>
          <Sparkles className="w-4 h-4 mr-2" />
          Generate AI Report
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{reportTemplates.length}</p>
              <p className="text-sm text-gray-600 mt-1">Report Templates</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {reportTemplates.filter(r => r.ai).length}
              </p>
              <p className="text-sm text-gray-600 mt-1">AI-Powered Reports</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">156</p>
              <p className="text-sm text-gray-600 mt-1">Generated This Month</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Templates</CardTitle>
          <CardDescription>Pre-configured reports with AI-powered insights</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <template.icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="font-medium text-gray-900">{template.name}</h4>
                        {template.ai && (
                          <Badge variant="secondary" className="text-xs">
                            <Sparkles className="w-3 h-3 mr-1" />
                            AI
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{template.description}</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Frequency</span>
                      <Badge variant="outline">{template.frequency}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Last Generated</span>
                      <span className="font-medium">{new Date(template.lastGenerated).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button className="flex-1" size="sm">
                      <FileText className="w-3 h-3 mr-1" />
                      Generate
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
          <CardDescription>Previously generated reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: 'Weekly Progress Report - Week 11', date: '2026-03-08', type: 'Progress', size: '2.4 MB' },
              { name: 'Budget Performance - March 2026', date: '2026-03-08', type: 'Financial', size: '1.8 MB' },
              { name: 'AI Executive Summary - Q1 2026', date: '2026-03-01', type: 'Executive', size: '3.2 MB' },
              { name: 'Contractor Performance Review', date: '2026-03-01', type: 'Contractor', size: '2.1 MB' }
            ].map((report, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded flex items-center justify-center">
                    <FileText className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{report.name}</h4>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                      <span>{new Date(report.date).toLocaleDateString()}</span>
                      <span>•</span>
                      <Badge variant="outline" className="text-xs">{report.type}</Badge>
                      <span>•</span>
                      <span>{report.size}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
