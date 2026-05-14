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

interface ConversationsListScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const ConversationsListScreen: React.FC<ConversationsListScreenProps> = ({ onNavigate }) => {
  const conversations = [
    { 
      id: '1', 
      name: 'Jordan Smith', 
      message: 'I can start on the kitchen next week if...', 
      time: '2m ago', 
      unread: 2, 
      color: '#3B82F6', 
      online: true 
    },
    { 
      id: '2', 
      name: 'Elena Rodriguez', 
      message: 'The design mockups are ready for review', 
      time: '1h ago', 
      unread: 0, 
      color: '#A855F7', 
      online: false 
    },
    { 
      id: '3', 
      name: 'Marcus Chen', 
      message: 'Thanks for the feedback! I\'ll adjust...', 
      time: '3h ago', 
      unread: 0, 
      color: '#10B981', 
      online: true 
    },
    { 
      id: '4', 
      name: 'Sarah Miller', 
      message: 'Project completed! Please leave a review', 
      time: '1d ago', 
      unread: 1, 
      color: '#F59E0B', 
      online: false 
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <FontAwesome5 name="search" size={22} color="#1F2937"  />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <FontAwesome5 name="filter" size={22} color="#1F2937"  />
          </TouchableOpacity>
        </View>
      </View>

      {/* Conversations List */}
      <ScrollView style={styles.content}>
        {conversations.map((conversation) => (
          <TouchableOpacity
            key={conversation.id}
            style={styles.conversationItem}
            onPress={() => onNavigate('chat')}
            activeOpacity={0.7}
          >
            <View style={styles.avatarContainer}>
              <View style={[styles.avatar, { backgroundColor: conversation.color }]}>
                <Text style={styles.avatarText}>
                  {conversation.name.split(' ').map(n => n[0]).join('')}
                </Text>
              </View>
              {conversation.online && <View style={styles.onlineBadge} />}
            </View>

            <View style={styles.conversationContent}>
              <View style={styles.conversationHeader}>
                <Text style={styles.conversationName}>{conversation.name}</Text>
                <Text style={styles.conversationTime}>{conversation.time}</Text>
              </View>
              <View style={styles.conversationFooter}>
                <Text 
                  style={[
                    styles.conversationMessage,
                    conversation.unread > 0 && styles.conversationMessageUnread
                  ]}
                  numberOfLines={1}
                >
                  {conversation.message}
                </Text>
                {conversation.unread > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadBadgeText}>{conversation.unread}</Text>
                  </View>
                )}
              </View>
            </View>

            <TouchableOpacity style={styles.moreButton}>
              <FontAwesome5 name="ellipsis-v" size={20} color="#D1D5DB"  />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
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
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  content: {
    flex: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    backgroundColor: '#10B981',
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  conversationTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  conversationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  conversationMessage: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
  },
  conversationMessageUnread: {
    fontWeight: '600',
    color: '#1F2937',
  },
  unreadBadge: {
    backgroundColor: '#3B82F6',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  moreButton: {
    padding: 8,
  },
});
