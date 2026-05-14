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

interface DraftsScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const DraftsScreen: React.FC<DraftsScreenProps> = ({ onNavigate }) => {
  const drafts = [
    { id: '1', title: 'Kitchen Remodel', lastEdited: '2 hours ago', progress: 65, category: 'Interior' },
    { id: '2', title: 'Backyard Deck', lastEdited: 'Yesterday', progress: 30, category: 'Exterior' },
    { id: '3', title: 'Smart Lighting Setup', lastEdited: '3 days ago', progress: 90, category: 'Electrical' }
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            onPress={() => onNavigate('createProject')}
            style={styles.backButton}
          >
            <FontAwesome5 name="chevron-left" size={24} color="#1F2937"  />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Project Drafts</Text>
        </View>
        <View style={styles.draftIcon}>
          <FontAwesome5 name="file-alt" size={20} color="#9CA3AF"  />
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.countRow}>
          <Text style={styles.countText}>{drafts.length} ACTIVE DRAFTS</Text>
          <TouchableOpacity style={styles.clearButton}>
            <FontAwesome5 name="trash-alt" size={14} color="#EF4444"  />
            <Text style={styles.clearButtonText}>CLEAR ALL</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.draftsList}>
          {drafts.map((draft, i) => (
            <MotiView 
              key={draft.id}
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: i * 100, type: 'timing', duration: 400 }}
            >
              <TouchableOpacity 
                onPress={() => onNavigate('manualEntry')}
                style={styles.draftCard}
                activeOpacity={0.8}
              >
                <View style={styles.draftHeader}>
                  <View style={styles.draftLeft}>
                    <View style={styles.draftIconContainer}>
                      <FontAwesome5 name="file-alt" size={24} color="#9CA3AF"  />
                    </View>
                    <View>
                      <Text style={styles.draftTitle}>{draft.title}</Text>
                      <View style={styles.draftMeta}>
                        <FontAwesome5 name="clock" size={12} color="#9CA3AF"  />
                        <Text style={styles.draftTime}>{draft.lastEdited}</Text>
                        <Text style={styles.metaSeparator}>•</Text>
                        <Text style={styles.draftCategory}>{draft.category}</Text>
                      </View>
                    </View>
                  </View>
                  <FontAwesome5 name="arrow-right" size={20} color="#D1D5DB"  />
                </View>

                <View style={styles.progressSection}>
                  <Text style={styles.progressText}>{draft.progress}% COMPLETE</Text>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${draft.progress}%` }]} />
                  </View>
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
  draftIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  countRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clearButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
    letterSpacing: 1.5,
  },
  draftsList: {
    paddingHorizontal: 24,
    gap: 16,
  },
  draftCard: {
    backgroundColor: '#F9FAFB',
    padding: 24,
    borderRadius: 32,
    gap: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  draftHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  draftLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  draftIconContainer: {
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
  draftTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  draftMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  draftTime: {
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
  draftCategory: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  progressSection: {
    gap: 8,
  },
  progressText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1F2937',
    borderRadius: 4,
  },
  successContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 24,
  },
  successIcon: {
    width: 80,
    height: 80,
    backgroundColor: '#10B981',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successContent: {
    alignItems: 'center',
    gap: 8,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  successSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    maxWidth: 280,
  },
  redirectText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
    letterSpacing: 1.5,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 24,
    borderRadius: 48,
    gap: 16,
    marginBottom: 32,
  },
  infoBannerContent: {
    flex: 1,
    gap: 4,
  },
  infoBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7F1D1D',
  },
  infoBannerText: {
    fontSize: 12,
    color: '#991B1B',
    lineHeight: 20,
  },
  form: {
    gap: 24,
  },
  field: {
    gap: 12,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
    paddingHorizontal: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    fontSize: 14,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textArea: {
    minHeight: 160,
    lineHeight: 24,
  },
  actionBar: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#1F2937',
    paddingVertical: 20,
    borderRadius: 32,
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
});
