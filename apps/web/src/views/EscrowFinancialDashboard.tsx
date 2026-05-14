'use client';

import { useState, useCallback } from "react";
import {
  DollarSign, Lock, Shield, TrendingUp, Download,
  Eye, CheckCircle2, Clock, AlertCircle, ArrowUpRight, ArrowDownLeft,
  FileText, Building, Calendar,
  X, Circle, Plus, Loader2
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAccessToken } from "@/lib/auth-session";
import { adminFinanceApi, escrowApi } from "@/lib/api-client";
import { getStatusColor } from "@/lib/status-colors";

type TransactionStatus = "completed" | "pending" | "processing" | "failed" | "scheduled";
type ReleaseStatus = "pending" | "partial" | "approved" | "released";

interface Transaction {
  id: string;
  date: string;
  time: string;
  type: string;
  description: string;
  amount: number;
  status: TransactionStatus;
  debitCredit: "debit" | "credit";
  linkedMilestone?: string;
  transactionHash?: string;
  authorizedBy?: string;
}

interface EscrowRelease {
  id: string;
  property: string;
  amount: number;
  recipient: string;
  purpose: string;
  milestone: string;
  status: ReleaseStatus;
  requiredSignatures: number;
  currentSignatures: number;
  signatories: {
    name: string;
    role: string;
    signed: boolean;
    signedDate?: string;
  }[];
  createdDate: string;
  releaseDate?: string;
}

