'use client';

import { useState, useEffect } from "react";
import { useNavigate } from "@/lib/router-compat";
import { useSearchParams } from "next/navigation";
import {
  Shield,
  ChevronRight,
  User,
  Briefcase,
  Wrench,
  Building2,
  Package,
  FileCheck,
  ClipboardCheck,
  Truck,
  LogOut,
} from "lucide-react";
import { getStoredUser, getSessionClaims, clearAuthSession } from "@/lib/auth-session";

// Map role identifiers to display metadata
const ROLE_META: Record<
  string,
  { label: string; description: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  buyer: {
    label: "Buyer",
    description: "Browse, compare, and purchase properties",
    Icon: User,
  },
  agent: {
    label: "Real Estate Agent",
    description: "List properties and manage client sales",
    Icon: Briefcase,
  },
  contractor: {
    label: "Contractor",
    description: "Manage construction projects and bids",
    Icon: Wrench,
  },
  property_manager: {
    label: "Property Manager",
    description: "Oversee rental portfolios and tenants",
    Icon: Building2,
  },
  supplier: {
    label: "Supplier",
    description: "Sell materials and respond to RFQs",
    Icon: Package,
  },
  conveyancer: {
    label: "Conveyancer",
    description: "Handle legal property transfers",
    Icon: FileCheck,
  },
  inspector: {
    label: "Inspector",
    description: "Conduct and report on site inspections",
    Icon: ClipboardCheck,
  },
  logistics: {
    label: "Logistics Operator",
    description: "Manage deliveries and transport jobs",
    Icon: Truck,
  },
  admin: {
    label: "Administrator",
    description: "Platform-wide admin access",
    Icon: Shield,
  },
};

const ROLE_DASHBOARD: Record<string, string> = {
  buyer: "/app/listings",
  agent: "/app/agent/dashboard",
  contractor: "/app/contractor/dashboard",
  property_manager: "/app/company/dashboard",
  supplier: "/app/supplier/dashboard",
  conveyancer: "/app/conveyancer/dashboard",
  inspector: "/app/inspector/dashboard",
  logistics: "/app/logistics/dashboard",
  admin: "/app/admin/dashboard",
};

export const ACTIVE_ROLE_KEY = "pribec.active_role";

const C = {
  forest: '#1A3C28',
  forestLight: '#4A7C5A',
  parchment: '#F2E8D5',
  amber: '#B89040',
  terracotta: '#C4562A',
  egreen: '#00E87A',
  muted: '#E8F0EC',
};

export default function CompanyRoleSelector() {
  const navigate = useNavigate();
  const searchParams = useSearchParams();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [roles, setRoles] = useState<string[]>([]);

  const nextPathParam = searchParams.get("next");
  const hasSafeNextPath = Boolean(
    nextPathParam && nextPathParam.startsWith("/") && !nextPathParam.startsWith("//"),
  );
  const nextPath = hasSafeNextPath ? nextPathParam : null;

  useEffect(() => {
    // Collect roles from stored user and JWT claims (union, de-duplicated)
    const user = getStoredUser();
    const claims = getSessionClaims();

    const fromUser = user?.roles ?? (user?.role ? [user.role] : []);
    const fromClaims = claims?.roles ?? [];

    const merged = Array.from(new Set([...fromUser, ...fromClaims])).filter(Boolean) as string[];
    setRoles(merged);

    // Auto-select if only one role present (shouldn't normally land here, but handle gracefully)
    if (merged.length === 1) {
      setSelectedRole(merged[0]);
    }
  }, []);

  const handleContinue = () => {
    if (!selectedRole) return;
    sessionStorage.setItem(ACTIVE_ROLE_KEY, selectedRole);
    const destination = nextPath ?? ROLE_DASHBOARD[selectedRole] ?? "/app/listings";
    navigate(destination);
  };

  const handleSignOut = () => {
    clearAuthSession();
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: C.parchment }}>
      <div className="w-full max-w-2xl">
        <div className="rounded-2xl shadow-xl overflow-hidden">
          {/* Forest header strip */}
          <div style={{ background: C.forest, padding: '18px 28px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, background: C.forestLight, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontFamily: 'var(--font-fraunces)', fontSize: 16, fontWeight: 700, color: C.egreen }}>B</span>
            </div>
            <span style={{ fontFamily: 'var(--font-fraunces)', fontSize: 20, fontWeight: 700, color: C.parchment, letterSpacing: '-0.3px' }}>BuildTrust</span>
          </div>

          {/* Card body */}
          <div className="p-8" style={{ background: '#fff' }}>
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: C.forest }}>
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-fraunces)', color: C.forest }}>Select Your Role</h1>
              <p className="text-gray-600">
                Your account has multiple roles. Choose which one you want to access now.
              </p>
            </div>

          {/* Role cards */}
          <div className="space-y-3 mb-8">
            {roles.map((role) => {
              const meta = ROLE_META[role] ?? {
                label: role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
                description: "",
                Icon: User,
              };
              const { label, description, Icon } = meta;
              const isSelected = selectedRole === role;

              return (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`w-full p-5 rounded-xl border-2 transition-all text-left ${
                    isSelected ? "shadow-md" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                  style={isSelected ? { borderColor: C.forest, borderLeftWidth: 4, background: C.muted } : {}}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className="flex items-center justify-center w-12 h-12 rounded-lg shrink-0"
                        style={{ background: isSelected ? C.forest : C.muted }}
                      >
                        <Icon
                          className={`w-6 h-6 ${isSelected ? "text-[#00E87A]" : "text-[#1A3C28]"}`}
                        />
                      </div>
                      <div>
                        <h3
                          className="text-lg font-semibold mb-0.5"
                          style={{ fontFamily: 'var(--font-fraunces)', color: isSelected ? C.forest : '#111827' }}
                        >
                          {label}
                        </h3>
                        {description && (
                          <p className="text-sm text-gray-500">{description}</p>
                        )}
                        <span
                          className="mt-1 inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium"
                          style={isSelected
                            ? { background: C.forest, color: C.parchment }
                            : { background: '#E5E7EB', color: '#6B7280' }
                          }
                        >
                          {role.toUpperCase().replace(/_/g, " ")}
                        </span>
                      </div>
                    </div>
                    <ChevronRight
                      className="w-6 h-6 shrink-0"
                      style={{ color: isSelected ? C.forest : '#9CA3AF' }}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Continue button */}
          <button
            onClick={handleContinue}
            disabled={!selectedRole}
            className="w-full py-4 rounded-lg font-medium transition flex items-center justify-center gap-2"
            style={selectedRole
              ? { background: C.forest, color: C.parchment }
              : { background: '#E5E7EB', color: '#9CA3AF' }
            }
          >
            Continue to Dashboard
            <ChevronRight className="w-5 h-5" />
          </button>

          <p className="text-center text-sm mt-6" style={{ color: C.forest, opacity: 0.5 }}>
            You can switch between roles anytime from your profile settings.
          </p>

          {/* Sign out */}
          <div className="flex justify-center mt-4">
            <button
              onClick={handleSignOut}
              className="text-sm flex items-center gap-1 transition"
              style={{ color: C.forest, opacity: 0.55 }}
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
