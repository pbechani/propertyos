import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet,
  Dimensions 
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { Screen } from '../types';

interface PaymentSuccessScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const PaymentSuccessScreen: React.FC<PaymentSuccessScreenProps> = ({ onNavigate }) => {
  return (
    <View style={styles.container}>
      {/* Success Icon */}
      <View style={styles.iconSection}>
        <MotiView 
          from={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          style={styles.successIcon}
        >
          <FontAwesome5 name="check-circle" size={64} color="#FFFFFF"  />
        </MotiView>
        
        <MotiView 
          from={{ scale: 1, opacity: 0.5 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{ loop: true, duration: 3000, type: 'timing' }}
          style={styles.pulseGlow}
        />
        
        <MotiView 
          from={{ rotate: '0deg' }}
          animate={{ rotate: '360deg' }}
          transition={{ loop: true, duration: 8000, type: 'timing' }}
          style={styles.sparkleIcon}
        >
          <FontAwesome5 name="sparkles" size={32} color="#F59E0B"  />
        </MotiView>
      </View>

      {/* Text Content */}
      <View style={styles.textContent}>
        <Text style={styles.title}>Payment Successful!</Text>
        <Text style={styles.subtitle}>
          $2,585.00 has been successfully funded into escrow for the Kitchen Remodel project.
        </Text>
      </View>

      {/* Transaction Details */}
      <View style={styles.detailsCard}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Transaction ID</Text>
          <Text style={styles.detailValue}>#TXN-8829-XJ</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Date</Text>
          <Text style={styles.detailValue}>Mar 24, 2026 • 20:01</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Status</Text>
          <View style={styles.statusRow}>
            <FontAwesome5 name="shield-alt" size={14} color="#10B981"  />
            <Text style={styles.statusText}>Escrow Funded</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionButton}>
            <FontAwesome5 name="download" size={14} color="#1F2937"  />
            <Text style={styles.actionText}>RECEIPT</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <FontAwesome5 name="share-alt" size={14} color="#1F2937"  />
            <Text style={styles.actionText}>SHARE</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Primary Actions */}
      <View style={styles.primaryActions}>
        <TouchableOpacity 
          onPress={() => onNavigate('jobDetail')}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>View Project</Text>
          <FontAwesome5 name="arrow-right" size={20} color="#FFFFFF"  />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => onNavigate('homeownerHome')}
          style={styles.secondaryButton}
        >
          <FontAwesome5 name="home" size={20} color="#1F2937"  />
          <Text style={styles.secondaryButtonText}>Go to Dashboard</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 48,
  },
  iconSection: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: 150,
  },
  successIcon: {
    width: 128,
    height: 128,
    backgroundColor: '#10B981',
    borderRadius: 64,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 10,
  },
  pulseGlow: {
    position: 'absolute',
    width: 128,
    height: 128,
    backgroundColor: '#10B981',
    borderRadius: 64,
    opacity: 0.2,
  },
  sparkleIcon: {
    position: 'absolute',
    top: -16,
    right: -16,
  },
  textContent: {
    alignItems: 'center',
    gap: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: 320,
  },
  detailsCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#F9FAFB',
    borderRadius: 40,
    padding: 32,
    gap: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  actionText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: 1.5,
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
