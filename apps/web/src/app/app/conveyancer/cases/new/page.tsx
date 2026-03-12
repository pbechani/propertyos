'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Check, ChevronRight, Home, Users, DollarSign, FileText, Sparkles,
} from "lucide-react";
import { conveyancerApi, type CreateCasePayload } from "@/lib/api-client";
import { getAccessToken, getActiveCompanyContext, getStoredUser } from "@/lib/auth-session";

// Map sample UI case-type labels → backend enum values
const CASE_TYPE_MAP: Record<string, string> = {
  "residential-sale": "transfer",
  "commercial":       "transfer",
  "refinance":        "bond_registration",
  "transfer":         "transfer",
};

// Map sample UI priority labels → backend enum values
const PRIORITY_MAP: Record<string, string> = {
  low:    "low",
  medium: "normal",
  high:   "high",
};

type FormData = {
  // Step 1 – Case Type
  caseType: string;
  // Step 2 – Property
  saleId: string;
  propertyAddress: string;
  propertyType: string;
  bedrooms: string;
  bathrooms: string;
  area: string;
  // Step 3 – Parties
  buyerFirstName: string;
  buyerLastName: string;
  buyerEmail: string;
  buyerPhone: string;
  buyerIdNumber: string;
  sellerFirstName: string;
  sellerLastName: string;
  sellerEmail: string;
  sellerPhone: string;
  sellerIdNumber: string;
  agentName: string;
  agentAgency: string;
  agentEmail: string;
  agentPhone: string;
  // Step 4 – Financials
  purchasePrice: string;
  depositAmount: string;
  depositPercentage: string;
  financingType: string;
  bankName: string;
  priority: string;
  assignedTo: string;
  targetCompletionDate: string;
  notes: string;
};

const EMPTY: FormData = {
  caseType:          "residential-sale",
  saleId:            "",
  propertyAddress:   "",
  propertyType:      "residential",
  bedrooms:          "",
  bathrooms:         "",
  area:              "",
  buyerFirstName:    "",
  buyerLastName:     "",
  buyerEmail:        "",
  buyerPhone:        "",
  buyerIdNumber:     "",
  sellerFirstName:   "",
  sellerLastName:    "",
  sellerEmail:       "",
  sellerPhone:       "",
  sellerIdNumber:    "",
  agentName:         "",
  agentAgency:       "",
  agentEmail:        "",
  agentPhone:        "",
  purchasePrice:     "",
  depositAmount:     "",
  depositPercentage: "10",
  financingType:     "mortgage",
  bankName:          "",
  priority:          "medium",
  assignedTo:        "",
  targetCompletionDate: "",
  notes:             "",
};

