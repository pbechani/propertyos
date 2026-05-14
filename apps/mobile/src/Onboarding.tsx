import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  StyleSheet, 
  Dimensions 
} from 'react-native';
import { MotiView } from 'moti';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// --- Onboarding 1 ---
export const Onboarding1: React.FC<{ onNext: () => void; onSkip: () => void }> = ({ onNext, onSkip }) => (
  <ScrollView contentContainerStyle={styles.container}>
    <View style={styles.card}>
      <View style={styles.imageContainer}>
        <View style={styles.imageWrapper}>
          <Image 
            style={styles.image}
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDRd1o9Yx9LyZ3t_iNlcf64woEyi_dp9ae8cYXkCcbp2HO14GycfXVuDy_2hN7x1gRJ1WSlC80lLcr-Q-3Jl86a6xt36f6jhC-BPq9KXJWMlWUvqJAC5T_2qS_uP-FgvPQ8gfMEJbJT0B7G9FLJrG10uXUKYpc2fZFGdObI4awqPGvECvPXcETJgiTgFQNkrQLvj6xNfmgT8NB_o-4GjBUv9uWSiU6o9LM8vqMH87L6mn_h3y_wJXXeMT_gaXcK_sZGPqoHxHSsGeE' }}
            resizeMode="cover"
          />
          <View style={styles.badgeContainer}>
            <View style={styles.badge}>
              <View style={styles.badgeIcon}>
                <MaterialIcons name="verified" size={24} color="#3B82F6" />
              </View>
              <View>
                <Text style={styles.badgeLabel}>VERIFIED PRO</Text>
                <Text style={styles.badgeName}>Mark Stevenson</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.onboardingTitle}>Find Trusted Pros</Text>
        <Text style={styles.onboardingSubtitle}>
          Connect with verified contractors and get your home projects done with architectural precision.
        </Text>

        <View style={styles.dots}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={onNext}>
          <Text style={styles.primaryButtonText}>Next</Text>
          <FontAwesome5 name="arrow-right" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity onPress={onSkip} style={styles.skipButton}>
          <Text style={styles.skipButtonText}>Skip onboarding</Text>
        </TouchableOpacity>
      </View>
    </View>
  </ScrollView>
);

// --- Onboarding 2 ---
export const Onboarding2: React.FC<{ onNext: () => void; onBack: () => void }> = ({ onNext, onBack }) => (
  <View style={styles.fullContainer}>
    <ScrollView contentContainerStyle={styles.onboarding2Container}>
      <View style={styles.projectCard}>
        <View style={styles.projectInfo}>
          <Text style={styles.projectLabel}>ACTIVE PROJECT</Text>
          <Text style={styles.projectTitle}>Modern Kitchen Remodel</Text>

          <View style={styles.progressCard}>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Progress</Text>
              <Text style={styles.progressValue}>85%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '85%' }]} />
            </View>
            <View style={styles.milestoneRow}>
              <FontAwesome5 name="check-circle" size={20} color="#3B82F6" />
              <Text style={styles.milestoneText}>Cabinetry Installation Complete</Text>
            </View>
          </View>

          <View style={styles.avatarRow}>
            {[1, 2, 3].map((i) => (
              <Image
                key={i}
                style={styles.avatar}
                source={{ uri: `https://picsum.photos/seed/user${i}/100/100` }}
              />
            ))}
            <View style={styles.avatarMore}>
              <Text style={styles.avatarMoreText}>+4</Text>
            </View>
          </View>
        </View>

        <Image 
          style={styles.projectImage}
          source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBpd8sZbvis3yAypRJCci_6XFU-xRH4vcCvM0sYYLv_h4drGwVxN9GVp2eRaix3Z9vG8R-S7NTC5Q8TxLSqOxvyQShLecvFaosPVI-QKjEAVBxaba1C1Jw9TVqyoBTmwazaIfsc16TjRAXrvqMCUloOUuufG5mvpLHjaElAtEDuXJef4wER418NDsrC3zkmiXst7qAK72iBTpq3-JhTMc8pLs4zNctIAlSEiDvCsIiyy_c0GAQSHalhJk4fKo61_-yt0hsNLo33nG8' }}
          resizeMode="cover"
        />
      </View>

      <View style={styles.onboarding2TextContainer}>
        <Text style={styles.onboarding2Title}>Track Your Projects</Text>
        <Text style={styles.onboarding2Subtitle}>
          Monitor real-time milestones, review high-resolution photo updates, and manage approvals—all from your personalized dashboard.
        </Text>
      </View>
    </ScrollView>

    <View style={styles.onboarding2Footer}>
      <View style={styles.dots2}>
        <View style={styles.dot2} />
        <View style={[styles.dot2, styles.dot2Active]} />
        <View style={styles.dot2} />
      </View>

      <View style={styles.navigationButtons}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <FontAwesome5 name="arrow-left" size={20} color="#6B7280" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.nextButton} onPress={onNext}>
          <Text style={styles.primaryButtonText}>Next</Text>
          <FontAwesome5 name="arrow-right" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

