'use client';

import { useState } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Camera,
  MapPin,
  Shield,
  Download,
  Lock,
  User,
  Clipboard,
  ChevronRight,
  ChevronDown,
  Check,
  X,
  ExternalLink,
  Eye,
  TrendingUp,
  Award,
  BadgeCheck,
  FileCheck,
  MapPinned,
  Locate,
  Search,
  Plus,
  Edit,
  Ban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Type definitions
interface Inspection {
  id: string;
  projectName: string;
  stage: string;
  scheduledDate: string;
  scheduledTime: string;
  inspector: string;
  inspectorId: string;
  status: "scheduled" | "in-progress" | "completed" | "failed" | "conditional";
  result?: "pass" | "fail" | "conditional";
  location: string;
  notes?: string;
  completedDate?: string;
  certificateUrl?: string;
}

interface ChecklistItem {
  id: string;
  category: string;
  item: string;
  description: string;
  status: "pending" | "pass" | "fail" | "conditional" | "not-applicable";
  notes?: string;
  photos?: InspectionPhoto[];
  required: boolean;
}

interface InspectionPhoto {
  id: string;
  url: string;
  timestamp: string;
  geoValidated: boolean;
  exifValidated: boolean;
  location?: { lat: number; lng: number };
  uploadedBy: string;
  caption?: string;
}

interface ProgressLogEntry {
  id: string;
  timestamp: string;
  action: string;
  performedBy: string;
  stage: string;
  status: string;
  verified: boolean;
  blockchainHash?: string;
  details?: string;
  photos?: InspectionPhoto[];
}

// Mock data
const mockInspections: Inspection[] = [
  {
    id: "INS-001",
    projectName: "Luxury Apartment Complex - Phase 1",
    stage: "Foundation",
    scheduledDate: "2026-02-25",
    scheduledTime: "10:00 AM",
    inspector: "David Thompson",
    inspectorId: "INSP-001",
    status: "scheduled",
    location: "Site A, Block 1",
  },
  {
    id: "INS-002",
    projectName: "Luxury Apartment Complex - Phase 1",
    stage: "Structural Framework",
    scheduledDate: "2026-02-20",
    scheduledTime: "2:00 PM",
    inspector: "Sarah Martinez",
    inspectorId: "INSP-002",
    status: "completed",
    result: "pass",
    location: "Site A, Block 1",
    completedDate: "2026-02-20T14:30:00",
    certificateUrl: "#",
  },
  {
    id: "INS-003",
    projectName: "Luxury Apartment Complex - Phase 1",
    stage: "Electrical Rough-In",
    scheduledDate: "2026-02-22",
    scheduledTime: "11:00 AM",
    inspector: "Michael Chen",
    inspectorId: "INSP-003",
    status: "completed",
    result: "conditional",
    location: "Site A, Block 1",
    completedDate: "2026-02-22T11:45:00",
    notes: "Minor issues with cable routing. Must be corrected before next stage.",
  },
];

const mockInspectors = [
  {
    id: "INSP-001",
    name: "David Thompson",
    specialty: "Structural",
    certifications: ["PE", "LEED AP"],
    rating: 4.9,
    completedInspections: 234,
    availability: ["2026-02-25", "2026-02-26", "2026-02-27"],
  },
  {
    id: "INSP-002",
    name: "Sarah Martinez",
    specialty: "Electrical",
    certifications: ["PE", "ICC Certified"],
    rating: 4.8,
    completedInspections: 189,
    availability: ["2026-02-24", "2026-02-25", "2026-02-28"],
  },
  {
    id: "INSP-003",
    name: "Michael Chen",
    specialty: "Plumbing & Mechanical",
    certifications: ["PE", "ASPE Member"],
    rating: 4.9,
    completedInspections: 267,
    availability: ["2026-02-25", "2026-02-26"],
  },
];

