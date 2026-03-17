'use client';

import { useState } from 'react';
import { FileText, Upload, Download, Trash2, Eye, Search, FolderOpen, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { UploadDocumentModal } from './UploadDocumentModal';

interface ListingDocument {
  id: string;
  name: string;
  category: string;
  uploadedDate: string;
  uploadedBy: string;
  fileSize: string;
  fileType: string;
  status: 'current' | 'expired' | 'pending-signature' | 'draft';
  required: boolean;
}

const categories = ['All', 'Listing', 'Disclosures', 'HOA', 'Offers', 'Inspections', 'Marketing', 'Pricing'];

interface Props { propertyId: string; authToken: string; }

export function Documents({ propertyId: _propertyId, authToken: _authToken }: Props) {
  const [docs, _setDocs] = useState<ListingDocument[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const filteredDocs = docs.filter(doc => {
    const matchesCategory = selectedCategory === 'All' || doc.category === selectedCategory;
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'current':
        return <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Current</span>;
      case 'expired':
        return <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Expired</span>;
      case 'pending-signature':
        return <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs font-medium flex items-center gap-1"><Clock className="w-3 h-3" /> Needs Signature</span>;
      case 'draft':
        return <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium">Draft</span>;
      default:
        return null;
    }
  };

  const pendingSignature = docs.filter(d => d.status === 'pending-signature').length;
  const requiredDocs = docs.filter(d => d.required);
  const completedRequired = requiredDocs.filter(d => d.status === 'current').length;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Documents</h2>
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Upload Document
        </button>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-sm text-blue-700 mb-1">Total Documents</div>
          <div className="text-2xl font-semibold text-blue-600">{docs.length}</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="text-sm text-green-700 mb-1">Required Docs Complete</div>
          <div className="text-2xl font-semibold text-green-600">{completedRequired}/{requiredDocs.length}</div>
        </div>
        {pendingSignature > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="text-sm text-yellow-700 mb-1">Pending Signature</div>
            <div className="text-2xl font-semibold text-yellow-600">{pendingSignature}</div>
          </div>
        )}
      </div>

      {/* Search and Filter */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat}
            {cat !== 'All' && (
              <span className="ml-1.5 text-xs opacity-75">
                ({docs.filter(d => d.category === cat).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Documents List */}
      <div className="space-y-2">
        {filteredDocs.map((doc) => (
          <div key={doc.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                doc.fileType === 'PDF' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'
              }`}>
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-sm truncate">{doc.name}</h4>
                  {doc.required && (
                    <span className="px-1.5 py-0.5 bg-red-50 text-red-600 rounded text-[10px] font-medium flex-shrink-0">
                      REQUIRED
                    </span>
                  )}
                  {getStatusBadge(doc.status)}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>{doc.category}</span>
                  <span>|</span>
                  <span>{doc.fileSize}</span>
                  <span>|</span>
                  <span>Uploaded {new Date(doc.uploadedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  <span>|</span>
                  <span>{doc.uploadedBy}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="View">
                  <Eye className="w-4 h-4 text-gray-500" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Download">
                  <Download className="w-4 h-4 text-gray-500" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Delete">
                  <Trash2 className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredDocs.length === 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No documents found</p>
          </div>
        )}
      </div>

      {requiredDocs.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-3">Required Documents Checklist</h3>
          <div className="grid grid-cols-2 gap-2">
            {requiredDocs.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                {item.status === 'current' ? (
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                ) : (
                  <div className="w-4 h-4 border-2 border-gray-300 rounded-full flex-shrink-0" />
                )}
                <span className={item.status === 'current' ? 'text-gray-600' : 'text-gray-900 font-medium'}>{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <UploadDocumentModal
        open={isUploadModalOpen}
        onOpenChange={setIsUploadModalOpen}
      />
    </div>
  );
}
