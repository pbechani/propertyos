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

interface ActiveJobsScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const ActiveJobsScreen: React.FC<ActiveJobsScreenProps> = ({ onNavigate }) => {
  const activeJobs = [
    {
      id: '1',
      title: 'Kitchen Remodel',
      contractor: 'Marco Rossi',
      company: 'Elite Plumbing Solutions',
      avatarUrl: 'https://picsum.photos/seed/marco/100/100',
      progress: 65,
      status: 'In Progress',
      nextMilestone: 'Cabinet Installation',
      dueDate: 'Apr 15',
      imageUrl: 'https://picsum.photos/seed/kitchen/400/300'
    },
    {
      id: '2',
      title: 'Bathroom Tiling',
      contractor: 'Sarah Jenkins',
      company: 'ProFix Home Services',
      avatarUrl: 'https://picsum.photos/seed/sarah/100/100',
      progress: 30,
      status: 'In Progress',
      nextMilestone: 'Floor Waterproofing',
      dueDate: 'Apr 08',
      imageUrl: 'https://picsum.photos/seed/bathroom/400/300'
    }
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => onNavigate('home')}
          style={styles.backButton}
        >
          <FontAwesome5 name="chevron-left" size={24} color="#1F2937"  />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Active Jobs</Text>
      </View>

      {/* Jobs List */}
      <ScrollView style={styles.content}>
        {activeJobs.map((job, i) => (
          <MotiView
            key={job.id}
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: i * 100, type: 'timing', duration: 500 }}
          >
            <TouchableOpacity 
              onPress={() => onNavigate('jobDetail')}
              style={styles.jobCard}
              activeOpacity={0.9}
            >
              <View style={styles.imageContainer}>
                <Image 
                  source={{ uri: job.imageUrl }}
                  style={styles.jobImage}
                  resizeMode="cover"
                />
                <View style={styles.imageGradient} />
                
                <View style={styles.statusBadge}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>{job.status}</Text>
                </View>

                <View style={styles.imageFooter}>
                  <View style={styles.jobInfo}>
                    <Text style={styles.jobTitle}>{job.title}</Text>
                    <View style={styles.contractorRow}>
                      <Image 
                        source={{ uri: job.avatarUrl }}
                        style={styles.contractorAvatar}
                      />
                      <Text style={styles.contractorName}>{job.contractor}</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.cardContent}>
                <View style={styles.progressSection}>
                  <View style={styles.progressHeader}>
                    <View>
                      <Text style={styles.progressLabel}>CURRENT PROGRESS</Text>
                      <Text style={styles.progressValue}>{job.progress}%</Text>
                    </View>
                    <View style={styles.milestoneInfo}>
                      <Text style={styles.milestoneLabel}>NEXT MILESTONE</Text>
                      <Text style={styles.milestoneText}>{job.nextMilestone}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.progressBarContainer}>
                    <View style={styles.progressBar}>
                      <MotiView 
                        from={{ width: 0 }}
                        animate={{ width: `${job.progress}%` }}
                        transition={{ duration: 2000, delay: 300 }}
                        style={styles.progressFill}
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <View style={styles.companyRow}>
                    <View style={styles.companyIcon}>
                      <FontAwesome5 name="hammer" size={20} color="#9CA3AF"  />
                    </View>
                    <View>
                      <Text style={styles.companyLabel}>COMPANY</Text>
                      <Text style={styles.companyName}>{job.company}</Text>
                    </View>
                  </View>
                  <View style={styles.dueDateInfo}>
                    <Text style={styles.dueDateLabel}>TARGET DATE</Text>
                    <Text style={styles.dueDateValue}>{job.dueDate}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </MotiView>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.5,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  jobCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 48,
    overflow: 'hidden',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  imageContainer: {
    height: 224,
    position: 'relative',
  },
  jobImage: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  statusBadge: {
    position: 'absolute',
    top: 24,
    left: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(12px)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  imageFooter: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
  },
  jobInfo: {
    gap: 4,
  },
  jobTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  contractorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contractorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  contractorName: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  cardContent: {
    padding: 32,
    gap: 24,
  },
  progressSection: {
    gap: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  progressValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -1,
  },
  milestoneInfo: {
    alignItems: 'flex-end',
  },
  milestoneLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  milestoneText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
  },
  progressBarContainer: {
    position: 'relative',
  },
  progressBar: {
    height: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1F2937',
    borderRadius: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#F9FAFB',
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  companyIcon: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
  },
  companyName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  dueDateInfo: {
    alignItems: 'flex-end',
  },
  dueDateLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
  },
  dueDateValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
  },
});