const mockChecklistItems: ChecklistItem[] = [
  {
    id: "CHK-001",
    category: "Foundation",
    item: "Excavation Depth",
    description: "Verify excavation depth meets approved plans",
    status: "pending",
    required: true,
  },
  {
    id: "CHK-002",
    category: "Foundation",
    item: "Soil Compaction",
    description: "Test soil compaction at required locations",
    status: "pending",
    required: true,
  },
  {
    id: "CHK-003",
    category: "Foundation",
    item: "Rebar Installation",
    description: "Check rebar spacing, size, and placement",
    status: "pending",
    required: true,
  },
  {
    id: "CHK-004",
    category: "Foundation",
    item: "Formwork Quality",
    description: "Inspect formwork alignment and stability",
    status: "pending",
    required: true,
  },
  {
    id: "CHK-005",
    category: "Foundation",
    item: "Drainage System",
    description: "Verify drainage pipes and waterproofing",
    status: "pending",
    required: true,
  },
  {
    id: "CHK-006",
    category: "Safety",
    item: "Site Safety Equipment",
    description: "Verify presence of safety equipment and signage",
    status: "pending",
    required: true,
  },
  {
    id: "CHK-007",
    category: "Documentation",
    item: "Material Certifications",
    description: "Review material test certificates",
    status: "pending",
    required: false,
  },
];

const mockProgressLog: ProgressLogEntry[] = [
  {
    id: "LOG-001",
    timestamp: "2026-02-20T14:30:00",
    action: "Inspection Completed",
    performedBy: "Sarah Martinez (Inspector)",
    stage: "Structural Framework",
    status: "Passed",
    verified: true,
    blockchainHash: "0x7a9f3b2c8d1e4f6a5b9c2d3e4f5a6b7c8d9e0f1a",
    details: "All structural elements meet specifications. No deficiencies noted.",
  },
  {
    id: "LOG-002",
    timestamp: "2026-02-18T16:45:00",
    action: "Stage Completed",
    performedBy: "Project Manager",
    stage: "Foundation",
    status: "Completed",
    verified: true,
    blockchainHash: "0x6b8e2a1d9c0f3e5b4a7c6d8e9f0a1b2c3d4e5f6a",
  },
  {
    id: "LOG-003",
    timestamp: "2026-02-15T10:20:00",
    action: "Inspection Completed",
    performedBy: "David Thompson (Inspector)",
    stage: "Foundation",
    status: "Passed",
    verified: true,
    blockchainHash: "0x5c7d1a0e8b9f2d4c3b6a5d7e8f9a0b1c2d3e4f5a",
    details: "Foundation work meets all regulatory requirements.",
  },
  {
    id: "LOG-004",
    timestamp: "2026-02-22T11:45:00",
    action: "Inspection Completed",
    performedBy: "Michael Chen (Inspector)",
    stage: "Electrical Rough-In",
    status: "Conditional Pass",
    verified: true,
    blockchainHash: "0x4d6c0a9f7b8e1c3d2a5b4c6d7e8f9a0b1c2d3e4f",
    details: "Minor cable routing corrections required before next stage.",
  },
];

