import React, { useState } from 'react';
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

interface ProjectsScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const ProjectsScreen: React.FC<ProjectsScreenProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');

  const projects = [
    { 
      id: '1', 
      title: 'Kitchen Remodel', 
      status: 'active', 
      phase: 'Quotes Received', 
      progress: 0, 
      contractor: '3 Quotes Available', 
      date: 'Mar 2026', 
      color: '#10B981', 
      hasQuotes: true 
    },
    { 
      id: '2', 
      title: 'Bathroom Renovation', 
      status: 'active', 
      phase: 'Plumbing Rough-in', 
      progress: 30, 
      contractor: 'Elena Rodriguez', 
      date: 'Apr 2026', 
      color: '#A855F7' 
    },
    { 
      id: '3', 
      title: 'Deck Construction', 
      status: 'completed', 
      phase: 'Finished', 
      progress: 100, 
      contractor: 'Marcus Chen', 
      date: 'Jan 2026', 
      color: '#10B981' 
    },
    { 
      id: '4', 
      title: 'Basement Finishing', 
      status: 'completed', 
      phase: 'Finished', 
      progress: 100, 
      contractor: 'Sarah Miller', 
      date: 'Dec 2025', 
      color: '#F59E0B' 
    },
  ];

  const filteredProjects = projects.filter(p => p.status === activeTab);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Projects</Text>
        <TouchableOpacity 
          onPress={() => onNavigate('createProject')}
          style={styles.addButton}
        >
          <FontAwesome5 name="plus" size={24} color="#FFFFFF"  />
        </TouchableOpacity>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <View style={styles.tabSwitcher}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'active' && styles.tabActive]}
            onPress={() => setActiveTab('active')}
          >
            <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>
              ACTIVE
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'completed' && styles.tabActive]}
            onPress={() => setActiveTab('completed')}
          >
            <Text style={[styles.tabText, activeTab === 'completed' && styles.tabTextActive]}>
              COMPLETED
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Projects List */}
      <ScrollView style={styles.content}>
        {filteredProjects.length > 0 ? (
          filteredProjects.map((project, i) => (
            <MotiView 
              key={project.id}
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: i * 100, type: 'timing', duration: 400 }}
            >
              <TouchableOpacity 
                style={styles.projectCard}
                onPress={() => project.hasQuotes ? onNavigate('quotesList') : onNavigate('jobDetail')}
                activeOpacity={0.7}
              >
                <View style={styles.projectHeader}>
                  <View style={styles.projectLeft}>
                    <View style={[styles.projectIcon, { backgroundColor: project.color }]}>
                      <Text style={styles.projectIconText}>{project.title[0]}</Text>
                    </View>
                    <View>
                      <Text style={styles.projectTitle}>{project.title}</Text>
                      <Text style={styles.projectContractor}>{project.contractor}</Text>
                    </View>
                  </View>
                  <TouchableOpacity>
                    <FontAwesome5 name="ellipsis-h" size={20} color="#D1D5DB"  />
                  </TouchableOpacity>
                </View>

                <View style={styles.progressSection}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>PROGRESS</Text>
                    <Text style={styles.progressValue}>{project.progress}%</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <MotiView 
                      from={{ width: 0 }}
                      animate={{ width: `${project.progress}%` }}
                      transition={{ duration: 1000, delay: 500 }}
                      style={[styles.progressFill, { backgroundColor: project.color }]}
                    />
                  </View>
                </View>

                <View style={styles.projectFooter}>
                  <Text style={styles.projectPhase}>{project.phase}</Text>
                  <Text style={styles.projectDate}>{project.date}</Text>
                </View>
              </TouchableOpacity>
            </MotiView>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No {activeTab} projects</Text>
            <TouchableOpacity onPress={() => onNavigate('createProject')}>
              <Text style={styles.emptyStateLink}>Create your first project</Text>
            </TouchableOpacity>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  addButton: {
    width: 40,
    height: 40,
    backgroundColor: '#1F2937',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    padding: 4,
    borderRadius: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
  },
  tabTextActive: {
    color: '#1F2937',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
  categoriesScroll: {
    marginHorizontal: -24,
    paddingHorizontal: 24,
  },
  categoryCard: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    alignItems: 'center',
    minWidth: 100,
    marginRight: 16,
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 8,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  contractorCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  contractorAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contractorInitials: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  contractorInfo: {
    flex: 1,
  },
  contractorName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  contractorRole: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  contractorMeta: {
    gap: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
  },
  reviewCount: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  priceText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  projectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  projectLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  projectIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  projectIconText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  projectTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  projectContractor: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
  },
  progressValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  projectFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  projectPhase: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  projectDate: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
  },
  emptyStateLink: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3B82F6',
  },
});
