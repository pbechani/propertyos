import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SplashScreen } from './SplashScreen';
import { Onboarding1, Onboarding2, Onboarding3, TermsScreen } from './Onboarding';
import { LoginScreen, RoleSelectionScreen, ForgotPasswordScreen, SignupHomeownerScreen, SignupContractorScreen, VerificationScreen, SuccessScreen } from './AuthScreens';
import { ProfileScreen } from './ProfileScreen';
import { HomeownerDashboard } from './components/HomeownerDashboard';
import { DiscoverScreen } from './components/DiscoverScreen';
import { MapView } from './components/MapView';
import { ProjectsScreen } from './components/ProjectsScreen';
import { SavedScreen } from './components/SavedScreen';
import { PortfolioScreen } from './components/PortfolioScreen';
import { ReviewsScreen } from './components/ReviewsScreen';
import { AvailabilityScreen } from './components/AvailabilityScreen';
import { ComplianceScreen } from './components/ComplianceScreen';
import { CreateProjectScreen } from './components/CreateProjectScreen';
import { VoiceInputScreen } from './components/VoiceInputScreen';
import { AIBuilderScreen } from './components/AIBuilderScreen';
import { DraftsScreen } from './components/DraftsScreen';
import { ReportIssueScreen } from './components/ReportIssueScreen';
import { ManualEntryScreen } from './components/ManualEntryScreen';
import { JobSuccessScreen } from './components/JobSuccessScreen';
import { QuotesListScreen } from './components/QuotesListScreen';
import { QuoteDetailScreen } from './components/QuoteDetailScreen';
import { QuoteComparisonScreen } from './components/QuoteComparisonScreen';
import { HireContractorScreen } from './components/HireContractorScreen';
import { ContractSuccessScreen } from './components/ContractSuccessScreen';
import { 
  ChatListScreen,
  ContractorChatScreen,
  ChatAttachmentsScreen,
  VoiceMessagesScreen,
  MessagingNotificationsScreen,
  BlockReportScreen
} from './components/MessagingSystem';
import { ConversationsListScreen } from './components/ConversationsListScreen';
import { ChatScreen } from './components/ChatScreen';
import { 
  ActiveJobsListScreen, 
  ActiveJobDetailScreen, 
  UpdateProgressScreen, 
  UploadMediaScreen, 
  MarkMilestoneScreen, 
  RequestPaymentScreen, 
  DelayNotificationScreen, 
  CancelJobRequestScreen, 
  CompleteJobScreen, 
  ActiveJobChatScreen 
} from './components/ActiveJobsSystem';
import { 
  SettingsHub,
  AccountSettingsScreen,
  NotificationSettingsScreen,
  SecuritySettingsScreen,
  PasswordChangeScreen,
  LanguageSelectionScreen,
  LogoutConfirmationScreen
} from './components/SettingsSystem';
import { 
  EarningsDashboardScreen, 
  TransactionHistoryScreen, 
  WithdrawFundsScreen, 
  BankDetailsScreen, 
  PayoutStatusScreen, 
  TaxSummaryScreen 
} from './components/EarningsSystem';
import { 
  ContractorProfileHub,
  EditProfileScreen, 
  AddServicesScreen, 
  PortfolioUploadScreen, 
  CertificationsUploadScreen, 
  PricingSetupScreen, 
  AvailabilityScheduleScreen, 
  ServiceAreaMapScreen, 
  VerificationStatusScreen, 
  ReviewsReceivedScreen, 
  RespondToReviewScreen, 
  ProfilePreviewScreen, 
  DeactivateAccountScreen 
} from './components/ProfileManagementSystem';
import { DisputeScreen } from './components/DisputeScreen';
import { JobCompletionScreen } from './components/JobCompletionScreen';
import { HomeownerProfileScreen } from './components/HomeownerProfileScreen';
import { JobDetailScreen } from './components/JobDetailScreen';
import { ContractPreviewScreen } from './components/ContractPreviewScreen';
import { PaymentMethodScreen } from './components/PaymentMethodScreen';
import { EscrowFundingScreen } from './components/EscrowFundingScreen';
import { PaymentSuccessScreen } from './components/PaymentSuccessScreen';
import { PaymentHistoryScreen } from './components/PaymentHistoryScreen';
import { InvoiceScreen } from './components/InvoiceScreen';
import { RefundRequestScreen } from './components/RefundRequestScreen';
import { LeaveReviewScreen } from './components/LeaveReviewScreen';
import { NotificationsScreen } from './components/NotificationsScreen';
import { NotificationDetailScreen } from './components/NotificationDetailScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { PushPreferencesScreen } from './components/PushPreferencesScreen';
import { ContractorDashboard } from './components/ContractorDashboard';
import { JobFeedScreen, JobAlertSettingsScreen } from './components/JobFeedScreen';
import { CreateQuoteScreen, QuotePreviewScreen, QuoteSuccessScreen, QuoteHistoryScreen, QuoteAnalyticsScreen } from './components/QuotationSystem';
import { CreateContractScreen, SignContractScreen, ContractDetailScreen } from './components/ContractSystem';
import { BottomNav } from './components/BottomNav';
import { Screen } from './types';
import { AuthProvider, useAuth } from './context/AuthContext';

