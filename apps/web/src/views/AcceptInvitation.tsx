'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useNavigate, Link } from '@/lib/router-compat';
import {
  Mail,
  CheckCircle,
  Building2,
  Shield,
  AlertCircle,
  Loader2,
  UserPlus,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  invitationsApi,
  ApiError,
  type InvitationPreview,
  type AuthResponse,
} from '@/lib/api-client';
import { saveAuthSession, getAccessToken, getSessionClaims } from '@/lib/auth-session';
import LoginEnhanced from '@/views/LoginEnhanced';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  agent: 'Real Estate Agency',
  contractor: 'Contractor',
  supplier: 'Supplier',
  conveyancer: 'Conveyancer',
  inspector: 'Inspector',
  logistics: 'Logistics',
  developing: 'Property Developer',
};

function formatRole(role: string) {
  return role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatExpiry(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' });
}

// ─── Shared components ────────────────────────────────────────────────────────

function FullPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">{children}</div>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

function InviteSummary({ inv }: { inv: InvitationPreview }) {
  return (
    <div className="mb-6 p-4 bg-gray-50 rounded-xl space-y-3 border border-gray-200">
      <div className="flex items-start gap-3">
        <Building2 className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs text-gray-500">Company</p>
          <p className="text-sm font-semibold text-gray-900">{inv.company_name}</p>
          <p className="text-xs text-indigo-600 font-medium">
            {CATEGORY_LABELS[inv.company_category] ?? inv.company_category}
          </p>
        </div>
      </div>
      <div className="flex items-start gap-3">
        <Shield className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs text-gray-500">Your role</p>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-gray-900">{formatRole(inv.role)}</p>
            {inv.is_admin && (
              <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">
                Admin
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-start gap-3">
        <Mail className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs text-gray-500">Sent to</p>
          <p className="text-sm text-gray-900">{inv.invited_email}</p>
        </div>
      </div>
      <p className="text-xs text-gray-500 pt-2 border-t border-gray-200">
        {inv.invited_by && (
          <>Invited by <strong className="text-gray-700">{inv.invited_by}</strong> · </>
        )}
        Expires <strong className="text-gray-700">{formatExpiry(inv.expires_at)}</strong>
      </p>
    </div>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────

type Step =
  | 'loading'
  | 'preview'
  | 'login'
  | 'register'
  | 'accepted'
  | 'expired'
  | 'already_accepted'
  | 'not_found'
  | 'error';

export default function AcceptInvitation() {
  const params = useParams<{ token: string }>();
  const token = params?.token ?? '';
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('loading');
  const [invitation, setInvitation] = useState<InvitationPreview | null>(null);
  const [newAccount, setNewAccount] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);


  // Register form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');

  // Check if user is already authenticated
  const existingToken = typeof window !== 'undefined' ? getAccessToken() : null;

  // ── Fetch invitation preview on mount ──────────────────────────────────────
  useEffect(() => {
    if (!token) { setStep('not_found'); return; }

    invitationsApi.preview(token)
      .then(async (inv) => {
        setInvitation(inv);

        // If the user is already logged in but with a different email, skip
        // straight to the login step so they're never shown an accept button
        // that will always fail with a confusing 403 error.
        const claims = getSessionClaims();
        if (claims?.email && claims.email.toLowerCase() !== inv.invited_email.toLowerCase()) {
          setError(`This invitation is for ${inv.invited_email}. Please log in with that account.`);
          setStep('login');
          return;
        }

        // If already logged in with the right account, show the accept button.
        if (claims?.email) {
          setStep('preview');
          return;
        }

        // No session — auto-detect whether the invited email has an account
        // so we can skip the "choose login or register" screen entirely.
        try {
          const { exists } = await invitationsApi.checkEmail(inv.invited_email);
          setStep(exists ? 'login' : 'register');
        } catch {
          // Fallback to preview so the user can choose manually
          setStep('preview');
        }
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError) {
          const msg = err.message.toLowerCase();
          if (err.status === 404) setStep('not_found');
          else if (msg.includes('expired')) setStep('expired');
          else if (msg.includes('already been accepted')) setStep('already_accepted');
          else setStep('error');
        } else {
          setStep('error');
        }
      });
  }, [token]);

  // ── Accept with already-logged-in token ───────────────────────────────────
  const handleAcceptExistingSession = async () => {
    if (!existingToken) return;
    setBusy(true);
    setError('');
    try {
      const result = await invitationsApi.accept(existingToken, token);
      // Save the fresh tokens — they include the new company role in the JWT
      saveAuthSession({
        user: result.user as AuthResponse['user'],
        tokens: result.tokens,
        requires_context_selection: false,
      });
      setStep('accepted');
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 403) {
        setError(`This invitation was sent to ${invitation?.invited_email}. Log in with that account.`);
      } else {
        setError('Failed to accept. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  // ── Login-then-accept callback passed into LoginEnhanced ─────────────────────
  const handleLoginSuccess = async (accessToken: string) => {
    try {
      const result = await invitationsApi.accept(accessToken, token);
      // Overwrite the just-saved login session with the richer tokens that
      // include the new company role so no second login is required.
      saveAuthSession({
        user: result.user as AuthResponse['user'],
        tokens: result.tokens,
        requires_context_selection: false,
      });
      setStep('accepted');
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 403) {
        setError(`This invitation is for ${invitation?.invited_email}. Please log in with that account.`);
      } else {
        setError('Failed to accept invitation after login. Please try again.');
      }
      setStep('login');
    }
  };

  // ── New user: register + accept atomically ────────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (regPassword !== regConfirm) { setError('Passwords do not match.'); return; }
    if (regPassword.length < 8) { setError('Password must be at least 8 characters.'); return; }

    setBusy(true);
    try {
      const result = await invitationsApi.registerAndAccept(token, {
        firstName,
        lastName,
        email: invitation!.invited_email,
        password: regPassword,
      });

      saveAuthSession({
        user: result.user as AuthResponse['user'],
        tokens: result.tokens,
        requires_context_selection: false,
      });
      setNewAccount(true);
      setStep('accepted');
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setError('An account with this email already exists. Use "I have an account" to log in.');
        } else if (err.status === 403) {
          setError('Registration email must match the invitation email.');
        } else {
          setError(err.message ?? 'Registration failed. Please check your details.');
        }
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (step === 'loading') {
    return (
      <FullPage>
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
          <p className="text-gray-500 text-sm">Loading invitation…</p>
        </div>
      </FullPage>
    );
  }

  if (step === 'not_found') {
    return (
      <FullPage>
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-semibold mb-2">Invitation Not Found</h1>
          <p className="text-gray-600 mb-6 text-sm">This link is invalid or has been removed.</p>
          <Link to="/login" className="text-indigo-600 hover:underline text-sm">Back to login</Link>
        </div>
      </FullPage>
    );
  }

  if (step === 'expired') {
    return (
      <FullPage>
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
          <h1 className="text-2xl font-semibold mb-2">Invitation Expired</h1>
          <p className="text-gray-600 mb-6 text-sm">
            Invitations are valid for 72 hours. Ask a company admin to send a new one.
          </p>
          <Link to="/login" className="text-indigo-600 hover:underline text-sm">Back to login</Link>
        </div>
      </FullPage>
    );
  }

  if (step === 'already_accepted') {
    return (
      <FullPage>
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h1 className="text-2xl font-semibold mb-2">Already Accepted</h1>
          <p className="text-gray-600 mb-6 text-sm">
            This invitation has already been used. Log in to access your dashboard.
          </p>
          <Link
            to="/login"
            className="inline-block w-full text-center bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
          >
            Go to Login
          </Link>
        </div>
      </FullPage>
    );
  }

  if (step === 'error') {
    return (
      <FullPage>
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-semibold mb-2">Something Went Wrong</h1>
          <p className="text-gray-600 mb-6 text-sm">
            We could not load this invitation. Please try again or contact support.
          </p>
          <Link to="/login" className="text-indigo-600 hover:underline text-sm">Back to login</Link>
        </div>
      </FullPage>
    );
  }

  if (step === 'accepted') {
    return (
      <FullPage>
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-semibold mb-1">
            {newAccount ? 'Account Created!' : 'Invitation Accepted!'}
          </h1>
          <p className="text-gray-500 text-sm mb-6">
            {newAccount
              ? 'Your account has been created and you have been added to the company.'
              : 'You have successfully joined the company.'}
          </p>
        </div>

        {invitation && (
          <div className="mb-6 p-4 bg-green-50 rounded-xl space-y-3 border border-green-200">
            <div className="flex items-start gap-3">
              <Building2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">You have joined</p>
                <p className="text-sm font-semibold text-gray-900">{invitation.company_name}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Your role</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900">{formatRole(invitation.role)}</p>
                  {invitation.is_admin && (
                    <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">
                      Admin
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">A welcome email has been sent to</p>
                <p className="text-sm text-gray-700">{invitation.invited_email}</p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => navigate('/app/listings')}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition font-medium mb-3"
        >
          Go to Dashboard
        </button>
        <button
          onClick={() => navigate('/')}
          className="w-full py-2.5 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition text-sm"
        >
          Go to Home
        </button>
      </FullPage>
    );
  }

  // ── PREVIEW ────────────────────────────────────────────────────────────────
  if (step === 'preview' && invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold mb-1">You&apos;re Invited!</h1>
            <p className="text-gray-500 text-sm">You&apos;ve been invited to join a company on PRIBEC</p>
          </div>

          <InviteSummary inv={invitation} />

          {error && <ErrorBanner message={error} />}

          {/* Already logged in — accept with current session */}
          {existingToken ? (
            <div>
              <button
                onClick={handleAcceptExistingSession}
                disabled={busy}
                className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium flex items-center justify-center gap-2 mb-3"
              >
                {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                {busy ? 'Joining…' : 'Accept Invitation'}
              </button>
              <p className="text-xs text-center text-gray-500">
                Not your account?{' '}
                <button onClick={() => { setError(''); setStep('login'); }} className="text-indigo-600 hover:underline">
                  Log in with a different account
                </button>
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                onClick={() => { setError(''); setStep('login'); }}
                className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" /> I already have an account
              </button>
              <button
                onClick={() => { setError(''); setStep('register'); }}
                className="w-full py-3 border-2 border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition font-medium flex items-center justify-center gap-2"
              >
                <UserPlus className="w-5 h-5" /> Create a new account
              </button>
            </div>
          )}

          <p className="text-center text-xs text-gray-400 mt-5">
            By accepting you agree to PRIBEC&apos;s{' '}
            <a href="/terms" className="text-indigo-600 hover:underline">Terms of Service</a>
          </p>
        </div>
      </div>
    );
  }

  // ── LOGIN ──────────────────────────────────────────────────────────────────
  if (step === 'login' && invitation) {
    return (
      <LoginEnhanced
        initialEmail={invitation.invited_email}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  // ── REGISTER ───────────────────────────────────────────────────────────────
  if (step === 'register' && invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
          <button onClick={() => { setError(''); setStep('preview'); }} className="text-sm text-gray-500 hover:text-gray-700 mb-5 flex items-center gap-1">
            ← Back
          </button>

          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-green-100 rounded-2xl mb-3">
              <UserPlus className="w-7 h-7 text-green-600" />
            </div>
            <h1 className="text-xl font-bold">Create your account</h1>
            <p className="text-sm text-gray-500 mt-1">
              Joining <strong className="text-gray-800">{invitation.company_name}</strong> as{' '}
              <strong className="text-gray-800">{formatRole(invitation.role)}</strong>
            </p>
          </div>

          {error && <ErrorBanner message={error} />}

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  required autoComplete="given-name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  required autoComplete="family-name" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-xs font-normal text-gray-400">(locked to invitation)</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="email" value={invitation.invited_email} readOnly
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-600 cursor-not-allowed" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  placeholder="min. 8 characters" minLength={8} required autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowPw((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPw2 ? 'text' : 'password'}
                  value={regConfirm}
                  onChange={(e) => setRegConfirm(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  placeholder="••••••••" required autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowPw2((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                  {showPw2 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-medium flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
              {busy ? 'Creating account…' : 'Create Account & Accept'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-5">
            By accepting you agree to PRIBEC&apos;s{' '}
            <a href="/terms" className="text-indigo-600 hover:underline">Terms of Service</a>
          </p>
        </div>
      </div>
    );
  }

  return null;
}
