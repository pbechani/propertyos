import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  StyleSheet,
  TextInput 
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Screen } from '../types';
import { MotiView } from 'moti';

interface ActiveJobsProps {
  onNavigate: (screen: Screen) => void;
}

// 1. Active Jobs List
export const ActiveJobsListScreen: React.FC<ActiveJobsProps> = ({ onNavigate }) => {
  const jobs = [
    { id: '1', title: 'Emergency Pipe Repair', client: 'Robert D.', status: 'In Progress', progress: 65, deadline: 'Today, 5 PM', budget: '$805', statusColor: '#3B82F6' },
    { id: '2', title: 'Bathroom Tile Install', client: 'Sarah M.', status: 'Starting Soon', progress: 0, deadline: 'Tomorrow', budget: '$1,200', statusColor: '#A855F7' },
    { id: '3', title: 'Kitchen Sink Replacement', client: 'James L.', status: 'On Hold', progress: 30, deadline: 'Mar 28', budget: '$450', statusColor: '#F59E0B' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Active Jobs</Text>
        <View style={styles.activeBadge}>
          <View style={styles.activeDot} />
          <Text style={styles.activeBadgeText}>3 ACTIVE</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {jobs.map((job, i) => (
          <MotiView
            key={job.id}
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: i * 100, type: 'timing', duration: 400 }}
          >
            <TouchableOpacity 
              onPress={() => onNavigate('jobDetail')}
              style={styles.jobCard}
              activeOpacity={0.8}
            >
              <View style={styles.jobHeader}>
                <View style={styles.jobHeaderLeft}>
                  <Text style={styles.jobTitle}>{job.title}</Text>
                  <Text style={styles.jobClient}>{job.client}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: `${job.statusColor}15` }]}>
                  <Text style={[styles.statusText, { color: job.statusColor }]}>
                    {job.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>PROGRESS</Text>
                  <Text style={styles.progressValue}>{job.progress}%</Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${job.progress}%` }]} />
                </View>
              </View>

              <View style={styles.jobFooter}>
                <View style={styles.jobMeta}>
                  <View style={styles.metaItem}>
                    <FontAwesome5 name="clock" size={14} color="#9CA3AF"  />
                    <Text style={styles.metaText}>{job.deadline}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <FontAwesome5 name="dollar-sign" size={14} color="#9CA3AF"  />
                    <Text style={styles.metaText}>{job.budget}</Text>
                  </View>
                </View>
                <FontAwesome5 name="chevron-right" size={20} color="#D1D5DB"  />
              </View>
            </TouchableOpacity>
          </MotiView>
        ))}
      </ScrollView>
    </View>
  );
};

// 2. Job Detail
export const ActiveJobDetailScreen: React.FC<ActiveJobsProps> = ({ onNavigate }) => {
  const milestones = [
    { label: 'Site Inspection', status: 'completed' },
    { label: 'Material Procurement', status: 'completed' },
    { label: 'Pipe Installation', status: 'in-progress' },
    { label: 'Quality Check', status: 'pending' },
    { label: 'Final Cleanup', status: 'pending' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.detailHeader}>
        <TouchableOpacity onPress={() => onNavigate('activeJobs')} style={styles.backButton}>
          <FontAwesome5 name="arrow-left" size={24} color="#1F2937"  />
        </TouchableOpacity>
        <Text style={styles.detailHeaderTitle}>Job Details</Text>
        <TouchableOpacity style={styles.moreButton}>
          <FontAwesome5 name="ellipsis-v" size={24} color="#1F2937"  />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Header Info */}
        <View style={styles.jobInfoSection}>
          <View style={styles.jobInfoHeader}>
            <View style={styles.jobInfoLeft}>
              <Text style={styles.jobDetailTitle}>Emergency Pipe Repair</Text>
              <View style={styles.locationRow}>
                <FontAwesome5 name="map-marker-alt" size={16} color="#6B7280"  />
                <Text style={styles.locationText}>Brooklyn, NY • 1.2 miles away</Text>
              </View>
            </View>
            <View style={styles.urgencyIcon}>
              <FontAwesome5 name="clock" size={24} color="#3B82F6"  />
            </View>
          </View>
          
          <View style={styles.badgeRow}>
            <View style={styles.statusBadgeLarge}>
              <Text style={styles.statusBadgeLargeText}>IN PROGRESS</Text>
            </View>
            <View style={styles.priorityBadge}>
              <Text style={styles.priorityBadgeText}>PRIORITY</Text>
            </View>
            <TouchableOpacity 
              onPress={() => onNavigate('contractDetail')}
              style={styles.contractBadge}
            >
              <FontAwesome5 name="file-alt" size={10} color="#3B82F6"  />
              <Text style={styles.contractBadgeText}>VIEW CONTRACT</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Client Card */}
        <View style={styles.clientCard}>
          <View style={styles.clientInfo}>
            <View style={styles.clientAvatar}>
              <Text style={styles.clientAvatarText}>RD</Text>
            </View>
            <View>
              <Text style={styles.clientName}>Robert D.</Text>
              <Text style={styles.clientLabel}>CLIENT</Text>
            </View>
          </View>
          <TouchableOpacity 
            onPress={() => onNavigate('chat')}
            style={styles.chatButton}
          >
            <FontAwesome5 name="comment-alt" size={20} color="#1F2937"  />
          </TouchableOpacity>
        </View>

        {/* Progress Tracker */}
        <View style={styles.progressTrackerSection}>
          <View style={styles.progressTrackerHeader}>
            <Text style={styles.progressTrackerLabel}>CURRENT PROGRESS</Text>
            <Text style={styles.progressTrackerValue}>65%</Text>
          </View>
          <View style={styles.progressBarLarge}>
            <View style={[styles.progressFillLarge, { width: '65%' }]} />
          </View>
          
          <View style={styles.actionGrid}>
            <TouchableOpacity 
              onPress={() => onNavigate('updateProgress')}
              style={styles.actionCard}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#3B82F6' }]}>
                <FontAwesome5 name="camera" size={20} color="#FFFFFF"  />
              </View>
              <Text style={styles.actionLabel}>UPDATE PROGRESS</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => onNavigate('uploadMedia')}
              style={styles.actionCard}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#A855F7' }]}>
                <FontAwesome5 name="camera" size={20} color="#FFFFFF"  />
              </View>
              <Text style={styles.actionLabel}>UPLOAD MEDIA</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Milestones */}
        <View style={styles.milestonesSection}>
          <Text style={styles.milestonesTitle}>MILESTONES</Text>
          <View style={styles.milestonesList}>
            {milestones.map((milestone, i) => (
              <View key={i} style={styles.milestoneItem}>
                <View style={[
                  styles.milestoneIcon,
                  milestone.status === 'completed' && styles.milestoneIconCompleted,
                  milestone.status === 'in-progress' && styles.milestoneIconInProgress
                ]}>
                  {milestone.status === 'completed' ? (
                    <FontAwesome5 name="check-circle" size={16} color="#10B981"  />
                  ) : milestone.status === 'in-progress' ? (
                    <FontAwesome5 name="clock" size={16} color="#3B82F6"  />
                  ) : (
                    <View style={styles.milestoneDot} />
                  )}
                </View>
                <Text style={[
                  styles.milestoneLabel,
                  milestone.status === 'completed' && styles.milestoneLabelCompleted
                ]}>
                  {milestone.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => onNavigate('requestPayment')}
          >
            <Text style={styles.quickActionText}>Request Payment</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickActionButtonSecondary}
            onPress={() => onNavigate('reportIssue')}
          >
            <Text style={styles.quickActionTextSecondary}>Report Issue</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

// 3. Complete Job Screen
export const CompleteJobScreen: React.FC<ActiveJobsProps> = ({ onNavigate }) => {
  const [notes, setNotes] = useState('');
  const [photosUploaded, setPhotosUploaded] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.detailHeader}>
        <TouchableOpacity onPress={() => onNavigate('jobDetail')} style={styles.backButton}>
          <FontAwesome5 name="arrow-left" size={24} color="#1F2937"  />
        </TouchableOpacity>
        <Text style={styles.detailHeaderTitle}>Complete Job</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.completeSection}>
          <View style={styles.completeIconContainer}>
            <FontAwesome5 name="check-circle" size={64} color="#10B981"  />
          </View>
          
          <Text style={styles.completeTitle}>Ready to Complete?</Text>
          <Text style={styles.completeSubtitle}>
            Make sure all work is done and the client has approved the final milestone.
          </Text>

          <View style={styles.checklistSection}>
            <Text style={styles.checklistTitle}>COMPLETION CHECKLIST</Text>
            
            <TouchableOpacity 
              style={styles.checklistItem}
              onPress={() => setPhotosUploaded(!photosUploaded)}
            >
              <View style={[styles.checkbox, photosUploaded && styles.checkboxChecked]}>
                {photosUploaded && <FontAwesome5 name="check-circle" size={16} color="#FFFFFF"  />}
              </View>
              <Text style={styles.checklistText}>Final photos uploaded</Text>
            </TouchableOpacity>

            <View style={styles.checklistItem}>
              <View style={styles.checkbox}>
                <FontAwesome5 name="check-circle" size={16} color="#10B981"  />
              </View>
              <Text style={styles.checklistText}>All milestones completed</Text>
            </View>

            <View style={styles.checklistItem}>
              <View style={styles.checkbox}>
                <FontAwesome5 name="check-circle" size={16} color="#10B981"  />
              </View>
              <Text style={styles.checklistText}>Client approval received</Text>
            </View>
          </View>

          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>COMPLETION NOTES (OPTIONAL)</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Add any final notes or recommendations..."
              placeholderTextColor="#9CA3AF"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity 
            style={[styles.completeButton, !photosUploaded && styles.completeButtonDisabled]}
            onPress={() => onNavigate('jobSuccess')}
            disabled={!photosUploaded}
          >
            <Text style={styles.completeButtonText}>Complete & Request Review</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => onNavigate('jobDetail')}
          >
            <Text style={styles.cancelButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

// Placeholder exports for other screens (to prevent import errors)
export const UpdateProgressScreen: React.FC<ActiveJobsProps> = ({ onNavigate }) => (
  <View style={styles.placeholderContainer}>
    <Text style={styles.placeholderText}>Update Progress</Text>
    <TouchableOpacity style={styles.placeholderButton} onPress={() => onNavigate('jobDetail')}>
      <Text style={styles.placeholderButtonText}>Back</Text>
    </TouchableOpacity>
  </View>
);

export const UploadMediaScreen: React.FC<ActiveJobsProps> = ({ onNavigate }) => (
  <View style={styles.placeholderContainer}>
    <Text style={styles.placeholderText}>Upload Media</Text>
    <TouchableOpacity style={styles.placeholderButton} onPress={() => onNavigate('jobDetail')}>
      <Text style={styles.placeholderButtonText}>Back</Text>
    </TouchableOpacity>
  </View>
);

export const MarkMilestoneScreen: React.FC<ActiveJobsProps> = ({ onNavigate }) => (
  <View style={styles.placeholderContainer}>
    <Text style={styles.placeholderText}>Mark Milestone</Text>
    <TouchableOpacity style={styles.placeholderButton} onPress={() => onNavigate('jobDetail')}>
      <Text style={styles.placeholderButtonText}>Back</Text>
    </TouchableOpacity>
  </View>
);

export const RequestPaymentScreen: React.FC<ActiveJobsProps> = ({ onNavigate }) => (
  <View style={styles.placeholderContainer}>
    <Text style={styles.placeholderText}>Request Payment</Text>
    <TouchableOpacity style={styles.placeholderButton} onPress={() => onNavigate('jobDetail')}>
      <Text style={styles.placeholderButtonText}>Back</Text>
    </TouchableOpacity>
  </View>
);

export const DelayNotificationScreen: React.FC<ActiveJobsProps> = ({ onNavigate }) => (
  <View style={styles.placeholderContainer}>
    <Text style={styles.placeholderText}>Delay Notification</Text>
    <TouchableOpacity style={styles.placeholderButton} onPress={() => onNavigate('jobDetail')}>
      <Text style={styles.placeholderButtonText}>Back</Text>
    </TouchableOpacity>
  </View>
);

export const CancelJobRequestScreen: React.FC<ActiveJobsProps> = ({ onNavigate }) => (
  <View style={styles.placeholderContainer}>
    <Text style={styles.placeholderText}>Cancel Job Request</Text>
    <TouchableOpacity style={styles.placeholderButton} onPress={() => onNavigate('jobDetail')}>
      <Text style={styles.placeholderButtonText}>Back</Text>
    </TouchableOpacity>
  </View>
);

export const ActiveJobChatScreen: React.FC<ActiveJobsProps> = ({ onNavigate }) => (
  <View style={styles.placeholderContainer}>
    <Text style={styles.placeholderText}>Job Chat</Text>
    <TouchableOpacity style={styles.placeholderButton} onPress={() => onNavigate('jobDetail')}>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
    letterSpacing: 1.5,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  jobCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 48,
    padding: 24,
    marginBottom: 16,
    gap: 16,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  jobHeaderLeft: {
    flex: 1,
    gap: 4,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  jobClient: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  progressSection: {
    gap: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
  },
  progressValue: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1F2937',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1F2937',
    borderRadius: 3,
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
  },
  jobMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  detailHeader: {
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
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  detailHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  moreButton: {
    padding: 8,
    borderRadius: 20,
  },
  jobInfoSection: {
    marginBottom: 32,
    gap: 16,
  },
  jobInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  jobInfoLeft: {
    flex: 1,
    gap: 8,
  },
  jobDetailTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  urgencyIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#DBEAFE',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  statusBadgeLarge: {
    backgroundColor: '#1F2937',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusBadgeLargeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  priorityBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  priorityBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 1.5,
  },
  contractBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  contractBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#3B82F6',
    letterSpacing: 1.5,
  },
  clientCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 32,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  clientAvatar: {
    width: 48,
    height: 48,
    backgroundColor: '#A855F7',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  clientName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  clientLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
  },
  chatButton: {
    width: 40,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  progressTrackerSection: {
    gap: 24,
    marginBottom: 32,
  },
  progressTrackerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
  },
  progressTrackerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
  },
  progressTrackerValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -1,
  },
  progressBarLarge: {
    height: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  progressFillLarge: {
    height: '100%',
    backgroundColor: '#1F2937',
    borderRadius: 6,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 24,
    borderRadius: 32,
    gap: 12,
    alignItems: 'center',
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  milestonesSection: {
    marginBottom: 32,
  },
  milestonesTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  milestonesList: {
    gap: 12,
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  milestoneIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneIconCompleted: {
    backgroundColor: '#D1FAE5',
  },
  milestoneIconInProgress: {
    backgroundColor: '#DBEAFE',
  },
  milestoneDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },
  milestoneLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  milestoneLabelCompleted: {
    color: '#1F2937',
  },
  quickActionsSection: {
    gap: 12,
    marginBottom: 32,
  },
  quickActionButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 18,
    borderRadius: 32,
    alignItems: 'center',
  },
  quickActionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  quickActionButtonSecondary: {
    backgroundColor: '#F9FAFB',
    paddingVertical: 18,
    borderRadius: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickActionTextSecondary: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B7280',
  },
  completeSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  completeIconContainer: {
    width: 120,
    height: 120,
    backgroundColor: '#D1FAE5',
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  completeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  completeSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 24,
  },
  checklistSection: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 24,
    padding: 24,
    gap: 16,
    marginBottom: 24,
  },
  checklistTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checklistText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  notesSection: {
    width: '100%',
    gap: 8,
    marginBottom: 24,
  },
  notesLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
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
  completeButton: {
    backgroundColor: '#10B981',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 32,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  completeButtonDisabled: {
    backgroundColor: '#E5E7EB',
    opacity: 0.6,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cancelButton: {
    paddingVertical: 12,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  placeholderContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  placeholderText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 24,
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
