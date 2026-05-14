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
  AlertTriangle,
  Search,
  Plus,
  Eye,
  Shield,
  Clock,
  CheckCircle,
  BarChart3,
  User,
  DollarSign
} from 'lucide-react';
import { mockRisks } from '@/views/construction/data/risks';
import type { Risk } from '@/views/construction/types';

export function RiskManagementDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [probabilityFilter, setProbabilityFilter] = useState('all');
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Calculate statistics
  const stats = {
    total: mockRisks.length,
    critical: mockRisks.filter(r => r.severity === 'critical').length,
    monitoring: mockRisks.filter(r => r.status === 'monitoring').length,
    mitigated: mockRisks.filter(r => r.status === 'mitigated').length,
    highProb: mockRisks.filter(r => r.probability === 'high').length,
    totalCost: mockRisks.reduce((sum, r) => sum + (r.cost || 0), 0)
  };

  // Filter risks
  const filteredRisks = mockRisks.filter(risk => {
    const matchesSearch = 
      risk.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      risk.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      risk.owner.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || risk.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || risk.status === statusFilter;
    const matchesProbability = probabilityFilter === 'all' || risk.probability === probabilityFilter;
    
    return matchesSearch && matchesCategory && matchesStatus && matchesProbability;
  });

  // Heatmap calculation
  const getHeatmapData = () => {
    const data: { [key: string]: number } = {};
    
    mockRisks.forEach(risk => {
      const key = `${risk.probability}-${risk.impact}`;
      data[key] = (data[key] || 0) + 1;
    });
    
    return data;
  };

  const heatmapData = getHeatmapData();

  const getHeatmapColor = (probability: string, impact: string) => {
    const score = {
      low: 1,
      medium: 2,
      high: 3,
      critical: 4
    };

    const probScore = score[probability as keyof typeof score] || 1;
    const impactScore = score[impact as keyof typeof score] || 1;
    const total = probScore * impactScore;

    if (total >= 9) return 'bg-red-600 hover:bg-red-700 border-red-700';
    if (total >= 6) return 'bg-red-500 hover:bg-red-600 border-red-600';
    if (total >= 4) return 'bg-yellow-500 hover:bg-yellow-600 border-yellow-600';
    if (total >= 2) return 'bg-yellow-400 hover:bg-yellow-500 border-yellow-500';
    return 'bg-green-500 hover:bg-green-600 border-green-600';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'mitigated': return 'bg-green-100 text-green-800';
      case 'monitoring': return 'bg-blue-100 text-blue-800';
      case 'identified': return 'bg-yellow-100 text-yellow-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'safety': return 'bg-red-100 text-red-800';
      case 'budget': return 'bg-purple-100 text-purple-800';
      case 'schedule': return 'bg-blue-100 text-blue-800';
      case 'quality': return 'bg-orange-100 text-orange-800';
      case 'technical': return 'bg-cyan-100 text-cyan-800';
      case 'regulatory': return 'bg-pink-100 text-pink-800';
      case 'environmental': return 'bg-green-100 text-green-800';
      case 'contractual': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewDetails = (risk: Risk) => {
    setSelectedRisk(risk);
    setShowDetailModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Risk Management</h1>
          <p className="text-gray-500 mt-1">Monitor and manage project risks</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add New Risk
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Risks</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-blue-600 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Critical Risks</p>
                <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
              </div>
              <Shield className="w-8 h-8 text-red-600 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Under Monitoring</p>
                <p className="text-2xl font-bold text-blue-600">{stats.monitoring}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-600 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Mitigated</p>
                <p className="text-2xl font-bold text-green-600">{stats.mitigated}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-orange-600" />
            Risk Heatmap - Probability vs Impact
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              {/* Heatmap Grid */}
              <div className="flex gap-2 items-end">
                {/* Y-axis Label */}
                <div className="flex flex-col justify-center items-center mr-2">
                  <div className="transform -rotate-90 whitespace-nowrap text-sm font-semibold text-gray-700 mb-8">
                    Probability
                  </div>
                </div>

                {/* Grid */}
                <div className="flex-1">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="p-2 border-2 border-gray-300 bg-gray-50"></th>
                        <th className="p-2 border-2 border-gray-300 bg-gray-50 text-xs font-semibold text-gray-700">
                          Low Impact
                        </th>
                        <th className="p-2 border-2 border-gray-300 bg-gray-50 text-xs font-semibold text-gray-700">
                          Medium Impact
                        </th>
                        <th className="p-2 border-2 border-gray-300 bg-gray-50 text-xs font-semibold text-gray-700">
                          High Impact
                        </th>
                        <th className="p-2 border-2 border-gray-300 bg-gray-50 text-xs font-semibold text-gray-700">
                          Critical Impact
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {['high', 'medium', 'low'].map((probability) => (
                        <tr key={probability}>
                          <td className="p-2 border-2 border-gray-300 bg-gray-50 text-xs font-semibold text-gray-700 whitespace-nowrap">
                            {probability.charAt(0).toUpperCase() + probability.slice(1)} Probability
                          </td>
                          {['low', 'medium', 'high', 'critical'].map((impact) => {
                            const count = heatmapData[`${probability}-${impact}`] || 0;
                            return (
                              <td
                                key={`${probability}-${impact}`}
                                className="border-2 border-gray-300 p-0"
                              >
                                <div
                                  className={`w-full h-24 flex items-center justify-center cursor-pointer transition-colors ${getHeatmapColor(
                                    probability,
                                    impact
                                  )}`}
                                  title={`${count} risk(s): ${probability} probability, ${impact} impact`}
                                >
                                  <div className="text-center text-white">
                                    <div className="text-3xl font-bold">{count}</div>
                                    <div className="text-xs opacity-90">
                                      {count === 1 ? 'Risk' : 'Risks'}
                                    </div>
                                  </div>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {/* X-axis Label */}
                  <div className="text-center mt-2">
                    <span className="text-sm font-semibold text-gray-700">Impact</span>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="mt-6 flex items-center justify-center gap-6 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span className="text-sm text-gray-600">Low Risk (1-2)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-400 rounded"></div>
                  <span className="text-sm text-gray-600">Medium Risk (3-4)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                  <span className="text-sm text-gray-600">Elevated Risk (6)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span className="text-sm text-gray-600">High Risk (9)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-600 rounded"></div>
                  <span className="text-sm text-gray-600">Critical Risk (12+)</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search risks..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="schedule">Schedule</SelectItem>
                <SelectItem value="budget">Budget</SelectItem>
                <SelectItem value="safety">Safety</SelectItem>
                <SelectItem value="quality">Quality</SelectItem>
                <SelectItem value="regulatory">Regulatory</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
                <SelectItem value="environmental">Environmental</SelectItem>
                <SelectItem value="contractual">Contractual</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="identified">Identified</SelectItem>
                <SelectItem value="monitoring">Monitoring</SelectItem>
                <SelectItem value="mitigated">Mitigated</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={probabilityFilter} onValueChange={setProbabilityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by probability" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Probabilities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Risk Registry Table */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Registry</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Risk
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Probability
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Impact
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Mitigation Plan
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Owner
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRisks.map((risk) => (
                  <tr key={risk.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="max-w-md">
                        <p className="font-semibold text-gray-900 mb-1">{risk.title}</p>
                        <p className="text-xs text-gray-500 mb-2 line-clamp-2">{risk.description}</p>
                        <div className="flex gap-2">
                          <Badge className={getCategoryColor(risk.category)}>
                            {risk.category}
                          </Badge>
                          <Badge className={getSeverityColor(risk.severity)}>
                            {risk.severity}
                          </Badge>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <Badge
                        className={
                          risk.probability === 'high'
                            ? 'bg-red-100 text-red-800'
                            : risk.probability === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }
                      >
                        {risk.probability}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <Badge
                        className={
                          risk.impact === 'critical'
                            ? 'bg-red-100 text-red-800'
                            : risk.impact === 'high'
                            ? 'bg-orange-100 text-orange-800'
                            : risk.impact === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }
                      >
                        {risk.impact}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-gray-900 max-w-md line-clamp-3">
                        {risk.mitigationPlan}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{risk.owner}</p>
                        <p className="text-xs text-gray-500">{risk.ownerRole}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <Badge className={getStatusColor(risk.status)}>
                        {risk.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDetails(risk)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredRisks.length === 0 && (
              <div className="text-center py-12">
                <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No risks found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Risk Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedRisk && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>{selectedRisk.title}</span>
                  <div className="flex gap-2">
                    <Badge className={getSeverityColor(selectedRisk.severity)}>
                      {selectedRisk.severity}
                    </Badge>
                    <Badge className={getStatusColor(selectedRisk.status)}>
                      {selectedRisk.status}
                    </Badge>
                  </div>
                </DialogTitle>
                <DialogDescription>
                  {selectedRisk.projectName} • {selectedRisk.category}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Risk Overview */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-sm text-gray-700">{selectedRisk.description}</p>
                </div>

                {/* Risk Metrics */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Probability</p>
                    <Badge
                      className={
                        selectedRisk.probability === 'high'
                          ? 'bg-red-100 text-red-800'
                          : selectedRisk.probability === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }
                    >
                      {selectedRisk.probability}
                    </Badge>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Impact</p>
                    <Badge
                      className={
                        selectedRisk.impact === 'critical'
                          ? 'bg-red-100 text-red-800'
                          : selectedRisk.impact === 'high'
                          ? 'bg-orange-100 text-orange-800'
                          : selectedRisk.impact === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }
                    >
                      {selectedRisk.impact}
                    </Badge>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Category</p>
                    <Badge className={getCategoryColor(selectedRisk.category)}>
                      {selectedRisk.category}
                    </Badge>
                  </div>
                </div>

                {/* Mitigation Plan */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Mitigation Plan</h3>
                  <p className="text-sm text-gray-700 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    {selectedRisk.mitigationPlan}
                  </p>
                </div>

                {/* Contingency Plan */}
                {selectedRisk.contingencyPlan && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Contingency Plan</h3>
                    <p className="text-sm text-gray-700 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      {selectedRisk.contingencyPlan}
                    </p>
                  </div>
                )}

                {/* Owner & Dates */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Owner Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{selectedRisk.owner}</span>
                      </div>
                      <p className="text-gray-600 ml-6">{selectedRisk.ownerRole}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Important Dates</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Identified:</span>
                        <span className="font-medium">
                          {new Date(selectedRisk.dateIdentified).toLocaleDateString()}
                        </span>
                      </div>
                      {selectedRisk.targetCloseDate && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Target Close:</span>
                          <span className="font-medium">
                            {new Date(selectedRisk.targetCloseDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {selectedRisk.actualCloseDate && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Closed:</span>
                          <span className="font-medium">
                            {new Date(selectedRisk.actualCloseDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Cost Impact */}
                {selectedRisk.cost !== undefined && selectedRisk.cost > 0 && (
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-purple-600" />
                        <span className="font-semibold text-gray-900">Estimated Cost Impact</span>
                      </div>
                      <span className="text-xl font-bold text-purple-600">
                        ${selectedRisk.cost.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}

                {/* Action Items */}
                {selectedRisk.actions && selectedRisk.actions.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Action Items</h3>
                    <div className="space-y-2">
                      {selectedRisk.actions.map((action) => (
                        <div
                          key={action.id}
                          className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 mb-1">
                                {action.description}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-gray-600">
                                <span>Responsible: {action.responsible}</span>
                                <span>Due: {new Date(action.dueDate).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <Badge
                              className={
                                action.status === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : action.status === 'in-progress'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                              }
                            >
                              {action.status}
                            </Badge>
                          </div>
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
