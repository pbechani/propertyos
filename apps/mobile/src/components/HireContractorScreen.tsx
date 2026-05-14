import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  StyleSheet,
  Modal,
  Platform 
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { Screen } from '../types';

interface HireContractorScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const HireContractorScreen: React.FC<HireContractorScreenProps> = ({ onNavigate }) => {
  const [isSigned, setIsSigned] = useState(false);
  const [showContract, setShowContract] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const contractor = {
    name: 'Elite Plumbing Solutions',
    contractorName: 'Marco Rossi',
    amount: '$1,250',
    timeline: '3-4 days',
    deposit: '$625 (50%)',
    avatar: 'https://picsum.photos/seed/marco/100/100'
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            onPress={() => onNavigate('quoteDetail')}
            style={styles.backButton}
          >
            <FontAwesome5 name="chevron-left" size={24} color="#1F2937"  />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Hire Expert</Text>
        </View>
        <TouchableOpacity style={styles.infoButton}>
          <FontAwesome5 name="info-circle" size={20} color="#9CA3AF"  />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryGlow} />
          
          <View style={styles.contractorRow}>
            <Image 
              source={{ uri: contractor.avatar }}
              style={styles.contractorAvatar}
            />
            <View>
              <Text style={styles.contractorName}>{contractor.name}</Text>
              <Text style={styles.contractorTitle}>{contractor.contractorName}</Text>
            </View>
          </View>

          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>TOTAL AMOUNT</Text>
              <Text style={styles.summaryValue}>{contractor.amount}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>TIMELINE</Text>
              <Text style={styles.summaryValue}>{contractor.timeline}</Text>
            </View>
          </View>
        </View>

        {/* Protection Banner */}
        <View style={styles.protectionBanner}>
          <View style={styles.protectionIcon}>
            <FontAwesome5 name="shield-alt" size={20} color="#10B981"  />
          </View>
          <View style={styles.protectionContent}>
            <Text style={styles.protectionTitle}>Payment Protection Active</Text>
            <Text style={styles.protectionText}>
              Your funds are held securely in escrow and only released when you approve the completed work.
            </Text>
          </View>
        </View>

        {/* Contract Section */}
        <View style={styles.legalSection}>
          <Text style={styles.legalTitle}>LEGAL & TERMS</Text>
          
          <TouchableOpacity 
            onPress={() => setShowContract(true)}
            style={styles.contractButton}
            activeOpacity={0.8}
          >
            <View style={styles.contractButtonLeft}>
              <View style={styles.contractIcon}>
                <FontAwesome5 name="file-alt" size={24} color="#1F2937"  />
              </View>
              <View>
                <Text style={styles.contractButtonTitle}>Service Agreement</Text>
                <Text style={styles.contractButtonSubtitle}>Review full contract details</Text>
              </View>
            </View>
            <FontAwesome5 name="arrow-right" size={20} color="#D1D5DB"  />
          </TouchableOpacity>

          <View style={styles.depositCard}>
            <View style={styles.depositLeft}>
              <View style={styles.depositIcon}>
                <FontAwesome5 name="exclamation-circle" size={24} color="#1F2937"  />
              </View>
              <View>
                <Text style={styles.depositTitle}>Deposit Required</Text>
                <Text style={styles.depositSubtitle}>To secure the start date</Text>
              </View>
            </View>
            <Text style={styles.depositAmount}>{contractor.deposit}</Text>
          </View>
        </View>

        {/* Terms Checkbox */}
        <TouchableOpacity 
          onPress={() => setAgreedToTerms(!agreedToTerms)}
          style={styles.termsRow}
          activeOpacity={0.8}
        >
          <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
            {agreedToTerms && <FontAwesome5 name="check-circle" size={14} color="#FFFFFF"  />}
          </View>
          <Text style={styles.termsText}>
            I agree to the Service Agreement and authorize the deposit payment of {contractor.deposit} to be held in escrow.
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Action Button */}
      <View style={styles.actionBar}>
        <TouchableOpacity 
          disabled={!agreedToTerms}
          onPress={() => onNavigate('paymentMethod')}
          style={[styles.hireButton, !agreedToTerms && styles.hireButtonDisabled]}
          activeOpacity={0.9}
        >
          <Text style={[styles.hireButtonText, !agreedToTerms && styles.hireButtonTextDisabled]}>
            Confirm & Hire Expert
          </Text>
        </TouchableOpacity>
      </View>

      {/* Contract Modal */}
      <Modal
        visible={showContract}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowContract(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Service Agreement</Text>
            <TouchableOpacity onPress={() => setShowContract(false)} style={styles.closeButton}>
              <FontAwesome5 name="times" size={24} color="#1F2937"  />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.contractText}>
              This is a service agreement between you and {contractor.name}.
              {'\n\n'}
              Terms include: timeline, payment schedule, milestones, and dispute resolution.
              {'\n\n'}
              [Full contract content would appear here]
            </Text>
          </ScrollView>
          <View style={styles.modalActions}>
            <TouchableOpacity 
              onPress={() => setShowContract(false)}
              style={styles.modalButton}
            >
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  infoButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  summaryCard: {
    backgroundColor: '#1F2937',
    borderRadius: 40,
    padding: 32,
    marginTop: 24,
    marginBottom: 32,
    gap: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  summaryGlow: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 128,
    height: 128,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 64,
    transform: [{ translateX: 64 }, { translateY: -64 }],
  },
  contractorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  contractorAvatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  contractorName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  contractorTitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  summaryItem: {
    flex: 1,
    gap: 4,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: 1.5,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  protectionBanner: {
    flexDirection: 'row',
    backgroundColor: '#D1FAE5',
    borderRadius: 32,
    padding: 24,
    gap: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 32,
  },
  protectionIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  protectionContent: {
    flex: 1,
    gap: 4,
  },
  protectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#065F46',
  },
  protectionText: {
    fontSize: 12,
    color: '#047857',
    lineHeight: 20,
  },
  legalSection: {
    gap: 16,
    marginBottom: 24,
  },
  legalTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 2,
    paddingHorizontal: 8,
  },
  contractButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 48,
    padding: 24,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  contractButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  contractIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  contractButtonTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  contractButtonSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  depositCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 48,
    padding: 24,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  depositLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  depositIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  depositTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  depositSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  depositAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  termsRow: {
    flexDirection: 'row',
    gap: 16,
    padding: 16,
    marginBottom: 24,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#1F2937',
    borderColor: '#1F2937',
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 20,
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  hireButton: {
    backgroundColor: '#1F2937',
    paddingVertical: 24,
    borderRadius: 48,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  hireButtonDisabled: {
    backgroundColor: '#F3F4F6',
    opacity: 0.6,
  },
  hireButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  hireButtonTextDisabled: {
    color: '#9CA3AF',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
  },
  modalContent: {
    flex: 1,
    padding: 24,
  },
  contractText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 24,
  },
  modalActions: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  modalButton: {
    backgroundColor: '#1F2937',
    paddingVertical: 16,
    borderRadius: 32,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
