'use client';

import { useState, useEffect } from "react";
import {
  Clock, CheckCircle2, Circle, Upload, MessageSquare,
  Phone, AlertCircle, Info, Shield, Loader2, ChevronDown, ChevronUp,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { salesApi, type Sale, type SaleStage } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth-session";
import { formatMoney } from "@/lib/formatters";

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

type DisplayStage = {
  id: number;
  name: string;
  status: 'completed' | 'in-progress' | 'blocked' | 'pending';
  date: string | null;
};

function mapStageStatus(s: SaleStage['status']): DisplayStage['status'] {
  switch (s) {
    case 'completed':   return 'completed';
    case 'in_progress': return 'in-progress';
    case 'blocked':     return 'blocked';
    default:            return 'pending';
  }
}

function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Static placeholder data (real backend endpoints pending) ────────────────

const PLACEHOLDER_TASKS = [
  {
    id: 1,
    title: "Upload FICA Documents",
    description: "We need copies of your ID, proof of residence, and recent bank statements.",
    dueDate: "Coming soon",
    priority: "high" as const,
    category: "documents",
    documents: [
      { name: "Certified ID Copy", uploaded: false },
      { name: "Proof of Residence (not older than 3 months)", uploaded: false },
      { name: "Bank Statements (last 3 months)", uploaded: false },
    ],
  },
];

const PLACEHOLDER_CONTACTS = [
  { role: "Your Agent", name: "Contact your agent", phone: null, available: true },
  { role: "Conveyancer", name: "Contact your conveyancer", phone: null, available: true },
];

export default function BuyerSimpleView() {
  const [expandedTask, setExpandedTask] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [stages, setStages] = useState<DisplayStage[]>([]);

  const token = getAccessToken();

  useEffect(() => {
    if (!token) {
      setError('You must be logged in to view your purchase progress.');
      setLoading(false);
      return;
    }
    salesApi.getMySales(token)
      .then((data) => {
        setSales(data);
        const active = data.find((s) => s.status === 'active') ?? data[0] ?? null;
        setSelectedSale(active);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Failed to load sales');
      })
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (!selectedSale || !token) return;
    setStages([]);
    salesApi.getStages(token, selectedSale.id)
      .then((raw) => {
        setStages(raw.map((s): DisplayStage => ({
          id: s.stageNumber,
          name: ZA_STAGE_NAMES[s.stageNumber] ?? s.name,
          status: mapStageStatus(s.status),
          date: formatDate(s.completedAt ?? s.startedAt),
        })));
      })
      .catch(() => {
        // Silently fall back to empty — sale header still shows
      });
  }, [selectedSale, token]);

  const getStatusIcon = (status: DisplayStage['status']) => {
    if (status === "completed") return <CheckCircle2 className="w-6 h-6 text-green-600" />;
    if (status === "in-progress") return <Clock className="w-6 h-6 text-blue-600" />;
    if (status === "blocked") return <AlertCircle className="w-6 h-6 text-red-500" />;
    return <Circle className="w-6 h-6 text-gray-300" />;
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case "high":   return "border-red-200 bg-red-50";
      case "medium": return "border-yellow-200 bg-yellow-50";
      case "low":    return "border-green-200 bg-green-50";
    }
  };

  // ─── Loading / error states ──────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-3" />
          <p className="text-gray-600">Loading your purchase progress…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <Card className="p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Unable to Load</h2>
          <p className="text-gray-600">{error}</p>
        </Card>
      </div>
    );
  }

  if (!selectedSale) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <Card className="p-8 max-w-md text-center">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Active Purchase</h2>
          <p className="text-gray-600">You have no active property purchases at the moment.</p>
        </Card>
      </div>
    );
  }

  const completedStages = stages.filter((s) => s.status === "completed").length;
  const progressPercentage = stages.length > 0 ? (completedStages / stages.length) * 100 : 0;

  const propertyAddress = [
    selectedSale.property?.addressLine1,
    selectedSale.property?.city,
  ].filter(Boolean).join(', ') || selectedSale.property?.title || 'Your Property';

  const priceDisplay = formatMoney(selectedSale.purchasePrice, selectedSale.currency);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sale selector (shown only when buyer has multiple sales) */}
      {sales.length > 1 && (
        <div className="bg-blue-600 text-white px-4 md:px-8 py-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium">Your purchases:</span>
            {sales.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedSale(s)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                  s.id === selectedSale.id
                    ? 'bg-white text-blue-700 border-white'
                    : 'border-blue-300 text-blue-100 hover:border-white hover:text-white'
                }`}
              >
                {s.property?.title ?? s.property?.addressLine1 ?? `Sale ${s.id.slice(-6)}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Header with Property */}
      <div className="bg-white border-b border-gray-200">
        <div className="relative h-48 md:h-64 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=400&fit=crop"
            alt={propertyAddress}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent"></div>
          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 text-white">
            <Badge className="bg-green-500 mb-3">
              <Shield className="w-3 h-3 mr-1" />
              Purchase In Progress
            </Badge>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">{propertyAddress}</h1>
            <div className="text-xl md:text-2xl font-bold">{priceDisplay}</div>
          </div>
        </div>

        <div className="px-4 md:px-8 py-6">
          <Card className="p-6 bg-linear-to-br from-blue-50 to-purple-50 border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Your Purchase Progress</h2>
              <span className="text-2xl font-bold text-blue-600">{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-3 bg-white mb-2" />
            <div className="text-sm text-gray-700">
              {completedStages} of {stages.length} stages completed
              {selectedSale.currentStage > 0 && (
                <span className="ml-1">
                  · Currently at stage {selectedSale.currentStage}
                  {ZA_STAGE_NAMES[selectedSale.currentStage]
                    ? `: ${ZA_STAGE_NAMES[selectedSale.currentStage]}`
                    : ''}
                </span>
              )}
            </div>
          </Card>
        </div>
      </div>

      <div className="px-4 md:px-8 py-8 space-y-8">
        {/* Outstanding Tasks */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Your Action Required</h2>
              <p className="text-sm text-gray-600">{PLACEHOLDER_TASKS.length} tasks need your attention</p>
            </div>
          </div>

          <div className="space-y-4">
            {PLACEHOLDER_TASKS.map((task) => (
              <Card
                key={task.id}
                className={`p-6 border-2 ${getPriorityColor(task.priority)}`}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{task.title}</h3>
                      <Badge className="bg-red-100 text-red-700">HIGH PRIORITY</Badge>
                    </div>
                    <p className="text-gray-700 mb-3">{task.description}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      Due date to be confirmed
                    </div>
                  </div>
                  <Button
                    variant={expandedTask === task.id ? "outline" : "default"}
                    onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                    {expandedTask === task.id
                      ? <ChevronUp className="w-4 h-4 ml-1" />
                      : <ChevronDown className="w-4 h-4 ml-1" />
                    }
                  </Button>
                </div>

                {expandedTask === task.id && task.documents && (
                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                    <h4 className="font-medium text-sm mb-3">Required Documents:</h4>
                    {task.documents.map((doc, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center gap-3">
                          <Circle className="w-5 h-5 text-gray-300" />
                          <span className="text-sm">{doc.name}</span>
                        </div>
                        <Button size="sm" variant="outline">
                          <Upload className="w-4 h-4 mr-2" />
                          Upload
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Progress Timeline */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold mb-6">Purchase Timeline</h2>
            <Card className="p-6">
              {stages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-400" />
                  <p className="text-sm">Loading timeline…</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {stages.map((stage, idx) => (
                    <div key={stage.id} className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`
                          flex items-center justify-center rounded-full
                          ${stage.status === "completed" ? "bg-green-100" :
                            stage.status === "in-progress" ? "bg-blue-100" :
                            stage.status === "blocked" ? "bg-red-100" : "bg-gray-100"}
                        `}>
                          {getStatusIcon(stage.status)}
                        </div>
                        {idx < stages.length - 1 && (
                          <div className={`
                            w-0.5 h-12 my-1
                            ${stage.status === "completed" ? "bg-green-300" : "bg-gray-200"}
                          `}></div>
                        )}
                      </div>
                      <div className="flex-1 pb-6">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h3 className={`font-medium ${
                            stage.status === "completed" ? "text-gray-900" :
                            stage.status === "in-progress" ? "text-blue-600" :
                            stage.status === "blocked" ? "text-red-600" :
                            "text-gray-400"
                          }`}>
                            {stage.name}
                          </h3>
                          {stage.status === "completed" && stage.date && (
                            <span className="text-sm text-gray-500">{stage.date}</span>
                          )}
                          {stage.status === "in-progress" && (
                            <Badge className="bg-blue-100 text-blue-700">IN PROGRESS</Badge>
                          )}
                          {stage.status === "blocked" && (
                            <Badge className="bg-red-100 text-red-700">ACTION NEEDED</Badge>
                          )}
                        </div>
                        {(stage.status === "in-progress" || stage.status === "blocked") && (
                          <p className="text-sm text-gray-600 mt-2">
                            {stage.status === "blocked"
                              ? "This stage requires your attention. Contact your agent for details."
                              : "Our team is working on this stage. We'll notify you when action is needed."}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Sale Summary */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Sale Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Purchase Price</span>
                  <span className="font-semibold">{priceDisplay}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status</span>
                  <Badge className="bg-green-100 text-green-700 capitalize">{selectedSale.status}</Badge>
                </div>
                {selectedSale.agent && (
                  <div className="pt-3 border-t border-gray-100">
                    <div className="text-gray-600 mb-1">Your Agent</div>
                    <div className="font-medium">
                      {selectedSale.agent.firstName} {selectedSale.agent.lastName}
                    </div>
                    <div className="text-gray-500 text-xs">{selectedSale.agent.email}</div>
                  </div>
                )}
              </div>
            </Card>

            {/* Quick Contacts */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Need Help?</h3>
              <div className="space-y-3">
                {PLACEHOLDER_CONTACTS.map((contact, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="text-xs text-gray-600 mb-1">{contact.role}</div>
                        <div className="font-medium text-sm">{contact.name}</div>
                      </div>
                      <div className={`w-2 h-2 rounded-full mt-1.5 ${contact.available ? "bg-green-500" : "bg-gray-300"}`}></div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline" className="flex-1 text-xs">
                        <Phone className="w-3 h-3 mr-1" />
                        Call
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 text-xs">
                        <MessageSquare className="w-3 h-3 mr-1" />
                        Chat
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Help Center */}
            <Card className="p-6 bg-linear-to-br from-blue-50 to-purple-50 border-blue-200">
              <h3 className="font-semibold mb-2">First Time Buyer?</h3>
              <p className="text-sm text-gray-700 mb-4">
                We're here to guide you through every step of the process.
              </p>
              <Button variant="outline" className="w-full">
                <Info className="w-4 h-4 mr-2" />
                View Help Guide
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
