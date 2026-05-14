import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { Screen } from './types';

interface ProfileScreenProps {
  onNavigate: (screen: Screen) => void;
}

const SKILLS = ['Custom Cabinetry', 'Hardwood Floors', 'Staircases', 'Built-ins', 'Renovations'];

const PORTFOLIO_IMAGES = [
  'https://picsum.photos/seed/port1/400/280',
  'https://picsum.photos/seed/port2/400/280',
  'https://picsum.photos/seed/port3/400/280',
];

const SECTIONS: { title: string; subtitle: string; icon: string; screen: Screen | null }[] = [
  { title: 'Portfolio', subtitle: '6 Projects',  icon: 'th-large',     screen: 'portfolio'    },
  { title: 'Reviews',   subtitle: '4.9 · 124',   icon: 'star',         screen: 'reviews'      },
  { title: 'Pricing',   subtitle: 'View Rates',   icon: 'tag',          screen: null           },
  { title: 'Availability', subtitle: 'Book Me',   icon: 'calendar-alt', screen: 'availability' },
];

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onNavigate }) => {
  return (
    <View style={styles.container}>
      {/* Hero Image */}
      <View style={styles.headerImage}>
        <Image
          style={styles.coverImage}
          source={{ uri: 'https://picsum.photos/seed/jordan-work/1200/800' }}
          resizeMode="cover"
        />
        <View style={styles.imageOverlay} />

        <View style={styles.headerNav}>
          <TouchableOpacity onPress={() => onNavigate('discover')} style={styles.navButton}>
            <FontAwesome5 name="arrow-left" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.navRight}>
            <TouchableOpacity style={styles.navButton}>
              <FontAwesome5 name="share-alt" size={18} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.navButton}>
              <FontAwesome5 name="ellipsis-v" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            <Image
              style={styles.profileImage}
              source={{ uri: 'https://picsum.photos/seed/jordan/300/300' }}
            />
            <View style={styles.verifiedBadge}>
              <MaterialIcons name="verified" size={15} color="#FFFFFF" />
            </View>
          </View>

          <Text style={styles.profileName}>Jordan Smith</Text>
          <Text style={styles.profileRole}>MASTER CARPENTER & JOINER</Text>

          <View style={styles.ratingRow}>
            <FontAwesome5 name="star" size={13} color="#F59E0B" solid />
            <Text style={styles.ratingValue}>4.9</Text>
            <Text style={styles.ratingCount}>(124 reviews)</Text>
            <Text style={styles.locationDivider}>•</Text>
            <FontAwesome5 name="map-marker-alt" size={11} color="#9CA3AF" />
            <Text style={styles.locationText}>Brooklyn, NY</Text>
          </View>
        </View>

        {/* Stats — dark highlight card */}
        <View style={styles.statsCard}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>12+</Text>
            <Text style={styles.statLabel}>YEARS EXP.</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>240</Text>
            <Text style={styles.statLabel}>PROJECTS</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>100%</Text>
            <Text style={styles.statLabel}>VERIFIED</Text>
          </View>
        </View>

        {/* Skills chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.skillsRow}
          contentContainerStyle={styles.skillsContent}
        >
          {SKILLS.map((skill) => (
            <View key={skill} style={styles.skillChip}>
              <Text style={styles.skillChipText}>{skill}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Portfolio preview strip */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Work</Text>
          <TouchableOpacity onPress={() => onNavigate('portfolio')}>
            <Text style={styles.sectionLink}>View all 6 →</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.portfolioStrip}
          contentContainerStyle={styles.portfolioContent}
        >
          {PORTFOLIO_IMAGES.map((uri, i) => (
            <TouchableOpacity key={i} onPress={() => onNavigate('portfolio')} activeOpacity={0.85}>
              <Image source={{ uri }} style={styles.portfolioThumb} resizeMode="cover" />
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* 2×2 navigation grid */}
        <View style={styles.navigationGrid}>
          {SECTIONS.map((section, i) => (
            <TouchableOpacity
              key={i}
              style={styles.navCard}
              onPress={() => section.screen && onNavigate(section.screen)}
              activeOpacity={0.7}
              disabled={!section.screen}
            >
              <View style={styles.navCardIcon}>
                <FontAwesome5 name={section.icon} size={19} color="#1F2937" />
              </View>
              <Text style={styles.navCardTitle}>{section.title}</Text>
              <Text style={styles.navCardSubtitle}>{section.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Featured review */}
        <View style={styles.reviewCard}>
          <View style={styles.reviewHeader}>
            <Image
              source={{ uri: 'https://picsum.photos/seed/reviewer1/100/100' }}
              style={styles.reviewerAvatar}
            />
            <View style={styles.reviewerInfo}>
              <Text style={styles.reviewerName}>Sarah M.</Text>
              <View style={styles.reviewStars}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <FontAwesome5 key={s} name="star" size={10} color="#F59E0B" solid />
                ))}
              </View>
            </View>
            <Text style={styles.reviewDate}>2 weeks ago</Text>
          </View>
          <Text style={styles.reviewText}>
            "Jordan did an incredible job on our kitchen renovation. Detail-oriented, on time, and
            communicated throughout the whole project. Highly recommend!"
          </Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Sticky dual CTA bar */}
      <View style={styles.ctaBar}>
        <TouchableOpacity style={styles.ctaSecondary} onPress={() => onNavigate('chat')}>
          <FontAwesome5 name="comment" size={17} color="#1F2937" />
          <Text style={styles.ctaSecondaryText}>Message</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.ctaPrimary} onPress={() => onNavigate('chat')}>
          <Text style={styles.ctaPrimaryText}>Hire Jordan</Text>
          <FontAwesome5 name="arrow-right" size={14} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // ── Hero ──────────────────────────────────────────────────────────────────
  headerImage: {
    height: 256,
    backgroundColor: '#F3F4F6',
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 128,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  headerNav: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 52,
  },
  navButton: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navRight: {
    flexDirection: 'row',
    gap: 8,
  },

  // ── Scroll content ────────────────────────────────────────────────────────
  content: {
    flex: 1,
    marginTop: -48,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  },
  contentContainer: {
    paddingTop: 32,
    paddingHorizontal: 24,
  },

  // ── Profile header ────────────────────────────────────────────────────────
  profileSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 14,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#1F2937',
    padding: 5,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  profileName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  ratingCount: {
    fontSize: 13,
    color: '#6B7280',
  },
  locationDivider: {
    fontSize: 13,
    color: '#D1D5DB',
    marginHorizontal: 2,
  },
  locationText: {
    fontSize: 13,
    color: '#6B7280',
  },

  // ── Stats highlight card ──────────────────────────────────────────────────
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#1F2937',
    borderRadius: 24,
    paddingVertical: 20,
    marginBottom: 20,
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 8,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginVertical: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 1.5,
    marginTop: 3,
  },

  // ── Skills chips ──────────────────────────────────────────────────────────
  skillsRow: {
    marginBottom: 24,
    marginHorizontal: -24,
  },
  skillsContent: {
    paddingHorizontal: 24,
    gap: 8,
  },
  skillChip: {
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  skillChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },

  // ── Portfolio strip ───────────────────────────────────────────────────────
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  sectionLink: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  portfolioStrip: {
    marginBottom: 24,
    marginHorizontal: -24,
  },
  portfolioContent: {
    paddingHorizontal: 24,
    gap: 12,
  },
  portfolioThumb: {
    width: 160,
    height: 110,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },

  // ── 2×2 navigation grid ───────────────────────────────────────────────────
  navigationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  navCard: {
    width: '47.5%',
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    padding: 18,
    minHeight: 110,
    justifyContent: 'space-between',
  },
  navCardIcon: {
    width: 44,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 10,
  },
  navCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  navCardSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 2,
  },

  // ── Featured review ───────────────────────────────────────────────────────
  reviewCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  reviewerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
  },
  reviewerInfo: {
    flex: 1,
    gap: 3,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  reviewText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
    fontStyle: 'italic',
  },

  bottomSpacer: {
    height: 8,
  },

  // ── Sticky dual CTA ───────────────────────────────────────────────────────
  ctaBar: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 32,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 12,
  },
  ctaSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 28,
    paddingVertical: 16,
    paddingHorizontal: 22,
  },
  ctaSecondaryText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  ctaPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1F2937',
    borderRadius: 28,
    paddingVertical: 16,
  },
  ctaPrimaryText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