// --- Onboarding 3 ---
export const Onboarding3: React.FC<{ onNext: () => void }> = ({ onNext }) => (
  <View style={styles.fullContainer}>
    <View style={styles.header}>
      <Text style={styles.headerLogo}>BuildTrust</Text>
      <FontAwesome5 name="question-circle" size={24} color="#6B7280" />
    </View>

    <ScrollView contentContainerStyle={styles.onboarding3Container}>
      <View style={styles.onboarding3Card}>
        <MotiView
          from={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 12 }}
          style={styles.securePaymentIcon}
        >
          <View style={styles.secureIconWrapper}>
            <Image 
              style={styles.secureImage}
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC-J1RJrOIL056F-DvJ0zWCnE68dajYBBwCSV9CCFegnOnHa1dVnjh6dxlqgI_P5zqc-hKv7T1O0kErmlayTiFaqUD_hF2qgx8JgPR0zBZ-9l8KD_iYgeIgQotWgGZhIdXdHZccePRxA_eVQNab7s3NoTtjPetEff-vJ8rXluzDJFSLsg9Zq0OnssKTbA99rc-HeA3b2DStt_eofAppDKF8ekUr5IwXv7F6d6hfo6wMCgE4gqfe-wuq9JzIxX_BQeYlSccVuCok3PY' }}
              resizeMode="cover"
            />
            <View style={styles.shieldIconContainer}>
              <FontAwesome5 name="shield-alt" size={40} color="#3B82F6" />
            </View>
            <View style={styles.progressDots}>
              {[1, 2, 3].map((i) => (
                <View key={i} style={styles.progressDot} />
              ))}
            </View>
          </View>
        </MotiView>
      </View>

      <View style={styles.onboarding3TextContainer}>
        <Text style={styles.onboarding3Title}>Secure Payments</Text>
        <Text style={styles.onboarding3Subtitle}>
          Funds are held in escrow and only released when you're 100% satisfied with the milestone completion.
        </Text>
      </View>

      <View style={styles.finalDots}>
        <View style={styles.dot} />
        <View style={styles.dot} />
        <View style={[styles.dot, styles.dotActive]} />
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={onNext}>
        <Text style={styles.primaryButtonText}>Get Started</Text>
        <FontAwesome5 name="arrow-right" size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </ScrollView>
  </View>
);

