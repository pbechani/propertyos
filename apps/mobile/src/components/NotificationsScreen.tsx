import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet,
  Platform 
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { Screen } from '../types';

interface NotificationsScreenProps {
  onNavigate: (screen: Screen) => void;
  userRole: 'homeowner' | 'contractor';
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ onNavigate, userRole }) => {
  const notifications = [
    {
      id: '1',
      type: 'message',
      title: 'New Message',
      description: 'Marco Rossi sent you a message regarding the Kitchen Remodel.',
      time: '2 mins ago',
      isRead: false,
      iconComponent: MessageSquare,
      iconColor: '#3B82F6',
      bgColor: '#EFF6FF'
    },
    {
      id: '2',
      type: 'milestone',
      title: 'Milestone Completed',
      description: 'Plumbing Rough-in has been marked as completed by Luca S.',
      time: '1 hour ago',
      isRead: false,
      iconComponent: CheckCircle2,
      iconColor: '#10B981',
      bgColor: '#D1FAE5'
    },
    {
      id: '3',
      type: 'alert',
      title: 'Payment Due',
      description: 'The next milestone payment for "Bathroom Tile" is due in 2 days.',
      time: '3 hours ago',
      isRead: true,
      iconComponent: AlertCircle,
      iconColor: '#F59E0B',
      bgColor: '#FEF3C7'
    },
    {
      id: '4',
      type: 'schedule',
      title: 'Schedule Update',
      description: 'Sofia V. updated the timeline for "Interior Design Phase".',
      time: 'Yesterday',
      isRead: true,
      iconComponent: Calendar,
      iconColor: '#A855F7',
      bgColor: '#F3E8FF'
    }
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            onPress={() => onNavigate(userRole === 'contractor' ? 'contractorHome' : 'home')}
            style={styles.backButton}
          >
            <FontAwesome5 name="chevron-left" size={24} color="#1F2937"  />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
        <TouchableOpacity 
          onPress={() => onNavigate('pushPreferences')}
          style={styles.settingsButton}
        >
          <FontAwesome5 name="cog" size={20} color="#9CA3AF"  />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>RECENT</Text>
            <TouchableOpacity>
              <Text style={styles.markReadText}>MARK ALL AS READ</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.notificationsList}>
            {notifications.map((notif, i) => {
              const IconComponent = notif.iconComponent;
              return (
                <MotiView
                  key={notif.id}
                  from={{ opacity: 0, translateY: 10 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ delay: i * 80, type: 'timing', duration: 300 }}
                >
                  <TouchableOpacity 
                    onPress={() => onNavigate('notificationDetail')}
                    style={[
                      styles.notificationCard,
                      !notif.isRead && styles.notificationCardUnread
                    ]}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.notificationIcon, { backgroundColor: notif.bgColor }]}>
                      <IconComponent size={18} color={notif.iconColor} />
                    </View>
                    <View style={styles.notificationContent}>
                      <View style={styles.notificationHeader}>
                        <Text style={[
                          styles.notificationTitle,
                          notif.isRead && styles.notificationTitleRead
                        ]}>
                          {notif.title}
                        </Text>
                        <Text style={styles.notificationTime}>{notif.time}</Text>
                      </View>
                      <Text style={[
                        styles.notificationDescription,
                        notif.isRead && styles.notificationDescriptionRead
                      ]}>
                        {notif.description}
                      </Text>
                    </View>
                    {!notif.isRead && <View style={styles.unreadDot} />}
                  </TouchableOpacity>
                </MotiView>
              );
            })}
          </View>
        </View>

        <View style={styles.earlierSection}>
          <Text style={styles.sectionLabel}>EARLIER</Text>
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <FontAwesome5 name="bell" size={24} color="#E5E7EB"  />
            </View>
            <Text style={styles.emptyText}>No older notifications</Text>
          </View>
        </View>

        {/* Settings Shortcut */}
        <View style={styles.settingsShortcut}>
          <TouchableOpacity 
            onPress={() => onNavigate('settings')}
            style={styles.settingsCard}
            activeOpacity={0.8}
          >
            <View style={styles.settingsCardLeft}>
              <View style={styles.settingsIconContainer}>
                <FontAwesome5 name="cog" size={20} color="#1F2937"  />
              </View>
              <View>
                <Text style={styles.settingsCardTitle}>App Settings</Text>
                <Text style={styles.settingsCardSubtitle}>PREFERENCES & SECURITY</Text>
              </View>
            </View>
            <FontAwesome5 name="arrow-right" size={20} color="#D1D5DB"  />
          </TouchableOpacity>
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
  settingsButton: {
    padding: 8,
    borderRadius: 20,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
  },
  markReadText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#3B82F6',
    letterSpacing: 1.5,
  },
  notificationsList: {
    gap: 12,
  },
  notificationCard: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 48,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    gap: 16,
    alignItems: 'flex-start',
  },
  notificationCardUnread: {
    backgroundColor: '#F9FAFB',
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationContent: {
    flex: 1,
    gap: 4,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  notificationTitleRead: {
    color: '#6B7280',
  },
  notificationTime: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  notificationDescription: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 20,
  },
  notificationDescriptionRead: {
    color: '#9CA3AF',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
    marginTop: 8,
  },
  earlierSection: {
    padding: 24,
    paddingTop: 32,
  },
  emptyState: {
    backgroundColor: '#F9FAFB',
    borderRadius: 40,
    padding: 32,
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  emptyIcon: {
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
  emptyText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  settingsShortcut: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 128,
  },
  settingsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    padding: 24,
    borderRadius: 40,
  },
  settingsCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  settingsIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  settingsCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  settingsCardSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
  },
});
