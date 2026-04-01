import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet 
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Screen } from '../types';

interface BottomNavProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  userRole: 'homeowner' | 'contractor';
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentScreen, onNavigate, userRole }) => {
  const navItems = [
    { id: (userRole === 'contractor' ? 'contractorHome' : 'home') as Screen, icon: Home, label: 'Home' },
    { id: (userRole === 'contractor' ? 'jobFeed' : 'discover') as Screen, icon: Search, label: userRole === 'contractor' ? 'Job Feed' : 'Discover' },
    ...(userRole === 'contractor' ? [
      { id: 'activeJobs' as Screen, icon: Briefcase, label: 'Active' },
      { id: 'conversationsList' as Screen, icon: MessageSquare, label: 'Messages' },
      { id: 'quoteHistory' as Screen, icon: Bookmark, label: 'Quotes' },
      { id: 'profile' as Screen, icon: User, label: 'Profile' },
    ] : []),
    ...(userRole === 'homeowner' ? [
      { id: 'projects' as Screen, icon: Briefcase, label: 'Projects' },
      { id: 'conversationsList' as Screen, icon: MessageSquare, label: 'Messages' },
      { id: 'saved' as Screen, icon: Bookmark, label: 'Saved' },
      { id: 'homeownerProfile' as Screen, icon: User, label: 'Profile' },
    ] : []),
  ];

  return (
    <View style={styles.container}>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentScreen === item.id;
        return (
          <TouchableOpacity
            key={item.id}
            onPress={() => onNavigate(item.id)}
            style={styles.navItem}
            activeOpacity={0.7}
          >
            <Icon 
              size={24} 
              color={isActive ? '#1F2937' : '#9CA3AF'}
              strokeWidth={isActive ? 2.5 : 2}
            />
            <Text style={[
              styles.navLabel,
              isActive ? styles.navLabelActive : styles.navLabelInactive
            ]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  navItem: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  navLabelActive: {
    color: '#1F2937',
    fontWeight: '700',
  },
  navLabelInactive: {
    color: '#9CA3AF',
  },
});
