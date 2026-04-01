'use client';

import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from "react";
import { Link, useNavigate } from "@/lib/router-compat";
import { Shield, AlertCircle } from "lucide-react";
import { AuthLayout } from "@/components/AuthLayout";

const C = { forest: '#1A3C28', cream: '#EAD9C4', egreen: '#00E87A', parchment: '#F2E8D5' };

export default function MFAVerify() {
  const navigate = useNavigate();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError("");

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all fields are filled
    if (index === 5 && value) {
      handleVerify(newCode.join(""));
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newCode = pastedData.split("");
    while (newCode.length < 6) newCode.push("");
    setCode(newCode);

    if (pastedData.length === 6) {
      handleVerify(pastedData);
    }
  };

  // NOTE: TOTP MFA enforcement is not yet wired to the backend (Sprint 02 scope).
  // The login endpoint in the current API returns tokens without requiring a TOTP
  // step.  This screen is a placeholder; MFA enforcement will be added in a future
  // sprint.  For now, treat a 6-digit submission as a passthrough.
  const handleVerify = (codeString: string) => {
    void codeString;
    setIsVerifying(true);
    setError("");
    navigate("/app/listings");
    setIsVerifying(false);
  };

  const handleResend = () => {
    setError("");
    setCode(["", "", "", "", "", ""]);
    inputRefs.current[0]?.focus();
  };

  return (
    <AuthLayout variant="centered">
      <div>
        <div className="text-center mb-6">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: `${C.egreen}18` }}
          >
            <Shield className="w-7 h-7" style={{ color: C.forest }} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: 24, fontWeight: 700, color: C.forest, marginBottom: 6 }}>
            Two-Factor Authentication
          </h1>
          <p className="text-sm" style={{ color: `${C.forest}70` }}>
            Enter the 6-digit code from your authenticator app
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl flex items-start gap-2.5" style={{ background: '#FEF2F2', border: '1px solid #FCA5A5' }}>
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span className="text-sm text-red-800">{error}</span>
          </div>
        )}

        <div className="mb-6">
          <div className="flex gap-2 justify-center">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                title={`MFA digit ${index + 1}`}
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                className="w-11 h-13 text-center text-xl font-mono rounded-xl focus:outline-none focus:ring-2"
                style={{
                  border: `2px solid ${digit ? C.forest : C.cream}`,
                  background: digit ? `${C.forest}08` : 'rgba(255,255,255,0.7)',
                  color: C.forest,
                  height: 52,
                }}
                disabled={isVerifying}
              />
            ))}
          </div>
        </div>

        <button
          onClick={() => handleVerify(code.join(""))}
          disabled={code.some((d) => !d) || isVerifying}
          className="w-full py-3 rounded-xl text-sm font-semibold mb-4 disabled:opacity-60"
          style={{ background: C.forest, color: C.parchment }}
        >
          {isVerifying ? "Verifying…" : "Verify"}
        </button>

        <div className="text-center space-y-3">
          <button
            onClick={handleResend}
            className="text-sm"
            disabled={isVerifying}
            style={{ color: `${C.forest}70` }}
          >
            Didn&apos;t receive a code? Try again
          </button>
          <div>
            <Link to="/login" className="text-sm font-semibold hover:underline" style={{ color: C.forest }}>
              Back to Sign In
            </Link>
          </div>
        </div>

        <div
          className="mt-5 p-3.5 rounded-xl"
          style={{ background: `${C.forest}08`, border: `1px solid ${C.forest}18` }}
        >
          <p className="text-xs" style={{ color: `${C.forest}70` }}>
            <strong style={{ color: C.forest }}>Tip:</strong> If you&apos;ve lost access to your authenticator app, contact support for account recovery options.
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
