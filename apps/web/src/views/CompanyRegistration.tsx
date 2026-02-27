'use client';

import { useState } from "react";
import { useNavigate, Link } from "@/lib/router-compat";
import {
  Building2,
  Upload,
  ArrowRight,
  ArrowLeft,
  FileText,
  Phone,
  Mail,
  MapPin,
  Globe,
  Hash,
} from "lucide-react";

type FormData = {
  companyName: string;
  registrationNumber: string;
  taxNumber: string;
  category: string;
  address: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  description: string;
};

const PRIBEC_CATEGORIES = [
  { value: "agent", label: "Real Estate Agent / Agency" },
  { value: "contractor", label: "Contractor / Construction" },
  { value: "supplier", label: "Building Materials Supplier" },
  { value: "conveyancer", label: "Conveyancer / Legal Services" },
  { value: "inspector", label: "Building Inspector" },
  { value: "logistics", label: "Logistics / Transport Operator" },
  { value: "developing", label: "Property Developer" },
];

export default function CompanyRegistration() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    companyName: "",
    registrationNumber: "",
    taxNumber: "",
    category: "",
    address: "",
    city: "",
    region: "",
    postalCode: "",
    country: "",
    phone: "",
    email: "",
    website: "",
    description: "",
  });

  const update = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setFormData((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
    } else {
      // POST /api/v1/companies — handled by API integration layer
      navigate("/company/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl mb-2">Register Company</h1>
            <p className="text-gray-600">
              {step === 1
                ? "Company identity & category"
                : "Contact details & verification documents"}
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2].map((s) => (
              <>
                {s > 1 && (
                  <div
                    key={`line-${s}`}
                    className={`w-20 h-1 ${step >= s ? "bg-indigo-600" : "bg-gray-200"}`}
                  />
                )}
                <div
                  key={`step-${s}`}
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm ${
                    step >= s ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {s}
                </div>
              </>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {step === 1 ? (
              <div className="grid grid-cols-2 gap-4">
                {/* Company Name */}
                <div className="col-span-2">
                  <label className="block text-sm mb-2 text-gray-700">Company Name *</label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={update("companyName")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                    placeholder="Elite Properties Ltd."
                    required
                  />
                </div>

                {/* Registration Number */}
                <div>
                  <label className="block text-sm mb-2 text-gray-700">Registration Number *</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.registrationNumber}
                      onChange={update("registrationNumber")}
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                      placeholder="REG-2026-001"
                      required
                    />
                  </div>
                </div>

                {/* Tax Number */}
                <div>
                  <label className="block text-sm mb-2 text-gray-700">Tax Number</label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.taxNumber}
                      onChange={update("taxNumber")}
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                      placeholder="TAX-123456"
                    />
                  </div>
                </div>

                {/* Category */}
                <div className="col-span-2">
                  <label className="block text-sm mb-2 text-gray-700">Business Category *</label>
                  <select
                    value={formData.category}
                    onChange={update("category")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                    required
                  >
                    <option value="">Select category</option>
                    {PRIBEC_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    This determines which roles your team members can have.
                  </p>
                </div>

                {/* Address */}
                <div className="col-span-2">
                  <label className="block text-sm mb-2 text-gray-700">Street Address *</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.address}
                      onChange={update("address")}
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                      placeholder="123 Business Avenue"
                      required
                    />
                  </div>
                </div>

                {/* City & Region */}
                <div>
                  <label className="block text-sm mb-2 text-gray-700">City *</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={update("city")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                    placeholder="Nairobi"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2 text-gray-700">Region / Province *</label>
                  <input
                    type="text"
                    value={formData.region}
                    onChange={update("region")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                    placeholder="Nairobi County"
                    required
                  />
                </div>

                {/* Country & Postal */}
                <div>
                  <label className="block text-sm mb-2 text-gray-700">Country *</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={update("country")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                    placeholder="Kenya"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2 text-gray-700">Postal Code</label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={update("postalCode")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                    placeholder="00100"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {/* Phone */}
                <div>
                  <label className="block text-sm mb-2 text-gray-700">Phone Number *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={update("phone")}
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                      placeholder="+254 700 000 000"
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm mb-2 text-gray-700">Company Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={update("email")}
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                      placeholder="info@company.co.ke"
                      required
                    />
                  </div>
                </div>

                {/* Website */}
                <div className="col-span-2">
                  <label className="block text-sm mb-2 text-gray-700">Website (Optional)</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="url"
                      value={formData.website}
                      onChange={update("website")}
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                      placeholder="https://www.company.co.ke"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="col-span-2">
                  <label className="block text-sm mb-2 text-gray-700">Company Description *</label>
                  <textarea
                    value={formData.description}
                    onChange={update("description")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition resize-none"
                    rows={4}
                    placeholder="Tell us about your company and the services you offer..."
                    required
                  />
                </div>

                {/* Document Upload */}
                <div className="col-span-2">
                  <label className="block text-sm mb-2 text-gray-700">
                    Verification Documents *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-500 transition cursor-pointer">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-600 mb-1">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-500">
                      Business licence, registration certificate — PDF or image, max 10 MB each
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3 pt-2">
              {step === 2 && (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 px-6 py-3 border-2 border-gray-300 rounded-lg hover:border-gray-400 transition"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back
                </button>
              )}
              <button
                type="submit"
                className="flex-1 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2"
              >
                {step === 1 ? "Continue" : "Submit for Verification"}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have a company?{" "}
            <Link to="/company/dashboard" className="text-indigo-600 hover:underline">
              Go to dashboard
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
