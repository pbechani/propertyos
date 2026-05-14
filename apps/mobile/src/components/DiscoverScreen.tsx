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

interface DiscoverScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const DiscoverScreen: React.FC<DiscoverScreenProps> = ({ onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { name: 'Carpentry', icon: '🪚', count: 124 },
    { name: 'Plumbing', icon: '🚰', count: 89 },
    { name: 'Electrical', icon: '⚡', count: 56 },
    { name: 'Painting', icon: '🎨', count: 210 },
    { name: 'Masonry', icon: '🧱', count: 45 },
    { name: 'Landscaping', icon: '🌿', count: 132 },
  ];

  const contractors = [
    { id: '1', name: 'Jordan Smith', role: 'Master Carpenter', rating: 4.9, reviews: 124, location: 'Brooklyn, NY', price: '$$$', color: '#3B82F6' },
    { id: '2', name: 'Elena Rodriguez', role: 'Interior Architect', rating: 5.0, reviews: 89, location: 'Manhattan, NY', price: '$$$$', color: '#A855F7' },
    { id: '3', name: 'Marcus Chen', role: 'Smart Home Specialist', rating: 4.8, reviews: 210, location: 'Queens, NY', price: '$$', color: '#10B981' },
    { id: '4', name: 'Sarah Miller', role: 'Custom Cabinetry', rating: 4.7, reviews: 156, location: 'Brooklyn, NY', price: '$$$', color: '#F59E0B' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover</Text>
        <TouchableOpacity 
          onPress={() => onNavigate('map')}
          style={styles.viewToggleButton}
        >
          <Text style={styles.viewToggleText}>Map View</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <FontAwesome5 name="search" size={18} color="#9CA3AF" style={styles.searchIcon}  />
          <TextInput
            style={styles.searchInput}
            placeholder="Search experts, skills, or projects..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <FontAwesome5 name="sliders-h" size={20} color="#1F2937"  />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>CATEGORIES</Text>
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>View All</Text>
              <FontAwesome5 name="chevron-right" size={14} color="#1F2937"  />
            </TouchableOpacity>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
            {categories.map((cat, i) => (
              <MotiView 
                key={i}
                from={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 50, type: 'timing', duration: 300 }}
              >
                <TouchableOpacity style={styles.categoryCard}>
                  <Text style={styles.categoryIcon}>{cat.icon}</Text>
                  <Text style={styles.categoryName}>{cat.name}</Text>
                  <Text style={styles.categoryCount}>{cat.count} Experts</Text>
                </TouchableOpacity>
              </MotiView>
            ))}
          </ScrollView>
        </View>

        {/* Featured Contractors */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>FEATURED EXPERTS</Text>
          </View>

          {contractors.map((contractor, i) => (
            <MotiView 
              key={contractor.id}
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: i * 100, type: 'timing', duration: 400 }}
            >
              <TouchableOpacity 
                style={styles.contractorCard}
                onPress={() => onNavigate('profile')}
                activeOpacity={0.7}
              >
                <View style={[styles.contractorAvatar, { backgroundColor: contractor.color }]}>
                  <Text style={styles.contractorInitials}>
                    {contractor.name.split(' ').map(n => n[0]).join('')}
                  </Text>
                </View>
                
                <View style={styles.contractorInfo}>
                  <Text style={styles.contractorName}>{contractor.name}</Text>
                  <Text style={styles.contractorRole}>{contractor.role}</Text>
                  
                  <View style={styles.contractorMeta}>
                    <View style={styles.ratingContainer}>
                      <FontAwesome5 name="star" size={12} color="#1F2937" fill="#1F2937"  />
                      <Text style={styles.ratingText}>{contractor.rating}</Text>
                      <Text style={styles.reviewCount}>({contractor.reviews})</Text>
                    </View>
                    <View style={styles.locationContainer}>
                      <FontAwesome5 name="map-marker-alt" size={12} color="#9CA3AF"  />
                      <Text style={styles.locationText}>{contractor.location}</Text>
                    </View>
                  </View>
                  
                  <Text style={styles.priceText}>Starting from {contractor.price}</Text>
                </View>

                <FontAwesome5 name="chevron-right" size={20} color="#D1D5DB"  />
              </TouchableOpacity>
            </MotiView>
          ))}
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
  viewToggleButton: {
    backgroundColor: '#1F2937',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  viewToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    paddingHorizontal: 16,
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
    paddingVertical: 12,
  },
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  section: {
    marginBottom: 32,
    marginTop: 16,
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
    shadowOffset: { width: 0, height: 1 },
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
    gap: 8,
    marginBottom: 4,
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
    marginTop: 4,
  },
});
