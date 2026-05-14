'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { 
  Search, 
  Plus, 
  Filter,
  Star,
  TrendingUp,
  Award,
  Mail,
  Phone,
  FileCheck,
  Shield
} from 'lucide-react';
import { mockContractors } from '@/views/construction/data/mockData';
import { useNavigate } from '@/lib/router-compat';

export function Contractors() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contractors</h1>
          <p className="text-gray-500 mt-1">Manage contractor relationships and performance</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Contractor
        </Button>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                placeholder="Search contractors..." 
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{mockContractors.length}</p>
              <p className="text-sm text-gray-600 mt-1">Total Contractors</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {mockContractors.filter(c => c.status === 'active').length}
              </p>
              <p className="text-sm text-gray-600 mt-1">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">4.6</p>
              <p className="text-sm text-gray-600 mt-1">Avg Rating</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">19</p>
              <p className="text-sm text-gray-600 mt-1">Active Projects</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contractors Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {mockContractors.map((contractor) => (
          <Card key={contractor.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {contractor.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{contractor.name}</h3>
                      <p className="text-sm text-gray-500">{contractor.type}</p>
                    </div>
                  </div>
                </div>
                <Badge variant={contractor.status === 'active' ? 'default' : 'secondary'}>
                  {contractor.status}
                </Badge>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-4 h-4 ${i < Math.floor(contractor.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium">{contractor.rating}</span>
                <span className="text-sm text-gray-500">({contractor.projectsCompleted} projects)</span>
              </div>

              {/* Performance */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">Performance Score</span>
                  <span className="font-medium">{contractor.performance}%</span>
                </div>
                <Progress value={contractor.performance} />
              </div>

              {/* Specialties */}
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Specialties</p>
                <div className="flex flex-wrap gap-2">
                  {contractor.specialties.map((specialty, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <TrendingUp className="w-4 h-4" />
                    Active Projects
                  </div>
                  <p className="font-medium text-lg">{contractor.activeProjects}</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <Award className="w-4 h-4" />
                    Completed
                  </div>
                  <p className="font-medium text-lg">{contractor.projectsCompleted}</p>
                </div>
              </div>

              {/* Compliance */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 mt-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <FileCheck className="w-4 h-4" />
                    License
                  </div>
                  <p className="text-xs font-mono">{contractor.license}</p>
                  <p className="text-xs text-gray-500">Exp: {new Date(contractor.licenseExpiry).toLocaleDateString()}</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <Shield className="w-4 h-4" />
                    Insurance
                  </div>
                  <p className="text-xs font-mono">{contractor.insurance}</p>
                  <p className="text-xs text-gray-500">Exp: {new Date(contractor.insuranceExpiry).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Contact */}
              <div className="pt-4 border-t border-gray-200 mt-4">
                <p className="text-sm text-gray-600 mb-2">Contact</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{contractor.contact}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span>{contractor.email}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4">
                <Button className="flex-1" size="sm" onClick={() => navigate(`/construction/contractors/${contractor.id}`)}>View Profile</Button>
                <Button variant="outline" className="flex-1" size="sm">View Contracts</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}