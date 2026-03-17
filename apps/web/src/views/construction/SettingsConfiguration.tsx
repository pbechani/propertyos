'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Settings,
  Building2,
  Bell,
  Shield,
  Palette,
  Globe,
  Database,
  Zap,
  Save,
  Upload,
  Key,
  Mail,
  Smartphone,
  Monitor,
  Moon,
  Sun,
  Clock,
  DollarSign,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Link2,
  Plug,
  RefreshCw
} from 'lucide-react';

export function SettingsConfiguration() {
  const [activeTab, setActiveTab] = useState('company');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // Company settings state
  const [companyName, setCompanyName] = useState('ConstructAI Corp');
  const [companyEmail, setCompanyEmail] = useState('admin@constructai.com');
  const [companyPhone, setCompanyPhone] = useState('+1 (212) 555-0100');
  const [companyAddress, setCompanyAddress] = useState('350 5th Avenue, Suite 4200, New York, NY 10118');
  const [timezone, setTimezone] = useState('America/New_York');
  const [currency, setCurrency] = useState('USD');
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY');

  // Notification settings
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [smsNotifs, setSmsNotifs] = useState(false);
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [scheduleAlerts, setScheduleAlerts] = useState(true);
  const [safetyAlerts, setSafetyAlerts] = useState(true);
  const [dailyDigest, setDailyDigest] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);
  const [aiInsights, setAiInsights] = useState(true);

  // Project defaults
  const [defaultBudgetThreshold, setDefaultBudgetThreshold] = useState('5');
  const [defaultScheduleBuffer, setDefaultScheduleBuffer] = useState('10');
  const [autoAssignTasks, setAutoAssignTasks] = useState(true);
  const [requireApproval, setRequireApproval] = useState(true);
  const [photoRequired, setPhotoRequired] = useState(true);

  // Theme
  const [theme, setTheme] = useState('light');

  const integrations = [
    { name: 'Procore', status: 'connected', icon: '🏗️', desc: 'Construction management sync' },
    { name: 'QuickBooks', status: 'connected', icon: '💰', desc: 'Financial data integration' },
    { name: 'Autodesk BIM 360', status: 'disconnected', icon: '📐', desc: 'BIM model sync' },
    { name: 'Microsoft Teams', status: 'connected', icon: '💬', desc: 'Team communications' },
    { name: 'Slack', status: 'disconnected', icon: '📱', desc: 'Notifications & alerts' },
    { name: 'Google Workspace', status: 'connected', icon: '📧', desc: 'Email & calendar sync' },
    { name: 'Dropbox', status: 'disconnected', icon: '📁', desc: 'Document storage' },
    { name: 'Weather API', status: 'connected', icon: '🌤️', desc: 'Real-time weather data' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            Settings & Configuration
          </h1>
          <p className="text-gray-500 mt-1">Manage your platform settings and preferences</p>
        </div>
        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
          {saved ? <><CheckCircle2 className="w-4 h-4 mr-1" /> Saved!</> : <><Save className="w-4 h-4 mr-1" /> Save Changes</>}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="company"><Building2 className="w-4 h-4 mr-1" /> Company</TabsTrigger>
          <TabsTrigger value="projects"><FileText className="w-4 h-4 mr-1" /> Project Defaults</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="w-4 h-4 mr-1" /> Notifications</TabsTrigger>
          <TabsTrigger value="integrations"><Plug className="w-4 h-4 mr-1" /> Integrations</TabsTrigger>
          <TabsTrigger value="security"><Shield className="w-4 h-4 mr-1" /> Security</TabsTrigger>
          <TabsTrigger value="appearance"><Palette className="w-4 h-4 mr-1" /> Appearance</TabsTrigger>
        </TabsList>

        {/* Company Settings */}
        <TabsContent value="company" className="mt-6 space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Company Information</CardTitle>
              <CardDescription>Basic information about your organization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-6 mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg">
                  CA
                </div>
                <div>
                  <Button variant="outline" size="sm"><Upload className="w-4 h-4 mr-1" /> Upload Logo</Button>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input value={companyName} onChange={e => setCompanyName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input value={companyEmail} onChange={e => setCompanyEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input value={companyPhone} onChange={e => setCompanyPhone(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Industry</Label>
                  <Select defaultValue="construction">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="construction">Construction</SelectItem>
                      <SelectItem value="real-estate">Real Estate Development</SelectItem>
                      <SelectItem value="engineering">Engineering</SelectItem>
                      <SelectItem value="architecture">Architecture</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Textarea value={companyAddress} onChange={e => setCompanyAddress(e.target.value)} rows={2} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Regional Settings</CardTitle>
              <CardDescription>Timezone, currency, and format preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label><Clock className="w-3 h-3 inline mr-1" />Timezone</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern (ET)</SelectItem>
                      <SelectItem value="America/Chicago">Central (CT)</SelectItem>
                      <SelectItem value="America/Denver">Mountain (MT)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific (PT)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label><DollarSign className="w-3 h-3 inline mr-1" />Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="CAD">CAD (C$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label><Globe className="w-3 h-3 inline mr-1" />Date Format</Label>
                  <Select value={dateFormat} onValueChange={setDateFormat}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Project Defaults */}
        <TabsContent value="projects" className="mt-6 space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Budget & Financial Defaults</CardTitle>
              <CardDescription>Default thresholds and rules for new projects</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Budget Variance Alert Threshold (%)</Label>
                  <Input type="number" value={defaultBudgetThreshold} onChange={e => setDefaultBudgetThreshold(e.target.value)} />
                  <p className="text-xs text-gray-500">Alert when budget variance exceeds this percentage</p>
                </div>
                <div className="space-y-2">
                  <Label>Schedule Buffer Days (%)</Label>
                  <Input type="number" value={defaultScheduleBuffer} onChange={e => setDefaultScheduleBuffer(e.target.value)} />
                  <p className="text-xs text-gray-500">Default buffer added to schedule estimates</p>
                </div>
              </div>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Require Change Order Approval</Label>
                    <p className="text-xs text-gray-500">All change orders must be approved before implementation</p>
                  </div>
                  <Switch checked={requireApproval} onCheckedChange={setRequireApproval} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-assign Tasks to AI</Label>
                    <p className="text-xs text-gray-500">Let AI agents suggest task assignments based on contractor skills</p>
                  </div>
                  <Switch checked={autoAssignTasks} onCheckedChange={setAutoAssignTasks} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Require Daily Site Photos</Label>
                    <p className="text-xs text-gray-500">Site logs cannot be submitted without photo documentation</p>
                  </div>
                  <Switch checked={photoRequired} onCheckedChange={setPhotoRequired} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Default Project Phases</CardTitle>
              <CardDescription>Standard phases applied to new projects</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {['Pre-Construction & Planning', 'Site Preparation & Foundation', 'Structural Work', 'MEP Rough-In', 'Exterior Envelope', 'Interior Finishes', 'MEP Final & Testing', 'Landscaping & Site Work', 'Commissioning & Handover'].map((phase, i) => (
                  <div key={phase} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs">{i + 1}</span>
                    <span className="text-sm text-gray-700">{phase}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="mt-6 space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Notification Channels</CardTitle>
              <CardDescription>Choose how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: 'Email Notifications', desc: 'Receive notifications via email', icon: Mail, checked: emailNotifs, onChange: setEmailNotifs },
                { label: 'Push Notifications', desc: 'Browser and mobile push alerts', icon: Monitor, checked: pushNotifs, onChange: setPushNotifs },
                { label: 'SMS Notifications', desc: 'Critical alerts via text message', icon: Smartphone, checked: smsNotifs, onChange: setSmsNotifs },
              ].map(ch => (
                <div key={ch.label} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <ch.icon className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <Label>{ch.label}</Label>
                      <p className="text-xs text-gray-500">{ch.desc}</p>
                    </div>
                  </div>
                  <Switch checked={ch.checked} onCheckedChange={ch.onChange} />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Alert Categories</CardTitle>
              <CardDescription>Configure which types of alerts you receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: 'Budget Alerts', desc: 'Overruns, variance warnings, payment due', icon: DollarSign, color: 'text-green-600', checked: budgetAlerts, onChange: setBudgetAlerts },
                { label: 'Schedule Alerts', desc: 'Delays, milestone reminders, deadline warnings', icon: Clock, color: 'text-blue-600', checked: scheduleAlerts, onChange: setScheduleAlerts },
                { label: 'Safety Alerts', desc: 'Incidents, inspection overdue, compliance issues', icon: AlertTriangle, color: 'text-red-600', checked: safetyAlerts, onChange: setSafetyAlerts },
                { label: 'AI Insights', desc: 'AI-generated predictions, recommendations, optimizations', icon: Zap, color: 'text-purple-600', checked: aiInsights, onChange: setAiInsights },
                { label: 'Daily Digest', desc: 'Summary of all activity sent each morning', icon: Mail, color: 'text-amber-600', checked: dailyDigest, onChange: setDailyDigest },
                { label: 'Weekly Report', desc: 'Comprehensive weekly performance report', icon: FileText, color: 'text-indigo-600', checked: weeklyReport, onChange: setWeeklyReport },
              ].map(alert => (
                <div key={alert.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <alert.icon className={`w-5 h-5 ${alert.color}`} />
                    <div>
                      <Label>{alert.label}</Label>
                      <p className="text-xs text-gray-500">{alert.desc}</p>
                    </div>
                  </div>
                  <Switch checked={alert.checked} onCheckedChange={alert.onChange} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations */}
        <TabsContent value="integrations" className="mt-6 space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Connected Services</CardTitle>
              <CardDescription>Manage third-party integrations and data syncs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {integrations.map(int => (
                  <div key={int.name} className="flex items-center justify-between p-4 rounded-xl border hover:shadow-sm transition-shadow">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-2xl">{int.icon}</div>
                      <div>
                        <p className="text-sm text-gray-900">{int.name}</p>
                        <p className="text-xs text-gray-500">{int.desc}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {int.status === 'connected' ? (
                        <>
                          <Badge className="bg-green-100 text-green-700 text-xs">Connected</Badge>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><RefreshCw className="w-3 h-3" /></Button>
                        </>
                      ) : (
                        <Button variant="outline" size="sm"><Link2 className="w-3 h-3 mr-1" /> Connect</Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">API Configuration</CardTitle>
              <CardDescription>Manage API keys and webhook endpoints</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>API Key</Label>
                <div className="flex gap-2">
                  <Input value="cai_sk_****************************a3f7" readOnly className="font-mono text-sm" />
                  <Button variant="outline"><Key className="w-4 h-4 mr-1" /> Regenerate</Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Webhook URL</Label>
                <Input placeholder="https://your-server.com/webhook" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security" className="mt-6 space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Authentication</CardTitle>
              <CardDescription>Security and access control settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-xs text-gray-500">Require 2FA for all admin accounts</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <Label>Single Sign-On (SSO)</Label>
                  <p className="text-xs text-gray-500">Enable SAML-based SSO for enterprise login</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <Label>Session Timeout</Label>
                  <p className="text-xs text-gray-500">Auto-logout after period of inactivity</p>
                </div>
                <Select defaultValue="60">
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                    <SelectItem value="480">8 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <Label>Password Policy</Label>
                  <p className="text-xs text-gray-500">Minimum requirements for user passwords</p>
                </div>
                <Select defaultValue="strong">
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic (8+ chars)</SelectItem>
                    <SelectItem value="strong">Strong (12+ mixed)</SelectItem>
                    <SelectItem value="enterprise">Enterprise (16+ mixed + special)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Data & Privacy</CardTitle>
              <CardDescription>Data retention and backup settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <Label><Database className="w-3 h-3 inline mr-1" /> Automatic Backups</Label>
                  <p className="text-xs text-gray-500">Daily encrypted backups to secure cloud storage</p>
                </div>
                <Badge className="bg-green-100 text-green-700">Active</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <Label>Data Retention Period</Label>
                  <p className="text-xs text-gray-500">How long to keep historical project data</p>
                </div>
                <Select defaultValue="7">
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 year</SelectItem>
                    <SelectItem value="3">3 years</SelectItem>
                    <SelectItem value="7">7 years</SelectItem>
                    <SelectItem value="forever">Indefinitely</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <Label>Audit Logging</Label>
                  <p className="text-xs text-gray-500">Track all user actions for compliance</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance */}
        <TabsContent value="appearance" className="mt-6 space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Theme</CardTitle>
              <CardDescription>Customize the look and feel of your platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { value: 'light', label: 'Light', icon: Sun, desc: 'Clean and bright' },
                  { value: 'dark', label: 'Dark', icon: Moon, desc: 'Easy on the eyes' },
                  { value: 'system', label: 'System', icon: Monitor, desc: 'Match device' },
                ].map(t => (
                  <button
                    key={t.value}
                    onClick={() => setTheme(t.value)}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      theme === t.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <t.icon className={`w-8 h-8 mx-auto mb-2 ${theme === t.value ? 'text-blue-600' : 'text-gray-400'}`} />
                    <p className="text-sm text-gray-900">{t.label}</p>
                    <p className="text-xs text-gray-500">{t.desc}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Dashboard Layout</CardTitle>
              <CardDescription>Configure your default dashboard view</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Default Landing Page</Label>
                <Select defaultValue="dashboard">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dashboard">Main Dashboard</SelectItem>
                    <SelectItem value="advanced">Advanced Dashboard</SelectItem>
                    <SelectItem value="executive">Executive Summary</SelectItem>
                    <SelectItem value="projects">Projects List</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Compact Sidebar</Label>
                  <p className="text-xs text-gray-500">Show only icons in the navigation sidebar</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Show AI Insights on Dashboard</Label>
                  <p className="text-xs text-gray-500">Display AI agent recommendations on main dashboard</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
