'use client';

import { useState } from "react";
import { Link, useNavigate } from "@/lib/router-compat";
import { Mail, Lock, Eye, EyeOff, User, Phone, Shield, CheckCircle, AlertCircle } from "lucide-react";
import { authApi, ApiError } from "@/lib/api-client";
import { saveAuthSession } from "@/lib/auth-session";
import { useSearchParams } from "next/navigation";
import { AuthLayout } from "@/components/AuthLayout";

const C = { forest: '#1A3C28', cream: '#EAD9C4', egreen: '#00E87A', parchment: '#F2E8D5' };

const REGISTER_TRUST_ITEMS = [
  {
    icon: <Shield className="w-4 h-4" />,
    label: 'KYC Verification',
    sub: 'Identity verified before any transaction',
  },
  {
    icon: <CheckCircle className="w-4 h-4" />,
    label: 'Escrow Protected',
    sub: 'Funds held securely until legal transfer',
  },
  {
    icon: <Shield className="w-4 h-4" />,
    label: 'Compliance Ready',
    sub: 'GDPR & POPIA compliant by design',
  },
  {
    icon: <CheckCircle className="w-4 h-4" />,
    label: 'Diaspora Trusted',
    sub: 'Built for remote cross-border investors',
  },
];

export default function Register() {
  const navigate = useNavigate();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const nextPathParam = searchParams.get('next');
  const hasSafeNextPath = Boolean(nextPathParam && nextPathParam.startsWith('/') && !nextPathParam.startsWith('//'));
  const nextPath = hasSafeNextPath ? nextPathParam : null;

  const handleNext = async () => {
    setError("");

    if (!validateStep(currentStep)) return;

    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
      setFieldErrors({});
      return;
    }

    setIsSubmitting(true);

    try {
      const VALID_ROLES = ['buyer_seller','investor','contractor','supplier','agent','conveyancer','inspector','truck_operator'];
      const storedRole = typeof window !== "undefined" ? sessionStorage.getItem("pribec.pending_role") : null;
      const pendingRole = storedRole && VALID_ROLES.includes(storedRole) ? storedRole : undefined;

      const response = await authApi.register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        role: pendingRole,
      });

      if (typeof window !== "undefined") {
        sessionStorage.removeItem("pribec.pending_role");
      }

      saveAuthSession(response);
      if (nextPath) {
        navigate(nextPath);
      } else {
        navigate(`/email-verification?email=${encodeURIComponent(formData.email)}`);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setError("An account with this email already exists. Try signing in instead.");
        } else if (err.status === 400) {
          setError("Unable to create account. Please check your details and try again.");
        } else if (err.status >= 500) {
          setError("Server error while creating your account. Please try again shortly.");
        } else {
          setError("Unable to create account right now. Please try again.");
        }
      } else {
        setError("Unable to create account right now. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear the error for this field as the user types
    if (fieldErrors[field]) {
      setFieldErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
    }
  };

  const validateStep = (step: number): boolean => {
    const errs: Record<string, string> = {};

    if (step === 1) {
      if (!formData.email.trim()) {
        errs.email = 'Email address is required.';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        errs.email = 'Enter a valid email address.';
      }
      if (!formData.phone.trim()) {
        errs.phone = 'Phone number is required.';
      } else if (!/^[+]?[\d\s()\-]{7,20}$/.test(formData.phone.trim())) {
        errs.phone = 'Enter a valid phone number (e.g. +27 82 123 4567).';
      }
    }

    if (step === 2) {
      if (!formData.firstName.trim()) {
        errs.firstName = 'First name is required.';
      } else if (formData.firstName.trim().length < 2) {
        errs.firstName = 'First name must be at least 2 characters.';
      } else if (!/^[\p{L}\s'\-]+$/u.test(formData.firstName.trim())) {
        errs.firstName = 'First name can only contain letters.';
      }
      if (!formData.lastName.trim()) {
        errs.lastName = 'Last name is required.';
      } else if (formData.lastName.trim().length < 2) {
        errs.lastName = 'Last name must be at least 2 characters.';
      } else if (!/^[\p{L}\s'\-]+$/u.test(formData.lastName.trim())) {
        errs.lastName = 'Last name can only contain letters.';
      }
    }

    if (step === 3) {
      if (!formData.password) {
        errs.password = 'Password is required.';
      } else if (formData.password.length < 8) {
        errs.password = 'Password must be at least 8 characters.';
      } else if (!/[A-Z]/.test(formData.password)) {
        errs.password = 'Password must contain at least one uppercase letter.';
      } else if (!/[0-9]/.test(formData.password)) {
        errs.password = 'Password must contain at least one number.';
      }
      if (!formData.confirmPassword) {
        errs.confirmPassword = 'Please confirm your password.';
      } else if (formData.password !== formData.confirmPassword) {
        errs.confirmPassword = 'Passwords do not match.';
      }
      if (!formData.agreeToTerms) {
        errs.agreeToTerms = 'You must agree to the terms before creating your account.';
      }
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const steps = [
    { number: 1, title: "Account Details", description: "Create your secure account" },
    { number: 2, title: "Personal Info", description: "Tell us about yourself" },
    { number: 3, title: "Security", description: "Protect your account" },
  ];

  const hasPasswordMismatch =
    formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword;

  const isCreateAccountDisabled = isSubmitting;

  const inputCls = "w-full pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2";
  const inputStyle = { border: `1.5px solid ${C.cream}`, background: 'rgba(255,255,255,0.7)', color: C.forest };
  const labelStyle = { color: C.forest, marginBottom: 6, fontSize: 13, fontWeight: 500 as const };
  const iconStyle = { color: `${C.forest}60` };

  return (
    <AuthLayout
      variant="split"
      panelTagline="JOIN BUILDTRUST"
      panelTitle="Verified accounts for the whole chain"
      panelHighlight="Verified"
      trustItems={REGISTER_TRUST_ITEMS}
    >
      <div>
        {/* Progress steps */}
        <div className="mb-7 flex flex-col items-center">
          <div className="flex items-center gap-0 w-64">
            {steps.map((step, idx) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs shrink-0"
                    style={{
                      background: currentStep >= step.number ? C.forest : `${C.forest}18`,
                      color: currentStep >= step.number ? C.parchment : `${C.forest}60`,
                    }}
                  >
                    {currentStep > step.number
                      ? <CheckCircle className="w-4 h-4" />
                      : step.number}
                  </div>
                  <span
                    className="hidden md:block text-xs mt-1.5 text-center whitespace-nowrap"
                    style={{ color: currentStep >= step.number ? C.forest : `${C.forest}50`, fontSize: 10 }}
                  >
                    {step.title}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className="flex-1 h-0.5 mx-2 mb-4"
                    style={{ background: currentStep > step.number ? C.forest : `${C.forest}18` }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <h2
          style={{
            fontFamily: 'var(--font-fraunces)', fontSize: 24, fontWeight: 700,
            color: C.forest, marginBottom: 4, letterSpacing: '-0.02em', textAlign: 'center',
          }}
        >
          {steps[currentStep - 1].title}
        </h2>
        <p style={{ color: `${C.forest}70`, marginBottom: 20, fontSize: 14, textAlign: 'center' }}>
          {steps[currentStep - 1].description}
        </p>

        {error && (
          <div
            className="mb-5 p-3.5 rounded-xl flex items-start gap-3"
            style={{ background: '#FEF2F2', border: '1px solid #FCA5A5' }}
          >
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span className="text-sm text-red-800">{error}</span>
          </div>
        )}

        {/* Step 1: Account Details */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => navigate("/oauth-connect?provider=google")}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-3 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-white/60 disabled:opacity-50"
                style={{ border: `1.5px solid ${C.cream}`, background: 'rgba(255,255,255,0.4)', color: C.forest }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </button>
              <button
                type="button"
                onClick={() => navigate("/oauth-connect?provider=facebook")}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-3 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-white/60 disabled:opacity-50"
                style={{ border: `1.5px solid ${C.cream}`, background: 'rgba(255,255,255,0.4)', color: C.forest }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Continue with Facebook
              </button>
            </div>

            <div className="relative my-4 flex items-center gap-3">
              <div className="flex-1" style={{ borderTop: `1px solid ${C.cream}` }} />
              <span className="text-xs" style={{ color: `${C.forest}60`, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }}>
                OR EMAIL
              </span>
              <div className="flex-1" style={{ borderTop: `1px solid ${C.cream}` }} />
            </div>

            <div>
              <label className="block" style={labelStyle}>Email Address *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={iconStyle} />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="your.email@example.com"
                  className={inputCls}
                  style={{ ...inputStyle, border: `1.5px solid ${fieldErrors.email ? '#FCA5A5' : C.cream}` }}
                />
              </div>
              {fieldErrors.email && <p className="mt-1.5 text-xs text-red-600">{fieldErrors.email}</p>}
            </div>

            <div>
              <label className="block" style={labelStyle}>Phone Number *</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={iconStyle} />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="+27 82 123 4567"
                  className={inputCls}
                  style={{ ...inputStyle, border: `1.5px solid ${fieldErrors.phone ? '#FCA5A5' : C.cream}` }}
                />
              </div>
              {fieldErrors.phone && <p className="mt-1.5 text-xs text-red-600">{fieldErrors.phone}</p>}
            </div>
          </div>
        )}

        {/* Step 2: Personal Info */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block" style={labelStyle}>First Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={iconStyle} />
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleChange("firstName", e.target.value)}
                    placeholder="John"
                    className={inputCls}
                    style={{ ...inputStyle, border: `1.5px solid ${fieldErrors.firstName ? '#FCA5A5' : C.cream}` }}
                  />
                </div>
                {fieldErrors.firstName && <p className="mt-1.5 text-xs text-red-600">{fieldErrors.firstName}</p>}
              </div>
              <div>
                <label className="block" style={labelStyle}>Last Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={iconStyle} />
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleChange("lastName", e.target.value)}
                    placeholder="Doe"
                    className={inputCls}
                    style={{ ...inputStyle, border: `1.5px solid ${fieldErrors.lastName ? '#FCA5A5' : C.cream}` }}
                  />
                </div>
                {fieldErrors.lastName && <p className="mt-1.5 text-xs text-red-600">{fieldErrors.lastName}</p>}
              </div>
            </div>

            <div
              className="flex items-start gap-3 p-4 rounded-xl"
              style={{ background: `${C.forest}0D`, border: `1px solid ${C.forest}1A` }}
            >
              <Shield className="w-4 h-4 mt-0.5 shrink-0" style={{ color: C.forest }} />
              <div>
                <p className="font-medium text-sm" style={{ color: C.forest }}>Privacy Protected</p>
                <p className="text-xs mt-0.5" style={{ color: `${C.forest}70` }}>
                  Your personal information is encrypted and never shared without consent.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Security */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div>
              <label className="block" style={labelStyle}>Password *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={iconStyle} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  placeholder="Create a strong password"
                  className="w-full pl-10 pr-12 py-3 rounded-xl text-sm focus:outline-none focus:ring-2"
                  style={{ ...inputStyle, border: `1.5px solid ${fieldErrors.password ? '#FCA5A5' : C.cream}` }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2" style={iconStyle}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && <p className="mt-1.5 text-xs text-red-600">{fieldErrors.password}</p>}
              <div className="mt-2 flex gap-4 flex-wrap">
                {[
                  [formData.password.length >= 8, '8+ chars'],
                  [/[A-Z]/.test(formData.password), 'Uppercase'],
                  [/[0-9]/.test(formData.password), 'Number'],
                ].map(([met, label]) => (
                  <div key={String(label)} className="flex items-center gap-1.5 text-xs">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: met ? C.egreen : `${C.forest}30` }} />
                    <span style={{ color: met ? C.forest : `${C.forest}50` }}>{String(label)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block" style={labelStyle}>Confirm Password *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={iconStyle} />
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange("confirmPassword", e.target.value)}
                  placeholder="Re-enter your password"
                  className={inputCls}
                  style={{ ...inputStyle, border: `1.5px solid ${fieldErrors.confirmPassword || hasPasswordMismatch ? '#FCA5A5' : C.cream}` }}
                />
              </div>
              {(fieldErrors.confirmPassword || hasPasswordMismatch) && (
                <p className="mt-1.5 text-xs text-red-600">{fieldErrors.confirmPassword || 'Passwords do not match.'}</p>
              )}
            </div>

            <div>
              <div className="flex items-start gap-2.5">
                <input
                  id="agreeToTerms"
                  type="checkbox"
                  checked={formData.agreeToTerms}
                  onChange={(e) => handleChange("agreeToTerms", e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded"
                  style={{ accentColor: C.forest }}
                />
                <label htmlFor="agreeToTerms" className="text-xs" style={{ color: `${C.forest}80` }}>
                  I agree to the{' '}
                  <a href="#" className="font-medium hover:underline" style={{ color: C.forest }}>Terms of Service</a>,{' '}
                  <a href="#" className="font-medium hover:underline" style={{ color: C.forest }}>Privacy Policy</a>, and{' '}
                  <a href="#" className="font-medium hover:underline" style={{ color: C.forest }}>Data Processing Agreement</a>
                </label>
              </div>
              {fieldErrors.agreeToTerms && <p className="mt-1.5 text-xs text-red-600">{fieldErrors.agreeToTerms}</p>}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-7">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={() => setCurrentStep(currentStep - 1)}
              className="flex-1 py-3 rounded-xl text-sm font-medium"
              style={{ border: `1.5px solid ${C.cream}`, background: 'transparent', color: C.forest }}
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={handleNext}
            disabled={isCreateAccountDisabled}
            className="flex-1 py-3 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-60"
            style={{ background: C.forest, color: C.parchment }}
          >
            {isSubmitting
              ? "Creating Account…"
              : currentStep === 3
              ? "Create Account"
              : "Continue"}
          </button>
        </div>

        <p className="mt-5 text-center text-sm" style={{ color: `${C.forest}70` }}>
          Already have an account?{' '}
          <Link
            to={nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login"}
            className="font-semibold hover:underline"
            style={{ color: C.forest }}
          >
            Sign In
          </Link>
        </p>

        <div className="mt-4 pt-4 flex items-center justify-center gap-2 text-xs" style={{ borderTop: `1px solid ${C.cream}`, color: `${C.forest}50` }}>
          <Shield className="w-3.5 h-3.5" />
          <span>Secured by 256-bit SSL encryption</span>
        </div>
      </div>
    </AuthLayout>
  );
}

