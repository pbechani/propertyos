import React, { useState } from 'react';
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

interface AIBuilderScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const AIBuilderScreen: React.FC<AIBuilderScreenProps> = ({ onNavigate }) => {
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [description, setDescription] = useState("I'm looking to remodel my master bathroom. It's about 100 square feet. I want to replace the old tile with marble, add a double vanity with a quartz countertop, and install a walk-in shower with a glass enclosure. I'm hoping to start in about two months and my budget is around $15,000.");

  const startGeneration = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setStep(2);
    }, 3000);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            onPress={() => onNavigate('createProject')}
            style={styles.backButton}
          >
            <FontAwesome5 name="chevron-left" size={24} color="#1F2937"  />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AI Project Builder</Text>
        </View>
        <View style={styles.aiIcon}>
          <FontAwesome5 name="sparkles" size={20} color="#A855F7"  />
        </View>
      </View>

      <ScrollView style={styles.content}>
        {step === 1 ? (
          <View style={styles.stepContainer}>
            <View style={styles.aiCard}>
              <View style={styles.aiCardContent}>
                <View style={styles.aiCardIcon}>
                  <FontAwesome5 name="sparkles" size={24} color="#FFFFFF"  />
                </View>
                <View>
                  <Text style={styles.aiCardTitle}>AI Assistant Ready</Text>
                  <Text style={styles.aiCardSubtitle}>
                    Describe your vision, and I'll generate a complete project plan, budget, and timeline for you.
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>PROJECT DESCRIPTION</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Tell me about your project..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={8}
                textAlignVertical="top"
                style={styles.textArea}
              />
            </View>

            <View style={styles.metaGrid}>
              <View style={styles.metaField}>
                <Text style={styles.metaLabel}>BUDGET RANGE</Text>
                <View style={styles.metaValue}>
                  <View style={styles.metaIcon}>
                    <FontAwesome5 name="plus" size={14} color="#1F2937" style={{ transform: [{ rotate: '45deg' }] }}  />
                  </View>
                  <Text style={styles.metaText}>$10k - $20k</Text>
                </View>
              </View>
              <View style={styles.metaField}>
                <Text style={styles.metaLabel}>TIMELINE</Text>
                <View style={styles.metaValue}>
                  <View style={styles.metaIcon}>
                    <FontAwesome5 name="plus" size={14} color="#1F2937"  />
                  </View>
                  <Text style={styles.metaText}>2-3 Months</Text>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>Project Plan Generated</Text>
            <View style={styles.resultsCard}>
              <Text style={styles.resultsText}>
                Your AI-generated project plan is ready! This would normally show the full breakdown of tasks, timeline, and estimated costs.
              </Text>
            </View>
            <TouchableOpacity 
              onPress={() => onNavigate('jobSuccess')}
              style={styles.confirmButton}
            >
              <FontAwesome5 name="check" size={20} color="#FFFFFF"  />
              <Text style={styles.confirmButtonText}>Confirm & Post Job</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Action Button */}
      {step === 1 && (
        <View style={styles.actionBar}>
          <TouchableOpacity
            onPress={startGeneration}
            disabled={isGenerating || !description}
            style={[styles.generateButton, (isGenerating || !description) && styles.generateButtonDisabled]}
          >
            {isGenerating ? (
              <>
                <ActivityIndicator color="#FFFFFF" />
                <Text style={styles.generateButtonText}>Generating...</Text>
              </>
            ) : (
              <>
                <FontAwesome5 name="sparkles" size={20} color="#FFFFFF"  />
                <Text style={styles.generateButtonText}>Generate Project Plan</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
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
  aiIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 24,
    gap: 24,
  },
  aiCard: {
    backgroundColor: '#A855F7',
    borderRadius: 40,
    padding: 32,
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  aiCardContent: {
    flexDirection: 'row',
    gap: 16,
    zIndex: 10,
  },
  aiCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  aiCardSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 22,
  },
  inputSection: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
    paddingHorizontal: 16,
  },
  textArea: {
    backgroundColor: '#F9FAFB',
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    fontSize: 14,
    color: '#1F2937',
    minHeight: 180,
    lineHeight: 22,
  },
  metaGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  metaField: {
    flex: 1,
    gap: 8,
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
    paddingHorizontal: 16,
  },
  metaValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 48,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  metaIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  metaText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 24,
    gap: 24,
  },
  resultsTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  resultsCard: {
    backgroundColor: '#F9FAFB',
    padding: 32,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  resultsText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 24,
  },
  confirmButton: {
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
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  actionBar: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#1F2937',
    paddingVertical: 24,
    borderRadius: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  generateButtonDisabled: {
    opacity: 0.5,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
