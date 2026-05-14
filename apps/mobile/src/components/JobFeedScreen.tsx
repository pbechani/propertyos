import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { Screen } from '../types';
import { jobsApi, Job as ApiJob } from '../lib/api';
import { AppStateContext } from '../App';

interface JobFeedScreenProps {
  onNavigate: (screen: Screen) => void;
}

type FeedTab = 'available' | 'recommended' | 'saved';

interface Job {
  id: string;
  title: string;
  client: string;
  location: string;
  distance: string;
  budget: string;
  posted: string;
  isUrgent: boolean;
  isRecommended: boolean;
  isSaved: boolean;
  category: string;
  description: string;
  requirements: string[];
}

const MOCK_JOBS: Job[] = [
  {
    id: '1',
    title: 'Emergency Pipe Repair',
    client: 'Robert D.',
    location: 'Brooklyn, NY',
    distance: '1.2 miles',
    budget: '$350 - $500',
    posted: '10 mins ago',
    isUrgent: true,
    isRecommended: true,
    isSaved: false,
    category: 'Plumbing',
    description: 'Burst pipe in the basement. Needs immediate attention.',
    requirements: ['Master Plumber License', 'Emergency Response', 'Pipe Welding']
  },
  {
    id: '2',
    title: 'Custom Bookshelf Installation',
    client: 'Sarah M.',
    location: 'Manhattan, NY',
    distance: '3.5 miles',
    budget: '$1,200 - $1,800',
    posted: '2 hours ago',
    isUrgent: false,
    isRecommended: true,
    isSaved: true,
    category: 'Carpentry',
    description: 'Build floor-to-ceiling bookshelves in home office.',
    requirements: ['Fine Woodworking', 'Installation']
  },
];

function formatBudget(min?: number | null, max?: number | null, currency = 'USD'): string {
  const sym = currency === 'USD' ? '$' : currency;
  if (min != null && max != null) return `${sym}${min.toLocaleString()} - ${sym}${max.toLocaleString()}`;
  if (min != null) return `From ${sym}${min.toLocaleString()}`;
  if (max != null) return `Up to ${sym}${max.toLocaleString()}`;
  return 'Negotiable';
}

function formatPosted(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} min${mins !== 1 ? 's' : ''} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  return `${Math.floor(hours / 24)} day${Math.floor(hours / 24) !== 1 ? 's' : ''} ago`;
}

function mapApiJob(j: ApiJob): Job {
  return {
    id: j.id,
    title: j.title,
    client: 'Client',
    location: j.locationLabel ?? 'Location TBD',
    distance: '',
    budget: formatBudget(j.budgetMin, j.budgetMax, j.currency),
    posted: formatPosted(j.createdAt),
    isUrgent: j.isUrgent,
    isRecommended: false,
    isSaved: false,
    category: j.category.charAt(0).toUpperCase() + j.category.slice(1),
    description: j.description,
    requirements: [],
  };
}