export default function EscrowFinancialDashboard() {
  const [selectedTab, setSelectedTab] = useState<"overview" | "transactions" | "releases" | "commissions" | "audit">("overview");
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [selectedRelease, setSelectedRelease] = useState<EscrowRelease | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"all" | TransactionStatus>("all");
  // Sprint 05 — real API state
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [approvalError, setApprovalError] = useState<string | null>(null);
  const [approvalTxHash, setApprovalTxHash] = useState<string | null>(null);
  const [showNewReleaseForm, setShowNewReleaseForm] = useState(false);
  const [newReleaseForm, setNewReleaseForm] = useState({ escrowAccountId: '', amount: '', currency: 'ZAR', reason: '' });
  const [newReleaseLoading, setNewReleaseLoading] = useState(false);
  const [newReleaseError, setNewReleaseError] = useState<string | null>(null);

  const handleApproveRelease = useCallback(async () => {
    if (!selectedRelease) return;
    const token = getAccessToken();
    if (!token) { setApprovalError('Not authenticated'); return; }
    setApprovalLoading(true);
    setApprovalError(null);
    try {
      // Try admin approval first; fall back to buyer approval
      const result = await adminFinanceApi.approveRelease(token, selectedRelease.id);
      setApprovalTxHash(result?.id ?? selectedRelease.id);
      setShowReleaseModal(false);
      setShowConfirmation(true);
    } catch {
      // If admin endpoint fails (non-admin user) try buyer approval
      try {
        const token2 = getAccessToken();
        if (token2) {
          const result2 = await escrowApi.approveRelease(token2, selectedRelease.id);
          setApprovalTxHash(result2?.id ?? selectedRelease.id);
          setShowReleaseModal(false);
          setShowConfirmation(true);
          return;
        }
      } catch { /* fall through to show error */ }
      setApprovalError('Failed to submit approval. Check your permissions.');
    } finally {
      setApprovalLoading(false);
    }
  }, [selectedRelease]);

  const handleRequestRelease = useCallback(async () => {
    const token = getAccessToken();
    if (!token) { setNewReleaseError('Not authenticated'); return; }
    const amount = parseFloat(newReleaseForm.amount);
    if (!newReleaseForm.escrowAccountId || isNaN(amount) || amount <= 0 || !newReleaseForm.reason.trim()) {
      setNewReleaseError('Please fill in all fields.');
      return;
    }
    setNewReleaseLoading(true);
    setNewReleaseError(null);
    try {
      await escrowApi.requestRelease(token, {
        escrowAccountId: newReleaseForm.escrowAccountId,
        amount,
        currency: newReleaseForm.currency,
        reason: newReleaseForm.reason,
      });
      setShowNewReleaseForm(false);
      setNewReleaseForm({ escrowAccountId: '', amount: '', currency: 'ZAR', reason: '' });
    } catch (err) {
      setNewReleaseError(err instanceof Error ? err.message : 'Failed to request release.');
    } finally {
      setNewReleaseLoading(false);
    }
  }, [newReleaseForm]);

  const escrowSummary = {
    totalBalance: 45250000,
    availableBalance: 12500000,
    fundsHeld: 32750000,
    pendingReleases: 5850000,
    accounts: 23,
    lastUpdated: "2024-03-22 14:35:22",
  };

  const transactions: Transaction[] = [
    {
      id: "TXN001234",
      date: "2024-03-22",
      time: "14:30",
      type: "Deposit",
      description: "Initial Deposit - 88 Sunset Blvd",
      amount: 1250000,
      status: "completed",
      debitCredit: "credit",
      linkedMilestone: "Stage 2: Deposit Received",
      transactionHash: "0x7a8f9e2c1d5b4a3c",
      authorizedBy: "John Smith (Buyer)",
    },
    {
      id: "TXN001235",
      date: "2024-03-20",
      time: "11:15",
      type: "Transfer Fee",
      description: "Transfer Duty Payment - 88 Sunset Blvd",
      amount: 768000,
      status: "completed",
      debitCredit: "debit",
      linkedMilestone: "Stage 11: Transfer Duty Payment",
      transactionHash: "0x8b9g0f3d2e6c5b4d",
      authorizedBy: "Cape Legal Services",
    },
    {
      id: "TXN001236",
      date: "2024-03-22",
      time: "09:00",
      type: "Bond Funds",
      description: "Bond Release - Standard Bank",
      amount: 10000000,
      status: "processing",
      debitCredit: "credit",
      linkedMilestone: "Stage 6: Bond Approval",
    },
    {
      id: "TXN001237",
      date: "2024-03-18",
      time: "16:45",
      type: "Legal Fees",
      description: "Conveyancer Fees - Cape Legal",
      amount: 85000,
      status: "completed",
      debitCredit: "debit",
      linkedMilestone: "Stage 8: Draft Transfer Docs",
      transactionHash: "0x9c0h1g4e3f7d6c5e",
      authorizedBy: "Multi-signature (3/3)",
    },
    {
      id: "TXN001238",
      date: "2024-03-25",
      time: "10:00",
      type: "Agent Commission",
      description: "Agent Commission - PRIBEC",
      amount: 375000,
      status: "scheduled",
      debitCredit: "debit",
      linkedMilestone: "Stage 14: Keys Handover",
    },
  ];

  const pendingReleases: EscrowRelease[] = [
    {
      id: "REL001",
      property: "88 Sunset Boulevard",
      amount: 2500000,
      recipient: "Seller - David Thompson",
      purpose: "Interim Payment",
      milestone: "Stage 10: Rates Clearance",
      status: "partial",
      requiredSignatures: 3,
      currentSignatures: 2,
      signatories: [
        { name: "John Smith", role: "Buyer", signed: true, signedDate: "2024-03-22 10:30" },
        { name: "Sarah Jenkins", role: "Agent", signed: true, signedDate: "2024-03-22 11:15" },
        { name: "Adv. Maria Santos", role: "Conveyancer", signed: false },
      ],
      createdDate: "2024-03-22",
    },
    {
      id: "REL002",
      property: "88 Sunset Boulevard",
      amount: 85000,
      recipient: "Cape Legal Services",
      purpose: "Legal Fees",
      milestone: "Stage 12: Lodgement at Deeds",
      status: "pending",
      requiredSignatures: 2,
      currentSignatures: 0,
      signatories: [
        { name: "John Smith", role: "Buyer", signed: false },
        { name: "Standard Bank", role: "Bond Provider", signed: false },
      ],
      createdDate: "2024-03-20",
    },
  ];

  const commissions = [
    {
      id: "COM001",
      property: "88 Sunset Boulevard",
      salePrice: 12500000,
      commissionRate: 3,
      commissionAmount: 375000,
      agent: "Sarah Jenkins",
      agency: "PRIBEC Premier",
      status: "pending",
      releaseDate: "On Registration",
    },
    {
      id: "COM002",
      property: "204 Sky View",
      salePrice: 4250000,
      commissionRate: 3.5,
      commissionAmount: 148750,
      agent: "Michelle V.",
      agency: "Pam Golding",
      status: "released",
      releaseDate: "2024-03-15",
      paidDate: "2024-03-16",
    },
  ];

  const auditLogs = [
    { timestamp: "2024-03-22 14:30:22", action: "Deposit Received", user: "John Smith", amount: "R 1,250,000", ipAddress: "197.242.150.12", verified: true },
    { timestamp: "2024-03-22 11:15:30", action: "Release Approved", user: "Sarah Jenkins", details: "REL001 - Signature 2/3", ipAddress: "41.76.104.228", verified: true },
    { timestamp: "2024-03-22 10:30:15", action: "Release Approved", user: "John Smith", details: "REL001 - Signature 1/3", ipAddress: "197.242.150.12", verified: true },
    { timestamp: "2024-03-20 16:45:12", action: "Payment Processed", user: "System", amount: "R 85,000", details: "Legal Fees", verified: true },
    { timestamp: "2024-03-20 11:15:00", action: "Release Created", user: "Adv. Maria Santos", details: "REL002 - Legal Fees", ipAddress: "105.186.47.92", verified: true },
  ];

  const filteredTransactions = filterStatus === "all" 
    ? transactions 
    : transactions.filter(t => t.status === filterStatus);

  const getStatusIcon = (status: TransactionStatus | ReleaseStatus) => {
    switch (status) {
      case "completed": case "released": case "approved": return <CheckCircle2 className="w-4 h-4" />;
      case "processing": case "partial": return <Clock className="w-4 h-4" />;
      case "pending": case "scheduled": return <AlertCircle className="w-4 h-4" />;
      case "failed": return <X className="w-4 h-4" />;
      default: return <Circle className="w-4 h-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return `R ${amount.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Security Badge */}
      <div className="bg-linear-to-r from-gray-900 to-gray-800 text-white px-4 md:px-8 py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur">
                <Shield className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Escrow & Financial Dashboard</h1>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Lock className="w-4 h-4" />
                  <span>Bank-Grade Security • 256-bit Encryption</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => setShowNewReleaseForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Release
            </Button>
          </div>
        </div>

        {/* Last Updated */}
        <div className="text-xs text-gray-400">
          Last Updated: {escrowSummary.lastUpdated} • All transactions verified via blockchain
        </div>
      </div>

      {/* Escrow Summary Cards */}
      <div className="px-4 md:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Balance */}
          <Card className="p-6 bg-linear-to-br from-blue-500 to-blue-600 text-white border-0">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur">
                <DollarSign className="w-6 h-6" />
              </div>
              <Shield className="w-5 h-5 text-white/60" />
            </div>
            <div className="text-sm opacity-90 mb-1">Total Escrow Balance</div>
            <div className="text-3xl font-bold mb-2">{formatCurrency(escrowSummary.totalBalance)}</div>
            <div className="text-xs opacity-75">{escrowSummary.accounts} Active Accounts</div>
          </Card>

          {/* Available Balance */}
          <Card className="p-6 bg-linear-to-br from-green-500 to-green-600 text-white border-0">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur">
                <TrendingUp className="w-6 h-6" />
              </div>
              <CheckCircle2 className="w-5 h-5 text-white/60" />
            </div>
            <div className="text-sm opacity-90 mb-1">Available Balance</div>
            <div className="text-3xl font-bold mb-2">{formatCurrency(escrowSummary.availableBalance)}</div>
            <div className="text-xs opacity-75">Ready for Release</div>
          </Card>

          {/* Funds Held */}
          <Card className="p-6 bg-linear-to-br from-purple-500 to-purple-600 text-white border-0">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur">
                <Lock className="w-6 h-6" />
              </div>
              <Clock className="w-5 h-5 text-white/60" />
            </div>
            <div className="text-sm opacity-90 mb-1">Funds Held</div>
            <div className="text-3xl font-bold mb-2">{formatCurrency(escrowSummary.fundsHeld)}</div>
            <div className="text-xs opacity-75">Secured in Escrow</div>
          </Card>

          {/* Pending Releases */}
          <Card className="p-6 bg-linear-to-br from-orange-500 to-orange-600 text-white border-0">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur">
                <ArrowUpRight className="w-6 h-6" />
              </div>
              <AlertCircle className="w-5 h-5 text-white/60" />
            </div>
            <div className="text-sm opacity-90 mb-1">Pending Releases</div>
            <div className="text-3xl font-bold mb-2">{formatCurrency(escrowSummary.pendingReleases)}</div>
            <div className="text-xs opacity-75">{pendingReleases.length} Awaiting Approval</div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg border border-gray-200 mb-8">
          <div className="flex items-center gap-1 overflow-x-auto border-b border-gray-200 px-2">
            {[
              { id: "overview", label: "Overview", icon: DollarSign },
              { id: "transactions", label: "Transactions", icon: FileText },
              { id: "releases", label: "Release Approvals", icon: Lock },
              { id: "commissions", label: "Commissions", icon: TrendingUp },
              { id: "audit", label: "Audit Trail", icon: Eye },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as "overview" | "transactions" | "releases" | "commissions" | "audit")}
                className={`
                  flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap
                  transition-colors
                  ${selectedTab === tab.id 
                    ? "border-blue-500 text-blue-600" 
                    : "border-transparent text-gray-600 hover:text-gray-900"
                  }
                `}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Overview Tab */}
            {selectedTab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent Transactions */}
                  <div>
                    <h3 className="font-semibold text-lg mb-4">Recent Transactions</h3>
                    <div className="space-y-3">
                      {transactions.slice(0, 5).map((txn) => (
                        <div key={txn.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className={`
                              w-10 h-10 rounded-full flex items-center justify-center shrink-0
                              ${txn.debitCredit === "credit" ? "bg-green-100" : "bg-red-100"}
                            `}>
                              {txn.debitCredit === "credit" ? (
                                <ArrowDownLeft className="w-5 h-5 text-green-600" />
                              ) : (
                                <ArrowUpRight className="w-5 h-5 text-red-600" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">{txn.description}</div>
                              <div className="text-xs text-gray-600">{txn.date} • {txn.type}</div>
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <div className={`font-bold ${txn.debitCredit === "credit" ? "text-green-600" : "text-red-600"}`}>
                              {txn.debitCredit === "credit" ? "+" : "-"}{formatCurrency(txn.amount)}
                            </div>
                            <Badge className={`${getStatusColor(txn.status)} text-xs`}>
                              {txn.status.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button variant="outline" className="w-full mt-4">
                      View All Transactions
                    </Button>
                  </div>

                  {/* Pending Releases */}
                  <div>
                    <h3 className="font-semibold text-lg mb-4">Pending Release Approvals</h3>
                    <div className="space-y-3">
                      {pendingReleases.map((release) => (
                        <div key={release.id} className="p-4 bg-linear-to-br from-orange-50 to-yellow-50 border-2 border-orange-200 rounded-lg">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold mb-1 truncate">{release.property}</div>
                              <div className="text-sm text-gray-600 truncate">{release.purpose}</div>
                            </div>
                            <Badge className={getStatusColor(release.status)}>
                              {release.currentSignatures}/{release.requiredSignatures}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between mb-3">
                            <div className="font-bold text-lg text-blue-600">{formatCurrency(release.amount)}</div>
                            <div className="text-xs text-gray-600">{release.milestone}</div>
                          </div>
                          <div className="flex items-center gap-2 mb-3">
                            {release.signatories.map((sig, idx) => (
                              <div 
                                key={idx}
                                className={`
                                  flex-1 h-2 rounded-full
                                  ${sig.signed ? "bg-green-500" : "bg-gray-200"}
                                `}
                              />
                            ))}
                          </div>
                          <Button 
                            size="sm" 
                            className="w-full bg-orange-600 hover:bg-orange-700"
                            onClick={() => {
                              setSelectedRelease(release);
                              setShowReleaseModal(true);
                            }}
                          >
                            <Lock className="w-4 h-4 mr-2" />
                            Review & Sign
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Transactions Tab */}
            {selectedTab === "transactions" && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <input
                      type="search"
                      placeholder="Search transactions..."
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <select 
                      title="Filter transaction status"
                      className="px-4 py-2 border border-gray-300 rounded-lg"
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as "all" | TransactionStatus)}
                    >
                      <option value="all">All Status</option>
                      <option value="completed">Completed</option>
                      <option value="processing">Processing</option>
                      <option value="pending">Pending</option>
                      <option value="scheduled">Scheduled</option>
                    </select>
                  </div>
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Download Statement
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b-2 border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Date & Time</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Type</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Description</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold">Amount</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Milestone</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredTransactions.map((txn) => (
                        <tr key={txn.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium">{txn.date}</div>
                            <div className="text-xs text-gray-500">{txn.time}</div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <Badge variant="secondary">{txn.type}</Badge>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm font-medium">{txn.description}</div>
                            {txn.authorizedBy && (
                              <div className="text-xs text-gray-500">By: {txn.authorizedBy}</div>
                            )}
                          </td>
                          <td className="px-4 py-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              {txn.debitCredit === "credit" ? (
                                <ArrowDownLeft className="w-4 h-4 text-green-600" />
                              ) : (
                                <ArrowUpRight className="w-4 h-4 text-red-600" />
                              )}
                              <span className={`font-bold ${txn.debitCredit === "credit" ? "text-green-600" : "text-red-600"}`}>
                                {txn.debitCredit === "credit" ? "+" : "-"}{formatCurrency(txn.amount)}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center whitespace-nowrap">
                            <Badge className={`${getStatusColor(txn.status)} inline-flex items-center justify-center gap-1`}>
                              {getStatusIcon(txn.status)}
                              {txn.status.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="px-4 py-4">
                            {txn.linkedMilestone && (
                              <div className="text-xs text-gray-600">{txn.linkedMilestone}</div>
                            )}
                          </td>
                          <td className="px-4 py-4 text-center whitespace-nowrap">
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Release Approvals Tab */}
            {selectedTab === "releases" && (
              <div className="space-y-6">
                {pendingReleases.map((release) => (
                  <Card key={release.id} className="p-6 border-2 border-gray-200">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-bold text-lg mb-1">{release.property}</h3>
                            <div className="text-sm text-gray-600">{release.purpose}</div>
                          </div>
                          <Badge className={`${getStatusColor(release.status)} text-lg px-4 py-2`}>
                            {release.currentSignatures}/{release.requiredSignatures} SIGNATURES
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <div className="text-sm text-gray-600">Release Amount</div>
                            <div className="text-2xl font-bold text-blue-600">{formatCurrency(release.amount)}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">Recipient</div>
                            <div className="font-medium">{release.recipient}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">Milestone</div>
                            <div className="font-medium">{release.milestone}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">Created</div>
                            <div className="font-medium">{release.createdDate}</div>
                          </div>
                        </div>

                        <div className="border-t border-gray-200 pt-4">
                          <h4 className="font-semibold mb-3">Multi-Signature Approval Status</h4>
                          <div className="space-y-3">
                            {release.signatories.map((sig, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <div className={`
                                    w-10 h-10 rounded-full flex items-center justify-center
                                    ${sig.signed ? "bg-green-100" : "bg-gray-200"}
                                  `}>
                                    {sig.signed ? (
                                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                                    ) : (
                                      <Clock className="w-5 h-5 text-gray-400" />
                                    )}
                                  </div>
                                  <div>
                                    <div className="font-medium">{sig.name}</div>
                                    <div className="text-sm text-gray-600">{sig.role}</div>
                                  </div>
                                </div>
                                <div>
                                  {sig.signed ? (
                                    <div className="text-sm">
                                      <Badge className="bg-green-100 text-green-700">
                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                        SIGNED
                                      </Badge>
                                      <div className="text-xs text-gray-500 mt-1">{sig.signedDate}</div>
                                    </div>
                                  ) : (
                                    <Badge className="bg-yellow-100 text-yellow-700">
                                      <Clock className="w-3 h-3 mr-1" />
                                      PENDING
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="lg:w-64 space-y-3">
                        <Button 
                          className="w-full bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => {
                            setSelectedRelease(release);
                            setShowReleaseModal(true);
                          }}
                        >
                          <Lock className="w-4 h-4 mr-2" />
                          Review & Approve
                        </Button>
                        <Button variant="outline" className="w-full">
                          <FileText className="w-4 h-4 mr-2" />
                          View Documents
                        </Button>
                        <Button variant="outline" className="w-full">
                          <Eye className="w-4 h-4 mr-2" />
                          Audit Trail
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Commissions Tab */}
            {selectedTab === "commissions" && (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <Card className="p-6 bg-linear-to-br from-green-50 to-emerald-50 border-green-200">
                    <div className="text-sm text-gray-600 mb-1">Total Commissions</div>
                    <div className="text-3xl font-bold text-green-600 mb-2">R 523,750</div>
                    <div className="text-xs text-gray-600">2 Transactions</div>
                  </Card>
                  <Card className="p-6 bg-linear-to-br from-yellow-50 to-orange-50 border-yellow-200">
                    <div className="text-sm text-gray-600 mb-1">Pending Release</div>
                    <div className="text-3xl font-bold text-yellow-600 mb-2">R 375,000</div>
                    <div className="text-xs text-gray-600">Awaiting Registration</div>
                  </Card>
                  <Card className="p-6 bg-linear-to-br from-blue-50 to-indigo-50 border-blue-200">
                    <div className="text-sm text-gray-600 mb-1">Released</div>
                    <div className="text-3xl font-bold text-blue-600 mb-2">R 148,750</div>
                    <div className="text-xs text-gray-600">1 Payment Complete</div>
                  </Card>
                </div>

                <div className="space-y-4">
                  {commissions.map((comm) => (
                    <Card key={comm.id} className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                              <TrendingUp className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-bold">{comm.property}</h3>
                              <div className="text-sm text-gray-600">{comm.agency} • {comm.agent}</div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <div className="text-xs text-gray-600">Sale Price</div>
                              <div className="font-semibold">{formatCurrency(comm.salePrice)}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-600">Commission Rate</div>
                              <div className="font-semibold">{comm.commissionRate}%</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-600">Commission Amount</div>
                              <div className="font-bold text-blue-600">{formatCurrency(comm.commissionAmount)}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-600">Release Date</div>
                              <div className="font-semibold">{comm.releaseDate}</div>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Badge className={comm.status === "released" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}>
                            {comm.status.toUpperCase()}
                          </Badge>
                          {comm.paidDate && (
                            <div className="text-xs text-gray-600">Paid: {comm.paidDate}</div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Audit Trail Tab */}
            {selectedTab === "audit" && (
              <div>
                <div className="flex items-center gap-3 mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="font-semibold text-blue-900">Blockchain-Verified Audit Trail</div>
                    <div className="text-sm text-blue-700">All transactions are cryptographically secured and immutable</div>
                  </div>
                </div>

                <div className="space-y-3">
                  {auditLogs.map((log, idx) => (
                    <div key={idx} className="flex items-start gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                        {log.verified ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-yellow-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <div className="font-semibold">{log.action}</div>
                            <div className="text-sm text-gray-600">by {log.user}</div>
                          </div>
                          {log.amount && (
                            <div className="font-bold text-blue-600 whitespace-nowrap">{log.amount}</div>
                          )}
                        </div>
                        {log.details && (
                          <div className="text-sm text-gray-600 mb-2">{log.details}</div>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {log.timestamp}
                          </div>
                          <div className="flex items-center gap-1">
                            <Building className="w-3 h-3" />
                            IP: {log.ipAddress}
                          </div>
                          {log.verified && (
                            <Badge className="bg-green-100 text-green-700 text-xs">
                              <Shield className="w-3 h-3 mr-1" />
                              VERIFIED
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Button variant="outline" className="w-full mt-6">
                  <Download className="w-4 h-4 mr-2" />
                  Download Complete Audit Log
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Release Approval Modal */}
      {showReleaseModal && selectedRelease && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 bg-linear-to-r from-blue-500 to-purple-600 text-white sticky top-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-xl mb-1">Multi-Signature Approval Required</h3>
                  <div className="text-sm opacity-90">Release ID: {selectedRelease.id}</div>
                </div>
                <button 
                  onClick={() => setShowReleaseModal(false)} 
                  title="Close release approval modal"
                  aria-label="Close release approval modal"
                  className="text-white hover:bg-white/20 p-2 rounded-lg"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Release Details */}
              <div className="p-4 bg-linear-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Property</div>
                    <div className="font-semibold">{selectedRelease.property}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Release Amount</div>
                    <div className="text-2xl font-bold text-blue-600">{formatCurrency(selectedRelease.amount)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Recipient</div>
                    <div className="font-semibold">{selectedRelease.recipient}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Purpose</div>
                    <div className="font-semibold">{selectedRelease.purpose}</div>
                  </div>
                </div>
              </div>

              {/* Signatories */}
              <div>
                <h4 className="font-semibold mb-3">Required Signatures ({selectedRelease.currentSignatures}/{selectedRelease.requiredSignatures})</h4>
                <div className="space-y-2">
                  {selectedRelease.signatories.map((sig, idx) => (
                    <div key={idx} className={`
                      p-4 rounded-lg flex items-center justify-between
                      ${sig.signed ? "bg-green-50 border border-green-200" : "bg-yellow-50 border border-yellow-200"}
                    `}>
                      <div className="flex items-center gap-3">
                        <div className={`
                          w-10 h-10 rounded-full flex items-center justify-center
                          ${sig.signed ? "bg-green-100" : "bg-yellow-100"}
                        `}>
                          {sig.signed ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          ) : (
                            <Clock className="w-5 h-5 text-yellow-600" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{sig.name}</div>
                          <div className="text-sm text-gray-600">{sig.role}</div>
                        </div>
                      </div>
                      {sig.signed ? (
                        <div className="text-right">
                          <Badge className="bg-green-100 text-green-700 mb-1">SIGNED</Badge>
                          <div className="text-xs text-gray-600">{sig.signedDate}</div>
                        </div>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-700">PENDING</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Security Notice */}
              <div className="p-4 bg-gray-900 text-white rounded-lg">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold mb-1">Security Notice</div>
                    <div className="text-sm text-gray-300">
                      This action will be cryptographically signed with your private key and recorded on the blockchain. 
                      This signature cannot be reversed or modified once confirmed.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3 sticky bottom-0 bg-white">
              <Button 
                onClick={() => setShowReleaseModal(false)} 
                variant="outline" 
                className="flex-1"
              >
                Cancel
              </Button>
              {approvalError && (
                <p className="flex-1 text-sm text-red-600 text-center px-2">{approvalError}</p>
              )}
              <Button 
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                onClick={handleApproveRelease}
                disabled={approvalLoading}
              >
                {approvalLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lock className="w-4 h-4 mr-2" />}
                {approvalLoading ? 'Submitting…' : 'Approve & Sign'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* New Release Request Modal */}
      {showNewReleaseForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="max-w-lg w-full">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-600 to-emerald-700 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-xl mb-1">Request Escrow Release</h3>
                  <div className="text-sm opacity-90">Funds will be released upon multi-signature approval</div>
                </div>
                <button onClick={() => setShowNewReleaseForm(false)} className="text-white hover:bg-white/20 p-2 rounded-lg" aria-label="Close">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Escrow Account ID</label>
                <input
                  type="text"
                  placeholder="UUID of the escrow account"
                  value={newReleaseForm.escrowAccountId}
                  onChange={e => setNewReleaseForm(f => ({ ...f, escrowAccountId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    min="0"
                    value={newReleaseForm.amount}
                    onChange={e => setNewReleaseForm(f => ({ ...f, amount: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <select
                    value={newReleaseForm.currency}
                    onChange={e => setNewReleaseForm(f => ({ ...f, currency: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                  >
                    <option value="ZAR">ZAR</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason / Milestone</label>
                <textarea
                  placeholder="e.g. Transfer duty payment — Stage 12"
                  rows={3}
                  value={newReleaseForm.reason}
                  onChange={e => setNewReleaseForm(f => ({ ...f, reason: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm resize-none"
                />
              </div>
              {newReleaseError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {newReleaseError}
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <Button onClick={() => setShowNewReleaseForm(false)} variant="outline" className="flex-1">Cancel</Button>
              <Button
                onClick={handleRequestRelease}
                disabled={newReleaseLoading}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                {newReleaseLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <DollarSign className="w-4 h-4 mr-2" />}
                {newReleaseLoading ? 'Submitting…' : 'Submit Release Request'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-bold text-xl mb-2">Signature Recorded</h3>
              <p className="text-gray-600 mb-6">
                Your approval has been cryptographically signed and recorded on the blockchain.
              </p>
              <div className="p-4 bg-gray-50 rounded-lg mb-6">
                <div className="text-sm text-gray-600 mb-1">Release ID</div>
                <div className="font-mono text-xs text-blue-600 break-all">{approvalTxHash ?? selectedRelease?.id ?? '—'}</div>
              </div>
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => setShowConfirmation(false)}
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
