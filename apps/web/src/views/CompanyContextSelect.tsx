'use client';

import { useState, useEffect } from "react";
import { useNavigate } from "@/lib/router-compat";
import { useSearchParams } from "next/navigation";
import { ChevronRight, LogOut, AlertCircle } from "lucide-react";

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

const C = {
  forest: '#1A3C28',
  forestLight: '#4A7C5A',
  parchment: '#F2E8D5',
  amber: '#B89040',
  terracotta: '#C4562A',
  egreen: '#00E87A',
  muted: '#E8F0EC',
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
              <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-fraunces)', color: C.forest }}>Select Company &amp; Role</h1>
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
                    isSelected ? "shadow-md" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                  style={isSelected ? { borderColor: C.forest, borderLeftWidth: 4, background: C.muted } : {}}
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
                          className="text-lg mb-1"
                          style={{ fontFamily: 'var(--font-fraunces)', color: isSelected ? C.forest : '#111827' }}
                        >
                          {co.name}
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Category badge */}
                          <span
                            className="inline-block px-2 py-0.5 rounded text-xs"
                            style={
                              co.category === 'agent' || co.category === 'conveyancer'
                                ? { background: C.muted, color: C.forest }
                                : co.category === 'supplier'
                                ? { background: '#FEF3C7', color: '#B45309' }
                                : co.category === 'contractor'
                                ? { background: '#FEE2E2', color: C.terracotta }
                                : { background: '#F3F4F6', color: '#6B7280' }
                            }
                          >
                            {CATEGORY_LABELS[co.category] ?? co.category}
                          </span>
                          {/* Role badge */}
                          <span
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs"
                            style={isSelected
                              ? { background: C.forest, color: C.parchment }
                              : { background: '#E5E7EB', color: '#6B7280' }
                            }
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
                      className="w-6 h-6"
                      style={{ color: isSelected ? C.forest : '#9CA3AF' }}
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
            className="w-full py-4 rounded-lg transition flex items-center justify-center gap-2"
            style={selected && !isLoading
              ? { background: C.forest, color: C.parchment }
              : { background: '#E5E7EB', color: '#9CA3AF' }
            }
          >
            {isLoading ? "Signing In…" : "Continue to Dashboard"}
            {!isLoading && <ChevronRight className="w-5 h-5" />}
          </button>

          {/* Sign out */}
          <div className="flex justify-center mt-6">
            <button
              onClick={handleSignOut}
              className="text-sm flex items-center gap-1 transition"
              style={{ color: C.forest, opacity: 0.55 }}
            >
              <LogOut className="w-4 h-4" />
              Sign out and go back
            </button>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}


