import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet,
  Platform 
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { Screen } from '../types';

interface ScreenProps {
  onNavigate: (screen: Screen) => void;
}

const earningsData = [
  { name: 'Mon', amount: 450 },
  { name: 'Tue', amount: 800 },
  { name: 'Wed', amount: 600 },
  { name: 'Thu', amount: 1200 },
  { name: 'Fri', amount: 950 },
  { name: 'Sat', amount: 1500 },
  { name: 'Sun', amount: 1100 },
];

const transactions = [
  { id: 'TX12345', type: 'Payment', title: 'Kitchen Remodel Milestone 2', date: 'Mar 24, 2026', amount: 1250, status: 'Completed', iconComponent: DollarSign, color: '#10B981', bgColor: '#D1FAE5' },
  { id: 'TX12346', type: 'Withdrawal', title: 'Withdrawal to Chase Bank', date: 'Mar 22, 2026', amount: -2500, status: 'Processing', iconComponent: ArrowUpRight, color: '#3B82F6', bgColor: '#EFF6FF' },
  { id: 'TX12347', type: 'Payment', title: 'Bathroom Tile Completion', date: 'Mar 20, 2026', amount: 850, status: 'Completed', iconComponent: DollarSign, color: '#10B981', bgColor: '#D1FAE5' },
  { id: 'TX12348', type: 'Fee', title: 'Service Fee - Kitchen Remodel', date: 'Mar 24, 2026', amount: -62.50, status: 'Completed', iconComponent: AlertCircle, color: '#9CA3AF', bgColor: '#F9FAFB' },
];

export const EarningsDashboardScreen: React.FC<ScreenProps> = ({ onNavigate }) => {
  return (
    <View style={styles.container}>
      {/* Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => onNavigate('contractorHome')} style={styles.backButton}>
            <FontAwesome5 name="arrow-left" size={24} color="#1F2937"  />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Earnings</Text>
          <TouchableOpacity style={styles.downloadButton}>
            <FontAwesome5 name="download" size={20} color="#1F2937"  />
          </TouchableOpacity>
        </View>

        <View style={styles.balanceSection}>
          <Text style={styles.balanceLabel}>AVAILABLE BALANCE</Text>
          <Text style={styles.balanceAmount}>$8,450.00</Text>
          <View style={styles.trendRow}>
            <FontAwesome5 name="chart-line" size={14} color="#10B981"  />
            <Text style={styles.trendText}>+12% from last month</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>PENDING</Text>
            <Text style={styles.statValue}>$2,120.00</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>THIS MONTH</Text>
            <Text style={styles.statValue}>$12,450.00</Text>
          </View>
        </View>

        <TouchableOpacity 
          onPress={() => onNavigate('withdrawFunds')}
          style={styles.withdrawButton}
          activeOpacity={0.9}
        >
          <Text style={styles.withdrawButtonText}>Withdraw Funds</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Earnings Chart Placeholder */}
        <View style={styles.section}>
          <View style={styles.chartHeader}>
            <Text style={styles.sectionTitle}>REVENUE (LAST 7 DAYS)</Text>
            <View style={styles.periodSelector}>
              <Text style={styles.periodText}>WEEKLY</Text>
              <FontAwesome5 name="calendar" size={12} color="#1F2937"  />
            </View>
          </View>
          <View style={styles.chartPlaceholder}>
            <Text style={styles.chartPlaceholderText}>Chart visualization coming soon</Text>
            <Text style={styles.chartPlaceholderSubtext}>Weekly revenue: $6,500</Text>
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.transactionsHeader}>
            <Text style={styles.sectionTitle}>RECENT ACTIVITY</Text>
            <TouchableOpacity 
              onPress={() => onNavigate('transactionHistory')}
              style={styles.seeAllButton}
            >
              <Text style={styles.seeAllText}>SEE ALL</Text>
              <FontAwesome5 name="chevron-right" size={14} color="#1F2937"  />
            </TouchableOpacity>
          </View>
          <View style={styles.transactionsList}>
            {transactions.slice(0, 3).map((tx, i) => {
              const IconComponent = tx.iconComponent;
              return (
                <MotiView
                  key={tx.id}
                  from={{ opacity: 0, translateX: -20 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  transition={{ delay: i * 80, type: 'timing', duration: 300 }}
                >
                  <TouchableOpacity 
                    onPress={() => onNavigate('payoutStatus')}
                    style={[
                      styles.transactionItem,
                      i !== transactions.slice(0, 3).length - 1 && styles.transactionItemBorder
                    ]}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.transactionIcon, { backgroundColor: tx.bgColor }]}>
                      <IconComponent size={18} color={tx.color} />
                    </View>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionTitle} numberOfLines={1}>{tx.title}</Text>
                      <Text style={styles.transactionDate}>{tx.date}</Text>
                    </View>
                    <View style={styles.transactionRight}>
                      <Text style={[
                        styles.transactionAmount,
                        tx.amount > 0 ? styles.transactionAmountPositive : styles.transactionAmountNegative
                      ]}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                      </Text>
                      <Text style={styles.transactionStatus}>{tx.status}</Text>
                    </View>
                  </TouchableOpacity>
                </MotiView>
              );
            })}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            onPress={() => onNavigate('bankDetails')}
            style={styles.quickActionCard}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#EFF6FF' }]}>
              <FontAwesome5 name="building" size={24} color="#3B82F6"  />
            </View>
            <Text style={styles.quickActionText}>BANK DETAILS</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => onNavigate('taxSummary')}
            style={styles.quickActionCard}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#F3E8FF' }]}>
              <FontAwesome5 name="file-alt" size={24} color="#A855F7"  />
            </View>
            <Text style={styles.quickActionText}>TAX SUMMARY</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

