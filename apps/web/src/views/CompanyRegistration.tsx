'use client';

import { useState, useRef } from "react";
import { Link } from "@/lib/router-compat";
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
  ImageIcon,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Paperclip,
} from "lucide-react";
import { companiesApi, authApi } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth-session";

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
  const [step, setStep] = useState(1);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoError, setLogoError] = useState("");
  const [docFiles, setDocFiles] = useState<File[]>([]);
  const [docError, setDocError] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const docInputRef = useRef<HTMLInputElement>(null);
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

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setLogoError("Please upload a valid image file (PNG, JPG, SVG, WebP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setLogoError("Logo must be smaller than 5 MB.");
      return;
    }
    setLogoError("");
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const removeLogo = () => {
    setLogoFile(null);
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoPreview(null);
  };

  const addDocFiles = (files: FileList | File[]) => {
    const arr = Array.from(files);
    const valid = arr.filter((f) => {
      if (f.size > 10 * 1024 * 1024) return false;
      const ok = f.type === "application/pdf" || f.type.startsWith("image/");
      return ok;
    });
    if (valid.length < arr.length) {
      setDocError("Some files were skipped — only PDF or image files under 10 MB are allowed.");
    } else {
      setDocError("");
    }
    setDocFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name + f.size));
      return [...prev, ...valid.filter((f) => !existing.has(f.name + f.size))];
    });
  };

  const removeDoc = (idx: number) => {
    setDocFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    addDocFiles(e.dataTransfer.files);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (!logoFile) {
        setLogoError("Company logo is required.");
        return;
      }
      setStep(2);
      return;
    }

    // Step 2 — validate documents
    if (docFiles.length === 0) {
      setDocError("Please upload at least one verification document.");
      return;
    }

    const token = getAccessToken();
    if (!token) {
      setSubmitError("You must be logged in to register a company.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const company = await companiesApi.createCompany(token, {
        name: formData.companyName,
        category: formData.category,
        email: formData.email,
        phone: formData.phone || undefined,
        website: formData.website || undefined,
        registration_number: formData.registrationNumber || undefined,
        tax_number: formData.taxNumber || undefined,
        description: formData.description || undefined,
        address: {
          line1: formData.address || undefined,
          city: formData.city || undefined,
          region: formData.region || undefined,
          postal_code: formData.postalCode || undefined,
          country: formData.country || undefined,
        },
      });

      // Exchange the current token for a company-scoped JWT
      const scopedTokens = await authApi.selectContext(token, company.id);

      // Upload company logo now that we have a scoped token
      if (logoFile) {
        try {
          await companiesApi.uploadCompanyLogo(scopedTokens.accessToken, company.id, logoFile);
        } catch {
          // Logo upload failure is non-fatal — the company was created successfully.
          // The admin can update the logo from the company profile later.
        }
      }

      // Submit for verification immediately after creation
      await companiesApi.submitVerification(scopedTokens.accessToken, company.id);

      setSubmitted(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed. Please try again.";
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
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

          {/* Success State */}
          {submitted && (
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Submitted for Verification</h2>
              <p className="text-gray-600 mb-6 text-sm">
                Your company has been registered and sent to our compliance team for review.
                You'll receive an email once it's approved.
              </p>
            </div>
          )}

          {!submitted && <form onSubmit={handleSubmit} className="space-y-5">
            {step === 1 ? (
              <div className="grid grid-cols-2 gap-4">
                {/* Company Logo */}
                <div className="col-span-2">
                  <label className="block text-sm mb-2 text-gray-700">
                    Company Logo <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-5">
                    <div className="relative w-24 h-24 shrink-0">
                      {logoPreview ? (
                        <>
                          <img
                            src={logoPreview}
                            alt="Logo preview"
                            className="w-24 h-24 rounded-xl object-contain border border-gray-200 bg-gray-50"
                          />
                          <button
                            type="button"
                            onClick={removeLogo}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <label
                        htmlFor="logo-upload"
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition cursor-pointer text-sm font-medium"
                      >
                        <Upload className="w-4 h-4" />
                        {logoFile ? "Replace Logo" : "Upload Logo"}
                      </label>
                      <input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoChange}
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        PNG, JPG, SVG or WebP — max 5 MB. Square format recommended.
                      </p>
                      {logoError && (
                        <p className="text-xs text-red-500 mt-1">{logoError}</p>
                      )}
                    </div>
                  </div>
                </div>

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
                    Verification Documents <span className="text-red-500">*</span>
                  </label>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => docInputRef.current?.click()}
                    onKeyDown={(e) => e.key === "Enter" && docInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition ${
                      isDragOver ? "border-indigo-500 bg-indigo-50" : "border-gray-300 hover:border-indigo-400 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      ref={docInputRef}
                      type="file"
                      multiple
                      accept="application/pdf,image/*"
                      className="hidden"
                      onChange={(e) => e.target.files && addDocFiles(e.target.files)}
                    />
                    <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-1">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-500">
                      Business licence, registration certificate — PDF or image, max 10 MB each
                    </p>
                  </div>
                  {docError && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />{docError}
                    </p>
                  )}
                  {/* File list */}
                  {docFiles.length > 0 && (
                    <ul className="mt-3 space-y-2">
                      {docFiles.map((f, i) => (
                        <li key={i} className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                          <Paperclip className="w-4 h-4 text-gray-400 shrink-0" />
                          <span className="flex-1 truncate text-gray-700">{f.name}</span>
                          <span className="text-xs text-gray-400 shrink-0">{(f.size / 1024).toFixed(0)} KB</span>
                          <button
                            type="button"
                            onClick={() => removeDoc(i)}
                            className="p-0.5 hover:bg-red-100 rounded text-gray-400 hover:text-red-600 transition shrink-0"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {/* Submit error */}
            {submitError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {submitError}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3 pt-2">
              {step === 2 && (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-3 border-2 border-gray-300 rounded-lg hover:border-gray-400 transition disabled:opacity-50"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Submitting…</>
                ) : (
                  <>{step === 1 ? "Continue" : "Submit for Verification"}<ArrowRight className="w-5 h-5" /></>
                )}
              </button>
            </div>
          </form>}

          {!submitted && (
            <p className="text-center text-sm text-gray-500 mt-6">
              Already have a company?{" "}
              <Link to="/company/dashboard" className="text-indigo-600 hover:underline">
                Go to dashboard
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
