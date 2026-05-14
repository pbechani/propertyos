'use client';

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useNavigate } from "@/lib/router-compat";
import { getActiveCompanyContext, getAccessToken } from "@/lib/auth-session";
import { companiesApi, type CompanyDetail, type CompanyDocument } from "@/lib/api-client";
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
  Loader2,
  AlertCircle,
  Save,
  X,
  Camera,
  ExternalLink,
  Plus,
  Palette,
} from "lucide-react";

type EditFormData = {
  name: string;
  email: string;
  phone: string;
  website: string;
  description: string;
  registration_number: string;
  tax_number: string;
  brand_color: string;
  address_line1: string;
  address_city: string;
  address_region: string;
  address_country: string;
  address_postal_code: string;
};

type VerificationStatus = "unverified" | "pending" | "verified" | "rejected";

const CATEGORY_LABELS: Record<string, string> = {
  agent: "Real Estate Agent / Agency",
  contractor: "Contractor / Construction",
  supplier: "Building Materials Supplier",
  conveyancer: "Conveyancer / Legal Services",
  inspector: "Building Inspector",
  logistics: "Logistics / Transport Operator",
  developing: "Property Developer",
};

const DOC_TYPE_LABELS: Record<string, string> = {
  business_licence: "Business Licence",
  registration_certificate: "Company Registration Certificate",
  tax_clearance: "Tax Clearance Certificate",
  professional_indemnity: "Professional Indemnity Insurance",
  id_document: "Identity Document",
  other: "Other",
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
  const searchParams = useSearchParams();
  const activeCompany = getActiveCompanyContext();
  const [isEditing, setIsEditing] = useState(false);
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Documents state
  const [documents, setDocuments] = useState<CompanyDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [docUploadType, setDocUploadType] = useState('business_licence');
  const [docUploadName, setDocUploadName] = useState('');
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [docUploadError, setDocUploadError] = useState<string | null>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const [pendingDocFile, setPendingDocFile] = useState<File | null>(null);

  const isAdmin = activeCompany?.is_admin ?? false;

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !company) return;
    const token = getAccessToken();
    if (!token) { navigate('/login'); return; }

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowed.includes(file.type)) {
      setLogoError('Please upload a JPG, PNG, WebP, or SVG image.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setLogoError('Logo must be smaller than 2 MB.');
      return;
    }

    setIsUploadingLogo(true);
    setLogoError(null);
    try {
      const { url } = await companiesApi.uploadCompanyLogo(token, company.id, file);
      setCompany((prev) => prev ? { ...prev, logo_url: url } : prev);
    } catch (err: unknown) {
      setLogoError(err instanceof Error ? err.message : 'Logo upload failed. Please try again.');
    } finally {
      setIsUploadingLogo(false);
      // Reset so the same file can be re-selected if needed
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };
  const [editForm, setEditForm] = useState<EditFormData>({
    name: '', email: '', phone: '', website: '', description: '',
    registration_number: '', tax_number: '', brand_color: '',
    address_line1: '', address_city: '', address_region: '', address_country: '', address_postal_code: '',
  });

  const updateField = (field: keyof EditFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setEditForm((prev) => ({ ...prev, [field]: e.target.value }));

  const startEditing = () => {
    if (!company) return;
    setEditForm({
      name: company.name ?? '',
      email: company.email ?? '',
      phone: company.phone ?? '',
      website: company.website ?? '',
      description: company.description ?? '',
      registration_number: company.registration_number ?? '',
      tax_number: company.tax_number ?? '',
      brand_color: company.brand_color ?? '',
      address_line1: company.address?.line1 ?? '',
      address_city: company.address?.city ?? '',
      address_region: company.address?.region ?? '',
      address_country: company.address?.country ?? '',
      address_postal_code: company.address?.postal_code ?? '',
    });
    setSaveError(null);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setSaveError(null);
  };

  const handleSave = async () => {
    if (!company || !activeCompany) return;
    const token = getAccessToken();
    if (!token) { navigate('/login'); return; }

    setIsSaving(true);
    setSaveError(null);
    try {
      const updated = await companiesApi.updateCompany(token, company.id, {
        name: editForm.name || undefined,
        email: editForm.email || undefined,
        phone: editForm.phone || undefined,
        website: editForm.website || undefined,
        description: editForm.description || undefined,
        registration_number: editForm.registration_number || undefined,
        tax_number: editForm.tax_number || undefined,
        brand_color: editForm.brand_color || undefined,
        address: {
          line1: editForm.address_line1 || undefined,
          city: editForm.address_city || undefined,
          region: editForm.address_region || undefined,
          country: editForm.address_country || undefined,
          postal_code: editForm.address_postal_code || undefined,
        },
      });
      setCompany(updated);
      setIsEditing(false);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!activeCompany || activeCompany.slug === 'self') {
      navigate('/app/my-dashboard');
      return;
    }

    const token = getAccessToken();
    if (!token) {
      navigate('/login');
      return;
    }

    companiesApi
      .getCompany(token, activeCompany.id)
      .then((data) => {
        setCompany(data);
        // Fetch documents
        void companiesApi.getDocuments(token, data.id)
          .then(setDocuments)
          .catch(() => { /* non-fatal */ })
          .finally(() => setDocsLoading(false));
        setDocsLoading(true);
        // Auto-open edit mode when ?edit=true is in the URL
        if (searchParams.get('edit') === 'true') {
          setEditForm({
            name: data.name ?? '',
            email: data.email ?? '',
            phone: data.phone ?? '',
            website: data.website ?? '',
            description: data.description ?? '',
            registration_number: data.registration_number ?? '',
            tax_number: data.tax_number ?? '',
            brand_color: data.brand_color ?? '',
            address_line1: data.address?.line1 ?? '',
            address_city: data.address?.city ?? '',
            address_region: data.address?.region ?? '',
            address_country: data.address?.country ?? '',
            address_postal_code: data.address?.postal_code ?? '',
          });
          setIsEditing(true);
        }
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Failed to load company profile';
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="p-8">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{error ?? 'Could not load company profile.'}</p>
        </div>
      </div>
    );
  }

  const verificationStatus = (company.verification_status ?? 'unverified') as VerificationStatus;
  const address = company.address;
  const addressLine = address
    ? [address.line1, address.city, address.region, address.country, address.postal_code]
        .filter(Boolean)
        .join(', ')
    : '—';

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Company Profile</h1>
        <p className="text-gray-600">{company.name} · View and manage your company information</p>
      </div>

      <div className="max-w-4xl space-y-6">
        {/* Verification Status Banner */}
        <div
          className={`p-4 rounded-lg border flex items-start gap-3 ${
            verificationStatus === "verified"
              ? "bg-green-50 border-green-200"
              : verificationStatus === "rejected"
              ? "bg-red-50 border-red-200"
              : "bg-amber-50 border-amber-200"
          }`}
        >
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <span className="font-medium text-sm">Verification Status:</span>
              <VerificationBadge status={verificationStatus} />
            </div>
            {verificationStatus === "verified" && (
              <p className="text-sm text-green-700">Your company is verified and fully active.</p>
            )}
            {verificationStatus === "pending" && (
              <p className="text-sm text-amber-700">
                Your company profile is under review. You cannot invite team members until
                approved.
              </p>
            )}
            {verificationStatus === "rejected" && (
              <p className="text-sm text-red-700">
                Your verification was rejected. Please contact support or update your documents
                and resubmit.
              </p>
            )}
          </div>
          {verificationStatus === "unverified" && (
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition flex-shrink-0">
              Submit for Verification
            </button>
          )}
        </div>

        {/* Company Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          {/* Hidden logo file input */}
          <input
            ref={logoInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/svg+xml"
            className="hidden"
            onChange={handleLogoFileChange}
          />

          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-4">
              {/* Company logo / placeholder with upload overlay */}
              <div className="relative group w-16 h-16 shrink-0">
                {company.logo_url ? (
                  <img
                    src={company.logo_url}
                    alt={`${company.name} logo`}
                    className="w-16 h-16 rounded-xl object-cover border border-gray-200"
                  />
                ) : (
                  <div className="flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-xl">
                    <Building2 className="w-8 h-8 text-indigo-600" />
                  </div>
                )}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={isUploadingLogo}
                    aria-label="Upload company logo"
                    className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity text-white disabled:cursor-not-allowed"
                  >
                    {isUploadingLogo
                      ? <Loader2 className="w-5 h-5 animate-spin" />
                      : <Camera className="w-5 h-5" />}
                    <span className="text-[9px] mt-0.5 leading-none">{isUploadingLogo ? 'Uploading' : 'Change'}</span>
                  </button>
                )}
              </div>
              <div>
                <h2 className="text-2xl mb-1">{company.name}</h2>
                <p className="text-gray-600 text-sm">
                  {CATEGORY_LABELS[company.category] ?? company.category}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">/{company.slug}</p>
              </div>
            </div>
            {!isEditing ? (
              <button
                onClick={startEditing}
                className="flex items-center gap-2 px-4 py-2 border-2 border-gray-300 rounded-lg hover:border-indigo-600 hover:text-indigo-600 transition text-sm"
              >
                <Edit className="w-4 h-4" />
                Edit Profile
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={cancelEditing}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 border-2 border-gray-300 rounded-lg hover:border-gray-500 transition text-sm"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm disabled:opacity-60"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isSaving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>

          {logoError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              {logoError}
              <button onClick={() => setLogoError(null)} className="ml-auto text-red-400 hover:text-red-600"><X className="w-3.5 h-3.5" /></button>
            </div>
          )}

          {saveError && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              {saveError}
            </div>
          )}

          {/* Details Grid */}
          {!isEditing ? (
            <div className="grid grid-cols-2 gap-5">
              <Field icon={<FileText className="w-5 h-5 text-gray-400" />} label="Registration Number" value={company.registration_number ?? '—'} />
              <Field icon={<Hash className="w-5 h-5 text-gray-400" />} label="Tax Number" value={company.tax_number ?? '—'} />
              <Field icon={<Building2 className="w-5 h-5 text-gray-400" />} label="Category" value={CATEGORY_LABELS[company.category] ?? company.category} />
              <Field
                icon={<Clock className="w-5 h-5 text-gray-400" />}
                label="Registered On"
                value={new Date(company.created_at).toLocaleDateString()}
              />
              <div className="col-span-2">
                <Field icon={<MapPin className="w-5 h-5 text-gray-400" />} label="Address" value={addressLine} />
              </div>
              <Field icon={<Phone className="w-5 h-5 text-gray-400" />} label="Phone" value={company.phone ?? '—'} />
              <Field icon={<Mail className="w-5 h-5 text-gray-400" />} label="Email" value={company.email} />
              <div className="col-span-2">
                <Field icon={<Globe className="w-5 h-5 text-gray-400" />} label="Website" value={company.website ?? '—'} />
              </div>
              {/* Brand Color */}
              <div className="col-span-2">
                <label className="block text-xs text-gray-500 mb-1">Brand Colour</label>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Palette className="w-5 h-5 text-gray-400" />
                  {company.brand_color ? (
                    <>
                      <div
                        className="w-8 h-8 rounded-lg border border-gray-300 shrink-0"
                        style={{ backgroundColor: company.brand_color }}
                      />
                      <span className="text-sm font-mono">{company.brand_color}</span>
                    </>
                  ) : (
                    <span className="text-sm text-gray-400">No brand colour set</span>
                  )}
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-gray-500 mb-1">Description</label>
                <p className="text-sm text-gray-800 leading-relaxed">{company.description ?? '—'}</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <EditField label="Company Name" value={editForm.name} onChange={updateField('name')} span={2} />
              <EditField label="Email" type="email" value={editForm.email} onChange={updateField('email')} />
              <EditField label="Phone" type="tel" value={editForm.phone} onChange={updateField('phone')} />
              <EditField label="Registration Number" value={editForm.registration_number} onChange={updateField('registration_number')} />
              <EditField label="Tax Number" value={editForm.tax_number} onChange={updateField('tax_number')} />
              <EditField label="Website" type="url" value={editForm.website} onChange={updateField('website')} span={2} />
              <EditField label="Address Line 1" value={editForm.address_line1} onChange={updateField('address_line1')} span={2} />
              <EditField label="City" value={editForm.address_city} onChange={updateField('address_city')} />
              <EditField label="Region / State" value={editForm.address_region} onChange={updateField('address_region')} />
              <EditField label="Country" value={editForm.address_country} onChange={updateField('address_country')} />
              <EditField label="Postal Code" value={editForm.address_postal_code} onChange={updateField('address_postal_code')} />
              {/* Brand Colour picker */}
              <div className="col-span-2">
                <label className="block text-xs text-gray-500 mb-1">Brand Colour</label>
                <p className="text-xs text-gray-400 mb-2">This colour is used on your property card headers and other branded elements.</p>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={editForm.brand_color || '#4A9E8E'}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, brand_color: e.target.value }))}
                    className="w-12 h-10 rounded-lg border border-gray-300 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={editForm.brand_color}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === '' || /^#[0-9a-fA-F]{0,6}$/.test(v)) {
                        setEditForm((prev) => ({ ...prev, brand_color: v }));
                      }
                    }}
                    placeholder="#4A9E8E"
                    maxLength={7}
                    className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {editForm.brand_color && (
                    <div
                      className="w-10 h-10 rounded-lg border border-gray-300 shrink-0"
                      style={{ backgroundColor: editForm.brand_color }}
                    />
                  )}
                  {editForm.brand_color && (
                    <button
                      type="button"
                      onClick={() => setEditForm((prev) => ({ ...prev, brand_color: '' }))}
                      className="text-xs text-gray-400 hover:text-red-500"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-gray-500 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={updateField('description')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Verification Documents */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg">Verification Documents</h3>
            {isAdmin && (
              <button
                onClick={() => { setShowUploadForm((v) => !v); setDocUploadError(null); setPendingDocFile(null); }}
                className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700"
              >
                <Plus className="w-4 h-4" />
                Upload New
              </button>
            )}
          </div>

          {/* Inline upload form */}
          {showUploadForm && isAdmin && (
            <div className="mb-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg space-y-3">
              <p className="text-sm font-medium text-indigo-800">Upload Verification Document</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Document Type</label>
                  <select
                    value={docUploadType}
                    onChange={(e) => setDocUploadType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="business_licence">Business Licence</option>
                    <option value="registration_certificate">Company Registration Certificate</option>
                    <option value="tax_clearance">Tax Clearance Certificate</option>
                    <option value="professional_indemnity">Professional Indemnity Insurance</option>
                    <option value="id_document">Identity Document</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Document Name (optional)</label>
                  <input
                    type="text"
                    value={docUploadName}
                    onChange={(e) => setDocUploadName(e.target.value)}
                    placeholder="e.g. Business Licence 2025"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => docInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-400 rounded-lg text-sm text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  {pendingDocFile ? pendingDocFile.name : 'Choose file (PDF, JPG, PNG)'}
                </button>
                <input
                  ref={docInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.heic"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setPendingDocFile(f);
                    if (docInputRef.current) docInputRef.current.value = '';
                  }}
                />
                {pendingDocFile && (
                  <button
                    disabled={isUploadingDoc}
                    onClick={async () => {
                      if (!pendingDocFile || !company) return;
                      const token = getAccessToken();
                      if (!token) { navigate('/login'); return; }
                      setIsUploadingDoc(true);
                      setDocUploadError(null);
                      try {
                        const name = docUploadName.trim() || pendingDocFile.name;
                        const updated = await companiesApi.uploadDocument(token, company.id, pendingDocFile, docUploadType, name);
                        setDocuments(updated);
                        setShowUploadForm(false);
                        setPendingDocFile(null);
                        setDocUploadName('');
                      } catch (err: unknown) {
                        setDocUploadError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
                      } finally {
                        setIsUploadingDoc(false);
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {isUploadingDoc ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {isUploadingDoc ? 'Uploading…' : 'Submit'}
                  </button>
                )}
                <button
                  onClick={() => { setShowUploadForm(false); setPendingDocFile(null); setDocUploadError(null); }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {docUploadError && (
                <p className="text-xs text-red-600">{docUploadError}</p>
              )}
            </div>
          )}

          {docsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
            </div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <FileText className="w-8 h-8 mb-2" />
              <p className="text-sm">No documents uploaded yet.</p>
              {isAdmin && (
                <p className="text-xs mt-1">
                  Use &ldquo;Upload New&rdquo; to add verification documents.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm truncate">{doc.document_name}</p>
                      <p className="text-xs text-gray-500">
                        {DOC_TYPE_LABELS[doc.document_type] ?? doc.document_type} &middot;{' '}
                        {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span
                      className={`text-xs px-3 py-1 rounded-full ${
                        doc.status === 'approved'
                          ? 'bg-green-100 text-green-700'
                          : doc.status === 'rejected'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {doc.status === 'approved' ? 'Approved' : doc.status === 'rejected' ? 'Rejected' : 'Under Review'}
                    </span>
                    <a
                      href={doc.public_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-800"
                      title="View document"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
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
function EditField({
  label,
  value,
  onChange,
  type = 'text',
  span,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  span?: number;
}) {
  return (
    <div className={span === 2 ? 'col-span-2' : ''}>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  );
}