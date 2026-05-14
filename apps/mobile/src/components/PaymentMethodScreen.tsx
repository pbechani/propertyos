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

interface PaymentMethodScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const PaymentMethodScreen: React.FC<PaymentMethodScreenProps> = ({ onNavigate }) => {
  const [selectedMethod, setSelectedMethod] = useState('card-1');

  const methods = [
    { id: 'card-1', type: 'card', brand: 'Visa', last4: '4242', expiry: '12/26', isDefault: true },
    { id: 'card-2', type: 'card', brand: 'Mastercard', last4: '8888', expiry: '08/25', isDefault: false },
    { id: 'bank-1', type: 'bank', bankName: 'Chase Bank', last4: '1234', isDefault: false }
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => onNavigate('homeownerProfile')}
          style={styles.backButton}
        >
          <FontAwesome5 name="chevron-left" size={24} color="#1F2937"  />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Method</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Security Banner */}
        <View style={styles.securityBanner}>
          <View style={styles.securityIcon}>
            <FontAwesome5 name="shield-alt" size={24} color="#10B981"  />
          </View>
          <View style={styles.securityContent}>
            <Text style={styles.securityTitle}>Secure Payments</Text>
            <Text style={styles.securityText}>
              Your payment information is encrypted and stored securely. We never share your full card details.
            </Text>
          </View>
        </View>

        {/* Payment Methods List */}
        <View style={styles.methodsSection}>
          <View style={styles.methodsHeader}>
            <Text style={styles.sectionTitle}>SAVED METHODS</Text>
            <TouchableOpacity style={styles.addButton}>
              <FontAwesome5 name="plus" size={12} color="#1F2937"  />
              <Text style={styles.addButtonText}>ADD NEW</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.methodsList}>
            {methods.map((method) => (
              <MotiView
                key={method.id}
                from={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <TouchableOpacity
                  onPress={() => setSelectedMethod(method.id)}
                  style={[
                    styles.methodCard,
                    selectedMethod === method.id && styles.methodCardActive
                  ]}
                >
                  <View style={styles.methodLeft}>
                    <View style={[
                      styles.methodIcon,
                      selectedMethod === method.id && styles.methodIconActive
                    ]}>
                      {method.type === 'card' ? (
                        <FontAwesome5 name="credit-card" size={20} color={selectedMethod === method.id ? '#FFFFFF' : '#9CA3AF'}  />
                      ) : (
                        <FontAwesome5 name="landmark" size={20} color={selectedMethod === method.id ? '#FFFFFF' : '#9CA3AF'}  />
                      )}
                    </View>
                    <View>
                      <Text style={[styles.methodName, selectedMethod === method.id && styles.methodNameActive]}>
                        {method.type === 'card' ? `${method.brand} •••• ${method.last4}` : `${method.bankName} •••• ${method.last4}`}
                      </Text>
                      <Text style={styles.methodSub}>
                        {method.type === 'card' ? `Expires ${method.expiry}` : 'Bank Account'}
                      </Text>
                    </View>
                  </View>
                  {selectedMethod === method.id && (
                    <View style={styles.checkIcon}>
                      <FontAwesome5 name="check" size={18} color="#FFFFFF"  />
                    </View>
                  )}
                </TouchableOpacity>
              </MotiView>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.actionBar}>
        <TouchableOpacity 
          onPress={() => onNavigate('paymentSuccess')}
          style={styles.continueButton}
        >
          <Text style={styles.continueButtonText}>Continue to Payment</Text>
          <FontAwesome5 name="arrow-right" size={20} color="#FFFFFF"  />
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
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
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 20,
  },
  content: {
    flex: 1,
  },
  securityBanner: {
    flexDirection: 'row',
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    padding: 24,
    borderRadius: 40,
    gap: 16,
    margin: 24,
  },
  securityIcon: {
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
  securityContent: {
    flex: 1,
    gap: 4,
  },
  securityTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#065F46',
  },
  securityText: {
    fontSize: 12,
    color: '#047857',
    lineHeight: 20,
  },
  methodsSection: {
    padding: 24,
    gap: 16,
  },
  methodsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButtonText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: 1.5,
  },
  methodsList: {
    gap: 12,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    padding: 24,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  methodCardActive: {
    backgroundColor: '#1F2937',
    borderColor: '#1F2937',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  methodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  methodIcon: {
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
  methodIconActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  methodName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  methodNameActive: {
    color: '#FFFFFF',
  },
  methodSub: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  checkIcon: {
    width: 32,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBar: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#1F2937',
    paddingVertical: 20,
    borderRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  addressBlockRight: {
    alignItems: 'flex-end',
  },
  itemsSection: {
    gap: 16,
    paddingHorizontal: 24,
  },
  itemsCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 40,
    padding: 24,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemInfo: {
    flex: 1,
    gap: 4,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  itemSub: {
    fontSize: 12,
    color: '#6B7280',
  },
  itemAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
});
