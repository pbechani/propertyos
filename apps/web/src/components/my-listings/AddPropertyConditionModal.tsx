'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  X,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Home,
  Droplet,
  Wind,
  Zap,
  Palette,
  Sofa,
  Trees,
  Car,
  ChevronRight,
  Plus,
  Camera,
  Save,
  ArrowLeft,
  ArrowRight,
  FileText,
  ClipboardCheck
} from 'lucide-react';

interface AddPropertyConditionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface RoomCondition {
  roomId: string;
  status: 'excellent' | 'good' | 'fair' | 'needs-attention' | 'not-assessed';
  notes: string;
  issues: Issue[];
}

interface Issue {
  id: string;
  description: string;
  severity: 'minor' | 'moderate' | 'major';
  estimatedCost: string;
  photos: string[];
}

const rooms = [
  { id: 'foundation', label: 'Foundation', category: 'Structure', icon: Home },
  { id: 'roof', label: 'Roof', category: 'Structure', icon: Home },
  { id: 'walls', label: 'Walls & Ceilings', category: 'Structure', icon: Home },
  { id: 'windows', label: 'Windows & Doors', category: 'Structure', icon: Home },
  { id: 'hvac', label: 'HVAC System', category: 'Systems', icon: Wind },
  { id: 'plumbing', label: 'Plumbing', category: 'Systems', icon: Droplet },
  { id: 'electrical', label: 'Electrical', category: 'Systems', icon: Zap },
  { id: 'water-heater', label: 'Water Heater', category: 'Systems', icon: Droplet },
  { id: 'kitchen', label: 'Kitchen', category: 'Interior', icon: Sofa },
  { id: 'master-bath', label: 'Master Bathroom', category: 'Interior', icon: Droplet },
  { id: 'bath-2', label: 'Bathroom 2', category: 'Interior', icon: Droplet },
  { id: 'bath-3', label: 'Bathroom 3', category: 'Interior', icon: Droplet },
  { id: 'flooring', label: 'Flooring', category: 'Interior', icon: Home },
  { id: 'paint', label: 'Paint & Finishes', category: 'Interior', icon: Palette },
  { id: 'siding', label: 'Siding', category: 'Exterior', icon: Home },
  { id: 'landscaping', label: 'Landscaping', category: 'Exterior', icon: Trees },
  { id: 'driveway', label: 'Driveway', category: 'Exterior', icon: Car },
  { id: 'deck', label: 'Deck/Patio', category: 'Exterior', icon: Home }
];

const statusOptions = [
  { 
    value: 'excellent', 
    label: 'Excellent', 
    description: 'Like new, no issues',
    icon: CheckCircle2,
    color: 'bg-green-50 border-green-500 text-green-700'
  },
  { 
    value: 'good', 
    label: 'Good', 
    description: 'Well-maintained, minor wear',
    icon: CheckCircle2,
    color: 'bg-blue-50 border-blue-500 text-blue-700'
  },
  { 
    value: 'fair', 
    label: 'Fair', 
    description: 'Functional, shows age',
    icon: AlertCircle,
    color: 'bg-yellow-50 border-yellow-500 text-yellow-700'
  },
  { 
    value: 'needs-attention', 
    label: 'Needs Attention', 
    description: 'Repairs or replacement needed',
    icon: XCircle,
    color: 'bg-red-50 border-red-500 text-red-700'
  }
];

