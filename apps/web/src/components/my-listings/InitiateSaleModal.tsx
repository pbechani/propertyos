'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  X,
  DollarSign,
  Calendar,
  Users,
  Building,
  FileText,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Home,
  Percent,
  Clock,
  Shield,
  Banknote,
  User,
  Phone,
  Mail,
  Calculator,
  Info,
  ChevronRight,
  CheckSquare,
  Plus,
  Trash2
} from 'lucide-react';

interface InitiateSaleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingPrice: number;
}

const financingTypes = [
  {
    id: 'conventional',
    label: 'Conventional',
    description: 'Standard mortgage loan',
    icon: Building,
    color: 'bg-blue-50 border-blue-500 text-blue-700'
  },
  {
    id: 'fha',
    label: 'FHA',
    description: 'Federal Housing Administration',
    icon: Shield,
    color: 'bg-green-50 border-green-500 text-green-700'
  },
  {
    id: 'va',
    label: 'VA Loan',
    description: 'Veterans Affairs loan',
    icon: Shield,
    color: 'bg-purple-50 border-purple-500 text-purple-700'
  },
  {
    id: 'cash',
    label: 'Cash',
    description: 'No financing needed',
    icon: Banknote,
    color: 'bg-amber-50 border-amber-500 text-amber-700'
  },
  {
    id: 'usda',
    label: 'USDA',
    description: 'Rural development loan',
    icon: Home,
    color: 'bg-emerald-50 border-emerald-500 text-emerald-700'
  },
  {
    id: 'other',
    label: 'Other',
    description: 'Other financing type',
    icon: FileText,
    color: 'bg-gray-50 border-gray-500 text-gray-700'
  }
];

const contingencies = [
  { id: 'inspection', label: 'Home Inspection', recommended: true },
  { id: 'financing', label: 'Financing Contingency', recommended: true },
  { id: 'appraisal', label: 'Appraisal Contingency', recommended: true },
  { id: 'sale-of-home', label: 'Sale of Buyer\'s Current Home', recommended: false },
  { id: 'hoa-review', label: 'HOA Review', recommended: false },
  { id: 'title', label: 'Title Review', recommended: true }
];

