/**
 * AppStack — authenticated screens.
 *
 * Wraps the bottom-tab navigator (AppTabs) and all detail/modal screens
 * that sit above the tabs in the stack hierarchy.
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../context/AuthContext';
import type {
  AppStackParamList,
  HomeownerTabParamList,
  ContractorTabParamList,
} from './types';

// ── Screen imports ────────────────────────────────────────────────────────────
import { HomeownerDashboard } from '../components/HomeownerDashboard';
import { ContractorDashboard } from '../components/ContractorDashboard';
import { DiscoverScreen } from '../components/DiscoverScreen';
import { MapView } from '../components/MapView';
import { ProjectsScreen } from '../components/ProjectsScreen';
import { SavedScreen } from '../components/SavedScreen';
import { PortfolioScreen } from '../components/PortfolioScreen';
import { ReviewsScreen } from '../components/ReviewsScreen';
import { AvailabilityScreen } from '../components/AvailabilityScreen';
import { ComplianceScreen } from '../components/ComplianceScreen';
import { CreateProjectScreen } from '../components/CreateProjectScreen';
import { VoiceInputScreen } from '../components/VoiceInputScreen';
import { AIBuilderScreen } from '../components/AIBuilderScreen';
import { DraftsScreen } from '../components/DraftsScreen';
import { ReportIssueScreen } from '../components/ReportIssueScreen';
import { ManualEntryScreen } from '../components/ManualEntryScreen';
import { JobSuccessScreen } from '../components/JobSuccessScreen';
import { QuotesListScreen } from '../components/QuotesListScreen';
import { QuoteDetailScreen } from '../components/QuoteDetailScreen';
import { QuoteComparisonScreen } from '../components/QuoteComparisonScreen';
import { HireContractorScreen } from '../components/HireContractorScreen';
import { ContractSuccessScreen } from '../components/ContractSuccessScreen';
import {
  ChatListScreen,
  ContractorChatScreen,
  ChatAttachmentsScreen,
  VoiceMessagesScreen,
  MessagingNotificationsScreen,
  BlockReportScreen,
} from '../components/MessagingSystem';
import { ConversationsListScreen } from '../components/ConversationsListScreen';
import { ChatScreen } from '../components/ChatScreen';
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
  ActiveJobChatScreen,
} from '../components/ActiveJobsSystem';
import {
  SettingsHub,
  AccountSettingsScreen,
  NotificationSettingsScreen,
  SecuritySettingsScreen,
  PasswordChangeScreen,
  LanguageSelectionScreen,
  LogoutConfirmationScreen,
} from '../components/SettingsSystem';
import {
  EarningsDashboardScreen,
  TransactionHistoryScreen,
  WithdrawFundsScreen,
  BankDetailsScreen,
  PayoutStatusScreen,
  TaxSummaryScreen,
} from '../components/EarningsSystem';
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
  DeactivateAccountScreen,
} from '../components/ProfileManagementSystem';
import { DisputeScreen } from '../components/DisputeScreen';
import { JobCompletionScreen } from '../components/JobCompletionScreen';
import { HomeownerProfileScreen } from '../components/HomeownerProfileScreen';
import { JobDetailScreen } from '../components/JobDetailScreen';
import { ContractPreviewScreen } from '../components/ContractPreviewScreen';
import { PaymentMethodScreen } from '../components/PaymentMethodScreen';
import { EscrowFundingScreen } from '../components/EscrowFundingScreen';
import { PaymentSuccessScreen } from '../components/PaymentSuccessScreen';
import { PaymentHistoryScreen } from '../components/PaymentHistoryScreen';
import { InvoiceScreen } from '../components/InvoiceScreen';
import { RefundRequestScreen } from '../components/RefundRequestScreen';
import { LeaveReviewScreen } from '../components/LeaveReviewScreen';
import { NotificationsScreen } from '../components/NotificationsScreen';
import { NotificationDetailScreen } from '../components/NotificationDetailScreen';
import { SettingsScreen } from '../components/SettingsScreen';
import { PushPreferencesScreen } from '../components/PushPreferencesScreen';
import { JobFeedScreen, JobAlertSettingsScreen } from '../components/JobFeedScreen';
import {
  CreateQuoteScreen,
  QuotePreviewScreen,
  QuoteSuccessScreen,
  QuoteHistoryScreen,
  QuoteAnalyticsScreen,
} from '../components/QuotationSystem';
import {
  CreateContractScreen,
  SignContractScreen,
  ContractDetailScreen,
} from '../components/ContractSystem';
import { ProfileScreen } from '../ProfileScreen';
import { ActiveJobsScreen } from '../components/ActiveJobsScreen';

// ── Tab navigators ────────────────────────────────────────────────────────────

const HomeownerTab = createBottomTabNavigator<HomeownerTabParamList>();
const ContractorTab = createBottomTabNavigator<ContractorTabParamList>();

function HomeownerTabs() {
  return (
    <HomeownerTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: { paddingBottom: 4 },
        tabBarIcon: ({ color, size }) => {
          const icons: Record<keyof HomeownerTabParamList, keyof typeof Ionicons.glyphMap> = {
            home: 'home-outline',
            discover: 'search-outline',
            projects: 'construct-outline',
            conversationsList: 'chatbubbles-outline',
            homeownerProfile: 'person-outline',
          };
          return <Ionicons name={icons[route.name as keyof HomeownerTabParamList]} size={size} color={color} />;
        },
      })}
    >
      <HomeownerTab.Screen name="home" component={HomeownerDashboard} options={{ tabBarLabel: 'Home' }} />
      <HomeownerTab.Screen name="discover" component={DiscoverScreen} options={{ tabBarLabel: 'Discover' }} />
      <HomeownerTab.Screen name="projects" component={ProjectsScreen} options={{ tabBarLabel: 'Projects' }} />
      <HomeownerTab.Screen name="conversationsList" component={ConversationsListScreen} options={{ tabBarLabel: 'Messages' }} />
      <HomeownerTab.Screen name="homeownerProfile" component={HomeownerProfileScreen} options={{ tabBarLabel: 'Profile' }} />
    </HomeownerTab.Navigator>
  );
}

function ContractorTabs() {
  return (
    <ContractorTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: { paddingBottom: 4 },
        tabBarIcon: ({ color, size }) => {
          const icons: Record<keyof ContractorTabParamList, keyof typeof Ionicons.glyphMap> = {
            contractorHome: 'home-outline',
            jobFeed: 'briefcase-outline',
            activeJobs: 'hammer-outline',
            conversationsList: 'chatbubbles-outline',
            profile: 'person-outline',
          };
          return <Ionicons name={icons[route.name as keyof ContractorTabParamList]} size={size} color={color} />;
        },
      })}
    >
      <ContractorTab.Screen name="contractorHome" component={ContractorDashboard} options={{ tabBarLabel: 'Home' }} />
      <ContractorTab.Screen name="jobFeed" component={JobFeedScreen} options={{ tabBarLabel: 'Jobs' }} />
      <ContractorTab.Screen name="activeJobs" component={ActiveJobsListScreen} options={{ tabBarLabel: 'Active' }} />
      <ContractorTab.Screen name="conversationsList" component={ChatListScreen} options={{ tabBarLabel: 'Messages' }} />
      <ContractorTab.Screen name="profile" component={ContractorProfileHub} options={{ tabBarLabel: 'Profile' }} />
    </ContractorTab.Navigator>
  );
}

/** Selects tab set based on authenticated user role */
function MainTabs() {
  const { mobileRole } = useAuth();
  return mobileRole === 'contractor' ? <ContractorTabs /> : <HomeownerTabs />;
}

