import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  StyleSheet,
  ActivityIndicator 
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { Screen } from '../types';
import { jobsApi } from '../lib/api';
import { AppStateContext } from '../App';

interface QuotationSystemProps {
  onNavigate: (screen: Screen) => void;
  initialData?: any;
}

interface PriceItem {
  id: string;
  label: string;
  amount: number;
}

interface Quote {
  id: string;
  jobTitle: string;
  clientName: string;
  totalAmount: number;
  status: 'pending' | 'accepted' | 'withdrawn' | 'rejected';
  date: string;
  items: PriceItem[];
  timeline: string;
}

const MOCK_QUOTES: Quote[] = [
  {
    id: 'Q-101',
    jobTitle: 'Emergency Pipe Repair',
    clientName: 'Robert D.',
    totalAmount: 450,
    status: 'pending',
    date: '2026-03-24',
    timeline: '1 day',
    items: [
      { id: '1', label: 'Emergency Call-out', amount: 150 },
      { id: '2', label: 'Pipe Materials', amount: 100 },
      { id: '3', label: 'Labor (3 hours)', amount: 200 }
    ]
  },
  {
    id: 'Q-98',
    jobTitle: 'Kitchen Backsplash',
    clientName: 'Linda W.',
    totalAmount: 950,
    status: 'accepted',
    date: '2026-03-20',
    timeline: '3 days',
    items: [
      { id: '1', label: 'Tiling Labor', amount: 600 },
      { id: '2', label: 'Grout & Adhesive', amount: 150 },
      { id: '3', label: 'Subway Tiles', amount: 200 }
    ]
  }
];

