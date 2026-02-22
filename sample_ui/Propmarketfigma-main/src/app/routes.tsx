/**
 * Application route configuration.
 *
 * Changes from initial scaffold:
 *  - All page components use React.lazy() for route-level code splitting.
 *    Each page is loaded on demand, reducing the initial bundle from a single
 *    monolithic chunk to small per-route chunks.
 *  - Duplicate routes (listings, property/:id, compare, safety) that existed
 *    both inside /app and at the root level have been removed. All such routes
 *    now live exclusively under the /app layout shell.
 *  - Admin routes (/admin, /admin/verification) are wrapped in ProtectedRoute
 *    with requiredRole="admin" to prevent unauthorized access.
 *  - A catch-all "404 Not Found" route has been added as the last child.
 */

import React, { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router";
import ProtectedRoute from "./components/ProtectedRoute";

// ---------------------------------------------------------------------------
// Lazy page imports — each page becomes its own JS chunk (code splitting)
// ---------------------------------------------------------------------------

const Layout = lazy(() => import("./components/Layout").then((m) => ({ default: m.Layout })));

// Public / auth pages
const PublicHome       = lazy(() => import("./pages/PublicHome"));
const Login            = lazy(() => import("./pages/LoginEnhanced"));   // Enhanced version
const Register         = lazy(() => import("./pages/Register"));
const OAuthConnect     = lazy(() => import("./pages/OAuthConnect"));
const EmailVerification = lazy(() => import("./pages/EmailVerification"));
const ForgotPassword   = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword    = lazy(() => import("./pages/ResetPassword"));
const MFASetup         = lazy(() => import("./pages/MFASetup"));
const MFAVerify        = lazy(() => import("./pages/MFAVerify"));
const SessionExpired   = lazy(() => import("./pages/SessionExpired"));
const RoleSelection    = lazy(() => import("./pages/RoleSelection"));
const ProfileSetup     = lazy(() => import("./pages/ProfileSetup"));
const KYCUpload        = lazy(() => import("./pages/KYCUpload"));
const ProfileDashboard = lazy(() => import("./pages/ProfileDashboard"));

// App layout children
const Dashboard     = lazy(() => import("./pages/Dashboard"));
const AgentDashboard = lazy(() => import("./pages/AgentDashboardEnhanced")); // Enhanced
const Listings      = lazy(() => import("./pages/Listings"));
const PropertyDetail = lazy(() => import("./pages/PropertyDetailEnhanced")); // Enhanced
const PropertyComparison = lazy(() => import("./pages/PropertyComparison"));
const Safety        = lazy(() => import("./pages/Safety"));
const Analytics     = lazy(() => import("./pages/Analytics"));

// Buyer / sales
const BuyerDashboard        = lazy(() => import("./pages/BuyerDashboardEnhanced")); // Enhanced
const BuyerSimpleView       = lazy(() => import("./pages/BuyerSimpleView"));
const ConveyancerView       = lazy(() => import("./pages/ConveyancerView"));
const PropertySaleWorkspace = lazy(() => import("./pages/PropertySaleWorkspace"));
const PropertyLifecycleDashboard = lazy(() => import("./pages/PropertyLifecycleDashboard"));
const BuyerFlowDocumentation = lazy(() => import("./pages/BuyerFlowDocumentation"));

// Financial
const EscrowFinancialDashboard = lazy(() => import("./pages/EscrowFinancialDashboard"));

// Construction / BOQ
const ConstructionProjectDashboard = lazy(() => import("./pages/ConstructionProjectDashboard"));
const IntelligentBOQWorkspace      = lazy(() => import("./pages/IntelligentBOQWorkspace"));

// Marketplace
const ContractorSupplierMarketplace = lazy(() => import("./pages/ContractorSupplierMarketplace"));
const AgentProfile                  = lazy(() => import("./pages/AgentProfile"));

// Inspections & logistics
const InspectionVerificationModule  = lazy(() => import("./pages/InspectionVerificationModule"));
const LogisticsDeliveryMarketplace  = lazy(() => import("./pages/LogisticsDeliveryMarketplace"));

// Risk, AI & analytics
const RiskAnalyticsDashboard = lazy(() => import("./pages/RiskAnalyticsDashboard"));
const AIDesignStudio         = lazy(() => import("./pages/AIDesignStudio"));

// Admin (protected)
const AdminDashboard        = lazy(() => import("./pages/AdminDashboard"));
const AdminVerificationPanel = lazy(() => import("./pages/AdminVerificationPanel"));

// Documentation / demo pages (dev only — no auth required)
const AuthenticationFlow    = lazy(() => import("./pages/AuthenticationFlow"));
const ThemeDocumentation    = lazy(() => import("./pages/ThemeDocumentation"));

// 404
const NotFound = lazy(() => import("./pages/NotFound"));

// ---------------------------------------------------------------------------
// Suspense fallback — shown while a lazy chunk is loading
// ---------------------------------------------------------------------------
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" aria-label="Loading page" />
  </div>
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function withSuspense(Component: React.LazyExoticComponent<any>) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  );
}