// Placeholder screens
export const TransactionHistoryScreen: React.FC<ScreenProps> = ({ onNavigate }) => (
  <View style={styles.placeholderContainer}>
    <FontAwesome5 name="file-alt" size={64} color="#3B82F6"  />
    <Text style={styles.placeholderText}>Transaction History</Text>
    <TouchableOpacity style={styles.placeholderButton} onPress={() => onNavigate('contractorHome')}>
      <Text style={styles.placeholderButtonText}>Back</Text>
    </TouchableOpacity>
  </View>
);

export const WithdrawFundsScreen: React.FC<ScreenProps> = ({ onNavigate }) => (
  <View style={styles.placeholderContainer}>
    <FontAwesome5 name="dollar-sign" size={64} color="#10B981"  />
    <Text style={styles.placeholderText}>Withdraw Funds</Text>
    <TouchableOpacity style={styles.placeholderButton} onPress={() => onNavigate('contractorHome')}>
      <Text style={styles.placeholderButtonText}>Back</Text>
    </TouchableOpacity>
  </View>
);

export const BankDetailsScreen: React.FC<ScreenProps> = ({ onNavigate }) => (
  <View style={styles.placeholderContainer}>
    <FontAwesome5 name="building" size={64} color="#3B82F6"  />
    <Text style={styles.placeholderText}>Bank Details</Text>
    <TouchableOpacity style={styles.placeholderButton} onPress={() => onNavigate('contractorHome')}>
      <Text style={styles.placeholderButtonText}>Back</Text>
    </TouchableOpacity>
  </View>
);

export const PayoutStatusScreen: React.FC<ScreenProps> = ({ onNavigate }) => (
  <View style={styles.placeholderContainer}>
    <FontAwesome5 name="exclamation-circle" size={64} color="#F59E0B"  />
    <Text style={styles.placeholderText}>Payout Status</Text>
    <TouchableOpacity style={styles.placeholderButton} onPress={() => onNavigate('contractorHome')}>
      <Text style={styles.placeholderButtonText}>Back</Text>
    </TouchableOpacity>
  </View>
);

export const TaxSummaryScreen: React.FC<ScreenProps> = ({ onNavigate }) => (
  <View style={styles.placeholderContainer}>
    <FontAwesome5 name="file-alt" size={64} color="#A855F7"  />
    <Text style={styles.placeholderText}>Tax Summary</Text>
    <TouchableOpacity style={styles.placeholderButton} onPress={() => onNavigate('contractorHome')}>
      <Text style={styles.placeholderButtonText}>Back</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
    borderBottomLeftRadius: 48,
    borderBottomRightRadius: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 4,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  downloadButton: {
    padding: 8,
    marginRight: -8,
  },
  balanceSection: {
    alignItems: 'center',
    gap: 8,
  },
  balanceLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 2,
  },
  balanceAmount: {
    fontSize: 48,
    fontWeight: '900',
    color: '#1F2937',
    letterSpacing: -2,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 32,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 48,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  withdrawButton: {
    backgroundColor: '#1F2937',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  withdrawButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 24,
    gap: 16,
  },
  chartHeader: {
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
  periodSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  periodText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: 1.5,
  },
  chartPlaceholder: {
    backgroundColor: '#FFFFFF',
    borderRadius: 40,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    padding: 48,
    height: 256,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  chartPlaceholderText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  chartPlaceholderSubtext: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D1D5DB',
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: 1.5,
  },
  transactionsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 40,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    overflow: 'hidden',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 20,
  },
  transactionItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionInfo: {
    flex: 1,
    gap: 4,
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  transactionDate: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  transactionRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  transactionAmountPositive: {
    color: '#10B981',
  },
  transactionAmountNegative: {
    color: '#1F2937',
  },
  transactionStatus: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  placeholderContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 24,
  },
  placeholderText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  placeholderButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  placeholderButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
