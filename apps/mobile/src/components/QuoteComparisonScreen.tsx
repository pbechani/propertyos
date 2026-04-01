import React from 'react';
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

interface QuoteComparisonScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const QuoteComparisonScreen: React.FC<QuoteComparisonScreenProps> = ({ onNavigate }) => {
  const quotes = [
    {
      id: '1',
      contractor: 'Elite Plumbing',
      amount: '$1,250',
      timeline: '3-4 days',
      rating: 4.9,
      reviews: 124,
      warranty: '2 Years',
      materials: 'Premium',
      deposit: '50%',
      avatar: 'https://picsum.photos/seed/marco/100/100'
    },
    {
      id: '2',
      contractor: 'ProFix Services',
      amount: '$1,100',
      timeline: '5 days',
      rating: 4.7,
      reviews: 89,
      warranty: '1 Year',
      materials: 'Standard',
      deposit: '30%',
      avatar: 'https://picsum.photos/seed/sarah/100/100'
    },
    {
      id: '3',
      contractor: 'Modern Craft',
      amount: '$1,400',
      timeline: '2 days',
      rating: 5.0,
      reviews: 42,
      warranty: '5 Years',
      materials: 'Luxury',
      deposit: '40%',
      avatar: 'https://picsum.photos/seed/david/100/100'
    }
  ];

  const features = [
    { label: 'Total Quote', key: 'amount' },
    { label: 'Timeline', key: 'timeline' },
    { label: 'Rating', key: 'rating' },
    { label: 'Warranty', key: 'warranty' },
    { label: 'Materials', key: 'materials' },
    { label: 'Deposit', key: 'deposit' }
  ];

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
          <Text style={styles.headerTitle}>Comparison</Text>
        </View>
        <TouchableOpacity style={styles.infoButton}>
          <FontAwesome5 name="info-circle" size={20} color="#9CA3AF"  />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.tableContainer}>
          {/* Contractor Headers */}
          <View style={styles.headerRow}>
            <View style={styles.featureHeaderCell}>
              <Text style={styles.featureHeaderText}>FEATURES</Text>
            </View>
            {quotes.map((quote) => (
              <View key={quote.id} style={styles.contractorHeaderCell}>
                <Image 
                  source={{ uri: quote.avatar }}
                  style={styles.contractorAvatar}
                />
                <Text style={styles.contractorHeaderName}>{quote.contractor}</Text>
              </View>
            ))}
          </View>

          {/* Comparison Grid */}
          <ScrollView style={styles.rowsContainer}>
            {features.map((feature, i) => (
              <MotiView 
                key={feature.key}
                from={{ opacity: 0, translateX: -10 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ delay: i * 100, type: 'timing', duration: 300 }}
                style={styles.comparisonRow}
              >
                <View style={styles.featureCell}>
                  <Text style={styles.featureLabel}>{feature.label}</Text>
                </View>
                {quotes.map((quote) => (
                  <View key={quote.id} style={styles.valueCell}>
                    {feature.key === 'rating' ? (
                      <View style={styles.ratingCell}>
                        <FontAwesome5 name="star" size={12} color="#F59E0B" fill="#F59E0B"  />
                        <Text style={styles.valueText}>{quote.rating}</Text>
                      </View>
                    ) : (
                      <Text style={styles.valueText}>
                        {quote[feature.key as keyof typeof quote]}
                      </Text>
                    )}
                  </View>
                ))}
              </MotiView>
            ))}

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <View style={styles.featureCell} />
              {quotes.map((quote) => (
                <View key={quote.id} style={styles.actionCell}>
                  <TouchableOpacity 
                    onPress={() => onNavigate('quoteDetail')}
                    style={styles.selectButton}
                  >
                    <Text style={styles.selectButtonText}>SELECT QUOTE</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </ScrollView>
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
  tableContainer: {
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: 32,
    paddingTop: 16,
  },
  featureHeaderCell: {
    width: 120,
    justifyContent: 'flex-end',
    paddingBottom: 16,
  },
  featureHeaderText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 2,
  },
  contractorHeaderCell: {
    width: 160,
    alignItems: 'center',
    gap: 12,
  },
  contractorAvatar: {
    width: 64,
    height: 64,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  contractorHeaderName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },
  rowsContainer: {
    gap: 8,
  },
  comparisonRow: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 48,
    padding: 24,
    marginBottom: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  featureCell: {
    width: 120,
    paddingRight: 16,
  },
  featureLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  valueCell: {
    width: 160,
    alignItems: 'center',
  },
  ratingCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  valueText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    paddingTop: 16,
  },
  actionCell: {
    width: 160,
    alignItems: 'center',
  },
  selectButton: {
    backgroundColor: '#1F2937',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    width: '100%',
  },
  selectButtonText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
});
