'use client';

import { useState } from "react";
import { User, Bell, Shield, Building, Mail, Palette, Save } from "lucide-react";

export default function Page() {
  const [activeTab, setActiveTab] = useState("profile");

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
    { id: "firm", label: "Firm Details", icon: Building },
    { id: "email", label: "Email Templates", icon: Mail },
    { id: "appearance", label: "Appearance", icon: Palette },
  ];

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account, preferences, and firm settings</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Nav */}
        <div className="w-56 shrink-0">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Settings</h2>
              <div className="flex items-start gap-6 mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                  SW
                </div>
                <div>
                  <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 mr-2">
                    Upload Photo
                  </button>
                  <button className="px-4 py-2 text-sm text-red-600 hover:text-red-700">
                    Remove
                  </button>
                  <p className="text-xs text-gray-500 mt-1">JPG, PNG up to 2MB</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input type="text" defaultValue="Sarah" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input type="text" defaultValue="Williams" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" defaultValue="sarah.williams@conveylaw.co.za" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input type="tel" defaultValue="+27 82 555 0101" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Professional Title</label>
                  <input type="text" defaultValue="Senior Conveyancer" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Admission Number</label>
                  <input type="text" defaultValue="ADM-2015-004821" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                  <textarea rows={3} defaultValue="Experienced conveyancer specializing in residential and commercial property transfers." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <button className="mt-6 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Notification Preferences</h2>
              <div className="space-y-6">
                {[
                  { category: "Case Updates", items: ["Stage changes", "Document uploads", "Client messages", "Due date reminders"] },
                  { category: "Financial Alerts", items: ["Invoice generated", "Payment received", "Escrow releases", "Overdue accounts"] },
                  { category: "Compliance Reminders", items: ["FICA expiry warnings", "Certificate deadlines", "Regulatory changes"] },
                ].map((group) => (
                  <div key={group.category}>
                    <h3 className="font-medium text-gray-900 mb-3">{group.category}</h3>
                    <div className="space-y-2 pl-2">
                      {group.items.map((item) => (
                        <label key={item} className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-gray-700">{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <button className="mt-6 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                <Save className="w-4 h-4" />
                Save Preferences
              </button>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Security Settings</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Change Password</h3>
                  <div className="space-y-3 max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                      <input type="password" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                      <input type="password" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                      <input type="password" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                      Update Password
                    </button>
                  </div>
                </div>
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="font-medium text-gray-900 mb-3">Two-Factor Authentication</h3>
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg max-w-md">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Authenticator App</p>
                      <p className="text-xs text-gray-500 mt-0.5">Use an app like Google Authenticator</p>
                    </div>
                    <button className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                      Enable
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Firm Tab */}
          {activeTab === "firm" && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Firm Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Firm Name</label>
                  <input type="text" defaultValue="Williams &amp; Associates Inc." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
                  <input type="text" defaultValue="2001/012345/21" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">VAT Number</label>
                  <input type="text" defaultValue="4560123456" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Physical Address</label>
                  <textarea rows={2} defaultValue="12 Legal Avenue, Sandton, Johannesburg, 2196" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Main Phone</label>
                  <input type="tel" defaultValue="+27 11 555 0200" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <input type="url" defaultValue="https://williams-associates.co.za" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <button className="mt-6 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                <Save className="w-4 h-4" />
                Save Firm Details
              </button>
            </div>
          )}

          {/* Email Templates Tab */}
          {activeTab === "email" && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Email Templates</h2>
              <div className="space-y-3">
                {[
                  { name: "Welcome / Mandate Letter", description: "Sent when a new case is opened" },
                  { name: "Stage Progress Update", description: "Notifies clients of stage changes" },
                  { name: "Document Request", description: "Requests outstanding documents from parties" },
                  { name: "Transfer Ready Notification", description: "Confirms transfer is ready to lodge" },
                  { name: "Invoice & Fee Note", description: "Sends invoice to client" },
                  { name: "Completion Confirmation", description: "Confirms successful registration" },
                ].map((template) => (
                  <div key={template.name} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{template.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{template.description}</p>
                    </div>
                    <button className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-100">
                      Edit
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === "appearance" && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Appearance</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Theme</h3>
                  <div className="grid grid-cols-3 gap-3 max-w-sm">
                    {["Light", "Dark", "System"].map((theme) => (
                      <button
                        key={theme}
                        className={`border-2 rounded-lg p-3 text-sm font-medium transition-colors ${
                          theme === "Light"
                            ? "border-blue-500 text-blue-600 bg-blue-50"
                            : "border-gray-200 text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        {theme}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Accent Color</h3>
                  <div className="flex gap-3">
                    {["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"].map((color) => (
                      <button
                        key={color}
                        className={`w-8 h-8 rounded-full border-2 ${color === "#3b82f6" ? "border-gray-900 scale-110" : "border-transparent"}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Density</h3>
                  <div className="grid grid-cols-3 gap-3 max-w-sm">
                    {["Compact", "Comfortable", "Spacious"].map((density) => (
                      <button
                        key={density}
                        className={`border-2 rounded-lg p-3 text-sm font-medium transition-colors ${
                          density === "Comfortable"
                            ? "border-blue-500 text-blue-600 bg-blue-50"
                            : "border-gray-200 text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        {density}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <button className="mt-6 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                <Save className="w-4 h-4" />
                Save Preferences
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
