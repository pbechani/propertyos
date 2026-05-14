// @ts-nocheck
"use client";
import { useState } from 'react';
import {
  User,
  Bell,
  Shield,
  Users,
  CreditCard,
  Palette,
  Globe,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Check,
  Save,
  Upload,
  Smartphone,
  MessageSquare,
  Calendar,
  Zap,
  Building,
  MapPin,
  Briefcase,
} from 'lucide-react';

export function SettingsView() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [leadAlerts, setLeadAlerts] = useState(true);
  const [openHouseReminders, setOpenHouseReminders] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(true);
  const [marketingUpdates, setMarketingUpdates] = useState(false);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [profileVisibility, setProfileVisibility] = useState(true);
  const [showEmail, setShowEmail] = useState(false);
  const [showPhone, setShowPhone] = useState(true);
  const [autoWorkflows, setAutoWorkflows] = useState(true);
  const [aiAssistant, setAiAssistant] = useState(true);

  return (
    <div className="space-y-6 max-w-4xl px-7">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-[#1A3C28]">Settings</h2>
        <p className="text-[rgba(26,60,40,0.55)]">Manage your account settings and preferences</p>
      </div>

      {/* Profile Settings */}
      <section className="bg-white rounded-xl border border-[rgba(26,60,40,0.1)]">
        <div className="p-6 border-b border-[rgba(26,60,40,0.1)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[rgba(26,60,40,0.06)] rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-[#1A3C28]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#1A3C28]">Profile Settings</h3>
              <p className="text-sm text-[rgba(26,60,40,0.55)]">Update your personal information</p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-6">
          {/* Profile Photo */}
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 bg-gradient-to-br from-[#1A3C28] to-[#2D5A40] rounded-full flex items-center justify-center text-white text-2xl font-semibold">
              SJ
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-[rgba(26,60,40,0.7)] mb-2">
                Profile Photo
              </label>
              <div className="flex items-center gap-3">
                <button className="px-4 py-2 border border-[rgba(26,60,40,0.15)] text-[rgba(26,60,40,0.7)] rounded-lg text-sm font-medium hover:bg-[rgba(26,60,40,0.03)] transition-colors flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Upload New Photo
                </button>
                <button className="px-4 py-2 text-[rgba(26,60,40,0.55)] text-sm font-medium hover:text-[#1A3C28] transition-colors">
                  Remove
                </button>
              </div>
              <p className="text-xs text-[rgba(26,60,40,0.45)] mt-2">JPG, PNG or GIF. Max size 2MB.</p>
            </div>
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[rgba(26,60,40,0.7)] mb-2">First Name</label>
              <input
                type="text"
                defaultValue="Sarah"
                className="w-full px-3 py-2 border border-[rgba(26,60,40,0.15)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3C28]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[rgba(26,60,40,0.7)] mb-2">Last Name</label>
              <input
                type="text"
                defaultValue="Johnson"
                className="w-full px-3 py-2 border border-[rgba(26,60,40,0.15)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3C28]"
              />
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <label className="block text-sm font-medium text-[rgba(26,60,40,0.7)] mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(26,60,40,0.35)]" />
              <input
                type="email"
                defaultValue="sarah.johnson@realestate.com"
                className="w-full pl-10 pr-3 py-2 border border-[rgba(26,60,40,0.15)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3C28]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[rgba(26,60,40,0.7)] mb-2">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(26,60,40,0.35)]" />
              <input
                type="tel"
                defaultValue="+1 (415) 555-0123"
                className="w-full pl-10 pr-3 py-2 border border-[rgba(26,60,40,0.15)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3C28]"
              />
            </div>
          </div>

          {/* Company Information */}
          <div>
            <label className="block text-sm font-medium text-[rgba(26,60,40,0.7)] mb-2">Company</label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(26,60,40,0.35)]" />
              <input
                type="text"
                defaultValue="Bay Area Real Estate"
                className="w-full pl-10 pr-3 py-2 border border-[rgba(26,60,40,0.15)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3C28]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[rgba(26,60,40,0.7)] mb-2">Title</label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(26,60,40,0.35)]" />
              <input
                type="text"
                defaultValue="Senior Real Estate Agent"
                className="w-full pl-10 pr-3 py-2 border border-[rgba(26,60,40,0.15)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3C28]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[rgba(26,60,40,0.7)] mb-2">Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(26,60,40,0.35)]" />
              <input
                type="text"
                defaultValue="San Francisco, CA"
                className="w-full pl-10 pr-3 py-2 border border-[rgba(26,60,40,0.15)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3C28]"
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-[rgba(26,60,40,0.7)] mb-2">Bio</label>
            <textarea
              rows={4}
              defaultValue="Experienced real estate agent specializing in luxury properties in the San Francisco Bay Area. Helping clients find their dream homes for over 10 years."
              className="w-full px-3 py-2 border border-[rgba(26,60,40,0.15)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3C28] resize-none"
            />
            <p className="text-xs text-[rgba(26,60,40,0.45)] mt-1">Brief description for your profile.</p>
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-end pt-4 border-t border-[rgba(26,60,40,0.1)]">
            <button className="px-6 py-2 bg-[#C4562A] text-white rounded-lg font-medium hover:bg-[#b34a23] transition-colors flex items-center gap-2">
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </div>
      </section>

      {/* Notification Settings */}
      <section className="bg-white rounded-xl border border-[rgba(26,60,40,0.1)]">
        <div className="p-6 border-b border-[rgba(26,60,40,0.1)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[rgba(196,86,42,0.08)] rounded-lg flex items-center justify-center">
              <Bell className="w-5 h-5 text-[#C4562A]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#1A3C28]">Notifications</h3>
              <p className="text-sm text-[rgba(26,60,40,0.55)]">Manage how you receive notifications</p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-5">
          {/* Email Notifications */}
          <SettingToggle
            label="Email Notifications"
            description="Receive notifications via email"
            icon={Mail}
            enabled={emailNotifications}
            onChange={setEmailNotifications}
          />

          {/* SMS Notifications */}
          <SettingToggle
            label="SMS Notifications"
            description="Receive text message notifications"
            icon={MessageSquare}
            enabled={smsNotifications}
            onChange={setSmsNotifications}
          />

          <div className="border-t border-[rgba(26,60,40,0.1)] pt-5">
            <h4 className="text-sm font-semibold text-[#1A3C28] mb-4">Notification Preferences</h4>
            <div className="space-y-4">
              <SettingToggle
                label="New Lead Alerts"
                description="Get notified when a new lead is created"
                enabled={leadAlerts}
                onChange={setLeadAlerts}
                small
              />
              <SettingToggle
                label="Open House Reminders"
                description="Reminders 24 hours before open houses"
                enabled={openHouseReminders}
                onChange={setOpenHouseReminders}
                small
              />
              <SettingToggle
                label="Weekly Reports"
                description="Receive weekly performance summaries"
                enabled={weeklyReports}
                onChange={setWeeklyReports}
                small
              />
              <SettingToggle
                label="Marketing Updates"
                description="Updates about marketing campaigns"
                enabled={marketingUpdates}
                onChange={setMarketingUpdates}
                small
              />
            </div>
          </div>
        </div>
      </section>

      {/* Security & Privacy */}
      <section className="bg-white rounded-xl border border-[rgba(26,60,40,0.1)]">
        <div className="p-6 border-b border-[rgba(26,60,40,0.1)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[rgba(0,232,122,0.08)] rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-[#00A854]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#1A3C28]">Security &amp; Privacy</h3>
              <p className="text-sm text-[rgba(26,60,40,0.55)]">Manage your security settings</p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-6">
          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-[rgba(26,60,40,0.7)] mb-2">
              Change Password
            </label>
            <div className="space-y-3">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(26,60,40,0.35)]" />
                <input
                  type="password"
                  placeholder="Current password"
                  className="w-full pl-10 pr-3 py-2 border border-[rgba(26,60,40,0.15)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3C28]"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(26,60,40,0.35)]" />
                <input
                  type="password"
                  placeholder="New password"
                  className="w-full pl-10 pr-3 py-2 border border-[rgba(26,60,40,0.15)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3C28]"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(26,60,40,0.35)]" />
                <input
                  type="password"
                  placeholder="Confirm new password"
                  className="w-full pl-10 pr-3 py-2 border border-[rgba(26,60,40,0.15)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3C28]"
                />
              </div>
              <button className="px-4 py-2 bg-[#1A3C28] text-white rounded-lg text-sm font-medium hover:bg-[#162f20] transition-colors">
                Update Password
              </button>
            </div>
          </div>

          <div className="border-t border-[rgba(26,60,40,0.1)] pt-5">
            <SettingToggle
              label="Two-Factor Authentication"
              description="Add an extra layer of security to your account"
              icon={Smartphone}
              enabled={twoFactorAuth}
              onChange={setTwoFactorAuth}
            />
          </div>

          <div className="border-t border-[rgba(26,60,40,0.1)] pt-5">
            <h4 className="text-sm font-semibold text-[#1A3C28] mb-4">Privacy Settings</h4>
            <div className="space-y-4">
              <SettingToggle
                label="Public Profile"
                description="Make your profile visible to other users"
                enabled={profileVisibility}
                onChange={setProfileVisibility}
                small
              />
              <SettingToggle
                label="Show Email Address"
                description="Display your email on your public profile"
                enabled={showEmail}
                onChange={setShowEmail}
                small
              />
              <SettingToggle
                label="Show Phone Number"
                description="Display your phone number on your public profile"
                enabled={showPhone}
                onChange={setShowPhone}
                small
              />
            </div>
          </div>
        </div>
      </section>

      {/* Automation Settings */}
      <section className="bg-white rounded-xl border border-[rgba(26,60,40,0.1)]">
        <div className="p-6 border-b border-[rgba(26,60,40,0.1)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[rgba(184,144,64,0.1)] rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-[#B89040]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#1A3C28]">Automation</h3>
              <p className="text-sm text-[rgba(26,60,40,0.55)]">Configure automated workflows</p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-5">
          <SettingToggle
            label="Auto-Assign Workflows"
            description="Automatically enroll new leads in workflows"
            enabled={autoWorkflows}
            onChange={setAutoWorkflows}
          />
          <SettingToggle
            label="AI Assistant"
            description="Enable AI-powered suggestions and content generation"
            enabled={aiAssistant}
            onChange={setAiAssistant}
          />
          
          <div className="border-t border-[rgba(26,60,40,0.1)] pt-5">
            <label className="block text-sm font-medium text-[rgba(26,60,40,0.7)] mb-2">
              Default Follow-up Time
            </label>
            <select className="w-full px-3 py-2 border border-[rgba(26,60,40,0.15)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3C28]">
              <option>24 hours</option>
              <option>48 hours</option>
              <option>3 days</option>
              <option>1 week</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[rgba(26,60,40,0.7)] mb-2">
              Lead Assignment
            </label>
            <select className="w-full px-3 py-2 border border-[rgba(26,60,40,0.15)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3C28]">
              <option>Round Robin</option>
              <option>Manual Assignment</option>
              <option>Based on Territory</option>
              <option>Based on Lead Score</option>
            </select>
          </div>
        </div>
      </section>

      {/* Team Settings */}
      <section className="bg-white rounded-xl border border-[rgba(26,60,40,0.1)]">
        <div className="p-6 border-b border-[rgba(26,60,40,0.1)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[rgba(26,60,40,0.06)] rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-[#1A3C28]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#1A3C28]">Team Members</h3>
                <p className="text-sm text-[rgba(26,60,40,0.55)]">Manage your team and permissions</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-[#1A3C28] text-white rounded-lg text-sm font-medium hover:bg-[#162f20] transition-colors">
              Invite Member
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {[
              {
                name: 'Sarah Johnson',
                email: 'sarah.johnson@realestate.com',
                role: 'Owner',
                avatar: 'SJ',
              },
              {
                name: 'Michael Brown',
                email: 'michael.brown@realestate.com',
                role: 'Admin',
                avatar: 'MB',
              },
              {
                name: 'Lisa Wang',
                email: 'lisa.wang@realestate.com',
                role: 'Agent',
                avatar: 'LW',
              },
            ].map((member, index) => (
              <div
                key={index}
              className="flex items-center justify-between p-4 border border-[rgba(26,60,40,0.1)] rounded-lg hover:bg-[rgba(26,60,40,0.02)] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#1A3C28] to-[#2D5A40] rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {member.avatar}
                  </div>
                  <div>
                    <p className="font-medium text-[#1A3C28]">{member.name}</p>
                    <p className="text-sm text-[rgba(26,60,40,0.55)]">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    defaultValue={member.role}
                    className="px-3 py-1.5 border border-[rgba(26,60,40,0.15)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3C28]"
                  >
                    <option>Owner</option>
                    <option>Admin</option>
                    <option>Agent</option>
                    <option>Viewer</option>
                  </select>
                  {member.role !== 'Owner' && (
                    <button className="text-sm text-rose-600 hover:text-rose-700 font-medium">
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Billing Settings */}
      <section className="bg-white rounded-xl border border-[rgba(26,60,40,0.1)]">
        <div className="p-6 border-b border-[rgba(26,60,40,0.1)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[rgba(196,86,42,0.06)] rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-[#C4562A]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#1A3C28]">Billing &amp; Subscription</h3>
              <p className="text-sm text-[rgba(26,60,40,0.55)]">Manage your subscription and payment method</p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-6">
          {/* Current Plan */}
          <div className="p-4 bg-[rgba(26,60,40,0.03)] border border-[rgba(26,60,40,0.1)] rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-semibold text-[#1A3C28]">Professional Plan</h4>
                <p className="text-sm text-[rgba(26,60,40,0.55)]">$99/month • Billed monthly</p>
              </div>
              <button className="px-4 py-2 bg-white border border-[rgba(26,60,40,0.15)] text-[rgba(26,60,40,0.7)] rounded-lg text-sm font-medium hover:bg-[rgba(26,60,40,0.03)] transition-colors">
                Upgrade Plan
              </button>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#00A854]" />
                <span className="text-[rgba(26,60,40,0.7)]">Unlimited leads</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#00A854]" />
                <span className="text-[rgba(26,60,40,0.7)]">Advanced analytics</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#00A854]" />
                <span className="text-[rgba(26,60,40,0.7)]">Priority support</span>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-[rgba(26,60,40,0.7)] mb-3">
              Payment Method
            </label>
            <div className="p-4 border border-[rgba(26,60,40,0.1)] rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-8 bg-[#1A3C28] rounded flex items-center justify-center text-white text-xs font-bold">
                  VISA
                </div>
                <div>
                  <p className="font-medium text-[#1A3C28]">•••• •••• •••• 4242</p>
                  <p className="text-sm text-[rgba(26,60,40,0.55)]">Expires 12/2026</p>
                </div>
              </div>
              <button className="text-sm text-[rgba(26,60,40,0.7)] font-medium hover:text-[#1A3C28]">
                Update
              </button>
            </div>
          </div>

          {/* Billing History */}
          <div>
            <label className="block text-sm font-medium text-[rgba(26,60,40,0.7)] mb-3">
              Billing History
            </label>
            <div className="space-y-2">
              {[
                { date: 'Mar 1, 2026', amount: '$99.00', status: 'Paid' },
                { date: 'Feb 1, 2026', amount: '$99.00', status: 'Paid' },
                { date: 'Jan 1, 2026', amount: '$99.00', status: 'Paid' },
              ].map((invoice, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border border-[rgba(26,60,40,0.1)] rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-[#1A3C28]">{invoice.date}</span>
                    <span className="text-sm font-semibold text-[#1A3C28]">{invoice.amount}</span>
                    <span className="text-xs px-2 py-1 bg-[rgba(0,232,122,0.08)] text-[#00A854] border border-[rgba(0,232,122,0.2)] rounded-full">
                      {invoice.status}
                    </span>
                  </div>
                  <button className="text-sm text-[rgba(26,60,40,0.55)] hover:text-[#1A3C28] font-medium">
                    Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Preferences */}
      <section className="bg-white rounded-xl border border-[rgba(26,60,40,0.1)]">
        <div className="p-6 border-b border-[rgba(26,60,40,0.1)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[rgba(26,60,40,0.06)] rounded-lg flex items-center justify-center">
              <Palette className="w-5 h-5 text-[#1A3C28]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#1A3C28]">Preferences</h3>
              <p className="text-sm text-[rgba(26,60,40,0.55)]">Customize your experience</p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-[rgba(26,60,40,0.7)] mb-2">Language</label>
            <select className="w-full px-3 py-2 border border-[rgba(26,60,40,0.15)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3C28]">
              <option>English (US)</option>
              <option>Spanish</option>
              <option>French</option>
              <option>German</option>
              <option>Chinese</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[rgba(26,60,40,0.7)] mb-2">Timezone</label>
            <select className="w-full px-3 py-2 border border-[rgba(26,60,40,0.15)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3C28]">
              <option>Pacific Time (PT)</option>
              <option>Mountain Time (MT)</option>
              <option>Central Time (CT)</option>
              <option>Eastern Time (ET)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[rgba(26,60,40,0.7)] mb-2">Date Format</label>
            <select className="w-full px-3 py-2 border border-[rgba(26,60,40,0.15)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3C28]">
              <option>MM/DD/YYYY</option>
              <option>DD/MM/YYYY</option>
              <option>YYYY-MM-DD</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[rgba(26,60,40,0.7)] mb-2">Currency</label>
            <select className="w-full px-3 py-2 border border-[rgba(26,60,40,0.15)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A3C28]">
              <option>USD ($)</option>
              <option>EUR (€)</option>
              <option>GBP (£)</option>
              <option>CAD ($)</option>
            </select>
          </div>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="bg-white rounded-xl border border-rose-200">
        <div className="p-6 border-b border-rose-200 bg-rose-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-rose-900">Danger Zone</h3>
              <p className="text-sm text-rose-700">Irreversible and destructive actions</p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between p-4 border border-[rgba(26,60,40,0.1)] rounded-lg">
            <div>
              <h4 className="font-medium text-[#1A3C28]">Export All Data</h4>
              <p className="text-sm text-[rgba(26,60,40,0.55)]">Download all your account data</p>
            </div>
            <button className="px-4 py-2 border border-[rgba(26,60,40,0.15)] text-[rgba(26,60,40,0.7)] rounded-lg text-sm font-medium hover:bg-[rgba(26,60,40,0.03)] transition-colors">
              Export Data
            </button>
          </div>

          <div className="flex items-center justify-between p-4 border border-rose-200 rounded-lg bg-rose-50">
            <div>
              <h4 className="font-medium text-rose-900">Delete Account</h4>
              <p className="text-sm text-rose-700">Permanently delete your account and all data</p>
            </div>
            <button className="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700 transition-colors">
              Delete Account
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function SettingToggle({
  label,
  description,
  icon: Icon,
  enabled,
  onChange,
  small = false,
}: {
  label: string;
  description: string;
  icon?: any;
  enabled: boolean;
  onChange: (value: boolean) => void;
  small?: boolean;
}) {
  return (
    <div className="flex items-start justify-between">
      <div className="flex items-start gap-3 flex-1">
        {Icon && !small && (
          <div className="w-10 h-10 bg-[rgba(26,60,40,0.06)] rounded-lg flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 text-[rgba(26,60,40,0.55)]" />
          </div>
        )}
        <div className={small ? '' : 'pt-1'}>
          <h4 className={`font-medium text-[#1A3C28] ${small ? 'text-sm' : ''}`}>{label}</h4>
          <p className={`text-[rgba(26,60,40,0.55)] ${small ? 'text-xs' : 'text-sm'} mt-0.5`}>
            {description}
          </p>
        </div>
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className="flex-shrink-0 ml-4"
        aria-label={`Toggle ${label}`}
      >
        <div
          className={`relative w-11 h-6 rounded-full transition-colors ${
            enabled ? 'bg-[#1A3C28]' : 'bg-[rgba(26,60,40,0.2)]'
          }`}
        >
          <div
            className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
              enabled ? 'translate-x-5' : 'translate-x-0.5'
            }`}
          />
        </div>
      </button>
    </div>
  );
}