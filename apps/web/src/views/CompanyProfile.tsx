'use client';

import { useState, useEffect } from "react";
import { useNavigate } from "@/lib/router-compat";
import { getActiveCompanyContext } from "@/lib/auth-session";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Edit,
  Upload,
  Globe,
  Hash,
} from "lucide-react";

type VerificationStatus = "unverified" | "pending" | "verified" | "rejected";
type CompanyStatus = "pending_verification" | "active" | "suspended";

const STUB_COMPANY = {
  name: "Elite Properties Ltd.",
  slug: "elite-properties-ltd",
  category: "agent",
  registrationNumber: "REG-2026-001",
  taxNumber: "TAX-123456",
  status: "active" as CompanyStatus,
  verificationStatus: "verified" as VerificationStatus,
  email: "info@eliteproperties.co.ke",
  phone: "+254 700 000 000",
  website: "https://www.eliteproperties.co.ke",
  address: {
    line1: "123 Business Avenue",
    city: "Nairobi",
    region: "Nairobi County",
    country: "Kenya",
    postalCode: "00100",
  },
  description:
    "Premium real estate agency specialising in residential and commercial property sales, leasing, and property management across Nairobi and surrounding counties.",
  createdAt: "2025-11-01T08:00:00Z",
  rejectionReason: null as string | null,
};

const CATEGORY_LABELS: Record<string, string> = {
  agent: "Real Estate Agent / Agency",
  contractor: "Contractor / Construction",
  supplier: "Building Materials Supplier",
  conveyancer: "Conveyancer / Legal Services",
  inspector: "Building Inspector",
  logistics: "Logistics / Transport Operator",
  developing: "Property Developer",
};

function VerificationBadge({ status }: { status: VerificationStatus }) {
  const cfg = {
    verified: { icon: CheckCircle, cls: "bg-green-100 text-green-700 border-green-200", label: "Verified" },
    pending: { icon: Clock, cls: "bg-amber-100 text-amber-700 border-amber-200", label: "Pending Review" },
    rejected: { icon: XCircle, cls: "bg-red-100 text-red-700 border-red-200", label: "Rejected" },
    unverified: { icon: Clock, cls: "bg-gray-100 text-gray-700 border-gray-200", label: "Unverified" },
  }[status];

  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm ${cfg.cls}`}>
      <Icon className="w-4 h-4" />
      {cfg.label}
    </span>
  );
}

export default function CompanyProfile() {
  const navigate = useNavigate();
  const activeCompany = getActiveCompanyContext();

  useEffect(() => {
    if (!activeCompany || activeCompany.slug === 'self') {
      navigate('/app/my-dashboard');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [isEditing, setIsEditing] = useState(false);
  const company = STUB_COMPANY;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Company Profile</h1>
        <p className="text-gray-600">{activeCompany?.name ?? company.name} · View and manage your company information</p>
      </div>

      <div className="max-w-4xl space-y-6">
        {/* Verification Status Banner */}
        <div
          className={`p-4 rounded-lg border flex items-start gap-3 ${
            company.verificationStatus === "verified"
              ? "bg-green-50 border-green-200"
              : company.verificationStatus === "rejected"
              ? "bg-red-50 border-red-200"
              : "bg-amber-50 border-amber-200"
          }`}
        >
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <span className="font-medium text-sm">Verification Status:</span>
              <VerificationBadge status={company.verificationStatus} />
            </div>
            {company.verificationStatus === "verified" && (
              <p className="text-sm text-green-700">Your company is verified and fully active.</p>
            )}
            {company.verificationStatus === "pending" && (
              <p className="text-sm text-amber-700">
                Your company profile is under review. You cannot invite team members until
                approved.
              </p>
            )}
            {company.verificationStatus === "rejected" && (
              <div>
                <p className="text-sm text-red-700 mb-1">
                  Your verification was rejected. Please contact support or update your documents
                  and resubmit.
                </p>
                {company.rejectionReason && (
                  <p className="text-xs text-red-600 bg-red-100 rounded px-3 py-1.5 inline-block">
                    Reason: {company.rejectionReason}
                  </p>
                )}
              </div>
            )}
          </div>
          {company.verificationStatus === "unverified" && (
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition flex-shrink-0">
              Submit for Verification
            </button>
          )}
        </div>

        {/* Company Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-xl">
                <Building2 className="w-8 h-8 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-2xl mb-1">{company.name}</h2>
                <p className="text-gray-600 text-sm">
                  {CATEGORY_LABELS[company.category] ?? company.category}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">/{company.slug}</p>
              </div>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-2 px-4 py-2 border-2 border-gray-300 rounded-lg hover:border-indigo-600 hover:text-indigo-600 transition text-sm"
            >
              <Edit className="w-4 h-4" />
              {isEditing ? "Cancel" : "Edit Profile"}
            </button>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-5">
            <Field icon={<FileText className="w-5 h-5 text-gray-400" />} label="Registration Number" value={company.registrationNumber} />
            <Field icon={<Hash className="w-5 h-5 text-gray-400" />} label="Tax Number" value={company.taxNumber || "—"} />
            <Field icon={<Building2 className="w-5 h-5 text-gray-400" />} label="Category" value={CATEGORY_LABELS[company.category] ?? company.category} />
            <Field
              icon={<Clock className="w-5 h-5 text-gray-400" />}
              label="Registered On"
              value={new Date(company.createdAt).toLocaleDateString()}
            />

            <div className="col-span-2">
              <Field
                icon={<MapPin className="w-5 h-5 text-gray-400" />}
                label="Address"
                value={`${company.address.line1}, ${company.address.city}, ${company.address.region}, ${company.address.country} ${company.address.postalCode}`}
              />
            </div>

            <Field icon={<Phone className="w-5 h-5 text-gray-400" />} label="Phone" value={company.phone} />
            <Field icon={<Mail className="w-5 h-5 text-gray-400" />} label="Email" value={company.email} />

            <div className="col-span-2">
              <Field icon={<Globe className="w-5 h-5 text-gray-400" />} label="Website" value={company.website || "—"} />
            </div>

            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Description</label>
              <p className="text-sm text-gray-800 leading-relaxed">{company.description}</p>
            </div>
          </div>
        </div>

        {/* Verification Documents */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg">Verification Documents</h3>
            <button className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700">
              <Upload className="w-4 h-4" />
              Upload New
            </button>
          </div>

          <div className="space-y-3">
            {[
              { name: "Business Licence", status: company.verificationStatus === "verified" ? "approved" : "pending" },
              { name: "Company Registration Certificate", status: company.verificationStatus === "verified" ? "approved" : "pending" },
            ].map((doc) => (
              <div
                key={doc.name}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm">{doc.name}</p>
                    <p className="text-xs text-gray-500">
                      Uploaded {new Date(company.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs px-3 py-1 rounded-full ${
                    doc.status === "approved"
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {doc.status === "approved" ? "Approved" : "Under Review"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
        {icon}
        <span className="text-sm">{value}</span>
      </div>
    </div>
  );
}
