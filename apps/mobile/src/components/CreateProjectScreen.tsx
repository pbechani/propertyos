import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  StyleSheet,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Screen } from '../types';

interface CreateProjectScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const CreateProjectScreen: React.FC<CreateProjectScreenProps> = ({ onNavigate }) => {
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [timeline, setTimeline] = useState('');

  const categories = [
    'Kitchen', 'Bathroom', 'Bedroom', 'Living Room', 
    'Exterior', 'Landscaping', 'Basement', 'Other'
  ];
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => onNavigate('home')} style={styles.backButton}>
          <FontAwesome5 name="arrow-left" size={24} color="#1F2937"  />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Project</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        style={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Quick Create Options */}
        <View style={styles.quickCreateSection}>
          <Text style={styles.sectionTitle}>QUICK CREATE</Text>
          <View style={styles.quickCreateButtons}>
            <TouchableOpacity 
              style={styles.quickCreateButton}
              onPress={() => onNavigate('voiceInput')}
            >
              <FontAwesome5 name="microphone" size={24} color="#3B82F6"  />
              <Text style={styles.quickCreateButtonText}>Voice</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickCreateButton}
              onPress={() => onNavigate('manualEntry')}
            >
              <ImageIcon size={24} color="#A855F7" />
              <Text style={styles.quickCreateButtonText}>Photos</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickCreateButton}
              onPress={() => onNavigate('aiBuilder')}
            >
              <FontAwesome5 name="wand2" size={24} color="#10B981"  />
              <Text style={styles.quickCreateButtonText}>AI</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Manual Form */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>OR ENTER DETAILS</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>PROJECT NAME *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Kitchen Renovation"
              placeholderTextColor="#9CA3AF"
              value={projectName}
              onChangeText={setProjectName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>CATEGORY</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}
            >
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryChip,
                    selectedCategory === category && styles.categoryChipSelected
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text style={[
                    styles.categoryChipText,
                    selectedCategory === category && styles.categoryChipTextSelected
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>DESCRIPTION</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe your project..."
              placeholderTextColor="#9CA3AF"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>BUDGET</Text>
              <TextInput
                style={styles.input}
                placeholder="$5,000"
                placeholderTextColor="#9CA3AF"
                value={budget}
                onChangeText={setBudget}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>TIMELINE</Text>
              <TextInput
                style={styles.input}
                placeholder="2-3 weeks"
                placeholderTextColor="#9CA3AF"
                value={timeline}
                onChangeText={setTimeline}
              />
            </View>
          </View>

          <TouchableOpacity 
            style={[
              styles.submitButton,
              (!projectName || !selectedCategory) && styles.submitButtonDisabled
            ]}
            disabled={!projectName || !selectedCategory}
            onPress={() => onNavigate('jobSuccess')}
          >
            <Text style={styles.submitButtonText}>Create Project</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  quickCreateSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  quickCreateButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  quickCreateButton: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  quickCreateButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
  },
  formSection: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  categoryScroll: {
    marginHorizontal: -24,
    paddingHorizontal: 24,
  },
  categoryChip: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryChipSelected: {
    backgroundColor: '#1F2937',
    borderColor: '#1F2937',
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  categoryChipTextSelected: {
    color: '#FFFFFF',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 32,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#E5E7EB',
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
