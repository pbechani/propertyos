'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  MapPin,
  DollarSign,
  Calendar,
  Users,
  FileText,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from '@/lib/router-compat';

type ProjectFormData = {
  // Project Details
  name: string;
  description: string;
  type: string;
  category: string;
  
  // Location
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  
  // Budget
  totalBudget: string;
  contingency: string;
  fundingSource: string;
  
  // Timeline
  startDate: string;
  endDate: string;
  duration: string;
  
  // Team
  projectManager: string;
  siteEngineer: string;
  contractor: string;
  architect: string;
};

const steps = [
  {
    id: 1,
    name: 'Project Details',
    description: 'Basic information about the project',
    icon: FileText,
  },
  {
    id: 2,
    name: 'Location',
    description: 'Project site information',
    icon: MapPin,
  },
  {
    id: 3,
    name: 'Budget',
    description: 'Financial planning and allocation',
    icon: DollarSign,
  },
  {
    id: 4,
    name: 'Timeline',
    description: 'Schedule and milestones',
    icon: Calendar,
  },
  {
    id: 5,
    name: 'Team Assignment',
    description: 'Assign team members and contractors',
    icon: Users,
  },
];

export function CreateProject() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ProjectFormData>({
    // Project Details
    name: '',
    description: '',
    type: '',
    category: '',
    
    // Location
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
    
    // Budget
    totalBudget: '',
    contingency: '10',
    fundingSource: '',
    
    // Timeline
    startDate: '',
    endDate: '',
    duration: '',
    
    // Team
    projectManager: '',
    siteEngineer: '',
    contractor: '',
    architect: '',
  });

  const updateFormData = (field: keyof ProjectFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    console.log('Project Created:', formData);
    // In a real app, this would send data to the backend
    navigate('/construction/projects');
  };

  const progressPercentage = (currentStep / steps.length) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Create New Project</h1>
        <p className="text-sm text-gray-500 mt-1">Complete all steps to create your construction project</p>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Step {currentStep} of {steps.length}</span>
            <span className="text-sm text-gray-500">{Math.round(progressPercentage)}% Complete</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;
            const StepIcon = step.icon;

            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  {/* Circle */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                      isCompleted
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : isCurrent
                        ? 'bg-blue-50 border-blue-600 text-blue-600'
                        : 'bg-white border-gray-300 text-gray-400'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <StepIcon className="w-5 h-5" />
                    )}
                  </div>

                  {/* Label */}
                  <div className="text-center mt-2 hidden md:block">
                    <p
                      className={`text-xs font-medium ${
                        isCurrent ? 'text-blue-600' : isCompleted ? 'text-gray-900' : 'text-gray-500'
                      }`}
                    >
                      {step.name}
                    </p>
                  </div>
                </div>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-2 ${
                      currentStep > step.id ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              {(() => {
                const StepIcon = steps[currentStep - 1].icon;
                return <StepIcon className="w-6 h-6 text-blue-600" />;
              })()}
            </div>
            <div>
              <CardTitle>{steps[currentStep - 1].name}</CardTitle>
              <CardDescription>{steps[currentStep - 1].description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Step 1: Project Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Riverside Tower Construction"
                  value={formData.name}
                  onChange={(e) => updateFormData('name', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Project Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of the project scope and objectives..."
                  rows={4}
                  value={formData.description}
                  onChange={(e) => updateFormData('description', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="type">Project Type *</Label>
                  <Select value={formData.type} onValueChange={(value) => updateFormData('type', value)}>
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select project type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="residential">Residential</SelectItem>
                      <SelectItem value="industrial">Industrial</SelectItem>
                      <SelectItem value="infrastructure">Infrastructure</SelectItem>
                      <SelectItem value="mixed-use">Mixed-Use</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => updateFormData('category', value)}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new-construction">New Construction</SelectItem>
                      <SelectItem value="renovation">Renovation</SelectItem>
                      <SelectItem value="expansion">Expansion</SelectItem>
                      <SelectItem value="demolition">Demolition</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium">Important</p>
                  <p className="text-blue-700 mt-1">
                    Make sure to provide accurate project details. This information will be used throughout the project lifecycle.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="address">Street Address *</Label>
                <Input
                  id="address"
                  placeholder="123 Main Street"
                  value={formData.address}
                  onChange={(e) => updateFormData('address', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    placeholder="New York"
                    value={formData.city}
                    onChange={(e) => updateFormData('city', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State/Province *</Label>
                  <Input
                    id="state"
                    placeholder="NY"
                    value={formData.state}
                    onChange={(e) => updateFormData('state', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="zipCode">ZIP/Postal Code *</Label>
                  <Input
                    id="zipCode"
                    placeholder="10001"
                    value={formData.zipCode}
                    onChange={(e) => updateFormData('zipCode', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country *</Label>
                  <Select value={formData.country} onValueChange={(value) => updateFormData('country', value)}>
                    <SelectTrigger id="country">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="United States">United States</SelectItem>
                      <SelectItem value="Canada">Canada</SelectItem>
                      <SelectItem value="Mexico">Mexico</SelectItem>
                      <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                      <SelectItem value="Australia">Australia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-gray-600" />
                  <p className="text-sm font-medium text-gray-900">Location Preview</p>
                </div>
                <p className="text-sm text-gray-600">
                  {formData.address || '[Address]'}, {formData.city || '[City]'}, {formData.state || '[State]'} {formData.zipCode || '[ZIP]'}
                </p>
                <p className="text-sm text-gray-600">{formData.country}</p>
              </div>
            </div>
          )}

          {/* Step 3: Budget */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="totalBudget">Total Project Budget *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="totalBudget"
                    type="number"
                    placeholder="15000000"
                    className="pl-10"
                    value={formData.totalBudget}
                    onChange={(e) => updateFormData('totalBudget', e.target.value)}
                  />
                </div>
                <p className="text-xs text-gray-500">Enter the total budget in USD</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contingency">Contingency Reserve (%)</Label>
                <Input
                  id="contingency"
                  type="number"
                  placeholder="10"
                  value={formData.contingency}
                  onChange={(e) => updateFormData('contingency', e.target.value)}
                />
                <p className="text-xs text-gray-500">Recommended: 10-15% of total budget</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fundingSource">Funding Source *</Label>
                <Select value={formData.fundingSource} onValueChange={(value) => updateFormData('fundingSource', value)}>
                  <SelectTrigger id="fundingSource">
                    <SelectValue placeholder="Select funding source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private-equity">Private Equity</SelectItem>
                    <SelectItem value="bank-loan">Bank Loan</SelectItem>
                    <SelectItem value="government-grant">Government Grant</SelectItem>
                    <SelectItem value="mixed-funding">Mixed Funding</SelectItem>
                    <SelectItem value="self-funded">Self-Funded</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.totalBudget && formData.contingency && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Total Budget:</span>
                      <span className="text-sm font-semibold text-gray-900">
                        ${parseFloat(formData.totalBudget).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Contingency ({formData.contingency}%):</span>
                      <span className="text-sm font-semibold text-gray-900">
                        ${((parseFloat(formData.totalBudget) * parseFloat(formData.contingency)) / 100).toLocaleString()}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-green-300">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">Total with Contingency:</span>
                        <span className="text-base font-bold text-green-700">
                          ${(parseFloat(formData.totalBudget) * (1 + parseFloat(formData.contingency) / 100)).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Timeline */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Project Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => updateFormData('startDate', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">Expected Completion Date *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => updateFormData('endDate', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Estimated Duration (months)</Label>
                <Input
                  id="duration"
                  type="number"
                  placeholder="18"
                  value={formData.duration}
                  onChange={(e) => updateFormData('duration', e.target.value)}
                />
                <p className="text-xs text-gray-500">Auto-calculated from start and end dates</p>
              </div>

              {formData.startDate && formData.endDate && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <p className="text-sm font-medium text-gray-900">Timeline Summary</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">Start Date:</span>
                      <span className="font-medium text-gray-900">
                        {new Date(formData.startDate).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">End Date:</span>
                      <span className="font-medium text-gray-900">
                        {new Date(formData.endDate).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm pt-2 border-t border-blue-300">
                      <span className="text-gray-700">Total Duration:</span>
                      <span className="font-semibold text-blue-700">
                        {Math.round(
                          (new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime()) / 
                          (1000 * 60 * 60 * 24 * 30)
                        )} months
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-900">
                  <p className="font-medium">Timeline Tip</p>
                  <p className="text-yellow-700 mt-1">
                    Consider buffer time for permits, approvals, and potential delays when setting your timeline.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Team Assignment */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="projectManager">Project Manager *</Label>
                <Select value={formData.projectManager} onValueChange={(value) => updateFormData('projectManager', value)}>
                  <SelectTrigger id="projectManager">
                    <SelectValue placeholder="Select project manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sarah-johnson">Sarah Johnson</SelectItem>
                    <SelectItem value="michael-chen">Michael Chen</SelectItem>
                    <SelectItem value="emily-rodriguez">Emily Rodriguez</SelectItem>
                    <SelectItem value="david-kim">David Kim</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="siteEngineer">Site Engineer *</Label>
                <Select value={formData.siteEngineer} onValueChange={(value) => updateFormData('siteEngineer', value)}>
                  <SelectTrigger id="siteEngineer">
                    <SelectValue placeholder="Select site engineer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="john-williams">John Williams</SelectItem>
                    <SelectItem value="lisa-anderson">Lisa Anderson</SelectItem>
                    <SelectItem value="robert-taylor">Robert Taylor</SelectItem>
                    <SelectItem value="jennifer-lee">Jennifer Lee</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contractor">Primary Contractor *</Label>
                <Select value={formData.contractor} onValueChange={(value) => updateFormData('contractor', value)}>
                  <SelectTrigger id="contractor">
                    <SelectValue placeholder="Select contractor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buildtech">BuildTech Solutions</SelectItem>
                    <SelectItem value="steel-frame">Steel & Frame Co.</SelectItem>
                    <SelectItem value="megabuild">MegaBuild Inc.</SelectItem>
                    <SelectItem value="premier">Premier Construction</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="architect">Architect</Label>
                <Select value={formData.architect} onValueChange={(value) => updateFormData('architect', value)}>
                  <SelectTrigger id="architect">
                    <SelectValue placeholder="Select architect (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="design-studio">Modern Design Studio</SelectItem>
                    <SelectItem value="urban-architects">Urban Architects LLC</SelectItem>
                    <SelectItem value="green-design">Green Design Partners</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-gray-600" />
                  <p className="text-sm font-medium text-gray-900">Team Summary</p>
                </div>
                <div className="space-y-2">
                  {formData.projectManager && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">PM</Badge>
                      <span className="text-sm text-gray-700">{formData.projectManager.replace('-', ' ')}</span>
                    </div>
                  )}
                  {formData.siteEngineer && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">Engineer</Badge>
                      <span className="text-sm text-gray-700">{formData.siteEngineer.replace('-', ' ')}</span>
                    </div>
                  )}
                  {formData.contractor && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">Contractor</Badge>
                      <span className="text-sm text-gray-700">{formData.contractor.replace('-', ' ')}</span>
                    </div>
                  )}
                  {formData.architect && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">Architect</Badge>
                      <span className="text-sm text-gray-700">{formData.architect.replace('-', ' ')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-4">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => navigate('/construction/projects')}
          >
            Cancel
          </Button>

          {currentStep < steps.length ? (
            <Button onClick={handleNext}>
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
              <Check className="w-4 h-4 mr-2" />
              Create Project
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