export function AddPropertyConditionModal({ open, onOpenChange }: AddPropertyConditionModalProps) {
  const [currentStep, setCurrentStep] = useState<'overview' | 'room-detail'>('overview');
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [conditions, setConditions] = useState<Record<string, RoomCondition>>({});
  
  const [generalInfo, setGeneralInfo] = useState({
    inspectionDate: new Date().toISOString().split('T')[0],
    inspector: '',
    overallNotes: '',
    yearBuilt: '',
    lastRenovation: ''
  });

  const handleStatusSelect = (roomId: string, status: typeof statusOptions[0]['value']) => {
    setConditions(prev => ({
      ...prev,
      [roomId]: {
        ...prev[roomId],
        roomId,
        status: status as RoomCondition['status'],
        notes: prev[roomId]?.notes || '',
        issues: prev[roomId]?.issues || []
      }
    }));
  };

  const handleNotesChange = (roomId: string, notes: string) => {
    setConditions(prev => ({
      ...prev,
      [roomId]: {
        ...prev[roomId],
        roomId,
        status: prev[roomId]?.status || 'not-assessed',
        notes,
        issues: prev[roomId]?.issues || []
      }
    }));
  };

  const handleAddIssue = (roomId: string) => {
    const newIssue: Issue = {
      id: Math.random().toString(36).substr(2, 9),
      description: '',
      severity: 'minor',
      estimatedCost: '',
      photos: []
    };

    setConditions(prev => ({
      ...prev,
      [roomId]: {
        ...prev[roomId],
        roomId,
        status: prev[roomId]?.status || 'not-assessed',
        notes: prev[roomId]?.notes || '',
        issues: [...(prev[roomId]?.issues || []), newIssue]
      }
    }));
  };

  const handleUpdateIssue = (roomId: string, issueId: string, field: keyof Issue, value: any) => {
    setConditions(prev => ({
      ...prev,
      [roomId]: {
        ...prev[roomId],
        issues: prev[roomId]?.issues.map(issue =>
          issue.id === issueId ? { ...issue, [field]: value } : issue
        ) || []
      }
    }));
  };

  const handleRemoveIssue = (roomId: string, issueId: string) => {
    setConditions(prev => ({
      ...prev,
      [roomId]: {
        ...prev[roomId],
        issues: prev[roomId]?.issues.filter(issue => issue.id !== issueId) || []
      }
    }));
  };

  const handleSelectRoom = (roomId: string) => {
    setSelectedRoomId(roomId);
    setCurrentStep('room-detail');
  };

  const handleBackToOverview = () => {
    setCurrentStep('overview');
    setSelectedRoomId(null);
  };

  const handleSubmit = () => {
    console.log('Submitting property condition:', { generalInfo, conditions });
    onOpenChange(false);
  };

  const selectedRoom = rooms.find(r => r.id === selectedRoomId);
  const selectedCondition = selectedRoomId ? conditions[selectedRoomId] : undefined;
  
  const totalAssessed = Object.values(conditions).filter(c => c.status !== 'not-assessed').length;
  const needsAttention = Object.values(conditions).filter(c => c.status === 'needs-attention').length;
  
  const groupedRooms = rooms.reduce((acc, room) => {
    if (!acc[room.category]) acc[room.category] = [];
    acc[room.category].push(room);
    return acc;
  }, {} as Record<string, typeof rooms>);

  const getStatusColor = (status: string) => {
    const option = statusOptions.find(s => s.value === status);
    return option?.color || 'bg-gray-50 border-gray-300 text-gray-700';
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed inset-0 md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 bg-white md:rounded-xl shadow-2xl w-full md:max-w-6xl md:max-h-[95vh] overflow-hidden z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center gap-4">
              {currentStep === 'room-detail' && (
                <button
                  onClick={handleBackToOverview}
                  className="p-2 hover:bg-white/60 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-700" />
                </button>
              )}
              <div>
                <Dialog.Title className="text-xl font-semibold text-gray-900">
                  {currentStep === 'overview' ? 'Property Condition Assessment' : selectedRoom?.label}
                </Dialog.Title>
                <Dialog.Description className="text-sm text-gray-600 mt-1">
                  {currentStep === 'overview' 
                    ? 'Document the condition of all property components'
                    : selectedRoom?.category}
                </Dialog.Description>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {currentStep === 'overview' && (
                <div className="text-sm text-gray-600 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
                  {totalAssessed} of {rooms.length} assessed
                </div>
              )}
              <Dialog.Close className="p-2 hover:bg-white/60 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </Dialog.Close>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {currentStep === 'overview' ? (
              <div className="p-6 space-y-6">
                {/* General Information */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    General Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Inspection Date
                      </label>
                      <input
                        type="date"
                        value={generalInfo.inspectionDate}
                        onChange={(e) => setGeneralInfo({ ...generalInfo, inspectionDate: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Inspector Name
                      </label>
                      <input
                        type="text"
                        value={generalInfo.inspector}
                        onChange={(e) => setGeneralInfo({ ...generalInfo, inspector: e.target.value })}
                        placeholder="Your name or inspector's name"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Year Built
                      </label>
                      <input
                        type="text"
                        value={generalInfo.yearBuilt}
                        onChange={(e) => setGeneralInfo({ ...generalInfo, yearBuilt: e.target.value })}
                        placeholder="e.g., 1985"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Major Renovation
                      </label>
                      <input
                        type="text"
                        value={generalInfo.lastRenovation}
                        onChange={(e) => setGeneralInfo({ ...generalInfo, lastRenovation: e.target.value })}
                        placeholder="e.g., 2020 - Kitchen remodel"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Overall Notes
                    </label>
                    <textarea
                      value={generalInfo.overallNotes}
                      onChange={(e) => setGeneralInfo({ ...generalInfo, overallNotes: e.target.value })}
                      rows={3}
                      placeholder="General observations about the property's condition..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>
                </div>

                {/* Stats */}
                {totalAssessed > 0 && (
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="text-sm text-green-700 mb-1">Excellent</div>
                      <div className="text-2xl font-semibold text-green-600">
                        {Object.values(conditions).filter(c => c.status === 'excellent').length}
                      </div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="text-sm text-blue-700 mb-1">Good</div>
                      <div className="text-2xl font-semibold text-blue-600">
                        {Object.values(conditions).filter(c => c.status === 'good').length}
                      </div>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="text-sm text-yellow-700 mb-1">Fair</div>
                      <div className="text-2xl font-semibold text-yellow-600">
                        {Object.values(conditions).filter(c => c.status === 'fair').length}
                      </div>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="text-sm text-red-700 mb-1">Needs Attention</div>
                      <div className="text-2xl font-semibold text-red-600">
                        {needsAttention}
                      </div>
                    </div>
                  </div>
                )}

                {/* Room Categories */}
                {Object.entries(groupedRooms).map(([category, categoryRooms]) => (
                  <div key={category} className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold mb-4">{category}</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {categoryRooms.map((room) => {
                        const Icon = room.icon;
                        const condition = conditions[room.id];
                        const hasIssues = condition?.issues && condition.issues.length > 0;
                        
                        return (
                          <button
                            key={room.id}
                            onClick={() => handleSelectRoom(room.id)}
                            className={`p-4 border-2 rounded-lg text-left transition-all hover:shadow-md ${
                              condition?.status && condition.status !== 'not-assessed'
                                ? getStatusColor(condition.status)
                                : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <Icon className="w-5 h-5" />
                                <span className="font-medium">{room.label}</span>
                              </div>
                              <ChevronRight className="w-5 h-5 opacity-50" />
                            </div>
                            {condition?.status && condition.status !== 'not-assessed' && (
                              <div className="flex items-center justify-between text-xs">
                                <span className="capitalize font-medium">
                                  {condition.status.replace('-', ' ')}
                                </span>
                                {hasIssues && (
                                  <span className="px-2 py-0.5 bg-white/60 rounded-full">
                                    {condition.issues.length} issue{condition.issues.length !== 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                            )}
                            {(!condition || condition.status === 'not-assessed') && (
                              <div className="text-xs text-gray-500">Not assessed</div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Room Detail View */
              <div className="p-6 space-y-6">
                {/* Status Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Condition Status <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {statusOptions.map((option) => {
                      const Icon = option.icon;
                      const isSelected = selectedCondition?.status === option.value;
                      
                      return (
                        <button
                          key={option.value}
                          onClick={() => selectedRoomId && handleStatusSelect(selectedRoomId, option.value)}
                          className={`p-4 border-2 rounded-lg text-left transition-all ${
                            isSelected ? option.color : 'bg-white border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <Icon className={`w-6 h-6 ${isSelected ? '' : 'text-gray-400'}`} />
                            <div>
                              <div className="font-medium text-sm">{option.label}</div>
                              <div className={`text-xs mt-0.5 ${isSelected ? '' : 'text-gray-500'}`}>
                                {option.description}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Detailed Notes
                  </label>
                  <textarea
                    value={selectedCondition?.notes || ''}
                    onChange={(e) => selectedRoomId && handleNotesChange(selectedRoomId, e.target.value)}
                    rows={4}
                    placeholder="Add specific observations, measurements, recent updates, or concerns..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                {/* Issues */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Identified Issues
                    </label>
                    <button
                      onClick={() => selectedRoomId && handleAddIssue(selectedRoomId)}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      Add Issue
                    </button>
                  </div>

                  {selectedCondition?.issues && selectedCondition.issues.length > 0 ? (
                    <div className="space-y-4">
                      {selectedCondition.issues.map((issue, index) => (
                        <div key={issue.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-gray-700">Issue #{index + 1}</span>
                            <button
                              onClick={() => selectedRoomId && handleRemoveIssue(selectedRoomId, issue.id)}
                              className="text-red-600 hover:text-red-700 text-sm"
                            >
                              Remove
                            </button>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Description
                              </label>
                              <textarea
                                value={issue.description}
                                onChange={(e) => selectedRoomId && handleUpdateIssue(selectedRoomId, issue.id, 'description', e.target.value)}
                                rows={2}
                                placeholder="Describe the issue..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Severity
                                </label>
                                <select
                                  value={issue.severity}
                                  onChange={(e) => selectedRoomId && handleUpdateIssue(selectedRoomId, issue.id, 'severity', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                >
                                  <option value="minor">Minor</option>
                                  <option value="moderate">Moderate</option>
                                  <option value="major">Major</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Estimated Cost
                                </label>
                                <input
                                  type="text"
                                  value={issue.estimatedCost}
                                  onChange={(e) => selectedRoomId && handleUpdateIssue(selectedRoomId, issue.id, 'estimatedCost', e.target.value)}
                                  placeholder="e.g., $500-1000"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                />
                              </div>
                            </div>

                            <button className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 text-sm text-gray-600">
                              <Camera className="w-4 h-4" />
                              Add Photos
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                      <ClipboardCheck className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No issues identified</p>
                      <p className="text-xs text-gray-400 mt-1">Click "Add Issue" if repairs or concerns exist</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-6 bg-gray-50 flex items-center justify-between">
            {currentStep === 'overview' ? (
              <>
                <div className="text-sm text-gray-600">
                  {needsAttention > 0 && (
                    <span className="text-red-600 font-medium">{needsAttention} area{needsAttention !== 1 ? 's' : ''} need{needsAttention === 1 ? 's' : ''} attention</span>
                  )}
                </div>
                <div className="flex gap-3">
                  <Dialog.Close className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">
                    Cancel
                  </Dialog.Close>
                  <button
                    onClick={handleSubmit}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    Save Assessment
                  </button>
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={handleBackToOverview}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Overview
                </button>
                <button
                  onClick={() => {
                    // Find next room
                    const currentIndex = rooms.findIndex(r => r.id === selectedRoomId);
                    if (currentIndex < rooms.length - 1) {
                      setSelectedRoomId(rooms[currentIndex + 1].id);
                    } else {
                      handleBackToOverview();
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  Next Room
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
