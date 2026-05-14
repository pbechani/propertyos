'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle,
  ChevronRight,
  Upload,
  User,
  Mail,
  DollarSign,
  FileText,
  Calendar,
  ShieldCheck,
  TrendingUp,
  MessageSquare,
  ArrowLeft,
  Send,
  Download,
  Loader2,
  AlertCircle,
  Check,
} from 'lucide-react';
import { propertiesApi, buyerOffersApi, type PropertyListing, type BuyerOfferPayload, type BuyerOfferResponse } from '@/lib/api-client';
import { getAccessToken, getStoredUser } from '@/lib/auth-session';

// ─── Brand tokens ─────────────────────────────────────────────────────────────

const C = {
  forest:       '#1A3C28',
  forestLight:  '#2D5A40',
  parchment:    '#F2E8D5',
  cream:        '#EAD9C4',
  carbon:       '#0C0D10',
  egreen:       '#00E87A',
  amber:        '#B89040',
  muted:        '#5A7A68',
  red:          '#C4562A',
  border:       'rgba(26,60,40,0.12)',
  borderMid:    'rgba(26,60,40,0.18)',
  borderStrong: 'rgba(26,60,40,0.28)',
} as const;

const FRAUNCES = 'var(--font-fraunces, "Fraunces", Georgia, serif)';

const DEFAULT_PROP_IMAGE =
  'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=680&h=510&fit=crop';

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 0 | 1 | 2;

type FormState = {
  // Step 1 — Buyer Info
  firstName: string;
  lastName: string;
  idNumber: string;
  nationality: string;
  email: string;
  phone: string;
  whatsapp: string;
  preferredContact: string;
  address: string;
  buyingEntity: 'individual' | 'company' | 'trust' | 'joint';
  agentRepresented: boolean;
  agentName: string;
  preQualStatus: 'pre_approved' | 'pre_qualified' | 'cash' | 'not_applied';
  preQualBank: string;
  preQualReference: string;
  // Step 2 — Offer Details
  offerAmount: string;
  currency: string;
  depositAmount: string;
  depositDueDays: string;
  depositHeldBy: string;
  financing: 'cash' | 'bond' | 'part_cash_bond' | 'subject_to_bond';
  bondAmount: string;
  bondLender: string;
  bondDeadline: string;
  condBuildingInspection: boolean;
  condBondApproval: boolean;
  condSubjectToSale: boolean;
  condVacantOccupation: boolean;
  condElectricalCoc: boolean;
  inclusions: string[];
  customConditions: string;
  escalationEnabled: boolean;
  escalationIncrement: string;
  escalationCap: string;
  expiryDate: string;
  expiryTime: string;
  occupationDate: string;
  transferDate: string;
  messageToSeller: string;
  // Declaration
  decl1: boolean;
  decl2: boolean;
  decl3: boolean;
  decl4: boolean;
};

function defaultFormState(user: { firstName?: string; lastName?: string; email?: string } | null): FormState {
  return {
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    idNumber: '',
    nationality: 'South African',
    email: user?.email ?? '',
    phone: '',
    whatsapp: '',
    preferredContact: 'Email',
    address: '',
    buyingEntity: 'individual',
    agentRepresented: false,
    agentName: '',
    preQualStatus: 'pre_approved',
    preQualBank: 'FNB',
    preQualReference: '',
    offerAmount: '',
    currency: 'ZAR',
    depositAmount: '',
    depositDueDays: '5',
    depositHeldBy: 'conveyancer',
    financing: 'bond',
    bondAmount: '',
    bondLender: 'FNB Home Loans',
    bondDeadline: '',
    condBuildingInspection: true,
    condBondApproval: true,
    condSubjectToSale: false,
    condVacantOccupation: true,
    condElectricalCoc: true,
    inclusions: [],
    customConditions: '',
    escalationEnabled: false,
    escalationIncrement: '',
    escalationCap: '',
    expiryDate: '',
    expiryTime: '17:00',
    occupationDate: '',
    transferDate: '',
    messageToSeller: '',
    decl1: false,
    decl2: false,
    decl3: false,
    decl4: false,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatZAR(val: string): string {
  const n = parseFloat(val.replace(/\s/g, '').replace(/,/g, ''));
  if (isNaN(n)) return val;
  return n.toLocaleString('en-ZA', { maximumFractionDigits: 0 });
}

function parseAmount(val: string): number {
  return parseFloat(val.replace(/[\s,\u00a0]/g, '')) || 0;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: 'white',
      border: `1px solid ${C.border}`,
      borderRadius: 16,
      overflow: 'hidden',
    }}>
      {children}
    </div>
  );
}

function SectionHead({
  icon: Icon,
  title,
  subtitle,
  badge,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
}) {
  return (
    <div style={{
      padding: '18px 24px',
      borderBottom: `1px solid ${C.border}`,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 10,
        background: 'rgba(26,60,40,0.07)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={16} color={C.forest} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: FRAUNCES, fontSize: 16, fontWeight: 500, color: C.forest }}>{title}</span>
          {badge}
        </div>
        {subtitle && <div style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>{subtitle}</div>}
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: C.muted }}>
        {label}{required && <span style={{ color: C.red }}> *</span>}
      </label>
      {children}
      {error && (
        <span style={{ fontSize: 11, color: C.red, display: 'flex', alignItems: 'center', gap: 4 }}>
          <AlertCircle size={11} /> {error}
        </span>
      )}
      {hint && !error && (
        <span style={{ fontSize: 11, color: C.muted, display: 'flex', alignItems: 'center', gap: 4 }}>
          <AlertCircle size={11} /> {hint}
        </span>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 13px',
  border: `1.5px solid ${C.borderMid}`,
  borderRadius: 10,
  fontFamily: 'inherit',
  fontSize: 14,
  color: C.forest,
  background: 'white',
  outline: 'none',
};

const selectStyle: React.CSSProperties = { ...inputStyle, appearance: 'none' as const, cursor: 'pointer' };

function RadioGroup({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8 }}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <div
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 14px', borderRadius: 10,
              border: `1.5px solid ${active ? C.forest : C.borderMid}`,
              background: active ? C.forest : 'white',
              color: active ? C.parchment : C.forest,
              fontSize: 13, fontWeight: 500, cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <div style={{
              width: 14, height: 14, borderRadius: '50%',
              border: `2px solid ${active ? C.egreen : 'currentColor'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              {active && <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.egreen }} />}
            </div>
            {opt.label}
          </div>
        );
      })}
    </div>
  );
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <div
      onClick={onToggle}
      style={{
        width: 42, height: 24, borderRadius: 99,
        background: on ? C.forest : C.borderStrong,
        cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
        flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: 3, left: on ? 21 : 3,
        width: 18, height: 18, borderRadius: '50%',
        background: 'white', transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </div>
  );
}

function ToggleRow({
  label,
  desc,
  on,
  onToggle,
}: {
  label: string;
  desc?: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 0', borderBottom: `1px solid ${C.border}`,
    }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: C.forest }}>{label}</div>
        {desc && <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>{desc}</div>}
      </div>
      <Toggle on={on} onToggle={onToggle} />
    </div>
  );
}

function UploadZone({
  label,
  sub,
  accept,
  maxMB,
}: {
  label: string;
  sub?: string;
  accept?: string;
  maxMB?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (maxMB && file.size > maxMB * 1024 * 1024) {
      setUploadError(`File exceeds ${maxMB} MB limit`);
      setSelectedFile(null);
      e.target.value = '';
      return;
    }
    setUploadError(null);
    setSelectedFile(file.name);
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        style={{ display: 'none' }}
        onChange={handleChange}
      />
      <div
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${uploadError ? C.red : selectedFile ? C.forest : C.borderStrong}`,
          borderRadius: 12, padding: 20, textAlign: 'center',
          cursor: 'pointer',
          background: selectedFile ? 'rgba(26,60,40,0.04)' : C.parchment,
          transition: 'border-color 0.15s',
        }}
      >
        {selectedFile ? (
          <>
            <Check size={20} color={C.forest} style={{ margin: '0 auto 6px' }} />
            <div style={{ fontSize: 13, fontWeight: 500, color: C.forest }}>{selectedFile}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Click to change file</div>
          </>
        ) : (
          <>
            <Upload size={20} color={C.muted} style={{ margin: '0 auto 6px' }} />
            <div style={{ fontSize: 13, fontWeight: 500, color: C.forest }}>{label}</div>
            {sub && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{sub}</div>}
          </>
        )}
      </div>
      {uploadError && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: 12, color: C.red }}>
          <AlertCircle size={12} />{uploadError}
        </div>
      )}
    </>
  );
}

