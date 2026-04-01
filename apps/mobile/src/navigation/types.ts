/**
 * React Navigation param list types for the PRIBEC mobile app.
 *
 * Route names mirror the legacy Screen union type so that existing screen
 * components can be migrated incrementally without renaming anything.
 */
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp, NavigatorScreenParams } from '@react-navigation/native';

// ── Auth stack ────────────────────────────────────────────────────────────────

export type AuthStackParamList = {
  splash: undefined;
  onboarding1: undefined;
  onboarding2: undefined;
  onboarding3: undefined;
  roleSelection: undefined;
  login: undefined;
  signupHomeowner: undefined;
  signupContractor: undefined;
  forgotPassword: undefined;
  verification: undefined;
  terms: undefined;
  success: undefined;
};

// ── Homeowner tab screens ─────────────────────────────────────────────────────

export type HomeownerTabParamList = {
  home: undefined;
  discover: undefined;
  projects: undefined;
  conversationsList: undefined;
  homeownerProfile: undefined;
};

// ── Contractor tab screens ────────────────────────────────────────────────────

export type ContractorTabParamList = {
  contractorHome: undefined;
  jobFeed: undefined;
  activeJobs: undefined;
  conversationsList: undefined;
  profile: undefined;
};

// ── App stack (wraps tabs + all modal/detail screens) ────────────────────────

export type AppStackParamList = {
  MainTabs: NavigatorScreenParams<HomeownerTabParamList | ContractorTabParamList>;
  // Shared detail screens (no tab)
  map: undefined;
  saved: undefined;
  portfolio: undefined;
  reviews: undefined;
  availability: undefined;
  compliance: undefined;
  createProject: undefined;
  voiceInput: undefined;
  aiBuilder: undefined;
  drafts: undefined;
  reportIssue: undefined;
  manualEntry: undefined;
  jobSuccess: undefined;
  quotesList: undefined;
  quoteDetail: undefined;
  quoteComparison: undefined;
  hireContractor: undefined;
  createContract: undefined;
  signContract: undefined;
  contractDetail: undefined;
  contractPreview: undefined;
  contractSuccess: undefined;
  chat: undefined;
  chatAttachments: undefined;
  voiceMessages: undefined;
  messagingNotifications: undefined;
  blockReport: undefined;
  jobDetail: undefined;
  updateProgress: undefined;
  uploadMedia: undefined;
  markMilestone: undefined;
  requestPayment: undefined;
  delayNotification: undefined;
  cancelJobRequest: undefined;
  dispute: undefined;
  jobCompletion: undefined;
  earningsDashboard: undefined;
  transactionHistory: undefined;
  withdrawFunds: undefined;
  bankDetails: undefined;
  payoutStatus: undefined;
  taxSummary: undefined;
  editProfile: undefined;
  addServices: undefined;
  portfolioUpload: undefined;
  certificationsUpload: undefined;
  pricingSetup: undefined;
  availabilitySchedule: undefined;
  serviceAreaMap: undefined;
  verificationStatus: undefined;
  reviewsReceived: undefined;
  respondToReview: undefined;
  profilePreview: undefined;
  deactivateAccount: undefined;
  paymentMethod: undefined;
  escrowFunding: undefined;
  paymentSuccess: undefined;
  paymentHistory: undefined;
  invoice: undefined;
  refundRequest: undefined;
  leaveReview: undefined;
  editReview: undefined;
  notifications: undefined;
  notificationDetail: undefined;
  settings: undefined;
  accountSettings: undefined;
  notificationSettings: undefined;
  securitySettings: undefined;
  passwordChange: undefined;
  languageSelection: undefined;
  logout: undefined;
  pushPreferences: undefined;
  jobAlertSettings: undefined;
  createQuote: undefined;
  editQuote: undefined;
  quotePreview: undefined;
  quoteSuccess: undefined;
  quoteHistory: undefined;
  quoteAnalytics: undefined;
};

// ── Root stack ────────────────────────────────────────────────────────────────

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  App: NavigatorScreenParams<AppStackParamList>;
};

// ── Navigation prop helpers ───────────────────────────────────────────────────

export type AppNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<AppStackParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

export type AuthNavigationProp = NativeStackNavigationProp<AuthStackParamList>;

/** Legacy callback type — compatible with existing screen components */
export type NavigateFn = (screen: keyof AppStackParamList | keyof AuthStackParamList) => void;
