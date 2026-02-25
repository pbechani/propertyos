'use client';

import { useEffect, useState } from "react";
import { useNavigate } from "@/lib/router-compat";
import { Home, Clock, AlertCircle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { clearAuthSession } from "@/lib/auth-session";

export default function SessionExpired() {
  const navigate = useNavigate();
  const [expiredAt, setExpiredAt] = useState<string | null>(null);

  useEffect(() => {
    setExpiredAt(new Date().toLocaleTimeString());
  }, []);

  // Clear any stale session data when the user lands on this page.
  useEffect(() => {
    clearAuthSession();
  }, []);

  const handleSignIn = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
            <Home className="w-7 h-7 text-white" />
          </div>
          <span className="font-bold text-2xl">PropertyOS</span>
        </div>

        <Card className="p-8 border-gray-200">
          <div className="text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-10 h-10 text-orange-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Session Expired</h1>
            <p className="text-gray-600 mb-6">
              Your session has expired due to inactivity. Please sign in again to continue.
            </p>

            <Button
              onClick={handleSignIn}
              className="w-full bg-black hover:bg-gray-800 text-white mb-3"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign In Again
            </Button>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800 text-left">
                  <div className="font-semibold mb-1">Security Notice</div>
                  <div>
                    For your security, we automatically sign you out after 30 minutes of
                    inactivity. Your data is safe and will be available when you sign back in.
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-2 text-sm text-gray-600">
              <p>Session expired at: {expiredAt ?? "—"}</p>
              <p className="text-xs">
                If you were in the middle of something, don't worry - your progress has been saved
                automatically.
              </p>
            </div>
          </div>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Need help?{" "}
            <a href="#" className="text-black font-semibold hover:underline">
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}