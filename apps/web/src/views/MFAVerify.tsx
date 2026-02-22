'use client';

import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from "react";
import { Link, useNavigate } from "@/lib/router-compat";
import { Home, Shield, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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
  const handleVerify = (_codeString: string) => {
    setIsVerifying(true);
    setError("");
    navigate("/app");
    setIsVerifying(false);
  };

  const handleResend = () => {
    setError("");
    setCode(["", "", "", "", "", ""]);
    inputRefs.current[0]?.focus();
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
            <Home className="w-7 h-7 text-white" />
          </div>
          <span className="font-bold text-2xl">PropertyOS</span>
        </Link>

        <Card className="p-8 border-gray-200">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Two-Factor Authentication</h1>
            <p className="text-gray-600">
              Enter the 6-digit code from your authenticator app
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-800">{error}</div>
              </div>
            </div>
          )}

          <div className="mb-6">
            <div className="flex gap-2 justify-center">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className="w-12 h-14 text-center text-2xl font-mono border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                  disabled={isVerifying}
                />
              ))}
            </div>
          </div>

          <Button
            onClick={() => handleVerify(code.join(""))}
            disabled={code.some((d) => !d) || isVerifying}
            className="w-full bg-black hover:bg-gray-800 text-white mb-4"
          >
            {isVerifying ? "Verifying..." : "Verify"}
          </Button>

          <div className="text-center space-y-3">
            <button
              onClick={handleResend}
              className="text-sm text-gray-600 hover:text-black"
              disabled={isVerifying}
            >
              Didn't receive a code? Try again
            </button>
            <div>
              <Link
                to="/login"
                className="text-sm text-black font-semibold hover:underline"
              >
                Back to Sign In
              </Link>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800 leading-relaxed">
              <strong>Tip:</strong> If you've lost access to your authenticator app, contact
              support for account recovery options.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}