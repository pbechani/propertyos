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
import { Screen } from '../types';

interface PushPreferencesScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const PushPreferencesScreen: React.FC<PushPreferencesScreenProps> = ({ onNavigate }) => {
  const [preferences, setPreferences] = useState({
    messages: true,
    milestones: true,
    payments: true,
    schedule: false,
    marketing: false,
    email: true,
    sms: false
  });

  const togglePreference = (key: keyof typeof preferences) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const sections = [
    {
      title: 'Activity Notifications',
      items: [
        { id: 'messages', iconComponent: MessageSquare, label: 'New Messages', sub: 'Direct messages from contractors', key: 'messages' as const },
        { id: 'milestones', iconComponent: CheckCircle2, label: 'Milestone Updates', sub: 'Status changes & approvals', key: 'milestones' as const },
        { id: 'payments', iconComponent: AlertCircle, label: 'Payment Alerts', sub: 'Due dates & confirmations', key: 'payments' as const },
        { id: 'schedule', iconComponent: Calendar, label: 'Schedule Changes', sub: 'Timeline updates & delays', key: 'schedule' as const }
      ]
    },
    {
      title: 'Communication Channels',
      items: [
        { id: 'push', iconComponent: Smartphone, label: 'Push Notifications', sub: 'Real-time mobile alerts', key: 'messages' as const },
        { id: 'email', iconComponent: Mail, label: 'Email Notifications', sub: 'Daily summaries & reports', key: 'email' as const },
        { id: 'sms', iconComponent: MessageCircle, label: 'SMS Alerts', sub: 'Critical updates via text', key: 'sms' as const }
      ]
    }
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            onPress={() => onNavigate('settings')}
            style={styles.backButton}
          >
            <FontAwesome5 name="chevron-left" size={24} color="#1F2937"  />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notification Settings</Text>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <FontAwesome5 name="ellipsis-v" size={24} color="#1F2937"  />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <FontAwesome5 name="bell" size={24} color="#1F2937"  />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Stay Updated</Text>
            <Text style={styles.infoSubtitle}>
              Choose how and when you want to be notified about your project progress.
            </Text>
          </View>
        </View>

        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.preferencesContainer}>
              {section.items.map((item, idx) => {
                const IconComponent = item.iconComponent;
                return (
                  <View
                    key={item.id}
                    style={[
                      styles.preferenceItem,
                      idx !== section.items.length - 1 && styles.preferenceItemBorder
                    ]}
                  >
                    <View style={styles.preferenceLeft}>
                      <View style={styles.preferenceIcon}>
                        <IconComponent size={18} color="#1F2937" />
                      </View>
                      <View>
                        <Text style={styles.preferenceLabel}>{item.label}</Text>
                        <Text style={styles.preferenceSub}>{item.sub}</Text>
                      </View>
                    </View>
                    
                    <Switch
                      value={preferences[item.key]}
                      onValueChange={() => togglePreference(item.key)}
                      trackColor={{ false: '#E5E7EB', true: '#1F2937' }}
                      thumbColor="#FFFFFF"
                      ios_backgroundColor="#E5E7EB"
                    />
                  </View>
                );
              })}
            </View>
          </View>
        ))}

        {/* Marketing */}
        <View style={styles.marketingCard}>
          <View>
            <Text style={styles.marketingTitle}>Marketing & Tips</Text>
            <Text style={styles.marketingSub}>OFFERS, NEWS & HELPFUL GUIDES</Text>
          </View>
          <Switch
            value={preferences.marketing}
            onValueChange={() => togglePreference('marketing')}
            trackColor={{ false: '#E5E7EB', true: '#1F2937' }}
            thumbColor="#FFFFFF"
            ios_backgroundColor="#E5E7EB"
          />
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
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  moreButton: {
    padding: 8,
    borderRadius: 20,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  infoCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 40,
    padding: 32,
    alignItems: 'center',
    marginBottom: 32,
    gap: 16,
  },
  infoIcon: {
    width: 64,
    height: 64,
    backgroundColor: '#FFFFFF',
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  infoContent: {
    alignItems: 'center',
    gap: 4,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  infoSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    marginBottom: 32,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
    paddingHorizontal: 8,
    textTransform: 'uppercase',
  },
  preferencesContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 40,
    overflow: 'hidden',
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
  },
  preferenceItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  preferenceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  preferenceIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  preferenceLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  preferenceSub: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  marketingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    padding: 24,
    borderRadius: 40,
    marginBottom: 32,
  },
  marketingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  marketingSub: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
  },
});
