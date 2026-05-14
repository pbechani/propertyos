'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  Plus,
  Filter,
  Download,
  CheckCircle,
  Clock,
  Truck,
  Package,
  XCircle,
  AlertCircle,
  Eye,
  ThumbsUp,
  PackageCheck,
  DollarSign,
  Calendar,
  Building2,
  FileText
} from 'lucide-react';
import { mockPurchaseOrders } from '@/views/construction/data/mockData';
import type { PurchaseOrder } from '@/views/construction/types';

export function PurchaseOrders() {
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [_showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'in-transit':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-gray-100 text-gray-800';
      case 'pending-approval':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-gray-100 text-gray-600';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'partially-delivered':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'in-transit':
        return <Truck className="w-4 h-4" />;
      case 'delivered':
        return <PackageCheck className="w-4 h-4" />;
      case 'pending-approval':
        return <Clock className="w-4 h-4" />;
      case 'draft':
        return <FileText className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      case 'partially-delivered':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const filterPOsByStatus = (status: string) => {
    if (status === 'all') return mockPurchaseOrders;
    return mockPurchaseOrders.filter(po => po.status === status);
  };

  const filteredPOs = filterPOsByStatus(activeTab).filter(po =>
    po.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    po.supplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
    po.projectName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: mockPurchaseOrders.length,
    pendingApproval: mockPurchaseOrders.filter(po => po.status === 'pending-approval').length,
    inTransit: mockPurchaseOrders.filter(po => po.status === 'in-transit').length,
    delivered: mockPurchaseOrders.filter(po => po.status === 'delivered').length,
    totalValue: mockPurchaseOrders.reduce((sum, po) => sum + po.totalValue, 0)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Purchase Orders</h1>
          <p className="text-gray-500 mt-1">Manage procurement and material orders</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create PO
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total POs</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Package className="w-8 h-8 text-blue-600 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Approval</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pendingApproval}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Transit</p>
                <p className="text-2xl font-bold text-blue-600">{stats.inTransit}</p>
              </div>
              <Truck className="w-8 h-8 text-blue-600 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Delivered</p>
                <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
              </div>
              <PackageCheck className="w-8 h-8 text-green-600 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-purple-600">
                  ${(stats.totalValue / 1000000).toFixed(1)}M
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-600 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by PO number, supplier, or project..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs and Table */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">All ({mockPurchaseOrders.length})</TabsTrigger>
          <TabsTrigger value="pending-approval">
            Pending ({mockPurchaseOrders.filter(po => po.status === 'pending-approval').length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({mockPurchaseOrders.filter(po => po.status === 'approved').length})
          </TabsTrigger>
          <TabsTrigger value="in-transit">
            In Transit ({mockPurchaseOrders.filter(po => po.status === 'in-transit').length})
          </TabsTrigger>
          <TabsTrigger value="delivered">
            Delivered ({mockPurchaseOrders.filter(po => po.status === 'delivered').length})
          </TabsTrigger>
          <TabsTrigger value="draft">
            Draft ({mockPurchaseOrders.filter(po => po.status === 'draft').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Purchase Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        PO Number
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Supplier
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Materials
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Value
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Delivery Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPOs.map((po) => (
                      <tr
                        key={po.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedPO(po)}
                      >
                        <td className="px-4 py-4">
                          <div>
                            <p className="font-semibold text-gray-900">{po.poNumber}</p>
                            <p className="text-xs text-gray-500">{po.projectName}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900">{po.supplier}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="max-w-xs">
                            <p className="text-sm text-gray-900 font-medium truncate">
                              {po.items[0].material}
                            </p>
                            {po.items.length > 1 && (
                              <Badge variant="secondary" className="mt-1 text-xs">
                                +{po.items.length - 1} more
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm font-bold text-gray-900">
                            ${po.totalValue.toLocaleString()}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-700">
                              {new Date(po.deliveryDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <Badge className={`${getStatusColor(po.status)} flex items-center gap-1 w-fit`}>
                            {getStatusIcon(po.status)}
                            <span className="capitalize">{po.status.replace('-', ' ')}</span>
                          </Badge>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            {po.status === 'pending-approval' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 hover:bg-green-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Handle approval
                                }}
                              >
                                <ThumbsUp className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                            )}
                            {(po.status === 'approved' || po.status === 'in-transit') && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedPO(po);
                                }}
                              >
                                <Truck className="w-4 h-4 mr-1" />
                                Track
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPO(po);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredPOs.length === 0 && (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No purchase orders found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* PO Detail Modal */}
      {selectedPO && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedPO.poNumber}</h2>
                  <p className="text-gray-500 mt-1">{selectedPO.projectName}</p>
                </div>
                <button
                  onClick={() => setSelectedPO(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Status and Tracking */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Status</p>
                  <Badge className={`${getStatusColor(selectedPO.status)} flex items-center gap-1 w-fit`}>
                    {getStatusIcon(selectedPO.status)}
                    <span className="capitalize">{selectedPO.status.replace('-', ' ')}</span>
                  </Badge>
                </div>
                {selectedPO.trackingNumber && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Tracking Number</p>
                    <p className="font-mono text-sm font-medium">{selectedPO.trackingNumber}</p>
                  </div>
                )}
              </div>

              {/* Supplier and Dates */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Supplier</p>
                  <p className="font-semibold text-gray-900">{selectedPO.supplier}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Order Date</p>
                  <p className="text-gray-900">
                    {new Date(selectedPO.orderDate).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Expected Delivery</p>
                  <p className="text-gray-900">
                    {new Date(selectedPO.deliveryDate).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                {selectedPO.actualDelivery && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Actual Delivery</p>
                    <p className="text-green-700 font-medium">
                      {new Date(selectedPO.actualDelivery).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                )}
              </div>

              {/* Items Table */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Order Items</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Material
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Category
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Quantity
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Unit Price
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedPO.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900">{item.material}</p>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="text-xs">
                              {item.category}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-gray-900">
                              {item.quantity.toLocaleString()} {item.unit}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-gray-900">${item.unitPrice.toLocaleString()}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="font-semibold text-gray-900">
                              ${item.totalPrice.toLocaleString()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={4} className="px-4 py-3 text-right font-semibold text-gray-900">
                          Total Value:
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-lg font-bold text-gray-900">
                            ${selectedPO.totalValue.toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Delivery Address</p>
                  <p className="text-gray-900">{selectedPO.deliveryAddress}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Payment Terms</p>
                  <p className="text-gray-900">{selectedPO.paymentTerms}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Requested By</p>
                  <p className="text-gray-900">{selectedPO.requestedBy}</p>
                </div>
                {selectedPO.approvedBy && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Approved By</p>
                    <p className="text-gray-900">{selectedPO.approvedBy}</p>
                  </div>
                )}
              </div>

              {selectedPO.notes && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Notes</p>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedPO.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <Button variant="outline" onClick={() => setSelectedPO(null)}>
                  Close
                </Button>
                {selectedPO.status === 'pending-approval' && (
                  <Button className="bg-green-600 hover:bg-green-700">
                    <ThumbsUp className="w-4 h-4 mr-2" />
                    Approve PO
                  </Button>
                )}
                {(selectedPO.status === 'approved' || selectedPO.status === 'in-transit') && (
                  <Button>
                    <Truck className="w-4 h-4 mr-2" />
                    Track Delivery
                  </Button>
                )}
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
