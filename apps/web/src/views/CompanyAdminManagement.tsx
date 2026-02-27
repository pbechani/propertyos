'use client';

import { useState } from "react";
import {
  Shield,
  UserPlus,
  Search,
  Crown,
  MoreVertical,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";

type Admin = {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  status: "active" | "suspended";
  isPrimary: boolean;
  addedBy: string;
  addedAt: string;
};

// Stub — replace with GET /api/v1/companies/:id/members?is_admin=true
const STUB_ADMINS: Admin[] = [
  { id: "1", userId: "u4", name: "Tom Williams (You)", email: "tom@eliteprops.co.ke", role: "admin", status: "active", isPrimary: true, addedBy: "System", addedAt: "2025-11-15T09:00:00Z" },
  { id: "2", userId: "u6", name: "Jane Kamau", email: "jane@eliteprops.co.ke", role: "admin", status: "active", isPrimary: false, addedBy: "Tom Williams", addedAt: "2025-12-20T09:00:00Z" },
];

export default function CompanyAdminManagement() {
  const [search, setSearch] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");

  const filtered = STUB_ADMINS.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl mb-2">Admin Management</h1>
          <p className="text-gray-600">Manage company administrators and their elevated privileges</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
        >
          <UserPlus className="w-5 h-5" />
          Add New Admin
        </button>
      </div>

      {/* Warning Banner */}
      <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-amber-900 font-medium mb-0.5">Administrator Privileges</p>
            <p className="text-sm text-amber-700">
              Company admins can manage all members, update company settings, submit for
              verification, and create new admins. At least one admin must remain at all times.
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        <StatsCard label="Total Admins" value={STUB_ADMINS.length} icon={Shield} color="bg-purple-100 text-purple-600" />
        <StatsCard label="Active Admins" value={STUB_ADMINS.filter((a) => a.status === "active").length} icon={CheckCircle} color="bg-green-100 text-green-600" />
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Primary Admin</p>
              <p className="text-base font-medium truncate">{STUB_ADMINS.find((a) => a.isPrimary)?.name ?? "—"}</p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-indigo-100">
              <Crown className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search admins…"
            className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-sm text-gray-600">Administrator</th>
              <th className="px-6 py-4 text-left text-sm text-gray-600">Status</th>
              <th className="px-6 py-4 text-left text-sm text-gray-600">Type</th>
              <th className="px-6 py-4 text-left text-sm text-gray-600">Added On</th>
              <th className="px-6 py-4 text-left text-sm text-gray-600">Added By</th>
              <th className="px-6 py-4 text-right text-sm text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((admin) => (
              <tr key={admin.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-full flex-shrink-0">
                      {admin.isPrimary ? (
                        <Crown className="w-5 h-5 text-purple-600" />
                      ) : (
                        <span className="text-sm text-purple-600">
                          {admin.name.split(" ").map((n) => n[0]).join("")}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{admin.name}</p>
                      <p className="text-xs text-gray-500">{admin.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {admin.status === "active" ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-green-600">
                      <CheckCircle className="w-4 h-4" /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs text-amber-600">
                      <Clock className="w-4 h-4" /> Suspended
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {admin.isPrimary ? (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full">
                      <Crown className="w-3 h-3" /> Primary
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                      Admin
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {new Date(admin.addedAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{admin.addedBy}</td>
                <td className="px-6 py-4 text-right">
                  <button
                    disabled={admin.isPrimary}
                    className="p-2 hover:bg-gray-100 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed"
                    title={admin.isPrimary ? "Cannot modify primary admin" : "Actions"}
                  >
                    <MoreVertical className="w-5 h-5 text-gray-500" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Min-admin safeguard notice */}
      <p className="text-xs text-gray-500 mt-4 flex items-center gap-1">
        <AlertCircle className="w-3.5 h-3.5" />
        The company must always retain at least one active admin. Removing the last admin is not
        permitted.
      </p>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-xl mb-4">Promote Member to Admin</h3>
            <p className="text-sm text-gray-600 mb-4">
              Enter the email of an existing company member to grant them admin privileges.
            </p>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="member@company.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none mb-4 text-sm"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  // POST /api/v1/companies/:id/members/:memberId/promote-admin
                  setShowInviteModal(false);
                  setInviteEmail("");
                }}
                className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm"
              >
                Promote to Admin
              </button>
              <button
                onClick={() => setShowInviteModal(false)}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
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

function StatsCard({
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
    <div className="bg-white rounded-xl border border-gray-200 p-6">
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
