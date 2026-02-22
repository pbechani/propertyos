import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { Home, Lock, Eye, EyeOff, CheckCircle, X, Check } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Separator } from "../components/ui/separator";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const requirements = [
    { met: password.length >= 8, text: "At least 8 characters" },
    { met: /[A-Z]/.test(password), text: "One uppercase letter" },
    { met: /[a-z]/.test(password), text: "One lowercase letter" },
    { met: /[0-9]/.test(password), text: "One number" },
    { met: /[^A-Za-z0-9]/.test(password), text: "One special character" },
  ];

  const allRequirementsMet = requirements.every((req) => req.met);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!allRequirementsMet || !passwordsMatch) return;

    setIsLoading(true);
    // Mock API call
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    }, 1500);
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
              <Home className="w-7 h-7 text-white" />
            </div>
            <span className="font-bold text-2xl">PropertyOS</span>
          </Link>

          <Card className="p-8 border-gray-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Password Reset!</h1>
              <p className="text-gray-600 mb-6">
                Your password has been successfully reset. Redirecting you to sign in...
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

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
            <h1 className="text-2xl font-bold mb-2">Set New Password</h1>
            <p className="text-gray-600">
              Your new password must be different from previously used passwords.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
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

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {confirmPassword && (
                <div className="mt-2 text-sm">
                  {passwordsMatch ? (
                    <div className="flex items-center gap-1 text-green-600">
                      <Check className="w-4 h-4" />
                      Passwords match
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-red-600">
                      <X className="w-4 h-4" />
                      Passwords do not match
                    </div>
                  )}
                </div>
              )}
            </div>

            {password && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-900 mb-2">
                  Password Requirements:
                </div>
                <div className="space-y-2">
                  {requirements.map((req, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-2 text-sm ${
                        req.met ? "text-green-600" : "text-gray-600"
                      }`}
                    >
                      {req.met ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <X className="w-4 h-4 text-gray-400" />
                      )}
                      {req.text}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading || !allRequirementsMet || !passwordsMatch}
              className="w-full bg-black hover:bg-gray-800 text-white py-3"
            >
              {isLoading ? "Resetting..." : "Reset Password"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm text-black font-semibold hover:underline">
              Back to Sign In
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}