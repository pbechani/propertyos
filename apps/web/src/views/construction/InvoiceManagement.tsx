'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
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
  Upload,
  Download,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Building2,
  Eye,
  FileCheck,
  Ban,
  Paperclip
} from 'lucide-react';
import { mockInvoices } from '@/views/construction/data/invoices';
import type { Invoice } from '@/views/construction/types';

export function InvoiceManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  // Calculate statistics
  const stats = {
    total: mockInvoices.length,
    pending: mockInvoices.filter(inv => inv.status === 'pending').length,
    approved: mockInvoices.filter(inv => inv.status === 'approved').length,
    overdue: mockInvoices.filter(inv => inv.status === 'overdue').length,
    totalAmount: mockInvoices.reduce((sum, inv) => sum + inv.amount, 0),
    pendingAmount: mockInvoices
      .filter(inv => inv.status === 'pending')
      .reduce((sum, inv) => sum + inv.amount, 0)
  };

  // Filter invoices
  const filteredInvoices = mockInvoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.contractor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.contractorCompany.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'rejected':
        return 'bg-gray-100 text-gray-800';
      case 'draft':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4" />;
      case 'approved':
        return <FileCheck className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'overdue':
        return <AlertCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      case 'draft':
        return <FileText className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date('2026-03-12');
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleApprovePayment = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowApprovalDialog(true);
  };

  const handleViewDetails = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowDetailModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invoice Management</h1>
          <p className="text-gray-500 mt-1">Track and manage contractor invoices</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowUploadDialog(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Upload Invoice
          </Button>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Invoices</p>
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
                <p className="text-sm text-gray-600">Pending Approval</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                <p className="text-xs text-gray-500 mt-1">
                  ${(stats.pendingAmount / 1000).toFixed(0)}K
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-blue-600">{stats.approved}</p>
              </div>
              <FileCheck className="w-8 h-8 text-blue-600 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search invoices, contractor, or description..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Invoice Number
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Contractor
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Due Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredInvoices.map((invoice) => {
                  const daysUntilDue = getDaysUntilDue(invoice.dueDate);
                  return (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">{invoice.invoiceNumber}</p>
                          <p className="text-xs text-gray-500">{invoice.projectName}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{invoice.contractor}</p>
                          <p className="text-xs text-gray-500">{invoice.contractorCompany}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <p className="font-bold text-gray-900">
                          ${invoice.amount.toLocaleString()}
                        </p>
                        {invoice.taxAmount && (
                          <p className="text-xs text-gray-500">
                            +${invoice.taxAmount.toLocaleString()} tax
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="text-sm text-gray-900">
                            {new Date(invoice.dueDate).toLocaleDateString()}
                          </p>
                          {invoice.status !== 'paid' && invoice.status !== 'rejected' && (
                            <p className={`text-xs ${
                              daysUntilDue < 0 
                                ? 'text-red-600 font-medium' 
                                : daysUntilDue <= 7
                                ? 'text-orange-600'
                                : 'text-gray-500'
                            }`}>
                              {daysUntilDue < 0 
                                ? `${Math.abs(daysUntilDue)} days overdue` 
                                : `${daysUntilDue} days left`}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Badge className={`${getStatusColor(invoice.status)} flex items-center gap-1 w-fit`}>
                          {getStatusIcon(invoice.status)}
                          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDetails(invoice)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          {invoice.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => handleApprovePayment(invoice)}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredInvoices.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No invoices found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Invoice Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedInvoice && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>Invoice Details - {selectedInvoice.invoiceNumber}</span>
                  <Badge className={getStatusColor(selectedInvoice.status)}>
                    {selectedInvoice.status.toUpperCase()}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  {selectedInvoice.description}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Invoice Info */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Contractor Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{selectedInvoice.contractorCompany}</span>
                      </div>
                      <p className="text-gray-600">{selectedInvoice.contractor}</p>
                      <p className="text-gray-600">Category: {selectedInvoice.category}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Invoice Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Issue Date:</span>
                        <span className="font-medium">{new Date(selectedInvoice.issueDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Due Date:</span>
                        <span className="font-medium">{new Date(selectedInvoice.dueDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment Terms:</span>
                        <span className="font-medium">{selectedInvoice.paymentTerms}</span>
                      </div>
                      {selectedInvoice.approvedBy && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Approved By:</span>
                          <span className="font-medium">{selectedInvoice.approvedBy}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Line Items */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Line Items</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Description</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Qty</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Unit Price</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedInvoice.lineItems.map((item) => (
                          <tr key={item.id}>
                            <td className="px-4 py-2 text-sm">{item.description}</td>
                            <td className="px-4 py-2 text-sm text-right">{item.quantity.toLocaleString()}</td>
                            <td className="px-4 py-2 text-sm text-right">${item.unitPrice.toLocaleString()}</td>
                            <td className="px-4 py-2 text-sm text-right font-medium">${item.total.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                        <tr>
                          <td colSpan={3} className="px-4 py-2 text-sm font-medium text-right">Subtotal:</td>
                          <td className="px-4 py-2 text-sm font-bold text-right">${selectedInvoice.subtotal.toLocaleString()}</td>
                        </tr>
                        {selectedInvoice.taxAmount && (
                          <tr>
                            <td colSpan={3} className="px-4 py-2 text-sm font-medium text-right">Tax:</td>
                            <td className="px-4 py-2 text-sm font-bold text-right">${selectedInvoice.taxAmount.toLocaleString()}</td>
                          </tr>
                        )}
                        <tr>
                          <td colSpan={3} className="px-4 py-2 text-sm font-bold text-right">Total Amount:</td>
                          <td className="px-4 py-2 text-lg font-bold text-blue-600 text-right">${selectedInvoice.amount.toLocaleString()}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Attachments */}
                {selectedInvoice.attachments && selectedInvoice.attachments.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Attachments</h3>
                    <div className="space-y-2">
                      {selectedInvoice.attachments.map((attachment, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Paperclip className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium">{attachment.name}</span>
                            <span className="text-xs text-gray-500">({attachment.size})</span>
                          </div>
                          <Button size="sm" variant="outline">
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedInvoice.notes && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm font-medium text-yellow-900 mb-1">Notes:</p>
                    <p className="text-sm text-yellow-800">{selectedInvoice.notes}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Payment</DialogTitle>
            <DialogDescription>
              Review and approve payment for invoice {selectedInvoice?.invoiceNumber}
            </DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Contractor:</span>
                  <span className="font-medium">{selectedInvoice.contractorCompany}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Amount:</span>
                  <span className="text-xl font-bold text-blue-600">
                    ${selectedInvoice.amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Due Date:</span>
                  <span className="font-medium">{new Date(selectedInvoice.dueDate).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  className="flex-1" 
                  onClick={() => {
                    setShowApprovalDialog(false);
                    // Handle approval logic
                  }}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve Payment
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowApprovalDialog(false)}
                >
                  <Ban className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Upload Invoice Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload New Invoice</DialogTitle>
            <DialogDescription>
              Upload invoice documents from contractors
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-900 mb-1">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-gray-500">
                PDF, PNG, JPG up to 10MB
              </p>
            </div>
            <Button className="w-full">
              Upload Invoice
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
