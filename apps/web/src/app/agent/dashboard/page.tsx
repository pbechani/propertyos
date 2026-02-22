import React from 'react';

export default function AgentDashboard() {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Agent Command Center</h2>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <a href="#" className="block px-4 py-2 text-blue-600 bg-blue-50 rounded-md font-medium">Dashboard</a>
          <a href="#" className="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-md">My Listings</a>
          <a href="#" className="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-md">Leads</a>
          <a href="#" className="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-md">Analytics</a>
          <a href="#" className="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-md">Settings</a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            + Add New Property
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Performance Snapshot */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 col-span-1 lg:col-span-3">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Performance Snapshot</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-500">Total Views</p>
                <p className="text-2xl font-bold text-gray-900">12,450</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-500">Active Listings</p>
                <p className="text-2xl font-bold text-gray-900">24</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-500">New Leads</p>
                <p className="text-2xl font-bold text-gray-900">8</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-500">Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900">3.2%</p>
              </div>
            </div>
          </div>

          {/* My Listings */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 col-span-1 lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">My Listings</h3>
              <a href="#" className="text-sm text-blue-600 hover:underline">View All</a>
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center p-4 border border-gray-100 rounded-md hover:bg-gray-50">
                  <div className="w-16 h-16 bg-gray-200 rounded-md mr-4"></div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">Luxury Villa in Victoria Falls</h4>
                    <p className="text-sm text-gray-500">$450,000 • 4 Beds • 3 Baths</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">Active</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* New Leads */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 col-span-1">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">New Leads</h3>
            </div>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-4 border border-gray-100 rounded-md">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900">John Doe</h4>
                    <span className="text-xs text-gray-500">2h ago</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Inquired about Luxury Villa...</p>
                  <div className="flex space-x-2">
                    <button className="flex-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100">Contact</button>
                    <button className="flex-1 px-3 py-1.5 text-sm border border-gray-200 text-gray-600 rounded hover:bg-gray-50">Dismiss</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
