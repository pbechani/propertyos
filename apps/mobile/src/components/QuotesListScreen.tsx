import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  StyleSheet 
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { Screen } from '../types';
import { jobsApi, JobQuote } from '../lib/api';
import { AppStateContext } from '../App';

interface QuotesListScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const QuotesListScreen: React.FC<QuotesListScreenProps> = ({ onNavigate }) => {
  const { selectedJobId } = React.useContext(AppStateContext);

  const MOCK_QUOTES_STATIC = [
    {
      id: '1',
      contractor: 'Elite Plumbing Solutions',
      contractorName: 'Marco Rossi',
      rating: 4.9,
      reviews: 124,
      amount: '$1,250',
      timeline: '3-4 days',
      status: 'new',
      avatar: 'https://picsum.photos/seed/marco/100/100',
      isTopRated: true
    },
    {
      id: '2',
      contractor: 'ProFix Home Services',
      contractorName: 'Sarah Jenkins',
      rating: 4.7,
      reviews: 89,
      amount: '$1,100',
      timeline: '5 days',
      status: 'new',
      avatar: 'https://picsum.photos/seed/sarah/100/100',
      isTopRated: false
    },
    {
      id: '3',
      contractor: 'Modern Craft Builders',
      contractorName: 'David Chen',
      rating: 5.0,
      reviews: 42,
      amount: '$1,400',
      timeline: '2 days',
      status: 'new',
      avatar: 'https://picsum.photos/seed/david/100/100',
      isTopRated: true
    }
  ];

  type DisplayQuote = typeof MOCK_QUOTES_STATIC[0];

  const apiToDisplay = (q: JobQuote): DisplayQuote => ({
    id: q.id,
    contractor: `Contractor`,
    contractorName: `Contractor`,
    rating: 0,
    reviews: 0,
    amount: `$${q.price.toLocaleString()}`,
    timeline: q.timelineDays ? `${q.timelineDays} day${q.timelineDays > 1 ? 's' : ''}` : 'TBD',
    status: q.status.toLowerCase(),
    avatar: `https://picsum.photos/seed/${q.contractorId}/100/100`,
    isTopRated: false,
  });

