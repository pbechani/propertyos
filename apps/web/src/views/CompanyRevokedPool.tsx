'use client';

import { useState, useEffect, useCallback } from "react";
import {
  UserX,
  AlertTriangle,
  Send,
  CheckCircle,
  Users,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useNavigate } from "@/lib/router-compat";
import { getActiveCompanyContext, getAccessToken } from "@/lib/auth-session";
import {
  companiesApi,
  orphanedTasksApi,
  type CompanyMember,
  type OrphanedTaskEntry,
} from "@/lib/api-client";

type ActiveMember = { id: string; name: string };

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

  const [allMembers, setAllMembers] = useState<CompanyMember[]>([]);
  const [tasks, setTasks] = useState<OrphanedTaskEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [assignModalTask, setAssignModalTask] = useState<OrphanedTaskEntry | null>(null);
  const [selectedAssignee, setSelectedAssignee] = useState("");
  const [assigning, setAssigning] = useState(false);

  const fetchData = useCallback(() => {
    if (!activeCompany || activeCompany.slug === 'self') {
      navigate('/app/my-dashboard');
      return;
    }
    const token = getAccessToken();
    if (!token) { navigate('/login'); return; }

    setLoading(true);
    Promise.all([
      companiesApi.listMembers(token, activeCompany.id),
      orphanedTasksApi.list(token, activeCompany.id),
    ])
      .then(([members, orphaned]) => {
        setAllMembers(members);
        setTasks(orphaned);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load data'))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchData(); }, [fetchData]);

  const companyName = activeCompany?.name ?? 'Company';

  const revokedMembers = allMembers.filter((m) => m.status === 'revoked');
  const activeMembers: ActiveMember[] = allMembers
    .filter((m) => m.status === 'active')
    .map((m) => ({
      id: m.user_id,
      name: [m.first_name, m.last_name].filter(Boolean).join(' ') || m.email,
    }));

  // Derive per-revoked-member view
  type RevokedItem = {
    userId: string;
    userName: string;
    role: string;
    revokedAt: string;
    tasks: OrphanedTaskEntry[];
    requiresNotification: boolean;
  };

  const revokedItems: RevokedItem[] = revokedMembers.map((m) => {
    const memberTasks = tasks.filter((t) => t.original_user_id === m.user_id);
    return {
      userId: m.user_id,
      userName: [m.first_name, m.last_name].filter(Boolean).join(' ') || m.email,
      role: m.role,
      revokedAt: m.updated_at,
      tasks: memberTasks,
      requiresNotification: memberTasks.some((t) => t.requires_notification && t.status !== 'closed'),
    };
  });

  const totalPending = tasks.filter((t) => t.status !== 'closed').length;
  const notificationPending = revokedItems.filter((r) => r.requiresNotification).length;
  const selected = revokedItems.find((r) => r.userId === selectedUserId);

  const token = getAccessToken();

  const handleAssign = async () => {
    if (!assignModalTask || !selectedAssignee || !token || !activeCompany) return;
    setAssigning(true);
    try {
      await orphanedTasksApi.assign(token, activeCompany.id, assignModalTask.id, selectedAssignee);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === assignModalTask.id
            ? { ...t, status: 'assigned', assignee_id: selectedAssignee,
                assignee_email: activeMembers.find((m) => m.id === selectedAssignee)?.name ?? null }
            : t,
        ),
      );
    } catch { /* silently ignore; could show toast */ }
    finally {
      setAssigning(false);
      setAssignModalTask(null);
      setSelectedAssignee('');
    }
  };

  const handleCloseTask = async (taskId: string) => {
    if (!token || !activeCompany) return;
    try {
      await orphanedTasksApi.close(token, activeCompany.id, taskId);
      setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: 'closed' } : t));
    } catch { /* silently ignore */ }
  };

  const handleCloseAll = async () => {
    if (!selected || !token || !activeCompany) return;
    const open = selected.tasks.filter((t) => t.status !== 'closed');
    for (const task of open) {
      await handleCloseTask(task.id);
    }
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

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      )}
      {!loading && error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-6">
          {error}
        </div>
      )}
      {!loading && !error && (<>

      {/* Alert */}
      {revokedItems.some((r) => r.requiresNotification) && (
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
        <StatCard label="Revoked Members" value={revokedItems.length} icon={UserX} color="bg-red-100 text-red-600" />
        <StatCard label="Pending Tasks" value={totalPending} icon={AlertTriangle} color="bg-amber-100 text-amber-600" />
        <StatCard label="Notifications Needed" value={notificationPending} icon={Send} color="bg-blue-100 text-blue-600" />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Revoked Members List */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-base font-medium mb-4">Revoked Members</h2>
          <div className="space-y-3">
            {revokedItems.map((r) => {
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
                    Access revoked {timeAgo(selected.revokedAt)}
                  </p>
                </div>
                <span className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm">
                  Revoked
                </span>
              </div>

              {/* Notification Banner */}
              {selected.requiresNotification && (
                <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-amber-900 font-medium mb-1">Notification Required</p>
                      <p className="text-sm text-amber-800">
                        This member had open tasks that may involve third parties. Review each task and notify affected parties as needed.
                      </p>
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
                        <p className="text-sm font-medium mb-0.5">{task.description ?? task.resource_type}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                            {task.resource_type.replace(/_/g, " ")}
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
                        {task.assignee_email && (
                          <p className="text-xs text-gray-500 mt-1">
                            Assigned to: {task.assignee_email}
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
                <button onClick={handleCloseAll} className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2 text-sm">
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

      </>)}
      {/* Assign Modal */}
      {assignModalTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Assign Task</h3>
            <p className="text-sm text-gray-600 mb-4">{assignModalTask.description ?? assignModalTask.resource_type}</p>
            <label className="block text-sm mb-2 text-gray-700">Assign to *</label>
            <select
              value={selectedAssignee}
              onChange={(e) => setSelectedAssignee(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none mb-4 text-sm"
            >
              <option value="">Select a member…</option>
              {activeMembers.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <div className="flex gap-3">
              <button
                onClick={() => void handleAssign()}
                disabled={!selectedAssignee || assigning}
                className={`flex-1 py-2.5 rounded-lg text-sm transition ${
                  selectedAssignee && !assigning
                    ? "bg-indigo-600 text-white hover:bg-indigo-700"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                {assigning ? 'Assigning…' : 'Assign'}
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
