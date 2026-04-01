import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  StyleSheet,
  Modal
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { MotiView, AnimatePresence } from 'moti';
import { Screen } from '../types';

interface JobDetailScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const JobDetailScreen: React.FC<JobDetailScreenProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'milestones' | 'files' | 'tasks'>('timeline');
  const [showMenu, setShowMenu] = useState(false);

  const milestones = [
    { id: '1', title: 'Demolition & Site Prep', status: 'completed', date: 'Mar 15', amount: '$1,200', approved: true },
    { id: '2', title: 'Plumbing Rough-in', status: 'completed', date: 'Mar 20', amount: '$2,500', approved: true },
    { id: '3', title: 'Cabinet Installation', status: 'in-progress', date: 'Mar 25', amount: '$4,000', approved: false, progress: 75 },
    { id: '4', title: 'Countertop Installation', status: 'pending', date: 'Apr 02', amount: '$3,500', approved: false },
  ];

  const timelineEvents = [
    { 
      id: '1', 
      type: 'update', 
      title: 'Cabinet Installation Started', 
      description: 'Marco started installing the upper cabinets today.', 
      time: '2 hours ago', 
      user: 'Marco Rossi',
      imageUrl: 'https://picsum.photos/seed/cab1/400/300'
    },
    { 
      id: '2', 
      type: 'milestone', 
      title: 'Plumbing Rough-in Completed', 
      description: 'Milestone 2 has been completed and approved.', 
      time: '4 days ago', 
      user: 'System' 
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            onPress={() => onNavigate('activeJobs')}
            style={styles.backButton}
          >
            <FontAwesome5 name="chevron-left" size={24} color="#1F2937"  />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Kitchen Remodel</Text>
            <Text style={styles.headerStatus}>IN PROGRESS • 65%</Text>
          </View>
        </View>
        <TouchableOpacity 
          onPress={() => setShowMenu(!showMenu)}
          style={styles.menuButton}
        >
          <FontAwesome5 name="ellipsis-v" size={24} color="#1F2937"  />
        </TouchableOpacity>
      </View>

      {/* Menu Modal */}
      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.menuModal}>
            <TouchableOpacity 
              onPress={() => {
                setShowMenu(false);
                onNavigate('jobCompletion');
              }}
              style={styles.menuItem}
            >
              <FontAwesome5 name="check-circle" size={16} color="#10B981"  />
              <Text style={[styles.menuText, { color: '#10B981' }]}>Mark as Completed</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => {
                setShowMenu(false);
                onNavigate('dispute');
              }}
              style={styles.menuItem}
            >
              <FontAwesome5 name="exclamation-triangle" size={16} color="#F59E0B"  />
              <Text style={[styles.menuText, { color: '#F59E0B' }]}>Open Dispute</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setShowMenu(false)}
              style={styles.menuItem}
            >
              <FontAwesome5 name="times" size={16} color="#EF4444"  />
              <Text style={[styles.menuText, { color: '#EF4444' }]}>Cancel Job</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Contractor Info */}
      <View style={styles.contractorSection}>
        <View style={styles.contractorCard}>
          <View style={styles.contractorInfo}>
            <Image 
              source={{ uri: 'https://picsum.photos/seed/marco/100/100' }}
              style={styles.contractorAvatar}
            />
            <View>
              <Text style={styles.contractorName}>Marco Rossi</Text>
              <Text style={styles.contractorCompany}>ELITE PLUMBING SOLUTIONS</Text>
            </View>
          </View>
          <TouchableOpacity 
            onPress={() => onNavigate('chat')}
            style={styles.contractorChatButton}
          >
            <FontAwesome5 name="comment-alt" size={20} color="#1F2937"  />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.tabsScroll}
        contentContainerStyle={styles.tabsContent}
      >
        {(['timeline', 'tasks', 'milestones', 'files'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Tab Content */}
      <ScrollView style={styles.tabContentContainer}>
        {activeTab === 'timeline' && (
          <View style={styles.timelineContent}>
            {timelineEvents.map((event, i) => (
              <View key={event.id} style={styles.timelineEvent}>
                {i !== timelineEvents.length - 1 && <View style={styles.timelineLine} />}
                
                <View style={[
                  styles.timelineDot,
                  event.type === 'milestone' ? styles.timelineDotMilestone : styles.timelineDotUpdate
                ]}>
                  {event.type === 'milestone' ? (
                    <FontAwesome5 name="check-circle" size={10} color="#FFFFFF"  />
                  ) : (
                    <FontAwesome5 name="camera" size={10} color="#FFFFFF"  />
                  )}
                </View>

                <View style={styles.timelineEventContent}>
                  <View style={styles.timelineEventHeader}>
                    <Text style={styles.timelineEventTitle}>{event.title}</Text>
                    <Text style={styles.timelineEventTime}>{event.time}</Text>
                  </View>
                  <Text style={styles.timelineEventDescription}>{event.description}</Text>
                  
                  {event.imageUrl && (
                    <Image 
                      source={{ uri: event.imageUrl }}
                      style={styles.timelineEventImage}
                      resizeMode="cover"
                    />
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'milestones' && (
          <View style={styles.milestonesContent}>
            {milestones.map((milestone) => (
              <View key={milestone.id} style={styles.milestoneCard}>
                <View style={styles.milestoneHeader}>
                  <View style={styles.milestoneLeft}>
                    <View style={[
                      styles.milestoneStatus,
                      milestone.status === 'completed' && styles.milestoneStatusCompleted,
                      milestone.status === 'in-progress' && styles.milestoneStatusInProgress
                    ]}>
                      {milestone.status === 'completed' ? (
                        <FontAwesome5 name="check-circle" size={16} color="#10B981"  />
                      ) : milestone.status === 'in-progress' ? (
                        <FontAwesome5 name="clock" size={16} color="#3B82F6"  />
                      ) : (
                        <FontAwesome5 name="exclamation-circle" size={16} color="#9CA3AF"  />
                      )}
                    </View>
                    <View>
                      <Text style={styles.milestoneTitle}>{milestone.title}</Text>
                      <Text style={styles.milestoneDate}>{milestone.date}</Text>
                    </View>
                  </View>
                  <Text style={styles.milestoneAmount}>{milestone.amount}</Text>
                </View>

                {milestone.status === 'in-progress' && milestone.progress && (
                  <View style={styles.milestoneProgress}>
                    <Text style={styles.milestoneProgressLabel}>
                      Progress: {milestone.progress}%
                    </Text>
                    <View style={styles.milestoneProgressBar}>
                      <View style={[styles.milestoneProgressFill, { width: `${milestone.progress}%` }]} />
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {activeTab === 'files' && (
          <View style={styles.placeholderContent}>
            <Text style={styles.placeholderText}>Files view - Under construction</Text>
          </View>
        )}

        {activeTab === 'tasks' && (
          <View style={styles.placeholderContent}>
            <Text style={styles.placeholderText}>Tasks view - Under construction</Text>
          </View>
        )}
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
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
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
  headerStatus: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
    letterSpacing: 1.5,
  },
  menuButton: {
    padding: 8,
    borderRadius: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 100,
    paddingRight: 24,
  },
  menuModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: 224,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuText: {
    fontSize: 14,
    fontWeight: '500',
  },
  contractorSection: {
    padding: 24,
  },
  contractorCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 40,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contractorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  contractorAvatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
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
  contractorChatButton: {
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
  tabsScroll: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  tabsContent: {
    gap: 8,
  },
  tab: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
  },
  tabActive: {
    backgroundColor: '#1F2937',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  tabText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  tabContentContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  timelineContent: {
    paddingBottom: 32,
  },
  timelineEvent: {
    position: 'relative',
    paddingLeft: 32,
    marginBottom: 32,
  },
  timelineLine: {
    position: 'absolute',
    left: 11,
    top: 32,
    bottom: -32,
    width: 2,
    backgroundColor: '#F3F4F6',
  },
  timelineDot: {
    position: 'absolute',
    left: 0,
    top: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  timelineDotMilestone: {
    backgroundColor: '#10B981',
  },
  timelineDotUpdate: {
    backgroundColor: '#1F2937',
  },
  timelineEventContent: {
    gap: 12,
  },
  timelineEventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  timelineEventTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  timelineEventTime: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  timelineEventDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
  },
  timelineEventImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    marginTop: 8,
  },
  milestonesContent: {
    gap: 16,
    paddingBottom: 32,
  },
  milestoneCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 24,
    padding: 20,
    gap: 16,
  },
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  milestoneLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  milestoneStatus: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneStatusCompleted: {
    backgroundColor: '#D1FAE5',
  },
  milestoneStatusInProgress: {
    backgroundColor: '#DBEAFE',
  },
  milestoneTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  milestoneDate: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  milestoneAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  milestoneProgress: {
    gap: 8,
  },
  milestoneProgressLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
  },
  milestoneProgressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  milestoneProgressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 3,
  },
  placeholderContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  placeholderText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
});