function AppInner() {
  const auth = useAuth();
  const [currentScreen, setCurrentScreen] = React.useState<Screen>('splash');
  const [userRole, setUserRole] = React.useState<'homeowner' | 'contractor'>('homeowner');

  // Sync role from authenticated user on login/register/restore
  React.useEffect(() => {
    if (auth.user) {
      setUserRole(auth.user.roles.includes('contractor') ? 'contractor' : 'homeowner');
    }
  }, [auth.user]);

  // Auto-navigate to dashboard when session is restored from storage
  React.useEffect(() => {
    if (!auth.isLoading && auth.user && currentScreen === 'splash') {
      setCurrentScreen(auth.user.roles.includes('contractor') ? 'contractorHome' : 'home');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.isLoading]);

  if (auth.isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  const showBottomNav = ['home', 'contractorHome', 'discover', 'jobFeed', 'projects', 'activeJobs', 'conversationsList', 'saved', 'profile', 'homeownerProfile', 'paymentHistory', 'quoteHistory', 'quoteAnalytics', 'jobDetail', 'updateProgress', 'uploadMedia', 'markMilestone', 'requestPayment', 'delayNotification', 'cancelJobRequest', 'jobCompletion', 'chat', 'earningsDashboard', 'transactionHistory', 'withdrawFunds', 'bankDetails', 'payoutStatus', 'taxSummary', 'editProfile', 'addServices', 'portfolioUpload', 'certificationsUpload', 'pricingSetup', 'availabilitySchedule', 'serviceAreaMap', 'verificationStatus', 'reviewsReceived', 'respondToReview', 'profilePreview', 'deactivateAccount', 'leaveReview', 'contractDetail'].includes(currentScreen);

  const handleNavigate = (screen: Screen) => {
    if (screen === 'signupHomeowner') setUserRole('homeowner');
    if (screen === 'signupContractor') setUserRole('contractor');
    setCurrentScreen(screen);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'splash':
        return <SplashScreen onNext={handleNavigate} />;
      case 'onboarding1':
        return <Onboarding1 onNext={() => handleNavigate('onboarding2')} onSkip={() => handleNavigate('roleSelection')} />;
      case 'onboarding2':
        return <Onboarding2 onNext={() => handleNavigate('onboarding3')} onBack={() => handleNavigate('onboarding1')} />;
      case 'onboarding3':
        return <Onboarding3 onNext={() => handleNavigate('roleSelection')} />;
      case 'roleSelection':
        return <RoleSelectionScreen onNext={handleNavigate} />;
      case 'login':
        return <LoginScreen onNext={handleNavigate} />;
      case 'signupHomeowner':
        return <SignupHomeownerScreen onNext={handleNavigate} />;
      case 'signupContractor':
        return <SignupContractorScreen onNext={handleNavigate} />;
      case 'forgotPassword':
        return <ForgotPasswordScreen onNext={handleNavigate} />;
      case 'verification':
        return <VerificationScreen onNext={handleNavigate} />;
      case 'terms':
        return <TermsScreen onNext={() => handleNavigate('verification')} onDecline={() => handleNavigate('roleSelection')} />;
      case 'success':
        return <SuccessScreen onNext={(s) => handleNavigate(userRole === 'contractor' ? 'contractorHome' : 'home')} />;
      case 'home':
        return <HomeownerDashboard onNavigate={handleNavigate} />;
      case 'contractorHome':
        return <ContractorDashboard onNavigate={handleNavigate} />;
      case 'discover':
        return <DiscoverScreen onNavigate={handleNavigate} />;
      case 'map':
        return <MapView onNavigate={handleNavigate} />;
      case 'projects':
        return <ProjectsScreen onNavigate={handleNavigate} />;
      case 'saved':
        return <SavedScreen onNavigate={handleNavigate} />;
      case 'profile':
        return userRole === 'contractor' ? <ContractorProfileHub onNavigate={handleNavigate} /> : <ProfileScreen onNavigate={handleNavigate} />;
      case 'homeownerProfile':
        return <HomeownerProfileScreen onNavigate={handleNavigate} />;
      case 'portfolio':
        return <PortfolioScreen onNavigate={handleNavigate} />;
      case 'reviews':
        return <ReviewsScreen onNavigate={handleNavigate} />;
      case 'availability':
        return <AvailabilityScreen onNavigate={handleNavigate} />;
      case 'compliance':
        return <ComplianceScreen onNavigate={handleNavigate} />;
      case 'createProject':
        return <CreateProjectScreen onNavigate={handleNavigate} />;
      case 'voiceInput':
        return <VoiceInputScreen onNavigate={handleNavigate} />;
      case 'aiBuilder':
        return <AIBuilderScreen onNavigate={handleNavigate} />;
      case 'drafts':
        return <DraftsScreen onNavigate={handleNavigate} />;
      case 'reportIssue':
        return <ReportIssueScreen onNavigate={handleNavigate} />;
      case 'manualEntry':
        return <ManualEntryScreen onNavigate={handleNavigate} />;
      case 'jobSuccess':
        return <JobSuccessScreen onNavigate={handleNavigate} />;
      case 'quotesList':
        return <QuotesListScreen onNavigate={handleNavigate} />;
      case 'quoteDetail':
        return <QuoteDetailScreen onNavigate={handleNavigate} />;
      case 'quoteComparison':
        return <QuoteComparisonScreen onNavigate={handleNavigate} />;
      case 'hireContractor':
        return <HireContractorScreen onNavigate={handleNavigate} />;
      case 'createContract':
        return <CreateContractScreen onNavigate={handleNavigate} userRole={userRole} />;
      case 'signContract':
        return <SignContractScreen onNavigate={handleNavigate} userRole={userRole} />;
      case 'contractDetail':
        return <ContractDetailScreen onNavigate={handleNavigate} userRole={userRole} />;
      case 'contractPreview':
        return <ContractPreviewScreen onNavigate={handleNavigate} />;
      case 'contractSuccess':
        return <ContractSuccessScreen onNavigate={handleNavigate} />;
      case 'conversationsList':
        return userRole === 'contractor' ? <ChatListScreen onNavigate={handleNavigate} /> : <ConversationsListScreen onNavigate={handleNavigate} />;
      case 'chat':
        return userRole === 'contractor' ? <ContractorChatScreen onNavigate={handleNavigate} /> : <ChatScreen onNavigate={handleNavigate} />;
      case 'chatAttachments':
        return <ChatAttachmentsScreen onNavigate={handleNavigate} />;
      case 'voiceMessages':
        return <VoiceMessagesScreen onNavigate={handleNavigate} />;
      case 'messagingNotifications':
        return <MessagingNotificationsScreen onNavigate={handleNavigate} />;
      case 'blockReport':
        return <BlockReportScreen onNavigate={handleNavigate} />;
      case 'activeJobs':
        return <ActiveJobsListScreen onNavigate={handleNavigate} />;
      case 'jobDetail':
        return userRole === 'contractor' ? <ActiveJobDetailScreen onNavigate={handleNavigate} /> : <JobDetailScreen onNavigate={handleNavigate} />;
      case 'updateProgress':
        return <UpdateProgressScreen onNavigate={handleNavigate} />;
      case 'uploadMedia':
        return <UploadMediaScreen onNavigate={handleNavigate} />;
      case 'markMilestone':
        return <MarkMilestoneScreen onNavigate={handleNavigate} />;
      case 'requestPayment':
        return <RequestPaymentScreen onNavigate={handleNavigate} />;
      case 'delayNotification':
        return <DelayNotificationScreen onNavigate={handleNavigate} />;
      case 'cancelJobRequest':
        return <CancelJobRequestScreen onNavigate={handleNavigate} />;
      case 'dispute':
        return <DisputeScreen onNavigate={handleNavigate} userRole={userRole} />;
      case 'jobCompletion':
        return userRole === 'homeowner' ? <JobCompletionScreen onNavigate={handleNavigate} /> : <CompleteJobScreen onNavigate={handleNavigate} />;
      case 'earningsDashboard':
        return <EarningsDashboardScreen onNavigate={handleNavigate} />;
      case 'transactionHistory':
        return <TransactionHistoryScreen onNavigate={handleNavigate} />;
      case 'withdrawFunds':
        return <WithdrawFundsScreen onNavigate={handleNavigate} />;
      case 'bankDetails':
        return <BankDetailsScreen onNavigate={handleNavigate} />;
      case 'payoutStatus':
        return <PayoutStatusScreen onNavigate={handleNavigate} />;
      case 'taxSummary':
        return <TaxSummaryScreen onNavigate={handleNavigate} />;
      case 'editProfile':
        return <EditProfileScreen onNavigate={handleNavigate} />;
      case 'addServices':
        return <AddServicesScreen onNavigate={handleNavigate} />;
      case 'portfolioUpload':
        return <PortfolioUploadScreen onNavigate={handleNavigate} />;
      case 'certificationsUpload':
        return <CertificationsUploadScreen onNavigate={handleNavigate} />;
      case 'pricingSetup':
        return <PricingSetupScreen onNavigate={handleNavigate} />;
      case 'availabilitySchedule':
        return <AvailabilityScheduleScreen onNavigate={handleNavigate} />;
      case 'serviceAreaMap':
        return <ServiceAreaMapScreen onNavigate={handleNavigate} />;
      case 'verificationStatus':
        return <VerificationStatusScreen onNavigate={handleNavigate} />;
      case 'reviewsReceived':
        return <ReviewsReceivedScreen onNavigate={handleNavigate} />;
      case 'respondToReview':
        return <RespondToReviewScreen onNavigate={handleNavigate} />;
      case 'profilePreview':
        return <ProfilePreviewScreen onNavigate={handleNavigate} />;
      case 'deactivateAccount':
        return <DeactivateAccountScreen onNavigate={handleNavigate} />;
      case 'paymentMethod':
        return <PaymentMethodScreen onNavigate={handleNavigate} />;
      case 'escrowFunding':
        return <EscrowFundingScreen onNavigate={handleNavigate} />;
      case 'paymentSuccess':
        return <PaymentSuccessScreen onNavigate={handleNavigate} />;
      case 'paymentHistory':
        return <PaymentHistoryScreen onNavigate={handleNavigate} />;
      case 'invoice':
        return <InvoiceScreen onNavigate={handleNavigate} />;
      case 'refundRequest':
        return <RefundRequestScreen onNavigate={handleNavigate} />;
      case 'leaveReview':
        return <LeaveReviewScreen onNavigate={handleNavigate} />;
      case 'editReview':
        return <LeaveReviewScreen onNavigate={handleNavigate} isEditing />;
      case 'notifications':
        return <NotificationsScreen onNavigate={handleNavigate} userRole={userRole} />;
      case 'notificationDetail':
        return <NotificationDetailScreen onNavigate={handleNavigate} />;
      case 'settings':
        return userRole === 'contractor' ? <SettingsHub onNavigate={handleNavigate} /> : <SettingsScreen onNavigate={handleNavigate} userRole={userRole} />;
      case 'accountSettings':
        return <AccountSettingsScreen onNavigate={handleNavigate} />;
      case 'notificationSettings':
        return <NotificationSettingsScreen onNavigate={handleNavigate} />;
      case 'securitySettings':
        return <SecuritySettingsScreen onNavigate={handleNavigate} />;
      case 'passwordChange':
        return <PasswordChangeScreen onNavigate={handleNavigate} />;
      case 'languageSelection':
        return <LanguageSelectionScreen onNavigate={handleNavigate} />;
      case 'logout':
        return <LogoutConfirmationScreen onNavigate={handleNavigate} />;
      case 'pushPreferences':
        return <PushPreferencesScreen onNavigate={handleNavigate} />;
      case 'jobFeed':
        return <JobFeedScreen onNavigate={handleNavigate} />;
      case 'jobAlertSettings':
        return <JobAlertSettingsScreen onNavigate={handleNavigate} />;
      case 'createQuote':
        return <CreateQuoteScreen onNavigate={handleNavigate} />;
      case 'editQuote':
        return <CreateQuoteScreen onNavigate={handleNavigate} initialData={{ items: [{ id: '1', label: 'Labor', amount: 500 }, { id: '2', label: 'Materials', amount: 300 }], timeline: '3-5 days' }} />;
      case 'quotePreview':
        return <QuotePreviewScreen onNavigate={handleNavigate} />;
      case 'quoteSuccess':
        return <QuoteSuccessScreen onNavigate={handleNavigate} />;
      case 'quoteHistory':
        return <QuoteHistoryScreen onNavigate={handleNavigate} />;
      case 'quoteAnalytics':
        return <QuoteAnalyticsScreen onNavigate={handleNavigate} />;
      default:
        return <SplashScreen onNext={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentScreen}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
        >
          {renderScreen()}
        </motion.div>
      </AnimatePresence>
      {showBottomNav && <BottomNav currentScreen={currentScreen} onNavigate={handleNavigate} userRole={userRole} />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
