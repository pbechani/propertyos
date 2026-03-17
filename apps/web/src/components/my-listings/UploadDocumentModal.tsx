'use client';

import { useState, useRef, DragEvent } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  X,
  Upload,
  File,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Folder,
  Tag,
  Lock,
  Users,
  Plus,
  FileCheck
} from 'lucide-react';

interface UploadDocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UploadedFile {
  file: File;
  id: string;
  preview?: string;
}

const documentCategories = [
  { id: 'listing', label: 'Listing', icon: FileText, description: 'Listing agreements, amendments' },
  { id: 'disclosures', label: 'Disclosures', icon: AlertCircle, description: 'Required seller disclosures' },
  { id: 'hoa', label: 'HOA', icon: Folder, description: 'HOA documents, CC&Rs' },
  { id: 'offers', label: 'Offers', icon: FileCheck, description: 'Purchase agreements, counter offers' },
  { id: 'inspections', label: 'Inspections', icon: CheckCircle2, description: 'Inspection reports' },
  { id: 'marketing', label: 'Marketing', icon: ImageIcon, description: 'Photos, floor plans, brochures' },
  { id: 'pricing', label: 'Pricing', icon: FileText, description: 'CMA, appraisals' },
  { id: 'title', label: 'Title', icon: FileText, description: 'Title reports, surveys' },
  { id: 'escrow', label: 'Escrow', icon: Folder, description: 'Escrow documents' },
  { id: 'other', label: 'Other', icon: File, description: 'Miscellaneous documents' }
];

const accessLevels = [
  { id: 'private', label: 'Private', description: 'Only you can access', icon: Lock },
  { id: 'team', label: 'Team', description: 'You and co-agents', icon: Users },
  { id: 'client', label: 'Client', description: 'You, team, and client', icon: Users },
  { id: 'public', label: 'Public', description: 'Anyone with the link', icon: Users }
];

const documentStatuses = [
  { id: 'current', label: 'Current' },
  { id: 'draft', label: 'Draft' },
  { id: 'pending-signature', label: 'Pending Signature' },
  { id: 'archived', label: 'Archived' }
];

