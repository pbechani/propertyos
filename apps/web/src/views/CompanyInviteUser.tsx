'use client';

import { useState } from "react";
import { Link } from "@/lib/router-compat";
import { UserPlus, Mail, ArrowLeft, Send, CheckCircle, Shield } from "lucide-react";

type Permission = { id: string; name: string; description: string; category: string };

// Permissions matrix for agent role (adapted to PRIBEC resources)
// In production, load from GET /api/v1/roles/:role/permissions
const AGENT_PERMISSIONS: Permission[] = [
  { id: "property.create", name: "Create Listing", description: "Create new property listings", category: "Property" },
  { id: "property.update", name: "Update Listing", description: "Edit existing property listings", category: "Property" },
  { id: "property.delete", name: "Delete Listing", description: "Remove property listings", category: "Property" },
  { id: "property.read", name: "View Listings", description: "View all company listings", category: "Property" },
  { id: "inquiry.read", name: "View Inquiries", description: "Read buyer inquiries", category: "Inquiries" },
  { id: "inquiry.respond", name: "Respond to Inquiries", description: "Reply to buyer inquiries", category: "Inquiries" },
  { id: "sales.read", name: "View Sales Pipeline", description: "View purchase stage progress", category: "Sales" },
  { id: "sales.update", name: "Update Sales Stage", description: "Progress purchase stages", category: "Sales" },
];

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  agent: AGENT_PERMISSIONS,
  contractor: [
    { id: "project.read", name: "View Projects", description: "View construction projects", category: "Projects" },
    { id: "project.update", name: "Update Projects", description: "Update project progress", category: "Projects" },
    { id: "milestone.submit", name: "Submit Milestones", description: "Submit milestone completions", category: "Milestones" },
    { id: "bid.create", name: "Submit Bids", description: "Submit bids on projects", category: "Bidding" },
  ],
  supplier: [
    { id: "catalog.manage", name: "Manage Catalogue", description: "Add/update product listings", category: "Catalogue" },
    { id: "rfq.respond", name: "Respond to RFQs", description: "Submit quotes for RFQs", category: "Quotes" },
    { id: "order.manage", name: "Manage Orders", description: "Process and track orders", category: "Orders" },
  ],
};

const ALLOWED_ROLES: Record<string, string[]> = {
  agent: ["agent"],
  contractor: ["contractor"],
  supplier: ["supplier"],
  conveyancer: ["conveyancer"],
  inspector: ["inspector"],
  logistics: ["truck_operator"],
  developing: ["buyer_seller", "contractor", "agent"],
};

// Stub: current company category
const COMPANY_CATEGORY = "agent";

function groupBy<T>(arr: T[], key: (item: T) => string): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const k = key(item);
    (acc[k] = acc[k] || []).push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

