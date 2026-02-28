'use client';

import { useState, useEffect } from "react";
import {
  UserX,
  AlertTriangle,
  Send,
  CheckCircle,
  Users,
  MoreHorizontal,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "@/lib/router-compat";
import { getActiveCompanyContext } from "@/lib/auth-session";

type OrphanedTask = {
  id: string;
  taskType: string;
  resourceType: string;
  resourceId: string;
  description: string;
  requiresNotification: boolean;
  status: "unassigned" | "assigned" | "closed";
  assignedTo?: string;
  notificationParties: string[];
};

type RevokedMember = {
  userId: string;
  userName: string;
  role: string;
  revokedAt: string;
  reason?: string;
  tasks: OrphanedTask[];
  requiresNotification: boolean;
  affectedParties: string[];
};

type ActiveMember = { id: string; name: string };

// Stub — replace with GET /api/v1/companies/:id/orphaned-tasks
const STUB_REVOKED: RevokedMember[] = [
  {
    userId: "u7",
    userName: "James Mwangi",
    role: "agent",
    revokedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    reason: "Misconduct — property listing fraud",
    requiresNotification: true,
    affectedParties: ["Buyer: Alice Otieno (alice@mail.com)", "Seller: Patrick Wanjiku"],
    tasks: [
      { id: "t1", taskType: "property_listing", resourceType: "property.listing", resourceId: "prop-001", description: "Active listing: Westlands 3BR apartment", requiresNotification: true, status: "unassigned", notificationParties: ["Buyer: Alice Otieno"] },
      { id: "t2", taskType: "inquiry", resourceType: "property.inquiry", resourceId: "inq-007", description: "Open buyer inquiry from David Kariuki", requiresNotification: false, status: "unassigned", notificationParties: [] },
    ],
  },
  {
    userId: "u8",
    userName: "Grace Njeri",
    role: "agent",
    revokedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    reason: "Resigned",
    requiresNotification: false,
    affectedParties: [],
    tasks: [
      { id: "t3", taskType: "property_listing", resourceType: "property.listing", resourceId: "prop-004", description: "Active listing: Karen 4BR townhouse", requiresNotification: false, status: "assigned", assignedTo: "Sarah Johnson", notificationParties: [] },
    ],
  },
];

const STUB_ACTIVE_MEMBERS: ActiveMember[] = [
  { id: "u1", name: "Sarah Johnson" },
  { id: "u2", name: "Mike Chen" },
  { id: "u4", name: "Tom Williams" },
];

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

export default function CompanyRevokedPool() {
  const navigate = useNavigate();
  const activeCompany = getActiveCompanyContext();

  useEffect(() => {
    if (!activeCompany || activeCompany.slug === 'self') {
      navigate('/app/my-dashboard');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const companyName = activeCompany?.name ?? 'Company';

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [assignModalTask, setAssignModalTask] = useState<OrphanedTask | null>(null);
  const [selectedAssignee, setSelectedAssignee] = useState("");

  const allTasks = STUB_REVOKED.flatMap((r) => r.tasks);
  const totalPending = allTasks.filter((t) => t.status !== "closed").length;
  const notificationPending = STUB_REVOKED.filter((r) => r.requiresNotification).length;

  const selected = STUB_REVOKED.find((r) => r.userId === selectedUserId);

  const handleAssign = () => {
    // PATCH /api/v1/companies/:id/orphaned-tasks/:taskId/assign { assignee_id }
    setAssignModalTask(null);
    setSelectedAssignee("");
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Revoked Member Pool</h1>
        <p className="text-gray-600">
          {companyName} · Manage open tasks from members whose access has been revoked
        </p>
      </div>

      {/* Alert */}
      {STUB_REVOKED.some((r) => r.requiresNotification) && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-red-900 font-medium mb-0.5">Attention Required</p>
              <p className="text-sm text-red-700">
                Some revoked members had open tasks involving third parties who need to be notified.
                Review and act promptly.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        <StatCard label="Revoked Members" value={STUB_REVOKED.length} icon={UserX} color="bg-red-100 text-red-600" />
        <StatCard label="Pending Tasks" value={totalPending} icon={AlertTriangle} color="bg-amber-100 text-amber-600" />
        <StatCard label="Notifications Needed" value={notificationPending} icon={Send} color="bg-blue-100 text-blue-600" />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Revoked Members List */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-base font-medium mb-4">Revoked Members</h2>
          <div className="space-y-3">
            {STUB_REVOKED.map((r) => {
              const isSelected = selectedUserId === r.userId;
              const pending = r.tasks.filter((t) => t.status !== "closed").length;
              return (
                <button
                  key={r.userId}
                  onClick={() => setSelectedUserId(r.userId)}
                  className={`w-full p-4 rounded-lg text-left transition border-2 ${
                    isSelected ? "border-red-500 bg-red-50" : "border-transparent hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-full flex-shrink-0 mt-0.5">
                      <UserX className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{r.userName}</p>
                      <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full capitalize">
                        {r.role}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        Revoked: {timeAgo(r.revokedAt)}
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {pending} task{pending !== 1 ? "s" : ""} pending
                      </p>
                      {r.requiresNotification && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-amber-600">
                          <AlertTriangle className="w-3 h-3" />
                          Notification required
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detail Panel */}
        <div className="col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          {selected ? (
            <>
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 className="text-xl mb-0.5">{selected.userName}</h2>
                  <p className="text-sm text-gray-600">
                    Access revoked {timeAgo(selected.revokedAt)} ·{" "}
                    {selected.reason && (
                      <span className="text-gray-500">Reason: {selected.reason}</span>
                    )}
                  </p>
                </div>
                <span className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm">
                  Revoked
                </span>
              </div>

              {/* Notification Banner */}
              {selected.requiresNotification && selected.affectedParties.length > 0 && (
                <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-amber-900 font-medium mb-2">Parties Requiring Notification</p>
                      <ul className="space-y-1 mb-3">
                        {selected.affectedParties.map((party, i) => (
                          <li key={i} className="text-sm text-amber-800 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-amber-600 rounded-full flex-shrink-0" />
                            {party}
                          </li>
                        ))}
                      </ul>
                      <button className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition flex items-center gap-2 text-sm">
                        <Send className="w-4 h-4" />
                        Send Notifications
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tasks */}
              <h3 className="text-base font-semibold mb-3">
                Open Tasks ({selected.tasks.filter((t) => t.status !== "closed").length})
              </h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {selected.tasks.map((task) => (
                  <div key={task.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium mb-0.5">{task.description}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                            {task.taskType.replace(/_/g, " ")}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded ${
                              task.status === "assigned"
                                ? "bg-green-100 text-green-700"
                                : task.status === "closed"
                                ? "bg-gray-100 text-gray-600"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {task.status}
                          </span>
                        </div>
                        {task.assignedTo && (
                          <p className="text-xs text-gray-500 mt-1">
                            Assigned to: {task.assignedTo}
                          </p>
                        )}
                      </div>
                    </div>
                    {task.status !== "closed" && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => setAssignModalTask(task)}
                          className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-xs flex items-center justify-center gap-1"
                        >
                          <Users className="w-3 h-3" />
                          {task.status === "assigned" ? "Reassign" : "Assign"}
                        </button>
                        <button className="flex-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-xs flex items-center justify-center gap-1">
                          <ChevronRight className="w-3 h-3" />
                          View
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Resolve All */}
              <div className="flex gap-3 pt-4 border-t border-gray-200 mt-4">
                <button className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2 text-sm">
                  <CheckCircle className="w-5 h-5" />
                  Close All Tasks
                </button>
                <button className="px-4 py-3 border-2 border-gray-300 rounded-lg hover:border-gray-400 transition text-sm">
                  Export Report
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
              <UserX className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg text-gray-600 mb-2">Select a Revoked Member</h3>
              <p className="text-sm text-gray-500">
                Choose a member from the list to view their pending tasks
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Assign Modal */}
      {assignModalTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Assign Task</h3>
            <p className="text-sm text-gray-600 mb-4">{assignModalTask.description}</p>
            <label className="block text-sm mb-2 text-gray-700">Assign to *</label>
            <select
              value={selectedAssignee}
              onChange={(e) => setSelectedAssignee(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none mb-4 text-sm"
            >
              <option value="">Select a member…</option>
              {STUB_ACTIVE_MEMBERS.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <div className="flex gap-3">
              <button
                onClick={handleAssign}
                disabled={!selectedAssignee}
                className={`flex-1 py-2.5 rounded-lg text-sm transition ${
                  selectedAssignee
                    ? "bg-indigo-600 text-white hover:bg-indigo-700"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                Assign
              </button>
              <button
                onClick={() => { setAssignModalTask(null); setSelectedAssignee(""); }}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{label}</p>
          <p className="text-3xl">{value}</p>
        </div>
        <div className={`flex items-center justify-center w-12 h-12 rounded-lg ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
