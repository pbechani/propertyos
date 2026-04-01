import React from 'react';
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

interface ReviewsScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const ReviewsScreen: React.FC<ReviewsScreenProps> = ({ onNavigate }) => {
  const reviews = [
    { 
      id: '1', 
      author: 'Alexander Thompson', 
      date: 'Feb 2026', 
      rating: 5, 
      content: 'Jordan is a true master of his craft. The custom library he built for us is the centerpiece of our home. His attention to detail and professionalism are unmatched.', 
      helpful: 24, 
      initials: 'AT', 
      color: '#3B82F6' 
    },
    { 
      id: '2', 
      author: 'Sarah Jenkins', 
      date: 'Jan 2026', 
      rating: 5, 
      content: 'Exceptional work on our kitchen remodel. Jordan was communicative throughout the entire process and delivered ahead of schedule. Highly recommend!', 
      helpful: 18, 
      initials: 'SJ', 
      color: '#A855F7' 
    },
    { 
      id: '3', 
      author: 'Michael Chen', 
      date: 'Dec 2025', 
      rating: 4, 
      content: 'Great quality work and very reliable. Jordan is very knowledgeable and helped us make the right decisions for our project.', 
      helpful: 12, 
      initials: 'MC', 
      color: '#10B981' 
    },
    { 
      id: '4', 
      author: 'Emily Davis', 
      date: 'Nov 2025', 
      rating: 5, 
      content: 'The best experience we\'ve had with a contractor. Jordan is professional, clean, and incredibly skilled. We will definitely be hiring him again.', 
      helpful: 31, 
      initials: 'ED', 
      color: '#F59E0B' 
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => onNavigate('profile')}
          style={styles.headerButton}
        >
          <FontAwesome5 name="chevron-left" size={24} color="#1F2937"  />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>REVIEWS (4)</Text>
        <TouchableOpacity style={styles.headerButton}>
          <FontAwesome5 name="filter" size={20} color="#1F2937"  />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Rating Summary */}
        <View style={styles.ratingSummary}>
          <View style={styles.ratingScore}>
            <Text style={styles.scoreNumber}>4.9</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map(s => (
                <FontAwesome5 name="star" key={s} size={10} color="#FFFFFF" fill="#FFFFFF"  />
              ))}
            </View>
            <Text style={styles.reviewCount}>4 REVIEWS</Text>
          </View>
          <View style={styles.ratingBars}>
            {[5, 4, 3, 2, 1].map((rating) => {
              const percentage = rating === 5 ? 85 : rating === 4 ? 10 : 5;
              return (
                <View key={rating} style={styles.ratingBarRow}>
                  <Text style={styles.ratingNumber}>{rating}</Text>
                  <View style={styles.ratingBarTrack}>
                    <View style={[styles.ratingBarFill, { width: `${percentage}%` }]} />
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Reviews List */}
        <View style={styles.reviewsList}>
          {reviews.map((review, i) => (
            <MotiView 
              key={review.id}
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: i * 100, type: 'timing', duration: 400 }}
              style={styles.reviewCard}
            >
              <View style={styles.reviewHeader}>
                <View style={styles.reviewAuthorInfo}>
                  <View style={[styles.reviewAvatar, { backgroundColor: review.color }]}>
                    <Text style={styles.reviewAvatarText}>{review.initials}</Text>
                  </View>
                  <View>
                    <Text style={styles.reviewAuthor}>{review.author}</Text>
                    <Text style={styles.reviewDate}>{review.date}</Text>
                  </View>
                </View>
                <View style={styles.reviewStars}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <FontAwesome5 name="star" 
                      key={s} 
                      size={12} 
                      color={s <= review.rating ? "#1F2937" : "#E5E7EB"}
                      fill={s <= review.rating ? "#1F2937" : "transparent"}
                     />
                  ))}
                </View>
              </View>
              <Text style={styles.reviewContent}>{review.content}</Text>
              <View style={styles.reviewActions}>
                <TouchableOpacity style={styles.reviewAction}>
                  <FontAwesome5 name="thumbs-up" size={14} color="#9CA3AF"  />
                  <Text style={styles.reviewActionText}>Helpful ({review.helpful})</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.reviewAction}>
                  <FontAwesome5 name="comment-alt" size={14} color="#9CA3AF"  />
                  <Text style={styles.reviewActionText}>Reply</Text>
                </TouchableOpacity>
                {review.id === '1' && (
                  <TouchableOpacity 
                    onPress={() => onNavigate('editReview')}
                    style={[styles.reviewAction, { marginLeft: 'auto' }]}
                  >
                    <Text style={[styles.reviewActionText, { color: '#3B82F6' }]}>Edit Review</Text>
                  </TouchableOpacity>
                )}
              </View>
            </MotiView>
          ))}
        </View>
      </ScrollView>

      {/* Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity 
          onPress={() => onNavigate('leaveReview')}
          style={styles.actionButton}
          activeOpacity={0.9}
        >
          <FontAwesome5 name="star" size={18} color="#FFFFFF"  />
          <Text style={styles.actionButtonText}>Leave a Review</Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerButton: {
    width: 40,
    height: 40,
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: '#1F2937',
  },
  content: {
    flex: 1,
  },
  ratingSummary: {
    flexDirection: 'row',
    backgroundColor: '#1F2937',
    borderRadius: 48,
    padding: 24,
    margin: 24,
    gap: 32,
  },
  ratingScore: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 4,
  },
  reviewCount: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 1.5,
    marginTop: 8,
  },
  ratingBars: {
    flex: 1,
    gap: 8,
  },
  ratingBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ratingNumber: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    width: 8,
  },
  ratingBarTrack: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  ratingBarFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  reviewsList: {
    paddingHorizontal: 24,
    paddingBottom: 120,
    gap: 24,
  },
  reviewCard: {
    gap: 16,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  reviewAuthorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewAvatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  reviewAuthor: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  reviewDate: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewContent: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
  },
  reviewActions: {
    flexDirection: 'row',
    gap: 24,
    alignItems: 'center',
  },
  reviewAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewActionText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  actionButton: {
    backgroundColor: '#1F2937',
    paddingVertical: 20,
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