export default function CompanyInviteUser() {
  const [formData, setFormData] = useState({
    email: "",
    role: "",
    isAdmin: false,
    selectedPermissions: [] as string[],
  });
  const [isSent, setIsSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const allowedRoles = ALLOWED_ROLES[COMPANY_CATEGORY] ?? [];
  const rolePermissions = formData.role ? (ROLE_PERMISSIONS[formData.role] ?? []) : [];
  const grouped = groupBy(rolePermissions, (p) => p.category);

  const togglePermission = (id: string) =>
    setFormData((prev) => ({
      ...prev,
      selectedPermissions: prev.selectedPermissions.includes(id)
        ? prev.selectedPermissions.filter((x) => x !== id)
        : [...prev.selectedPermissions, id],
    }));

  const toggleAll = (category: string) => {
    const ids = (grouped[category] ?? []).map((p) => p.id);
    const allSelected = ids.every((id) => formData.selectedPermissions.includes(id));
    setFormData((prev) => ({
      ...prev,
      selectedPermissions: allSelected
        ? prev.selectedPermissions.filter((id) => !ids.includes(id))
        : [...new Set([...prev.selectedPermissions, ...ids])],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // POST /api/v1/companies/:id/members/invite
      // { email, role, is_admin, permissions: selectedPermissions.map(id => ({resource, action})) }
      setIsSent(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSent) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <Send className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl mb-2">Invitation Sent!</h2>
          <p className="text-gray-600 mb-6">
            An invitation email has been sent to <strong>{formData.email}</strong>. The link will
            expire in 72 hours.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { setIsSent(false); setFormData({ email: "", role: "", isAdmin: false, selectedPermissions: [] }); }}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm"
            >
              Invite Another
            </button>
            <Link
              to="/company/users"
              className="px-5 py-2.5 border border-gray-300 rounded-lg hover:border-gray-400 transition text-sm"
            >
              Back to Users
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          to="/company/users"
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-3xl mb-1">Invite Team Member</h1>
          <p className="text-gray-600">Send an invitation email with a role and permissions</p>
        </div>
      </div>

      <div className="max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg mb-5 flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Invitation Details
            </h2>

            <div className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm mb-2 text-gray-700">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="member@company.com"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  An invitation link valid for 72 hours will be sent to this address.
                </p>
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm mb-2 text-gray-700">Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, role: e.target.value, selectedPermissions: [] }))
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                >
                  <option value="">Select a role</option>
                  {allowedRoles.map((r) => (
                    <option key={r} value={r}>
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Admin Toggle */}
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <input
                  type="checkbox"
                  id="isAdmin"
                  checked={formData.isAdmin}
                  onChange={(e) => setFormData((p) => ({ ...p, isAdmin: e.target.checked }))}
                  className="mt-1 w-4 h-4 text-indigo-600"
                />
                <label htmlFor="isAdmin" className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Shield className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-medium text-amber-900">Grant Admin Privileges</span>
                  </div>
                  <p className="text-xs text-amber-700">
                    Admins can manage users, update company settings, and create other admins. Use
                    with caution.
                  </p>
                </label>
              </div>
            </div>
          </div>

          {/* Permissions */}
          {formData.role && rolePermissions.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Assign Permissions
                </h2>
                <span className="text-sm text-gray-500">
                  {formData.selectedPermissions.length} / {rolePermissions.length} selected
                </span>
              </div>

              <div className="space-y-5">
                {Object.entries(grouped).map(([category, perms]) => {
                  const allSelected = perms.every((p) =>
                    formData.selectedPermissions.includes(p.id)
                  );
                  return (
                    <div key={category}>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-700">{category}</h3>
                        <button
                          type="button"
                          onClick={() => toggleAll(category)}
                          className="text-xs text-indigo-600 hover:underline"
                        >
                          {allSelected ? "Deselect all" : "Select all"}
                        </button>
                      </div>
                      <div className="space-y-2">
                        {perms.map((perm) => {
                          const has = formData.selectedPermissions.includes(perm.id);
                          return (
                            <label
                              key={perm.id}
                              className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition ${
                                has
                                  ? "border-indigo-200 bg-indigo-50"
                                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                              }`}
                            >
                              <div className="relative mt-0.5">
                                <input
                                  type="checkbox"
                                  checked={has}
                                  onChange={() => togglePermission(perm.id)}
                                  className="w-4 h-4 text-indigo-600"
                                />
                                {has && (
                                  <CheckCircle className="absolute -top-1 -right-1 w-3 h-3 text-indigo-600 bg-white rounded-full" />
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-medium">{perm.name}</p>
                                <p className="text-xs text-gray-500">{perm.description}</p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isLoading || !formData.email || !formData.role}
              className={`flex-1 py-3 rounded-lg transition flex items-center justify-center gap-2 ${
                !isLoading && formData.email && formData.role
                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              <Send className="w-5 h-5" />
              {isLoading ? "Sending…" : "Send Invitation"}
            </button>
            <Link
              to="/company/users"
              className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:border-gray-400 transition flex items-center gap-2 text-sm text-gray-700"
            >
              <ArrowLeft className="w-4 h-4" />
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
