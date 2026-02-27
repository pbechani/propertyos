'use client';

import { useState } from "react";
import { useNavigate, Link } from "@/lib/router-compat";
import { Mail, CheckCircle, Building2, Shield, Lock, AlertCircle } from "lucide-react";

type InvitationData = {
  companyName: string;
  companyCategory: string;
  role: string;
  isAdmin: boolean;
  email: string;
  invitedBy: string;
  expiresAt: string;
};

type InvitationState = "preview" | "existing_user" | "new_user" | "accepted" | "expired" | "not_found";

const STUB_INVITATION: InvitationData = {
  companyName: "Elite Properties Ltd.",
  companyCategory: "agent",
  role: "agent",
  isAdmin: false,
  email: "invited@example.com",
  invitedBy: "John Smith",
  expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
};

const CATEGORY_LABELS: Record<string, string> = {
  agent: "Real Estate Agent",
  contractor: "Contractor",
  supplier: "Supplier",
  conveyancer: "Conveyancer",
  inspector: "Inspector",
  logistics: "Logistics",
  developing: "Property Developer",
};

export default function AcceptInvitation() {
  const navigate = useNavigate();
  const [state, setState] = useState<InvitationState>("preview");
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // In production: token comes from URL params and triggers GET /api/v1/invitations/:token
  const invitation = STUB_INVITATION;

  const isExpired = new Date(invitation.expiresAt) < new Date();

  const handleExistingUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      // POST /api/v1/invitations/:token/accept — authenticated user
      setState("accepted");
    } catch {
      setError("Failed to accept invitation. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      // 1. POST /api/v1/auth/register with pre-filled email
      // 2. POST /api/v1/invitations/:token/accept
      setState("accepted");
    } catch {
      setError("Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl mb-2">Invitation Expired</h1>
          <p className="text-gray-600 mb-6">
            This invitation link has expired (valid for 72 hours). Please ask the company admin to
            send a new invitation.
          </p>
          <Link to="/login" className="text-indigo-600 hover:underline text-sm">
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  if (state === "accepted") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl mb-2">You're in!</h1>
          <p className="text-gray-600 mb-2">
            You've successfully joined <strong>{invitation.companyName}</strong>.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Your role is <strong className="capitalize">{invitation.role}</strong>
            {invitation.isAdmin && " (Admin)"}.
          </p>
          <button
            onClick={() => navigate("/company/dashboard")}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition"
          >
            Go to Company Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-2xl mb-4">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl mb-2">You're Invited!</h1>
            <p className="text-gray-600">You've been invited to join a company on PRIBEC</p>
          </div>

          {/* Invitation Details */}
          <div className="mb-6 p-5 bg-gray-50 rounded-xl space-y-3">
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-gray-500 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Company</p>
                <p className="text-sm font-medium">{invitation.companyName}</p>
                <p className="text-xs text-indigo-600">
                  {CATEGORY_LABELS[invitation.companyCategory] ?? invitation.companyCategory}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-gray-500 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Role</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm capitalize font-medium">{invitation.role}</p>
                  {invitation.isAdmin && (
                    <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                      Admin
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-500 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Invited to</p>
                <p className="text-sm">{invitation.email}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 pt-1 border-t border-gray-200">
              Invited by <strong>{invitation.invitedBy}</strong> ·{" "}
              Expires {new Date(invitation.expiresAt).toLocaleDateString()}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Action Selection */}
          {state === "preview" && (
            <div className="space-y-3">
              <button
                onClick={() => setState("existing_user")}
                className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                I already have an account
              </button>
              <button
                onClick={() => setState("new_user")}
                className="w-full py-3 border-2 border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition"
              >
                Create a new account
              </button>
            </div>
          )}

          {/* Existing User: just confirm */}
          {state === "existing_user" && (
            <form onSubmit={handleExistingUser} className="space-y-4">
              <p className="text-sm text-gray-600">
                You'll be added to <strong>{invitation.companyName}</strong> using your existing
                account ({invitation.email}).
              </p>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                {isLoading ? "Joining..." : "Accept & Join Company"}
              </button>
              <button
                type="button"
                onClick={() => setState("preview")}
                className="w-full text-sm text-gray-500 hover:text-gray-700 transition"
              >
                Back
              </button>
            </form>
          )}

          {/* New User: create account */}
          {state === "new_user" && (
            <form onSubmit={handleNewUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1 text-gray-700">First Name *</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData((p) => ({ ...p, firstName: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-gray-700">Last Name *</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData((p) => ({ ...p, lastName: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm mb-1 text-gray-700">Create Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    placeholder="min. 8 characters"
                    minLength={8}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm mb-1 text-gray-700">Confirm Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, confirmPassword: e.target.value }))
                    }
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                {isLoading ? "Creating account..." : "Create Account & Accept"}
              </button>

              <button
                type="button"
                onClick={() => setState("preview")}
                className="w-full text-sm text-gray-500 hover:text-gray-700 transition"
              >
                Back
              </button>
            </form>
          )}

          <p className="text-center text-xs text-gray-500 mt-5">
            By accepting, you agree to PRIBEC's{" "}
            <a href="#" className="text-indigo-600 hover:underline">
              Terms of Service
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
