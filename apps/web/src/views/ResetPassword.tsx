'use client';

import { useState, FormEvent } from "react";
import { Link, useNavigate } from "@/lib/router-compat";
import { Lock, Eye, EyeOff, CheckCircle, X, Check } from "lucide-react";
import { useEffect } from "react";
import { authApi, ApiError } from "@/lib/api-client";
import { AuthLayout } from "@/components/AuthLayout";

const C = { forest: '#1A3C28', cream: '#EAD9C4', egreen: '#00E87A', parchment: '#F2E8D5' };

export default function ResetPassword() {
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const parsedToken = new URLSearchParams(window.location.search).get("token") ?? "";
    setToken(parsedToken);
  }, []);

  const requirements = [
    { met: password.length >= 8, text: "At least 8 characters" },
    { met: /[A-Z]/.test(password), text: "One uppercase letter" },
    { met: /[a-z]/.test(password), text: "One lowercase letter" },
    { met: /[0-9]/.test(password), text: "One number" },
    { met: /[^A-Za-z0-9]/.test(password), text: "One special character" },
  ];

  const allRequirementsMet = requirements.every((req) => req.met);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!allRequirementsMet || !passwordsMatch) return;
    if (!token) {
      setError("Reset token is missing or invalid. Please request a new reset link.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      await authApi.resetPassword({ token, newPassword: password });
      setIsLoading(false);
      setIsSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 400 || err.status === 401) {
          setError("Your reset link is invalid or has expired. Please request a new one.");
        } else if (err.status >= 500) {
          setError("Server error while resetting password. Please try again shortly.");
        } else {
          setError("Unable to reset password right now.");
        }
      } else {
        setError("Unable to reset password right now.");
      }
      setIsLoading(false);
    }
  };

  if (isSuccess) {
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
            Password Reset!
          </h1>
          <p className="text-sm" style={{ color: `${C.forest}70` }}>
            Your password has been successfully reset. Redirecting you to sign in…
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout variant="centered">
      <div>
        <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 24, fontWeight: 700, color: C.forest, marginBottom: 6 }}>
          Set New Password
        </h1>
        <p className="text-sm mb-6" style={{ color: `${C.forest}70` }}>
          Your new password must be different from previously used passwords.
        </p>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl flex items-start gap-3" style={{ background: '#FEF2F2', border: '1px solid #FCA5A5' }}>
            <span className="text-sm text-red-800">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: C.forest }}>New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: `${C.forest}60` }} />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full pl-10 pr-12 py-3 rounded-xl text-sm focus:outline-none focus:ring-2"
                style={{ border: `1.5px solid ${C.cream}`, background: 'rgba(255,255,255,0.7)', color: C.forest }}
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: `${C.forest}60` }}>
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: C.forest }}>Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: `${C.forest}60` }} />
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full pl-10 pr-12 py-3 rounded-xl text-sm focus:outline-none focus:ring-2"
                style={{ border: `1.5px solid ${passwordsMatch === false && confirmPassword ? '#FCA5A5' : C.cream}`, background: 'rgba(255,255,255,0.7)', color: C.forest }}
                required
              />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: `${C.forest}60` }}>
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword && (
              <div className="mt-1.5 flex items-center gap-1.5 text-xs">
                {passwordsMatch
                  ? <><Check className="w-3.5 h-3.5" style={{ color: C.egreen }} /><span style={{ color: C.egreen }}>Passwords match</span></>
                  : <><X className="w-3.5 h-3.5 text-red-500" /><span className="text-red-500">Passwords do not match</span></>}
              </div>
            )}
          </div>

          {password && (
            <div className="rounded-xl p-4 space-y-2" style={{ background: `${C.forest}08`, border: `1px solid ${C.forest}18` }}>
              <p className="text-xs font-medium mb-2" style={{ color: C.forest }}>Password Requirements</p>
              {requirements.map((req, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: req.met ? C.egreen : `${C.forest}30` }} />
                  <span style={{ color: req.met ? C.forest : `${C.forest}50` }}>{req.text}</span>
                </div>
              ))}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !allRequirementsMet || !passwordsMatch}
            className="w-full py-3 rounded-xl text-sm font-semibold disabled:opacity-60"
            style={{ background: C.forest, color: C.parchment }}
          >
            {isLoading ? "Resetting…" : "Reset Password"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm">
          <Link to="/login" className="font-semibold hover:underline" style={{ color: C.forest }}>
            Back to Sign In
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