export const CreateQuoteScreen: React.FC<QuotationSystemProps> = ({ onNavigate, initialData }) => {
  const { setQuoteData } = React.useContext(AppStateContext);
  const [items, setItems] = useState<PriceItem[]>(initialData?.items || [
    { id: '1', label: 'Labor', amount: 0 },
    { id: '2', label: 'Materials', amount: 0 }
  ]);
  const [timeline, setTimeline] = useState(initialData?.timeline || '3-5 days');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [isAiSuggesting, setIsAiSuggesting] = useState(false);

  const total = items.reduce((sum, item) => sum + item.amount, 0);

  const addItem = () => {
    setItems([...items, { id: Date.now().toString(), label: '', amount: 0 }]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof PriceItem, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleAiSuggest = () => {
    setIsAiSuggesting(true);
    setTimeout(() => {
      setItems([
        { id: '1', label: 'Standard Labor Rate', amount: 450 },
        { id: '2', label: 'Premium Materials', amount: 280 },
        { id: '3', label: 'Disposal Fee', amount: 75 }
      ]);
      setTimeline('2 days');
      setIsAiSuggesting(false);
    }, 1500);
  };

  const handleSubmit = () => {
    if (total > 0) {
      setQuoteData?.({ items, timeline, notes, total });
      onNavigate('quotePreview');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => onNavigate('jobFeed')} style={styles.backButton}>
            <FontAwesome5 name="arrow-left" size={24} color="#1F2937"  />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Quote</Text>
        </View>
        <TouchableOpacity 
          onPress={handleAiSuggest}
          disabled={isAiSuggesting}
          style={[styles.aiButton, isAiSuggesting && styles.aiButtonDisabled]}
        >
          <FontAwesome5 name="sparkles" size={14} color="#A855F7"  />
          <Text style={styles.aiButtonText}>
            {isAiSuggesting ? 'Analyzing...' : 'AI Suggest'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Price Breakdown */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>PRICE BREAKDOWN</Text>
            <TouchableOpacity onPress={addItem} style={styles.addButton}>
              <FontAwesome5 name="plus" size={14} color="#1F2937"  />
              <Text style={styles.addButtonText}>ADD ITEM</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.itemsList}>
            {items.map((item) => (
              <MotiView 
                key={item.id}
                from={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={styles.itemCard}
              >
                <View style={styles.itemInput}>
                  <TextInput 
                    value={item.label}
                    onChangeText={(text) => updateItem(item.id, 'label', text)}
                    placeholder="Item name"
                    placeholderTextColor="#9CA3AF"
                    style={styles.itemLabelInput}
                  />
                </View>
                <View style={styles.itemAmountContainer}>
                  <FontAwesome5 name="dollar-sign" size={12} color="#9CA3AF" style={styles.dollarIcon}  />
                  <TextInput 
                    value={item.amount ? item.amount.toString() : ''}
                    onChangeText={(text) => updateItem(item.id, 'amount', parseFloat(text) || 0)}
                    placeholder="0.00"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="decimal-pad"
                    style={styles.itemAmountInput}
                  />
                </View>
                <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.removeButton}>
                  <FontAwesome5 name="trash-alt" size={18} color="#D1D5DB"  />
                </TouchableOpacity>
              </MotiView>
            ))}
          </View>
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>TOTAL QUOTE</Text>
            <Text style={styles.totalAmount}>${total.toLocaleString()}</Text>
          </View>
        </View>

        {/* Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ESTIMATED TIMELINE</Text>
          <View style={styles.timelineGrid}>
            {['1-2 days', '3-5 days', '1 week', '2+ weeks'].map(t => (
              <TouchableOpacity 
                key={t}
                onPress={() => setTimeline(t)}
                style={[
                  styles.timelineButton,
                  timeline === t && styles.timelineButtonActive
                ]}
              >
                <Text style={[
                  styles.timelineButtonText,
                  timeline === t && styles.timelineButtonTextActive
                ]}>
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NOTES (OPTIONAL)</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Add any additional details for the client..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={styles.notesInput}
          />
        </View>

        {/* Submit */}
        <View style={styles.submitSection}>
          <TouchableOpacity 
            onPress={handleSubmit}
            disabled={total === 0}
            style={[styles.submitButton, total === 0 && styles.submitButtonDisabled]}
          >
            <FontAwesome5 name="paper-plane" size={20} color="#FFFFFF"  />
            <Text style={styles.submitButtonText}>Send Quote</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export const QuoteHistoryScreen: React.FC<QuotationSystemProps> = ({ onNavigate }) => {
  const [quotes, setQuotes] = useState<Quote[]>(MOCK_QUOTES);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');

  useEffect(() => {
    jobsApi.getQuotes()
      .then(apiQuotes => {
        if (apiQuotes.length > 0) {
          setQuotes(apiQuotes as Quote[]);
        }
      })
      .catch(() => { /* use mock data */ });
  }, []);

  const filteredQuotes = filter === 'all' 
    ? quotes 
    : quotes.filter(q => q.status === filter);

  const getStatusColor = (status: Quote['status']) => {
    switch (status) {
      case 'accepted': return '#10B981';
      case 'rejected': return '#EF4444';
      case 'withdrawn': return '#6B7280';
      default: return '#F59E0B';
    }
  };

  const getStatusBgColor = (status: Quote['status']) => {
    switch (status) {
      case 'accepted': return '#D1FAE5';
      case 'rejected': return '#FEE2E2';
      case 'withdrawn': return '#F3F4F6';
      default: return '#FEF3C7';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => onNavigate('contractorHome')} style={styles.backButton}>
            <FontAwesome5 name="arrow-left" size={24} color="#1F2937"  />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quote History</Text>
        </View>
      </View>

      {/* Filters */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filtersScroll}
        contentContainerStyle={styles.filtersContent}
      >
        {(['all', 'pending', 'accepted', 'rejected'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={[styles.filterButton, filter === f && styles.filterButtonActive]}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.quotesContainer}>
        {filteredQuotes.map((quote, i) => (
          <MotiView
            key={quote.id}
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: i * 100, type: 'timing', duration: 400 }}
          >
            <TouchableOpacity 
              onPress={() => onNavigate('quoteDetail')}
              style={styles.quoteCard}
              activeOpacity={0.8}
            >
              <View style={styles.quoteHeader}>
                <View style={styles.quoteInfo}>
                  <Text style={styles.quoteTitle}>{quote.jobTitle}</Text>
                  <Text style={styles.quoteClient}>{quote.clientName}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusBgColor(quote.status) }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(quote.status) }]}>
                    {quote.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.quoteFooter}>
                <View style={styles.quoteMetaItem}>
                  <FontAwesome5 name="clock" size={14} color="#9CA3AF"  />
                  <Text style={styles.quoteMetaText}>{quote.timeline}</Text>
                </View>
                <View style={styles.quoteMetaItem}>
                  <FontAwesome5 name="dollar-sign" size={14} color="#9CA3AF"  />
                  <Text style={styles.quoteMetaText}>${quote.totalAmount.toLocaleString()}</Text>
                </View>
                <Text style={styles.quoteDate}>{quote.date}</Text>
              </View>
            </TouchableOpacity>
          </MotiView>
        ))}
      </ScrollView>
    </View>
  );
};

