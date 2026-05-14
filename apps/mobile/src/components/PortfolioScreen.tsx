import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  StyleSheet,
  Dimensions 
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { Screen } from '../types';

interface PortfolioScreenProps {
  onNavigate: (screen: Screen) => void;
}

const { width } = Dimensions.get('window');
const cardWidth = (width - 72) / 2;

export const PortfolioScreen: React.FC<PortfolioScreenProps> = ({ onNavigate }) => {
  const projects = [
    { id: '1', title: 'Minimalist Kitchen', category: 'Renovation', year: '2025', image: 'https://picsum.photos/seed/k1/800/800' },
    { id: '2', title: 'Custom Oak Library', category: 'Carpentry', year: '2024', image: 'https://picsum.photos/seed/k2/800/800' },
    { id: '3', title: 'Modern Decking', category: 'Exterior', year: '2024', image: 'https://picsum.photos/seed/k3/800/800' },
    { id: '4', title: 'Loft Conversion', category: 'Full Build', year: '2023', image: 'https://picsum.photos/seed/k4/800/800' },
    { id: '5', title: 'Heritage Restoration', category: 'Restoration', year: '2023', image: 'https://picsum.photos/seed/k5/800/800' },
    { id: '6', title: 'Bespoke Wardrobes', category: 'Carpentry', year: '2022', image: 'https://picsum.photos/seed/k6/800/800' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => onNavigate('profile')}
          style={styles.backButton}
        >
          <FontAwesome5 name="chevron-left" size={24} color="#1F2937"  />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PROJECT PORTFOLIO</Text>
        <TouchableOpacity style={styles.shareButton}>
          <FontAwesome5 name="share-alt" size={20} color="#1F2937"  />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.profileSection}>
          <View>
            <Text style={styles.profileName}>Jordan Smith</Text>
            <Text style={styles.profileSubtitle}>6 PROJECTS PUBLISHED</Text>
          </View>
          <View style={styles.viewToggle}>
            <View style={styles.viewToggleActive}>
              <FontAwesome5 name="th" size={18} color="#1F2937"  />
            </View>
            <View style={styles.viewToggleInactive}>
              <FontAwesome5 name="list" size={18} color="#9CA3AF"  />
            </View>
          </View>
        </View>

        <View style={styles.grid}>
          {projects.map((project, i) => (
            <MotiView 
              key={project.id}
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 100, type: 'timing', duration: 400 }}
              style={[styles.projectCard, { width: cardWidth }]}
            >
              <TouchableOpacity activeOpacity={0.9}>
                <Image 
                  source={{ uri: project.image }}
                  style={styles.projectImage}
                />
                <View style={styles.projectOverlay}>
                  <Text style={styles.projectTitle}>{project.title}</Text>
                  <Text style={styles.projectMeta}>{project.category} • {project.year}</Text>
                </View>
                <TouchableOpacity style={styles.heartButton}>
                  <FontAwesome5 name="heart" size={14} color="#FFFFFF"  />
                </TouchableOpacity>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
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
    color: '#1F2937',
    letterSpacing: 1.5,
  },
  shareButton: {
    width: 40,
    height: 40,
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  profileSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  profileSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    padding: 4,
    borderRadius: 12,
    gap: 4,
  },
  viewToggleActive: {
    width: 32,
    height: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  viewToggleInactive: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    gap: 16,
  },
  projectCard: {
    marginBottom: 16,
    position: 'relative',
  },
  projectImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
  },
  projectOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  projectTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  projectMeta: {
    fontSize: 8,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  heartButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
