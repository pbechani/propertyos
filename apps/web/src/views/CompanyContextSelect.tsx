'use client';

import { useState, useEffect } from "react";
import { useNavigate } from "@/lib/router-compat";
import { useSearchParams } from "next/navigation";
import { ChevronRight, Home, LogOut, AlertCircle } from "lucide-react";

/** Deterministic pastel-ish bg colour from a string (stays consistent across renders) */
function nameToColor(name: string): string {
  const COLORS = [
    '#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626',
    '#7c3aed', '#db2777', '#0284c7', '#16a34a', '#ca8a04',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}
import Link from "next/link";
import { getAccessToken, getPendingCompanies, getUserCompanies, saveSelectedContextTokens, saveActiveCompanyContext, saveUserCompanies, savePendingCompanies, clearAuthSession } from "@/lib/auth-session";
import { authApi, type CompanyContext, ApiError } from "@/lib/api-client";

const CATEGORY_LABELS: Record<string, string> = {
  agent: "Real Estate Agent",
  contractor: "Contractor",
  supplier: "Supplier",
  conveyancer: "Conveyancer",
  inspector: "Inspector",
  logistics: "Logistics",
  developing: "Developer",
};

export default function CompanyContextSelect() {
  const navigate = useNavigate();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next');

  const [selected, setSelected] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [failedLogos, setFailedLogos] = useState<Set<string>>(new Set());

  // Start empty (safe for SSR). The effect below immediately fills from storage
  // then refreshes from the API so logos are always current.
  const [companies, setCompanies] = useState<CompanyContext[]>([]);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      navigate("/login");
      return;
    }

    // Step 1: apply stored companies synchronously so the list appears instantly.
    const stored = getPendingCompanies() ?? getUserCompanies() ?? [];
    if (stored.length === 0) {
      navigate("/login");
      return;
    }
    setCompanies(stored);

    // Step 2: fetch fresh data so logos/roles are up-to-date.
    authApi.getContexts(token)
      .then((fresh) => {
        if (Array.isArray(fresh) && fresh.length > 0) {
          setCompanies(fresh);
          saveUserCompanies(fresh);
          savePendingCompanies(fresh);
        }
      })
      .catch((err) => {
        // Stale stored data is an acceptable fallback, but log for debugging
        console.warn('[CompanyContextSelect] getContexts refresh failed:', err);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleContinue = async () => {
    if (!selected) return;
    setError("");
    setIsLoading(true);

    try {
      const accessToken = getAccessToken();
      if (!accessToken) throw new Error("No interim token found.");

      // Exchange the selected company for a fully-scoped JWT pair
      const tokens = await authApi.selectContext(accessToken, selected);
      saveSelectedContextTokens(tokens);

      // Persist the selected company so the sidebar can display it
      const selectedCompany = companies.find((c) => c.id === selected);
      if (selectedCompany) saveActiveCompanyContext(selectedCompany);

      const safeNext = nextPath?.startsWith('/') && !nextPath.startsWith('//') ? nextPath : null;
      // Routing by context:
      //   self company          → My Dashboard (personal)
      //   company admin         → Company Dashboard
      //   company agent role    → Agent Dashboard
      //   other company member  → My Dashboard
      const role = selectedCompany?.role?.toLowerCase();
      const defaultDestination =
        selectedCompany?.slug === 'self'
          ? '/app/my-dashboard'
          : selectedCompany?.is_admin
          ? '/company/dashboard'
          : role === 'agent'
          ? '/app/agent'
          : '/app/my-dashboard';
      navigate(safeNext ?? defaultDestination);
    } catch (err) {
      if (err instanceof ApiError) {
        setError("Could not select company context. Please try signing in again.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = () => {
    clearAuthSession();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo — matches login page */}
        <Link href="/" className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-black dark:bg-white rounded-lg flex items-center justify-center">
            <Home className="w-7 h-7 text-white dark:text-black" />
          </div>
          <span className="font-bold text-2xl">PropertyOS</span>
        </Link>

        <div className="bg-card border border-border rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Select Company & Role</h1>
            <p className="text-muted-foreground">
              You belong to multiple companies. Choose which context to work in.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <span className="text-sm text-red-800">{error}</span>
            </div>
          )}

          {/* Context Cards */}
          <div className="space-y-3 mb-8">
            {companies.map((co) => {
              const isSelected = selected === co.id;
              return (
                <button
                  key={co.id}
                  onClick={() => setSelected(co.id)}
                  className={`w-full p-5 rounded-xl border-2 transition-all text-left ${
                    isSelected
                      ? "border-indigo-600 bg-indigo-50 shadow-md"
                      : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Company Logo / Icon */}
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {co.logo_url && !failedLogos.has(co.id) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={co.logo_url}
                            alt={co.name}
                            className="w-12 h-12 object-cover"
                            onError={() =>
                              setFailedLogos((prev) => new Set(prev).add(co.id))
                            }
                          />
                        ) : (
                          <span
                            className="w-12 h-12 flex items-center justify-center rounded-lg text-white font-bold text-lg select-none"
                            style={{ backgroundColor: nameToColor(co.name) }}
                          >
                            {co.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>

                      <div>
                        <h3
                          className={`text-lg mb-1 ${
                            isSelected ? "text-indigo-900" : "text-gray-900"
                          }`}
                        >
                          {co.name}
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Category badge */}
                          <span className="inline-block px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                            {CATEGORY_LABELS[co.category] ?? co.category}
                          </span>
                          {/* Role badge */}
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs ${
                              isSelected
                                ? "bg-indigo-600 text-white"
                                : "bg-gray-200 text-gray-700"
                            }`}
                          >
                            {co.role.toUpperCase()}
                          </span>
                          {/* Admin badge — only shown when the member role is not already "admin" */}
                          {co.is_admin && co.role !== 'admin' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700">
                              Admin
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
            {isLoading ? "Signing In…" : "Continue to Dashboard"}
            {!isLoading && <ChevronRight className="w-5 h-5" />}
          </button>

          {/* Sign out */}
          <div className="flex justify-center mt-6">
            <button
              onClick={handleSignOut}
              className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1 transition"
            >
              <LogOut className="w-4 h-4" />
              Sign out and go back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