// ── App stack ─────────────────────────────────────────────────────────────────

const AppStackNav = createNativeStackNavigator<AppStackParamList>();

export function AppStack() {
  const { mobileRole } = useAuth();

  return (
    <AppStackNav.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <AppStackNav.Screen name="MainTabs" component={MainTabs} />
      {/* Detail screens */}
      <AppStackNav.Screen name="map" component={MapView} />
      <AppStackNav.Screen name="saved" component={SavedScreen} />
      <AppStackNav.Screen name="portfolio" component={PortfolioScreen} />
      <AppStackNav.Screen name="reviews" component={ReviewsScreen} />
      <AppStackNav.Screen name="availability" component={AvailabilityScreen} />
      <AppStackNav.Screen name="compliance" component={ComplianceScreen} />
      <AppStackNav.Screen name="createProject" component={CreateProjectScreen} />
      <AppStackNav.Screen name="voiceInput" component={VoiceInputScreen} />
      <AppStackNav.Screen name="aiBuilder" component={AIBuilderScreen} />
      <AppStackNav.Screen name="drafts" component={DraftsScreen} />
      <AppStackNav.Screen name="reportIssue" component={ReportIssueScreen} />
      <AppStackNav.Screen name="manualEntry" component={ManualEntryScreen} />
      <AppStackNav.Screen name="jobSuccess" component={JobSuccessScreen} />
      <AppStackNav.Screen name="quotesList" component={QuotesListScreen} />
      <AppStackNav.Screen name="quoteDetail" component={QuoteDetailScreen} />
      <AppStackNav.Screen name="quoteComparison" component={QuoteComparisonScreen} />
      <AppStackNav.Screen name="hireContractor" component={HireContractorScreen} />
      <AppStackNav.Screen name="contractPreview" component={ContractPreviewScreen} />
      <AppStackNav.Screen name="contractSuccess" component={ContractSuccessScreen} />
      <AppStackNav.Screen name="chat" component={mobileRole === 'contractor' ? ContractorChatScreen : ChatScreen} />
      <AppStackNav.Screen name="chatAttachments" component={ChatAttachmentsScreen} />
      <AppStackNav.Screen name="voiceMessages" component={VoiceMessagesScreen} />
      <AppStackNav.Screen name="messagingNotifications" component={MessagingNotificationsScreen} />
      <AppStackNav.Screen name="blockReport" component={BlockReportScreen} />
      <AppStackNav.Screen name="jobDetail" component={mobileRole === 'contractor' ? ActiveJobDetailScreen : JobDetailScreen} />
      <AppStackNav.Screen name="updateProgress" component={UpdateProgressScreen} />
      <AppStackNav.Screen name="uploadMedia" component={UploadMediaScreen} />
      <AppStackNav.Screen name="markMilestone" component={MarkMilestoneScreen} />
      <AppStackNav.Screen name="requestPayment" component={RequestPaymentScreen} />
      <AppStackNav.Screen name="delayNotification" component={DelayNotificationScreen} />
      <AppStackNav.Screen name="cancelJobRequest" component={CancelJobRequestScreen} />
      <AppStackNav.Screen name="dispute" component={DisputeScreen} />
      <AppStackNav.Screen name="jobCompletion" component={mobileRole === 'homeowner' ? JobCompletionScreen : CompleteJobScreen} />
      <AppStackNav.Screen name="earningsDashboard" component={EarningsDashboardScreen} />
      <AppStackNav.Screen name="transactionHistory" component={TransactionHistoryScreen} />
      <AppStackNav.Screen name="withdrawFunds" component={WithdrawFundsScreen} />
      <AppStackNav.Screen name="bankDetails" component={BankDetailsScreen} />
      <AppStackNav.Screen name="payoutStatus" component={PayoutStatusScreen} />
      <AppStackNav.Screen name="taxSummary" component={TaxSummaryScreen} />
      <AppStackNav.Screen name="editProfile" component={EditProfileScreen} />
      <AppStackNav.Screen name="addServices" component={AddServicesScreen} />
      <AppStackNav.Screen name="portfolioUpload" component={PortfolioUploadScreen} />
      <AppStackNav.Screen name="certificationsUpload" component={CertificationsUploadScreen} />
      <AppStackNav.Screen name="pricingSetup" component={PricingSetupScreen} />
      <AppStackNav.Screen name="availabilitySchedule" component={AvailabilityScheduleScreen} />
      <AppStackNav.Screen name="serviceAreaMap" component={ServiceAreaMapScreen} />
      <AppStackNav.Screen name="verificationStatus" component={VerificationStatusScreen} />
      <AppStackNav.Screen name="reviewsReceived" component={ReviewsReceivedScreen} />
      <AppStackNav.Screen name="respondToReview" component={RespondToReviewScreen} />
      <AppStackNav.Screen name="profilePreview" component={ProfilePreviewScreen} />
      <AppStackNav.Screen name="deactivateAccount" component={DeactivateAccountScreen} />
      <AppStackNav.Screen name="paymentMethod" component={PaymentMethodScreen} />
      <AppStackNav.Screen name="escrowFunding" component={EscrowFundingScreen} />
      <AppStackNav.Screen name="paymentSuccess" component={PaymentSuccessScreen} />
      <AppStackNav.Screen name="paymentHistory" component={PaymentHistoryScreen} />
      <AppStackNav.Screen name="invoice" component={InvoiceScreen} />
      <AppStackNav.Screen name="refundRequest" component={RefundRequestScreen} />
      <AppStackNav.Screen name="leaveReview" component={LeaveReviewScreen} />
      <AppStackNav.Screen name="editReview" component={LeaveReviewScreen} />
      <AppStackNav.Screen name="notifications" component={NotificationsScreen} />
      <AppStackNav.Screen name="notificationDetail" component={NotificationDetailScreen} />
      <AppStackNav.Screen name="settings" component={mobileRole === 'contractor' ? SettingsHub : SettingsScreen} />
      <AppStackNav.Screen name="accountSettings" component={AccountSettingsScreen} />
      <AppStackNav.Screen name="notificationSettings" component={NotificationSettingsScreen} />
      <AppStackNav.Screen name="securitySettings" component={SecuritySettingsScreen} />
      <AppStackNav.Screen name="passwordChange" component={PasswordChangeScreen} />
      <AppStackNav.Screen name="languageSelection" component={LanguageSelectionScreen} />
      <AppStackNav.Screen name="logout" component={LogoutConfirmationScreen} />
      <AppStackNav.Screen name="pushPreferences" component={PushPreferencesScreen} />
      <AppStackNav.Screen name="jobAlertSettings" component={JobAlertSettingsScreen} />
      <AppStackNav.Screen name="createQuote" component={CreateQuoteScreen} />
      <AppStackNav.Screen name="editQuote" component={CreateQuoteScreen} />
      <AppStackNav.Screen name="quotePreview" component={QuotePreviewScreen} />
      <AppStackNav.Screen name="quoteSuccess" component={QuoteSuccessScreen} />
      <AppStackNav.Screen name="quoteHistory" component={QuoteHistoryScreen} />
      <AppStackNav.Screen name="quoteAnalytics" component={QuoteAnalyticsScreen} />
      <AppStackNav.Screen name="createContract" component={CreateContractScreen} />
      <AppStackNav.Screen name="signContract" component={SignContractScreen} />
      <AppStackNav.Screen name="contractDetail" component={ContractDetailScreen} />
    </AppStackNav.Navigator>
  );
}
