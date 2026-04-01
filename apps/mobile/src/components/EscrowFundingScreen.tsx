import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet 
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { Screen } from '../types';

interface EscrowFundingScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const EscrowFundingScreen: React.FC<EscrowFundingScreenProps> = ({ onNavigate }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFund = () => {
    setIsProcessing(true);
    setTimeout(() => {
      onNavigate('paymentSuccess');
    }, 3000);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => onNavigate('paymentMethod')}
          style={styles.backButton}
        >
          <FontAwesome5 name="chevron-left" size={24} color="#1F2937"  />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Fund Escrow</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Project Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View>
              <Text style={styles.projectTitle}>Kitchen Remodel</Text>
              <Text style={styles.projectSubtitle}>CONTRACTOR: MARCO ROSSI</Text>
            </View>
            <View style={styles.lockIcon}>
              <FontAwesome5 name="lock" size={20} color="#1F2937"  />
            </View>
          </View>

          <View style={styles.costBreakdown}>
            <View style={styles.costRow}>
              <Text style={styles.costLabel}>Total Project Value</Text>
              <Text style={styles.costValue}>$12,700.00</Text>
            </View>
            <View style={styles.costRow}>
              <Text style={styles.costLabel}>Initial Deposit (20%)</Text>
              <Text style={styles.costValue}>$2,540.00</Text>
            </View>
            <View style={styles.costRow}>
              <Text style={styles.costLabel}>Service Fee</Text>
              <Text style={styles.costValue}>$45.00</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Amount to Fund</Text>
              <Text style={styles.totalAmount}>$2,585.00</Text>
            </View>
          </View>
        </View>

        {/* Payment Method Preview */}
        <View style={styles.paymentSection}>
          <Text style={styles.sectionTitle}>FUNDING SOURCE</Text>
          <TouchableOpacity style={styles.paymentCard}>
            <View style={styles.paymentLeft}>
              <View style={styles.paymentIcon}>
                <FontAwesome5 name="credit-card" size={20} color="#1F2937"  />
              </View>
              <View>
                <Text style={styles.paymentName}>Visa •••• 4242</Text>
                <Text style={styles.paymentExpiry}>EXPIRES 12/26</Text>
              </View>
            </View>
            <Text style={styles.changeText}>Change</Text>
          </TouchableOpacity>
        </View>

        {/* Security Info */}
        <View style={styles.securityCard}>
          <FontAwesome5 name="shield-alt" size={20} color="#10B981"  />
          <Text style={styles.securityText}>
            Funds are held securely in escrow and only released when you approve completed work.
          </Text>
        </View>
      </ScrollView>

      {/* Fund Button */}
      <View style={styles.actionBar}>
        <TouchableOpacity 
          onPress={handleFund}
          disabled={isProcessing}
          style={[styles.fundButton, isProcessing && styles.fundButtonDisabled]}
        >
          {isProcessing ? (
            <Text style={styles.fundButtonText}>Processing...</Text>
          ) : (
            <>
              <Text style={styles.fundButtonText}>Fund Escrow • $2,585.00</Text>
              <FontAwesome5 name="arrow-right" size={20} color="#FFFFFF"  />
            </>
          )}
        </TouchableOpacity>
      </View>
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
    gap: 16,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  content: {
    flex: 1,
  },
  summaryCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 48,
    padding: 32,
    margin: 24,
    gap: 24,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  projectTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  projectSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
  },
  lockIcon: {
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
  costBreakdown: {
    gap: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  costLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  costValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  paymentSection: {
    paddingHorizontal: 24,
    gap: 16,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
    paddingHorizontal: 8,
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    padding: 24,
    borderRadius: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  paymentIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  paymentExpiry: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
  },
  changeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3B82F6',
  },
  securityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#D1FAE5',
    padding: 20,
    marginHorizontal: 24,
    borderRadius: 32,
    marginBottom: 32,
  },
  securityText: {
    flex: 1,
    fontSize: 12,
    color: '#047857',
    lineHeight: 20,
  },
  actionBar: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  fundButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#1F2937',
    paddingVertical: 24,
    borderRadius: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  fundButtonDisabled: {
    opacity: 0.6,
  },
  fundButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  iconSection: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: 150,
  },
  textContent: {
    alignItems: 'center',
    gap: 16,
  },
  detailsCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#F9FAFB',
    borderRadius: 40,
    padding: 32,
    gap: 24,
  },
  primaryActions: {
    width: '100%',
    maxWidth: 400,
    gap: 16,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1F2937',
    paddingVertical: 20,
    borderRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F9FAFB',
    paddingVertical: 16,
    borderRadius: 32,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
});