  const [quotes, setQuotes] = useState<DisplayQuote[]>(MOCK_QUOTES_STATIC);
  const [responding, setResponding] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedJobId) return;
    jobsApi.listQuotes(selectedJobId)
      .then(apiQuotes => {
        if (apiQuotes.length > 0) setQuotes(apiQuotes.map(apiToDisplay));
      })
      .catch(() => { /* keep mock data */ });
  }, [selectedJobId]);

  const handleRespond = async (quoteId: string, decision: 'ACCEPTED' | 'REJECTED') => {
    if (!selectedJobId) return;
    setResponding(quoteId);
    try {
      const updated = await jobsApi.respondToQuote(selectedJobId, quoteId, decision);
      setQuotes(prev => prev.map(q => q.id === quoteId ? { ...q, status: decision.toLowerCase() } : q));
    } catch {
      // silently fail
    } finally {
      setResponding(null);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            onPress={() => onNavigate('projects')}
            style={styles.backButton}
          >
            <FontAwesome5 name="chevron-left" size={24} color="#1F2937"  />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Quotes</Text>
            <Text style={styles.headerSubtitle}>KITCHEN REMODEL</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <FontAwesome5 name="filter" size={20} color="#9CA3AF"  />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Compare Banner */}
        <MotiView 
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          style={styles.compareBanner}
        >
          <View style={styles.compareBannerContent}>
            <View>
              <Text style={styles.compareBannerTitle}>Compare Quotes</Text>
              <Text style={styles.compareBannerSubtitle}>See side-by-side comparison of all offers</Text>
            </View>
            <TouchableOpacity 
              onPress={() => onNavigate('quoteComparison')}
              style={styles.compareBannerButton}
            >
              <FontAwesome5 name="arrow-right" size={20} color="#FFFFFF"  />
            </TouchableOpacity>
          </View>
        </MotiView>

        {/* Quotes List */}
        <View style={styles.quotesSection}>
          <Text style={styles.quotesTitle}>RECEIVED ({quotes.length})</Text>
          {quotes.map((quote, i) => (
            <MotiView
              key={quote.id}
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: i * 100, type: 'timing', duration: 400 }}
            >
              <TouchableOpacity 
                onPress={() => onNavigate('quoteDetail')}
                style={styles.quoteCard}
                activeOpacity={0.9}
              >
                <View style={styles.quoteHeader}>
                  <View style={styles.contractorInfo}>
                    <View style={styles.avatarContainer}>
                      <Image 
                        source={{ uri: quote.avatar }}
                        style={styles.avatar}
                      />
                      {quote.isTopRated && (
                        <View style={styles.topRatedBadge}>
                          <FontAwesome5 name="star" size={12} color="#FFFFFF" fill="#FFFFFF"  />
                        </View>
                      )}
                    </View>
                    <View style={styles.contractorDetails}>
                      <Text style={styles.contractorName}>{quote.contractor}</Text>
                      <View style={styles.ratingRow}>
                        <View style={styles.ratingInfo}>
                          <FontAwesome5 name="star" size={12} color="#F59E0B" fill="#F59E0B"  />
                          <Text style={styles.ratingText}>{quote.rating}</Text>
                        </View>
                        <Text style={styles.ratingSeparator}>•</Text>
                        <Text style={styles.reviewsText}>{quote.reviews} REVIEWS</Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.moreButton}>
                    <FontAwesome5 name="ellipsis-v" size={20} color="#9CA3AF"  />
                  </TouchableOpacity>
                </View>

                <View style={styles.quoteStats}>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>TOTAL QUOTE</Text>
                    <Text style={styles.statValue}>{quote.amount}</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>TIMELINE</Text>
                    <Text style={styles.statValue}>{quote.timeline}</Text>
                  </View>
                </View>

                <View style={styles.quoteFooter}>
                  <View style={styles.verifiedRow}>
                    <FontAwesome5 name="check-circle" size={16} color="#10B981"  />
                    <Text style={styles.verifiedText}>VERIFIED EXPERT</Text>
                  </View>
                  {quote.status === 'new' || quote.status === 'pending' ? (
                    <View style={styles.actionsRow}>
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          handleRespond(quote.id, 'REJECTED');
                        }}
                        disabled={responding === quote.id}
                        style={styles.declineButton}
                      >
                        <Text style={styles.declineButtonText}>Decline</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          handleRespond(quote.id, 'ACCEPTED');
                        }}
                        disabled={responding === quote.id}
                        style={styles.acceptButton}
                      >
                        <Text style={styles.acceptButtonText}>
                          {responding === quote.id ? '...' : 'Accept'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={[
                      styles.statusBadge,
                      quote.status === 'accepted' ? styles.statusBadgeAccepted : styles.statusBadgeRejected
                    ]}>
                      <Text style={[
                        styles.statusBadgeText,
                        quote.status === 'accepted' ? styles.statusBadgeTextAccepted : styles.statusBadgeTextRejected
                      ]}>
                        {quote.status.toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </MotiView>
          ))}
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
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
  },
  filterButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
  },
  compareBanner: {
    marginHorizontal: 24,
    marginTop: 24,
    marginBottom: 24,
  },
  compareBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1F2937',
    padding: 24,
    borderRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  compareBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  compareBannerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  compareBannerButton: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quotesSection: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 16,
  },
  quotesTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 2,
    paddingHorizontal: 8,
  },
  quoteCard: {
    backgroundColor: '#F9FAFB',
    padding: 24,
    borderRadius: 40,
    gap: 24,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  quoteHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  contractorInfo: {
    flexDirection: 'row',
    gap: 16,
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
  },
  topRatedBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  contractorDetails: {
    flex: 1,
    gap: 4,
  },
  contractorName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingInfo: {
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
  moreButton: {
    padding: 8,
    borderRadius: 20,
  },
  quoteStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  quoteFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
    letterSpacing: 1.5,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  declineButton: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  declineButtonText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#EF4444',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  acceptButton: {
    backgroundColor: '#1F2937',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  acceptButtonText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusBadgeAccepted: {
    backgroundColor: '#D1FAE5',
  },
  statusBadgeRejected: {
    backgroundColor: '#F3F4F6',
  },
  statusBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  statusBadgeTextAccepted: {
    color: '#059669',
  },
  statusBadgeTextRejected: {
    color: '#9CA3AF',
  },
});