// ---------------------------------------------------------------------------
// Router definition
// ---------------------------------------------------------------------------
export const router = createBrowserRouter([
  {
    path: "/",
    children: [
      // Public home
      { index: true, element: withSuspense(PublicHome) },

      // Auth flow
      { path: "login",              element: withSuspense(Login) },
      { path: "register",           element: withSuspense(Register) },
      { path: "oauth-connect",      element: withSuspense(OAuthConnect) },
      { path: "email-verification", element: withSuspense(EmailVerification) },
      { path: "forgot-password",    element: withSuspense(ForgotPassword) },
      { path: "reset-password",     element: withSuspense(ResetPassword) },
      { path: "mfa-setup",          element: withSuspense(MFASetup) },
      { path: "mfa-verify",         element: withSuspense(MFAVerify) },
      { path: "session-expired",    element: withSuspense(SessionExpired) },
      { path: "role-selection",     element: withSuspense(RoleSelection) },
      { path: "profile-setup",      element: withSuspense(ProfileSetup) },
      { path: "kyc-upload",         element: withSuspense(KYCUpload) },
      { path: "profile-dashboard",  element: withSuspense(ProfileDashboard) },

      // App shell (shared layout sidebar + header)
      {
        path: "app",
        element: (
          <Suspense fallback={<PageLoader />}>
            <Layout />
          </Suspense>
        ),
        children: [
          { index: true,           element: withSuspense(Dashboard) },
          { path: "agent",         element: withSuspense(AgentDashboard) },
          { path: "listings",      element: withSuspense(Listings) },
          { path: "property/:id",  element: withSuspense(PropertyDetail) },
          { path: "compare",       element: withSuspense(PropertyComparison) },
          { path: "safety",        element: withSuspense(Safety) },
          { path: "analytics",     element: withSuspense(Analytics) },
        ],
      },

      // Buyer / sales
      { path: "buyer-dashboard",       element: withSuspense(BuyerDashboard) },
      { path: "buyer-workspace",        element: withSuspense(BuyerSimpleView) },
      { path: "conveyancer",            element: withSuspense(ConveyancerView) },
      { path: "workspace/:id",          element: withSuspense(PropertySaleWorkspace) },
      { path: "property-lifecycle",     element: withSuspense(PropertyLifecycleDashboard) },
      { path: "buyer-flow",             element: withSuspense(BuyerFlowDocumentation) },

      // Financial
      { path: "escrow", element: withSuspense(EscrowFinancialDashboard) },

      // Construction / BOQ
      { path: "construction",  element: withSuspense(ConstructionProjectDashboard) },
      { path: "boq-workspace", element: withSuspense(IntelligentBOQWorkspace) },

      // Marketplace
      { path: "contractor-supplier-marketplace", element: withSuspense(ContractorSupplierMarketplace) },
      { path: "agent-profile/:id",               element: withSuspense(AgentProfile) },

      // Inspections & logistics
      { path: "inspection-verification",         element: withSuspense(InspectionVerificationModule) },
      { path: "logistics-delivery-marketplace",  element: withSuspense(LogisticsDeliveryMarketplace) },

      // Risk, AI & analytics
      { path: "risk-analytics",   element: withSuspense(RiskAnalyticsDashboard) },
      { path: "ai-design-studio", element: withSuspense(AIDesignStudio) },

      // Admin — requires authentication with admin role
      {
        path: "admin",
        element: (
          <ProtectedRoute requiredRole="admin">
            <Suspense fallback={<PageLoader />}><AdminDashboard /></Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: "admin/verification",
        element: (
          <ProtectedRoute requiredRole="admin">
            <Suspense fallback={<PageLoader />}><AdminVerificationPanel /></Suspense>
          </ProtectedRoute>
        ),
      },

      // Developer / documentation routes
      { path: "auth-flow",   element: withSuspense(AuthenticationFlow) },
      { path: "theme-docs",  element: withSuspense(ThemeDocumentation) },

      // Catch-all 404
      { path: "*", element: withSuspense(NotFound) },
    ],
  },
]);
