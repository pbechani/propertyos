'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Link } from '@/lib/router-compat';
import {
  ChevronLeft, Clock, CheckCircle2, AlertCircle, Circle,
  FileText, Users, DollarSign, AlertTriangle, MessageSquare, Calendar,
  Upload, Eye, Shield, Plus, RefreshCw, Trash2,
  Building2, CreditCard, ClipboardCheck, ScrollText, Send, Lock,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  salesApi,
  usersApi,
  type UserSearchResult,
  type Sale,
  type SaleStage,
  type SaleDocument,
  type OTPVersion,
  type DealRoomMessage,
  type BondApplication,
  type PersonInfo,
  type ComplianceStatus,
  type DisbursementInstruction,
  type SellerDisclosure,
  type PostSaleChecklist,
} from '@/lib/api-client';
import { getAccessToken } from '@/lib/auth-session';

// ─── Stage config for ZA (15 stages) ────────────────────────────────────────

const ZA_STAGE_NAMES: Record<number, string> = {
  1: 'Offer Submitted',
  2: 'Offer Accepted',
  3: 'Sale Agreement Drafted',
  4: 'Sale Agreement Signed',
  5: 'Deposit to Escrow',
  6: 'Title Deed Search',
  7: 'Property Survey / Valuation',
  8: 'Bond / Mortgage Approval',
  9: 'Compliance Certificates',
  10: 'Rates Clearance',
  11: 'Deeds Office Submission',
  12: 'Transfer Duty Payment',
  13: 'Capital Gains / Income Tax Clearance',
  14: 'Deeds Office Registration',
  15: 'Final Payment & Handover',
};

type TabId =
  | 'timeline'
  | 'documents'
  | 'otp'
  | 'deal-room'
  | 'bond'
  | 'compliance'
  | 'disbursement'
  | 'parties'
  | 'escrow'
  | 'issues'
  | 'checklist';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'timeline',     label: 'Timeline',        icon: Calendar },
  { id: 'documents',    label: 'Documents',        icon: FileText },
  { id: 'otp',          label: 'OTP',              icon: ScrollText },
  { id: 'deal-room',    label: 'Deal Room',        icon: MessageSquare },
  { id: 'bond',         label: 'Bond App',         icon: Building2 },
  { id: 'compliance',   label: 'Compliance',       icon: CheckCircle2 },
  { id: 'disbursement', label: 'Disbursements',    icon: CreditCard },
  { id: 'parties',      label: 'Parties',          icon: Users },
  { id: 'escrow',       label: 'Escrow',           icon: DollarSign },
  { id: 'issues',       label: 'Issues',           icon: AlertTriangle },
  { id: 'checklist',    label: 'Post-Sale',        icon: ClipboardCheck },
];

function stageStatusColor(status: string) {
  switch (status) {
    case 'completed':  return 'bg-green-100 text-green-700 border-green-300';
    case 'in_progress': return 'bg-blue-100 text-blue-700 border-blue-300';
    case 'blocked':    return 'bg-red-100 text-red-700 border-red-300';
    case 'skipped':    return 'bg-gray-100 text-gray-500 border-gray-300';
    default:           return 'bg-gray-100 text-gray-400 border-gray-200';
  }
}

function stageStatusIcon(status: string) {
  switch (status) {
    case 'completed':   return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    case 'in_progress': return <Clock className="w-5 h-5 text-blue-600" />;
    case 'blocked':     return <AlertCircle className="w-5 h-5 text-red-600" />;
    default:            return <Circle className="w-5 h-5 text-gray-300" />;
  }
}

function otpStatusBadge(status: OTPVersion['status']) {
  const map: Record<OTPVersion['status'], string> = {
    draft:           'bg-gray-100 text-gray-600',
    pending:         'bg-yellow-100 text-yellow-700',
    pending_buyer:   'bg-yellow-100 text-yellow-700',
    pending_seller:  'bg-orange-100 text-orange-700',
    signed:          'bg-green-100 text-green-700',
    counter_offered: 'bg-blue-100 text-blue-700',
    withdrawn:       'bg-red-100 text-red-700',
    expired:         'bg-red-100 text-red-500',
    accepted:        'bg-green-100 text-green-700',
    rejected:        'bg-red-100 text-red-700',
  };
  return map[status] ?? 'bg-gray-100 text-gray-600';
}

