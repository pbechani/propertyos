'use client';

import { useState, DragEvent, useEffect } from "react";
import { useNavigate } from "@/lib/router-compat";
import { useSearchParams } from "next/navigation";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  X,
  Eye,
  Shield,
  Lock,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { VerificationBadge } from "@/components/ui/verification-badge";
import { ApiError, kycApi } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth-session";
import { requiresBusinessLicenseForRole } from "@/lib/kyc-requirements";

interface UploadedFile {
  id: string;
  name: string;
  size: string;
  type: string;
  uploaded: boolean;
  file: File;
}

export default function KYCUpload() {
  const navigate = useNavigate();
  const searchParams = useSearchParams();
  const [dragActive, setDragActive] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<string | null>(null);
  const [files, setFiles] = useState<Record<string, UploadedFile>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [kycStatus, setKycStatus] = useState<"pending" | "under_review" | "approved" | "rejected" | "not_submitted">("not_submitted");
  const [pendingRole, setPendingRole] = useState<string | null>(null);
  const isFromProfileDashboard =
    searchParams.get("source") === "profile-dashboard";
  const isBusinessLicenseRequiredForRoleApplication =
    requiresBusinessLicenseForRole(pendingRole);

  const documents = [
    {
      id: "government_id",
      title: "Government-Issued ID",
      description: "Passport, Driver's License, or National ID card",
      required: true,
      acceptedFormats: "PDF, JPG, PNG (Max 5MB)",
    },
    {
      id: "proof_address",
      title: "Proof of Address",
      description: "Utility bill or bank statement (last 3 months)",
      required: true,
      acceptedFormats: "PDF, JPG, PNG (Max 5MB)",
    },
    {
      id: "business_license",
      title: "Business License / Certificate",
      description: "Real estate license or business registration",
      required: !isFromProfileDashboard || isBusinessLicenseRequiredForRoleApplication,
      acceptedFormats: "PDF, JPG, PNG (Max 5MB)",
    },
    {
      id: "tax_document",
      title: "Tax Identification",
      description: "Tax ID, EIN, or equivalent tax document",
      required: false,
      acceptedFormats: "PDF, JPG, PNG (Max 5MB)",
    },
  ];

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setPendingRole(window.sessionStorage.getItem("pribec.pending_role"));
  }, []);

  useEffect(() => {
    const loadStatus = async () => {
      const token = getAccessToken();
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const status = await kycApi.getStatus(token);
        if (status.status === "pending" || status.status === "under_review" || status.status === "approved" || status.status === "rejected") {
          setKycStatus(status.status);
        } else {
          setKycStatus("not_submitted");
        }
      } catch {
        setKycStatus("not_submitted");
      }
    };

    void loadStatus();
  }, [navigate]);

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, docId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0], docId);
    }
  };

  const handleFileUpload = (file: File, docId: string) => {
    const newFile: UploadedFile = {
      id: Math.random().toString(),
      name: file.name,
      size: (file.size / 1024).toFixed(2) + " KB",
      type: file.type,
      uploaded: true,
      file,
    };

    setFiles((prev) => ({ ...prev, [docId]: newFile }));
  };

  const handleSubmit = async () => {
    setSubmitError("");
    const token = getAccessToken();

    if (!token) {
      navigate("/login");
      return;
    }

    if (!canSubmit) {
      setSubmitError("Upload all required documents before submitting.");
      return;
    }

    const formData = new FormData();
    formData.append("idDocumentType", "passport");

    const idDocumentFile = files.government_id?.file;
    const addressProofFile = files.proof_address?.file;
    const businessRegistrationFile = files.business_license?.file;

    if (idDocumentFile) {
      formData.append("id_document", idDocumentFile);
    }
    if (addressProofFile) {
      formData.append("address_proof", addressProofFile);
    }
    if (businessRegistrationFile) {
      formData.append("business_registration", businessRegistrationFile);
    }

    setIsSubmitting(true);

    try {
      const response = await kycApi.submit(token, formData);
      if (response.status === "pending" || response.status === "under_review" || response.status === "approved" || response.status === "rejected") {
        setKycStatus(response.status);
      }
      navigate("/profile-dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        setSubmitError(err.message);
      } else if (err instanceof Error) {
        setSubmitError(err.message || "Unable to submit KYC right now.");
      } else {
        setSubmitError("Unable to submit KYC right now.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeFile = (docId: string) => {
    setFiles((prev) => {
      const newFiles = { ...prev };
      delete newFiles[docId];
      return newFiles;
    });
  };

  const requiredDocs = documents.filter((doc) => doc.required);
  const uploadedRequiredDocs = requiredDocs.filter(
    (doc) => files[doc.id]?.uploaded
  ).length;
  const completionPercentage = (uploadedRequiredDocs / requiredDocs.length) * 100;

  const canSubmit = uploadedRequiredDocs === requiredDocs.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/profile-setup")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Profile
          </Button>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Identity Verification (KYC)</h1>
              <p className="text-gray-600">
                Upload your documents to verify your identity and unlock all platform features
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Business License / Certificate is required for professional role applications.
              </p>
            </div>
            <VerificationBadge status={kycStatus === "approved" ? "verified" : "pending"} size="lg" />
          </div>

          {/* Progress Bar */}
          <Card className="p-6 bg-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">
                  Verification Progress
                </div>
                <div className="text-xs text-gray-500">
                  {uploadedRequiredDocs} of {requiredDocs.length} required documents uploaded
                </div>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(completionPercentage)}%
              </div>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Document Upload */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Required Documents</h2>
              <div className="space-y-4">
                {documents.map((doc) => {
                  const uploadedFile = files[doc.id];
                  const isUploading = false;
                  const isUploaded = uploadedFile?.uploaded;

                  return (
                    <div
                      key={doc.id}
                      className={`border-2 border-dashed rounded-lg transition-all ${
                        dragActive && selectedDoc === doc.id
                          ? "border-blue-500 bg-blue-50"
                          : isUploaded
                          ? "border-green-300 bg-green-50"
                          : "border-gray-300 bg-white"
                      }`}
                      onDragEnter={(e) => {
                        handleDrag(e);
                        setSelectedDoc(doc.id);
                      }}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={(e) => handleDrop(e, doc.id)}
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                                isUploaded
                                  ? "bg-green-100"
                                  : "bg-blue-100"
                              }`}
                            >
                              {isUploaded ? (
                                <CheckCircle className="w-6 h-6 text-green-600" />
                              ) : (
                                <FileText className="w-6 h-6 text-blue-600" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-gray-900">
                                  {doc.title}
                                </h3>
                                {doc.required ? (
                                  <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full font-medium">
                                    Required
                                  </span>
                                ) : (
                                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full font-medium">
                                    Optional
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">{doc.description}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {doc.acceptedFormats}
                              </p>
                            </div>
                          </div>
                        </div>

                        {!uploadedFile ? (
                          <div className="text-center py-6">
                            <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                            <p className="text-sm text-gray-600 mb-3">
                              Drag and drop your file here, or
                            </p>
                            <input
                              type="file"
                              id={`file-${doc.id}`}
                              className="hidden"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  handleFileUpload(e.target.files[0], doc.id);
                                }
                              }}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                document.getElementById(`file-${doc.id}`)?.click()
                              }
                            >
                              Browse Files
                            </Button>
                          </div>
                        ) : (
                          <div>
                            {isUploading && (
                              <div className="mb-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm text-gray-700">
                                    Uploading...
                                  </span>
                                  <span className="text-sm font-medium text-blue-600">100%</span>
                                </div>
                                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-blue-600 transition-all"
                                    style={{ width: "100%" }}
                                  ></div>
                                </div>
                              </div>
                            )}

                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-gray-600" />
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {uploadedFile.name}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {uploadedFile.size}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {isUploaded && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setPreviewDoc(doc.id)}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFile(doc.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Right Column - Verification Checklist & Security */}
          <div className="space-y-6">
            {/* Verification Checklist */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                Verification Checklist
              </h3>
              <div className="space-y-3">
                {documents
                  .filter((doc) => doc.required)
                  .map((doc) => (
                    <div key={doc.id} className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center ${
                          files[doc.id]?.uploaded
                            ? "bg-green-500"
                            : "bg-gray-200"
                        }`}
                      >
                        {files[doc.id]?.uploaded && (
                          <CheckCircle className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <span
                        className={`text-sm ${
                          files[doc.id]?.uploaded
                            ? "text-gray-900 font-medium"
                            : "text-gray-500"
                        }`}
                      >
                        {doc.title}
                      </span>
                    </div>
                  ))}
              </div>
            </Card>

            {/* Security Information */}
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Your Security Matters
                  </h3>
                  <p className="text-sm text-gray-600">
                    We use bank-level encryption to protect your documents
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-2 text-sm text-gray-700">
                  <Lock className="w-4 h-4 mt-0.5 text-blue-600" />
                  <span>256-bit SSL encryption</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-gray-700">
                  <Lock className="w-4 h-4 mt-0.5 text-blue-600" />
                  <span>Secure cloud storage</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-gray-700">
                  <Lock className="w-4 h-4 mt-0.5 text-blue-600" />
                  <span>GDPR compliant</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-gray-700">
                  <Lock className="w-4 h-4 mt-0.5 text-blue-600" />
                  <span>Manual verification by trained staff</span>
                </div>
              </div>
            </Card>

            {/* What Happens Next */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">What Happens Next?</h3>
              <div className="space-y-4 text-sm">
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold flex-shrink-0">
                    1
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Submit Documents</div>
                    <div className="text-gray-600">Upload all required documents</div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold flex-shrink-0">
                    2
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Review Process</div>
                    <div className="text-gray-600">Our team reviews within 24-48 hours</div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold flex-shrink-0">
                    3
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Get Verified</div>
                    <div className="text-gray-600">Receive your verified badge</div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Submit Button */}
            {submitError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                {submitError}
              </div>
            )}
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                "Submitting..."
              ) : canSubmit ? (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Submit for Verification
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 mr-2" />
                  Upload All Required Documents
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="bg-white w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold">Document Preview</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreviewDoc(null)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-8 flex items-center justify-center bg-gray-50 h-96">
              <div className="text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  Document preview: {files[previewDoc]?.name}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  In a production environment, this would display the actual document
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}