export function UploadDocumentModal({ open, onOpenChange }: UploadDocumentModalProps) {
  const [step, setStep] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    category: 'listing',
    title: '',
    description: '',
    status: 'current',
    accessLevel: 'team',
    tags: [] as string[],
    expirationDate: '',
    isRequired: false,
    notifyTeam: false,
    notifyClient: false
  });

  const [customTag, setCustomTag] = useState('');

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const handleFiles = (files: File[]) => {
    const newFiles = files.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
    }));
    
    setUploadedFiles(prev => [...prev, ...newFiles]);
    
    // Auto-fill title if only one file and no title set
    if (files.length === 1 && !formData.title) {
      const fileName = files[0].name.replace(/\.[^/.]+$/, ''); // Remove extension
      setFormData(prev => ({ ...prev, title: fileName }));
    }
  };

  const handleRemoveFile = (id: string) => {
    setUploadedFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const handleAddTag = () => {
    if (customTag.trim() && !formData.tags.includes(customTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, customTag.trim()]
      }));
      setCustomTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const handleNext = () => {
    if (step === 1 && uploadedFiles.length > 0) {
      setStep(2);
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleSubmit = () => {
    console.log('Uploading documents:', { files: uploadedFiles, metadata: formData });
    // Reset and close
    onOpenChange(false);
    setTimeout(() => {
      setStep(1);
      setUploadedFiles([]);
      setFormData({
        category: 'listing',
        title: '',
        description: '',
        status: 'current',
        accessLevel: 'team',
        tags: [],
        expirationDate: '',
        isRequired: false,
        notifyTeam: false,
        notifyClient: false
      });
    }, 300);
  };

  const totalSize = uploadedFiles.reduce((acc, f) => acc + f.file.size, 0);
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <ImageIcon className="w-5 h-5" />;
    if (file.type === 'application/pdf') return <FileText className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <Dialog.Title className="text-xl font-semibold">Upload Document</Dialog.Title>
              <Dialog.Description className="text-sm text-gray-600 mt-1">
                Step {step} of 2: {step === 1 ? 'Select Files' : 'Add Details'}
              </Dialog.Description>
            </div>
            <Dialog.Close className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </Dialog.Close>
          </div>

          {/* Progress Steps */}
          <div className="px-6 pt-4 pb-2">
            <div className="flex items-center justify-center gap-2">
              <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  step >= 1 ? 'border-blue-600 bg-blue-50' : 'border-gray-300'
                }`}>
                  {step > 1 ? <CheckCircle2 className="w-5 h-5" /> : '1'}
                </div>
                <span className="text-sm font-medium">Upload Files</span>
              </div>
              <div className={`w-16 h-0.5 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`} />
              <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  step >= 2 ? 'border-blue-600 bg-blue-50' : 'border-gray-300'
                }`}>
                  2
                </div>
                <span className="text-sm font-medium">Add Details</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {step === 1 && (
              <div className="space-y-6">
                {/* Upload Area */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                      isDragging ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      <Upload className={`w-8 h-8 ${isDragging ? 'text-blue-600' : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-gray-900 mb-1">
                        {isDragging ? 'Drop files here' : 'Drag & drop files here'}
                      </p>
                      <p className="text-sm text-gray-500">
                        or <span className="text-blue-600 font-medium">browse files</span> from your computer
                      </p>
                    </div>
                    <p className="text-xs text-gray-400 max-w-md">
                      Supported formats: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, ZIP (Max 50MB per file)
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.zip"
                  />
                </div>

                {/* Uploaded Files List */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900">
                        Selected Files ({uploadedFiles.length})
                      </h3>
                      <span className="text-sm text-gray-500">
                        Total: {formatFileSize(totalSize)}
                      </span>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {uploadedFiles.map((uploadedFile) => (
                        <div
                          key={uploadedFile.id}
                          className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center gap-3"
                        >
                          {uploadedFile.preview ? (
                            <img
                              src={uploadedFile.preview}
                              alt={uploadedFile.file.name}
                              className="w-12 h-12 rounded object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded flex items-center justify-center">
                              {getFileIcon(uploadedFile.file)}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{uploadedFile.file.name}</p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(uploadedFile.file.size)} • {uploadedFile.file.type || 'Unknown type'}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveFile(uploadedFile.id);
                            }}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Tips */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Quick Tips
                  </h4>
                  <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>Upload multiple files at once to save time</li>
                    <li>Use clear, descriptive file names</li>
                    <li>PDF format is recommended for contracts and official documents</li>
                    <li>Compress large image files before uploading</li>
                  </ul>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                {/* Category Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Document Category <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {documentCategories.map((category) => {
                      const Icon = category.icon;
                      return (
                        <button
                          key={category.id}
                          onClick={() => setFormData(prev => ({ ...prev, category: category.id }))}
                          className={`p-3 border-2 rounded-lg text-left transition-all ${
                            formData.category === category.id
                              ? 'border-blue-600 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <Icon className={`w-5 h-5 mt-0.5 ${
                              formData.category === category.id ? 'text-blue-600' : 'text-gray-400'
                            }`} />
                            <div>
                              <div className="font-medium text-sm">{category.label}</div>
                              <div className="text-xs text-gray-500 mt-0.5">{category.description}</div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Document Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Document Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Listing Agreement - 2847 Westwood Blvd"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    placeholder="Add any relevant notes or context about this document..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                {/* Status and Access Level */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {documentStatuses.map(status => (
                        <option key={status.id} value={status.id}>{status.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expiration Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={formData.expirationDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, expirationDate: e.target.value }))}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Access Control */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Access Level
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {accessLevels.map((access) => {
                      const Icon = access.icon;
                      return (
                        <button
                          key={access.id}
                          onClick={() => setFormData(prev => ({ ...prev, accessLevel: access.id }))}
                          className={`p-3 border-2 rounded-lg text-left transition-all ${
                            formData.accessLevel === access.id
                              ? 'border-blue-600 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <Icon className={`w-5 h-5 mt-0.5 ${
                              formData.accessLevel === access.id ? 'text-blue-600' : 'text-gray-400'
                            }`} />
                            <div>
                              <div className="font-medium text-sm">{access.label}</div>
                              <div className="text-xs text-gray-500 mt-0.5">{access.description}</div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Tag className="w-4 h-4 inline mr-1" />
                    Tags (Optional)
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={customTag}
                      onChange={(e) => setCustomTag(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      placeholder="Add tag..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleAddTag}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-2"
                        >
                          {tag}
                          <button onClick={() => handleRemoveTag(tag)} className="hover:text-blue-900">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Checkboxes */}
                <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isRequired}
                      onChange={(e) => setFormData(prev => ({ ...prev, isRequired: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-medium text-sm">Mark as Required</div>
                      <div className="text-xs text-gray-600">This document must be completed for the listing</div>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.notifyTeam}
                      onChange={(e) => setFormData(prev => ({ ...prev, notifyTeam: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-medium text-sm">Notify Team</div>
                      <div className="text-xs text-gray-600">Send notification to team members</div>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.notifyClient}
                      onChange={(e) => setFormData(prev => ({ ...prev, notifyClient: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-medium text-sm">Notify Client</div>
                      <div className="text-xs text-gray-600">Send notification to client</div>
                    </div>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-6 bg-gray-50 flex items-center justify-between">
            {step === 1 ? (
              <>
                <div className="text-sm text-gray-600">
                  {uploadedFiles.length > 0 && (
                    <span>{uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''} selected</span>
                  )}
                </div>
                <div className="flex gap-3">
                  <Dialog.Close className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">
                    Cancel
                  </Dialog.Close>
                  <button
                    onClick={handleNext}
                    disabled={uploadedFiles.length === 0}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next: Add Details
                  </button>
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={handleBack}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Back
                </button>
                <div className="flex gap-3">
                  <Dialog.Close className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">
                    Cancel
                  </Dialog.Close>
                  <button
                    onClick={handleSubmit}
                    disabled={!formData.title}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Upload className="w-5 h-5" />
                    Upload {uploadedFiles.length} {uploadedFiles.length === 1 ? 'Document' : 'Documents'}
                  </button>
                </div>
              </>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
