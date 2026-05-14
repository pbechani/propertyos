import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  StyleSheet,
  Modal,
  TextInput 
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { Screen } from '../types';

interface QuoteDetailScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const QuoteDetailScreen: React.FC<QuoteDetailScreenProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'breakdown' | 'terms'>('overview');
  const [showNegotiate, setShowNegotiate] = useState(false);
  const [counterAmount, setCounterAmount] = useState('1150');

  const quote = {
    id: '1',
    contractor: 'Elite Plumbing Solutions',
    contractorName: 'Marco Rossi',
    rating: 4.9,
    reviews: 124,
    amount: '$1,250',
    timeline: '3-4 days',
    avatar: 'https://picsum.photos/seed/marco/100/100',
    description: "I've reviewed your project and I'm confident we can handle this kitchen remodel efficiently. Our team specializes in high-end plumbing and fixture installations. We use only premium materials and provide a 2-year warranty on all labor.",
    breakdown: [
      { item: 'Labor & Installation', price: '$750' },
      { item: 'Materials & Fixtures', price: '$400' },
      { item: 'Permits & Disposal', price: '$100' }
    ],
    terms: [
      '50% deposit required to start',
      'Remaining 50% upon completion',
      '2-year labor warranty included',
      'All materials provided by contractor'
    ]
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            onPress={() => onNavigate('quotesList')}
            style={styles.backButton}
          >
            <FontAwesome5 name="chevron-left" size={24} color="#1F2937"  />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quote Detail</Text>
        </View>
        <TouchableOpacity style={styles.shieldButton}>
          <FontAwesome5 name="shield-alt" size={20} color="#9CA3AF"  />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Contractor Profile */}
        <View style={styles.profileCard}>
          <Image 
            source={{ uri: quote.avatar }}
            style={styles.profileAvatar}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{quote.contractor}</Text>
            <View style={styles.profileRating}>
              <View style={styles.ratingBadge}>
                <FontAwesome5 name="star" size={12} color="#F59E0B" fill="#F59E0B"  />
                <Text style={styles.ratingText}>{quote.rating}</Text>
              </View>
              <Text style={styles.ratingSeparator}>•</Text>
              <Text style={styles.reviewsText}>{quote.reviews} REVIEWS</Text>
            </View>
          </View>
          <TouchableOpacity 
            onPress={() => onNavigate('portfolio')}
            style={styles.viewProfileButton}
          >
            <FontAwesome5 name="arrow-right" size={20} color="#1F2937"  />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {(['overview', 'breakdown', 'terms'] as const).map((tab) => (
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

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === 'overview' && (
            <MotiView
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              style={styles.overviewContent}
            >
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>TOTAL QUOTE</Text>
                  <Text style={styles.statValue}>{quote.amount}</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>TIMELINE</Text>
                  <Text style={styles.statValue}>{quote.timeline}</Text>
                </View>
              </View>
              <View style={styles.descriptionSection}>
                <Text style={styles.descriptionLabel}>CONTRACTOR'S NOTE</Text>
                <View style={styles.descriptionCard}>
                  <Text style={styles.descriptionText}>"{quote.description}"</Text>
                </View>
              </View>
            </MotiView>
          )}

          {activeTab === 'breakdown' && (
            <MotiView
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              style={styles.breakdownContent}
            >
              {quote.breakdown.map((item, i) => (
                <View key={i} style={styles.breakdownItem}>
                  <Text style={styles.breakdownLabel}>{item.item}</Text>
                  <Text style={styles.breakdownPrice}>{item.price}</Text>
                </View>
              ))}
              <View style={styles.breakdownTotal}>
                <Text style={styles.breakdownTotalLabel}>TOTAL</Text>
                <Text style={styles.breakdownTotalValue}>{quote.amount}</Text>
              </View>
            </MotiView>
          )}

          {activeTab === 'terms' && (
            <MotiView
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              style={styles.termsContent}
            >
              {quote.terms.map((term, i) => (
                <View key={i} style={styles.termItem}>
                  <FontAwesome5 name="check-circle" size={16} color="#10B981"  />
                  <Text style={styles.termText}>{term}</Text>
                </View>
              ))}
            </MotiView>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity 
            onPress={() => onNavigate('chat')}
            style={styles.messageButton}
          >
            <FontAwesome5 name="comment-alt" size={20} color="#1F2937"  />
            <Text style={styles.messageButtonText}>Message Contractor</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => setShowNegotiate(true)}
            style={styles.negotiateButton}
          >
            <Text style={styles.negotiateButtonText}>Negotiate Terms</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => onNavigate('hireContractor')}
            style={styles.acceptButton}
          >
            <Text style={styles.acceptButtonText}>Accept & Hire</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Negotiate Modal */}
      <Modal
        visible={showNegotiate}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowNegotiate(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Negotiate Terms</Text>
            <TouchableOpacity onPress={() => setShowNegotiate(false)} style={styles.closeButton}>
              <FontAwesome5 name="times" size={24} color="#1F2937"  />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <View style={styles.negotiateSection}>
              <Text style={styles.negotiateLabel}>COUNTER OFFER AMOUNT</Text>
              <View style={styles.amountInput}>
                <FontAwesome5 name="dollar-sign" size={20} color="#9CA3AF"  />
                <TextInput
                  value={counterAmount}
                  onChangeText={setCounterAmount}
                  keyboardType="decimal-pad"
                  style={styles.amountTextInput}
                />
              </View>
              <Text style={styles.originalAmount}>Original: {quote.amount}</Text>
            </View>
          </ScrollView>
          <View style={styles.modalActions}>
            <TouchableOpacity 
              onPress={() => setShowNegotiate(false)}
              style={styles.sendCounterButton}
            >
              <Text style={styles.sendCounterButtonText}>Send Counter Offer</Text>
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
  shieldButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    backgroundColor: '#F9FAFB',
    padding: 24,
    marginHorizontal: 24,
    marginTop: 24,
    marginBottom: 32,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 16,
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  profileRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
  },
  ratingSeparator: {
    fontSize: 12,
    color: '#D1D5DB',
  },
  reviewsText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
  },
  viewProfileButton: {
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    padding: 4,
    marginHorizontal: 24,
    marginBottom: 32,
    borderRadius: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
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
  tabContent: {
    paddingHorizontal: 24,
    minHeight: 200,
  },
  overviewContent: {
    gap: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 24,
    borderRadius: 32,
    gap: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  descriptionSection: {
    gap: 8,
  },
  descriptionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
    paddingHorizontal: 8,
  },
  descriptionCard: {
    backgroundColor: '#F9FAFB',
    padding: 24,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  descriptionText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 24,
    fontStyle: 'italic',
  },
  breakdownContent: {
    gap: 16,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 24,
    borderRadius: 48,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  breakdownLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  breakdownPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  breakdownTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    padding: 24,
    borderRadius: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  breakdownTotalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  breakdownTotalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  termsContent: {
    gap: 16,
  },
  termItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 8,
  },
  termText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 24,
  },
  actionsSection: {
    padding: 24,
    paddingBottom: 40,
    gap: 12,
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#F9FAFB',
    paddingVertical: 18,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  messageButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  negotiateButton: {
    backgroundColor: '#F9FAFB',
    paddingVertical: 18,
    borderRadius: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  negotiateButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },
  acceptButton: {
    backgroundColor: '#1F2937',
    paddingVertical: 20,
    borderRadius: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
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
  },
  negotiateSection: {
    padding: 24,
    gap: 16,
  },
  negotiateLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
  },
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 20,
    borderRadius: 16,
    gap: 12,
  },
  amountTextInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  originalAmount: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  modalActions: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  sendCounterButton: {
    backgroundColor: '#1F2937',
    paddingVertical: 18,
    borderRadius: 32,
    alignItems: 'center',
  },
  sendCounterButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
