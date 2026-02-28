'use client';

import { useState, FormEvent, KeyboardEvent } from "react";
import { Link, useNavigate } from "@/lib/router-compat";
import { Home, Mail, Lock, Eye, EyeOff, Shield, Chrome, AlertCircle, Building2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { authApi, ApiError } from "@/lib/api-client";
import { saveAuthSession } from "@/lib/auth-session";
import { useSearchParams } from "next/navigation";

export default function LoginEnhanced() {
  const navigate = useNavigate();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const nextPathParam = searchParams.get('next');
  const hasSafeNextPath = Boolean(nextPathParam && nextPathParam.startsWith('/') && !nextPathParam.startsWith('//'));
  const nextPath = hasSafeNextPath ? nextPathParam : null;

  const handleCancel = () => {
    if (nextPath) {
      navigate(nextPath);
      return;
    }

    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
      return;
    }

    navigate('/');
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-black dark:bg-white rounded-lg flex items-center justify-center">
            <Home className="w-7 h-7 text-white dark:text-black" />
          </div>
          <span className="font-bold text-2xl">PropertyOS</span>
        </Link>

        <Card className="p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold mb-2">Welcome Back</h1>
            <p className="text-gray-600">Sign in to your account</p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="text-sm text-red-800">{error}</div>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={handleEnterSubmit}
                  placeholder="your.email@example.com"
                  className="w-full pl-10 pr-4 py-3 border border-border rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleEnterSubmit}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-12 py-3 border border-border rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 border-border rounded focus:ring-ring"
                />
                <span className="text-sm text-gray-600">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-sm text-primary hover:underline font-medium">
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full py-3"
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="w-full py-3"
              disabled={isLoading}
            >
              Cancel
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOAuthLogin("google")}
                className="border-gray-300"
                disabled={isLoading}
              >
                <Chrome className="w-5 h-5 mr-2" />
                Google
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOAuthLogin("apple")}
                className="border-gray-300"
                disabled={isLoading}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#f25022" d="M0 0h11.377v11.372H0z" />
                  <path fill="#00a4ef" d="M12.623 0H24v11.372H12.623z" />
                  <path fill="#7fba00" d="M0 12.628h11.377V24H0z" />
                  <path fill="#ffb900" d="M12.623 12.628H24V24H12.623z" />
                </svg>
                Apple
              </Button>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-sm text-center text-gray-500 mb-3">Don't have an account?</p>
            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/company-registration"
                className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                <Building2 className="w-4 h-4 shrink-0" />
                Business Partner
              </Link>
              <Link
                to={nextPath ? `/register?next=${encodeURIComponent(nextPath)}` : "/register"}
                className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                <User className="w-4 h-4 shrink-0" />
                Individual
              </Link>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-500">
            <Shield className="w-4 h-4" />
            <span>Protected by 256-bit encryption</span>
          </div>
        </Card>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          By signing in, you agree to our{" "}
          <Link to="#" className="text-foreground hover:underline">
            Terms
          </Link>{" "}
          and{" "}
          <Link to="#" className="text-foreground hover:underline">
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
}