// --- Terms ---
export const TermsScreen: React.FC<{ onNext: () => void; onDecline: () => void }> = ({ onNext, onDecline }) => {
  const [agreed, setAgreed] = React.useState(false);

  return (
    <View style={styles.fullContainer}>
      <View style={styles.termsHeader}>
        <View style={styles.termsHeaderLeft}>
          <FontAwesome5 name="arrow-left" size={24} color="#3B82F6" />
          <Text style={styles.termsHeaderTitle}>BuildTrust</Text>
        </View>
        <FontAwesome5 name="question-circle" size={24} color="#6B7280" />
      </View>

      <ScrollView style={styles.termsScroll}>
        <View style={styles.termsContainer}>
          <View style={styles.termsTitleSection}>
            <Text style={styles.termsTitle}>
              Terms of Service{'\n'}
              <Text style={styles.termsSubheading}>for Professionals</Text>
            </Text>
            <Text style={styles.termsIntro}>
              Please review our updated agreements.
            </Text>
          </View>

          <View style={styles.termsContent}>
            <ScrollView style={styles.termsScrollContent}>
              <View style={styles.termsSection}>
                <Text style={styles.termsSectionTitle}>1. Introduction</Text>
                <Text style={styles.termsSectionText}>
                  Welcome to BuildTrust. By accessing or using our platform, you agree to be bound by these Terms and Conditions.
                </Text>
              </View>

              <View style={styles.termsSection}>
                <Text style={styles.termsSectionTitle}>2. Service Provider Standards</Text>
                <Text style={styles.termsSectionText}>
                  All service providers on BuildTrust must maintain the highest levels of professional integrity.
                </Text>
              </View>
            </ScrollView>
          </View>

          <TouchableOpacity 
            style={styles.checkboxRow}
            onPress={() => setAgreed(!agreed)}
          >
            <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
              {agreed && <FontAwesome5 name="check-circle" size={16} color="#FFFFFF" />}
            </View>
            <Text style={styles.termsCheckboxLabel}>
              I have read and agree to the BuildTrust Terms and Conditions.
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.termsFooter}>
        <TouchableOpacity onPress={onDecline} style={styles.declineButton}>
          <Text style={styles.declineButtonText}>Decline</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.acceptButton, !agreed && styles.disabledButton]} 
          onPress={onNext}
          disabled={!agreed}
        >
          <Text style={styles.primaryButtonText}>Accept & Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  fullContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  card: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#F3F4F6',
    padding: 48,
  },
  imageWrapper: {
    flex: 1,
    backgroundColor: '#E5E7EB',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badgeContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  badgeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#3B82F6',
    letterSpacing: 1,
  },
  badgeName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  content: {
    padding: 32,
    alignItems: 'center',
  },
  onboardingTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  onboardingSubtitle: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 40,
    maxWidth: 320,
  },
  dots: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 40,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E5E7EB',
  },
  dotActive: {
    width: 32,
    backgroundColor: '#3B82F6',
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 32,
    paddingVertical: 18,
    paddingHorizontal: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  skipButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  skipButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
  onboarding2Container: {
    flexGrow: 1,
    paddingTop: 40,
    paddingHorizontal: 24,
    paddingBottom: 140,
  },
  projectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 48,
  },
  projectInfo: {
    marginBottom: 24,
  },
  projectLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#3B82F6',
    letterSpacing: 1,
    marginBottom: 8,
  },
  projectTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 24,
  },
  progressCard: {
    backgroundColor: '#F9FAFB',
    padding: 24,
    borderRadius: 12,
    marginBottom: 24,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3B82F6',
  },
  progressBar: {
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 6,
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  milestoneText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  avatarRow: {
    flexDirection: 'row',
    marginLeft: 0,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    marginLeft: -12,
  },
  avatarMore: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF3C7',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -12,
  },
  avatarMoreText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400E',
  },
  projectImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  onboarding2TextContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  onboarding2Title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 24,
  },
  onboarding2Subtitle: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 28,
    maxWidth: 480,
  },
  onboarding2Footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 32,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 32,
  },
  dots2: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  dot2: {
    width: 24,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E5E7EB',
  },
  dot2Active: {
    width: 48,
    backgroundColor: '#3B82F6',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B7280',
  },
  nextButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 32,
    paddingVertical: 18,
    paddingHorizontal: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  onboarding3Container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  onboarding3Card: {
    width: '100%',
    maxWidth: 400,
    aspectRatio: 1,
    marginBottom: 48,
  },
  securePaymentIcon: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secureIconWrapper: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  secureImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.6,
  },
  shieldIconContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#DBEAFE',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 10,
  },
  progressDots: {
    flexDirection: 'row',
    gap: 16,
    zIndex: 10,
  },
  progressDot: {
    width: 48,
    height: 8,
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  onboarding3TextContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  onboarding3Title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  onboarding3Subtitle: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 28,
    maxWidth: 420,
  },
  finalDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLogo: {
    fontSize: 18,
    fontWeight: '800',
    color: '#3B82F6',
    letterSpacing: -0.5,
  },
  termsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  termsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  termsHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#3B82F6',
    letterSpacing: -0.5,
  },
  termsScroll: {
    flex: 1,
  },
  termsContainer: {
    padding: 24,
  },
  termsTitleSection: {
    marginBottom: 40,
  },
  termsTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 16,
  },
  termsSubheading: {
    color: '#BFDBFE',
  },
  termsIntro: {
    fontSize: 18,
    color: '#6B7280',
    lineHeight: 28,
  },
  termsContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 24,
  },
  termsScrollContent: {
    maxHeight: 400,
    padding: 32,
  },
  termsSection: {
    marginBottom: 32,
  },
  termsSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  termsSectionText: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  termsCheckboxLabel: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  termsFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 24,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  declineButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
  },
  declineButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B7280',
  },
  acceptButton: {
    flex: 2,
    backgroundColor: '#3B82F6',
    borderRadius: 32,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#E5E7EB',
    opacity: 0.6,
  },
});
