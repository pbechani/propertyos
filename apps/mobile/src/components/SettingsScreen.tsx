import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet,
  Switch
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Screen } from '../types';

interface SettingsScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onNavigate }) => {
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = React.useState(false);

  const settingsSections = [
    {
      title: 'ACCOUNT',
      items: [
        { label: 'Profile Information', icon: User, screen: 'homeownerProfile' as Screen },
        { label: 'Security', icon: Lock, screen: 'securitySettings' as Screen },
      ],
    },
    {
      title: 'PREFERENCES',
      items: [
        { label: 'Notifications', icon: Bell, screen: 'notificationSettings' as Screen, toggle: true, value: notificationsEnabled, onChange: setNotificationsEnabled },
        { label: 'Language', icon: Globe, screen: 'languageSelection' as Screen },
        { label: 'Dark Mode', icon: Moon, toggle: true, value: darkModeEnabled, onChange: setDarkModeEnabled },
      ],
    },
    {
      title: 'SUPPORT',
      items: [
        { label: 'Help Center', icon: HelpCircle, screen: null },
        { label: 'Terms & Privacy', icon: FileText, screen: null },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.content}>
        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionItems}>
              {section.items.map((item, itemIndex) => {
                const IconComponent = item.icon;
                return (
                  <TouchableOpacity
                    key={itemIndex}
                    style={styles.settingItem}
                    onPress={() => item.screen && onNavigate(item.screen)}
                    disabled={!item.screen && !item.toggle}
                    activeOpacity={0.7}
                  >
                    <View style={styles.settingItemLeft}>
                      <View style={styles.settingIcon}>
                        <IconComponent size={20} color="#1F2937" />
                      </View>
                      <Text style={styles.settingLabel}>{item.label}</Text>
                    </View>
                    
                    {item.toggle ? (
                      <Switch
                        value={item.value}
                        onValueChange={item.onChange}
                        trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
                        thumbColor="#FFFFFF"
                      />
                    ) : (
                      <FontAwesome5 name="chevron-right" size={20} color="#D1D5DB"  />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        {/* Logout Button */}
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={() => onNavigate('logout')}
        >
          <FontAwesome5 name="sign-out-alt" size={20} color="#EF4444"  />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Version 1.0.0</Text>
          <Text style={styles.footerText}>© 2026 BuildTrust</Text>
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
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  sectionItems: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 24,
    marginTop: 32,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EF4444',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});