export default function InspectionVerificationModule() {
  const [activeTab, setActiveTab] = useState("overview");
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [showInspectorPortal, setShowInspectorPortal] = useState(false);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>(mockChecklistItems);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedInspector, setSelectedInspector] = useState("");
  const [selectedStage, setSelectedStage] = useState("");
  const [inspectionNotes, setInspectionNotes] = useState("");
  const [overallResult, setOverallResult] = useState<"pass" | "fail" | "conditional" | "">("");
  const [, setShowPhotoUpload] = useState(false);
  const [expandedLogEntry, setExpandedLogEntry] = useState<string | null>(null);

  // Calculate statistics
  const completedInspections = mockInspections.filter((i) => i.status === "completed").length;
  const passedInspections = mockInspections.filter((i) => i.result === "pass").length;
  const passRate = completedInspections > 0 ? (passedInspections / completedInspections) * 100 : 0;
  const pendingInspections = mockInspections.filter((i) => i.status === "scheduled").length;

  const handleChecklistUpdate = (itemId: string, status: ChecklistItem["status"], notes?: string) => {
    setChecklistItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, status, notes } : item
      )
    );
  };

  const handleCompleteInspection = () => {
    if (!overallResult) {
      alert("Please select an overall result (Pass/Fail/Conditional)");
      return;
    }
    
    const requiredItems = checklistItems.filter((item) => item.required);
    const completedRequired = requiredItems.filter(
      (item) => item.status !== "pending"
    ).length;

    if (completedRequired < requiredItems.length) {
      alert("Please complete all required checklist items");
      return;
    }

    alert(`Inspection completed with result: ${overallResult.toUpperCase()}\nCertificate generated.`);
    setShowInspectorPortal(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Scheduled</Badge>;
      case "in-progress":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">In Progress</Badge>;
      case "completed":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Completed</Badge>;
      case "failed":
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Failed</Badge>;
      case "conditional":
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Conditional</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getResultBadge = (result?: string) => {
    switch (result) {
      case "pass":
        return (
          <Badge className="bg-green-600 text-white">
            <CheckCircle className="w-3 h-3 mr-1" />
            Passed
          </Badge>
        );
      case "fail":
        return (
          <Badge className="bg-red-600 text-white">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      case "conditional":
        return (
          <Badge className="bg-orange-600 text-white">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Conditional
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-20">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-black mb-1">
                Inspection & Progress Verification
              </h1>
              <p className="text-sm text-gray-600">
                Luxury Apartment Complex - Phase 1
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setShowInspectorPortal(true)}
                className="border-gray-300"
              >
                <Clipboard className="w-4 h-4 mr-2" />
                Inspector Portal
              </Button>
              <Button
                onClick={() => setShowBookingDialog(true)}
                className="bg-black text-white hover:bg-gray-800"
              >
                <Plus className="w-4 h-4 mr-2" />
                Schedule Inspection
              </Button>
            </div>
          </div>

          {/* Compliance Banner */}
          <Card className="p-4 bg-blue-50 border-blue-200 mb-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold text-blue-900 mb-1">
                  Regulatory Compliance Active
                </div>
                <div className="text-sm text-blue-700">
                  All inspections are conducted in accordance with local building codes and
                  regulations. Geo-validation and EXIF verification ensure authenticity of all
                  documentation.
                </div>
              </div>
              <Badge className="bg-blue-600 text-white">
                <BadgeCheck className="w-3 h-3 mr-1" />
                Compliant
              </Badge>
            </div>
          </Card>

          {/* Statistics */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="p-4 border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Total Inspections</span>
                <FileCheck className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-black">{mockInspections.length}</div>
            </Card>

            <Card className="p-4 border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Pass Rate</span>
                <TrendingUp className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-green-600">{passRate.toFixed(0)}%</div>
            </Card>

            <Card className="p-4 border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Pending</span>
                <Clock className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-blue-600">{pendingInspections}</div>
            </Card>

            <Card className="p-4 border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Verified Entries</span>
                <Lock className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-black">{mockProgressLog.length}</div>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="inspections">Inspections</TabsTrigger>
            <TabsTrigger value="progress-log">Progress Log</TabsTrigger>
            <TabsTrigger value="certificates">Certificates</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Upcoming Inspections */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Upcoming Inspections</h2>
              <div className="space-y-3">
                {mockInspections
                  .filter((i) => i.status === "scheduled")
                  .map((inspection) => (
                    <Card key={inspection.id} className="p-4 border-gray-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold">{inspection.stage}</h3>
                            {getStatusBadge(inspection.status)}
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="w-4 h-4" />
                              {new Date(inspection.scheduledDate).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              {inspection.scheduledTime}
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              {inspection.location}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-2 text-sm">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">Inspector:</span>
                            <span className="font-medium">{inspection.inspector}</span>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="border-gray-300">
                          <Edit className="w-4 h-4 mr-2" />
                          Reschedule
                        </Button>
                      </div>
                    </Card>
                  ))}
              </div>
            </div>

            {/* Recent Completed Inspections */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Recent Completed Inspections</h2>
              <div className="space-y-3">
                {mockInspections
                  .filter((i) => i.status === "completed")
                  .map((inspection) => (
                    <Card key={inspection.id} className="p-4 border-gray-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold">{inspection.stage}</h3>
                            {getResultBadge(inspection.result)}
                            {inspection.result === "conditional" && (
                              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                <Ban className="w-3 h-3 mr-1" />
                                Stage Blocked
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 mb-2">
                            Completed on {new Date(inspection.completedDate!).toLocaleString()}
                          </div>
                          {inspection.notes && (
                            <div className="text-sm text-gray-700 bg-yellow-50 border border-yellow-200 rounded p-2 mb-2">
                              <AlertTriangle className="w-4 h-4 inline mr-2 text-yellow-600" />
                              {inspection.notes}
                            </div>
                          )}
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-sm">
                              <Shield className="w-4 h-4 text-green-600" />
                              <span className="text-gray-600">Geo-validated</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <BadgeCheck className="w-4 h-4 text-green-600" />
                              <span className="text-gray-600">EXIF verified</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Lock className="w-4 h-4 text-gray-600" />
                              <span className="text-gray-600">Immutable record</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {inspection.certificateUrl && (
                            <Button variant="outline" size="sm" className="border-gray-300">
                              <Download className="w-4 h-4 mr-2" />
                              Certificate
                            </Button>
                          )}
                          <Button variant="outline" size="sm" className="border-gray-300">
                            <Eye className="w-4 h-4 mr-2" />
                            Details
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
              </div>
            </div>
          </TabsContent>

          {/* Inspections Tab */}
          <TabsContent value="inspections" className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input placeholder="Search inspections..." className="pl-10 border-gray-300" />
              </div>
              <Select defaultValue="all">
                <SelectTrigger className="w-48 border-gray-300">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="conditional">Conditional</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              {mockInspections.map((inspection) => (
                <Card key={inspection.id} className="p-5 border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{inspection.stage}</h3>
                        {getStatusBadge(inspection.status)}
                        {inspection.result && getResultBadge(inspection.result)}
                      </div>
                      <div className="text-sm text-gray-600">{inspection.projectName}</div>
                    </div>
                    <div className="text-sm text-gray-500">ID: {inspection.id}</div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Scheduled Date</div>
                      <div className="text-sm font-medium">
                        {new Date(inspection.scheduledDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Time</div>
                      <div className="text-sm font-medium">{inspection.scheduledTime}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Location</div>
                      <div className="text-sm font-medium">{inspection.location}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Inspector</div>
                      <div className="text-sm font-medium">{inspection.inspector}</div>
                    </div>
                  </div>

                  {inspection.notes && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-gray-700">{inspection.notes}</div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      {inspection.status === "completed" && (
                        <>
                          <div className="flex items-center gap-1">
                            <Shield className="w-3 h-3 text-green-600" />
                            Geo-validated
                          </div>
                          <div className="flex items-center gap-1">
                            <BadgeCheck className="w-3 h-3 text-green-600" />
                            EXIF verified
                          </div>
                          <div className="flex items-center gap-1">
                            <Lock className="w-3 h-3 text-gray-600" />
                            Blockchain secured
                          </div>
                        </>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {inspection.certificateUrl && (
                        <Button variant="outline" size="sm" className="border-gray-300">
                          <Download className="w-4 h-4 mr-2" />
                          Certificate
                        </Button>
                      )}
                      <Button variant="outline" size="sm" className="border-gray-300">
                        View Details
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Progress Log Tab */}
          <TabsContent value="progress-log" className="space-y-6">
            <Card className="p-6 border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold mb-1">Immutable Progress Timeline</h2>
                  <p className="text-sm text-gray-600">
                    All entries are cryptographically secured and permanently recorded
                  </p>
                </div>
                <Badge className="bg-green-600 text-white">
                  <Lock className="w-3 h-3 mr-1" />
                  {mockProgressLog.length} Verified Entries
                </Badge>
              </div>

              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-4">
                  {mockProgressLog.map((entry, index) => (
                    <div key={entry.id} className="relative">
                      {/* Timeline connector */}
                      {index < mockProgressLog.length - 1 && (
                        <div className="absolute left-4 top-12 bottom-0 w-0.5 bg-gray-200" />
                      )}

                      <Card className="p-5 border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex gap-4">
                          {/* Timeline dot */}
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            </div>
                          </div>

                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="font-semibold mb-1">{entry.action}</h3>
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                  <span>{entry.stage}</span>
                                  <span>•</span>
                                  <span>{entry.performedBy}</span>
                                </div>
                              </div>
                              <Badge
                                className={
                                  entry.status.includes("Pass")
                                    ? "bg-green-600 text-white"
                                    : entry.status.includes("Conditional")
                                    ? "bg-orange-600 text-white"
                                    : "bg-gray-600 text-white"
                                }
                              >
                                {entry.status}
                              </Badge>
                            </div>

                            <div className="text-sm text-gray-600 mb-3">
                              {new Date(entry.timestamp).toLocaleString()}
                            </div>

                            {entry.details && (
                              <div className="text-sm text-gray-700 bg-gray-50 rounded p-3 mb-3">
                                {entry.details}
                              </div>
                            )}

                            {/* Verification badges */}
                            <div className="flex items-center gap-4 mb-3">
                              <div className="flex items-center gap-1 text-xs">
                                <Shield className="w-3 h-3 text-green-600" />
                                <span className="text-gray-600">Verified</span>
                              </div>
                              <div className="flex items-center gap-1 text-xs">
                                <Lock className="w-3 h-3 text-gray-600" />
                                <span className="text-gray-600">Immutable</span>
                              </div>
                              <div className="flex items-center gap-1 text-xs">
                                <MapPinned className="w-3 h-3 text-green-600" />
                                <span className="text-gray-600">Geo-validated</span>
                              </div>
                            </div>

                            {/* Blockchain hash */}
                            {entry.blockchainHash && (
                              <div className="bg-black text-white rounded p-3 font-mono text-xs">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <span className="text-gray-400">Blockchain Hash: </span>
                                    <span className="text-green-400">{entry.blockchainHash}</span>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-white hover:text-green-400"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* Expandable details */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setExpandedLogEntry(
                                  expandedLogEntry === entry.id ? null : entry.id
                                )
                              }
                              className="mt-3 text-xs"
                            >
                              {expandedLogEntry === entry.id ? (
                                <>
                                  <ChevronDown className="w-3 h-3 mr-1" />
                                  Hide Details
                                </>
                              ) : (
                                <>
                                  <ChevronRight className="w-3 h-3 mr-1" />
                                  Show More
                                </>
                              )}
                            </Button>

                            {expandedLogEntry === entry.id && (
                              <div className="mt-3 pt-3 border-t border-gray-200 space-y-2 text-sm">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <span className="text-gray-600">Entry ID:</span>
                                    <span className="ml-2 font-mono">{entry.id}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Verification Status:</span>
                                    <span className="ml-2 text-green-600 font-semibold">
                                      Verified
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>
          </TabsContent>

          {/* Certificates Tab */}
          <TabsContent value="certificates" className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              {mockInspections
                .filter((i) => i.certificateUrl)
                .map((inspection) => (
                  <Card key={inspection.id} className="p-5 border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <Award className="w-6 h-6 text-green-600" />
                      </div>
                      {getResultBadge(inspection.result)}
                    </div>
                    <h3 className="font-semibold mb-1">{inspection.stage}</h3>
                    <div className="text-sm text-gray-600 mb-3">
                      Issued: {new Date(inspection.completedDate!).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500 mb-4">
                      Inspector: {inspection.inspector}
                    </div>
                    <div className="flex items-center gap-2 mb-4 text-xs">
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <Shield className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        <Lock className="w-3 h-3 mr-1" />
                        Secured
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 border-gray-300">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 border-gray-300">
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                    </div>
                  </Card>
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Booking Dialog */}
      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Schedule Inspection</DialogTitle>
            <DialogDescription>
              Book a certified inspector for your construction stage
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Stage Selection */}
            <div>
              <Label htmlFor="stage">Construction Stage *</Label>
              <Select value={selectedStage} onValueChange={setSelectedStage}>
                <SelectTrigger className="mt-2 border-gray-300">
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="foundation">Foundation</SelectItem>
                  <SelectItem value="structural">Structural Framework</SelectItem>
                  <SelectItem value="roofing">Roofing</SelectItem>
                  <SelectItem value="electrical">Electrical Rough-In</SelectItem>
                  <SelectItem value="plumbing">Plumbing</SelectItem>
                  <SelectItem value="final">Final Inspection</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Selection */}
            <div>
              <Label>Inspection Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full mt-2 justify-start text-left border-gray-300"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? selectedDate.toLocaleDateString() : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Inspector Selection */}
            <div>
              <Label>Select Inspector *</Label>
              <div className="mt-2 space-y-2">
                {mockInspectors.map((inspector) => (
                  <Card
                    key={inspector.id}
                    className={`p-4 border-2 cursor-pointer transition-all ${
                      selectedInspector === inspector.id
                        ? "border-black bg-gray-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedInspector(inspector.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold">{inspector.name}</h4>
                          <Badge variant="secondary" className="text-xs">
                            {inspector.specialty}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          {inspector.certifications.join(", ")}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-600">
                          <div className="flex items-center gap-1">
                            <span className="text-yellow-500">★</span>
                            <span>{inspector.rating}</span>
                          </div>
                          <div>{inspector.completedInspections} inspections</div>
                        </div>
                      </div>
                      <Checkbox
                        checked={selectedInspector === inspector.id}
                        className="mt-1"
                      />
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Special requirements or notes for the inspector..."
                className="mt-2 border-gray-300"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowBookingDialog(false)}
              className="border-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!selectedStage || !selectedDate || !selectedInspector) {
                  alert("Please fill all required fields");
                  return;
                }
                alert("Inspection scheduled successfully!");
                setShowBookingDialog(false);
              }}
              className="bg-black text-white hover:bg-gray-800"
            >
              Confirm Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Inspector Portal Dialog */}
      <Dialog open={showInspectorPortal} onOpenChange={setShowInspectorPortal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Inspector Portal</DialogTitle>
            <DialogDescription>
              Complete inspection checklist and submit results
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Inspection Info */}
            <Card className="p-4 bg-gray-50 border-gray-200">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-gray-600 mb-1">Stage</div>
                  <div className="font-semibold">Foundation Inspection</div>
                </div>
                <div>
                  <div className="text-gray-600 mb-1">Location</div>
                  <div className="font-semibold">Site A, Block 1</div>
                </div>
                <div>
                  <div className="text-gray-600 mb-1">Date</div>
                  <div className="font-semibold">{new Date().toLocaleDateString()}</div>
                </div>
              </div>
            </Card>

            {/* Geo-validation indicator */}
            <Card className="p-4 border-green-200 bg-green-50">
              <div className="flex items-center gap-3">
                <Locate className="w-5 h-5 text-green-600" />
                <div className="flex-1">
                  <div className="font-semibold text-green-900">
                    Location Verified
                  </div>
                  <div className="text-sm text-green-700">
                    GPS coordinates match project site: 40.7589° N, 73.9851° W
                  </div>
                </div>
                <Badge className="bg-green-600 text-white">
                  <MapPinned className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              </div>
            </Card>

            {/* Checklist */}
            <div>
              <h3 className="font-semibold mb-3">Inspection Checklist</h3>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {checklistItems.map((item) => (
                    <Card key={item.id} className="p-4 border-gray-200">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{item.item}</h4>
                            {item.required && (
                              <Badge variant="secondary" className="text-xs bg-red-100 text-red-800">
                                Required
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 mb-3">
                            {item.description}
                          </div>

                          {/* Status buttons */}
                          <div className="flex items-center gap-2 mb-3">
                            <Button
                              variant={item.status === "pass" ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleChecklistUpdate(item.id, "pass")}
                              className={
                                item.status === "pass"
                                  ? "bg-green-600 hover:bg-green-700 text-white"
                                  : "border-gray-300"
                              }
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Pass
                            </Button>
                            <Button
                              variant={item.status === "fail" ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleChecklistUpdate(item.id, "fail")}
                              className={
                                item.status === "fail"
                                  ? "bg-red-600 hover:bg-red-700 text-white"
                                  : "border-gray-300"
                              }
                            >
                              <X className="w-4 h-4 mr-1" />
                              Fail
                            </Button>
                            <Button
                              variant={item.status === "conditional" ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleChecklistUpdate(item.id, "conditional")}
                              className={
                                item.status === "conditional"
                                  ? "bg-orange-600 hover:bg-orange-700 text-white"
                                  : "border-gray-300"
                              }
                            >
                              <AlertTriangle className="w-4 h-4 mr-1" />
                              Conditional
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowPhotoUpload(true)}
                              className="border-gray-300"
                            >
                              <Camera className="w-4 h-4 mr-1" />
                              Photo
                            </Button>
                          </div>

                          {/* Notes input */}
                          {item.status !== "pending" && (
                            <Textarea
                              placeholder="Add notes for this item..."
                              className="text-sm border-gray-300"
                              rows={2}
                              value={item.notes || ""}
                              onChange={(e) =>
                                handleChecklistUpdate(item.id, item.status, e.target.value)
                              }
                            />
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Overall Result */}
            <div>
              <Label className="text-base font-semibold">Overall Inspection Result *</Label>
              <div className="flex gap-3 mt-3">
                <Button
                  variant={overallResult === "pass" ? "default" : "outline"}
                  onClick={() => setOverallResult("pass")}
                  className={
                    overallResult === "pass"
                      ? "flex-1 bg-green-600 hover:bg-green-700 text-white"
                      : "flex-1 border-gray-300"
                  }
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Pass
                </Button>
                <Button
                  variant={overallResult === "fail" ? "default" : "outline"}
                  onClick={() => setOverallResult("fail")}
                  className={
                    overallResult === "fail"
                      ? "flex-1 bg-red-600 hover:bg-red-700 text-white"
                      : "flex-1 border-gray-300"
                  }
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Fail
                </Button>
                <Button
                  variant={overallResult === "conditional" ? "default" : "outline"}
                  onClick={() => setOverallResult("conditional")}
                  className={
                    overallResult === "conditional"
                      ? "flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                      : "flex-1 border-gray-300"
                  }
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Conditional Pass
                </Button>
              </div>
            </div>

            {/* Stage blocking warning */}
            {overallResult === "conditional" || overallResult === "fail" && (
              <Card className="p-4 bg-red-50 border-red-200">
                <div className="flex items-start gap-3">
                  <Ban className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-red-900 mb-1">
                      Stage Will Be Blocked
                    </div>
                    <div className="text-sm text-red-700">
                      Work cannot proceed to the next stage until all issues are resolved and a
                      re-inspection passes.
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Final notes */}
            <div>
              <Label htmlFor="final-notes">Inspector Notes</Label>
              <Textarea
                id="final-notes"
                placeholder="Summary and recommendations..."
                className="mt-2 border-gray-300"
                rows={4}
                value={inspectionNotes}
                onChange={(e) => setInspectionNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowInspectorPortal(false)}
              className="border-gray-300"
            >
              Save Draft
            </Button>
            <Button
              onClick={handleCompleteInspection}
              className="bg-black text-white hover:bg-gray-800"
            >
              <FileCheck className="w-4 h-4 mr-2" />
              Complete & Generate Certificate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