function CheckboxRow({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: () => void;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }} onClick={onChange}>
      <div style={{
        width: 18, height: 18, borderRadius: 5, flexShrink: 0, marginTop: 1,
        border: `1.5px solid ${checked ? C.forest : C.borderStrong}`,
        background: checked ? C.forest : 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {checked && <Check size={11} color={C.parchment} strokeWidth={3} />}
      </div>
      <span style={{ fontSize: 13, color: C.forest, lineHeight: 1.5 }}>{children}</span>
    </div>
  );
}

function OptionalBadge() {
  return (
    <span style={{
      padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600,
      background: 'rgba(184,144,64,0.12)', color: C.amber,
      border: `1px solid rgba(184,144,64,0.3)`,
    }}>Optional</span>
  );
}

function CtaBar({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '18px 24px',
      background: 'white', borderTop: `1px solid ${C.border}`,
    }}>
      {children}
    </div>
  );
}

function Btn({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled,
  type = 'button',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'outline' | 'green';
  size?: 'md' | 'lg';
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  const base: React.CSSProperties = {
    padding: size === 'lg' ? '13px 32px' : '10px 22px',
    borderRadius: size === 'lg' ? 12 : 10,
    fontFamily: 'inherit', fontSize: size === 'lg' ? 14 : 13, fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    border: 'none', display: 'inline-flex', alignItems: 'center', gap: 6,
    opacity: disabled ? 0.6 : 1, transition: 'opacity 0.15s',
  };
  const variants = {
    primary: { background: C.forest, color: C.parchment },
    outline: { background: 'transparent', border: `1.5px solid ${C.borderStrong}`, color: C.forest },
    green:   { background: C.egreen, color: C.carbon },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant] }}>
      {children}
    </button>
  );
}

// ─── Stepper ──────────────────────────────────────────────────────────────────

const STEPS = [
  { label: 'Buyer Info', sub: 'Identity & financials' },
  { label: 'Offer Details', sub: 'Price & conditions' },
  { label: 'Review & Submit', sub: 'Confirm & sign off' },
];

function Stepper({ current }: { current: Step }) {
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: 0 }}>
      <div style={{
        position: 'absolute', top: 18, left: 18, right: 18, height: 2,
        background: C.borderMid, zIndex: 0,
      }} />
      {STEPS.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, position: 'relative', zIndex: 1 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 600,
              background: done ? C.forest : active ? C.egreen : 'white',
              border: `2px solid ${done ? C.forest : active ? C.egreen : C.borderStrong}`,
              color: done ? C.parchment : active ? C.carbon : C.muted,
              boxShadow: active ? `0 0 0 4px rgba(0,232,122,0.18)` : 'none',
            }}>
              {done ? <Check size={14} strokeWidth={3} /> : i + 1}
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: active ? 600 : 500, color: active || done ? C.forest : C.muted }}>{s.label}</div>
              <div style={{ fontSize: 10, color: C.muted, opacity: 0.7 }}>{s.sub}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Property Sidebar ─────────────────────────────────────────────────────────

function PropertySidebar({ property }: { property: PropertyListing | null }) {
  const price = property
    ? parseFloat(property.price ?? '0').toLocaleString('en-ZA', { style: 'currency', currency: property.currency ?? 'ZAR', maximumFractionDigits: 0 })
    : '—';

  const media = (property as any)?.media ?? [];
  const imgUrl = media?.[0]?.thumbnail_url ?? media?.[0]?.url ?? DEFAULT_PROP_IMAGE;

  const beds = (property as any)?.bedrooms ?? (property as any)?.bedroom_count ?? null;
  const baths = (property as any)?.bathrooms ?? (property as any)?.bathroom_count ?? null;
  const size = (property as any)?.plot_size ?? (property as any)?.floor_area ?? null;

  const agentName = (property as any)?.agent?.name ?? (property as any)?.agent_name ?? null;
  const agentInitials = agentName?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() ?? 'AG';
  const agentTitle = (property as any)?.agent?.company ?? null;

  return (
    <aside style={{
      background: 'white',
      borderRight: `1px solid ${C.border}`,
      padding: '32px 28px 40px',
      display: 'flex',
      flexDirection: 'column',
      gap: 24,
    }}>
      <img
        src={imgUrl}
        alt={property?.title ?? 'Property'}
        onError={(e) => { e.currentTarget.src = DEFAULT_PROP_IMAGE; }}
        style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: 12, display: 'block' }}
      />

      <div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
          <span style={{ padding: '3px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, letterSpacing: '0.02em', background: 'rgba(0,232,122,0.12)', color: '#1A7A40', border: '1px solid rgba(0,232,122,0.3)' }}>
            ✓ Verified
          </span>
          <span style={{ padding: '3px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, letterSpacing: '0.02em', background: 'rgba(26,60,40,0.07)', color: C.forest, border: `1px solid ${C.borderMid}` }}>
            For Sale
          </span>
        </div>
        <div style={{ fontFamily: FRAUNCES, fontSize: 26, fontWeight: 600, color: C.forest, letterSpacing: '-0.5px', lineHeight: 1.1 }}>
          {price}
        </div>
        <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
          {(property as any)?.address ?? property?.title ?? 'Property'}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
          {beds && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, background: C.cream, padding: '4px 10px', borderRadius: 8 }}>🛏 {beds} Beds</span>}
          {baths && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, background: C.cream, padding: '4px 10px', borderRadius: 8 }}>🚿 {baths} Baths</span>}
          {size && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, background: C.cream, padding: '4px 10px', borderRadius: 8 }}>📐 {size} m²</span>}
        </div>
      </div>

      <div style={{ height: 1, background: C.border }} />

      {agentName && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.muted, marginBottom: 10 }}>Listing Agent</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: C.parchment, borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: C.forest, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FRAUNCES, fontSize: 15, color: C.parchment, fontWeight: 500, flexShrink: 0 }}>
              {agentInitials}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: C.forest }}>{agentName}</div>
              {agentTitle && <div style={{ fontSize: 11, color: C.muted }}>{agentTitle}</div>}
            </div>
          </div>
        </div>
      )}

      <div style={{ height: 1, background: C.border }} />

      <div>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.muted, marginBottom: 10 }}>Offer Context</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { label: 'Property ID', value: property?.id?.slice(0, 8).toUpperCase() ?? '—' },
            { label: 'Status', value: property ? 'Active — Available' : '—' },
            { label: 'Listed', value: property ? 'Recently' : '—' },
          ].map((r) => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: C.muted }}>{r.label}</span>
              <span style={{ fontWeight: 600, color: C.forest }}>{r.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        background: 'rgba(184,144,64,0.08)', border: '1px solid rgba(184,144,64,0.25)',
        borderRadius: 10, padding: '12px 14px', fontSize: 12, color: C.forest, lineHeight: 1.5,
      }}>
        <strong style={{ color: C.amber }}>⚡ Competitive market.</strong> Submitting a strong initial offer with clear conditions increases your chance of acceptance.
      </div>
    </aside>
  );
}