export function InitiateSaleModal({ open, onOpenChange, listingPrice }: InitiateSaleModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [buyers, setBuyers] = useState([
    {
      id: 1,
      buyerName: '',
      buyerEmail: '',
      buyerPhone: ''
    }
  ]);
  
  const [formData, setFormData] = useState({
    // Step 1: Offer Details
    salePrice: listingPrice,
    offerAcceptedDate: new Date().toISOString().split('T')[0],
    closingDate: '',
    earnestMoney: 0,
    
    // Step 2: Buyer Agent Information
    buyerAgentName: '',
    buyerAgentCompany: '',
    buyerAgentEmail: '',
    buyerAgentPhone: '',
    
    // Step 3: Financing Details
    financingType: 'conventional',
    downPaymentPercent: 20,
    downPaymentAmount: 0,
    preApprovalAmount: 0,
    lenderName: '',
    loanOfficerName: '',
    
    // Step 4: Terms & Contingencies
    selectedContingencies: ['inspection', 'financing', 'appraisal', 'title'],
    inspectionDeadline: '',
    financingDeadline: '',
    appraisalDeadline: '',
    sellerConcessions: 0,
    
    // Step 5: Commission
    listingCommission: 3,
    buyerAgentCommission: 3,
    referralFee: 0,
    
    // Additional
    notes: ''
  });

  const addBuyer = () => {
    const newId = Math.max(...buyers.map(b => b.id)) + 1;
    setBuyers([...buyers, {
      id: newId,
      buyerName: '',
      buyerEmail: '',
      buyerPhone: ''
    }]);
  };

  const removeBuyer = (id: number) => {
    if (buyers.length > 1) {
      setBuyers(buyers.filter(b => b.id !== id));
    }
  };

  const updateBuyer = (id: number, field: string, value: string) => {
    setBuyers(buyers.map(b => 
      b.id === id ? { ...b, [field]: value } : b
    ));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const calculateDownPayment = () => {
    return (formData.salePrice * formData.downPaymentPercent) / 100;
  };

  const calculateNetToSeller = () => {
    const listingCommissionAmount = (formData.salePrice * formData.listingCommission) / 100;
    const buyerCommissionAmount = (formData.salePrice * formData.buyerAgentCommission) / 100;
    const totalCommission = listingCommissionAmount + buyerCommissionAmount;
    return formData.salePrice - totalCommission - formData.sellerConcessions;
  };

  const calculateYourCommission = () => {
    return (formData.salePrice * formData.listingCommission) / 100;
  };

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    console.log('Initiating sale:', formData);
    onOpenChange(false);
    // Reset form
    setTimeout(() => {
      setCurrentStep(1);
    }, 300);
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.salePrice > 0 && formData.offerAcceptedDate && formData.closingDate && formData.earnestMoney > 0;
      case 2:
        return buyers.some(b => b.buyerName.trim() !== '') && formData.buyerAgentName.trim() !== '';
      case 3:
        return formData.financingType && formData.downPaymentPercent >= 0;
      case 4:
        return true; // Optional fields
      case 5:
        return formData.listingCommission >= 0 && formData.buyerAgentCommission >= 0;
      default:
        return false;
    }
  };

  const steps = [
    { number: 1, title: 'Offer Details', icon: DollarSign },
    { number: 2, title: 'Buyer Info', icon: Users },
    { number: 3, title: 'Financing', icon: Building },
    { number: 4, title: 'Terms', icon: FileText },
    { number: 5, title: 'Commission', icon: Percent }
  ];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <Dialog.Title className="text-xl font-semibold text-gray-900">
                  Initiate Sale
                </Dialog.Title>
                <Dialog.Description className="text-sm text-gray-600 mt-1">
                  Record accepted offer and move to Under Contract
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close className="p-2 hover:bg-white/60 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </Dialog.Close>
          </div>

          {/* Progress Steps */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = currentStep === step.number;
                const isCompleted = currentStep > step.number;
                
                return (
                  <div key={step.number} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        isActive 
                          ? 'bg-green-600 text-white' 
                          : isCompleted 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-gray-200 text-gray-400'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <Icon className="w-5 h-5" />
                        )}
                      </div>
                      <div className={`text-xs mt-2 font-medium ${
                        isActive ? 'text-green-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                      }`}>
                        {step.title}
                      </div>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`h-0.5 flex-1 mx-2 ${
                        isCompleted ? 'bg-green-600' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Step 1: Offer Details */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-blue-900">Offer Acceptance</div>
                      <p className="text-sm text-blue-700 mt-1">
                        Enter the details of the accepted offer. This will move the property to "Under Contract" status.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <DollarSign className="w-4 h-4 inline mr-1" />
                      Sale Price <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        value={formData.salePrice}
                        onChange={(e) => setFormData(prev => ({ ...prev, salePrice: parseFloat(e.target.value) || 0 }))}
                        className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="0"
                      />
                    </div>
                    {formData.salePrice !== listingPrice && (
                      <p className="text-xs mt-2 flex items-center gap-1">
                        {formData.salePrice > listingPrice ? (
                          <span className="text-green-600">
                            <TrendingUp className="w-3 h-3 inline" /> +{formatCurrency(formData.salePrice - listingPrice)} above asking
                          </span>
                        ) : (
                          <span className="text-amber-600">
                            {formatCurrency(listingPrice - formData.salePrice)} below asking
                          </span>
                        )}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Banknote className="w-4 h-4 inline mr-1" />
                      Earnest Money Deposit <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        value={formData.earnestMoney}
                        onChange={(e) => setFormData(prev => ({ ...prev, earnestMoney: parseFloat(e.target.value) || 0 }))}
                        className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="0"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Typical: 1-3% of sale price ({formatCurrency(formData.salePrice * 0.01)} - {formatCurrency(formData.salePrice * 0.03)})
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Offer Accepted Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.offerAcceptedDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, offerAcceptedDate: e.target.value }))}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Expected Closing Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.closingDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, closingDate: e.target.value }))}
                      min={formData.offerAcceptedDate}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    {formData.closingDate && formData.offerAcceptedDate && (
                      <p className="text-xs text-gray-500 mt-2">
                        {Math.ceil((new Date(formData.closingDate).getTime() - new Date(formData.offerAcceptedDate).getTime()) / (1000 * 60 * 60 * 24))} days from acceptance
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Buyer Agent Information */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-purple-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-purple-900">Buyer Information</div>
                      <p className="text-sm text-purple-700 mt-1">
                        Enter buyer and buyer's agent details for record keeping and communication.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Buyer Details
                    </h3>
                    <button
                      type="button"
                      onClick={addBuyer}
                      className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      Add Buyer
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {buyers.map((buyer, index) => (
                      <div key={buyer.id} className="p-4 border-2 border-gray-200 rounded-lg bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-gray-700">
                            Buyer {index + 1} {index === 0 && buyers.length > 1 && <span className="text-purple-600">(Primary)</span>}
                          </span>
                          {buyers.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeBuyer(buyer.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={buyer.buyerName}
                              onChange={(e) => updateBuyer(buyer.id, 'buyerName', e.target.value)}
                              placeholder="e.g., Jennifer Martinez"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Email
                            </label>
                            <input
                              type="email"
                              value={buyer.buyerEmail}
                              onChange={(e) => updateBuyer(buyer.id, 'buyerEmail', e.target.value)}
                              placeholder="buyer@example.com"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Phone
                            </label>
                            <input
                              type="tel"
                              value={buyer.buyerPhone}
                              onChange={(e) => updateBuyer(buyer.id, 'buyerPhone', e.target.value)}
                              placeholder="(555) 123-4567"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Building className="w-5 h-5" />
                    Buyer's Agent
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Agent Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.buyerAgentName}
                        onChange={(e) => setFormData(prev => ({ ...prev, buyerAgentName: e.target.value }))}
                        placeholder="e.g., Robert Chen"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Brokerage/Company
                      </label>
                      <input
                        type="text"
                        value={formData.buyerAgentCompany}
                        onChange={(e) => setFormData(prev => ({ ...prev, buyerAgentCompany: e.target.value }))}
                        placeholder="e.g., ABC Realty"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Mail className="w-4 h-4 inline mr-1" />
                        Agent Email
                      </label>
                      <input
                        type="email"
                        value={formData.buyerAgentEmail}
                        onChange={(e) => setFormData(prev => ({ ...prev, buyerAgentEmail: e.target.value }))}
                        placeholder="agent@example.com"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Phone className="w-4 h-4 inline mr-1" />
                        Agent Phone
                      </label>
                      <input
                        type="tel"
                        value={formData.buyerAgentPhone}
                        onChange={(e) => setFormData(prev => ({ ...prev, buyerAgentPhone: e.target.value }))}
                        placeholder="(555) 987-6543"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Financing Details */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Building className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-blue-900">Financing Details</div>
                      <p className="text-sm text-blue-700 mt-1">
                        Specify how the buyer will finance the purchase.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Financing Type <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {financingTypes.map((type) => {
                      const Icon = type.icon;
                      const isSelected = formData.financingType === type.id;
                      
                      return (
                        <button
                          key={type.id}
                          onClick={() => setFormData(prev => ({ ...prev, financingType: type.id }))}
                          className={`p-4 border-2 rounded-lg text-left transition-all ${
                            isSelected ? type.color : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <Icon className={`w-6 h-6 mb-2 ${isSelected ? '' : 'text-gray-400'}`} />
                          <div className="font-medium text-sm">{type.label}</div>
                          <div className={`text-xs mt-1 ${isSelected ? 'opacity-80' : 'text-gray-500'}`}>
                            {type.description}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {formData.financingType !== 'cash' && (
                  <>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Percent className="w-4 h-4 inline mr-1" />
                          Down Payment Percentage
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={formData.downPaymentPercent}
                            onChange={(e) => setFormData(prev => ({ ...prev, downPaymentPercent: parseFloat(e.target.value) || 0 }))}
                            min="0"
                            max="100"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Amount: {formatCurrency(calculateDownPayment())}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <DollarSign className="w-4 h-4 inline mr-1" />
                          Pre-approval Amount
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                          <input
                            type="number"
                            value={formData.preApprovalAmount}
                            onChange={(e) => setFormData(prev => ({ ...prev, preApprovalAmount: parseFloat(e.target.value) || 0 }))}
                            className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Lender Name
                        </label>
                        <input
                          type="text"
                          value={formData.lenderName}
                          onChange={(e) => setFormData(prev => ({ ...prev, lenderName: e.target.value }))}
                          placeholder="e.g., First National Bank"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Loan Officer Name
                        </label>
                        <input
                          type="text"
                          value={formData.loanOfficerName}
                          onChange={(e) => setFormData(prev => ({ ...prev, loanOfficerName: e.target.value }))}
                          placeholder="e.g., John Smith"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step 4: Terms & Contingencies */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-amber-900">Contract Terms</div>
                      <p className="text-sm text-amber-700 mt-1">
                        Select applicable contingencies and set important deadlines.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Contingencies</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {contingencies.map((contingency) => (
                      <label
                        key={contingency.id}
                        className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          formData.selectedContingencies.includes(contingency.id)
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.selectedContingencies.includes(contingency.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData(prev => ({
                                ...prev,
                                selectedContingencies: [...prev.selectedContingencies, contingency.id]
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                selectedContingencies: prev.selectedContingencies.filter(c => c !== contingency.id)
                              }));
                            }
                          }}
                          className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 mt-0.5"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-sm">{contingency.label}</div>
                          {contingency.recommended && (
                            <span className="text-xs text-green-600 mt-1 inline-block">Recommended</span>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Key Deadlines</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Clock className="w-4 h-4 inline mr-1" />
                        Inspection Deadline
                      </label>
                      <input
                        type="date"
                        value={formData.inspectionDeadline}
                        onChange={(e) => setFormData(prev => ({ ...prev, inspectionDeadline: e.target.value }))}
                        min={formData.offerAcceptedDate}
                        max={formData.closingDate}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Clock className="w-4 h-4 inline mr-1" />
                        Financing Deadline
                      </label>
                      <input
                        type="date"
                        value={formData.financingDeadline}
                        onChange={(e) => setFormData(prev => ({ ...prev, financingDeadline: e.target.value }))}
                        min={formData.offerAcceptedDate}
                        max={formData.closingDate}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Clock className="w-4 h-4 inline mr-1" />
                        Appraisal Deadline
                      </label>
                      <input
                        type="date"
                        value={formData.appraisalDeadline}
                        onChange={(e) => setFormData(prev => ({ ...prev, appraisalDeadline: e.target.value }))}
                        min={formData.offerAcceptedDate}
                        max={formData.closingDate}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    Seller Concessions (if any)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={formData.sellerConcessions}
                      onChange={(e) => setFormData(prev => ({ ...prev, sellerConcessions: parseFloat(e.target.value) || 0 }))}
                      className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="0"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Credits for repairs, closing costs, etc.
                  </p>
                </div>
              </div>
            )}

            {/* Step 5: Commission */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Percent className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-green-900">Commission Structure</div>
                      <p className="text-sm text-green-700 mt-1">
                        Confirm commission percentages and calculate your earnings.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Percent className="w-4 h-4 inline mr-1" />
                      Your Commission (Listing Side)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.listingCommission}
                        onChange={(e) => setFormData(prev => ({ ...prev, listingCommission: parseFloat(e.target.value) || 0 }))}
                        min="0"
                        max="100"
                        step="0.5"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                    </div>
                    <p className="text-xs text-green-600 mt-2 font-medium">
                      Your earnings: {formatCurrency(calculateYourCommission())}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Percent className="w-4 h-4 inline mr-1" />
                      Buyer Agent Commission
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.buyerAgentCommission}
                        onChange={(e) => setFormData(prev => ({ ...prev, buyerAgentCommission: parseFloat(e.target.value) || 0 }))}
                        min="0"
                        max="100"
                        step="0.5"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Amount: {formatCurrency((formData.salePrice * formData.buyerAgentCommission) / 100)}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    Referral Fee (if applicable)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={formData.referralFee}
                      onChange={(e) => setFormData(prev => ({ ...prev, referralFee: parseFloat(e.target.value) || 0 }))}
                      className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Calculator className="w-5 h-5 text-green-700" />
                    <h3 className="font-semibold text-green-900">Financial Summary</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-green-200">
                      <span className="text-gray-700">Sale Price</span>
                      <span className="font-semibold text-lg">{formatCurrency(formData.salePrice)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-green-200">
                      <span className="text-gray-700">Your Commission ({formData.listingCommission}%)</span>
                      <span className="font-semibold text-green-600">+{formatCurrency(calculateYourCommission())}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-green-200">
                      <span className="text-gray-700">Buyer Agent Commission ({formData.buyerAgentCommission}%)</span>
                      <span className="font-medium text-red-600">-{formatCurrency((formData.salePrice * formData.buyerAgentCommission) / 100)}</span>
                    </div>
                    {formData.sellerConcessions > 0 && (
                      <div className="flex justify-between items-center py-2 border-b border-green-200">
                        <span className="text-gray-700">Seller Concessions</span>
                        <span className="font-medium text-red-600">-{formatCurrency(formData.sellerConcessions)}</span>
                      </div>
                    )}
                    {formData.referralFee > 0 && (
                      <div className="flex justify-between items-center py-2 border-b border-green-200">
                        <span className="text-gray-700">Referral Fee</span>
                        <span className="font-medium text-red-600">-{formatCurrency(formData.referralFee)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center py-3 border-t-2 border-green-300">
                      <span className="font-semibold text-gray-900">Estimated Net to Seller</span>
                      <span className="font-bold text-xl text-green-700">{formatCurrency(calculateNetToSeller())}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    placeholder="Add any additional notes about this sale..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                {currentStep > 1 && (
                  <button
                    onClick={handleBack}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Back
                  </button>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                {!isStepValid() && (
                  <span className="text-sm text-amber-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    Please fill in all required fields
                  </span>
                )}
                
                {currentStep < 5 ? (
                  <button
                    onClick={handleNext}
                    disabled={!isStepValid()}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    Next Step
                    <ChevronRight className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={!isStepValid()}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <CheckSquare className="w-5 h-5" />
                    Initiate Sale
                  </button>
                )}
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}