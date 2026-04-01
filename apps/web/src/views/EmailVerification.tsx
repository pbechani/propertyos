'use client';

import { useState, useEffect } from "react";
import { Link, useNavigate } from "@/lib/router-compat";
import { Mail, CheckCircle, RefreshCw, AlertCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { authApi, ApiError } from "@/lib/api-client";
import { AuthLayout } from "@/components/AuthLayout";

const C = { forest: '#1A3C28', cream: '#EAD9C4', egreen: '#00E87A', parchment: '#F2E8D5', amber: '#B89040' };

export default function EmailVerification() {
  const navigate = useNavigate();
  const searchParams = useSearchParams();
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");
  const [verificationStatus, setVerificationStatus] = useState<"pending" | "success" | "error">("pending");
  const email = searchParams.get("email") ?? "";
  const token = searchParams.get("token") ?? "";

  useEffect(() => {
    if (resendCooldown <= 0) {
      return undefined;
    }

    const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleResend = () => {
    setResendCooldown(60);
    setError("Use the latest verification email link to complete verification.");
  };

  const handleVerify = async () => {
    if (!token) {
      setVerificationStatus("error");
      setError("Missing verification token. Open the link from your email.");
      return;
    }

    setIsVerifying(true);
    setError("");

    try {
      await authApi.verifyEmail({ token });
      setVerificationStatus("success");
      setIsVerifying(false);
      setTimeout(() => {
        navigate("/role-setup");
      }, 2000);
    } catch (err) {
      setVerificationStatus("error");
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Unable to verify email right now.");
      }
      setIsVerifying(false);
    }
  };

  return (
    <AuthLayout variant="centered">
      {verificationStatus === "success" ? (
        <div className="text-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: `${C.egreen}20` }}
          >
            <CheckCircle className="w-7 h-7" style={{ color: C.egreen }} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 24, fontWeight: 700, color: C.forest, marginBottom: 8 }}>
            Email Verified!
          </h1>
          <p className="text-sm" style={{ color: `${C.forest}70` }}>
            Your email has been successfully verified. Redirecting you…
          </p>
        </div>
      ) : (
        <div>
          <div className="text-center mb-6">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background: `${C.forest}12` }}
            >
              <Mail className="w-7 h-7" style={{ color: C.forest }} />
            </div>
            <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 24, fontWeight: 700, color: C.forest, marginBottom: 6 }}>
              Verify Your Email
            </h1>
            <p className="text-sm mb-2" style={{ color: `${C.forest}70` }}>
              We&apos;ve sent a verification link to
            </p>
            <p className="font-semibold text-sm" style={{ color: C.forest }}>
              {email || "your email address"}
            </p>
          </div>

          {verificationStatus === "error" && (
            <div className="mb-5 p-3.5 rounded-xl" style={{ background: '#FEF2F2', border: '1px solid #FCA5A5' }}>
              <span className="text-sm text-red-800">{error || "Verification failed. Please try again."}</span>
            </div>
          )}

          <div
            className="rounded-xl p-4 mb-5"
            style={{ background: `${C.forest}08`, border: `1px solid ${C.forest}18` }}
          >
            <p className="text-xs" style={{ color: `${C.forest}70` }}>
              Click the link in the email to verify your account. If you don&apos;t see it, check your spam folder.
            </p>
          </div>

          <div className="space-y-2.5">
            <button
              onClick={handleVerify}
              disabled={isVerifying}
              className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: C.forest, color: C.parchment }}
            >
              {isVerifying ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> Verifying…</>
              ) : (
                "Verify Email"
              )}
            </button>

            <button
              onClick={handleResend}
              disabled={resendCooldown > 0}
              className="w-full py-2.5 rounded-xl text-sm disabled:opacity-50"
              style={{ border: `1.5px solid ${C.cream}`, color: C.forest }}
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4" /> Resend Email
                </span>
              )}
            </button>
          </div>

          <p className="mt-4 text-center text-sm" style={{ color: `${C.forest}70` }}>
            Wrong email?{' '}
            <Link to="/register" className="font-semibold hover:underline" style={{ color: C.forest }}>
              Change Email
            </Link>
          </p>

          <div
            className="mt-4 p-3.5 rounded-xl flex items-start gap-2.5"
            style={{ background: `${C.amber}15`, border: `1px solid ${C.amber}40` }}
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: C.amber }} />
            <div>
              <p className="text-xs font-semibold mb-0.5" style={{ color: C.forest }}>Important</p>
              <p className="text-xs" style={{ color: `${C.forest}70` }}>
                The verification link expires in 24 hours.
              </p>
            </div>
          </div>
        </div>
      )}
    </AuthLayout>
  );
}
