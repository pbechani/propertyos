import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  Image, 
  ScrollView, 
  StyleSheet 
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { Screen } from '../types';

interface LeaveReviewScreenProps {
  onNavigate: (screen: Screen) => void;
  isEditing?: boolean;
}

export const LeaveReviewScreen: React.FC<LeaveReviewScreenProps> = ({ onNavigate, isEditing = false }) => {
  const [rating, setRating] = useState(isEditing ? 4 : 0);
  const [review, setReview] = useState(isEditing ? 'Great work on the kitchen remodel. Jordan was communicative throughout the entire process and delivered ahead of schedule. Highly recommend!' : '');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = () => {
    setIsSubmitted(true);
    setTimeout(() => onNavigate('profile'), 1500);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => onNavigate('profile')}
          style={styles.backButton}
        >
          <FontAwesome5 name="chevron-left" size={24} color="#1F2937"  />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditing ? 'Edit Review' : 'Leave Review'}</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Contractor Summary */}
        <View style={styles.contractorCard}>
          <Image 
            source={{ uri: 'https://picsum.photos/seed/marco/100/100' }}
            style={styles.contractorAvatar}
          />
          <View style={styles.contractorInfo}>
            <Text style={styles.contractorName}>Marco Rossi</Text>
            <Text style={styles.contractorCompany}>ELITE PLUMBING SOLUTIONS</Text>
            <View style={styles.contractorMeta}>
              <FontAwesome5 name="star" size={12} color="#1F2937" fill="#1F2937"  />
              <Text style={styles.contractorRating}>4.9</Text>
              <Text style={styles.metaSeparator}>•</Text>
              <Text style={styles.contractorProject}>KITCHEN REMODEL</Text>
            </View>
          </View>
        </View>

        {/* Star Rating */}
        <View style={styles.ratingSection}>
          <Text style={styles.ratingLabel}>OVERALL RATING</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => setRating(s)}
                activeOpacity={0.7}
              >
                <FontAwesome5 name="star" 
                  size={40} 
                  color={s <= rating ? '#1F2937' : '#E5E7EB'}
                  fill={s <= rating ? '#1F2937' : 'transparent'}
                 />
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.ratingFeedback}>
            {rating === 5 ? 'Excellent!' : rating === 4 ? 'Very Good' : rating === 3 ? 'Good' : rating === 2 ? 'Fair' : rating === 1 ? 'Poor' : 'Select a rating'}
          </Text>
        </View>

        {/* Review Text */}
        <View style={styles.reviewSection}>
          <Text style={styles.reviewLabel}>YOUR EXPERIENCE</Text>
          <TextInput
            value={review}
            onChangeText={setReview}
            placeholder="Share your experience working with this contractor..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            style={styles.reviewInput}
          />
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.actionBar}>
        <TouchableOpacity 
          onPress={handleSubmit}
          disabled={rating === 0 || !review || isSubmitted}
          style={[styles.submitButton, (rating === 0 || !review || isSubmitted) && styles.submitButtonDisabled]}
        >
          <FontAwesome5 name="paper-plane" size={20} color="#FFFFFF"  />
          <Text style={styles.submitButtonText}>
            {isSubmitted ? 'Submitted!' : isEditing ? 'Update Review' : 'Submit Review'}
          </Text>
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
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
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
  content: {
    flex: 1,
    padding: 24,
  },
  contractorCard: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 40,
    padding: 24,
    gap: 16,
    marginBottom: 32,
  },
  contractorAvatar: {
    width: 64,
    height: 64,
    borderRadius: 16,
  },
  contractorInfo: {
    flex: 1,
    gap: 4,
  },
  contractorName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  contractorCompany: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
  },
  contractorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  contractorRating: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1F2937',
  },
  metaSeparator: {
    fontSize: 10,
    color: '#D1D5DB',
    marginHorizontal: 4,
  },
  contractorProject: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
  },
  ratingSection: {
    alignItems: 'center',
    gap: 16,
    marginBottom: 32,
  },
  ratingLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  ratingFeedback: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  reviewSection: {
    gap: 16,
    marginBottom: 32,
  },
  reviewLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
    paddingHorizontal: 8,
  },
  reviewInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    fontSize: 14,
    color: '#1F2937',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
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
  paymentSection: {
    paddingHorizontal: 24,
    gap: 16,
    marginBottom: 32,
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    padding: 24,
    borderRadius: 40,
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  paymentIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  paymentExpiry: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
  },
  changeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3B82F6',
  },
  securityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#D1FAE5',
    padding: 20,
    marginHorizontal: 24,
    borderRadius: 32,
    marginBottom: 32,
  },
  securityText: {
    flex: 1,
    fontSize: 12,
    color: '#047857',
    lineHeight: 20,
  },
});
