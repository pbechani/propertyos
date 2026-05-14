import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet,
  Switch
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { Screen } from '../types';

interface ContractorDashboardProps {
  onNavigate: (screen: Screen) => void;
}

export const ContractorDashboard: React.FC<ContractorDashboardProps> = ({ onNavigate }) => {
  const [isAvailable, setIsAvailable] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  const stats = [
    { label: 'Total Earnings', value: '$12,450', change: '+12%', trend: 'up', icon: DollarSign, screen: 'earningsDashboard' as Screen },
    { label: 'Active Jobs', value: '4', change: '0', trend: 'neutral', icon: Briefcase, screen: 'activeJobs' as Screen },
    { label: 'Rating', value: '4.9', change: '+0.1', trend: 'up', icon: Star, screen: 'reviews' as Screen },
    { label: 'Completion Rate', value: '98%', change: '+2%', trend: 'up', icon: CheckCircle2, screen: null },
  ];

  const recentJobs = [
    { id: '1', title: 'Kitchen Remodel', client: 'Alexander W.', status: 'In Progress', price: '$4,500', progress: 65 },
    { id: '2', title: 'Bathroom Tile', client: 'Sarah L.', status: 'Pending Approval', price: '$2,200', progress: 100 },
    { id: '3', title: 'Deck Repair', client: 'Mike R.', status: 'Scheduled', price: '$1,800', progress: 0 },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>JS</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>Jordan Smith</Text>
            <Text style={styles.headerSubtitle}>Master Carpenter</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => onNavigate('notifications')}>
          <FontAwesome5 name="bell" size={24} color="#1F2937"  />
        </TouchableOpacity>
      </View>

      {/* Offline Banner */}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <FontAwesome5 name="wifi" size={16} color="#EF4444"  />
          <Text style={styles.offlineBannerText}>
            You're offline. Changes will sync when reconnected.
          </Text>
        </View>
      )}

      {/* Availability Toggle */}
      <View style={styles.availabilityCard}>
        <View>
          <Text style={styles.availabilityLabel}>
            {isAvailable ? 'Available for Work' : 'Unavailable'}
          </Text>
          <Text style={styles.availabilitySubtext}>
            {isAvailable ? 'Accepting new job requests' : 'Not accepting new requests'}
          </Text>
        </View>
        <Switch
          value={isAvailable}
          onValueChange={setIsAvailable}
          trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
          thumbColor="#FFFFFF"
        />
      </View>

      <ScrollView style={styles.content}>
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {stats.map((stat, i) => {
            const IconComponent = stat.icon;
            return (
              <MotiView 
                key={stat.label}
                from={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 100, type: 'timing', duration: 400 }}
              >
                <TouchableOpacity 
                  style={styles.statCard}
                  onPress={() => stat.screen && onNavigate(stat.screen)}
                  activeOpacity={0.7}
                  disabled={!stat.screen}
                >
                  <View style={styles.statHeader}>
                    <View style={styles.statIcon}>
                      <IconComponent size={20} color="#1F2937" />
                    </View>
                    {stat.change !== '0' && (
                      <View style={[
                        styles.statChange,
                        stat.trend === 'up' ? styles.statChangeUp : styles.statChangeDown
                      ]}>
                        <FontAwesome5 name="arrow-up-right" size={12}  />
                        <Text style={[
                          styles.statChangeText,
                          stat.trend === 'up' ? styles.statChangeTextUp : styles.statChangeTextDown
                        ]}>
                          {stat.change}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                  <Text style={styles.statValue}>{stat.value}</Text>
                </TouchableOpacity>
              </MotiView>
            );
          })}
        </View>

        {/* Active Jobs Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>ACTIVE JOBS</Text>
            <TouchableOpacity 
              onPress={() => onNavigate('activeJobs')}
              style={styles.viewAllButton}
            >
              <Text style={styles.viewAllText}>View All</Text>
              <FontAwesome5 name="chevron-right" size={14} color="#1F2937"  />
            </TouchableOpacity>
          </View>

          <View style={styles.jobsList}>
            {recentJobs.map((job, i) => (
              <MotiView 
                key={job.id}
                from={{ opacity: 0, translateX: -20 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ delay: 300 + i * 100, type: 'timing', duration: 400 }}
              >
                <TouchableOpacity 
                  style={styles.jobCard}
                  onPress={() => onNavigate('jobDetail')}
                  activeOpacity={0.7}
                >
                  <View style={styles.jobHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.jobTitle}>{job.title}</Text>
                      <Text style={styles.jobClient}>{job.client}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.jobPrice}>{job.price}</Text>
                      <Text style={[
                        styles.jobStatus,
                        job.status === 'In Progress' ? styles.statusInProgress : styles.statusPending
                      ]}>
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
                      <MotiView 
                        from={{ width: 0 }}
                        animate={{ width: `${job.progress}%` }}
                        transition={{ duration: 1000, delay: 500 + i * 100 }}
                        style={styles.progressFill}
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              </MotiView>
            ))}
          </View>
        </View>

        {/* Quick Actions Widget */}
        <View style={styles.quickActionsWidget}>
          <Text style={styles.quickActionsTitle}>QUICK ACTIONS</Text>
          <View style={styles.quickActionsGrid}>
            {[
              { icon: Plus, label: 'New Bid', color: '#3B82F6', screen: 'jobFeed' as Screen },
              { icon: MessageSquare, label: 'Chat', color: '#A855F7', screen: 'conversationsList' as Screen },
              { icon: Calendar, label: 'Schedule', color: '#F59E0B', screen: 'availability' as Screen },
              { icon: DollarSign, label: 'Invoices', color: '#10B981', screen: 'paymentHistory' as Screen },
            ].map((action) => {
              const IconComponent = action.icon;
              return (
                <TouchableOpacity 
                  key={action.label}
                  style={styles.quickActionButton}
                  onPress={() => onNavigate(action.screen)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.quickActionIconContainer, { backgroundColor: action.color }]}>
                    <IconComponent size={20} color="#FFFFFF" />
                  </View>
                  <Text style={styles.quickActionLabel}>{action.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarLarge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLargeText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  offlineBanner: {
    backgroundColor: '#FEF2F2',
    paddingVertical: 12,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  offlineBannerText: {
    fontSize: 12,
    color: '#991B1B',
    fontWeight: '600',
  },
  availabilityCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  availabilityLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  availabilitySubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 32,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    width: '47%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIcon: {
    padding: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  statChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  statChangeUp: {
    color: '#10B981',
  },
  statChangeDown: {
    color: '#EF4444',
  },
  statChangeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statChangeTextUp: {
    color: '#10B981',
  },
  statChangeTextDown: {
    color: '#EF4444',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: 1.5,
  },
  jobsList: {
    gap: 16,
  },
  jobCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  jobClient: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  jobPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  jobStatus: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  statusInProgress: {
    color: '#10B981',
  },
  statusPending: {
    color: '#F59E0B',
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
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1F2937',
    borderRadius: 3,
  },
  quickActionsWidget: {
    backgroundColor: '#F9FAFB',
    borderRadius: 40,
    padding: 32,
    marginBottom: 24,
  },
  quickActionsTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: 24,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-around',
  },
  quickActionButton: {
    alignItems: 'center',
    gap: 8,
    width: '22%',
  },
  quickActionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  quickActionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },
});
