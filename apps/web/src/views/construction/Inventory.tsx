'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Search,
  Plus,
  Filter,
  Download,
  Package,
  AlertTriangle,
  TrendingDown,
  DollarSign,
  MapPin,
  Building2,
  RefreshCw,
  ShoppingCart,
  BarChart3,
  Layers
} from 'lucide-react';
import { mockInventoryItems } from '@/views/construction/data/mockData';
import type { InventoryItem } from '@/views/construction/types';

export function Inventory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Calculate statistics
  const stats = {
    totalItems: mockInventoryItems.length,
    lowStock: mockInventoryItems.filter(item => item.status === 'low-stock').length,
    outOfStock: mockInventoryItems.filter(item => item.status === 'out-of-stock').length,
    totalValue: mockInventoryItems.reduce((sum, item) => sum + item.totalValue, 0)
  };

  // Get low stock alerts
  const lowStockAlerts = mockInventoryItems
    .filter(item => item.status === 'low-stock' || item.status === 'out-of-stock')
    .sort((a, b) => {
      if (a.status === 'out-of-stock') return -1;
      if (b.status === 'out-of-stock') return 1;
      return 0;
    });

  // Get material categories with counts
  const categories = mockInventoryItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = { count: 0, value: 0 };
    }
    acc[item.category].count += 1;
    acc[item.category].value += item.totalValue;
    return acc;
  }, {} as Record<string, { count: number; value: number }>);

  const categoryList = Object.entries(categories).map(([name, data]) => ({
    name,
    count: data.count,
    value: data.value
  })).sort((a, b) => b.value - a.value);

  // Filter items
  const filteredItems = mockInventoryItems.filter(item => {
    const matchesSearch = 
      item.materialName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.supplier.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-stock':
        return 'bg-green-100 text-green-800';
      case 'low-stock':
        return 'bg-yellow-100 text-yellow-800';
      case 'out-of-stock':
        return 'bg-red-100 text-red-800';
      case 'overstocked':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStockPercentage = (item: InventoryItem) => {
    return Math.min((item.quantity / item.reorderPoint) * 100, 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Material Inventory</h1>
          <p className="text-gray-500 mt-1">Track and manage construction materials</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Sync
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Material
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalItems}</p>
              </div>
              <Package className="w-8 h-8 text-blue-600 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.lowStock}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-600 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">{stats.outOfStock}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-600 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-purple-600">
                  ${(stats.totalValue / 1000).toFixed(0)}K
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-600 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Inventory Table */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search & Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search materials, SKU, or supplier..."
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

          {/* Inventory Table */}
          <Card>
            <CardHeader>
              <CardTitle>Stock Levels</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Material Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Quantity
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Supplier
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Location
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 cursor-pointer">
                        <td className="px-4 py-4">
                          <div>
                            <p className="font-semibold text-gray-900">{item.materialName}</p>
                            <p className="text-xs text-gray-500">{item.sku}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="min-w-[120px]">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-bold text-gray-900">
                                {item.quantity.toLocaleString()} {item.unit}
                              </span>
                              <span className="text-xs text-gray-500">
                                {getStockPercentage(item).toFixed(0)}%
                              </span>
                            </div>
                            <Progress 
                              value={getStockPercentage(item)} 
                              className="h-1.5"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Min: {item.minimumStock} {item.unit}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900">{item.supplier}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-700">{item.location}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <Badge className={`${getStatusColor(item.status)} capitalize`}>
                            {item.status.replace('-', ' ')}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredItems.length === 0 && (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No materials found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-6">
          {/* Low Stock Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                Low Stock Alerts
                <Badge variant="destructive" className="ml-auto">
                  {lowStockAlerts.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lowStockAlerts.length > 0 ? (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {lowStockAlerts.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-lg border ${
                        item.status === 'out-of-stock'
                          ? 'bg-red-50 border-red-200'
                          : 'bg-yellow-50 border-yellow-200'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-gray-900 truncate">
                            {item.materialName}
                          </p>
                          <p className="text-xs text-gray-600 mt-0.5">{item.sku}</p>
                        </div>
                        {item.status === 'out-of-stock' && (
                          <Badge variant="destructive" className="text-xs">
                            OUT
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">
                          Current: <span className="font-bold">{item.quantity} {item.unit}</span>
                        </span>
                        <span className="text-gray-600">
                          Min: {item.minimumStock} {item.unit}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full mt-2 text-xs"
                      >
                        <ShoppingCart className="w-3 h-3 mr-1" />
                        Reorder
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Package className="w-12 h-12 text-green-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">All stock levels healthy</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Material Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Layers className="w-5 h-5 text-blue-600" />
                Material Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`w-full p-3 rounded-lg text-left transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-blue-50 border-2 border-blue-200'
                      : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm text-gray-900">All Categories</span>
                    <Badge variant="secondary">{mockInventoryItems.length}</Badge>
                  </div>
                  <p className="text-xs text-gray-600">
                    ${(stats.totalValue / 1000).toFixed(0)}K total value
                  </p>
                </button>

                {categoryList.map((category) => (
                  <button
                    key={category.name}
                    onClick={() => setSelectedCategory(category.name)}
                    className={`w-full p-3 rounded-lg text-left transition-colors ${
                      selectedCategory === category.name
                        ? 'bg-blue-50 border-2 border-blue-200'
                        : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm text-gray-900 truncate">
                        {category.name}
                      </span>
                      <Badge variant="secondary">{category.count}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-600">
                        ${(category.value / 1000).toFixed(1)}K
                      </p>
                      <Progress
                        value={(category.value / stats.totalValue) * 100}
                        className="h-1 w-16"
                      />
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                Inventory Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Most Valuable Category</p>
                <p className="font-bold text-gray-900">{categoryList[0]?.name}</p>
                <p className="text-sm text-gray-700 mt-1">
                  ${(categoryList[0]?.value / 1000).toFixed(1)}K
                </p>
              </div>

              <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Stock Health</p>
                <div className="flex items-center gap-2">
                  <Progress
                    value={((stats.totalItems - stats.lowStock - stats.outOfStock) / stats.totalItems) * 100}
                    className="flex-1 h-2"
                  />
                  <span className="text-sm font-bold text-green-700">
                    {(((stats.totalItems - stats.lowStock - stats.outOfStock) / stats.totalItems) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-yellow-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-yellow-700">{stats.lowStock}</p>
                  <p className="text-xs text-gray-600 mt-1">Need Reorder</p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-red-700">{stats.outOfStock}</p>
                  <p className="text-xs text-gray-600 mt-1">Critical</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
