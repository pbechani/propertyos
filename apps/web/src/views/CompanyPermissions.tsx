'use client';

import { useState } from "react";
import { Settings, Search, Save, CheckCircle } from "lucide-react";

type Permission = { id: string; name: string; description: string; category: string };
type Member = { id: string; userId: string; name: string; email: string; role: string };

// Stub — replace with GET /api/v1/companies/:id/members (active) and member permissions
const STUB_MEMBERS: Member[] = [
  { id: "m1", userId: "u1", name: "Sarah Johnson", email: "sarah@eliteprops.co.ke", role: "agent" },
  { id: "m2", userId: "u2", name: "Mike Chen", email: "mike@eliteprops.co.ke", role: "agent" },
  { id: "m3", userId: "u3", name: "Lisa Patel", email: "lisa@eliteprops.co.ke", role: "agent" },
];

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  agent: [
    { id: "property.create", name: "Create Listing", description: "Create new property listings", category: "Property" },
    { id: "property.update", name: "Update Listing", description: "Edit property listings", category: "Property" },
    { id: "property.delete", name: "Delete Listing", description: "Remove listings", category: "Property" },
    { id: "property.read", name: "View Listings", description: "View all company listings", category: "Property" },
    { id: "inquiry.read", name: "View Inquiries", description: "Read buyer inquiries", category: "Inquiries" },
    { id: "inquiry.respond", name: "Respond to Inquiries", description: "Reply to buyer inquiries", category: "Inquiries" },
    { id: "sales.read", name: "View Sales Pipeline", description: "View purchase stage progress", category: "Sales" },
    { id: "sales.update", name: "Update Sales Stage", description: "Progress purchase stages", category: "Sales" },
  ],
};

// Pre-set permissions per member
const STUB_MEMBER_PERMISSIONS: Record<string, string[]> = {
  u1: ["property.create", "property.update", "property.read", "inquiry.read", "inquiry.respond"],
  u2: ["property.read", "inquiry.read"],
  u3: ["property.create", "property.read"],
};

function groupBy<T>(arr: T[], key: (item: T) => string): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const k = key(item);
    (acc[k] = acc[k] || []).push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("");
}

export default function CompanyPermissions() {
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [memberPerms, setMemberPerms] = useState<Record<string, string[]>>(STUB_MEMBER_PERMISSIONS);
  const [search, setSearch] = useState("");
  const [saved, setSaved] = useState(false);

  const selectedMember = STUB_MEMBERS.find((m) => m.userId === selectedMemberId);
  const allPerms = selectedMember ? (ROLE_PERMISSIONS[selectedMember.role] ?? []) : [];
  const grouped = groupBy(allPerms, (p) => p.category);
  const currentPerms = (selectedMemberId && memberPerms[selectedMemberId]) ?? [];

  const toggle = (id: string) => {
    if (!selectedMemberId) return;
    setMemberPerms((prev) => ({
      ...prev,
      [selectedMemberId]: prev[selectedMemberId]?.includes(id)
        ? prev[selectedMemberId].filter((x) => x !== id)
        : [...(prev[selectedMemberId] ?? []), id],
    }));
    setSaved(false);
  };

  const handleSave = () => {
    // PATCH /api/v1/companies/:id/members/:memberId/permissions
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const filteredMembers = STUB_MEMBERS.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Permission Management</h1>
        <p className="text-gray-600">Configure fine-grained permissions for each team member</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Member List */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-base font-medium mb-4">Active Members</h2>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search members…"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {filteredMembers.map((m) => {
              const isSelected = selectedMemberId === m.userId;
              const permCount = memberPerms[m.userId]?.length ?? 0;
              const totalPerms = (ROLE_PERMISSIONS[m.role] ?? []).length;
              return (
                <button
                  key={m.userId}
                  onClick={() => { setSelectedMemberId(m.userId); setSaved(false); }}
                  className={`w-full p-3 rounded-lg text-left transition border-2 ${
                    isSelected
                      ? "border-indigo-600 bg-indigo-50"
                      : "border-transparent hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-indigo-100 rounded-full flex-shrink-0">
                      <span className="text-sm text-indigo-600">{initials(m.name)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{m.name}</p>
                      <p className="text-xs text-gray-500 truncate">{m.email}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {permCount}/{totalPerms} permissions
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Permissions Panel */}
        <div className="col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          {selectedMember ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Settings className="w-6 h-6 text-indigo-600" />
                  <div>
                    <h2 className="text-lg">Configure Permissions</h2>
                    <p className="text-sm text-gray-600">
                      {selectedMember.name} —{" "}
                      <span className="capitalize">{selectedMember.role}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleSave}
                  className={`px-4 py-2 rounded-lg transition flex items-center gap-2 text-sm ${
                    saved
                      ? "bg-green-100 text-green-700"
                      : "bg-indigo-600 text-white hover:bg-indigo-700"
                  }`}
                >
                  {saved ? (
                    <>
                      <CheckCircle className="w-4 h-4" /> Saved
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Save Changes
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs text-gray-500 mb-5">
                Permissions shown are limited to the ceiling allowed for the{" "}
                <strong>{selectedMember.role}</strong> role. You cannot grant permissions beyond
                the role baseline.
              </p>

              <div className="space-y-6 max-h-[500px] overflow-y-auto pr-1">
                {Object.entries(grouped).map(([category, perms]) => (
                  <div key={category}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-gray-700">{category}</h3>
                      <span className="text-xs text-gray-500">
                        {perms.filter((p) => currentPerms.includes(p.id)).length}/{perms.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {perms.map((perm) => {
                        const has = currentPerms.includes(perm.id);
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
                                onChange={() => toggle(perm.id)}
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
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
              <Settings className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg text-gray-600 mb-2">Select a Member</h3>
              <p className="text-sm text-gray-500">
                Choose a member from the list to configure their permissions
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
