'use client';

import { useState } from 'react';
import {
  X,
  CheckCircle2,
  Mail,
  ArrowRight,
  Award,
  Sparkles,
  TrendingUp,
  Users,
  Home,
  Calendar,
} from 'lucide-react';
import { leadsApi, type LeadRow } from '@/lib/api-client';

interface Props {
  lead: LeadRow;
  authToken: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ConvertToClientModal({ lead, authToken, onClose, onSuccess }: Props) {
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  // Step 1 — Personal Info (pre-filled from lead)
  const nameParts = lead.name.split(' ');
  const [firstName, setFirstName] = useState(nameParts[0] ?? '');
  const [lastName, setLastName] = useState(nameParts.slice(1).join(' '));
  const [email, setEmail] = useState(lead.email ?? '');
  const [phone, setPhone] = useState(lead.phone ?? '');
  const [address, setAddress] = useState(lead.address ?? '');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');

  // Step 2 — Client Setup
  const [clientType, setClientType] = useState<'buyer' | 'seller' | 'both'>('buyer');
  const [clientStatus, setClientStatus] = useState<'active' | 'pending' | 'prospect'>('active');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('high');
  const [referralSource, setReferralSource] = useState(lead.source ?? 'Lead Conversion');

  // Step 3 — Agreement & Next Steps
  const [contractType, setContractType] = useState<'exclusive' | 'non-exclusive'>('exclusive');
  const [commissionRate, setCommissionRate] = useState('3.0');
  const [agreementDate, setAgreementDate] = useState('');
  const [agreementSigned, setAgreementSigned] = useState(false);
  const [scheduleConsultation, setScheduleConsultation] = useState(true);
  const [consultationDate, setConsultationDate] = useState('');
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const step1Valid = !!firstName && !!lastName && !!email && !!phone;

  const handleConvert = async () => {
    setSaving(true);
    setError(null);
    try {
      // Mark lead as closed/converted
      await leadsApi.update(authToken, lead.id, { stage: 'closed' });

      // Log conversion activity
      const summary = [
        `Converted to ${clientStatus} ${clientType} client`,
        `Priority: ${priority}`,
        `Contract: ${contractType} (${commissionRate}% commission)`,
        agreementSigned ? 'Agreement signed' : null,
        scheduleConsultation && consultationDate
          ? `Consultation: ${new Date(consultationDate).toLocaleDateString()}`
          : null,
      ]
        .filter(Boolean)
        .join(' | ');

      await leadsApi.createActivity(authToken, lead.id, {
        type: 'note',
        description: `Lead converted to client: ${summary}`,
      });

      // Send welcome email if requested and email is available
      if (sendWelcomeEmail && email) {
        const welcomeBody = `Hi ${firstName},\n\nWelcome! We're thrilled to have you as a client. Your dedicated agent will be in touch shortly to discuss next steps.\n\nBest regards,\nThe Team`;
        await leadsApi.sendEmail(authToken, lead.id, {
          subject: 'Welcome — You are now a client!',
          body: welcomeBody,
        });
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to convert lead');
    } finally {
      setSaving(false);
    }
  };

  // ── helpers ──────────────────────────────────────────────────────────────

  const budgetLabel = (() => {
    if (!lead.budget_min && !lead.budget_max) return null;
    const fmt = (v: string) =>
      parseFloat(v).toLocaleString('en-US', {
        style: 'currency',
        currency: lead.budget_currency,
        maximumFractionDigits: 0,
      });
    if (lead.budget_min && lead.budget_max) return `${fmt(lead.budget_min)} – ${fmt(lead.budget_max)}`;
    if (lead.budget_min) return `From ${fmt(lead.budget_min)}`;
    return `Up to ${fmt(lead.budget_max!)}`;
  })();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Convert Lead to Client</h2>
                <p className="text-sm text-gray-600 mt-0.5">Transform {lead.name} into an active client</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="mt-4 flex items-center justify-between">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex items-center flex-1">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-colors ${
                      stepNum < step
                        ? 'bg-green-600 text-white'
                        : stepNum === step
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {stepNum < step ? <CheckCircle2 className="w-5 h-5" /> : stepNum}
                  </div>
                  <span className={`text-sm font-medium ${stepNum <= step ? 'text-gray-900' : 'text-gray-500'}`}>
                    {stepNum === 1 ? 'Personal Info' : stepNum === 2 ? 'Client Setup' : 'Finalize'}
                  </span>
                </div>
                {stepNum < 3 && (
                  <div className={`h-0.5 flex-1 mx-2 ${stepNum < step ? 'bg-green-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* ── Step 1: Personal Info ─────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-blue-900 mb-1">Information Pre-filled from Lead</div>
                  <p className="text-sm text-blue-800">Review and complete any missing details.</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                    <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                    <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Address (Optional)</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                    <input type="text" value={address} onChange={(e) => setAddress(e.target.value)}
                      placeholder="123 Main Street"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                  <div className="grid grid-cols-6 gap-4">
                    <div className="col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                      <input type="text" value={city} onChange={(e) => setCity(e.target.value)}
                        placeholder="City"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Province</label>
                      <input type="text" value={province} onChange={(e) => setProvince(e.target.value)}
                        placeholder="GP" maxLength={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code</label>
                      <input type="text" value={postalCode} onChange={(e) => setPostalCode(e.target.value)}
                        placeholder="0001"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Transferred Lead Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Transferred Lead Information</h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Lead Type</div>
                      <div className="text-sm font-medium text-gray-900 capitalize">{lead.type}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Pre-Qualification</div>
                      <div className="text-sm font-medium text-gray-900">
                        {lead.prequalified ? '✓ Pre-Qualified' : 'Not Pre-Qualified'}
                      </div>
                    </div>
                    {lead.timeline && (
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Timeline</div>
                        <div className="text-sm font-medium text-gray-900">{lead.timeline}</div>
                      </div>
                    )}
                    {budgetLabel && (
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Budget Range</div>
                        <div className="text-sm font-medium text-gray-900">{budgetLabel}</div>
                      </div>
                    )}
                  </div>
                  {lead.preferences && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Preferences</div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{lead.preferences}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Client Setup ──────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Type &amp; Status</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Client Type *</label>
                    <div className="grid grid-cols-3 gap-3">
                      {([
                        { value: 'buyer', label: 'Buyer', icon: Home },
                        { value: 'seller', label: 'Seller', icon: TrendingUp },
                        { value: 'both', label: 'Both', icon: Users },
                      ] as const).map(({ value, label, icon: Icon }) => (
                        <button key={value} onClick={() => setClientType(value)}
                          className={`p-4 border-2 rounded-lg transition-all ${
                            clientType === value ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <Icon className={`w-6 h-6 mx-auto mb-2 ${clientType === value ? 'text-blue-600' : 'text-gray-400'}`} />
                          <div className={`text-sm font-medium ${clientType === value ? 'text-blue-900' : 'text-gray-900'}`}>{label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Client Status *</label>
                    <div className="grid grid-cols-3 gap-3">
                      {([
                        { value: 'active', label: 'Active', color: 'bg-green-100 text-green-700 border-green-200' },
                        { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
                        { value: 'prospect', label: 'Prospect', color: 'bg-blue-100 text-blue-700 border-blue-200' },
                      ] as const).map(({ value, label, color }) => (
                        <button key={value} onClick={() => setClientStatus(value)}
                          className={`px-4 py-3 border-2 rounded-lg font-medium transition-all ${
                            clientStatus === value ? `${color} border-current` : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority Level *</label>
                    <div className="grid grid-cols-3 gap-3">
                      {([
                        { value: 'high', label: 'High', color: 'bg-red-100 text-red-700 border-red-200' },
                        { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
                        { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-700 border-gray-200' },
                      ] as const).map(({ value, label, color }) => (
                        <button key={value} onClick={() => setPriority(value)}
                          className={`px-4 py-3 border-2 rounded-lg font-medium transition-all ${
                            priority === value ? `${color} border-current` : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Source</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Referral Source</label>
                  <input type="text" value={referralSource} onChange={(e) => setReferralSource(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Agreement & Next Steps ───────────────────────── */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Agreement</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contract Type *</label>
                    <div className="grid grid-cols-2 gap-3">
                      {([
                        { value: 'exclusive', label: 'Exclusive Agreement', desc: 'Client works exclusively with you' },
                        { value: 'non-exclusive', label: 'Non-Exclusive', desc: 'Client can work with multiple agents' },
                      ] as const).map(({ value, label, desc }) => (
                        <button key={value} onClick={() => setContractType(value)}
                          className={`p-4 border-2 rounded-lg text-left transition-all ${
                            contractType === value ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className={`font-medium mb-1 ${contractType === value ? 'text-blue-900' : 'text-gray-900'}`}>{label}</div>
                          <div className={`text-xs ${contractType === value ? 'text-blue-700' : 'text-gray-600'}`}>{desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Commission Rate (%)</label>
                      <input type="number" value={commissionRate} onChange={(e) => setCommissionRate(e.target.value)}
                        step="0.1" min="0" max="10"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Agreement Date</label>
                      <input type="date" value={agreementDate} onChange={(e) => setAgreementDate(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    </div>
                  </div>

                  <label className="flex items-start gap-3 cursor-pointer p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                    <input type="checkbox" checked={agreementSigned} onChange={(e) => setAgreementSigned(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 mt-0.5" />
                    <div>
                      <span className="text-sm font-medium text-gray-900">Agreement Signed</span>
                      <p className="text-xs text-gray-600 mt-0.5">Client has signed the representation agreement</p>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Next Steps</h3>
                <div className="space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer p-3 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors">
                    <input type="checkbox" checked={scheduleConsultation} onChange={(e) => setScheduleConsultation(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">Schedule Initial Consultation</span>
                      </div>
                      <p className="text-xs text-blue-700 mt-0.5">Set up a meeting to discuss next steps</p>
                      {scheduleConsultation && (
                        <input type="datetime-local" value={consultationDate} onChange={(e) => setConsultationDate(e.target.value)}
                          className="mt-2 w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white" />
                      )}
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer p-3 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors">
                    <input type="checkbox" checked={sendWelcomeEmail} onChange={(e) => setSendWelcomeEmail(e.target.checked)}
                      className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500 mt-0.5" />
                    <div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-900">Send Welcome Email</span>
                      </div>
                      <p className="text-xs text-green-700 mt-0.5">Automatically send a welcome email via Mailpit</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Summary Card */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 mb-2">Ready to Convert!</div>
                    <div className="text-sm text-gray-700 space-y-1">
                      <div>• Converting <strong>{firstName} {lastName}</strong> to a <strong>{clientStatus}</strong> {clientType} client</div>
                      <div>• Priority: <strong className="capitalize">{priority}</strong></div>
                      <div>• Contract: <strong>{contractType}</strong> at <strong>{commissionRate}%</strong> commission</div>
                      {agreementSigned && <div>• ✓ Agreement signed{agreementDate ? ` on ${agreementDate}` : ''}</div>}
                      {scheduleConsultation && consultationDate && (
                        <div>• 📅 Consultation: {new Date(consultationDate).toLocaleDateString()}</div>
                      )}
                      {sendWelcomeEmail && <div>• ✉️ Welcome email will be sent via Mailpit</div>}
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <button
            onClick={step === 1 ? onClose : () => setStep((s) => s - 1)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Step {step} of {totalSteps}</span>
            {step < totalSteps ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={step === 1 && !step1Valid}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleConvert}
                disabled={saving}
                className="px-6 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-all flex items-center gap-2 font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Award className="w-4 h-4" />
                {saving ? 'Converting…' : 'Convert to Client'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
