import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  StyleSheet 
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Screen } from '../types';

interface NotificationDetailScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const NotificationDetailScreen: React.FC<NotificationDetailScreenProps> = ({ onNavigate }) => {
  const notification = {
    id: '1',
    type: 'message',
    title: 'New Message',
    description: 'Marco Rossi sent you a message regarding the Kitchen Remodel.',
    time: '2 mins ago',
    isRead: false,
    iconComponent: MessageSquare,
    iconColor: '#3B82F6',
    bgColor: '#EFF6FF',
    content: "Hi, I've just uploaded the latest photos of the cabinet installation. Please take a look and let me know if everything looks good. We're on track to finish the plumbing rough-in by Friday.",
    user: {
      name: 'Marco Rossi',
      role: 'Lead Contractor',
      avatar: 'https://picsum.photos/seed/marco/100/100'
    }
  };

  const IconComponent = notification.iconComponent;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            onPress={() => onNavigate('notifications')}
            style={styles.backButton}
          >
            <FontAwesome5 name="chevron-left" size={24} color="#1F2937"  />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notification Detail</Text>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <FontAwesome5 name="ellipsis-v" size={24} color="#1F2937"  />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Icon and Title */}
        <View style={styles.titleSection}>
          <View style={[styles.iconContainer, { backgroundColor: notification.bgColor }]}>
            <IconComponent size={24} color={notification.iconColor} />
          </View>
          <View style={styles.titleContent}>
            <Text style={styles.notificationTitle}>{notification.title}</Text>
            <Text style={styles.notificationTime}>{notification.time}</Text>
          </View>
        </View>

        {/* Content Card */}
        <View style={styles.contentCard}>
          <Text style={styles.contentText}>"{notification.content}"</Text>

          <View style={styles.divider} />

          <View style={styles.userSection}>
            <View style={styles.userInfo}>
              <Image 
                source={{ uri: notification.user.avatar }}
                style={styles.userAvatar}
              />
              <View>
                <Text style={styles.userName}>{notification.user.name}</Text>
                <Text style={styles.userRole}>{notification.user.role}</Text>
              </View>
            </View>
            <TouchableOpacity 
              onPress={() => onNavigate('chat')}
              style={styles.chatButton}
            >
              <FontAwesome5 name="comment-alt" size={20} color="#1F2937"  />
            </TouchableOpacity>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionCard}>
            <View style={styles.actionIcon}>
              <FontAwesome5 name="share-alt" size={20} color="#9CA3AF"  />
            </View>
            <Text style={styles.actionLabel}>SHARE</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard}>
            <View style={styles.actionIcon}>
              <FontAwesome5 name="trash-alt" size={20} color="#EF4444"  />
            </View>
            <Text style={[styles.actionLabel, { color: '#EF4444' }]}>DELETE</Text>
          </TouchableOpacity>
        </View>

        {/* Primary Action */}
        <TouchableOpacity 
          onPress={() => onNavigate('jobDetail')}
          style={styles.primaryButton}
          activeOpacity={0.9}
        >
          <Text style={styles.primaryButtonText}>VIEW PROJECT DETAILS</Text>
          <FontAwesome5 name="arrow-right" size={20} color="#FFFFFF"  />
        </TouchableOpacity>
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
  moreButton: {
    padding: 8,
    borderRadius: 20,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 32,
    gap: 16,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 4,
  },
  titleContent: {
    alignItems: 'center',
    gap: 4,
  },
  notificationTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  notificationTime: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  contentCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 40,
    padding: 32,
    marginBottom: 32,
    gap: 24,
  },
  contentText: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 26,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  userRole: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  chatButton: {
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
  actionsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  actionCard: {
    flex: 1,
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F9FAFB',
    padding: 24,
    borderRadius: 32,
  },
  actionIcon: {
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
  actionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#1F2937',
    paddingVertical: 20,
    borderRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
});
