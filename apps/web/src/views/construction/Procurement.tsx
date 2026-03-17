'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Filter, Package, Truck, Clock, AlertCircle } from 'lucide-react';
import { mockMaterials } from '@/views/construction/data/mockData';

export function Procurement() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Procurement & Materials</h1>
          <p className="text-gray-500 mt-1">Manage suppliers, materials, and purchase orders</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Purchase Order
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder="Search materials..." className="pl-10" />
            </div>
            <Button variant="outline"><Filter className="w-4 h-4 mr-2" />Filters</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders', value: mockMaterials.length, icon: Package, color: 'blue' },
          { label: 'In Transit', value: mockMaterials.filter(m => m.status === 'in-transit').length, icon: Truck, color: 'purple' },
          { label: 'Pending', value: mockMaterials.filter(m => m.status === 'ordered').length, icon: Clock, color: 'orange' },
          { label: 'Delayed', value: mockMaterials.filter(m => m.status === 'delayed').length, icon: AlertCircle, color: 'red' }
        ].map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`w-10 h-10 bg-${stat.color}-100 rounded-full flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Material Orders</CardTitle>
          <CardDescription>Track all material purchases and deliveries</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockMaterials.map((material) => (
              <div key={material.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{material.name}</h4>
                    <p className="text-sm text-gray-500">{material.supplier}</p>
                  </div>
                  <Badge variant={
                    material.status === 'delivered' ? 'default' :
                    material.status === 'in-transit' ? 'secondary' :
                    material.status === 'delayed' ? 'destructive' : 'outline'
                  }>
                    {material.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Category</p>
                    <p className="font-medium">{material.category}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Quantity</p>
                    <p className="font-medium">{material.quantity} {material.unit}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Unit Price</p>
                    <p className="font-medium">${material.unitPrice}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Total Cost</p>
                    <p className="font-medium">${material.totalCost.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Delivery Date</p>
                    <p className="font-medium">{new Date(material.deliveryDate).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
