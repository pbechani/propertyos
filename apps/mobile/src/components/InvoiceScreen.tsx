import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet 
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Screen } from '../types';

interface InvoiceScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const InvoiceScreen: React.FC<InvoiceScreenProps> = ({ onNavigate }) => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            onPress={() => onNavigate('paymentHistory')}
            style={styles.backButton}
          >
            <FontAwesome5 name="chevron-left" size={24} color="#1F2937"  />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Invoice Details</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionButton}>
            <FontAwesome5 name="share-alt" size={20} color="#1F2937"  />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <FontAwesome5 name="download" size={20} color="#1F2937"  />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Invoice Header */}
        <View style={styles.invoiceHeader}>
          <View style={styles.invoiceHeaderTop}>
            <View>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>PAID</Text>
              </View>
              <Text style={styles.invoiceNumber}>#INV-2026-0324</Text>
              <Text style={styles.invoiceDate}>ISSUED MAR 24, 2026</Text>
            </View>
            <View style={styles.statusIcon}>
              <FontAwesome5 name="check-circle" size={32} color="#10B981"  />
            </View>
          </View>

          <View style={styles.addressGrid}>
            <View style={styles.addressBlock}>
              <Text style={styles.addressLabel}>FROM</Text>
              <Text style={styles.addressName}>Elite Plumbing Solutions</Text>
              <Text style={styles.addressDetails}>
                123 Contractor Lane{'\n'}San Francisco, CA 94103
              </Text>
            </View>
            <View style={[styles.addressBlock, styles.addressBlockRight]}>
              <Text style={styles.addressLabel}>TO</Text>
              <Text style={styles.addressName}>Pritesh Bechani</Text>
              <Text style={styles.addressDetails}>
                456 Homeowner Blvd{'\n'}San Francisco, CA 94110
              </Text>
            </View>
          </View>
        </View>

        {/* Itemized List */}
        <View style={styles.itemsSection}>
          <Text style={styles.sectionTitle}>ITEMIZED DETAILS</Text>
          <View style={styles.itemsCard}>
            <View style={styles.item}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemTitle}>Kitchen Remodel - Initial Deposit</Text>
                <Text style={styles.itemSub}>20% of total project value</Text>
              </View>
              <Text style={styles.itemAmount}>$2,540.00</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TOTAL DUE</Text>
              <Text style={styles.totalAmount}>$2,540.00</Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
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
    padding: 24,
  },
  invoiceHeader: {
    backgroundColor: '#F9FAFB',
    borderRadius: 48,
    padding: 32,
    gap: 32,
    marginBottom: 32,
  },
  invoiceHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statusBadge: {
    backgroundColor: '#1F2937',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  invoiceNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  invoiceDate: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
  },
  statusIcon: {
    width: 64,
    height: 64,
    backgroundColor: '#FFFFFF',
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  addressGrid: {
    flexDirection: 'row',
    gap: 32,
  },
  addressBlock: {
    flex: 1,
    gap: 8,
  },
  addressBlockRight: {
    alignItems: 'flex-end',
  },
  addressLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
  },
  addressName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  addressDetails: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 20,
  },
  itemsSection: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
    paddingHorizontal: 8,
  },
  itemsCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 40,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
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