export const JobFeedScreen: React.FC<JobFeedScreenProps> = ({ onNavigate }) => {
  const { setSelectedJobId } = useContext(AppStateContext);
  const [activeTab, setActiveTab] = useState<FeedTab>('available');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const [jobs, setJobs] = useState<Job[]>(MOCK_JOBS);
  const [loadingJobs, setLoadingJobs] = useState(false);

  useEffect(() => {
    setLoadingJobs(true);
    jobsApi.feed({})
      .then(apiJobs => setJobs(apiJobs.map(mapApiJob)))
      .catch(() => { /* keep MOCK_JOBS on error */ })
      .finally(() => setLoadingJobs(false));
  }, []);

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          job.category.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === 'recommended') return matchesSearch && job.isRecommended;
    if (activeTab === 'saved') return matchesSearch && savedJobIds.includes(job.id);
    return matchesSearch;
  });

  const toggleSave = (id: string) => {
    setSavedJobIds(prev =>
      prev.includes(id) ? prev.filter(jobId => jobId !== id) : [...prev, id]
    );
  };

  const renderJobCard = (job: Job) => (
    <MotiView
      key={job.id}
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
    >
      <TouchableOpacity
        onPress={() => setSelectedJob(job)}
        style={[
          styles.jobCard,
          job.isUrgent && styles.jobCardUrgent
        ]}
        activeOpacity={0.8}
      >
        {job.isUrgent && (
          <View style={styles.urgentBadge}>
            <FontAwesome5 name="bolt" size={12} color="#FFFFFF"  />
            <Text style={styles.urgentBadgeText}>Urgent</Text>
          </View>
        )}

        <View style={styles.jobHeader}>
          <View style={styles.jobTitleRow}>
            <Text style={styles.jobTitle}>{job.title}</Text>
            {job.isRecommended && <FontAwesome5 name="sparkles" size={16} color="#A855F7"  />}
          </View>
          <TouchableOpacity
            onPress={() => toggleSave(job.id)}
            style={[
              styles.saveButton,
              savedJobIds.includes(job.id) && styles.saveButtonActive
            ]}
          >
            <FontAwesome5 name="heart"
              size={18}
              color={savedJobIds.includes(job.id) ? '#FFFFFF' : '#9CA3AF'}
              fill={savedJobIds.includes(job.id) ? '#FFFFFF' : 'none'}
             />
          </TouchableOpacity>
        </View>
        <Text style={styles.jobCategory}>{job.category} • {job.client}</Text>

        <View style={styles.jobMeta}>
          <View style={styles.jobMetaItem}>
            <FontAwesome5 name="map-marker-alt" size={14} color="#6B7280"  />
            <Text style={styles.jobMetaText}>{job.location} ({job.distance})</Text>
          </View>
          <View style={styles.jobMetaItem}>
            <FontAwesome5 name="clock" size={14} color="#6B7280"  />
            <Text style={styles.jobMetaText}>{job.posted}</Text>
          </View>
        </View>

        <View style={styles.jobFooter}>
          <View>
            <Text style={styles.budgetLabel}>Budget Range</Text>
            <Text style={styles.budgetValue}>{job.budget}</Text>
          </View>
          <View style={styles.viewDetailsButton}>
            <Text style={styles.viewDetailsText}>View Details</Text>
          </View>
        </View>
      </TouchableOpacity>
    </MotiView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.pageTitle}>Job Feed</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => onNavigate('jobAlertSettings')} style={styles.settingsButton}>
              <FontAwesome5 name="cog" size={20} color="#9CA3AF"  />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
              style={styles.viewModeButton}
            >
              {viewMode === 'list' ? <MapIcon size={20} color="#FFFFFF" /> : <FontAwesome5 name="list" size={20} color="#FFFFFF"  />}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <FontAwesome5 name="search" size={18} color="#9CA3AF" style={styles.searchIcon}  />
            <TextInput
              placeholder="Search jobs..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
            />
          </View>
          <TouchableOpacity onPress={() => setShowFilters(true)} style={styles.filterButton}>
            <FontAwesome5 name="filter" size={20} color="#1F2937"  />
            <View style={styles.filterActiveDot} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabs}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.tabsInner}>
            {[
              { id: 'available', label: 'Available', icon: <FontAwesome5 name="briefcase" size={14} color={activeTab === 'available' ? '#FFFFFF' : '#9CA3AF'}  /> },
              { id: 'recommended', label: 'AI Recommended', icon: <FontAwesome5 name="sparkles" size={14} color={activeTab === 'recommended' ? '#FFFFFF' : '#9CA3AF'}  /> },
              { id: 'saved', label: 'Saved', icon: <FontAwesome5 name="heart" size={14} color={activeTab === 'saved' ? '#FFFFFF' : '#9CA3AF'}  /> },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id as FeedTab)}
                style={[
                  styles.tab,
                  activeTab === tab.id && styles.tabActive
                ]}
              >
                {tab.icon}
                <Text style={[
                  styles.tabText,
                  activeTab === tab.id && styles.tabTextActive
                ]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView style={styles.content}>
        {loadingJobs ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1F2937" />
          </View>
        ) : viewMode === 'list' ? (
          <View style={styles.jobsList}>
            {filteredJobs.length > 0 ? (
              filteredJobs.map(renderJobCard)
            ) : (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <FontAwesome5 name="search" size={32} color="#D1D5DB"  />
                </View>
                <Text style={styles.emptyTitle}>No jobs found</Text>
                <Text style={styles.emptySubtitle}>
                  Try adjusting your filters or search query
                </Text>
                <TouchableOpacity onPress={() => { setSearchQuery(''); setActiveTab('available'); }}>
                  <Text style={styles.clearFiltersText}>Clear all filters</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapPlaceholderText}>Map view coming soon</Text>
          </View>
        )}
      </ScrollView>

      <Modal visible={selectedJob !== null} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedJob(null)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setSelectedJob(null)} style={styles.modalCloseButton}>
                <FontAwesome5 name="times" size={24} color="#1F2937"  />
              </TouchableOpacity>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  onPress={() => selectedJob && toggleSave(selectedJob.id)}
                  style={[
                    styles.modalIconButton,
                    selectedJob && savedJobIds.includes(selectedJob.id) && styles.modalIconButtonActive
                  ]}
                >
                  <FontAwesome5 name="heart"
                    size={20}
                    color={selectedJob && savedJobIds.includes(selectedJob.id) ? '#FFFFFF' : '#9CA3AF'}
                    fill={selectedJob && savedJobIds.includes(selectedJob.id) ? '#FFFFFF' : 'none'}
                   />
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalIconButton}>
                  <FontAwesome5 name="exclamation-circle" size={20} color="#9CA3AF"  />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={styles.modalBody}>
              {selectedJob && (
                <>
                  {selectedJob.isUrgent && (
                    <View style={styles.urgentBadgeLarge}>
                      <FontAwesome5 name="bolt" size={12} color="#FFFFFF"  />
                      <Text style={styles.urgentBadgeLargeText}>Urgent Request</Text>
                    </View>
                  )}
                  <Text style={styles.modalJobTitle}>{selectedJob.title}</Text>
                  <View style={styles.modalMetaRow}>
                    <View style={styles.modalMetaItem}>
                      <FontAwesome5 name="map-marker-alt" size={16} color="#6B7280"  />
                      <Text style={styles.modalMetaText}>{selectedJob.location}</Text>
                    </View>
                    <View style={styles.modalMetaItem}>
                      <FontAwesome5 name="clock" size={16} color="#6B7280"  />
                      <Text style={styles.modalMetaText}>Posted {selectedJob.posted}</Text>
                    </View>
                  </View>

                  <View style={styles.modalInfoCards}>
                    <View style={styles.infoCard}>
                      <Text style={styles.infoCardLabel}>Budget</Text>
                      <Text style={styles.infoCardValue}>{selectedJob.budget}</Text>
                    </View>
                    <View style={styles.infoCard}>
                      <Text style={styles.infoCardLabel}>Category</Text>
                      <Text style={styles.infoCardValue}>{selectedJob.category}</Text>
                    </View>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Description</Text>
                    <Text style={styles.modalSectionContent}>{selectedJob.description}</Text>
                  </View>

                  {selectedJob.requirements.length > 0 && (
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>Requirements</Text>
                      <View style={styles.requirementsList}>
                        {selectedJob.requirements.map(req => (
                          <View key={req} style={styles.requirementBadge}>
                            <Text style={styles.requirementText}>{req}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  <View style={styles.modalFooter}>
                    <TouchableOpacity
                      onPress={() => setSelectedJob(null)}
                      style={styles.rejectButton}
                    >
                      <Text style={styles.rejectButtonText}>Reject Job</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedJobId(selectedJob?.id ?? null);
                        setSelectedJob(null);
                        onNavigate('createQuote');
                      }}
                      style={styles.acceptButton}
                    >
                      <Text style={styles.acceptButtonText}>Accept & Quote</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showFilters} transparent animationType="slide">
        <View style={styles.filtersOverlay}>
          <View style={styles.filtersPanel}>
            <View style={styles.filtersHeader}>
              <Text style={styles.filtersTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)} style={styles.filtersCloseButton}>
                <FontAwesome5 name="times" size={24} color="#1F2937"  />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filtersContent}>
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Distance</Text>
                <View style={styles.filterGrid}>
                  {['< 5 miles', '< 10 miles', '< 25 miles', 'Anywhere'].map(d => (
                    <TouchableOpacity
                      key={d}
                      style={[
                        styles.filterChip,
                        d === '< 10 miles' && styles.filterChipActive
                      ]}
                    >
                      <Text style={[
                        styles.filterChipText,
                        d === '< 10 miles' && styles.filterChipTextActive
                      ]}>
                        {d}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Categories</Text>
                <View style={styles.filterChipsWrap}>
                  {['Plumbing', 'Carpentry', 'Electrical', 'Painting', 'Tiling', 'HVAC'].map(c => (
                    <TouchableOpacity
                      key={c}
                      style={[
                        styles.filterChip,
                        c === 'Carpentry' && styles.filterChipActive
                      ]}
                    >
                      <Text style={[
                        styles.filterChipText,
                        c === 'Carpentry' && styles.filterChipTextActive
                      ]}>
                        {c}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.filtersFooter}>
              <TouchableOpacity onPress={() => setShowFilters(false)} style={styles.applyFiltersButton}>
                <Text style={styles.applyFiltersText}>Apply Filters</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.resetFiltersButton}>
                <Text style={styles.resetFiltersText}>Reset</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export const JobAlertSettingsScreen: React.FC<JobFeedScreenProps> = ({ onNavigate }) => {
  const [alerts, setAlerts] = useState({
    urgent: true,
    recommended: true,
    newInArea: true,
    budgetMatches: false
  });

  return (
    <View style={styles.container}>
      <View style={styles.simpleHeader}>
        <TouchableOpacity onPress={() => onNavigate('jobFeed')} style={styles.backButton}>
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job Alerts</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.alertPrompt}>
          <View style={styles.alertPromptIcon}>
            <FontAwesome5 name="bolt" size={24} color="#1F2937"  />
          </View>
          <Text style={styles.alertPromptTitle}>Never miss a lead</Text>
          <Text style={styles.alertPromptSubtitle}>
            Customize your alerts to get notified about the jobs that matter most.
          </Text>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionHeader}>Notification Types</Text>
          <View style={styles.alertsList}>
            {[
              { id: 'urgent', label: 'Urgent Jobs', sub: 'Immediate response required', key: 'urgent' as const },
              { id: 'recommended', label: 'AI Recommendations', sub: 'Jobs matching your skills', key: 'recommended' as const },
              { id: 'newInArea', label: 'New in Area', sub: 'Within 10 miles', key: 'newInArea' as const },
              { id: 'budget', label: 'High Budget Matches', sub: 'Projects over $5,000', key: 'budgetMatches' as const },
            ].map((item, idx) => (
              <View
                key={item.id}
                style={[
                  styles.alertItem,
                  idx !== 3 && styles.alertItemBorder
                ]}
              >
                <View>
                  <Text style={styles.alertLabel}>{item.label}</Text>
                  <Text style={styles.alertSub}>{item.sub}</Text>
                </View>
                <Switch
                  value={alerts[item.key]}
                  onValueChange={() => setAlerts(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                  trackColor={{ false: '#E5E7EB', true: '#1F2937' }}
                  thumbColor="#FFFFFF"
                />
              </View>
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
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  settingsButton: {
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
  },
  viewModeButton: {
    padding: 12,
    backgroundColor: '#1F2937',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    paddingVertical: 16,
    paddingLeft: 48,
    paddingRight: 16,
    fontSize: 14,
    fontWeight: '500',
  },
  filterButton: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    position: 'relative',
  },
  filterActiveDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    backgroundColor: '#1F2937',
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  tabs: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  tabsInner: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 9999,
  },
  tabActive: {
    backgroundColor: '#1F2937',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tabText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  jobsList: {
    paddingVertical: 16,
    gap: 16,
  },
  jobCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    position: 'relative',
    gap: 16,
  },
  jobCardUrgent: {
    borderColor: '#FEE2E2',
    backgroundColor: '#FFFBEB',
  },
  urgentBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderBottomLeftRadius: 16,
  },
  urgentBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  jobTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  saveButton: {
    padding: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  saveButtonActive: {
    backgroundColor: '#1F2937',
  },
  jobCategory: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  jobMeta: {
    gap: 16,
  },
  jobMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  jobMetaText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  budgetLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  budgetValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  viewDetailsButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#1F2937',
    borderRadius: 9999,
  },
  viewDetailsText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  emptyState: {
    paddingVertical: 80,
    alignItems: 'center',
    gap: 16,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    backgroundColor: '#F9FAFB',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    maxWidth: 200,
  },
  clearFiltersText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1F2937',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    textDecorationLine: 'underline',
    marginTop: 8,
  },
  mapPlaceholder: {
    height: 400,
    backgroundColor: '#F3F4F6',
    borderRadius: 48,
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPlaceholderText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 48,
    borderTopRightRadius: 48,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 8,
  },
  modalIconButton: {
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
  },
  modalIconButtonActive: {
    backgroundColor: '#1F2937',
  },
  modalBody: {
    padding: 32,
  },
  urgentBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 9999,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  urgentBadgeLargeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  modalJobTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  modalMetaRow: {
    gap: 16,
    marginBottom: 24,
  },
  modalMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalMetaText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  modalInfoCards: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 24,
    borderRadius: 24,
    gap: 4,
  },
  infoCardLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  infoCardValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalSection: {
    marginBottom: 32,
    gap: 16,
  },
  modalSectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  modalSectionContent: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
  },
  requirementsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  requirementBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  requirementText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 32,
  },
  rejectButton: {
    flex: 1,
    paddingVertical: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 9999,
    alignItems: 'center',
  },
  rejectButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  acceptButton: {
    flex: 2,
    paddingVertical: 20,
    backgroundColor: '#1F2937',
    borderRadius: 9999,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  acceptButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  filtersOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  filtersPanel: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 48,
    borderTopRightRadius: 48,
    maxHeight: '85%',
  },
  filtersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 40,
  },
  filtersTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  filtersCloseButton: {
    padding: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  filtersContent: {
    paddingHorizontal: 40,
  },
  filterSection: {
    marginBottom: 32,
    gap: 16,
  },
  filterSectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  filterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  filterChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  filterChipActive: {
    backgroundColor: '#1F2937',
    borderColor: '#1F2937',
  },
  filterChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  filtersFooter: {
    padding: 40,
    gap: 16,
  },
  applyFiltersButton: {
    paddingVertical: 20,
    backgroundColor: '#1F2937',
    borderRadius: 9999,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  applyFiltersText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  resetFiltersButton: {
    paddingVertical: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 9999,
    alignItems: 'center',
  },
  resetFiltersText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  simpleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  backButton: {
    padding: 8,
  },
  alertPrompt: {
    backgroundColor: '#F9FAFB',
    borderRadius: 32,
    padding: 32,
    marginTop: 32,
    alignItems: 'center',
    gap: 16,
  },
  alertPromptIcon: {
    width: 64,
    height: 64,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  alertPromptTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  alertPromptSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  formSection: {
    marginTop: 32,
    gap: 16,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    paddingHorizontal: 8,
  },
  alertsList: {
    backgroundColor: '#F9FAFB',
    borderRadius: 32,
    overflow: 'hidden',
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
  },
  alertItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  alertLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  alertSub: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 4,
  },
});
