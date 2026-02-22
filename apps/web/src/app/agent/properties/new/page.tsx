import React from 'react';

export default function AddPropertyWizard() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-gray-900">Add New Property</h1>
          <p className="mt-2 text-sm text-gray-600">Complete the steps below to list a new property on the marketplace.</p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-12">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 rounded-full"></div>
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1/4 h-1 bg-blue-600 rounded-full"></div>
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold shadow-md">1</div>
              <span className="mt-2 text-sm font-medium text-blue-600">Overview</span>
            </div>
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-10 h-10 bg-white border-2 border-gray-300 text-gray-500 rounded-full flex items-center justify-center font-bold shadow-sm">2</div>
              <span className="mt-2 text-sm font-medium text-gray-500">Media</span>
            </div>
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-10 h-10 bg-white border-2 border-gray-300 text-gray-500 rounded-full flex items-center justify-center font-bold shadow-sm">3</div>
              <span className="mt-2 text-sm font-medium text-gray-500">Location</span>
            </div>
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-10 h-10 bg-white border-2 border-gray-300 text-gray-500 rounded-full flex items-center justify-center font-bold shadow-sm">4</div>
              <span className="mt-2 text-sm font-medium text-gray-500">Pricing</span>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Property Overview</h2>
            
            <form className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">Property Title</label>
                <input type="text" id="title" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-3 px-4 focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="e.g., Modern 4-Bedroom Villa in Borrowdale" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700">Property Type</label>
                  <select id="type" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-3 px-4 focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                    <option>Residential</option>
                    <option>Commercial</option>
                    <option>Land</option>
                    <option>Off-Plan</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">Listing Status</label>
                  <select id="status" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-3 px-4 focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                    <option>Draft</option>
                    <option>Active</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                <textarea id="description" rows={5} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-3 px-4 focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="Describe the property's key features, neighborhood, and unique selling points..."></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="bedrooms" className="block text-sm font-medium text-gray-700">Bedrooms</label>
                  <input type="number" id="bedrooms" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-3 px-4 focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                </div>
                <div>
                  <label htmlFor="bathrooms" className="block text-sm font-medium text-gray-700">Bathrooms</label>
                  <input type="number" id="bathrooms" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-3 px-4 focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                </div>
                <div>
                  <label htmlFor="area" className="block text-sm font-medium text-gray-700">Area (sqm)</label>
                  <input type="number" id="area" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-3 px-4 focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                </div>
              </div>
            </form>
          </div>
          
          <div className="px-8 py-5 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
            <button type="button" className="px-6 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Cancel
            </button>
            <button type="button" className="px-6 py-3 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Next: Media Gallery
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
