'use client';

import { useState, FormEvent, KeyboardEvent } from "react";
import { Link, useNavigate } from "@/lib/router-compat";
import { Mail, Lock, Eye, EyeOff, Shield, AlertCircle } from "lucide-react";
import { authApi, ApiError } from "@/lib/api-client";
import { saveAuthSession } from "@/lib/auth-session";
import { useSearchParams } from "next/navigation";
import { AuthLayout } from "@/components/AuthLayout";

const C = { forest: '#1A3C28', cream: '#EAD9C4', egreen: '#00E87A', parchment: '#F2E8D5' };

export default function LoginEnhanced({
  initialEmail,
  onLoginSuccess,
}: {
  initialEmail?: string;
  /** When provided, called with the access token instead of navigating. */
  onLoginSuccess?: (accessToken: string) => Promise<void>;
} = {}) {
  const navigate = useNavigate();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState(initialEmail ?? "");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const nextPathParam = searchParams.get('next');
  const hasSafeNextPath = Boolean(nextPathParam && nextPathParam.startsWith('/') && !nextPathParam.startsWith('//'));
  const nextPath = hasSafeNextPath ? nextPathParam : null;

  const handleCancel = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate('/');
    }
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await authApi.login({ email, password });

      // Always save the session first — for multi-company logins this persists
      // the interim tokens that the context-select screen needs.
      saveAuthSession(response);

      // If a post-login callback is provided (e.g. invitation acceptance),
      // delegate navigation entirely to the caller.
      if (onLoginSuccess) {
        await onLoginSuccess(response.tokens.accessToken);
        return;
      }

      if (response.requires_context_selection) {
        // User belongs to multiple companies — let them pick a context.
        const nextQuery = nextPath ? `?next=${encodeURIComponent(nextPath)}` : '';
        navigate(`/company-context-select${nextQuery}`);
        return;
      }

      // Single company or no company: go straight to the app.
      navigate(nextPath ?? "/app/listings");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 400 || err.status === 401) {
          setError("Invalid email or password.");
        } else if (err.status >= 500) {
          setError("Server error while signing in. Please try again shortly.");
        } else {
          setError("Unable to sign in right now. Please try again.");
        }
      } else {
        setError("Unable to sign in right now. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = (provider: string) => {
    const nextQuery = nextPath ? `&next=${encodeURIComponent(nextPath)}` : '';
    navigate(`/oauth-connect?provider=${provider}${nextQuery}`);
  };

  const handleEnterSubmit = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();

    if (isLoading) {
      return;
    }

    event.currentTarget.form?.requestSubmit();
  };

  return (
    <AuthLayout
      variant="split"
      panelTagline="SECURE ACCESS"
      panelTitle="Property transactions you can trust"
      panelHighlight="trust"
    >
      <div>
        <h1
          style={{
            fontFamily: 'var(--font-fraunces)', fontSize: 30, fontWeight: 700,
            color: C.forest, marginBottom: 6, letterSpacing: '-0.02em',
            textAlign: 'center',
          }}
        >
          Welcome Back
        </h1>
        <p style={{ color: `${C.forest}80`, marginBottom: 28, fontSize: 15, textAlign: 'center' }}>
          Sign in to your BuildTrust account
        </p>

        {error && (
          <div
            className="mb-5 p-4 rounded-xl flex items-start gap-3"
            style={{ background: '#FEF2F2', border: '1px solid #FCA5A5' }}
          >
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span className="text-sm text-red-800">{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: C.forest }}>
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: `${C.forest}60` }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleEnterSubmit}
                placeholder="your.email@example.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2"
                style={{
                  border: `1.5px solid ${C.cream}`,
                  background: 'rgba(255,255,255,0.7)',
                  color: C.forest,
                  // @ts-expect-error CSS variable
                  '--tw-ring-color': C.forest,
                }}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: C.forest }}>
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: `${C.forest}60` }} />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleEnterSubmit}
                placeholder="Enter your password"
                className="w-full pl-10 pr-12 py-3 rounded-xl text-sm focus:outline-none focus:ring-2"
                style={{
                  border: `1.5px solid ${C.cream}`,
                  background: 'rgba(255,255,255,0.7)',
                  color: C.forest,
                }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: `${C.forest}60` }}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded"
                style={{ accentColor: C.forest }}
              />
              <span className="text-sm" style={{ color: `${C.forest}80` }}>Remember me</span>
            </label>
            <Link
              to="/forgot-password"
              className="text-sm font-medium hover:underline"
              style={{ color: C.forest }}
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-60"
            style={{ background: C.forest, color: C.parchment }}
          >
            {isLoading ? "Signing In…" : "Sign In"}
          </button>

          <button
            type="button"
            onClick={handleCancel}
            disabled={isLoading}
            className="w-full py-3 rounded-xl text-sm font-medium transition-colors"
            style={{
              border: `1.5px solid ${C.cream}`,
              background: 'transparent',
              color: `${C.forest}80`,
            }}
          >
            Cancel
          </button>
        </form>

        {/* OAuth divider */}
        <div className="my-6 relative flex items-center">
          <div className="flex-1" style={{ borderTop: `1px solid ${C.cream}` }} />
          <span
            className="px-3 text-xs uppercase tracking-wider"
            style={{ color: `${C.forest}60`, fontFamily: 'var(--font-mono)' }}
          >
            or continue with
          </span>
          <div className="flex-1" style={{ borderTop: `1px solid ${C.cream}` }} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleOAuthLogin("google")}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-white/60 disabled:opacity-50"
            style={{ border: `1.5px solid ${C.cream}`, background: 'rgba(255,255,255,0.4)', color: C.forest }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google
          </button>
          <button
            type="button"
            onClick={() => handleOAuthLogin("facebook")}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-white/60 disabled:opacity-50"
            style={{ border: `1.5px solid ${C.cream}`, background: 'rgba(255,255,255,0.4)', color: C.forest }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#1877F2">
              <path d="M24 12.073C24 5.404 18.627 0 12 0S0 5.404 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
            </svg>
            Facebook
          </button>
        </div>

        <p className="mt-6 text-center text-sm" style={{ color: `${C.forest}70` }}>
          Don't have an account?{" "}
          <Link
            to={nextPath ? `/register?next=${encodeURIComponent(nextPath)}` : "/register"}
            className="font-semibold hover:underline"
            style={{ color: C.forest }}
          >
            Create one free
          </Link>
        </p>

        <div className="mt-5 flex items-center justify-center gap-2 text-xs" style={{ color: `${C.forest}50` }}>
          <Shield className="w-3.5 h-3.5" />
          <span>Protected by 256-bit encryption</span>
        </div>
      </div>
    </AuthLayout>
  );
}