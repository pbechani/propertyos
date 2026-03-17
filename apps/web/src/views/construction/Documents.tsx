'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Filter, FileText, Download, Eye } from 'lucide-react';
import { mockDocuments } from '@/views/construction/data/mockData';

export function Documents() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Document Management</h1>
          <p className="text-gray-500 mt-1">Organize and manage project documents</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Upload Document
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder="Search documents..." className="pl-10" />
            </div>
            <Button variant="outline"><Filter className="w-4 h-4 mr-2" />Filters</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {['All', 'Contracts', 'Drawings', 'Permits', 'Reports'].map((type, i) => (
          <Button key={i} variant={i === 0 ? 'default' : 'outline'} className="w-full">
            {type}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockDocuments.map((doc) => (
          <Card key={doc.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 truncate">{doc.name}</h4>
                  <p className="text-sm text-gray-500 mt-1">{doc.category}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={doc.status === 'approved' ? 'default' : 'secondary'} className="text-xs">
                      {doc.status}
                    </Badge>
                    <Badge variant="outline" className="text-xs">{doc.type}</Badge>
                  </div>
                  <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                    <span>v{doc.version}</span>
                    <span>{doc.size}</span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Eye className="w-3 h-3 mr-1" />View
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Download className="w-3 h-3 mr-1" />Download
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
