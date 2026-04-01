'use client';

import { Link } from "@/lib/router-compat";
import {
  LogIn,
  UserPlus, 
  Mail, 
  Lock, 
  Shield, 
  Chrome,
  Key,
  Clock,
  CheckCircle,
  ArrowRight
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const C = { forest: '#1A3C28', cream: '#EAD9C4', egreen: '#00E87A', parchment: '#F2E8D5', amber: '#B89040' };

export default function AuthenticationFlow() {
  const authScreens = [
    {
      id: 1,
      name: "Login",
      path: "/login-enhanced",
      icon: LogIn,
      description: "Standard email/password authentication with OAuth options",
      features: ["Email/Password", "Remember me", "OAuth providers", "Forgot password link"],
      status: "primary",
    },
    {
      id: 2,
      name: "OAuth Connect",
      path: "/oauth-connect",
      icon: Chrome,
      description: "Third-party authentication provider selection",
      features: ["Google OAuth", "Microsoft OAuth", "Seamless integration", "Privacy notice"],
      status: "secondary",
    },
    {
      id: 3,
      name: "Register",
      path: "/register",
      icon: UserPlus,
      description: "New user registration with email/password",
      features: ["Email validation", "Password strength", "Terms acceptance", "Role selection"],
      status: "primary",
    },
    {
      id: 4,
      name: "Email Verification",
      path: "/email-verification",
      icon: Mail,
      description: "Email address verification flow",
      features: ["Verification link", "Resend option", "Expiry notice", "Email change"],
      status: "secondary",
    },
    {
      id: 5,
      name: "Forgot Password",
      path: "/forgot-password",
      icon: Lock,
      description: "Password reset request",
      features: ["Email lookup", "Reset instructions", "Back to login", "Error handling"],
      status: "secondary",
    },
    {
      id: 6,
      name: "Reset Password",
      path: "/reset-password",
      icon: Key,
      description: "Set new password with validation",
      features: ["Password requirements", "Match validation", "Strength indicator", "Success confirmation"],
      status: "secondary",
    },
    {
      id: 7,
      name: "MFA Setup",
      path: "/mfa-setup",
      icon: Shield,
      description: "Two-factor authentication configuration",
      features: ["QR code", "Manual key entry", "Authenticator apps", "Backup codes"],
      status: "optional",
    },
    {
      id: 8,
      name: "MFA Verify",
      path: "/mfa-verify",
      icon: Shield,
      description: "Two-factor authentication verification",
      features: ["6-digit code", "Auto-submit", "Paste support", "Resend option"],
      status: "secondary",
    },
    {
      id: 9,
      name: "Session Expired",
      path: "/session-expired",
      icon: Clock,
      description: "Session timeout notification",
      features: ["Auto-logout", "Security notice", "Re-login", "Progress saved"],
      status: "error",
    },
    {
      id: 10,
      name: "Role Selection",
      path: "/role-selection",
      icon: CheckCircle,
      description: "User role and account type selection",
      features: ["Multiple roles", "Role descriptions", "Next steps", "Skip option"],
      status: "secondary",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "primary":
        return "bg-black text-white";
      case "secondary":
        return "bg-gray-600 text-white";
      case "optional":
        return "bg-blue-600 text-white";
      case "error":
        return "bg-red-600 text-white";
      default:
        return "bg-gray-600 text-white";
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: C.parchment }}>
      {/* Header */}
      <div style={{ borderBottom: `1px solid ${C.cream}`, background: C.forest, padding: '1rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '2.25rem', height: '2.25rem', background: C.egreen, borderRadius: '0.375rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield style={{ width: '1.125rem', height: '1.125rem', color: C.forest }} />
            </div>
            <div>
              <h1 style={{ fontFamily: 'var(--font-fraunces)', fontSize: '1.25rem', fontWeight: 700, color: C.cream, margin: 0 }}>Authentication Flow</h1>
              <p style={{ fontSize: '0.8125rem', color: `${C.cream}90`, margin: 0 }}>Complete authentication system overview</p>
            </div>
          </div>
          <Link to="/">
            <Button variant="outline" style={{ borderColor: `${C.cream}60`, color: C.cream, background: 'transparent', fontSize: '0.875rem' }}>
              Back to Home
            </Button>
          </Link>
        </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Badge style={{ background: C.egreen, color: C.forest, fontWeight: 700, fontSize: '0.75rem' }}>
              {authScreens.filter(s => s.status === "primary").length} Primary
            </Badge>
            <Badge style={{ background: `${C.cream}`, color: C.forest, fontWeight: 700, fontSize: '0.75rem' }}>
              {authScreens.filter(s => s.status === "secondary").length} Secondary
            </Badge>
            <Badge style={{ background: `${C.forest}40`, color: C.forest, fontWeight: 700, fontSize: '0.75rem' }}>
              {authScreens.filter(s => s.status === "optional").length} Optional
            </Badge>
            <Badge style={{ background: `${C.amber}30`, color: C.forest, fontWeight: 700, fontSize: '0.75rem' }}>
              {authScreens.filter(s => s.status === "error").length} Error State
            </Badge>
          </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="mb-8">
          <Card className="p-6" style={{ background: `${C.forest}08`, border: `1.5px solid ${C.forest}30` }}>
            <div className="flex items-start gap-3">
              <Shield style={{ width: '1.5rem', height: '1.5rem', color: C.forest, flexShrink: 0, marginTop: '0.25rem' }} />
              <div>
                <h3 style={{ fontWeight: 600, color: C.forest, marginBottom: '0.5rem', margin: '0 0 0.5rem' }}>
                  Complete Authentication System
                </h3>
                <p style={{ fontSize: '0.875rem', color: `${C.forest}CC`, marginBottom: '0.75rem' }}>
                  This comprehensive authentication flow includes all necessary screens for secure
                  user management: login, registration, email verification, password reset,
                  multi-factor authentication, and session management.
                </p>
                <div style={{ fontSize: '0.75rem', color: C.forest, fontFamily: 'var(--font-mono)' }}>
                  ✓ OAuth Integration • ✓ MFA Support • ✓ Password Recovery • ✓ Email Verification
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Authentication Screens Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {authScreens.map((screen) => {
            const Icon = screen.icon;
            return (
              <Card key={screen.id} className="p-6 border-gray-200 hover:border-gray-300 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Icon className="w-6 h-6 text-gray-700" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{screen.name}</h3>
                      <Badge className={`${getStatusColor(screen.status)} text-xs mt-1`}>
                        {screen.status}
                      </Badge>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">#{screen.id}</span>
                </div>

                <p className="text-sm text-gray-600 mb-4">{screen.description}</p>

                <div className="mb-4">
                  <div className="text-xs font-semibold text-gray-700 mb-2">Features:</div>
                  <div className="grid grid-cols-2 gap-2">
                    {screen.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-1 text-xs text-gray-600">
                        <CheckCircle className="w-3 h-3 text-green-600" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>

                <Link to={screen.path}>
                  <Button className="w-full bg-black hover:bg-gray-800 text-white">
                    View Screen
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </Card>
            );
          })}
        </div>

        {/* Flow Diagram */}
        <div className="mt-8">
          <Card className="p-6 border-gray-200">
            <h3 className="font-semibold text-lg mb-4">Authentication Flow Diagram</h3>
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm font-semibold">
                    1
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                  <div className="text-sm">
                    <span className="font-semibold">Login</span> or{" "}
                    <span className="font-semibold">Register</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 ml-12">
                  <div className="w-8 h-8 bg-gray-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                    2
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                  <div className="text-sm">
                    <span className="font-semibold">OAuth Connect</span> (optional) or{" "}
                    <span className="font-semibold">Email Verification</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 ml-24">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                    3
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                  <div className="text-sm">
                    <span className="font-semibold">MFA Setup</span> (optional) →{" "}
                    <span className="font-semibold">MFA Verify</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 ml-36">
                  <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                    ✓
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                  <div className="text-sm">
                    <span className="font-semibold">Dashboard Access</span>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="text-xs text-gray-600 mb-2">Alternative Flows:</div>
                  <div className="space-y-2 text-sm">
                    <div>• <span className="font-semibold">Forgot Password</span> → Reset Password → Login</div>
                    <div>• <span className="font-semibold">Session Expired</span> → Login → MFA Verify (if enabled)</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Technical Details */}
        <div className="mt-6 grid grid-cols-2 gap-6">
          <Card className="p-6 border-gray-200">
            <h3 className="font-semibold mb-4">Security Features</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>256-bit encryption</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Multi-factor authentication</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Session management</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Email verification</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Password strength validation</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>OAuth 2.0 integration</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-gray-200">
            <h3 className="font-semibold mb-4">Routes</h3>
            <div className="space-y-1 text-xs font-mono text-gray-600">
              <div>/login-enhanced</div>
              <div>/oauth-connect</div>
              <div>/register</div>
              <div>/email-verification</div>
              <div>/forgot-password</div>
              <div>/reset-password</div>
              <div>/mfa-setup</div>
              <div>/mfa-verify</div>
              <div>/session-expired</div>
              <div>/role-selection</div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
