'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  Search,
  Plus,
  Eye,
  DollarSign,
  Calendar,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Clock,
  FileCheck,
  User,
  Paperclip,
  MapPin
} from 'lucide-react';
import { mockChangeOrders } from '@/views/construction/data/changeOrders';
import type { ChangeOrder } from '@/views/construction/types';

export function ChangeOrderManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [approvalFilter, setApprovalFilter] = useState('all');
  const [selectedChangeOrder, setSelectedChangeOrder] = useState<ChangeOrder | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Calculate statistics
  const stats = {
    total: mockChangeOrders.length,
    pending: mockChangeOrders.filter(co => co.status === 'under-review' || co.status === 'submitted').length,
    approved: mockChangeOrders.filter(co => co.status === 'approved').length,
    totalCostImpact: mockChangeOrders
      .filter(co => co.status === 'approved' || co.status === 'implemented')
      .reduce((sum, co) => sum + co.costImpact, 0),
    totalScheduleImpact: mockChangeOrders
      .filter(co => co.status === 'approved' || co.status === 'implemented')
      .reduce((sum, co) => sum + co.scheduleImpact, 0),
    savings: mockChangeOrders
      .filter(co => co.costImpact < 0 && (co.status === 'approved' || co.status === 'implemented'))
      .reduce((sum, co) => sum + Math.abs(co.costImpact), 0)
  };

  // Filter change orders
  const filteredChangeOrders = mockChangeOrders.filter(co => {
    const matchesSearch = 
      co.changeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      co.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      co.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || co.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || co.category === categoryFilter;
    const matchesApproval = approvalFilter === 'all' || co.approvalStage === approvalFilter;
    
    return matchesSearch && matchesStatus && matchesCategory && matchesApproval;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'implemented': return 'bg-blue-100 text-blue-800';
      case 'under-review': return 'bg-yellow-100 text-yellow-800';
      case 'submitted': return 'bg-orange-100 text-orange-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getApprovalStageColor = (stage: string) => {
    switch (stage) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'final-approval': return 'bg-purple-100 text-purple-800';
      case 'client-approval': return 'bg-blue-100 text-blue-800';
      case 'cost-review': return 'bg-yellow-100 text-yellow-800';
      case 'technical-review': return 'bg-orange-100 text-orange-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'design': return 'bg-purple-100 text-purple-800';
      case 'scope': return 'bg-blue-100 text-blue-800';
      case 'site-conditions': return 'bg-orange-100 text-orange-800';
      case 'client-request': return 'bg-pink-100 text-pink-800';
      case 'regulatory': return 'bg-red-100 text-red-800';
      case 'unforeseen': return 'bg-yellow-100 text-yellow-800';
      case 'value-engineering': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    const isNegative = amount < 0;
    const formatted = Math.abs(amount).toLocaleString();
    return isNegative ? `-$${formatted}` : `$${formatted}`;
  };

  const formatScheduleImpact = (days: number) => {
    if (days === 0) return 'No impact';
    const isNegative = days < 0;
    const absDays = Math.abs(days);
    const text = `${absDays} ${absDays === 1 ? 'day' : 'days'}`;
    return isNegative ? `-${text}` : `+${text}`;
  };

  const getApprovalProgress = (approvals: ChangeOrder['approvals']) => {
    const total = approvals.length;
    const approved = approvals.filter(a => a.status === 'approved').length;
    return { approved, total, percentage: (approved / total) * 100 };
  };

  const handleViewDetails = (co: ChangeOrder) => {
    setSelectedChangeOrder(co);
    setShowDetailModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Change Order Management</h1>
          <p className="text-gray-500 mt-1">Track and manage project change orders</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Change Order
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Change Orders</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Cost Impact</p>
                <p className={`text-2xl font-bold ${stats.totalCostImpact >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(stats.totalCostImpact)}
                </p>
              </div>
              <DollarSign className={`w-8 h-8 ${stats.totalCostImpact >= 0 ? 'text-red-600' : 'text-green-600'} opacity-80`} />
            </div>
            {stats.savings > 0 && (
              <p className="text-xs text-green-600 mt-1">
                ${stats.savings.toLocaleString()} in savings
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Schedule Impact</p>
                <p className={`text-2xl font-bold ${stats.totalScheduleImpact > 0 ? 'text-orange-600' : 'text-gray-900'}`}>
                  {formatScheduleImpact(stats.totalScheduleImpact)}
                </p>
              </div>
              <Calendar className={`w-8 h-8 ${stats.totalScheduleImpact > 0 ? 'text-orange-600' : 'text-gray-600'} opacity-80`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search change orders..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="under-review">Under Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="implemented">Implemented</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="design">Design</SelectItem>
                <SelectItem value="scope">Scope</SelectItem>
                <SelectItem value="site-conditions">Site Conditions</SelectItem>
                <SelectItem value="client-request">Client Request</SelectItem>
                <SelectItem value="regulatory">Regulatory</SelectItem>
                <SelectItem value="unforeseen">Unforeseen</SelectItem>
                <SelectItem value="value-engineering">Value Engineering</SelectItem>
              </SelectContent>
            </Select>

            <Select value={approvalFilter} onValueChange={setApprovalFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by approval stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="technical-review">Technical Review</SelectItem>
                <SelectItem value="cost-review">Cost Review</SelectItem>
                <SelectItem value="client-approval">Client Approval</SelectItem>
                <SelectItem value="final-approval">Final Approval</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Change Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Change Orders ({filteredChangeOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Change ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Description
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Cost Impact
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Schedule Impact
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Approval Stage
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredChangeOrders.map((co) => {
                  const approvalProgress = getApprovalProgress(co.approvals);
                  return (
                    <tr key={co.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">{co.changeId}</p>
                          <p className="text-xs text-gray-500">{co.projectName}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="max-w-md">
                          <p className="font-medium text-gray-900 mb-1">{co.title}</p>
                          <p className="text-xs text-gray-600 line-clamp-2 mb-2">{co.description}</p>
                          <div className="flex gap-2 flex-wrap">
                            <Badge className={getCategoryColor(co.category)}>
                              {co.category.replace('-', ' ')}
                            </Badge>
                            <Badge className={getPriorityColor(co.priority)}>
                              {co.priority}
                            </Badge>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {co.costImpact >= 0 ? (
                            <TrendingUp className="w-4 h-4 text-red-600" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-green-600" />
                          )}
                          <span className={`font-semibold ${co.costImpact >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {formatCurrency(co.costImpact)}
                          </span>
                        </div>
                        {co.finalCost !== undefined && co.finalCost !== co.costImpact && (
                          <p className="text-xs text-gray-500 mt-1">
                            Final: {formatCurrency(co.finalCost)}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className={`font-medium ${co.scheduleImpact > 0 ? 'text-orange-600' : co.scheduleImpact < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                          {formatScheduleImpact(co.scheduleImpact)}
                        </span>
                        {co.finalScheduleImpact !== undefined && co.finalScheduleImpact !== co.scheduleImpact && (
                          <p className="text-xs text-gray-500 mt-1">
                            Final: {formatScheduleImpact(co.finalScheduleImpact)}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <Badge className={getStatusColor(co.status)}>
                          {co.status.replace('-', ' ')}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="space-y-1">
                          <Badge className={getApprovalStageColor(co.approvalStage)}>
                            {co.approvalStage.replace('-', ' ')}
                          </Badge>
                          <div className="flex items-center justify-center gap-1 text-xs text-gray-600">
                            <FileCheck className="w-3 h-3" />
                            <span>{approvalProgress.approved}/{approvalProgress.total}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetails(co)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredChangeOrders.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No change orders found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          {selectedChangeOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span>{selectedChangeOrder.changeId}</span>
                    <Badge className={getStatusColor(selectedChangeOrder.status)}>
                      {selectedChangeOrder.status.replace('-', ' ')}
                    </Badge>
                    <Badge className={getPriorityColor(selectedChangeOrder.priority)}>
                      {selectedChangeOrder.priority}
                    </Badge>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Title and Project */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">
                    {selectedChangeOrder.title}
                  </h3>
                  <p className="text-sm text-gray-600">{selectedChangeOrder.projectName}</p>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-600 font-medium mb-1">Category</p>
                    <Badge className={getCategoryColor(selectedChangeOrder.category)}>
                      {selectedChangeOrder.category.replace('-', ' ')}
                    </Badge>
                  </div>
                  <div className={`p-4 rounded-lg border ${selectedChangeOrder.costImpact >= 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                    <p className={`text-xs font-medium mb-1 ${selectedChangeOrder.costImpact >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                      Cost Impact
                    </p>
                    <p className={`text-xl font-bold ${selectedChangeOrder.costImpact >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(selectedChangeOrder.costImpact)}
                    </p>
                  </div>
                  <div className={`p-4 rounded-lg border ${selectedChangeOrder.scheduleImpact > 0 ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'}`}>
                    <p className={`text-xs font-medium mb-1 ${selectedChangeOrder.scheduleImpact > 0 ? 'text-orange-600' : 'text-gray-600'}`}>
                      Schedule Impact
                    </p>
                    <p className={`text-xl font-bold ${selectedChangeOrder.scheduleImpact > 0 ? 'text-orange-600' : 'text-gray-600'}`}>
                      {formatScheduleImpact(selectedChangeOrder.scheduleImpact)}
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-xs text-purple-600 font-medium mb-1">Approval Stage</p>
                    <Badge className={getApprovalStageColor(selectedChangeOrder.approvalStage)}>
                      {selectedChangeOrder.approvalStage.replace('-', ' ')}
                    </Badge>
                  </div>
                </div>

                {/* Description and Reason */}
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                    <p className="text-sm text-gray-700 p-4 bg-gray-50 rounded-lg">
                      {selectedChangeOrder.description}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Reason</h4>
                    <p className="text-sm text-gray-700 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      {selectedChangeOrder.reason}
                    </p>
                  </div>
                </div>

                {/* Approval Workflow */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Approval Workflow</h4>
                  <div className="space-y-3">
                    {selectedChangeOrder.approvals.map((approval, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border-2 ${
                          approval.status === 'approved'
                            ? 'bg-green-50 border-green-300'
                            : approval.status === 'rejected'
                            ? 'bg-red-50 border-red-300'
                            : 'bg-gray-50 border-gray-300'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-gray-900">{approval.stage}</span>
                              {approval.status === 'approved' && (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              )}
                              {approval.status === 'rejected' && (
                                <XCircle className="w-5 h-5 text-red-600" />
                              )}
                              {approval.status === 'pending' && (
                                <Clock className="w-5 h-5 text-gray-400" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                              <User className="w-4 h-4" />
                              <span>{approval.approver}</span>
                              <span className="text-gray-400">•</span>
                              <span>{approval.role}</span>
                            </div>
                            {approval.date && (
                              <p className="text-xs text-gray-500 mb-2">
                                {new Date(approval.date).toLocaleDateString()} at {new Date(approval.date).toLocaleTimeString()}
                              </p>
                            )}
                            {approval.comments && (
                              <p className="text-sm text-gray-700 mt-2 italic">
                                "{approval.comments}"
                              </p>
                            )}
                          </div>
                          <Badge
                            className={
                              approval.status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : approval.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }
                          >
                            {approval.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Request Information */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Request Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Requested By:</span>
                        <span className="font-medium text-gray-900">{selectedChangeOrder.requestedBy}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Role:</span>
                        <span className="font-medium text-gray-900">{selectedChangeOrder.requestedByRole}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Request Date:</span>
                        <span className="font-medium text-gray-900">
                          {new Date(selectedChangeOrder.requestDate).toLocaleDateString()}
                        </span>
                      </div>
                      {selectedChangeOrder.requiredByDate && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Required By:</span>
                          <span className="font-medium text-gray-900">
                            {new Date(selectedChangeOrder.requiredByDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Implementation</h4>
                    <div className="space-y-2 text-sm">
                      {selectedChangeOrder.implementationDate && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Implementation Date:</span>
                          <span className="font-medium text-gray-900">
                            {new Date(selectedChangeOrder.implementationDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {selectedChangeOrder.finalCost !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Final Cost:</span>
                          <span className={`font-medium ${selectedChangeOrder.finalCost >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {formatCurrency(selectedChangeOrder.finalCost)}
                          </span>
                        </div>
                      )}
                      {selectedChangeOrder.finalScheduleImpact !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Final Schedule Impact:</span>
                          <span className="font-medium text-gray-900">
                            {formatScheduleImpact(selectedChangeOrder.finalScheduleImpact)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Affected Areas */}
                {selectedChangeOrder.affectedAreas.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Affected Areas</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedChangeOrder.affectedAreas.map((area, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Attachments */}
                {selectedChangeOrder.attachments && selectedChangeOrder.attachments.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Attachments</h4>
                    <div className="space-y-2">
                      {selectedChangeOrder.attachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="flex items-center gap-3">
                            <Paperclip className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="font-medium text-gray-900">{attachment.name}</p>
                              <p className="text-xs text-gray-500">
                                {attachment.type} • {attachment.size}
                              </p>
                            </div>
                          </div>
                          <Button size="sm" variant="outline">
                            Download
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
