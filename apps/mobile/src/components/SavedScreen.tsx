import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  StyleSheet 
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { Screen } from '../types';

interface SavedScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const SavedScreen: React.FC<SavedScreenProps> = ({ onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const savedContractors = [
    { id: '1', name: 'Jordan Smith', role: 'Master Carpenter', rating: 4.9, reviews: 124, location: 'Brooklyn, NY', price: '$$$', color: '#3B82F6' },
    { id: '2', name: 'Elena Rodriguez', role: 'Interior Architect', rating: 5.0, reviews: 89, location: 'Manhattan, NY', price: '$$$$', color: '#A855F7' },
    { id: '3', name: 'Marcus Chen', role: 'Smart Home Specialist', rating: 4.8, reviews: 210, location: 'Queens, NY', price: '$$', color: '#10B981' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Saved</Text>
          <TouchableOpacity style={styles.filterButton}>
            <FontAwesome5 name="filter" size={20} color="#1F2937"  />
          </TouchableOpacity>
        </View>
        
        <View style={styles.searchContainer}>
          <FontAwesome5 name="search" size={18} color="#9CA3AF" style={styles.searchIcon}  />
          <TextInput
            placeholder="Search your saved experts..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
        </View>
      </View>

      <ScrollView style={styles.content}>
        {savedContractors.length > 0 ? (
          savedContractors.map((contractor, i) => {
            const initials = contractor.name.split(' ').map(n => n[0]).join('');
            return (
              <MotiView 
                key={contractor.id}
                from={{ opacity: 0, translateX: -20 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ delay: i * 100, type: 'timing', duration: 300 }}
              >
                <TouchableOpacity 
                  onPress={() => onNavigate('profile')}
                  style={styles.contractorCard}
                  activeOpacity={0.8}
                >
                  <View style={[styles.contractorAvatar, { backgroundColor: contractor.color }]}>
                    <Text style={styles.contractorInitials}>{initials}</Text>
                  </View>
                  <View style={styles.contractorInfo}>
                    <View style={styles.contractorHeader}>
                      <View style={styles.contractorHeaderLeft}>
                        <Text style={styles.contractorName}>{contractor.name}</Text>
                        <Text style={styles.contractorRole}>{contractor.role}</Text>
                      </View>
                      <TouchableOpacity>
                        <FontAwesome5 name="bookmark" size={20} color="#1F2937" fill="#1F2937"  />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.contractorMeta}>
                      <View style={styles.ratingRow}>
                        <FontAwesome5 name="star" size={12} color="#1F2937" fill="#1F2937"  />
                        <Text style={styles.ratingText}>{contractor.rating}</Text>
                      </View>
                      <View style={styles.locationRow}>
                        <FontAwesome5 name="map-marker-alt" size={12} color="#9CA3AF"  />
                        <Text style={styles.locationText}>{contractor.location}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              </MotiView>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <FontAwesome5 name="bookmark" size={40} color="#D1D5DB"  />
            </View>
            <View style={styles.emptyContent}>
              <Text style={styles.emptyTitle}>No saved experts</Text>
              <Text style={styles.emptySubtitle}>Save experts to easily find them later.</Text>
            </View>
            <TouchableOpacity style={styles.exploreButton}>
              <Text style={styles.exploreButtonText}>EXPLORE EXPERTS</Text>
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
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  filterButton: {
    width: 40,
    height: 40,
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  contractorCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 48,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    gap: 16,
    marginBottom: 24,
  },
  contractorAvatar: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contractorInitials: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  contractorInfo: {
    flex: 1,
    gap: 8,
  },
  contractorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  contractorHeaderLeft: {
    flex: 1,
  },
  contractorName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  contractorRole: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  contractorMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    gap: 16,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    backgroundColor: '#F9FAFB',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContent: {
    alignItems: 'center',
    gap: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  exploreButton: {
    backgroundColor: '#1F2937',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 32,
    marginTop: 16,
  },
  exploreButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
});
