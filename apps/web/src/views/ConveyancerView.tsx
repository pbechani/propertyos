'use client';

import { useEffect, useState } from "react";
import { Link } from "@/lib/router-compat";
import {
  FileText, Clock, CheckCircle2, AlertCircle, Building,
  Search, Filter, Eye, ExternalLink, RefreshCw,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { conveyancerApi, type ConveyancerCase } from "@/lib/api-client";
import { getAccessToken } from "@/lib/auth-session";

export default function ConveyancerView() {
  const [selectedFilter, setSelectedFilter] = useState<"all" | "active" | "completed" | "disputed">("all");
  const [activeCases, setActiveCases] = useState<ConveyancerCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token = getAccessToken();

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    conveyancerApi
      .getCases(token)
      .then(result => setActiveCases(result.data))
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Failed to load cases")
      )
      .finally(() => setLoading(false));
  }, [token]);

  const governmentApplications = [
    {
      id: 1,
      case: "88 Sunset Boulevard",
      application: "Title Deed Search",
      status: "completed",
      submittedDate: "2024-02-10",
      completedDate: "2024-02-15",
      turnaroundDays: 5,
      reference: "TDS-2024-001234",
    },
    {
      id: 2,
      case: "88 Sunset Boulevard",
      application: "Rates Clearance Certificate",
      status: "in-progress",
      submittedDate: "2024-03-15",
      estimatedCompletion: "2024-03-25",
      turnaroundDays: 7,
      reference: "RCC-2024-005678",
    },
    {
      id: 3,
      case: "204 Sky View",
      application: "Transfer Duty Calculation",
      status: "completed",
      submittedDate: "2024-03-10",
      completedDate: "2024-03-12",
      turnaroundDays: 2,
      reference: "TDC-2024-003456",
    },
    {
      id: 4,
      case: "15 Ocean Drive",
      application: "Deeds Office Lodgement",
      status: "pending",
      submittedDate: "2024-03-20",
      estimatedCompletion: "2024-04-05",
      turnaroundDays: 0,
      reference: "DOL-2024-007890",
    },
  ];

  const filteredCases = activeCases.filter(c =>
    selectedFilter === "all" || c.status === selectedFilter
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":  return "bg-green-100 text-green-700";
      case "active":     return "bg-blue-100 text-blue-700";
      case "in-progress": return "bg-blue-100 text-blue-700";
      case "disputed":   return "bg-red-100 text-red-700";
      case "cancelled":  return "bg-gray-200 text-gray-600";
      case "pending":    return "bg-yellow-100 text-yellow-700";
      default:           return "bg-gray-100 text-gray-700";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-700";
      case "medium": return "bg-yellow-100 text-yellow-700";
      case "low": return "bg-green-100 text-green-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-8 py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1">Conveyancer Dashboard</h1>
            <p className="text-gray-600">Cape Legal Services - Adv. Maria Santos</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              Reports
            </Button>
            <Button className="bg-blue-500 hover:bg-blue-600">
              <Building className="w-4 h-4 mr-2" />
              New Case
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-sm text-gray-600 mb-1">Active Cases</div>
            <div className="text-2xl font-bold">{activeCases.filter(c => c.status === "active").length}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-600 mb-1">Completed</div>
            <div className="text-2xl font-bold text-green-600">{activeCases.filter(c => c.status === "completed").length}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-600 mb-1">Disputed</div>
            <div className="text-2xl font-bold text-red-600">{activeCases.filter(c => c.status === "disputed").length}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-gray-600 mb-1">Total Cases</div>
            <div className="text-2xl font-bold text-purple-600">{activeCases.length}</div>
          </Card>
        </div>
      </div>

      <div className="p-4 md:p-8 space-y-8">
        {/* Active Cases */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-xl font-bold">Active Cases</h2>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 border border-gray-300 rounded-lg p-1">
                {[
                  { id: "all", label: "All" },
                  { id: "active", label: "Active" },
                  { id: "completed", label: "Completed" },
                  { id: "disputed", label: "Disputed" },
                ].map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setSelectedFilter(filter.id as "all" | "active" | "completed" | "disputed")}
                    className={`
                      px-3 py-1.5 rounded text-sm font-medium transition-colors
                      ${selectedFilter === filter.id 
                        ? "bg-blue-100 text-blue-600" 
                        : "text-gray-600 hover:bg-gray-100"
                      }
                    `}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {loading ? (
              <div className="col-span-2 flex items-center justify-center py-20">
                <RefreshCw className="w-6 h-6 animate-spin text-gray-400 mr-3" />
                <span className="text-gray-500">Loading cases…</span>
              </div>
            ) : error ? (
              <div className="col-span-2 text-center py-10 text-red-600">{error}</div>
            ) : filteredCases.length === 0 ? (
              <div className="col-span-2 text-center py-10 text-gray-500">No cases found.</div>
            ) : null}
            {!loading && !error && filteredCases.map((case_) => (
              <Card key={case_.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold mb-1 truncate">{case_.property_address}</h3>
                    <div className="text-sm text-gray-600 mb-2">
                      {case_.buyer_name} → {case_.seller_name}
                    </div>
                    <div className="font-bold text-blue-600">
                      {case_.currency} {Number(case_.agreed_price).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={getPriorityColor(case_.priority)}>
                      {case_.priority.toUpperCase()}
                    </Badge>
                    <Badge className={getStatusColor(case_.status)}>
                      {case_.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium">{case_.progress_pct}%</span>
                  </div>
                  <Progress value={case_.progress_pct} className="h-2 bg-gray-200" />
                </div>

                <div className="p-3 bg-gray-50 rounded-lg mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Current Stage:</span>
                    <span className="font-medium">Stage {case_.current_stage}/14</span>
                  </div>
                  <div className="font-medium mb-1">{case_.case_type}</div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Clock className="w-3 h-3" />
                    {case_.days_active} days open
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1" size="sm" asChild>
                    <Link to={`/workspace/${case_.id}`}>
                      <Eye className="w-4 h-4 mr-2" />
                      View Workspace
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm">
                    <FileText className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Government Applications Tracker */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Government Application Tracker</h2>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search reference..."
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <Button variant="outline" size="sm">
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Case</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Application Type</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Reference</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Submitted</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Timeline</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {governmentApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="font-medium text-sm truncate max-w-xs">{app.case}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm">{app.application}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-mono text-gray-600">{app.reference}</div>
                    </td>
                    <td className="px-4 py-4">
                      <Badge className={getStatusColor(app.status)}>
                        {app.status === "in-progress" ? (
                          <>
                            <Clock className="w-3 h-3 mr-1" />
                            IN PROGRESS
                          </>
                        ) : app.status === "completed" ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            COMPLETED
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3 h-3 mr-1" />
                            PENDING
                          </>
                        )}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm">{app.submittedDate}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm">
                        {app.completedDate ? (
                          <span className="text-green-600 font-medium">
                            Completed in {app.turnaroundDays} days
                          </span>
                        ) : app.estimatedCompletion ? (
                          <span className="text-gray-600">
                            Est: {app.estimatedCompletion}
                          </span>
                        ) : (
                          <span className="text-yellow-600">Awaiting submission</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {governmentApplications.filter((a: { status: string }) => a.status === "completed").length}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {governmentApplications.filter(a => a.status === "in-progress").length}
              </div>
              <div className="text-sm text-gray-600">In Progress</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {governmentApplications.filter(a => a.status === "pending").length}
              </div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(governmentApplications.reduce((acc, app) => acc + app.turnaroundDays, 0) / governmentApplications.length)} days
              </div>
              <div className="text-sm text-gray-600">Avg Turnaround</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
