'use client';

import { useState } from "react";
import { useNavigate } from "@/lib/router-compat";
import { Building2, ChevronRight, Shield, LogOut } from "lucide-react";

type CompanyContext = {
  companyId: string;
  companyName: string;
  category: string;
  role: string;
  isAdmin: boolean;
  isActive: boolean;
};

type CompanyContextSelectProps = {
  /** Populated by the login response when requires_context_selection = true */
  contexts?: CompanyContext[];
};

const STUB_CONTEXTS: CompanyContext[] = [
  {
    companyId: "c1",
    companyName: "Elite Properties Ltd.",
    category: "agent",
    role: "agent",
    isAdmin: true,
    isActive: true,
  },
  {
    companyId: "c2",
    companyName: "BuildRight Contractors",
    category: "contractor",
    role: "contractor",
    isAdmin: false,
    isActive: true,
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  agent: "Real Estate Agent",
  contractor: "Contractor",
  supplier: "Supplier",
  conveyancer: "Conveyancer",
  inspector: "Inspector",
  logistics: "Logistics",
  developing: "Developer",
};

export default function CompanyContextSelect({ contexts = STUB_CONTEXTS }: CompanyContextSelectProps) {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    if (!selected) return;
    setIsLoading(true);
    try {
      // POST /api/v1/auth/contexts/select { company_id: selected }
      // → server issues new JWT pair with company context embedded
      navigate("/company/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl mb-2">Select Company & Role</h1>
            <p className="text-gray-600">
              You belong to multiple companies. Choose which context to work in.
            </p>
          </div>

          {/* Context Cards */}
          <div className="space-y-3 mb-8">
            {contexts.map((ctx) => {
              const isSelected = selected === ctx.companyId;
              return (
                <button
                  key={ctx.companyId}
                  onClick={() => setSelected(ctx.companyId)}
                  className={`w-full p-5 rounded-xl border-2 transition-all text-left ${
                    isSelected
                      ? "border-indigo-600 bg-indigo-50 shadow-md"
                      : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Company Icon */}
                      <div
                        className={`flex items-center justify-center w-12 h-12 rounded-lg ${
                          isSelected ? "bg-indigo-600" : "bg-gray-100"
                        }`}
                      >
                        <Building2
                          className={`w-6 h-6 ${isSelected ? "text-white" : "text-gray-600"}`}
                        />
                      </div>

                      <div>
                        <h3
                          className={`text-lg mb-1 ${
                            isSelected ? "text-indigo-900" : "text-gray-900"
                          }`}
                        >
                          {ctx.companyName}
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Category badge */}
                          <span className="inline-block px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                            {CATEGORY_LABELS[ctx.category] ?? ctx.category}
                          </span>
                          {/* Role badge */}
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs ${
                              isSelected
                                ? "bg-indigo-600 text-white"
                                : "bg-gray-200 text-gray-700"
                            }`}
                          >
                            {ctx.role.toUpperCase()}
                          </span>
                          {/* Admin badge */}
                          {ctx.isAdmin && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700">
                              Admin
                            </span>
                          )}
                          {/* Active indicator */}
                          {ctx.isActive && (
                            <span className="text-xs text-green-600 flex items-center gap-1">
                              <span className="w-2 h-2 bg-green-600 rounded-full" />
                              Active
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-6 h-6 ${isSelected ? "text-indigo-600" : "text-gray-400"}`}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Continue Button */}
          <button
            onClick={handleContinue}
            disabled={!selected || isLoading}
            className={`w-full py-4 rounded-lg transition flex items-center justify-center gap-2 ${
              selected && !isLoading
                ? "bg-indigo-600 text-white hover:bg-indigo-700"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            {isLoading ? "Loading..." : "Continue to Dashboard"}
            {!isLoading && <ChevronRight className="w-5 h-5" />}
          </button>

          {/* Individual / Solo Mode */}
          <p className="text-center text-sm text-gray-500 mt-6">
            Continue as individual without a company context?{" "}
            <button
              className="text-indigo-600 hover:underline"
              onClick={() => navigate("/profile-dashboard")}
            >
              Skip
            </button>
          </p>

          {/* Sign out */}
          <div className="flex justify-center mt-4">
            <button
              onClick={() => navigate("/login")}
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
