'use client';

import { useState, FormEvent } from "react";
import { Link, useNavigate } from "@/lib/router-compat";
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { authApi, ApiError } from "@/lib/api-client";
import { AuthLayout } from "@/components/AuthLayout";

const C = { forest: '#1A3C28', cream: '#EAD9C4', egreen: '#00E87A', parchment: '#F2E8D5' };

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await authApi.forgotPassword({ email });
      setIsLoading(false);
      setIsSubmitted(true);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status >= 500) {
          setError("Server error while sending reset instructions. Please try again shortly.");
        } else {
          setError("Unable to send reset instructions right now.");
        }
      } else {
        setError("Unable to send reset instructions right now.");
      }
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <AuthLayout variant="centered">
        <div className="text-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: `${C.egreen}20` }}
          >
            <CheckCircle className="w-7 h-7" style={{ color: C.egreen }} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 24, fontWeight: 700, color: C.forest, marginBottom: 8 }}>
            Check Your Email
          </h1>
          <p className="text-sm mb-2" style={{ color: `${C.forest}70` }}>We&apos;ve sent a reset link to</p>
          <p className="font-semibold mb-5 text-sm" style={{ color: C.forest }}>{email}</p>
          <p className="text-xs mb-6" style={{ color: `${C.forest}60` }}>
            Click the link in the email to reset your password. If you don&apos;t see it, check your spam folder.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="w-full py-3 rounded-xl text-sm font-semibold mb-3"
            style={{ background: C.forest, color: C.parchment }}
          >
            Back to Sign In
          </button>
          <button
            onClick={() => setIsSubmitted(false)}
            className="w-full py-2.5 rounded-xl text-sm"
            style={{ color: `${C.forest}70` }}
          >
            Didn&apos;t receive it? Try again
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout variant="centered">
      <div>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm mb-5"
          style={{ color: `${C.forest}70` }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sign In
        </Link>
        <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 24, fontWeight: 700, color: C.forest, marginBottom: 6 }}>
          Forgot Password?
        </h1>
        <p className="text-sm mb-6" style={{ color: `${C.forest}70` }}>
          No worries, we&apos;ll send you reset instructions.
        </p>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl flex items-start gap-3" style={{ background: '#FEF2F2', border: '1px solid #FCA5A5' }}>
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span className="text-sm text-red-800">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: C.forest }}>
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: `${C.forest}60` }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2"
                style={{ border: `1.5px solid ${C.cream}`, background: 'rgba(255,255,255,0.7)', color: C.forest }}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl text-sm font-semibold disabled:opacity-60"
            style={{ background: C.forest, color: C.parchment }}
          >
            {isLoading ? "Sending…" : "Send Reset Instructions"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm" style={{ color: `${C.forest}70` }}>
          Remember your password?{' '}
          <Link to="/login" className="font-semibold hover:underline" style={{ color: C.forest }}>
            Sign In
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}