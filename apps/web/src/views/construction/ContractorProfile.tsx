'use client';

import { useParams, useNavigate } from '@/lib/router-compat';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Calendar,
  Users,
  Star,
  Award,
  Shield,
  FileText,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Clock,
  Target,
  MessageSquare,
  Edit,
  Ban,
  Download
} from 'lucide-react';
import { mockContractors } from '@/views/construction/data/mockData';

export function ContractorProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const contractor = mockContractors.find(c => c.id === id);

  if (!contractor) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Contractor not found</h2>
          <Button onClick={() => navigate('/construction/contractors')}>Back to Contractors</Button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-600';
      case 'pending':
        return 'text-yellow-600';
      case 'overdue':
        return 'text-red-600';
      case 'partial':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'overdue':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const totalPaid = contractor.paymentHistory?.filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0) || 0;
  
  const totalPending = contractor.paymentHistory?.filter(p => p.status === 'pending' || p.status === 'overdue')
    .reduce((sum, p) => sum + p.amount, 0) || 0;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <Button variant="ghost" onClick={() => navigate('/construction/contractors')} className="pl-0">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Contractors
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{contractor.name}</h1>
              <Badge variant={contractor.status === 'active' ? 'default' : 'destructive'}>
                {contractor.status}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-gray-600">
              <span className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                {contractor.type}
              </span>
              <span className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                {contractor.rating} Rating
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <MessageSquare className="w-4 h-4 mr-2" />
            Message
          </Button>
          <Button variant="outline">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" className="text-red-600 hover:bg-red-50">
            <Ban className="w-4 h-4 mr-2" />
            Suspend
          </Button>
        </div>
      </div>

      {/* Company Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              Company Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-gray-700 leading-relaxed">{contractor.description}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Contact Person</p>
                  <p className="font-medium text-gray-900">{contractor.contact}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Email</p>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <a href={`mailto:${contractor.email}`} className="text-blue-600 hover:underline">
                      {contractor.email}
                    </a>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Phone</p>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <a href={`tel:${contractor.phone}`} className="text-gray-900">
                      {contractor.phone}
                    </a>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Website</p>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-gray-400" />
                    <a href={`https://${contractor.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {contractor.website}
                    </a>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Address</p>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <p className="text-gray-900">{contractor.address}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Established</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <p className="font-medium text-gray-900">{contractor.yearEstablished}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Employees</p>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <p className="font-medium text-gray-900">{contractor.employeeCount}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-sm font-medium text-gray-900 mb-3">Specialties</p>
              <div className="flex flex-wrap gap-2">
                {contractor.specialties.map((specialty, index) => (
                  <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700">
                    {specialty}
                  </Badge>
                ))}
              </div>
            </div>

            {contractor.certifications && contractor.certifications.length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-3">Certifications</p>
                  <div className="flex flex-wrap gap-2">
                    {contractor.certifications.map((cert, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        {cert}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Stats Sidebar */}
        <div className="space-y-6">
          {/* Performance Metrics Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Overall Performance</span>
                  <span className="text-sm font-bold text-gray-900">{contractor.performance}%</span>
                </div>
                <Progress value={contractor.performance} className="h-2" />
              </div>
              
              {contractor.safetyRating && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Safety Rating</span>
                    <span className="text-sm font-bold text-green-700">{contractor.safetyRating}%</span>
                  </div>
                  <Progress value={contractor.safetyRating} className="h-2" />
                </div>
              )}

              {contractor.qualityScore && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Quality Score</span>
                    <span className="text-sm font-bold text-blue-700">{contractor.qualityScore}%</span>
                  </div>
                  <Progress value={contractor.qualityScore} className="h-2" />
                </div>
              )}

              {contractor.onTimeDelivery && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">On-Time Delivery</span>
                    <span className="text-sm font-bold text-purple-700">{contractor.onTimeDelivery}%</span>
                  </div>
                  <Progress value={contractor.onTimeDelivery} className="h-2" />
                </div>
              )}

              {contractor.communicationScore && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Communication</span>
                    <span className="text-sm font-bold text-orange-700">{contractor.communicationScore}%</span>
                  </div>
                  <Progress value={contractor.communicationScore} className="h-2" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Project Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Project Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="text-xs text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-700">{contractor.projectsCompleted}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-xs text-gray-600">Active Projects</p>
                  <p className="text-2xl font-bold text-blue-700">{contractor.activeProjects}</p>
                </div>
                <Target className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          {/* Payment Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                Payment Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-gray-600 mb-1">Total Paid</p>
                <p className="text-xl font-bold text-green-700">
                  ${totalPaid.toLocaleString()}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-xs text-gray-600 mb-1">Outstanding</p>
                <p className="text-xl font-bold text-orange-700">
                  ${totalPending.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Detailed Information Tabs */}
      <Tabs defaultValue="licenses" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="licenses">Licenses</TabsTrigger>
          <TabsTrigger value="insurance">Insurance</TabsTrigger>
          <TabsTrigger value="projects">Past Projects</TabsTrigger>
          <TabsTrigger value="payments">Payment History</TabsTrigger>
        </TabsList>

        {/* Licenses Tab */}
        <TabsContent value="licenses">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  Licenses & Permits
                </CardTitle>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Download All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {contractor.licenses && contractor.licenses.length > 0 ? (
                <div className="space-y-4">
                  {contractor.licenses.map((license) => (
                    <div key={license.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-1">{license.type}</h4>
                          <p className="text-sm text-gray-600">License # {license.number}</p>
                        </div>
                        <Badge className={getStatusColor(license.status)}>
                          {license.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500 text-xs mb-1">Issued By</p>
                          <p className="font-medium text-gray-900">{license.issuedBy}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs mb-1">Issue Date</p>
                          <p className="text-gray-900">
                            {new Date(license.issueDate).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs mb-1">Expiry Date</p>
                          <p className="text-gray-900">
                            {new Date(license.expiryDate).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                          </p>
                        </div>
                        <div className="flex items-center justify-end">
                          <Button variant="ghost" size="sm">
                            <FileText className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Shield className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No license information available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insurance Tab */}
        <TabsContent value="insurance">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  Insurance Policies
                </CardTitle>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Download All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {contractor.insurancePolicies && contractor.insurancePolicies.length > 0 ? (
                <div className="space-y-4">
                  {contractor.insurancePolicies.map((policy) => (
                    <div key={policy.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-1">{policy.type}</h4>
                          <p className="text-sm text-gray-600">{policy.provider}</p>
                        </div>
                        <Badge className={getStatusColor(policy.status)}>
                          {policy.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500 text-xs mb-1">Policy Number</p>
                          <p className="font-medium text-gray-900">{policy.policyNumber}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs mb-1">Coverage</p>
                          <p className="font-bold text-green-700">{policy.coverage}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs mb-1">Effective Date</p>
                          <p className="text-gray-900">
                            {new Date(policy.effectiveDate).toLocaleDateString('en-US', { 
                              month: 'short', 
                              year: 'numeric' 
                            })}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs mb-1">Expiry Date</p>
                          <p className="text-gray-900">
                            {new Date(policy.expiryDate).toLocaleDateString('en-US', { 
                              month: 'short', 
                              year: 'numeric' 
                            })}
                          </p>
                        </div>
                        <div className="flex items-center justify-end">
                          <Button variant="ghost" size="sm">
                            <FileText className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Shield className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No insurance information available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Past Projects Tab */}
        <TabsContent value="projects">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-600" />
                Past Projects
                {contractor.pastProjects && (
                  <Badge variant="secondary">{contractor.pastProjects.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {contractor.pastProjects && contractor.pastProjects.length > 0 ? (
                <div className="space-y-4">
                  {contractor.pastProjects.map((project) => (
                    <div key={project.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-1">{project.name}</h4>
                          <p className="text-sm text-gray-600">{project.client}</p>
                        </div>
                        <div className="flex items-center gap-1 text-yellow-500">
                          <Star className="w-4 h-4 fill-yellow-500" />
                          <span className="font-semibold">{project.rating}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Project Value</p>
                          <p className="font-bold text-green-700">
                            ${(project.value / 1000000).toFixed(1)}M
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Duration</p>
                          <p className="text-gray-900">{project.duration}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Completed</p>
                          <p className="text-gray-900">
                            {new Date(project.completionDate).toLocaleDateString('en-US', { 
                              month: 'short', 
                              year: 'numeric' 
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Building2 className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No past projects available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment History Tab */}
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  Payment History
                  {contractor.paymentHistory && (
                    <Badge variant="secondary">{contractor.paymentHistory.length}</Badge>
                  )}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {contractor.paymentHistory && contractor.paymentHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {contractor.paymentHistory.map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-gray-900">{payment.invoiceNumber}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm text-gray-900">{payment.projectName}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-bold text-gray-900">
                              ${payment.amount.toLocaleString()}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm text-gray-700">
                              {new Date(payment.dueDate).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                year: 'numeric' 
                              })}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm text-gray-700">
                              {payment.paidDate ? 
                                new Date(payment.paidDate).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric',
                                  year: 'numeric' 
                                })
                                : '—'}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <div className={`flex items-center gap-1 ${getPaymentStatusColor(payment.status)}`}>
                              {getPaymentStatusIcon(payment.status)}
                              <span className="text-sm font-medium capitalize">{payment.status}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No payment history available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
