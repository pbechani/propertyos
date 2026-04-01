'use client';

import { useState } from "react";
import { useNavigate } from "@/lib/router-compat";
import { Shield, Smartphone, Copy, Check, ArrowLeft } from "lucide-react";
import { AuthLayout } from "@/components/AuthLayout";

const C = { forest: '#1A3C28', cream: '#EAD9C4', egreen: '#00E87A', parchment: '#F2E8D5', amber: '#B89040' };

export default function MFASetup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [verificationCode, setVerificationCode] = useState("");
  const [copied, setCopied] = useState(false);
  // TOTP MFA setup is not yet wired to the backend (Sprint 02 scope).
  // The secret key and QR code generation endpoint will be added in a future sprint.
  // This UI is a placeholder to show the intended user flow.
  const secretKey = "TOTP-SETUP-PENDING";

  const handleCopyKey = () => {
    navigator.clipboard.writeText(secretKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = () => {
    if (verificationCode.length === 6) {
      // MFA backend not yet available — navigate to app directly.
      navigate("/app/listings");
    }
  };

  return (
    <AuthLayout variant="centered">
      <div>
        <div className="flex items-center justify-between mb-4">
          <span
            className="text-xs font-medium px-2.5 py-1 rounded-full"
            style={{ background: `${C.forest}12`, color: C.forest, fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}
          >
            STEP {step} OF 2
          </span>
          {step === 2 && (
            <button
              onClick={() => setStep(1)}
              className="text-sm flex items-center gap-1"
              style={{ color: `${C.forest}70` }}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          )}
        </div>

        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
          style={{ background: `${C.egreen}20` }}
        >
          <Shield className="w-5 h-5" style={{ color: C.forest }} />
        </div>

        <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 22, fontWeight: 700, color: C.forest, marginBottom: 4 }}>
          Enable Two-Factor Authentication
        </h1>
        <p className="text-sm mb-6" style={{ color: `${C.forest}70` }}>
          Add an extra layer of security to your account
        </p>

        {step === 1 ? (
          <div className="space-y-5">
            <div>
              <p className="text-sm font-medium mb-3" style={{ color: C.forest }}>
                Step 1: Download an authenticator app
              </p>
              <p className="text-xs mb-4" style={{ color: `${C.forest}70` }}>
                Download an authenticator app if you don&apos;t have one:
              </p>
              <div className="space-y-2">
                {["Google Authenticator", "Microsoft Authenticator", "Authy"].map((app) => (
                  <div
                    key={app}
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ border: `1px solid ${C.cream}`, background: 'rgba(255,255,255,0.6)' }}
                  >
                    <Smartphone className="w-4 h-4 shrink-0" style={{ color: C.forest }} />
                    <div>
                      <p className="text-sm font-medium" style={{ color: C.forest }}>{app}</p>
                      <p className="text-xs" style={{ color: `${C.forest}50` }}>iOS &amp; Android</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full py-3 rounded-xl text-sm font-semibold"
              style={{ background: C.forest, color: C.parchment }}
            >
              Continue
            </button>
            <div className="text-center">
              <button
                onClick={() => navigate("/app/listings")}
                className="text-sm"
                style={{ color: `${C.forest}60` }}
              >
                Skip for now
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <p className="text-sm font-medium mb-3" style={{ color: C.forest }}>Step 2: Scan QR code</p>
              <p className="text-xs mb-4" style={{ color: `${C.forest}70` }}>
                Open your authenticator app and scan this QR code:
              </p>
              <div
                className="rounded-xl p-6 flex items-center justify-center mb-4"
                style={{ border: `1.5px solid ${C.cream}`, background: 'rgba(255,255,255,0.5)' }}
              >
                <div
                  className="w-44 h-44 rounded-lg flex items-center justify-center"
                  style={{ background: `${C.forest}08` }}
                >
                  <div className="text-center" style={{ color: `${C.forest}40` }}>
                    <p className="text-xs mb-1" style={{ fontFamily: 'var(--font-mono)' }}>QR CODE</p>
                    <p className="text-4xl">⬛⬜⬛</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium mb-2" style={{ color: C.forest }}>Or enter this key manually:</p>
              <div className="flex items-center gap-2">
                <div
                  className="flex-1 p-3 rounded-xl"
                  style={{ border: `1px solid ${C.cream}`, background: `${C.forest}06` }}
                >
                  <code className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: C.forest }}>{secretKey}</code>
                </div>
                <button
                  onClick={handleCopyKey}
                  className="p-3 rounded-xl"
                  style={{ border: `1.5px solid ${C.cream}`, color: C.forest }}
                >
                  {copied ? <Check className="w-4 h-4" style={{ color: C.egreen }} /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: C.forest }}>
                Enter Verification Code
              </label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="w-full px-4 py-3 rounded-xl text-center text-xl tracking-widest focus:outline-none focus:ring-2"
                style={{ border: `1.5px solid ${C.cream}`, background: 'rgba(255,255,255,0.7)', color: C.forest, fontFamily: 'var(--font-mono)' }}
                maxLength={6}
              />
            </div>

            <button
              onClick={handleVerify}
              disabled={verificationCode.length !== 6}
              className="w-full py-3 rounded-xl text-sm font-semibold disabled:opacity-60"
              style={{ background: C.forest, color: C.parchment }}
            >
              Verify &amp; Enable
            </button>

            <div
              className="p-3.5 rounded-xl flex items-start gap-2.5"
              style={{ background: `${C.amber}15`, border: `1px solid ${C.amber}40` }}
            >
              <p className="text-xs" style={{ color: `${C.forest}80` }}>
                <strong style={{ color: C.forest }}>Important:</strong> Save your backup codes in a safe place. You&apos;ll need them if you lose your phone.
              </p>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