export default function Page() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(EMPTY);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const steps = [
    { id: 1, name: "Case Type", icon: FileText },
    { id: 2, name: "Property",  icon: Home },
    { id: 3, name: "Parties",   icon: Users },
    { id: 4, name: "Financials",icon: DollarSign },
    { id: 5, name: "Review",    icon: Check },
  ];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      // Auto-calculate deposit amount
      if (name === "purchasePrice" || name === "depositPercentage") {
        const price =
          name === "purchasePrice" ? parseFloat(value) : parseFloat(prev.purchasePrice);
        const pct =
          name === "depositPercentage" ? parseFloat(value) : parseFloat(prev.depositPercentage);
        if (price && pct) next.depositAmount = ((price * pct) / 100).toFixed(2);
      }
      return next;
    });
  };

  const isStepComplete = (step: number) => {
    switch (step) {
      case 1: return formData.caseType !== "";
      case 2: return formData.saleId.trim() !== "" && formData.propertyAddress !== "" && formData.propertyType !== "";
      case 3: return formData.buyerFirstName !== "" && formData.sellerFirstName !== "";
      case 4: return formData.purchasePrice !== "";
      default: return false;
    }
  };

  const handleNext = () => { if (currentStep < steps.length) setCurrentStep(currentStep + 1); };
  const handleBack = () => { if (currentStep > 1) setCurrentStep(currentStep - 1); };

  const handleSubmit = async () => {
    setSubmitError(null);
    const token = getAccessToken();
    if (!token) { setSubmitError("Not authenticated"); return; }
    const firm = getActiveCompanyContext();
    const user = getStoredUser();
    if (!firm?.id) { setSubmitError("No active company context — please re-login."); return; }
    if (!user?.id) { setSubmitError("User session missing — please re-login."); return; }
    if (!formData.saleId.trim()) { setSubmitError("Sale ID is required."); return; }

    const payload: CreateCasePayload = {
      saleId:                 formData.saleId.trim(),
      firmId:                 firm.id,
      leadConveyancerId:      user.id,
      caseType:               CASE_TYPE_MAP[formData.caseType] ?? "transfer",
      priority:               PRIORITY_MAP[formData.priority] ?? "normal",
      targetRegistrationDate: formData.targetCompletionDate || undefined,
      notes:                  formData.notes || undefined,
    };

    setSubmitting(true);
    try {
      const created = await conveyancerApi.createCase(token, payload);
      router.push(`/app/conveyancer/cases/${created.id}`);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Failed to create case");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="max-w-5xl mx-auto mb-8">
        <Link
          href="/app/conveyancer/cases"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Cases
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Create New Case</h1>
        <p className="text-gray-600 mt-1">Set up a new conveyancing case with AI assistance</p>
      </div>

      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Steps Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
              <h2 className="font-semibold text-gray-900 mb-4">Progress</h2>
              <nav className="space-y-2">
                {steps.map((step) => {
                  const Icon = step.icon;
                  const isComplete = currentStep > step.id || isStepComplete(step.id);
                  const isCurrent = currentStep === step.id;
                  return (
                    <button
                      key={step.id}
                      onClick={() => setCurrentStep(step.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        isCurrent
                          ? "bg-blue-600 text-white"
                          : isComplete
                          ? "bg-green-50 text-green-700"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <div
                        className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                          isCurrent
                            ? "bg-white text-blue-600"
                            : isComplete
                            ? "bg-green-600 text-white"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {isComplete && !isCurrent ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <span className="text-sm font-medium">{step.id}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <span className="text-sm font-medium">{step.name}</span>
                      </div>
                    </button>
                  );
                })}
              </nav>

              {/* AI Assistant Tip */}
              <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-purple-900 mb-1">AI Tip</h3>
                    <p className="text-xs text-purple-700">
                      Our AI will automatically validate documents and suggest next steps once the
                      case is created.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">

              {/* ── Step 1: Case Type ── */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Case Type</h2>
                    <p className="text-gray-600">Choose the type of conveyancing transaction</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      {
                        value: "residential-sale",
                        label: "Residential Sale",
                        desc: "Standard residential property transfer",
                        icon: <Home className="w-6 h-6 text-blue-600" />,
                        bg: "bg-blue-100",
                      },
                      {
                        value: "commercial",
                        label: "Commercial Property",
                        desc: "Commercial property transaction",
                        icon: <Home className="w-6 h-6 text-purple-600" />,
                        bg: "bg-purple-100",
                      },
                      {
                        value: "refinance",
                        label: "Refinancing",
                        desc: "Property refinancing transaction",
                        icon: <DollarSign className="w-6 h-6 text-green-600" />,
                        bg: "bg-green-100",
                      },
                      {
                        value: "transfer",
                        label: "Transfer",
                        desc: "Transfer between existing owners",
                        icon: <Users className="w-6 h-6 text-yellow-600" />,
                        bg: "bg-yellow-100",
                      },
                    ].map((ct) => (
                      <button
                        key={ct.value}
                        onClick={() => setFormData({ ...formData, caseType: ct.value })}
                        className={`p-6 border-2 rounded-lg text-left transition-all ${
                          formData.caseType === ct.value
                            ? "border-blue-600 bg-blue-50"
                            : "border-gray-200 hover:border-blue-300"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className={`p-3 ${ct.bg} rounded-lg`}>{ct.icon}</div>
                          {formData.caseType === ct.value && (
                            <Check className="w-6 h-6 text-blue-600" />
                          )}
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1">{ct.label}</h3>
                        <p className="text-sm text-gray-600">{ct.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Step 2: Property Details ── */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Property Information</h2>
                    <p className="text-gray-600">Enter the property details</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sale ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="saleId"
                      value={formData.saleId}
                      onChange={handleInputChange}
                      placeholder="UUID of the associated property sale"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono text-sm"
                    />
                    <p className="mt-1 text-xs text-gray-500">Find this in the Sales Progression module for the relevant listing.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Property Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="propertyAddress"
                      value={formData.propertyAddress}
                      onChange={handleInputChange}
                      placeholder="123 Main Street, City, State, ZIP"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Property Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="propertyType"
                      value={formData.propertyType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="residential">Residential</option>
                      <option value="commercial">Commercial</option>
                      <option value="industrial">Industrial</option>
                      <option value="land">Land</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Bedrooms</label>
                      <input
                        type="number"
                        name="bedrooms"
                        value={formData.bedrooms}
                        onChange={handleInputChange}
                        placeholder="3"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Bathrooms</label>
                      <input
                        type="number"
                        name="bathrooms"
                        value={formData.bathrooms}
                        onChange={handleInputChange}
                        placeholder="2"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Area (sqft)</label>
                      <input
                        type="number"
                        name="area"
                        value={formData.area}
                        onChange={handleInputChange}
                        placeholder="1850"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ── Step 3: Parties ── */}
              {currentStep === 3 && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Parties Involved</h2>
                    <p className="text-gray-600">Enter buyer and seller information</p>
                  </div>

                  {/* Buyer */}
                  <div className="border-l-4 border-l-blue-500 bg-blue-50 p-6 rounded-r-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Buyer Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          First Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="buyerFirstName"
                          value={formData.buyerFirstName}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Last Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="buyerLastName"
                          value={formData.buyerLastName}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input
                          type="email"
                          name="buyerEmail"
                          value={formData.buyerEmail}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                        <input
                          type="tel"
                          name="buyerPhone"
                          value={formData.buyerPhone}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">ID Number</label>
                        <input
                          type="text"
                          name="buyerIdNumber"
                          value={formData.buyerIdNumber}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Seller */}
                  <div className="border-l-4 border-l-purple-500 bg-purple-50 p-6 rounded-r-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Seller Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          First Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="sellerFirstName"
                          value={formData.sellerFirstName}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Last Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="sellerLastName"
                          value={formData.sellerLastName}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input
                          type="email"
                          name="sellerEmail"
                          value={formData.sellerEmail}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                        <input
                          type="tel"
                          name="sellerPhone"
                          value={formData.sellerPhone}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">ID Number</label>
                        <input
                          type="text"
                          name="sellerIdNumber"
                          value={formData.sellerIdNumber}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Agent (optional) */}
                  <div className="border-l-4 border-l-green-500 bg-green-50 p-6 rounded-r-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Real Estate Agent <span className="text-sm font-normal text-gray-500">(Optional)</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Agent Name</label>
                        <input
                          type="text"
                          name="agentName"
                          value={formData.agentName}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Agency</label>
                        <input
                          type="text"
                          name="agentAgency"
                          value={formData.agentAgency}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input
                          type="email"
                          name="agentEmail"
                          value={formData.agentEmail}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                        <input
                          type="tel"
                          name="agentPhone"
                          value={formData.agentPhone}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Step 4: Financials ── */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Financial Details</h2>
                    <p className="text-gray-600">Enter transaction financial information</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Purchase Price <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">R</span>
                      <input
                        type="number"
                        name="purchasePrice"
                        value={formData.purchasePrice}
                        onChange={handleInputChange}
                        placeholder="450000"
                        className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Deposit Percentage
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          name="depositPercentage"
                          value={formData.depositPercentage}
                          onChange={handleInputChange}
                          placeholder="10"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Deposit Amount
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">R</span>
                        <input
                          type="text"
                          name="depositAmount"
                          value={formData.depositAmount}
                          readOnly
                          className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Financing Type</label>
                    <select
                      name="financingType"
                      value={formData.financingType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="mortgage">Mortgage / Home Loan</option>
                      <option value="cash">Cash</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {formData.financingType === "mortgage" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
                      <input
                        type="text"
                        name="bankName"
                        value={formData.bankName}
                        onChange={handleInputChange}
                        placeholder="First National Bank"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  )}

                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Case Management</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                        <select
                          name="priority"
                          value={formData.priority}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Normal</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Target Completion Date
                        </label>
                        <input
                          type="date"
                          name="targetCompletionDate"
                          value={formData.targetCompletionDate}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        rows={4}
                        placeholder="Add any additional notes or special instructions…"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ── Step 5: Review ── */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Review & Confirm</h2>
                    <p className="text-gray-600">Review all information before creating the case</p>
                  </div>

                  {submitError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
                      {submitError}
                    </div>
                  )}

                  <div className="space-y-4">
                    {/* Case Type */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">Case Type</h3>
                      <p className="text-gray-700 capitalize">{formData.caseType.replace("-", " ")}</p>
                    </div>

                    {/* Property */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">Property Details</h3>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">Sale ID:</span>
                          <p className="text-gray-900 font-mono text-xs truncate">{formData.saleId || "Not provided"}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Address:</span>
                          <p className="text-gray-900">{formData.propertyAddress || "Not provided"}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Type:</span>
                          <p className="text-gray-900 capitalize">{formData.propertyType}</p>
                        </div>
                        {formData.bedrooms && (
                          <div>
                            <span className="text-gray-500">Bedrooms:</span>
                            <p className="text-gray-900">{formData.bedrooms}</p>
                          </div>
                        )}
                        {formData.bathrooms && (
                          <div>
                            <span className="text-gray-500">Bathrooms:</span>
                            <p className="text-gray-900">{formData.bathrooms}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Parties */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">Parties Involved</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Buyer</p>
                          <p className="font-medium text-gray-900">
                            {formData.buyerFirstName} {formData.buyerLastName}
                          </p>
                          {formData.buyerEmail && (
                            <p className="text-sm text-gray-600">{formData.buyerEmail}</p>
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Seller</p>
                          <p className="font-medium text-gray-900">
                            {formData.sellerFirstName} {formData.sellerLastName}
                          </p>
                          {formData.sellerEmail && (
                            <p className="text-sm text-gray-600">{formData.sellerEmail}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Financials */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">Financial Details</h3>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">Purchase Price:</span>
                          <p className="text-lg font-bold text-gray-900">
                            R {parseFloat(formData.purchasePrice || "0").toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Deposit:</span>
                          <p className="text-lg font-bold text-gray-900">
                            R {parseFloat(formData.depositAmount || "0").toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Financing:</span>
                          <p className="text-gray-900 capitalize">{formData.financingType}</p>
                        </div>
                        {formData.bankName && (
                          <div>
                            <span className="text-gray-500">Bank:</span>
                            <p className="text-gray-900">{formData.bankName}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Case Settings */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">Case Settings</h3>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">Priority:</span>
                          <p className="text-gray-900 capitalize">{formData.priority}</p>
                        </div>
                        {formData.targetCompletionDate && (
                          <div>
                            <span className="text-gray-500">Target Date:</span>
                            <p className="text-gray-900">{formData.targetCompletionDate}</p>
                          </div>
                        )}
                        {formData.notes && (
                          <div className="col-span-2">
                            <span className="text-gray-500">Notes:</span>
                            <p className="text-gray-900">{formData.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* AI Processing Notice */}
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">AI Will Assist With:</h3>
                        <ul className="space-y-1 text-sm text-gray-700">
                          <li>✓ Automated document checklist generation</li>
                          <li>✓ KYC verification initiation</li>
                          <li>✓ Timeline and milestone creation</li>
                          <li>✓ Task assignment and deadline setting</li>
                          <li>✓ Client notification emails</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={handleBack}
                  disabled={currentStep === 1}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Back
                </button>

                <div className="flex items-center gap-3">
                  {currentStep < steps.length ? (
                    <button
                      onClick={handleNext}
                      className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {submitting ? (
                        "Creating…"
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          Create Case
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
