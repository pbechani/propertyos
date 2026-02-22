import React from 'react';

export default function FraudReport() {
  return (
    <div className="min-h-screen bg-gray-100 font-sans py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Report Suspicious Activity</h1>
          <p className="mt-2 text-sm text-gray-600">Your safety is our priority. Please provide details about the suspicious listing or user.</p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-12">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-300 rounded-full"></div>
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1/3 h-1 bg-red-600 rounded-full"></div>
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-10 h-10 bg-red-600 text-white rounded-full flex items-center justify-center font-bold shadow-md">1</div>
              <span className="mt-2 text-sm font-bold text-red-600">Type of Fraud</span>
            </div>
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-10 h-10 bg-white border-2 border-gray-300 text-gray-500 rounded-full flex items-center justify-center font-bold shadow-sm">2</div>
              <span className="mt-2 text-sm font-medium text-gray-500">Details</span>
            </div>
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-10 h-10 bg-white border-2 border-gray-300 text-gray-500 rounded-full flex items-center justify-center font-bold shadow-sm">3</div>
              <span className="mt-2 text-sm font-medium text-gray-500">Evidence</span>
            </div>
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-10 h-10 bg-white border-2 border-gray-300 text-gray-500 rounded-full flex items-center justify-center font-bold shadow-sm">4</div>
              <span className="mt-2 text-sm font-medium text-gray-500">Review</span>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white shadow-sm rounded overflow-hidden border border-gray-200">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b border-gray-200 pb-4">What type of issue are you reporting?</h2>
            
            <div className="space-y-4">
              <label className="flex items-center p-4 border border-gray-200 rounded cursor-pointer hover:bg-red-50 hover:border-red-200 transition-colors">
                <input type="radio" name="fraudType" className="h-5 w-5 text-red-600 focus:ring-red-500 border-gray-300" />
                <div className="ml-4">
                  <span className="block text-sm font-bold text-gray-900">Fake Listing</span>
                  <span className="block text-sm text-gray-500 mt-1">The property doesn't exist or the photos are stolen.</span>
                </div>
              </label>

              <label className="flex items-center p-4 border border-gray-200 rounded cursor-pointer hover:bg-red-50 hover:border-red-200 transition-colors">
                <input type="radio" name="fraudType" className="h-5 w-5 text-red-600 focus:ring-red-500 border-gray-300" />
                <div className="ml-4">
                  <span className="block text-sm font-bold text-gray-900">Suspicious Agent/Seller</span>
                  <span className="block text-sm text-gray-500 mt-1">The person is asking for money upfront or acting suspiciously.</span>
                </div>
              </label>

              <label className="flex items-center p-4 border border-gray-200 rounded cursor-pointer hover:bg-red-50 hover:border-red-200 transition-colors">
                <input type="radio" name="fraudType" className="h-5 w-5 text-red-600 focus:ring-red-500 border-gray-300" />
                <div className="ml-4">
                  <span className="block text-sm font-bold text-gray-900">Incorrect Information</span>
                  <span className="block text-sm text-gray-500 mt-1">The price, location, or details are deliberately misleading.</span>
                </div>
              </label>

              <label className="flex items-center p-4 border border-gray-200 rounded cursor-pointer hover:bg-red-50 hover:border-red-200 transition-colors">
                <input type="radio" name="fraudType" className="h-5 w-5 text-red-600 focus:ring-red-500 border-gray-300" />
                <div className="ml-4">
                  <span className="block text-sm font-bold text-gray-900">Other</span>
                  <span className="block text-sm text-gray-500 mt-1">Another type of suspicious activity not listed above.</span>
                </div>
              </label>
            </div>
          </div>
          
          <div className="px-8 py-5 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
            <button type="button" className="px-6 py-2.5 border border-gray-300 shadow-sm text-sm font-bold rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-colors">
              Cancel
            </button>
            <button type="button" className="px-6 py-2.5 border border-transparent shadow-sm text-sm font-bold rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none transition-colors">
              Next: Provide Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
