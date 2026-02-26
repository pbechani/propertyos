'use client';

import { useState } from "react";
import { Link, useNavigate } from "@/lib/router-compat";
import { Home, Shield, Smartphone, Copy, Check, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <Badge className="bg-blue-100 text-blue-800">Step {step} of 2</Badge>
              {step === 2 && (
                <button
                  onClick={() => setStep(1)}
                  className="text-sm text-gray-600 hover:text-black flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              )}
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Enable Two-Factor Authentication</h1>
            <p className="text-gray-600">
              Add an extra layer of security to your account
            </p>
          </div>

          {step === 1 ? (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Step 1: Download an authenticator app</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Download an authenticator app on your phone if you don't have one already:
                </p>
                <div className="space-y-2">
                  <Card className="p-3 border-gray-200">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-5 h-5 text-gray-600" />
                      <div>
                        <div className="font-medium text-sm">Google Authenticator</div>
                        <div className="text-xs text-gray-500">iOS & Android</div>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-3 border-gray-200">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-5 h-5 text-gray-600" />
                      <div>
                        <div className="font-medium text-sm">Microsoft Authenticator</div>
                        <div className="text-xs text-gray-500">iOS & Android</div>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-3 border-gray-200">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-5 h-5 text-gray-600" />
                      <div>
                        <div className="font-medium text-sm">Authy</div>
                        <div className="text-xs text-gray-500">iOS & Android</div>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>

              <Button
                onClick={() => setStep(2)}
                className="w-full bg-black hover:bg-gray-800 text-white"
              >
                Continue
              </Button>

              <div className="text-center">
                <button
                  onClick={() => navigate("/app/listings")}
                  className="text-sm text-gray-600 hover:text-black"
                >
                  Skip for now
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Step 2: Scan QR code</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Open your authenticator app and scan this QR code:
                </p>
                <div className="bg-white border-2 border-gray-200 rounded-lg p-6 flex items-center justify-center">
                  {/* QR Code Placeholder */}
                  <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <div className="text-xs mb-2">QR CODE</div>
                      <div className="text-6xl">⬛⬜⬛</div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-900 mb-2">
                  Or enter this key manually:
                </div>
                <div className="flex items-center gap-2">
                  <Card className="flex-1 p-3 border-gray-200 bg-gray-50">
                    <code className="text-sm font-mono">{secretKey}</code>
                  </Card>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyKey}
                    className="border-gray-300"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Enter Verification Code
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-center text-2xl font-mono tracking-widest"
                  maxLength={6}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>

              <Button
                onClick={handleVerify}
                disabled={verificationCode.length !== 6}
                className="w-full bg-black hover:bg-gray-800 text-white"
              >
                Verify & Enable
              </Button>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-800 leading-relaxed">
                  <strong>Important:</strong> Save your backup codes in a safe place. You'll need
                  them to access your account if you lose your phone.
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}