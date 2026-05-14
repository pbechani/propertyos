'use client';

import { Calendar, FileText, CheckCircle, Clock, Plus, Edit3 } from 'lucide-react';
import { useState } from 'react';
import { InitiateSaleModal } from './InitiateSaleModal';

interface Props { propertyId: string; authToken: string; }

export function SaleDetails({ propertyId: _propertyId, authToken }: Props) {
  const [isInitiateSaleOpen, setIsInitiateSaleOpen] = useState(false);
  const [isUnderContract, _setIsUnderContract] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Sale Details</h2>
        <div className="flex items-center gap-3">
          {isUnderContract ? (
            <>
              <span className="px-3 py-1 bg-green-100 text-green-800 border border-green-200 rounded-full text-sm font-medium">
                Under Contract
              </span>
              <button
                onClick={() => setIsInitiateSaleOpen(true)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                Edit Details
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsInitiateSaleOpen(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Initiate Sale
            </button>
          )}
        </div>
      </div>

      {!isUnderContract && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No active sale</p>
          <p className="text-xs text-gray-400 mt-1">Initiate a sale when an offer is accepted</p>
        </div>
      )}

      {isUnderContract && (
        <>
          {/* Sale Overview */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Sale Price</div>
              <div className="text-2xl font-semibold text-gray-900">{formatCurrency(810000)}</div>
              <div className="text-xs text-green-600 mt-1">+$10k above asking</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Closing Date</div>
              <div className="text-xl font-semibold text-gray-900">April 30, 2026</div>
              <div className="text-xs text-gray-500 mt-1">46 days remaining</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Days on Market</div>
              <div className="text-2xl font-semibold text-gray-900">28</div>
              <div className="text-xs text-gray-500 mt-1">Listed Feb 15, 2026</div>
            </div>
          </div>

          {/* Buyer Information */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold mb-3">Buyer Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Buyer Name:</span>
                <span className="ml-2 font-medium">Jennifer Martinez</span>
              </div>
              <div>
                <span className="text-gray-600">Buyer Agent:</span>
                <span className="ml-2 font-medium">Robert Chen, ABC Realty</span>
              </div>
              <div>
                <span className="text-gray-600">Financing Type:</span>
                <span className="ml-2 font-medium">Conventional</span>
              </div>
              <div>
                <span className="text-gray-600">Pre-approval Amount:</span>
                <span className="ml-2 font-medium">{formatCurrency(850000)}</span>
              </div>
              <div>
                <span className="text-gray-600">Earnest Money:</span>
                <span className="ml-2 font-medium">{formatCurrency(25000)}</span>
              </div>
              <div>
                <span className="text-gray-600">Down Payment:</span>
                <span className="ml-2 font-medium">20% ({formatCurrency(162000)})</span>
              </div>
            </div>
          </div>

          {/* Timeline & Milestones */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold mb-4">Transaction Timeline</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">Offer Accepted</div>
                      <div className="text-sm text-gray-500">March 14, 2026</div>
                    </div>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Completed</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">Earnest Money Deposited</div>
                      <div className="text-sm text-gray-500">March 15, 2026</div>
                    </div>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Completed</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">Home Inspection</div>
                      <div className="text-sm text-gray-500">March 20, 2026</div>
                      <div className="text-sm text-gray-600 mt-1">No major issues found. Minor repairs negotiated.</div>
                    </div>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Completed</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">Appraisal</div>
                      <div className="text-sm text-gray-500">Scheduled: March 25, 2026</div>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">In Progress</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">Financing Contingency Deadline</div>
                      <div className="text-sm text-gray-500">April 10, 2026</div>
                    </div>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Pending</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">Final Walkthrough</div>
                      <div className="text-sm text-gray-500">April 28, 2026</div>
                    </div>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Pending</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">Closing</div>
                      <div className="text-sm text-gray-500">April 30, 2026</div>
                    </div>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Pending</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold mb-3">Financial Breakdown</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Sale Price</span>
                <span className="font-medium">{formatCurrency(810000)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Your Commission (3%)</span>
                <span className="font-medium text-green-600">+{formatCurrency(24300)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Buyer Agent Commission (3%)</span>
                <span className="font-medium text-red-600">-{formatCurrency(24300)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Seller Concessions</span>
                <span className="font-medium text-red-600">-{formatCurrency(5000)}</span>
              </div>
              <div className="flex justify-between py-2 font-semibold">
                <span>Net to Seller (estimated)</span>
                <span>{formatCurrency(756400)}</span>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold mb-3">Documents</h3>
            <div className="space-y-2">
              {[
                'Purchase Agreement',
                'Inspection Report',
                'Seller Disclosures',
                'HOA Documents',
                'Title Report',
                'Pre-approval Letter'
              ].map((doc, index) => (
                <div key={index} className="flex items-center justify-between py-2 px-3 hover:bg-gray-50 rounded transition-colors">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{doc}</span>
                  </div>
                  <button className="text-sm text-blue-600 hover:text-blue-700">View</button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <InitiateSaleModal
        open={isInitiateSaleOpen}
        onOpenChange={setIsInitiateSaleOpen}
        listingPrice={800000}
        authToken={authToken}
      />
    </div>
  );
}
