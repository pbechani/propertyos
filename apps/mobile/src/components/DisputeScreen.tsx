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
import { Screen } from '../types';

interface ReportIssueScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const ReportIssueScreen: React.FC<ReportIssueScreenProps> = ({ onNavigate }) => {
  const [submitted, setSubmitted] = useState(false);
  const [issueType, setIssueType] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    if (!issueType || !description) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setSubmitted(true);
    setTimeout(() => onNavigate('home'), 2000);
  };

  if (submitted) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successIcon}>
          <FontAwesome5 name="check" size={40} color="#FFFFFF"  />
        </View>
        <View style={styles.successContent}>
          <Text style={styles.successTitle}>Issue Reported</Text>
          <Text style={styles.successSubtitle}>
            Thank you for your feedback. Our support team will review your report and get back to you shortly.
          </Text>
        </View>
        <Text style={styles.redirectText}>REDIRECTING TO HOME...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => onNavigate('profile')}
          style={styles.backButton}
        >
          <FontAwesome5 name="chevron-left" size={24} color="#1F2937"  />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report an Issue</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.infoBanner}>
          <FontAwesome5 name="exclamation-circle" size={24} color="#EF4444"  />
          <View style={styles.infoBannerContent}>
            <Text style={styles.infoBannerTitle}>How can we help?</Text>
            <Text style={styles.infoBannerText}>
              If you're experiencing technical difficulties or have concerns about a project, please let us know.
            </Text>
          </View>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>ISSUE TYPE</Text>
            <TextInput
              value={issueType}
              onChangeText={setIssueType}
              placeholder="e.g., Payment issue, Technical problem..."
              placeholderTextColor="#9CA3AF"
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>DESCRIPTION</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Please describe the issue in detail..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              style={[styles.input, styles.textArea]}
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.actionBar}>
        <TouchableOpacity 
          onPress={handleSubmit}
          disabled={!issueType || !description}
          style={[styles.submitButton, (!issueType || !description) && styles.submitButtonDisabled]}
        >
          <Send size={20} color="#FFFFFF" />
          <Text style={styles.submitButtonText}>Submit Issue</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 24,
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
  content: {
    flex: 1,
    padding: 24,
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
    backgroundColor: '#EF4444',
    paddingVertical: 20,
    borderRadius: 32,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
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
    backgroundColor: '#F59E0B',
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
    color: '#F59E0B',
    letterSpacing: 1.5,
  },
});
