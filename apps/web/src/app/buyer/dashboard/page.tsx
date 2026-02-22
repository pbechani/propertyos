import React from 'react';

export default function BuyerDashboard() {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Buyer's Dashboard</h2>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <a href="#" className="block px-4 py-2 text-blue-600 bg-blue-50 rounded-md font-medium">Recommended</a>
          <a href="#" className="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-md">My Favorites</a>
          <a href="#" className="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-md">Scheduled Viewings</a>
          <a href="#" className="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-md">My Inquiries</a>
          <a href="#" className="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-md">Profile Settings</a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Recommended for You</h1>
          <div className="flex space-x-4">
            <select className="border border-gray-300 rounded-md px-4 py-2 text-sm text-gray-700 focus:ring-blue-500 focus:border-blue-500">
              <option>Sort by: Relevance</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
              <option>Newest First</option>
            </select>
            <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
              Filters
            </button>
          </div>
        </div>

        {/* Property Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300">
              <div className="relative h-48 bg-gray-200">
                {/* Placeholder for image */}
                <div className="absolute top-4 right-4">
                  <button className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-50 text-gray-400 hover:text-red-500 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                  </button>
                </div>
                <div className="absolute bottom-4 left-4">
                  <span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full shadow-sm">Verified</span>
                </div>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-gray-900">$450,000</h3>
                  <span className="text-sm text-gray-500">For Sale</span>
                </div>
                <h4 className="text-lg font-medium text-gray-800 mb-1">Modern Villa in Borrowdale</h4>
                <p className="text-sm text-gray-500 mb-4 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                  Harare, Zimbabwe
                </p>
                <div className="flex items-center space-x-4 text-sm text-gray-600 mb-6">
                  <span className="flex items-center"><strong className="mr-1">4</strong> Beds</span>
                  <span className="flex items-center"><strong className="mr-1">3</strong> Baths</span>
                  <span className="flex items-center"><strong className="mr-1">250</strong> sqm</span>
                </div>
                <div className="flex space-x-3">
                  <button className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors">
                    Schedule Viewing
                  </button>
                  <button className="flex-1 px-4 py-2 bg-white border border-blue-600 text-blue-600 text-sm font-medium rounded-md hover:bg-blue-50 transition-colors">
                    Inquire Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
