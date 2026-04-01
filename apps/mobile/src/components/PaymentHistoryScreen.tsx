import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  StyleSheet,
  Platform 
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { Screen } from '../types';

interface PaymentHistoryScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const PaymentHistoryScreen: React.FC<PaymentHistoryScreenProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'escrow' | 'refunds'>('all');
  const [searchText, setSearchText] = useState('');

  const transactions = [
    { 
      id: '1', 
      title: 'Kitchen Remodel - Escrow Funding', 
      type: 'escrow', 
      amount: '$2,585.00', 
      date: 'Mar 24, 2026', 
      status: 'funded', 
      iconComponent: Wallet, 
      color: '#3B82F6', 
      bgColor: '#EFF6FF' 
    },
    { 
      id: '2', 
      title: 'Bathroom Tiling - Milestone 1', 
      type: 'payment', 
      amount: '$1,200.00', 
      date: 'Mar 15, 2026', 
      status: 'released', 
      iconComponent: ShieldCheck, 
      color: '#10B981', 
      bgColor: '#D1FAE5' 
    },
    { 
      id: '3', 
      title: 'Deck Construction - Refund', 
      type: 'refund', 
      amount: '$450.00', 
      date: 'Mar 10, 2026', 
      status: 'refunded', 
      iconComponent: ArrowDownLeft, 
      color: '#F59E0B', 
      bgColor: '#FEF3C7' 
    },
    { 
      id: '4', 
      title: 'Basement Finishing - Final Payment', 
      type: 'payment', 
      amount: '$3,500.00', 
      date: 'Feb 28, 2026', 
      status: 'released', 
      iconComponent: ShieldCheck, 
      color: '#10B981', 
      bgColor: '#D1FAE5' 
    }
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            onPress={() => onNavigate('homeownerProfile')}
            style={styles.backButton}
          >
            <FontAwesome5 name="chevron-left" size={24} color="#1F2937"  />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment History</Text>
        </View>

        {/* Search & Filter */}
        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <FontAwesome5 name="search" size={18} color="#9CA3AF" style={styles.searchIcon}  />
            <TextInput 
              placeholder="Search transactions..." 
              placeholderTextColor="#9CA3AF"
              value={searchText}
              onChangeText={setSearchText}
              style={styles.searchInput}
            />
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <FontAwesome5 name="filter" size={20} color="#1F2937"  />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {(['all', 'escrow', 'refunds'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Transactions List */}
      <ScrollView style={styles.content}>
        {transactions.map((tx, i) => {
          const IconComponent = tx.iconComponent;
          return (
            <MotiView
              key={tx.id}
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: i * 50, type: 'timing', duration: 300 }}
            >
              <TouchableOpacity 
                onPress={() => onNavigate('invoice')}
                style={styles.transactionCard}
                activeOpacity={0.8}
              >
                <View style={styles.transactionContent}>
                  <View style={styles.transactionLeft}>
                    <View style={[styles.transactionIcon, { backgroundColor: tx.bgColor }]}>
                      <IconComponent size={18} color={tx.color} />
                    </View>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionTitle}>{tx.title}</Text>
                      <View style={styles.transactionMeta}>
                        <Text style={styles.transactionDate}>{tx.date}</Text>
                        <Text style={styles.metaSeparator}>•</Text>
                        <Text style={[styles.transactionStatus, { color: tx.color }]}>
                          {tx.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.transactionRight}>
                    <Text style={styles.transactionAmount}>{tx.amount}</Text>
                    <TouchableOpacity style={styles.downloadButton}>
                      <FontAwesome5 name="download" size={16} color="#D1D5DB"  />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            </MotiView>
          );
        })}
      </ScrollView>

      {/* Export Button */}
      <View style={styles.exportBar}>
        <TouchableOpacity style={styles.exportButton}>
          <FontAwesome5 name="file-alt" size={18} color="#FFFFFF"  />
          <Text style={styles.exportButtonText}>Export Statement (PDF)</Text>
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingTop: 48,
    paddingBottom: 24,
    paddingHorizontal: 24,
    gap: 24,
  },
  headerTop: {
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
  searchRow: {
    flexDirection: 'row',
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
  },
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    padding: 4,
    borderRadius: 16,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
  },
  tabTextActive: {
    color: '#1F2937',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  transactionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 40,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    padding: 24,
    marginBottom: 16,
  },
  transactionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
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
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  transactionDate: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  metaSeparator: {
    fontSize: 10,
    color: '#D1D5DB',
  },
  transactionStatus: {
    fontSize: 10,
    fontWeight: '700',
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
    color: '#1F2937',
  },
  downloadButton: {
    padding: 4,
  },
  exportBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  exportButton: {
    backgroundColor: '#1F2937',
    paddingVertical: 20,
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  exportButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
