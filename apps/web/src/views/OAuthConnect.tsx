'use client';

import { useState } from "react";
import { Link, useNavigate } from "@/lib/router-compat";
import { Chrome, ArrowRight, AlertCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { authApi, ApiError } from "@/lib/api-client";
import { saveAuthSession } from "@/lib/auth-session";
import { AuthLayout } from "@/components/AuthLayout";

const C = { forest: '#1A3C28', cream: '#EAD9C4', egreen: '#00E87A', parchment: '#F2E8D5', amber: '#B89040' };

type Provider = "google" | "apple" | "facebook";

export default function OAuthConnect() {
  const navigate = useNavigate();
  const searchParams = useSearchParams();
  const queryProvider = searchParams.get("provider");
  const initialProvider: Provider =
    queryProvider === "apple" || queryProvider === "facebook" || queryProvider === "google"
      ? queryProvider
      : "google";

  const [selectedProvider, setSelectedProvider] = useState<Provider>(initialProvider);
  const [isConnecting, setIsConnecting] = useState(false);
  const [email, setEmail] = useState("");
  const [providerToken, setProviderToken] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");

  const handleConnect = async () => {
    setError("");
    setIsConnecting(true);

    try {
      const response = await authApi.oauthLogin(selectedProvider, {
        providerToken,
        email,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
      });
      saveAuthSession(response);
      navigate("/app/listings");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Unable to connect OAuth account right now.");
      }
      setIsConnecting(false);
      return;
    }

    setIsConnecting(false);
  };

  return (
    <AuthLayout variant="centered">
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '1.75rem', fontWeight: 700, color: C.forest, marginBottom: '0.375rem' }}>
          Connect Your Account
        </h1>
        <p style={{ color: `${C.forest}80`, fontSize: '0.875rem', margin: 0 }}>Continue with your preferred provider</p>
      </div>

      {error && (
        <div style={{ marginBottom: '1rem', padding: '0.875rem 1rem', backgroundColor: '#fee2e230', border: '1px solid #fca5a5', borderRadius: '0.5rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
          <AlertCircle style={{ width: '1.25rem', height: '1.25rem', color: '#dc2626', flexShrink: 0, marginTop: '0.125rem' }} />
          <span style={{ fontSize: '0.875rem', color: '#991b1b' }}>{error}</span>
        </div>
      )}

      {isConnecting ? (
        <div style={{ padding: '3rem 0', textAlign: 'center' }}>
          <div style={{ width: '3rem', height: '3rem', border: `3px solid ${C.cream}`, borderTopColor: C.forest, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
          <p style={{ color: C.forest, fontWeight: 500, margin: '0 0 0.375rem' }}>Connecting to {selectedProvider}…</p>
          <p style={{ fontSize: '0.875rem', color: `${C.forest}60`, margin: 0 }}>Please wait</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {/* Google */}
          <button
            type="button"
            onClick={() => setSelectedProvider('google')}
            style={{ padding: '0.875rem 1.25rem', border: `2px solid ${selectedProvider === 'google' ? C.forest : C.cream}`, borderRadius: '0.75rem', background: selectedProvider === 'google' ? `${C.forest}08` : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'border-color 0.2s', outline: 'none' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '2.5rem', height: '2.5rem', background: C.parchment, borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Chrome style={{ width: '1.25rem', height: '1.25rem', color: C.forest }} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 600, color: C.forest, fontSize: '0.875rem' }}>Continue with Google</div>
                <div style={{ fontSize: '0.75rem', color: `${C.forest}70` }}>Use your Google account</div>
              </div>
            </div>
            <ArrowRight style={{ width: '1.25rem', height: '1.25rem', color: `${C.forest}50` }} />
          </button>

          {/* Microsoft */}
          <button
            type="button"
            onClick={() => setSelectedProvider('apple')}
            style={{ padding: '0.875rem 1.25rem', border: `2px solid ${selectedProvider === 'apple' ? C.forest : C.cream}`, borderRadius: '0.75rem', background: selectedProvider === 'apple' ? `${C.forest}08` : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'border-color 0.2s', outline: 'none' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '2.5rem', height: '2.5rem', background: C.parchment, borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg style={{ width: '1.25rem', height: '1.25rem' }} viewBox="0 0 24 24" fill="none">
                  <path fill="#f25022" d="M0 0h11.377v11.372H0z" />
                  <path fill="#00a4ef" d="M12.623 0H24v11.372H12.623z" />
                  <path fill="#7fba00" d="M0 12.628h11.377V24H0z" />
                  <path fill="#ffb900" d="M12.623 12.628H24V24H12.623z" />
                </svg>
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 600, color: C.forest, fontSize: '0.875rem' }}>Continue with Microsoft</div>
                <div style={{ fontSize: '0.75rem', color: `${C.forest}70` }}>Use your Microsoft account</div>
              </div>
            </div>
            <ArrowRight style={{ width: '1.25rem', height: '1.25rem', color: `${C.forest}50` }} />
          </button>

          {/* Form fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingTop: '0.375rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: C.forest, marginBottom: '0.375rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                required
                style={{ width: '100%', padding: '0.625rem 0.875rem', border: `1.5px solid ${C.cream}`, borderRadius: '0.5rem', outline: 'none', fontFamily: 'var(--font-jakarta)', fontSize: '0.875rem', color: C.forest, background: 'white', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 700, color: C.forest, marginBottom: '0.375rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Provider Token
              </label>
              <input
                type="text"
                value={providerToken}
                onChange={(e) => setProviderToken(e.target.value)}
                placeholder="Paste provider token"
                required
                style={{ width: '100%', padding: '0.625rem 0.875rem', border: `1.5px solid ${C.cream}`, borderRadius: '0.5rem', outline: 'none', fontFamily: 'var(--font-jakarta)', fontSize: '0.875rem', color: C.forest, background: 'white', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name (optional)"
                style={{ padding: '0.625rem 0.875rem', border: `1.5px solid ${C.cream}`, borderRadius: '0.5rem', outline: 'none', fontFamily: 'var(--font-jakarta)', fontSize: '0.875rem', color: C.forest, background: 'white' }}
              />
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name (optional)"
                style={{ padding: '0.625rem 0.875rem', border: `1.5px solid ${C.cream}`, borderRadius: '0.5rem', outline: 'none', fontFamily: 'var(--font-jakarta)', fontSize: '0.875rem', color: C.forest, background: 'white' }}
              />
            </div>
            <button
              type="button"
              onClick={handleConnect}
              disabled={!email || !providerToken || isConnecting}
              style={{ width: '100%', padding: '0.75rem', background: (!email || !providerToken || isConnecting) ? `${C.forest}50` : C.forest, color: C.egreen, border: 'none', borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.9375rem', fontFamily: 'var(--font-jakarta)', cursor: (!email || !providerToken || isConnecting) ? 'not-allowed' : 'pointer', transition: 'background 0.2s', letterSpacing: '0.01em' }}
            >
              Connect Account
            </button>
          </div>

          <div style={{ borderTop: `1px solid ${C.cream}`, paddingTop: '1rem' }}>
            <button
              type="button"
              onClick={() => navigate('/register')}
              style={{ width: '100%', padding: '0.75rem', background: 'transparent', color: C.forest, border: `1.5px solid ${C.cream}`, borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.875rem', fontFamily: 'var(--font-jakarta)', cursor: 'pointer' }}
            >
              Continue with Email
            </button>
          </div>
        </div>
      )}

      <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
        <p style={{ fontSize: '0.875rem', color: `${C.forest}80`, margin: 0 }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: C.forest, fontWeight: 700, textDecoration: 'none', borderBottom: `2px solid ${C.egreen}` }}>
            Sign In
          </Link>
        </p>
      </div>

      <div style={{ marginTop: '1rem', padding: '0.875rem', background: `${C.parchment}70`, border: `1px solid ${C.cream}`, borderRadius: '0.5rem' }}>
        <p style={{ fontSize: '0.75rem', color: `${C.forest}90`, lineHeight: 1.6, margin: 0 }}>
          By continuing, you agree to BuildTrust's{' '}
          <Link to="#" style={{ color: C.forest, textDecoration: 'underline' }}>Terms of Service</Link>{' '}
          and{' '}
          <Link to="#" style={{ color: C.forest, textDecoration: 'underline' }}>Privacy Policy</Link>
          . We'll never post without your permission.
        </p>
      </div>
    </AuthLayout>
  );
}
