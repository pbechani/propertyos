import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  StyleSheet,
  Alert 
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { Screen } from '../types';
import { jobsApi } from '../lib/api';

interface ManualEntryScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const ManualEntryScreen: React.FC<ManualEntryScreenProps> = ({ onNavigate }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Plumbing',
    description: '',
    minBudget: '',
    maxBudget: '',
    location: 'Brooklyn, NY',
  });
  const [submitting, setSubmitting] = useState(false);

  const categories = [
    { id: 'plumbing', name: 'Plumbing', icon: '🚰', color: '#EFF6FF' },
    { id: 'electrical', name: 'Electrical', icon: '⚡', color: '#FEF3C7' },
    { id: 'carpentry', name: 'Carpentry', icon: '🪚', color: '#FED7AA' },
    { id: 'painting', name: 'Painting', icon: '🎨', color: '#FCE7F3' },
    { id: 'hvac', name: 'HVAC', icon: '❄️', color: '#CFFAFE' },
    { id: 'roofing', name: 'Roofing', icon: '🏠', color: '#D1FAE5' },
  ];

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const job = await jobsApi.create({
        title: formData.title,
        description: formData.description,
        category: formData.category.toLowerCase(),
        budgetMin: formData.minBudget ? Number(formData.minBudget) : undefined,
        budgetMax: formData.maxBudget ? Number(formData.maxBudget) : undefined,
        locationLabel: formData.location,
        isUrgent: false,
      });
      await jobsApi.publish(job.id);
      onNavigate('jobSuccess');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to post job');
      setSubmitting(false);
    }
  };

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            onPress={() => step > 1 ? setStep(step - 1) : onNavigate('createProject')}
            style={styles.backButton}
          >
            <FontAwesome5 name="chevron-left" size={24} color="#1F2937"  />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Step {step} of {totalSteps}</Text>
        </View>
        {step < totalSteps && (
          <TouchableOpacity onPress={() => onNavigate('drafts')}>
            <Text style={styles.draftText}>SAVE DRAFT</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content}>
        {/* Progress Bar */}
        <MotiView 
          from={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          style={styles.progressBar}
        />

        <View style={styles.formContent}>
          {step === 1 && (
            <MotiView 
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              style={styles.stepContent}
            >
              <View style={styles.stepHeader}>
                <Text style={styles.stepTitle}>What category is your job?</Text>
                <Text style={styles.stepSubtitle}>Select the most relevant category.</Text>
              </View>
              <View style={styles.categoriesGrid}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => {
                      setFormData({...formData, category: cat.name});
                      setStep(2);
                    }}
                    style={[
                      styles.categoryCard,
                      { backgroundColor: formData.category === cat.name ? cat.color : '#FFFFFF' }
                    ]}
                  >
                    <Text style={styles.categoryIcon}>{cat.icon}</Text>
                    <Text style={styles.categoryName}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </MotiView>
          )}

          {step === 2 && (
            <MotiView 
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              style={styles.stepContent}
            >
              <View style={styles.stepHeader}>
                <Text style={styles.stepTitle}>Describe your project</Text>
                <Text style={styles.stepSubtitle}>What needs to be done?</Text>
              </View>
              <TextInput
                value={formData.title}
                onChangeText={(text) => setFormData({...formData, title: text})}
                placeholder="e.g., Fix leaking bathroom faucet"
                placeholderTextColor="#9CA3AF"
                style={styles.input}
              />
              <TextInput
                value={formData.description}
                onChangeText={(text) => setFormData({...formData, description: text})}
                placeholder="Add more details..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                style={[styles.input, styles.textArea]}
              />
            </MotiView>
          )}

          {step === 3 && (
            <MotiView 
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              style={styles.stepContent}
            >
              <View style={styles.stepHeader}>
                <Text style={styles.stepTitle}>What's your budget?</Text>
                <Text style={styles.stepSubtitle}>This helps match you with the right contractors.</Text>
              </View>
              <View style={styles.budgetInputs}>
                <View style={styles.budgetField}>
                  <Text style={styles.budgetLabel}>MIN</Text>
                  <View style={styles.budgetInputContainer}>
                    <FontAwesome5 name="dollar-sign" size={16} color="#9CA3AF"  />
                    <TextInput
                      value={formData.minBudget}
                      onChangeText={(text) => setFormData({...formData, minBudget: text})}
                      placeholder="0"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="decimal-pad"
                      style={styles.budgetInput}
                    />
                  </View>
                </View>
                <View style={styles.budgetField}>
                  <Text style={styles.budgetLabel}>MAX</Text>
                  <View style={styles.budgetInputContainer}>
                    <FontAwesome5 name="dollar-sign" size={16} color="#9CA3AF"  />
                    <TextInput
                      value={formData.maxBudget}
                      onChangeText={(text) => setFormData({...formData, maxBudget: text})}
                      placeholder="0"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="decimal-pad"
                      style={styles.budgetInput}
                    />
                  </View>
                </View>
              </View>
            </MotiView>
          )}

          {step === 4 && (
            <MotiView 
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              style={styles.stepContent}
            >
              <View style={styles.stepHeader}>
                <Text style={styles.stepTitle}>Review & Post</Text>
                <Text style={styles.stepSubtitle}>Double-check your details before posting.</Text>
              </View>
              <View style={styles.reviewCard}>
                <Text style={styles.reviewTitle}>{formData.title || 'No title'}</Text>
                <Text style={styles.reviewCategory}>{formData.category}</Text>
                <Text style={styles.reviewDescription}>{formData.description || 'No description'}</Text>
                <Text style={styles.reviewBudget}>
                  Budget: ${formData.minBudget || '0'} - ${formData.maxBudget || '0'}
                </Text>
              </View>
            </MotiView>
          )}
        </View>
      </ScrollView>

      {/* Action Button */}
      <View style={styles.actionBar}>
        {step < totalSteps ? (
          <TouchableOpacity 
            onPress={() => setStep(step + 1)}
            style={styles.nextButton}
            disabled={step === 2 && !formData.title}
          >
            <Text style={styles.nextButtonText}>Continue</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            onPress={handleSubmit}
            disabled={submitting}
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          >
            <FontAwesome5 name="check" size={20} color="#FFFFFF"  />
            <Text style={styles.submitButtonText}>
              {submitting ? 'Posting...' : 'Post Job'}
            </Text>
          </TouchableOpacity>
        )}
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
  draftText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
  },
  content: {
    flex: 1,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#1F2937',
    marginHorizontal: 24,
    marginBottom: 32,
    borderRadius: 2,
  },
  formContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  stepContent: {
    flex: 1,
    gap: 24,
  },
  stepHeader: {
    gap: 8,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  categoryCard: {
    width: '47%',
    padding: 24,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: '#F3F4F6',
    alignItems: 'center',
    gap: 8,
  },
  categoryIcon: {
    fontSize: 32,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  budgetInputs: {
    flexDirection: 'row',
    gap: 16,
  },
  budgetField: {
    flex: 1,
    gap: 8,
  },
  budgetLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
  },
  budgetInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  budgetInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  reviewCard: {
    backgroundColor: '#F9FAFB',
    padding: 24,
    borderRadius: 32,
    gap: 12,
  },
  reviewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  reviewCategory: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
  },
  reviewDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
  },
  reviewBudget: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  actionBar: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  nextButton: {
    backgroundColor: '#1F2937',
    paddingVertical: 18,
    borderRadius: 32,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#1F2937',
    paddingVertical: 18,
    borderRadius: 32,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