// ─── Step 1 — Buyer Information ───────────────────────────────────────────────

type Step1Errors = Partial<Record<'firstName' | 'lastName' | 'idNumber' | 'email' | 'phone' | 'address', string>>;

function Step1({
  form,
  set,
  onNext,
}: {
  form: FormState;
  set: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  onNext: () => void;
}) {
  const [errors, setErrors] = useState<Step1Errors>({});

  function validateAndNext() {
    const e: Step1Errors = {};
    if (!form.firstName.trim()) e.firstName = 'First name is required';
    if (!form.lastName.trim()) e.lastName = 'Surname is required';
    if (!form.idNumber.trim()) e.idNumber = 'ID / Passport number is required';
    if (!form.email.trim()) e.email = 'Email address is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address';
    if (!form.phone.trim()) e.phone = 'Mobile number is required';
    if (!form.address.trim()) e.address = 'Residential address is required';
    setErrors(e);
    if (Object.keys(e).length === 0) onNext();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

      {/* Identity */}
      <SectionCard>
        <SectionHead icon={User} title="Identity" subtitle="Legal name and identification as it appears on your ID document" />
        <div style={{ padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="First Name(s)" required error={errors.firstName}>
              <input style={{ ...inputStyle, borderColor: errors.firstName ? C.red : undefined }} value={form.firstName} onChange={(e) => { set('firstName', e.target.value); setErrors((prev) => ({ ...prev, firstName: undefined })); }} placeholder="Thabo" />
            </Field>
            <Field label="Surname" required error={errors.lastName}>
              <input style={{ ...inputStyle, borderColor: errors.lastName ? C.red : undefined }} value={form.lastName} onChange={(e) => { set('lastName', e.target.value); setErrors((prev) => ({ ...prev, lastName: undefined })); }} placeholder="Mokoena" />
            </Field>
            <Field label="ID / Passport Number" required error={errors.idNumber}>
              <input style={{ ...inputStyle, borderColor: errors.idNumber ? C.red : undefined }} value={form.idNumber} onChange={(e) => { set('idNumber', e.target.value); setErrors((prev) => ({ ...prev, idNumber: undefined })); }} placeholder="8501015026085" />
            </Field>
            <Field label="Nationality" required>
              <select style={selectStyle} value={form.nationality} onChange={(e) => set('nationality', e.target.value)}>
                <option>South African</option>
                <option>Zimbabwean</option>
                <option>Namibian</option>
                <option>Other</option>
              </select>
            </Field>
            <div style={{ gridColumn: 'span 2' }}>
              <Field label="Upload ID / Passport Copy">
                <UploadZone label="Drag & drop or click to upload" sub="PDF, JPG or PNG · Max 5MB" accept=".pdf,.jpg,.jpeg,.png" maxMB={5} />
              </Field>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Contact */}
      <SectionCard>
        <SectionHead icon={Mail} title="Contact Details" subtitle="Used for all correspondence and legal notifications" />
        <div style={{ padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="Email Address" required error={errors.email}>
              <input style={{ ...inputStyle, borderColor: errors.email ? C.red : undefined }} type="email" value={form.email} onChange={(e) => { set('email', e.target.value); setErrors((prev) => ({ ...prev, email: undefined })); }} placeholder="thabo@example.com" />
            </Field>
            <Field label="Mobile Number" required error={errors.phone}>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: C.muted, borderRight: `1.5px solid ${C.borderMid}`, background: C.cream, borderRadius: '10px 0 0 10px', pointerEvents: 'none' }}>+27</div>
                <input style={{ ...inputStyle, paddingLeft: 56, borderColor: errors.phone ? C.red : undefined }} value={form.phone} onChange={(e) => { set('phone', e.target.value); setErrors((prev) => ({ ...prev, phone: undefined })); }} placeholder="82 000 0000" />
              </div>
            </Field>
            <div style={{ gridColumn: 'span 2' }}>
              <Field label="Residential Address" required error={errors.address}>
                <input style={{ ...inputStyle, borderColor: errors.address ? C.red : undefined }} value={form.address} onChange={(e) => { set('address', e.target.value); setErrors((prev) => ({ ...prev, address: undefined })); }} placeholder="12 Acacia Drive, Midrand, Gauteng, 1685" />
              </Field>
            </div>
            <Field label="WhatsApp Number">
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: C.muted, borderRight: `1.5px solid ${C.borderMid}`, background: C.cream, borderRadius: '10px 0 0 10px', pointerEvents: 'none' }}>+27</div>
                <input style={{ ...inputStyle, paddingLeft: 56 }} value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} placeholder="Same as mobile" />
              </div>
            </Field>
            <Field label="Preferred Contact Method">
              <select style={selectStyle} value={form.preferredContact} onChange={(e) => set('preferredContact', e.target.value)}>
                <option>Email</option>
                <option>WhatsApp</option>
                <option>Phone Call</option>
              </select>
            </Field>
          </div>
        </div>
      </SectionCard>

      {/* Financial Qualification */}
      <SectionCard>
        <SectionHead icon={DollarSign} title="Financial Qualification" subtitle="Demonstrates your ability to complete the purchase" />
        <div style={{ padding: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label="Pre-Qualification Status" required>
              <RadioGroup
                options={[
                  { value: 'pre_approved', label: 'Pre-approved — bond approved' },
                  { value: 'pre_qualified', label: 'Pre-qualified — conditional' },
                  { value: 'cash', label: 'Cash buyer' },
                  { value: 'not_applied', label: 'Not yet applied' },
                ]}
                value={form.preQualStatus}
                onChange={(v) => set('preQualStatus', v as FormState['preQualStatus'])}
              />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="Bank / Lender">
                <select style={selectStyle} value={form.preQualBank} onChange={(e) => set('preQualBank', e.target.value)}>
                  <option>Standard Bank</option>
                  <option>FNB</option>
                  <option>ABSA</option>
                  <option>Nedbank</option>
                  <option>SA Home Loans</option>
                  <option>Other</option>
                </select>
              </Field>
              <Field label="Pre-Approval Reference">
                <input style={inputStyle} value={form.preQualReference} onChange={(e) => set('preQualReference', e.target.value)} placeholder="FNB-2024-PRE-00821" />
              </Field>
            </div>
            <Field label="Upload Proof of Funds / Pre-Approval Letter">
              <UploadZone label="Bank letter or statement" sub="PDF only · Max 10MB · Document is kept confidential" accept=".pdf" maxMB={10} />
            </Field>
          </div>
        </div>
      </SectionCard>

      {/* Buying Entity */}
      <SectionCard>
        <SectionHead icon={FileText} title="Buying Entity" subtitle="Are you purchasing as an individual or through a legal entity?" />
        <div style={{ padding: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label="Purchase In The Name Of" required>
              <RadioGroup
                options={[
                  { value: 'individual', label: 'Natural Person' },
                  { value: 'company', label: 'Company / CC' },
                  { value: 'trust', label: 'Trust' },
                  { value: 'joint', label: 'Joint Purchase' },
                ]}
                value={form.buyingEntity}
                onChange={(v) => set('buyingEntity', v as FormState['buyingEntity'])}
              />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="Represented By An Agent?">
                <select style={selectStyle} value={form.agentRepresented ? 'yes' : 'no'} onChange={(e) => set('agentRepresented', e.target.value === 'yes')}>
                  <option value="no">No — buying directly</option>
                  <option value="yes">Yes — agent listed below</option>
                </select>
              </Field>
              {form.agentRepresented && (
                <Field label="Agent Name">
                  <input style={inputStyle} value={form.agentName} onChange={(e) => set('agentName', e.target.value)} placeholder="Full name" />
                </Field>
              )}
            </div>
          </div>
        </div>
        <CtaBar>
          <span style={{ fontSize: 12, color: C.muted }}>Step <strong>1 of 3</strong> — Buyer Information</span>
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn variant="outline">Save Draft</Btn>
            <Btn onClick={validateAndNext}>Continue to Offer Details <ChevronRight size={14} /></Btn>
          </div>
        </CtaBar>
      </SectionCard>

    </div>
  );
}

// ─── Step 2 — Offer Details ───────────────────────────────────────────────────

type Step2Errors = Partial<Record<'offerAmount' | 'depositAmount' | 'expiryDate', string>>;

function Step2({
  form,
  set,
  property,
  onBack,
  onNext,
}: {
  form: FormState;
  set: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  property: PropertyListing | null;
  onBack: () => void;
  onNext: () => void;
}) {
  const askingPrice = parseFloat(property?.price ?? '0') || 0;
  const offerNum = parseAmount(form.offerAmount);
  const diff = askingPrice > 0 ? ((offerNum - askingPrice) / askingPrice) * 100 : 0;
  const diffStr = diff === 0 ? '' : diff > 0
    ? `+${diff.toFixed(1)}% above asking`
    : `${diff.toFixed(1)}% below asking`;

  const depositNum = parseAmount(form.depositAmount);
  const depositPct = offerNum > 0 ? (depositNum / offerNum) * 100 : 0;

  const [step2Errors, setStep2Errors] = useState<Step2Errors>({});
  const [inclusionInput, setInclusionInput] = useState('');

  function validateAndNext() {
    const e: Step2Errors = {};
    if (!form.offerAmount.trim() || parseAmount(form.offerAmount) <= 0) e.offerAmount = 'Offer amount is required and must be greater than 0';
    if (!form.depositAmount.trim() || parseAmount(form.depositAmount) < 0) e.depositAmount = 'Deposit amount is required';
    if (!form.expiryDate) e.expiryDate = 'Offer expiry date is required';
    else if (new Date(form.expiryDate) <= new Date()) e.expiryDate = 'Expiry date must be in the future';
    setStep2Errors(e);
    if (Object.keys(e).length === 0) onNext();
  }

  function addInclusion(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && inclusionInput.trim()) {
      set('inclusions', [...form.inclusions, inclusionInput.trim()]);
      setInclusionInput('');
    }
  }

  function removeInclusion(idx: number) {
    set('inclusions', form.inclusions.filter((_, i) => i !== idx));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

      {/* Price */}
      <SectionCard>
        <SectionHead icon={DollarSign} title="Offer Price" subtitle="Your formal purchase price offer for this property" />
        <div style={{ padding: 24 }}>
          {askingPrice > 0 && (
            <div style={{ background: C.parchment, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 18 }}>
              {[
                { label: 'Asking Price', val: `${property?.currency ?? 'R'} ${askingPrice.toLocaleString('en-ZA')}` },
                { label: 'Your Offer', val: offerNum > 0 ? `${property?.currency ?? 'R'} ${offerNum.toLocaleString('en-ZA')}` : '—', highlight: true },
              ].map((item) => (
                <div key={item.label}>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: C.muted }}>{item.label}</div>
                  <div style={{ fontFamily: FRAUNCES, fontSize: 15, fontWeight: 500, color: item.highlight ? C.egreen : C.forest, marginTop: 2 }}>{item.val}</div>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="Offer Amount" required hint={!step2Errors.offerAmount ? (diffStr || undefined) : undefined} error={step2Errors.offerAmount}>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: C.muted, borderRight: `1.5px solid ${C.borderMid}`, background: C.cream, borderRadius: '10px 0 0 10px', pointerEvents: 'none' }}>R</div>
                <input
                  style={{ ...inputStyle, paddingLeft: 56, borderColor: step2Errors.offerAmount ? C.red : undefined }}
                  value={form.offerAmount}
                  onChange={(e) => { set('offerAmount', e.target.value); setStep2Errors((prev) => ({ ...prev, offerAmount: undefined })); }}
                  onBlur={() => { if (form.offerAmount) set('offerAmount', formatZAR(form.offerAmount)); }}
                  placeholder="3 250 000"
                />
              </div>
            </Field>
            <Field label="Currency" required>
              <select style={selectStyle} value={form.currency} onChange={(e) => set('currency', e.target.value)}>
                <option value="ZAR">ZAR — South African Rand</option>
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
                <option value="EUR">EUR</option>
              </select>
            </Field>
          </div>
        </div>
      </SectionCard>

      {/* Deposit */}
      <SectionCard>
        <SectionHead icon={ShieldCheck} title="Deposit" subtitle="Held in regulated trust by the conveyancer until transfer" />
        <div style={{ padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="Deposit Amount" required error={step2Errors.depositAmount}>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: C.muted, borderRight: `1.5px solid ${C.borderMid}`, background: C.cream, borderRadius: '10px 0 0 10px', pointerEvents: 'none' }}>R</div>
                <input
                  style={{ ...inputStyle, paddingLeft: 56, borderColor: step2Errors.depositAmount ? C.red : undefined }}
                  value={form.depositAmount}
                  onChange={(e) => { set('depositAmount', e.target.value); setStep2Errors((prev) => ({ ...prev, depositAmount: undefined })); }}
                  onBlur={() => { if (form.depositAmount) set('depositAmount', formatZAR(form.depositAmount)); }}
                  placeholder="325 000"
                />
              </div>
            </Field>
            <Field label="Deposit Percentage">
              <input
                style={{ ...inputStyle }}
                value={depositPct > 0 ? `${depositPct.toFixed(1)}%` : ''}
                readOnly
                placeholder="Auto-calculated"
              />
            </Field>
            {/* deposit progress bar */}
            <div style={{ gridColumn: 'span 2' }}>
              <div style={{ height: 8, borderRadius: 99, background: C.cream, overflow: 'hidden', marginBottom: 4 }}>
                <div style={{ height: '100%', background: C.egreen, borderRadius: 99, width: `${Math.min(depositPct, 100)}%`, transition: 'width 0.3s' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.muted }}>
                <span>R 0</span>
                {depositPct > 0 && <span style={{ color: C.forest, fontWeight: 600 }}>Deposit: {depositPct.toFixed(1)}%</span>}
                <span>{offerNum > 0 ? `R ${offerNum.toLocaleString('en-ZA')}` : ''}</span>
              </div>
            </div>
            <Field label="Deposit Due Within" required>
              <select style={selectStyle} value={form.depositDueDays} onChange={(e) => set('depositDueDays', e.target.value)}>
                <option value="3">3 days of acceptance</option>
                <option value="5">5 days of acceptance</option>
                <option value="7">7 days of acceptance</option>
                <option value="10">10 days of acceptance</option>
              </select>
            </Field>
            <Field label="Deposit Held By">
              <select style={selectStyle} value={form.depositHeldBy} onChange={(e) => set('depositHeldBy', e.target.value)}>
                <option value="conveyancer">Conveyancer's Trust Account</option>
                <option value="seller_attorney">Seller's Attorney</option>
                <option value="agency_trust">Estate Agency Trust</option>
              </select>
            </Field>
          </div>
        </div>
      </SectionCard>

      {/* Financing */}
      <SectionCard>
        <SectionHead icon={DollarSign} title="Financing Type" subtitle="How the purchase will be funded" />
        <div style={{ padding: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label="Financing Method" required>
              <RadioGroup
                options={[
                  { value: 'cash', label: 'Cash' },
                  { value: 'bond', label: 'Home Loan (Bond)' },
                  { value: 'part_cash_bond', label: 'Part Cash / Part Bond' },
                  { value: 'subject_to_bond', label: 'Subject to Bond Approval' },
                ]}
                value={form.financing}
                onChange={(v) => set('financing', v as FormState['financing'])}
              />
            </Field>
            {form.financing !== 'cash' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label="Bond Amount Required">
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: C.muted, borderRight: `1.5px solid ${C.borderMid}`, background: C.cream, borderRadius: '10px 0 0 10px', pointerEvents: 'none' }}>R</div>
                    <input style={{ ...inputStyle, paddingLeft: 56 }} value={form.bondAmount} onChange={(e) => set('bondAmount', e.target.value)} placeholder="2 790 000" />
                  </div>
                </Field>
                <Field label="Preferred Lender">
                  <select style={selectStyle} value={form.bondLender} onChange={(e) => set('bondLender', e.target.value)}>
                    <option>FNB Home Loans</option>
                    <option>Standard Bank</option>
                    <option>ABSA</option>
                    <option>Nedbank</option>
                    <option>SA Home Loans</option>
                  </select>
                </Field>
                <div style={{ gridColumn: 'span 2' }}>
                  <Field label="Bond Suspensive Condition Deadline" hint="If bond is not approved by this date, the offer lapses automatically">
                    <input style={inputStyle} type="date" value={form.bondDeadline} onChange={(e) => set('bondDeadline', e.target.value)} />
                  </Field>
                </div>
              </div>
            )}
          </div>
        </div>
      </SectionCard>

      {/* Conditions */}
      <SectionCard>
        <SectionHead icon={CheckCircle} title="Conditions & Special Terms" subtitle="Suspensive or resolutive conditions attached to this offer" />
        <div style={{ padding: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Field label="Standard Conditions">
              <div style={{ marginTop: 4 }}>
                {[
                  { key: 'condBuildingInspection', label: 'Subject to Satisfactory Building Inspection', desc: 'Offer lapses if inspection reveals material defects' },
                  { key: 'condBondApproval', label: 'Subject to Bond Approval', desc: 'Offer lapses if home loan is not approved' },
                  { key: 'condSubjectToSale', label: 'Subject to Sale of My Current Property', desc: 'Offer is contingent on selling my existing property first' },
                  { key: 'condVacantOccupation', label: 'Vacant Occupation on Transfer', desc: 'Property must be vacant when title transfers' },
                  { key: 'condElectricalCoc', label: 'Electrical Compliance Certificate Required', desc: 'Seller must provide valid CoC at own cost' },
                ].map(({ key, label, desc }) => (
                  <ToggleRow
                    key={key}
                    label={label}
                    desc={desc}
                    on={form[key as keyof FormState] as boolean}
                    onToggle={() => set(key as keyof FormState, !form[key as keyof FormState] as any)}
                  />
                ))}
              </div>
            </Field>

            <Field label="Specific Inclusions">
              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: 6,
                padding: '10px 13px', border: `1.5px solid ${C.borderMid}`,
                borderRadius: 10, minHeight: 46, alignItems: 'center', background: 'white',
              }}>
                {form.inclusions.map((tag, i) => (
                  <span key={i} style={{ padding: '5px 10px', borderRadius: 99, fontSize: 11, fontWeight: 500, background: C.forest, color: C.parchment, display: 'flex', alignItems: 'center', gap: 4 }}>
                    {tag}
                    <span style={{ cursor: 'pointer', opacity: 0.6, lineHeight: 1 }} onClick={() => removeInclusion(i)}>×</span>
                  </span>
                ))}
                <input
                  style={{ border: 'none', outline: 'none', flex: 1, fontFamily: 'inherit', fontSize: 14, color: C.forest, minWidth: 80, padding: 0, background: 'transparent' }}
                  placeholder="Type and press Enter…"
                  value={inclusionInput}
                  onChange={(e) => setInclusionInput(e.target.value)}
                  onKeyDown={addInclusion}
                />
              </div>
            </Field>

            <Field label="Custom / Special Conditions">
              <textarea
                style={{ ...inputStyle, resize: 'vertical', minHeight: 88 }}
                value={form.customConditions}
                onChange={(e) => set('customConditions', e.target.value)}
                placeholder="e.g. Seller to repaint interior prior to occupation…"
              />
            </Field>
          </div>
        </div>
      </SectionCard>

      {/* Escalation Clause */}
      <SectionCard>
        <SectionHead icon={TrendingUp} title="Escalation Clause" subtitle="Automatically increase your offer to stay competitive against other buyers" badge={<OptionalBadge />} />
        <div style={{ padding: 24 }}>
          <div style={{ background: C.parchment, border: `1px solid ${C.borderMid}`, borderRadius: 12, padding: 16, display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 18 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: C.amber, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 15 }}>⚡</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.forest, marginBottom: 2 }}>Smart Escalation</div>
              <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>If a competing offer is received that exceeds yours, your offer will automatically increase by your chosen increment — up to your maximum cap.</div>
            </div>
          </div>
          <ToggleRow
            label="Enable Escalation Clause"
            desc="Auto-increase offer if a better competing offer arrives"
            on={form.escalationEnabled}
            onToggle={() => set('escalationEnabled', !form.escalationEnabled)}
          />
          {form.escalationEnabled && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
              <Field label="Escalation Increment" hint="Amount to increase per competing offer">
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: C.muted, borderRight: `1.5px solid ${C.borderMid}`, background: C.cream, borderRadius: '10px 0 0 10px', pointerEvents: 'none' }}>R</div>
                  <input style={{ ...inputStyle, paddingLeft: 56 }} value={form.escalationIncrement} onChange={(e) => set('escalationIncrement', e.target.value)} placeholder="10 000" />
                </div>
              </Field>
              <Field label="Maximum Cap" hint="Never exceed this price regardless of competition">
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: C.muted, borderRight: `1.5px solid ${C.borderMid}`, background: C.cream, borderRadius: '10px 0 0 10px', pointerEvents: 'none' }}>R</div>
                  <input style={{ ...inputStyle, paddingLeft: 56 }} value={form.escalationCap} onChange={(e) => set('escalationCap', e.target.value)} placeholder="3 500 000" />
                </div>
              </Field>
            </div>
          )}
        </div>
      </SectionCard>

      {/* Dates */}
      <SectionCard>
        <SectionHead icon={Calendar} title="Dates & Validity" subtitle="When the offer expires and when you would like to take occupation" />
        <div style={{ padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="Offer Expiry Date" required hint={!step2Errors.expiryDate ? "Seller has until this date to accept or counter" : undefined} error={step2Errors.expiryDate}>
              <input style={{ ...inputStyle, borderColor: step2Errors.expiryDate ? C.red : undefined }} type="date" value={form.expiryDate} onChange={(e) => { set('expiryDate', e.target.value); setStep2Errors((prev) => ({ ...prev, expiryDate: undefined })); }} />
            </Field>
            <Field label="Expiry Time" required>
              <select style={selectStyle} value={form.expiryTime} onChange={(e) => set('expiryTime', e.target.value)}>
                <option value="09:00">09:00</option>
                <option value="12:00">12:00</option>
                <option value="17:00">17:00</option>
                <option value="23:59">23:59</option>
              </select>
            </Field>
            <Field label="Preferred Occupation Date">
              <input style={inputStyle} type="date" value={form.occupationDate} onChange={(e) => set('occupationDate', e.target.value)} />
            </Field>
            <Field label="Preferred Transfer Date">
              <input style={inputStyle} type="date" value={form.transferDate} onChange={(e) => set('transferDate', e.target.value)} />
            </Field>
          </div>
          {form.expiryDate && (
            <div style={{ marginTop: 16, background: 'rgba(0,232,122,0.07)', border: '1px solid rgba(0,232,122,0.25)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: C.forest }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.egreen, flexShrink: 0 }} />
              <span>Your offer will be valid until <strong>{new Date(`${form.expiryDate}T${form.expiryTime}`).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })} at {form.expiryTime}</strong>. You'll be notified immediately when the seller responds.</span>
            </div>
          )}
        </div>
      </SectionCard>

      {/* Personal message */}
      <SectionCard>
        <SectionHead icon={MessageSquare} title="Personal Message to Seller" subtitle="Humanise your offer — buyers who include a note often stand out" badge={<OptionalBadge />} />
        <div style={{ padding: 24 }}>
          <Field label="Message">
            <textarea
              style={{ ...inputStyle, resize: 'vertical', minHeight: 100 }}
              value={form.messageToSeller}
              onChange={(e) => set('messageToSeller', e.target.value)}
              placeholder="e.g. We are a young family who fell in love with this property's character and location…"
            />
          </Field>
        </div>
        <CtaBar>
          <span style={{ fontSize: 12, color: C.muted }}>Step <strong>2 of 3</strong> — Offer Details</span>
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn variant="outline" onClick={onBack}><ArrowLeft size={14} /> Back</Btn>
            <Btn variant="outline">Save Draft</Btn>
            <Btn onClick={validateAndNext}>Review &amp; Submit <ChevronRight size={14} /></Btn>
          </div>
        </CtaBar>
      </SectionCard>

    </div>
  );
}

