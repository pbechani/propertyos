import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { Home, Mail, CheckCircle, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";

export default function EmailVerification() {
  const navigate = useNavigate();
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<"pending" | "success" | "error">("pending");
  const email = "user@example.com"; // Mock email

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResend = () => {
    setResendCooldown(60);
    // Mock resend logic
    alert("Verification email sent!");
  };

  const handleVerify = () => {
    setIsVerifying(true);
    // Simulate verification
    setTimeout(() => {
      setVerificationStatus("success");
      setIsVerifying(false);
      setTimeout(() => {
        navigate("/role-selection");
      }, 2000);
    }, 1500);
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
          {verificationStatus === "success" ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Email Verified!</h1>
              <p className="text-gray-600">
                Your email has been successfully verified. Redirecting you...
              </p>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-blue-600" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Verify Your Email</h1>
                <p className="text-gray-600 mb-4">
                  We've sent a verification link to
                </p>
                <div className="font-semibold text-black">{email}</div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-700 leading-relaxed">
                  Click the link in the email to verify your account. If you don't see the email,
                  check your spam folder.
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleVerify}
                  disabled={isVerifying}
                  className="w-full bg-black hover:bg-gray-800 text-white"
                >
                  {isVerifying ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "I've Verified My Email"
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={handleResend}
                  disabled={resendCooldown > 0}
                  className="w-full border-gray-300"
                >
                  {resendCooldown > 0 ? (
                    `Resend in ${resendCooldown}s`
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Resend Email
                    </>
                  )}
                </Button>
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Wrong email?{" "}
                  <Link to="/register" className="text-black font-semibold hover:underline">
                    Change Email
                  </Link>
                </p>
              </div>

              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <div className="font-semibold mb-1">Important</div>
                    <div>
                      The verification link will expire in 24 hours. Make sure to verify your
                      email before then.
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}