// Placeholder screens
export const QuotePreviewScreen: React.FC<QuotationSystemProps> = ({ onNavigate }) => (
  <View style={styles.placeholderContainer}>
    <Text style={styles.placeholderText}>Quote Preview</Text>
    <TouchableOpacity style={styles.placeholderButton} onPress={() => onNavigate('contractorHome')}>
      <Text style={styles.placeholderButtonText}>Back</Text>
    </TouchableOpacity>
  </View>
);

export const QuoteSuccessScreen: React.FC<QuotationSystemProps> = ({ onNavigate }) => (
  <View style={styles.placeholderContainer}>
    <FontAwesome5 name="check-circle" size={64} color="#10B981"  />
    <Text style={styles.placeholderText}>Quote Sent Successfully!</Text>
    <TouchableOpacity style={styles.placeholderButton} onPress={() => onNavigate('quoteHistory')}>
      <Text style={styles.placeholderButtonText}>View History</Text>
    </TouchableOpacity>
  </View>
);

export const QuoteAnalyticsScreen: React.FC<QuotationSystemProps> = ({ onNavigate }) => (
  <View style={styles.placeholderContainer}>
    <FontAwesome5 name="chart-line" size={64} color="#3B82F6"  />
    <Text style={styles.placeholderText}>Quote Analytics</Text>
    <TouchableOpacity style={styles.placeholderButton} onPress={() => onNavigate('quoteHistory')}>
      <Text style={styles.placeholderButtonText}>Back</Text>
    </TouchableOpacity>
  </View>
);

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
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
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
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  aiButtonDisabled: {
    opacity: 0.5,
  },
  aiButtonText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#A855F7',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 24,
    gap: 16,
  },
  sectionHeader: {
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
    paddingHorizontal: 8,
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
    textTransform: 'uppercase',
  },
  itemsList: {
    gap: 12,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  itemInput: {
    flex: 1,
  },
  itemLabelInput: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  itemAmountContainer: {
    width: 96,
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dollarIcon: {
    marginRight: 4,
  },
  itemAmountInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'right',
  },
  removeButton: {
    padding: 8,
  },
  totalCard: {
    backgroundColor: '#1F2937',
    padding: 24,
    borderRadius: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 1.5,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  timelineGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timelineButton: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    alignItems: 'center',
  },
  timelineButtonActive: {
    backgroundColor: '#1F2937',
    borderColor: '#1F2937',
  },
  timelineButtonText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  timelineButtonTextActive: {
    color: '#FFFFFF',
  },
  notesInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    fontSize: 14,
    color: '#1F2937',
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  submitSection: {
    padding: 24,
    paddingBottom: 40,
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 20,
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#E5E7EB',
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  filtersScroll: {
    paddingHorizontal: 24,
    marginVertical: 16,
  },
  filtersContent: {
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
  },
  filterButtonActive: {
    backgroundColor: '#1F2937',
  },
  filterText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  quotesContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  quoteCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    gap: 16,
  },
  quoteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  quoteInfo: {
    flex: 1,
    gap: 4,
  },
  quoteTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  quoteClient: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  quoteFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  quoteMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quoteMetaText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  quoteDate: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9CA3AF',
    marginLeft: 'auto',
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