// ─── Step 3 — Review & Submit ─────────────────────────────────────────────────

const FINANCING_LABEL: { [k: string]: string } = {
  cash: 'Cash — no bond',
  bond: 'Home Loan (Bond)',
  part_cash_bond: 'Part Cash / Part Bond',
  subject_to_bond: 'Subject to Bond Approval',
};

function Step3({
  form,
  set,
  property: _property,
  submitting,
  error,
  onBack,
  onSubmit,
}: {
  form: FormState;
  set: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  property: PropertyListing | null;
  submitting: boolean;
  error: string | null;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const offerNum = parseAmount(form.offerAmount);
  const depositNum = parseAmount(form.depositAmount);
  const depositPct = offerNum > 0 ? ((depositNum / offerNum) * 100).toFixed(1) : '—';
  const allDecl = form.decl1 && form.decl2 && form.decl3;
  const currencySymbol = form.currency === 'ZAR' ? 'R' : form.currency;

  const conditions: string[] = [];
  if (form.condBondApproval) conditions.push('Bond Approval');
  if (form.condBuildingInspection) conditions.push('Building Inspection');
  if (form.condVacantOccupation) conditions.push('Vacant Occupation');
  if (form.condElectricalCoc) conditions.push('Electrical CoC');
  if (form.condSubjectToSale) conditions.push('Subject to Sale');
  const escalationLabel = form.escalationEnabled
    ? 'Escalation Clause (cap ' + (form.escalationCap ? 'R ' + formatZAR(form.escalationCap) : '—') + ')'
    : null;
  if (escalationLabel) conditions.push(escalationLabel);
  form.inclusions.forEach((i) => conditions.push(i));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

      {/* Summary */}
      <SectionCard>
        <SectionHead icon={CheckCircle} title="Offer Summary" subtitle="Please review carefully before submitting" />
        <div style={{ padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* Buyer column */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: C.muted, marginBottom: 10 }}>Buyer</div>
              {[
                { k: 'Full Name', v: `${form.firstName} ${form.lastName}` },
                { k: 'ID Number', v: form.idNumber || '—' },
                { k: 'Contact', v: form.phone ? `+27 ${form.phone}` : '—' },
                { k: 'Buying As', v: ({ individual: 'Natural Person', company: 'Company / CC', trust: 'Trust', joint: 'Joint Purchase' })[form.buyingEntity] },
                { k: 'Pre-Approval', v: ({ pre_approved: '✓ Approved', pre_qualified: 'Conditional', cash: 'Cash Buyer', not_applied: 'Not yet applied' })[form.preQualStatus] },
              ].map((r) => (
                <div key={r.k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '11px 0', borderBottom: `1px solid ${C.border}`, gap: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 500, color: C.muted }}>{r.k}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: r.k === 'Pre-Approval' && form.preQualStatus === 'pre_approved' ? '#1A7A40' : C.forest, textAlign: 'right' }}>{r.v}</span>
                </div>
              ))}
            </div>
            {/* Offer column */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: C.muted, marginBottom: 10 }}>Offer</div>
              {[
                { k: 'Offer Price', v: offerNum > 0 ? `${currencySymbol} ${offerNum.toLocaleString('en-ZA')}` : '—', big: true },
                { k: `Deposit (${depositPct}%)`, v: depositNum > 0 ? `${currencySymbol} ${depositNum.toLocaleString('en-ZA')}` : '—' },
                { k: 'Financing', v: FINANCING_LABEL[form.financing] },
                { k: 'Occupation Date', v: form.occupationDate ? new Date(form.occupationDate).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' }) : '—' },
                { k: 'Offer Expires', v: form.expiryDate ? `${new Date(form.expiryDate).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })} · ${form.expiryTime}` : '—' },
              ].map((r) => (
                <div key={r.k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '11px 0', borderBottom: `1px solid ${C.border}`, gap: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 500, color: C.muted }}>{r.k}</span>
                  <span style={{ fontFamily: r.big ? FRAUNCES : 'inherit', fontSize: r.big ? 20 : 13, fontWeight: r.big ? 600 : 500, color: C.forest, textAlign: 'right' }}>{r.v}</span>
                </div>
              ))}
            </div>
          </div>

          {conditions.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: C.muted, marginBottom: 10 }}>Active Conditions</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {conditions.map((c) => (
                  <span key={c} style={{ padding: '5px 10px', borderRadius: 99, fontSize: 11, fontWeight: 500, background: C.forest, color: C.parchment, border: `1px solid ${C.forest}` }}>✓ {c}</span>
                ))}
              </div>
            </div>
          )}

          {/* Protection block */}
          <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: C.parchment, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px' }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: C.muted, marginBottom: 8 }}>Platform Protection</div>
              {['Escrow-ready on acceptance', 'Immutable audit trail recorded', 'Verified listing — fraud checked'].map((t) => (
                <div key={t} style={{ fontSize: 12, color: C.forest, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Check size={12} color={C.egreen} strokeWidth={3} /> {t}
                </div>
              ))}
            </div>
            <div style={{ background: 'rgba(0,232,122,0.07)', border: '1px solid rgba(0,232,122,0.22)', borderRadius: 10, padding: '10px 14px' }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: C.muted, marginBottom: 8 }}>What Happens Next</div>
              {["Seller's agent is notified", 'Seller has until expiry to respond', 'You receive instant status updates', 'Deposit held securely in trust'].map((t) => (
                <div key={t} style={{ fontSize: 12, color: C.forest, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <ChevronRight size={11} color={C.muted} /> {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Declaration */}
      <SectionCard>
        <SectionHead icon={ShieldCheck} title="Declaration & Consent" subtitle="Read carefully before signing" />
        <div style={{ padding: 24 }}>
          <div style={{ background: 'rgba(26,60,40,0.04)', border: `1px solid ${C.borderMid}`, borderRadius: 10, padding: '14px 16px', fontSize: 12, color: C.muted, lineHeight: 1.7, marginBottom: 18 }}>
            This Offer to Purchase ("Offer") is submitted electronically via the BuildTrust platform and constitutes a binding and irrevocable offer to purchase the above-described property on the terms and conditions set out herein, pending acceptance by the Seller. The Offer shall be governed by the Alienation of Land Act 68 of 1981. By proceeding, you acknowledge that you have read and understood all conditions and are authorised to make this offer.
            The deposit will be held in a regulated attorney trust account and released only upon successful transfer of the property at the Deeds Office.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <CheckboxRow checked={form.decl1} onChange={() => set('decl1', !form.decl1)}>
              I confirm that all information provided is accurate and complete to the best of my knowledge.
            </CheckboxRow>
            <CheckboxRow checked={form.decl2} onChange={() => set('decl2', !form.decl2)}>
              I authorise BuildTrust to share this offer with the seller's agent and conveyancer for the purpose of processing.
            </CheckboxRow>
            <CheckboxRow checked={form.decl3} onChange={() => set('decl3', !form.decl3)}>
              I understand this offer is binding upon acceptance and I have legal capacity to enter into an agreement.
            </CheckboxRow>
            <CheckboxRow checked={form.decl4} onChange={() => set('decl4', !form.decl4)}>
              I consent to receive SMS / WhatsApp / email updates regarding the status of this offer.
            </CheckboxRow>
          </div>

          {error && (
            <div style={{ marginTop: 16, background: 'rgba(196,86,42,0.08)', border: '1px solid rgba(196,86,42,0.25)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: C.red, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}
        </div>
        <CtaBar>
          <span style={{ fontSize: 12, color: C.muted, maxWidth: 340, lineHeight: 1.4 }}>
            Submitting is <strong style={{ color: C.forest }}>legally binding</strong> if accepted. You can retract before acceptance.
          </span>
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn variant="outline" onClick={onBack} disabled={submitting}><ArrowLeft size={14} /> Back</Btn>
            <Btn variant="outline" disabled={submitting}><Download size={14} /> Download Draft PDF</Btn>
            <Btn variant="green" size="lg" onClick={onSubmit} disabled={!allDecl || submitting}>
              {submitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              {submitting ? 'Submitting…' : 'Submit Offer'}
            </Btn>
          </div>
        </CtaBar>
      </SectionCard>

    </div>
  );
}

// ─── Success Screen ────────────────────────────────────────────────────────────

// ─── Existing offer screen ────────────────────────────────────────────────────

function ExistingOfferScreen({
  offer,
  property,
  withdrawing,
  withdrawError,
  onWithdraw,
}: {
  offer: BuyerOfferResponse;
  property: PropertyListing | null;
  withdrawing: boolean;
  withdrawError: string | null;
  onWithdraw: () => void;
}) {
  const router = useRouter();

  const statusMap: Record<string, { label: string; bg: string; color: string; border: string }> = {
    submitted: { label: 'Submitted — Under Review', bg: 'rgba(0,232,122,0.08)', color: '#1A7A40', border: 'rgba(0,232,122,0.3)' },
    pending:   { label: 'Pending Review', bg: 'rgba(184,144,64,0.08)', color: C.amber, border: 'rgba(184,144,64,0.3)' },
    accepted:  { label: 'Accepted', bg: 'rgba(0,232,122,0.08)', color: '#1A7A40', border: 'rgba(0,232,122,0.3)' },
    rejected:  { label: 'Rejected', bg: 'rgba(196,86,42,0.08)', color: C.red, border: 'rgba(196,86,42,0.3)' },
    countered: { label: 'Counter-Offer Received', bg: 'rgba(184,144,64,0.08)', color: C.amber, border: 'rgba(184,144,64,0.3)' },
  };
  const st = statusMap[offer.status] ?? statusMap.submitted;

  function fmtAmount(v: string) {
    const n = parseFloat(v);
    if (isNaN(n)) return v;
    return `R ${n.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}`;
  }
  function fmtDate(iso: string) {
    try {
      return new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return iso;
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, padding: '40px 52px 80px' }}>
      <div>
        <h1 style={{ fontFamily: FRAUNCES, fontSize: 28, fontWeight: 500, color: C.forest, letterSpacing: '-0.5px', marginBottom: 6 }}>Your Offer</h1>
        <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
          {property?.title ?? 'This property'}
          {property?.location ? ` · ${property.location}` : ''}
        </p>
      </div>

      <SectionCard>
        <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Status */}
          <div>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '5px 14px', borderRadius: 99,
              fontSize: 12, fontWeight: 600, letterSpacing: '0.02em',
              background: st.bg, color: st.color, border: `1px solid ${st.border}`,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: st.color, display: 'inline-block' }} />
              {st.label}
            </span>
          </div>

          {/* Amount */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.muted, marginBottom: 4 }}>Offer Amount</div>
            <div style={{ fontFamily: FRAUNCES, fontSize: 36, fontWeight: 600, color: C.forest, letterSpacing: '-1px', lineHeight: 1.1 }}>{fmtAmount(offer.amount)}</div>
          </div>

          <div style={{ height: 1, background: C.border }} />

          {/* Detail grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 32px' }}>
            {[
              { label: 'Deposit', value: fmtAmount(offer.deposit_amount) },
              { label: 'Financing', value: offer.financing.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) },
              { label: 'Submitted', value: fmtDate(offer.submitted_at) },
              { label: 'Expires', value: fmtDate(offer.expires_at) },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.muted, marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 14, fontWeight: 500, color: C.forest }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      {withdrawError && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: 'rgba(196,86,42,0.08)', border: '1px solid rgba(196,86,42,0.25)', borderRadius: 10, fontSize: 13, color: C.red }}>
          <AlertCircle size={14} /> {withdrawError}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Btn variant="outline" onClick={() => router.push('/app/my-dashboard')}>
          <ArrowLeft size={14} /> Back to Dashboard
        </Btn>
        <button
          onClick={onWithdraw}
          disabled={withdrawing}
          style={{
            padding: '10px 22px', borderRadius: 10,
            fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
            cursor: withdrawing ? 'not-allowed' : 'pointer',
            background: 'transparent',
            border: `1.5px solid ${C.red}`,
            color: C.red,
            opacity: withdrawing ? 0.6 : 1,
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}
        >
          {withdrawing ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Withdrawing…</> : 'Withdraw Offer'}
        </button>
      </div>
    </div>
  );
}

function SuccessScreen({ propertyId }: { propertyId: string }) {
  const router = useRouter();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 480, gap: 24, padding: '60px 24px', textAlign: 'center' }}>
      <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(0,232,122,0.12)', border: '2px solid rgba(0,232,122,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CheckCircle size={36} color={C.egreen} />
      </div>
      <div>
        <h2 style={{ fontFamily: FRAUNCES, fontSize: 28, fontWeight: 500, color: C.forest, marginBottom: 8 }}>Offer Submitted!</h2>
        <p style={{ fontSize: 14, color: C.muted, maxWidth: 440, lineHeight: 1.6 }}>
          Your offer has been formally submitted to the seller's agent. You'll receive an immediate confirmation by email and will be notified the moment the seller responds.
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 320 }}>
        {[
          '📧 Confirmation email sent',
          '🔔 Notifications enabled',
          '🔒 Offer securely recorded',
        ].map((t) => (
          <div key={t} style={{ background: C.parchment, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 16px', fontSize: 13, color: C.forest }}>{t}</div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <Btn variant="outline" onClick={() => router.push('/app/my-dashboard')}>Back to Dashboard</Btn>
        <Btn variant="primary" onClick={() => router.push(`/app/property/${propertyId}`)}>View Property</Btn>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function MakeOfferForm({ propertyId }: { propertyId: string }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [property, setProperty] = useState<PropertyListing | null>(null);
  const [form, setFormState] = useState<FormState>(() => defaultFormState(null));
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Existing offer state
  const [existingOffer, setExistingOffer] = useState<BuyerOfferResponse | null>(null);
  const [offerLoading, setOfferLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  // Prefill user data + load property + check for existing offer
  useEffect(() => {
    const user = getStoredUser();
    if (user) {
      setFormState((prev) => ({
        ...prev,
        firstName: (user as any).firstName ?? (user as any).first_name ?? prev.firstName,
        lastName: (user as any).lastName ?? (user as any).last_name ?? prev.lastName,
        email: (user as any).email ?? prev.email,
      }));
    }
    const token = getAccessToken();
    if (token && propertyId) {
      Promise.all([
        propertiesApi.getById(propertyId, token).catch(() => null),
        buyerOffersApi.list(token).catch(() => [] as BuyerOfferResponse[]),
      ]).then(([p, offers]) => {
        if (p) setProperty(p);
        const active = (offers as BuyerOfferResponse[]).find(
          (o) => o.property_id === propertyId && o.status !== 'withdrawn',
        );
        setExistingOffer(active ?? null);
        setOfferLoading(false);
      });
    } else {
      setOfferLoading(false);
    }
  }, [propertyId]);

  async function handleWithdraw() {
    if (!existingOffer) return;
    const token = getAccessToken();
    if (!token) return;
    setWithdrawing(true);
    setWithdrawError(null);
    try {
      await buyerOffersApi.withdraw(token, existingOffer.id);
      setExistingOffer(null);
    } catch (err: unknown) {
      setWithdrawError(err instanceof Error ? err.message : 'Failed to withdraw offer. Please try again.');
    } finally {
      setWithdrawing(false);
    }
  }

  const set = useCallback(<K extends keyof FormState>(k: K, v: FormState[K]) => {
    setFormState((prev) => ({ ...prev, [k]: v }));
  }, []);

  async function handleSubmit() {
    const token = getAccessToken();
    if (!token) {
      setSubmitError('You must be logged in to submit an offer.');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload: BuyerOfferPayload = {
        buyerFirstName: form.firstName,
        buyerLastName: form.lastName,
        buyerIdNumber: form.idNumber,
        buyerNationality: form.nationality,
        buyerEmail: form.email,
        buyerPhone: form.phone,
        buyerWhatsapp: form.whatsapp || undefined,
        buyerPreferredContact: form.preferredContact,
        buyerAddress: form.address || undefined,
        buyingEntity: form.buyingEntity,
        agentRepresented: form.agentRepresented,
        agentName: form.agentName || undefined,
        preQualStatus: form.preQualStatus,
        preQualBank: form.preQualBank || undefined,
        preQualReference: form.preQualReference || undefined,
        amount: parseAmount(form.offerAmount),
        currency: form.currency,
        depositAmount: parseAmount(form.depositAmount),
        depositDueDays: parseInt(form.depositDueDays, 10),
        depositHeldBy: form.depositHeldBy,
        financing: form.financing,
        bondAmount: form.bondAmount ? parseAmount(form.bondAmount) : undefined,
        bondLender: form.bondLender || undefined,
        bondDeadline: form.bondDeadline || undefined,
        conditionBuildingInspection: form.condBuildingInspection,
        conditionBondApproval: form.condBondApproval,
        conditionSubjectToSale: form.condSubjectToSale,
        conditionVacantOccupation: form.condVacantOccupation,
        conditionElectricalCoc: form.condElectricalCoc,
        inclusions: form.inclusions.length > 0 ? form.inclusions : undefined,
        customConditions: form.customConditions || undefined,
        escalationEnabled: form.escalationEnabled,
        escalationIncrement: form.escalationEnabled && form.escalationIncrement ? parseAmount(form.escalationIncrement) : undefined,
        escalationCap: form.escalationEnabled && form.escalationCap ? parseAmount(form.escalationCap) : undefined,
        expiresAt: form.expiryDate ? `${form.expiryDate}T${form.expiryTime}:00` : new Date(Date.now() + 7 * 86400000).toISOString(),
        preferredOccupationDate: form.occupationDate || undefined,
        preferredTransferDate: form.transferDate || undefined,
        messageToSeller: form.messageToSeller || undefined,
      };
      await buyerOffersApi.submit(token, propertyId, payload);
      setSubmitted(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit offer. Please try again.';
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: C.parchment }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '80px 24px' }}>
          <SectionCard>
            <SuccessScreen propertyId={propertyId} />
          </SectionCard>
        </div>
      </div>
    );
  }

  const showExistingOffer = !offerLoading && existingOffer !== null;

  return (
    <div style={{ minHeight: '100vh', background: C.parchment }}>
      {/* Breadcrumb header */}
      <div style={{ background: C.forest, height: 52, display: 'flex', alignItems: 'center', padding: '0 32px', gap: 8 }}>
        <button onClick={() => router.push('/app/my-dashboard')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(242,232,213,0.65)', fontSize: 13 }}>
          <ArrowLeft size={14} /> My Dashboard
        </button>
        <ChevronRight size={12} style={{ color: 'rgba(242,232,213,0.35)' }} />
        <span style={{ color: 'rgba(242,232,213,0.65)', fontSize: 13 }}>Saved Properties</span>
        <ChevronRight size={12} style={{ color: 'rgba(242,232,213,0.35)' }} />
        <span style={{ color: C.parchment, fontSize: 13, fontWeight: 500 }}>{showExistingOffer ? 'View Offer' : 'Make Offer'}</span>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', minHeight: 'calc(100vh - 52px)', maxWidth: 1280, margin: '0 auto' }}>

        {/* Sticky sidebar */}
        <div style={{ position: 'sticky', top: 0, height: 'calc(100vh - 52px)', overflowY: 'auto' }}>
          <PropertySidebar property={property} />
        </div>

        {/* Main area — show existing offer or the form */}
        {offerLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
            <Loader2 size={28} color={C.muted} style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : showExistingOffer ? (
          <ExistingOfferScreen
            offer={existingOffer!}
            property={property}
            withdrawing={withdrawing}
            withdrawError={withdrawError}
            onWithdraw={handleWithdraw}
          />
        ) : (
        <main style={{ padding: '40px 52px 80px', display: 'flex', flexDirection: 'column', gap: 36 }}>

          <div>
            <h1 style={{ fontFamily: FRAUNCES, fontSize: 28, fontWeight: 500, color: C.forest, letterSpacing: '-0.5px', marginBottom: 6 }}>Make an Offer</h1>
            <p style={{ fontSize: 13, color: C.muted, maxWidth: 480, lineHeight: 1.6 }}>Complete all sections below. Your offer will be formally submitted to the seller's agent for review. Fields marked * are required.</p>
          </div>

          <Stepper current={step} />

          {step === 0 && <Step1 form={form} set={set} onNext={() => setStep(1)} />}
          {step === 1 && <Step2 form={form} set={set} property={property} onBack={() => setStep(0)} onNext={() => setStep(2)} />}
          {step === 2 && <Step3 form={form} set={set} property={property} submitting={submitting} error={submitError} onBack={() => setStep(1)} onSubmit={handleSubmit} />}

        </main>
        )}
      </div>
    </div>
  );
}