export default function PropertySaleWorkspaceEnhanced() {
  const params = useParams<{ id: string }>();
  const saleId = params?.id ?? '';

  const [selectedTab, setSelectedTab] = useState<TabId>('timeline');
  const [sale, setSale] = useState<Sale | null>(null);
  const [stages, setStages] = useState<SaleStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Enhanced data states
  const [otpVersions, setOtpVersions] = useState<OTPVersion[]>([]);
  const [dealMessages, setDealMessages] = useState<DealRoomMessage[]>([]);
  const [bondApp, setBondApp] = useState<BondApplication | null>(null);
  const [compliance, setCompliance] = useState<ComplianceStatus | null>(null);
  const [disbursements, setDisbursements] = useState<DisbursementInstruction[]>([]);
  const [disclosure, setDisclosure] = useState<SellerDisclosure | null>(null);
  const [checklist, setChecklist] = useState<PostSaleChecklist | null>(null);

  // OTP form state
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [otpPrice, setOtpPrice] = useState('');
  const [otpSubmitting, setOtpSubmitting] = useState(false);
  const [stageActionLoading, setStageActionLoading] = useState<number | null>(null);

  // Party assignment modal state
  type PartySlot = 'buyer' | 'seller' | 'agent' | 'buyerConveyancer' | 'sellerConveyancer';
  const [assigningSlot, setAssigningSlot] = useState<PartySlot | null>(null);
  const [partySearchQ, setPartySearchQ] = useState('');
  const [partySearchResults, setPartySearchResults] = useState<UserSearchResult[]>([]);
  const [partySearchLoading, setPartySearchLoading] = useState(false);
  const [partyAssignLoading, setPartyAssignLoading] = useState(false);
  const [partyAssignError, setPartyAssignError] = useState<string | null>(null);

  // Document state
  const [saleDocuments, setSaleDocuments] = useState<SaleDocument[]>([]);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadStageNum, setUploadStageNum] = useState(1);
  const [uploadDocName, setUploadDocName] = useState('');
  const [uploadDocType, setUploadDocType] = useState('');
  const [uploadSubmitting, setUploadSubmitting] = useState(false);

  // Deal Room form state
  const [dealMsgContent, setDealMsgContent] = useState('');
  const [dealMsgThread, setDealMsgThread] = useState<'general' | 'legal' | 'financial' | 'compliance'>('general');
  const [dealMsgSubmitting, setDealMsgSubmitting] = useState(false);

  const token = getAccessToken();

  const loadSale = useCallback(async () => {
    if (!token || !saleId) return;
    setLoading(true);
    setError(null);
    try {
      const [saleData, stagesData] = await Promise.all([
        salesApi.getById(token, saleId),
        salesApi.getStages(token, saleId),
      ]);
      setSale(saleData);
      setStages(stagesData);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load sale');
    } finally {
      setLoading(false);
    }
  }, [token, saleId]);

  const loadTabData = useCallback(async (tab: TabId) => {
    if (!token || !saleId) return;
    try {
      if (tab === 'documents') {
        const data = await salesApi.getDocuments(token, saleId);
        setSaleDocuments(data);
      } else if (tab === 'otp') {
        const data = await salesApi.getOTPVersions(token, saleId);
        setOtpVersions(data);
      } else if (tab === 'deal-room') {
        const data = await salesApi.getDealRoomMessages(token, saleId);
        setDealMessages(data);
      } else if (tab === 'bond') {
        const data = await salesApi.getBondApplication(token, saleId);
        setBondApp(data);
      } else if (tab === 'compliance') {
        const data = await salesApi.getComplianceStatus(token, saleId);
        setCompliance(data);
      } else if (tab === 'disbursement') {
        const data = await salesApi.getDisbursementInstructions(token, saleId);
        setDisbursements(data);
      } else if (tab === 'checklist') {
        const [checkData, disclosureData] = await Promise.all([
          salesApi.getPostSaleChecklist(token, saleId).catch(() => null),
          salesApi.getSellerDisclosure(token, saleId).catch(() => null),
        ]);
        if (checkData) setChecklist(checkData);
        if (disclosureData) setDisclosure(disclosureData);
      }
    } catch {
      // Silently ignore tab-data fetch errors; show empty state
    }
  }, [token, saleId]);

  useEffect(() => {
    loadSale();
  }, [loadSale]);

  useEffect(() => {
    loadTabData(selectedTab);
  }, [selectedTab, loadTabData]);

  const handleTabChange = (tab: TabId) => {
    setSelectedTab(tab);
  };

  const handleCreateOTP = async () => {
    if (!token || !saleId || !otpPrice) return;
    setOtpSubmitting(true);
    try {
      await salesApi.createOTP(token, saleId, {
        offeredPrice: parseFloat(otpPrice),
        offerValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
      const data = await salesApi.getOTPVersions(token, saleId);
      setOtpVersions(data);
      setShowOtpForm(false);
      setOtpPrice('');
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to create OTP');
    } finally {
      setOtpSubmitting(false);
    }
  };

  const handleSignOTP = async (otpId: string) => {
    if (!token || !saleId) return;
    try {
      await salesApi.signOTP(token, saleId, otpId);
      const data = await salesApi.getOTPVersions(token, saleId);
      setOtpVersions(data);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to sign OTP');
    }
  };

  const handleUploadDocument = async () => {
    if (!token || !saleId || !uploadDocName.trim()) return;
    setUploadSubmitting(true);
    try {
      await salesApi.addDocument(token, saleId, uploadStageNum, {
        documentName: uploadDocName.trim(),
        documentType: uploadDocType || undefined,
      });
      const data = await salesApi.getDocuments(token, saleId);
      setSaleDocuments(data);
      setShowUploadForm(false);
      setUploadDocName('');
      setUploadDocType('');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to register document');
    } finally {
      setUploadSubmitting(false);
    }
  };

  const handleStartStage = async (stageNum: number) => {
    if (!token || !saleId) return;
    setStageActionLoading(stageNum);
    try {
      await salesApi.startStage(token, saleId, stageNum);
      await loadSale();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to start stage');
    } finally {
      setStageActionLoading(null);
    }
  };

  const handleCompleteStage = async (stageNum: number) => {
    if (!token || !saleId) return;
    setStageActionLoading(stageNum);
    try {
      await salesApi.completeStage(token, saleId, stageNum);
      await loadSale();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to complete stage');
    } finally {
      setStageActionLoading(null);
    }
  };

  const handleSendDealMessage = async () => {
    if (!token || !saleId || !dealMsgContent.trim()) return;
    setDealMsgSubmitting(true);
    try {
      await salesApi.sendDealRoomMessage(token, saleId, { content: dealMsgContent, threadType: dealMsgThread });
      const data = await salesApi.getDealRoomMessages(token, saleId);
      setDealMessages(data);
      setDealMsgContent('');
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to send message');
    } finally {
      setDealMsgSubmitting(false);
    }
  };

  const openAssignModal = (slot: PartySlot) => {
    setAssigningSlot(slot);
    setPartySearchQ('');
    setPartySearchResults([]);
    setPartyAssignError(null);
  };

  const closeAssignModal = () => {
    setAssigningSlot(null);
    setPartySearchQ('');
    setPartySearchResults([]);
    setPartyAssignError(null);
  };

  const handlePartySearch = async (q: string) => {
    setPartySearchQ(q);
    if (!token || q.trim().length < 2) {
      setPartySearchResults([]);
      return;
    }
    setPartySearchLoading(true);
    try {
      const roleFilter =
        assigningSlot === 'buyerConveyancer' || assigningSlot === 'sellerConveyancer'
          ? 'conveyancer'
          : assigningSlot === 'agent'
          ? 'agent'
          : undefined;  // buyer / seller: no role filter — any active user
      const results = await usersApi.search(token, q.trim(), roleFilter);
      setPartySearchResults(results);
    } catch {
      setPartySearchResults([]);
    } finally {
      setPartySearchLoading(false);
    }
  };

  const handleAssignParty = async (user: UserSearchResult) => {
    if (!token || !saleId || !assigningSlot) return;
    setPartyAssignLoading(true);
    setPartyAssignError(null);
    try {
      if (assigningSlot === 'buyer') {
        await salesApi.assignBuyer(token, saleId, user.id);
      } else if (assigningSlot === 'seller') {
        await salesApi.assignSeller(token, saleId, user.id);
      } else if (assigningSlot === 'agent') {
        await salesApi.assignAgent(token, saleId, user.id);
      } else if (assigningSlot === 'buyerConveyancer') {
        await salesApi.assignConveyancer(token, saleId, { conveyancerId: user.id });
      } else if (assigningSlot === 'sellerConveyancer') {
        await salesApi.assignConveyancer(token, saleId, { conveyancerId: user.id });
      }
      await loadSale();
      closeAssignModal();
    } catch (e: unknown) {
      setPartyAssignError(e instanceof Error ? e.message : 'Assignment failed');
    } finally {
      setPartyAssignLoading(false);
    }
  };

  const handleRemoveBuyer = async (buyer: PersonInfo) => {
    if (!token || !saleId) return;
    if (!confirm(`Remove ${buyer.firstName} ${buyer.lastName} as a buyer?`)) return;
    try {
      await salesApi.removeBuyer(token, saleId, buyer.id);
      await loadSale();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to remove buyer');
    }
  };

  const handleRemoveSeller = async (seller: PersonInfo) => {
    if (!token || !saleId) return;
    if (!confirm(`Remove ${seller.firstName} ${seller.lastName} as a seller?`)) return;
    try {
      await salesApi.removeSeller(token, saleId, seller.id);
      await loadSale();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to remove seller');
    }
  };

  const completedStages = stages.filter(s => s.status === 'completed').length;
  const progressPercentage = stages.length > 0 ? (completedStages / stages.length) * 100 : 0;
  const currentStageNum = sale?.currentStage ?? 1;
  const currentStageName = ZA_STAGE_NAMES[currentStageNum] ?? `Stage ${currentStageNum}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span>Loading sale workspace...</span>
        </div>
      </div>
    );
  }

  if (error || !sale) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Sale Not Found</h2>
          <p className="text-gray-600 mb-4">{error ?? 'Unable to load sale workspace.'}</p>
          <Link to="/app/sales" className="text-blue-600 underline">Back to Sales</Link>
        </Card>
      </div>
    );
  }

  const listingTitle = sale.property?.title || null;
  const addressLine = [
    sale.property?.addressLine1,
    sale.property?.city,
  ].filter(Boolean).join(', ') || null;
  const ref = `TXN-${saleId.slice(-6).toUpperCase()}`;
  // Primary heading: listing title, then address, then ref
  const pageTitle = listingTitle || addressLine || ref;

  const buyerName = sale.buyer
    ? `${sale.buyer.firstName} ${sale.buyer.lastName}`
    : 'Unknown Buyer';
  const sellerName = sale.seller
    ? `${sale.seller.firstName} ${sale.seller.lastName}`
    : 'Unknown Seller';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-8 py-6">
        <Link to="/app/sales" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Sales</span>
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl md:text-3xl font-bold">{pageTitle}</h1>
              <Badge className="bg-blue-100 text-blue-700">
                <Shield className="w-3 h-3 mr-1" />
                {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
              </Badge>
            </div>
            {listingTitle && addressLine && (
              <div className="text-sm text-gray-500 mb-1">{addressLine}</div>
            )}
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <div className="text-xl font-bold text-blue-600">
                {sale.currency} {sale.purchasePrice.toLocaleString()}
              </div>
              {sale.commission && (
                <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-full px-3 py-0.5 text-sm">
                  <DollarSign className="w-3.5 h-3.5 text-green-600" />
                  <span className="text-green-700 font-medium">
                    Commission {sale.commission.rate}% — {sale.currency} {sale.commission.estimated.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <div>Buyer: <span className="font-medium text-gray-900">{buyerName}</span></div>
              <div className="hidden sm:block">•</div>
              <div>Seller: <span className="font-medium text-gray-900">{sellerName}</span></div>
              {sale.agent && (
                <>
                  <div className="hidden sm:block">•</div>
                  <div>Agent: <span className="font-medium text-gray-900">{sale.agent.firstName} {sale.agent.lastName}</span></div>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Card className="p-4 min-w-[200px]">
              <div className="text-sm text-gray-600 mb-1">Overall Progress</div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Progress value={progressPercentage} className="h-2 bg-gray-200" />
                </div>
                <div className="font-bold text-lg">{Math.round(progressPercentage)}%</div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {completedStages} of {stages.length} stages completed
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Horizontal Stage Bar */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-8 py-6 overflow-x-auto">
        <div className="min-w-max">
          <div className="flex items-start gap-2">
            {stages.map((stage, idx) => (
              <div key={stage.stageNumber} className="flex items-start">
                <div className="flex flex-col items-center cursor-pointer group">
                  <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center mb-2 transition-all duration-200 group-hover:scale-110 ${stageStatusColor(stage.status)}`}>
                    {stageStatusIcon(stage.status)}
                  </div>
                  <div className="text-center w-28">
                    <div className="font-semibold text-xs mb-1 line-clamp-2">
                      {stage.name ?? ZA_STAGE_NAMES[stage.stageNumber] ?? `Stage ${stage.stageNumber}`}
                    </div>
                    <Badge variant="secondary" className={`text-xs ${stageStatusColor(stage.status)}`}>
                      {stage.status.replace(/_/g, ' ').toUpperCase()}
                    </Badge>
                  </div>
                </div>
                {idx < stages.length - 1 && (
                  <div className="flex items-center pt-6 px-2">
                    <div className={`h-0.5 w-8 ${stage.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'}`} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-8">
        <div className="flex items-center gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                selectedTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-4 md:p-8">

        {/* ─── Timeline ─────────────────────────────────────────── */}
        {selectedTab === 'timeline' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4">Stage History</h3>
                <div className="space-y-4">
                  {stages.map((stage) => (
                    <div key={stage.stageNumber} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                        {stageStatusIcon(stage.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="font-medium text-sm">
                            {stage.name ?? ZA_STAGE_NAMES[stage.stageNumber]}
                          </div>
                          <Badge variant="secondary" className={`text-xs ${stageStatusColor(stage.status)}`}>
                            {stage.status.replace(/_/g, ' ').toUpperCase()}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-600">
                          Stage {stage.stageNumber}
                          {stage.startedAt && ` • Started ${new Date(stage.startedAt).toLocaleDateString()}`}
                          {stage.completedAt && ` • Completed ${new Date(stage.completedAt).toLocaleDateString()}`}
                        </div>
                        <div className="flex gap-2 mt-2">
                          {stage.status === 'not_started' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStartStage(stage.stageNumber)}
                              disabled={stageActionLoading === stage.stageNumber}
                            >
                              {stageActionLoading === stage.stageNumber && (
                                <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                              )}
                              Start Stage
                            </Button>
                          )}
                          {stage.status === 'in_progress' && (
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleCompleteStage(stage.stageNumber)}
                              disabled={stageActionLoading === stage.stageNumber}
                            >
                              {stageActionLoading === stage.stageNumber && (
                                <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                              )}
                              Complete Stage
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {stages.length === 0 && (
                    <p className="text-sm text-gray-500">No stages available.</p>
                  )}
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Current Stage</h3>
                <div className="text-center py-6 px-4 bg-blue-50 rounded-lg mb-4">
                  <div className="text-4xl font-bold text-blue-600 mb-2">{currentStageNum}</div>
                  <div className="font-medium mb-1">{currentStageName}</div>
                  <div className="text-sm text-gray-600">In Progress</div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-4">Sale Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reference:</span>
                    <span className="font-medium">TXN-{saleId.slice(-6).toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-medium capitalize">{sale.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created:</span>
                    <span className="font-medium">{new Date(sale.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Conveyancer:</span>
                    <span className="font-medium">
                      {sale.conveyancer
                        ? `${sale.conveyancer.firstName} ${sale.conveyancer.lastName}`
                        : <span className="text-gray-400">Not assigned</span>}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* ─── Documents ────────────────────────────────────────── */}
        {selectedTab === 'documents' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Documents</h2>
                <p className="text-sm text-gray-600 mt-1">Track required documents per stage.</p>
              </div>
              <Button
                size="sm"
                className="bg-blue-500 hover:bg-blue-600"
                onClick={() => { setUploadStageNum(sale.currentStage); setShowUploadForm(v => !v); }}
              >
                <Upload className="w-4 h-4 mr-2" />
                {showUploadForm ? 'Cancel' : 'Add Document'}
              </Button>
            </div>

            {showUploadForm && (
              <Card className="p-6 border-blue-200 bg-blue-50">
                <h3 className="font-semibold mb-4">Register Document</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Document Name <span className="text-red-500">*</span></label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={uploadDocName}
                        onChange={(e) => setUploadDocName(e.target.value)}
                        placeholder="e.g. Title Deed — Erf 123"
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                      />
                      <label className="cursor-pointer inline-flex items-center gap-1 border border-gray-300 bg-white rounded-md px-3 py-2 text-sm hover:bg-gray-50">
                        <Upload className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">Browse</span>
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f && !uploadDocName) setUploadDocName(f.name.replace(/\.[^.]+$/, ''));
                          }}
                        />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Selecting a file pre-fills the name. File storage integration coming soon.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
                    <select
                      value={uploadStageNum}
                      onChange={(e) => setUploadStageNum(Number(e.target.value))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      {stages.map((s) => (
                        <option key={s.stageNumber} value={s.stageNumber}>
                          Stage {s.stageNumber} — {s.name ?? ZA_STAGE_NAMES[s.stageNumber]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
                    <select
                      value={uploadDocType}
                      onChange={(e) => setUploadDocType(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">— Select type —</option>
                      <option value="title_deed">Title Deed</option>
                      <option value="sale_agreement">Sale Agreement (OTP)</option>
                      <option value="deposit_proof">Deposit Proof</option>
                      <option value="inspection_cert">Inspection Certificate</option>
                      <option value="compliance_cert">Compliance Certificate</option>
                      <option value="bond_approval">Bond Approval</option>
                      <option value="rates_clearance">Rates Clearance Certificate</option>
                      <option value="transfer_duty">Transfer Duty Receipt</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2 flex gap-3">
                    <Button
                      className="bg-blue-500 hover:bg-blue-600"
                      disabled={uploadSubmitting || !uploadDocName.trim()}
                      onClick={handleUploadDocument}
                    >
                      {uploadSubmitting && <RefreshCw className="w-4 h-4 animate-spin mr-2" />}
                      Register Document
                    </Button>
                    <Button variant="outline" onClick={() => setShowUploadForm(false)}>Cancel</Button>
                  </div>
                </div>
              </Card>
            )}

            <div className="space-y-4">
              {stages.map((stage) => {
                const stageDocs = saleDocuments.filter(d => d.stageNumber === stage.stageNumber);
                return (
                  <div key={stage.stageNumber} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge className={stageStatusColor(stage.status)}>Stage {stage.stageNumber}</Badge>
                      <h4 className="font-medium text-sm flex-1">{stage.name ?? ZA_STAGE_NAMES[stage.stageNumber]}</h4>
                      <button
                        className="text-xs text-blue-600 hover:underline"
                        onClick={() => { setUploadStageNum(stage.stageNumber); setShowUploadForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      >
                        + Add
                      </button>
                    </div>
                    {stageDocs.length > 0 ? (
                      <div className="space-y-2">
                        {stageDocs.map((doc) => (
                          <div key={doc.id} className="flex items-center justify-between bg-gray-50 rounded-md px-3 py-2 text-sm">
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                              <span className="truncate font-medium">{doc.name}</span>
                              {doc.documentType && (
                                <span className="text-xs text-gray-500 shrink-0">({doc.documentType.replace(/_/g, ' ')})</span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 shrink-0 ml-2">
                              {doc.fileUrl && (
                                <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs flex items-center gap-1">
                                  <Eye className="w-3 h-3" /> View
                                </a>
                              )}
                              <Badge className={{
                                pending:  'bg-yellow-100 text-yellow-700',
                                received: 'bg-blue-100 text-blue-700',
                                verified: 'bg-green-100 text-green-700',
                                rejected: 'bg-red-100 text-red-700',
                              }[doc.status] ?? 'bg-gray-100 text-gray-600'}>
                                {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">
                        {stage.status === 'completed'
                          ? 'Stage complete — no documents on record.'
                          : stage.status === 'in_progress'
                          ? 'No documents uploaded yet for this stage.'
                          : 'Not yet active.'}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── OTP (Offer to Purchase) ──────────────────────────── */}
        {selectedTab === 'otp' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Offer to Purchase</h2>
                <p className="text-sm text-gray-600 mt-1">Manage formal offers, counter-offers, and signatories.</p>
              </div>
              <Button
                className="bg-blue-500 hover:bg-blue-600"
                onClick={() => setShowOtpForm(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                New OTP
              </Button>
            </div>

            {showOtpForm && (
              <Card className="p-6 border-blue-200 bg-blue-50">
                <h3 className="font-semibold mb-4">Create New Offer to Purchase</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price</label>
                    <input
                      type="number"
                      value={otpPrice}
                      onChange={(e) => setOtpPrice(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. 2500000"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      className="bg-blue-500 hover:bg-blue-600"
                      disabled={otpSubmitting || !otpPrice}
                      onClick={handleCreateOTP}
                    >
                      {otpSubmitting ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
                      Create OTP
                    </Button>
                    <Button variant="outline" onClick={() => setShowOtpForm(false)}>Cancel</Button>
                  </div>
                </div>
              </Card>
            )}

            {otpVersions.length === 0 ? (
              <Card className="p-8 text-center">
                <ScrollText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No OTP versions yet. Create the first offer.</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {otpVersions.map((otp) => (
                  <Card key={otp.id} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">OTP v{otp.version}</span>
                          <Badge className={otpStatusBadge(otp.status)}>
                            {otp.status.replace(/_/g, ' ').toUpperCase()}
                          </Badge>
                        </div>
                        <div className="text-2xl font-bold text-blue-600">
                          {sale.currency} {(otp.offeredPrice ?? 0).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(otp.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <div>
                        <span className="text-gray-600">Buyer Signed:</span>{' '}
                        <span className="font-medium">
                          {otp.buyerSignedAt ? new Date(otp.buyerSignedAt).toLocaleDateString() : '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Seller Signed:</span>{' '}
                        <span className="font-medium">
                          {otp.sellerSignedAt ? new Date(otp.sellerSignedAt).toLocaleDateString() : '—'}
                        </span>
                      </div>
                    </div>

                    {(otp.status === 'pending' || otp.status === 'pending_buyer' || otp.status === 'pending_seller') && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleSignOTP(otp.id)}
                        >
                          <Lock className="w-4 h-4 mr-2" />
                          Sign OTP
                        </Button>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── Deal Room ────────────────────────────────────────── */}
        {selectedTab === 'deal-room' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <h3 className="font-semibold text-lg flex-1">Deal Room</h3>
                  <select
                    value={dealMsgThread}
                    onChange={(e) => setDealMsgThread(e.target.value as typeof dealMsgThread)}
                    className="text-sm border border-gray-300 rounded-md px-3 py-1.5"
                  >
                    <option value="general">General</option>
                    <option value="legal">Legal</option>
                    <option value="financial">Financial</option>
                    <option value="compliance">Compliance</option>
                  </select>
                </div>

                <div className="space-y-3 min-h-[300px] max-h-[480px] overflow-y-auto mb-4 pr-1">
                  {dealMessages.length === 0 ? (
                    <div className="flex items-center justify-center h-40 text-gray-400">
                      <div className="text-center">
                        <MessageSquare className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm">No messages yet</p>
                      </div>
                    </div>
                  ) : (
                    dealMessages.map((msg) => (
                      <div key={msg.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                          <Users className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm capitalize">{msg.senderRole}</span>
                            <Badge variant="secondary" className="text-xs">{msg.threadType}</Badge>
                            <span className="text-xs text-gray-400 ml-auto">
                              {new Date(msg.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{msg.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="border-t pt-4">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={dealMsgContent}
                      onChange={(e) => setDealMsgContent(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendDealMessage(); } }}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    />
                    <Button
                      className="bg-blue-500 hover:bg-blue-600"
                      disabled={dealMsgSubmitting || !dealMsgContent.trim()}
                      onClick={handleSendDealMessage}
                    >
                      {dealMsgSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="p-6">
              <h3 className="font-semibold mb-4">Threads</h3>
              <div className="space-y-2">
                {(['general', 'legal', 'financial', 'compliance'] as const).map((thread) => {
                  const count = dealMessages.filter(m => m.threadType === thread).length;
                  return (
                    <button
                      key={thread}
                      onClick={() => setDealMsgThread(thread)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                        dealMsgThread === thread ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <span className="capitalize">{thread}</span>
                      {count > 0 && (
                        <Badge variant="secondary" className="text-xs">{count}</Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>
        )}

        {/* ─── Bond Application ─────────────────────────────────── */}
        {selectedTab === 'bond' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold">Bond / Mortgage Application</h2>
              <p className="text-sm text-gray-600 mt-1">Track the buyer&apos;s mortgage bond application status.</p>
            </div>

            {!bondApp ? (
              <Card className="p-8 text-center">
                <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">No bond application submitted yet.</p>
                <Button
                  className="bg-blue-500 hover:bg-blue-600"
                  onClick={async () => {
                    const bankName = prompt('Bank name?');
                    const amount = prompt('Loan amount?');
                    if (!bankName || !amount || !token) return;
                    try {
                      await salesApi.createBondApplication(token, saleId, {
                        bankName,
                        loanAmount: parseFloat(amount),
                      });
                      const data = await salesApi.getBondApplication(token, saleId);
                      setBondApp(data);
                    } catch (e: unknown) {
                      alert(e instanceof Error ? e.message : 'Failed');
                    }
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Bond Application
                </Button>
              </Card>
            ) : (
              <Card className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{bondApp.bankName}</h3>
                    {bondApp.applicationRef && (
                      <p className="text-sm text-gray-500">Ref: {bondApp.applicationRef}</p>
                    )}
                  </div>
                  <Badge className={
                    bondApp.status === 'approved' ? 'bg-green-100 text-green-700' :
                    bondApp.status === 'declined' ? 'bg-red-100 text-red-700' :
                    bondApp.status === 'conditional' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-blue-100 text-blue-700'
                  }>
                    {bondApp.status.replace(/_/g, ' ').toUpperCase()}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Loan Amount:</span>
                      <span className="font-bold text-lg text-blue-600">
                        {sale.currency} {bondApp.loanAmount.toLocaleString()}
                      </span>
                    </div>
                    {bondApp.interestRate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Interest Rate:</span>
                        <span className="font-medium">{bondApp.interestRate}%</span>
                      </div>
                    )}
                    {bondApp.termMonths && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Term:</span>
                        <span className="font-medium">{bondApp.termMonths} months</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Submitted:</span>
                      <span className="font-medium">
                        {bondApp.submittedAt ? new Date(bondApp.submittedAt).toLocaleDateString() : '—'}
                      </span>
                    </div>
                    {bondApp.approvedAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Approved:</span>
                        <span className="font-medium text-green-600">
                          {new Date(bondApp.approvedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {bondApp.conditions != null && typeof bondApp.conditions === 'object' && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Conditions</h4>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                        {JSON.stringify(bondApp.conditions)}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ─── Compliance ───────────────────────────────────────── */}
        {selectedTab === 'compliance' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Compliance Certificates</h2>
                <p className="text-sm text-gray-600 mt-1">Track all required certificates for transfer.</p>
              </div>
              {compliance && (
                <Badge className={compliance.allMet ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                  {compliance.allMet ? 'All Requirements Met' : 'Pending'}
                </Badge>
              )}
            </div>

            {!compliance || !compliance.requirements?.length ? (
              <Card className="p-8 text-center">
                <ClipboardCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No compliance requirements set up yet.</p>
                <p className="text-xs text-gray-400 mt-1">Conveyancer can configure requirements from their dashboard.</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {compliance.requirements.map((item) => (
                  <Card key={item.certType} className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          item.status === 'received' ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          {item.status === 'received'
                            ? <CheckCircle2 className="w-5 h-5 text-green-600" />
                            : <FileText className="w-5 h-5 text-gray-400" />
                          }
                        </div>
                        <div>
                          <div className="font-medium text-sm capitalize">
                            {item.certType.replace(/_/g, ' ')}
                          </div>
                          {item.dueDate && (
                            <div className="text-xs text-gray-500">Due: {new Date(item.dueDate).toLocaleDateString()}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {item.receivedDate && (
                          <span className="text-xs text-green-600">
                            Received {new Date(item.receivedDate).toLocaleDateString()}
                          </span>
                        )}
                        <Badge className={
                          item.status === 'received' ? 'bg-green-100 text-green-700' :
                          item.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                          item.status === 'waived' ? 'bg-gray-100 text-gray-600' :
                          'bg-yellow-100 text-yellow-700'
                        }>
                          {item.status.replace(/_/g, ' ').toUpperCase()}
                        </Badge>
                        {item.fileUrl && (
                          <a href={item.fileUrl} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="outline"><Eye className="w-4 h-4" /></Button>
                          </a>
                        )}
                      </div>
                    </div>
                    {item.notes && (
                      <div className="mt-3 text-sm text-gray-600 bg-gray-50 rounded p-2">{item.notes}</div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── Disbursements ────────────────────────────────────── */}
        {selectedTab === 'disbursement' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold">Disbursement Instructions</h2>
              <p className="text-sm text-gray-600 mt-1">Manage payment disbursements upon registration.</p>
            </div>

            {disbursements.length === 0 ? (
              <Card className="p-8 text-center">
                <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No disbursement instructions yet.</p>
                <p className="text-xs text-gray-400 mt-1">Conveyancer adds disbursement instructions here.</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {disbursements.map((d) => (
                  <Card key={d.id} className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold">{d.payee}</div>
                        <div className="text-sm text-gray-500 capitalize">{d.payeeType} · {d.purpose}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">{d.currency} {d.amount.toLocaleString()}</div>
                        <Badge className={
                          d.status === 'paid' ? 'bg-green-100 text-green-700' :
                          d.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                        }>
                          {d.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    {d.status === 'pending' && (
                      <div className="mt-3 flex gap-2">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={async () => {
                            if (!token) return;
                            try {
                              await salesApi.approveDisbursementInstruction(token, saleId, d.id);
                              const data = await salesApi.getDisbursementInstructions(token, saleId);
                              setDisbursements(data);
                            } catch (e: unknown) {
                              alert(e instanceof Error ? e.message : 'Failed');
                            }
                          }}
                        >
                          Approve
                        </Button>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── Parties ──────────────────────────────────────────── */}
        {selectedTab === 'parties' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Transaction Parties</h2>
                <p className="text-sm text-gray-600 mt-1">Manage all people involved in this transaction.</p>
              </div>
            </div>

            {/* Principal Parties: Buyers and Sellers (multiple supported) */}
            <div className="space-y-5">

              {/* Buyers */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Buyers</h3>
                  <Button size="sm" className="bg-blue-500 hover:bg-blue-600" onClick={() => openAssignModal('buyer')}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Buyer
                  </Button>
                </div>
                {(sale.buyers ?? []).length === 0 ? (
                  <div className="border border-dashed border-gray-300 rounded-lg p-5 text-center text-sm text-gray-400">
                    No buyers assigned yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(sale.buyers ?? []).map((buyer) => (
                      <div key={buyer.id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-sm">{buyer.firstName} {buyer.lastName}</div>
                          <div className="text-xs text-gray-500">{buyer.email}</div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleTabChange('deal-room')}>
                            <MessageSquare className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-500 hover:text-red-700" onClick={() => handleRemoveBuyer(buyer)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sellers */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Sellers</h3>
                  <Button size="sm" className="bg-blue-500 hover:bg-blue-600" onClick={() => openAssignModal('seller')}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Seller
                  </Button>
                </div>
                {(sale.sellers ?? []).length === 0 ? (
                  <div className="border border-dashed border-gray-300 rounded-lg p-5 text-center text-sm text-gray-400">
                    No sellers.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(sale.sellers ?? []).map((seller) => (
                      <div key={seller.id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-sm">{seller.firstName} {seller.lastName}</div>
                          <div className="text-xs text-gray-500">{seller.email}</div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleTabChange('deal-room')}>
                            <MessageSquare className="w-3.5 h-3.5" />
                          </Button>
                          {(sale.sellers ?? []).length > 1 && (
                            <Button size="sm" variant="outline" className="text-red-500 hover:text-red-700" onClick={() => handleRemoveSeller(seller)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Assignable parties: agent & conveyancers */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Assigned Professionals</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                {/* Agent */}
                <div className="border border-gray-200 rounded-lg p-5">
                  <div className="flex items-start justify-between mb-3">
                    <Badge variant="secondary">Agent</Badge>
                    {sale.agent
                      ? <Badge className="bg-green-100 text-green-700"><CheckCircle2 className="w-3 h-3 mr-1" />Assigned</Badge>
                      : <Badge className="bg-yellow-100 text-yellow-700">Unassigned</Badge>}
                  </div>
                  {sale.agent ? (
                    <>
                      <div className="font-semibold mb-1">{sale.agent.firstName} {sale.agent.lastName}</div>
                      <div className="text-sm text-gray-500 mb-1">{sale.agent.email}</div>
                      {sale.commission && (
                        <div className="flex items-center gap-1 text-sm text-green-700 font-medium mb-3">
                          <DollarSign className="w-3.5 h-3.5" />
                          {sale.commission.rate}% commission — {sale.currency} {sale.commission.estimated.toLocaleString()}
                        </div>
                      )}
                      {!sale.commission && <div className="mb-3" />}
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => handleTabChange('deal-room')}>
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Message
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => openAssignModal('agent')}>
                          Change
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-gray-500 mb-3">No agent assigned to this sale.</p>
                      <Button size="sm" className="w-full bg-blue-500 hover:bg-blue-600" onClick={() => openAssignModal('agent')}>
                        <Plus className="w-4 h-4 mr-2" />
                        Assign Agent
                      </Button>
                    </>
                  )}
                </div>

                {/* Buyer's Conveyancer */}
                <div className="border border-gray-200 rounded-lg p-5">
                  <div className="flex items-start justify-between mb-3">
                    <Badge variant="secondary">Buyer&rsquo;s Conveyancer</Badge>
                    {sale.conveyancer
                      ? <Badge className="bg-green-100 text-green-700"><CheckCircle2 className="w-3 h-3 mr-1" />Assigned</Badge>
                      : <Badge className="bg-yellow-100 text-yellow-700">Unassigned</Badge>}
                  </div>
                  {sale.conveyancer ? (
                    <>
                      <div className="font-semibold mb-1">{sale.conveyancer.firstName} {sale.conveyancer.lastName}</div>
                      <div className="text-sm text-gray-500 mb-3">{sale.conveyancer.email}</div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => handleTabChange('deal-room')}>
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Message
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => openAssignModal('buyerConveyancer')}>
                          Change
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-gray-500 mb-3">No buyer&rsquo;s conveyancer assigned.</p>
                      <Button size="sm" className="w-full bg-blue-500 hover:bg-blue-600" onClick={() => openAssignModal('buyerConveyancer')}>
                        <Plus className="w-4 h-4 mr-2" />
                        Assign Conveyancer
                      </Button>
                    </>
                  )}
                </div>

                {/* Seller's Conveyancer */}
                <div className="border border-gray-200 rounded-lg p-5">
                  <div className="flex items-start justify-between mb-3">
                    <Badge variant="secondary">Seller&rsquo;s Conveyancer</Badge>
                    <Badge className="bg-yellow-100 text-yellow-700">Unassigned</Badge>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">Assign a separate conveyancer for the seller&rsquo;s side.</p>
                  <Button size="sm" className="w-full bg-blue-500 hover:bg-blue-600" onClick={() => openAssignModal('sellerConveyancer')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Assign Conveyancer
                  </Button>
                </div>

              </div>
            </div>

            {/* Assignment Modal */}
            {assigningSlot && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg">
                      {assigningSlot === 'buyer' ? 'Add Buyer'
                        : assigningSlot === 'seller' ? 'Add Seller'
                        : assigningSlot === 'agent' ? 'Assign Agent'
                        : assigningSlot === 'buyerConveyancer' ? "Assign Buyer's Conveyancer"
                        : "Assign Seller's Conveyancer"}
                    </h3>
                    <button onClick={closeAssignModal} className="text-gray-400 hover:text-gray-700 text-xl leading-none">&times;</button>
                  </div>

                  <p className="text-sm text-gray-500 mb-4">
                    Search by name or email
                    {(assigningSlot === 'buyerConveyancer' || assigningSlot === 'sellerConveyancer')
                      ? ' — filtered to users with the Conveyancer role'
                      : assigningSlot === 'agent'
                      ? ' — filtered to users with the Agent role'
                      : ' — any registered user can be assigned'}.
                  </p>

                  <div className="relative mb-4">
                    <input
                      type="text"
                      placeholder="Type name or email..."
                      value={partySearchQ}
                      onChange={(e) => handlePartySearch(e.target.value)}
                      autoFocus
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 pr-10"
                    />
                    {partySearchLoading && (
                      <RefreshCw className="absolute right-3 top-2.5 w-4 h-4 animate-spin text-gray-400" />
                    )}
                  </div>

                  {partyAssignError && (
                    <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                      {partyAssignError}
                    </div>
                  )}

                  {partySearchResults.length > 0 ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {partySearchResults.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => handleAssignParty(u)}
                          disabled={partyAssignLoading}
                          className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors text-left disabled:opacity-50"
                        >
                          <div>
                            <div className="font-medium text-sm">{u.firstName} {u.lastName}</div>
                            <div className="text-xs text-gray-500">{u.email}</div>
                          </div>
                          {partyAssignLoading
                            ? <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                            : <Plus className="w-4 h-4 text-blue-500" />}
                        </button>
                      ))}
                    </div>
                  ) : partySearchQ.length >= 2 && !partySearchLoading ? (
                    <div className="py-6 text-center text-sm text-gray-500">
                      <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      No users found for &ldquo;{partySearchQ}&rdquo;
                    </div>
                  ) : partySearchQ.length < 2 ? (
                    <div className="py-4 text-center text-sm text-gray-400">
                      Type at least 2 characters to search
                    </div>
                  ) : null}

                  <div className="mt-4 flex justify-end">
                    <Button variant="outline" onClick={closeAssignModal}>Cancel</Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── Escrow ───────────────────────────────────────────── */}
        {selectedTab === 'escrow' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-6">Financial Summary</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Purchase Price</div>
                  <div className="text-3xl font-bold text-blue-600">
                    {sale.currency} {sale.purchasePrice.toLocaleString()}
                  </div>
                </div>
                <div className="border-t pt-4 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bond Approved</span>
                    <span className="font-medium text-blue-600">
                      {bondApp?.status === 'approved'
                        ? `${sale.currency} ${bondApp.loanAmount.toLocaleString()}`
                        : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Disbursements Pending</span>
                    <span className="font-medium">
                      {disbursements.filter(d => d.status === 'pending').length} items
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Disbursement Summary</h3>
              {disbursements.length === 0 ? (
                <p className="text-sm text-gray-500">No disbursements configured.</p>
              ) : (
                <div className="space-y-3">
                  {disbursements.map((d) => (
                    <div key={d.id} className="flex justify-between text-sm">
                      <span className="text-gray-600">{d.payee}</span>
                      <span className="font-medium">{d.currency} {d.amount.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="border-t pt-3 flex justify-between font-semibold">
                    <span>Total</span>
                    <span>
                      {sale.currency}{' '}
                      {disbursements.reduce((s, d) => s + d.amount, 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ─── Issues ───────────────────────────────────────────── */}
        {selectedTab === 'issues' && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-lg">Issues & Blockers</h3>
              <Button size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Report Issue
              </Button>
            </div>
            <div className="space-y-4">
              {stages.filter(s => s.status === 'blocked').map((stage) => (
                <div key={stage.stageNumber} className="p-5 rounded-lg border-2 bg-red-50 border-red-200">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold mb-1">Stage {stage.stageNumber} Blocked</div>
                      <div className="font-medium text-sm mb-1">
                        {stage.name ?? ZA_STAGE_NAMES[stage.stageNumber]}
                      </div>
                      {stage.flaggedReason && (
                        <p className="text-sm text-gray-700">{stage.flaggedReason}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {!stages.some(s => s.status === 'blocked') && (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-2" />
                  <p>No blockers at this time.</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* ─── Post-Sale Checklist ──────────────────────────────── */}
        {selectedTab === 'checklist' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold">Post-Sale Checklist</h2>
              <p className="text-sm text-gray-600 mt-1">Track all post-registration items and seller disclosures.</p>
            </div>

            {/* Seller Disclosure */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Seller Disclosure</h3>
                {disclosure && (
                  <Badge className={
                    disclosure.status === 'completed' ? 'bg-green-100 text-green-700' :
                    disclosure.status === 'pending_buyer' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-600'
                  }>
                    {disclosure.status.replace(/_/g, ' ').toUpperCase()}
                  </Badge>
                )}
              </div>
              {!disclosure ? (
                <div className="text-sm text-gray-500 py-4 text-center">
                  <ScrollText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  No seller disclosure submitted yet.
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Seller Signed:</span>
                    <span className="font-medium">
                      {disclosure.sellerSignedAt ? new Date(disclosure.sellerSignedAt).toLocaleDateString() : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Buyer Acknowledged:</span>
                    <span className="font-medium">
                      {disclosure.buyerAcknowledgedAt ? new Date(disclosure.buyerAcknowledgedAt).toLocaleDateString() : '—'}
                    </span>
                  </div>
                  {(disclosure.status === 'pending_buyer' || disclosure.status === 'pending_seller') && (
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 mt-2"
                      onClick={async () => {
                        if (!token) return;
                        try {
                          await salesApi.signSellerDisclosure(token, saleId);
                          const data = await salesApi.getSellerDisclosure(token, saleId);
                          setDisclosure(data);
                        } catch (e: unknown) {
                          alert(e instanceof Error ? e.message : 'Failed');
                        }
                      }}
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      Sign Disclosure
                    </Button>
                  )}
                </div>
              )}
            </Card>

            {/* Post-Sale Items */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Post-Registration Items</h3>
              {!checklist || !checklist.items?.length ? (
                <div className="text-center py-6 text-gray-500">
                  <ClipboardCheck className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm">No checklist items yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {checklist.items.map((item) => (
                    <div key={item.key} className="flex items-center gap-3">
                      <button
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                          item.done ? 'bg-green-500 border-green-500' : 'border-gray-300'
                        }`}
                        aria-label={item.done ? 'Mark incomplete' : 'Mark complete'}
                        onClick={async () => {
                          if (!token || !checklist) return;
                          const updated = checklist.items.map(i =>
                            i.key === item.key ? { ...i, done: !i.done } : i,
                          );
                          try {
                            const result = await salesApi.updatePostSaleChecklist(token, saleId, {
                              items: updated.map(i => ({ key: i.key, done: i.done })),
                            });
                            setChecklist(result);
                          } catch (e: unknown) {
                            alert(e instanceof Error ? e.message : 'Failed');
                          }
                        }}
                      >
                        {item.done && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </button>
                      <span className={`text-sm ${item.done ? 'line-through text-gray-400' : ''}`}>
                        {item.label}
                      </span>
                      {item.doneAt && (
                        <span className="text-xs text-gray-400 ml-auto">
                          {new Date(item.doneAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {checklist && checklist.completedAt && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg text-sm text-green-700 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Checklist completed on {new Date(checklist.completedAt).toLocaleDateString()}
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
