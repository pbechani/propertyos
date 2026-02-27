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
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Select Your Role</h1>
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
                    isSelected
                      ? "border-indigo-600 bg-indigo-50 shadow-md"
                      : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex items-center justify-center w-12 h-12 rounded-lg shrink-0 ${
                          isSelected ? "bg-indigo-600" : "bg-gray-100"
                        }`}
                      >
                        <Icon
                          className={`w-6 h-6 ${isSelected ? "text-white" : "text-gray-600"}`}
                        />
                      </div>
                      <div>
                        <h3
                          className={`text-lg font-semibold mb-0.5 ${
                            isSelected ? "text-indigo-900" : "text-gray-900"
                          }`}
                        >
                          {label}
                        </h3>
                        {description && (
                          <p className="text-sm text-gray-500">{description}</p>
                        )}
                        <span
                          className={`mt-1 inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium ${
                            isSelected
                              ? "bg-indigo-600 text-white"
                              : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          {role.toUpperCase().replace(/_/g, " ")}
                        </span>
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-6 h-6 shrink-0 ${
                        isSelected ? "text-indigo-600" : "text-gray-400"
                      }`}
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
            className={`w-full py-4 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
              selectedRole
                ? "bg-indigo-600 text-white hover:bg-indigo-700"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            Continue to Dashboard
            <ChevronRight className="w-5 h-5" />
          </button>

          <p className="text-center text-sm text-gray-500 mt-6">
            You can switch between roles anytime from your profile settings.
          </p>

          {/* Sign out */}
          <div className="flex justify-center mt-4">
            <button
              onClick={handleSignOut}
              className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1 transition"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
