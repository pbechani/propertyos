'use client';

import { useEffect, useState } from "react";
import { useNavigate } from "@/lib/router-compat";
import { Clock, AlertCircle, LogOut } from "lucide-react";
import { clearAuthSession } from "@/lib/auth-session";
import { AuthLayout } from "@/components/AuthLayout";

const C = { forest: '#1A3C28', cream: '#EAD9C4', egreen: '#00E87A', parchment: '#F2E8D5', amber: '#B89040' };

export default function SessionExpired() {
  const navigate = useNavigate();
  const [expiredAt, setExpiredAt] = useState<string | null>(null);

  useEffect(() => {
    setExpiredAt(new Date().toLocaleTimeString());
  }, []);

  // Clear any stale session data when the user lands on this page.
  useEffect(() => {
    clearAuthSession();
  }, []);

  const handleSignIn = () => {
    navigate("/login");
  };

  return (
    <AuthLayout variant="centered">
      <div className="text-center">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ background: `${C.amber}20` }}
        >
          <Clock className="w-7 h-7" style={{ color: C.amber }} />
        </div>
        <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 24, fontWeight: 700, color: C.forest, marginBottom: 8 }}>
          Session Expired
        </h1>
        <p className="text-sm mb-6" style={{ color: `${C.forest}70` }}>
          Your session has expired due to inactivity. Please sign in again to continue.
        </p>

        <button
          onClick={handleSignIn}
          className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 mb-5"
          style={{ background: C.forest, color: C.parchment }}
        >
          <LogOut className="w-4 h-4" />
          Sign In Again
        </button>

        <div
          className="p-4 rounded-xl flex items-start gap-3 text-left mb-4"
          style={{ background: `${C.forest}0A`, border: `1px solid ${C.forest}1A` }}
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: C.forest }} />
          <div>
            <p className="font-medium text-xs mb-0.5" style={{ color: C.forest }}>Security Notice</p>
            <p className="text-xs" style={{ color: `${C.forest}70` }}>
              For your security, we automatically sign you out after 30 minutes of inactivity. Your data is safe.
            </p>
          </div>
        </div>

        {expiredAt && (
          <p className="text-xs" style={{ color: `${C.forest}50` }}>
            Session expired at {expiredAt}
          </p>
        )}
      </div>
    </AuthLayout>
  );
}
