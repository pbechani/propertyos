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

interface HomeownerDashboardProps {
  onNavigate: (screen: Screen) => void;
}

export const HomeownerDashboard: React.FC<HomeownerDashboardProps> = ({ onNavigate }) => {
  const experts = [
    { name: 'Jordan Smith', role: 'Master Carpenter', rating: 4.9, reviews: 124, location: 'Brooklyn, NY', color: '#3B82F6' },
    { name: 'Elena Rodriguez', role: 'Interior Architect', rating: 5.0, reviews: 89, location: 'Manhattan, NY', color: '#A855F7' },
    { name: 'Marcus Chen', role: 'Smart Home Specialist', rating: 4.8, reviews: 210, location: 'Queens, NY', color: '#10B981' }
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Welcome back, Alexander</Text>
          <Text style={styles.headerDate}>Tuesday, March 24</Text>
        </View>
        <TouchableOpacity 
          onPress={() => onNavigate('notifications')}
          style={styles.notificationButton}
        >
          <FontAwesome5 name="bell" size={24} color="#1F2937"  />
          <View style={styles.notificationBadge} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Active Project Card */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>ACTIVE PROJECT</Text>
            <TouchableOpacity 
              onPress={() => onNavigate('projects')}
              style={styles.viewAllButton}
            >
              <Text style={styles.viewAllText}>View All</Text>
              <FontAwesome5 name="chevron-right" size={14} color="#1F2937"  />
            </TouchableOpacity>
          </View>

          <MotiView 
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500 }}
          >
            <TouchableOpacity 
              style={styles.activeProjectCard}
              onPress={() => onNavigate('jobDetail')}
              activeOpacity={0.9}
            >
              <View style={styles.projectStatusBadge}>
                <Text style={styles.projectStatusText}>IN PROGRESS</Text>
              </View>
              <Text style={styles.projectTitle}>Kitchen Remodel</Text>
              <Text style={styles.projectPhase}>Phase 2: Cabinetry Installation</Text>
              
              <View style={styles.teamRow}>
                <View style={styles.avatarGroup}>
                  <View style={[styles.avatar, { backgroundColor: '#3B82F6' }]}>
                    <Text style={styles.avatarText}>JS</Text>
                  </View>
                  <View style={[styles.avatar, styles.avatarOverlap, { backgroundColor: '#6B7280' }]}>
                    <Text style={styles.avatarText}>+2</Text>
                  </View>
                </View>
                <Text style={styles.teamText}>3 team members active</Text>
              </View>

              <View style={styles.projectBackground} />
            </TouchableOpacity>
          </MotiView>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity 
            onPress={() => onNavigate('discover')}
            style={styles.quickActionCard}
            activeOpacity={0.7}
          >
            <View style={styles.quickActionIcon}>
              <FontAwesome5 name="search" size={20} color="#1F2937"  />
            </View>
            <View>
              <Text style={styles.quickActionTitle}>Find Experts</Text>
              <Text style={styles.quickActionSubtitle}>DISCOVER TALENT</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => onNavigate('createProject')}
            style={styles.quickActionCard}
            activeOpacity={0.7}
          >
            <View style={styles.quickActionIcon}>
              <FontAwesome5 name="plus" size={20} color="#1F2937"  />
            </View>
            <View>
              <Text style={styles.quickActionTitle}>New Project</Text>
              <Text style={styles.quickActionSubtitle}>START PLANNING</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Recommended Experts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>RECOMMENDED EXPERTS</Text>
            <TouchableOpacity 
              onPress={() => onNavigate('discover')}
              style={styles.viewAllButton}
            >
              <Text style={styles.viewAllText}>See More</Text>
              <FontAwesome5 name="chevron-right" size={14} color="#1F2937"  />
            </TouchableOpacity>
          </View>

          <View style={styles.expertsList}>
            {experts.map((expert, i) => (
              <MotiView 
                key={i}
                from={{ opacity: 0, translateX: -20 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ delay: i * 100, type: 'timing', duration: 400 }}
              >
                <TouchableOpacity 
                  style={styles.expertCard}
                  onPress={() => onNavigate('profile')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.expertAvatar, { backgroundColor: expert.color }]}>
                    <Text style={styles.expertInitials}>
                      {expert.name.split(' ').map(n => n[0]).join('')}
                    </Text>
                  </View>
                  
                  <View style={styles.expertInfo}>
                    <Text style={styles.expertName}>{expert.name}</Text>
                    <Text style={styles.expertRole}>{expert.role}</Text>
                    
                    <View style={styles.expertMeta}>
                      <View style={styles.ratingContainer}>
                        <FontAwesome5 name="star" size={10} color="#1F2937" fill="#1F2937"  />
                        <Text style={styles.ratingText}>{expert.rating}</Text>
                      </View>
                      <View style={styles.locationContainer}>
                        <FontAwesome5 name="map-marker-alt" size={10} color="#9CA3AF"  />
                        <Text style={styles.locationText}>{expert.location}</Text>
                      </View>
                    </View>
                  </View>

                  <FontAwesome5 name="chevron-right" size={20} color="#D1D5DB"  />
                </TouchableOpacity>
              </MotiView>
            ))}
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
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.5,
  },
  headerDate: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 4,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
    borderRadius: 20,
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    backgroundColor: '#EF4444',
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 24,
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
  activeProjectCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  projectStatusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 12,
  },
  projectStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  projectTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  projectPhase: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 24,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarGroup: {
    flexDirection: 'row',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#1F2937',
  },
  avatarOverlap: {
    marginLeft: -8,
  },
  avatarText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  teamText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  projectBackground: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 128,
    height: 128,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 64,
    marginRight: -64,
    marginTop: -64,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  quickActionSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
  },
  expertsList: {
    gap: 16,
  },
  expertCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  expertAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expertInitials: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  expertInfo: {
    flex: 1,
  },
  expertName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  expertRole: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  expertMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1F2937',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
  },
});
