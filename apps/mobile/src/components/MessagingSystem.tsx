import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { Screen } from '../types';

interface ScreenProps {
  onNavigate: (screen: Screen) => void;
}

const conversations = [
  {
    id: '1',
    name: 'Sarah Jenkins',
    project: 'Kitchen Remodel',
    lastMessage: 'I sent the updated tile samples.',
    time: '10:24 AM',
    unread: 2,
    status: 'online',
  },
  {
    id: '2',
    name: 'Mike Rossi',
    project: 'Bathroom Tiling',
    lastMessage: 'Can we move the start date?',
    time: 'Yesterday',
    unread: 0,
    status: 'offline',
  },
];

const attachments = [
  { id: '1', name: 'Kitchen_Plan_V2.pdf', size: '2.4 MB', type: 'pdf', date: 'Mar 24' },
  { id: '2', name: 'Tile_Sample_1.jpg', size: '1.1 MB', type: 'image', date: 'Mar 24' },
];

const voiceNotes = [
  { id: '1', duration: '0:45', date: 'Today, 10:20 AM', sender: 'Sarah J.' },
  { id: '2', duration: '1:12', date: 'Yesterday, 4:15 PM', sender: 'Mike R.' },
];

const notifications = [
  { id: '1', title: 'New Message', body: 'Sarah sent a photo', time: '2m ago', read: false },
  { id: '2', title: 'Voice Message', body: 'Mike sent a voice note', time: '1h ago', read: true },
];

export const ChatListScreen: React.FC<ScreenProps> = ({ onNavigate }) => (
  <View style={styles.container}>
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text style={styles.pageTitle}>Messages</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => onNavigate('messagingNotifications')} style={styles.iconButton}>
            <FontAwesome5 name="bell" size={24} color="#1F2937"  />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onNavigate('blockReport')} style={styles.iconButton}>
            <FontAwesome5 name="shield-alt" size={24} color="#1F2937"  />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <FontAwesome5 name="search" size={18} color="#9CA3AF" style={styles.searchIcon}  />
          <TextInput
            placeholder="Search chats..."
            style={styles.searchInput}
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <FontAwesome5 name="filter" size={20} color="#9CA3AF"  />
        </TouchableOpacity>
      </View>
    </View>

    <ScrollView style={styles.content}>
      <View style={styles.conversationsList}>
        {conversations.map((chat, i) => (
          <MotiView
            key={chat.id}
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: i * 50 }}
          >
            <TouchableOpacity onPress={() => onNavigate('chat')} style={styles.conversationCard}>
              <View style={styles.avatarWrapper}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{chat.name[0]}</Text>
                </View>
                {chat.status === 'online' && <View style={styles.onlineIndicator} />}
              </View>

              <View style={styles.conversationContent}>
                <View style={styles.conversationHeader}>
                  <Text style={styles.conversationName}>{chat.name}</Text>
                  <Text style={styles.conversationTime}>{chat.time}</Text>
                </View>
                <Text style={styles.conversationProject}>{chat.project}</Text>
                <View style={styles.conversationFooter}>
                  <Text
                    style={[
                      styles.conversationMessage,
                      chat.unread > 0 && styles.conversationMessageUnread
                    ]}
                    numberOfLines={1}
                  >
                    {chat.lastMessage}
                  </Text>
                  {chat.unread > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadBadgeText}>{chat.unread}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          </MotiView>
        ))}
      </View>
    </ScrollView>
  </View>
);

export const ContractorChatScreen: React.FC<ScreenProps> = ({ onNavigate }) => {
  const [inputText, setInputText] = useState('');

  return (
    <View style={styles.container}>
      <View style={styles.chatHeader}>
        <View style={styles.chatHeaderLeft}>
          <TouchableOpacity onPress={() => onNavigate('conversationsList')} style={styles.backButton}>
            <FontAwesome5 name="arrow-left" size={24} color="#1F2937"  />
          </TouchableOpacity>
          <View style={styles.chatUserInfo}>
            <View style={styles.chatAvatar}>
              <Text style={styles.avatarText}>SJ</Text>
            </View>
            <View>
              <Text style={styles.chatUserName}>Sarah Jenkins</Text>
              <Text style={styles.chatProject}>Kitchen Remodel</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity onPress={() => onNavigate('blockReport')} style={styles.iconButton}>
          <FontAwesome5 name="ellipsis-v" size={24} color="#1F2937"  />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.chatContent}>
        <View style={styles.messageBubbleLeft}>
          <Text style={styles.messageText}>
            Hi Alex, I just uploaded the new floor plans. Can you take a look?
          </Text>
        </View>
        <View style={styles.messageBubbleRight}>
          <Text style={styles.messageTextRight}>
            Sure thing Sarah. I'll check them right now.
          </Text>
        </View>
        <View style={styles.messageBubbleLeft}>
          <View style={styles.attachmentCard}>
            <View style={styles.attachmentIcon}>
              <FontAwesome5 name="file-alt" size={20} color="#10B981"  />
            </View>
            <View style={styles.attachmentContent}>
              <Text style={styles.attachmentName} numberOfLines={1}>
                Floor_Plan_Final.pdf
              </Text>
              <Text style={styles.attachmentMeta}>2.4 MB • PDF</Text>
            </View>
            <TouchableOpacity style={styles.attachmentAction}>
              <FontAwesome5 name="download" size={16} color="#9CA3AF"  />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={styles.chatFooter}>
        <TouchableOpacity onPress={() => onNavigate('chatAttachments')} style={styles.attachButton}>
          <FontAwesome5 name="paperclip" size={20} color="#9CA3AF"  />
        </TouchableOpacity>
        <View style={styles.chatInputContainer}>
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            style={styles.chatInput}
          />
          <TouchableOpacity style={styles.sendButton}>
            <FontAwesome5 name="paper-plane" size={20} color="#D1D5DB"  />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => onNavigate('voiceMessages')} style={styles.micButton}>
          <FontAwesome5 name="microphone" size={20} color="#9CA3AF"  />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const ChatAttachmentsScreen: React.FC<ScreenProps> = ({ onNavigate }) => (
  <View style={styles.container}>
    <View style={styles.simpleHeader}>
      <TouchableOpacity onPress={() => onNavigate('chat')} style={styles.backButton}>
        <FontAwesome5 name="arrow-left" size={24} color="#1F2937"  />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Attachments</Text>
      <TouchableOpacity style={styles.iconButton}>
        <FontAwesome5 name="share-alt" size={24} color="#1F2937"  />
      </TouchableOpacity>
    </View>

    <ScrollView style={styles.content}>
      <View style={styles.formSection}>
        <Text style={styles.sectionHeader}>Recent Files</Text>
        <View style={styles.attachmentsList}>
          {attachments.map((file) => (
            <View key={file.id} style={styles.attachmentRow}>
              <View style={styles.attachmentIconBg}>
                <FontAwesome5 name="file-alt" size={24} color="#9CA3AF"  />
              </View>
              <View style={styles.attachmentDetails}>
                <Text style={styles.attachmentFileName} numberOfLines={1}>{file.name}</Text>
                <Text style={styles.attachmentFileMeta}>{file.size} • {file.date}</Text>
              </View>
              <TouchableOpacity style={styles.iconButton}>
                <FontAwesome5 name="download" size={20} color="#D1D5DB"  />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  </View>
);

export const VoiceMessagesScreen: React.FC<ScreenProps> = ({ onNavigate }) => {
  const [isPlaying, setIsPlaying] = useState<string | null>(null);

  return (
    <View style={styles.container}>
      <View style={styles.simpleHeader}>
        <TouchableOpacity onPress={() => onNavigate('chat')} style={styles.backButton}>
          <FontAwesome5 name="arrow-left" size={24} color="#1F2937"  />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Voice Messages</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.voicePrompt}>
          <View style={styles.voicePromptIcon}>
            <FontAwesome5 name="microphone" size={32} color="#FFFFFF"  />
          </View>
          <Text style={styles.voicePromptTitle}>Record Voice Note</Text>
          <Text style={styles.voicePromptSubtitle}>Tap and hold the mic to record</Text>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionHeader}>Saved Voice Notes</Text>
          <View style={styles.voiceNotesList}>
            {voiceNotes.map((note) => (
              <View key={note.id} style={styles.voiceNoteCard}>
                <View style={styles.voiceNoteHeader}>
                  <View style={styles.voiceNoteLeft}>
                    <TouchableOpacity
                      onPress={() => setIsPlaying(isPlaying === note.id ? null : note.id)}
                      style={styles.playButton}
                    >
                      {isPlaying === note.id ? (
                        <FontAwesome5 name="pause" size={20} color="#FFFFFF"  />
                      ) : (
                        <FontAwesome5 name="play" size={20} color="#FFFFFF"  />
                      )}
                    </TouchableOpacity>
                    <View>
                      <Text style={styles.voiceSender}>{note.sender}</Text>
                      <Text style={styles.voiceDate}>{note.date}</Text>
                    </View>
                  </View>
                  <Text style={styles.voiceDuration}>{note.duration}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export const MessagingNotificationsScreen: React.FC<ScreenProps> = ({ onNavigate }) => (
  <View style={styles.container}>
    <View style={styles.simpleHeader}>
      <TouchableOpacity onPress={() => onNavigate('conversationsList')} style={styles.backButton}>
        <FontAwesome5 name="arrow-left" size={24} color="#1F2937"  />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Notifications</Text>
      <TouchableOpacity>
        <Text style={styles.clearAllText}>Clear All</Text>
      </TouchableOpacity>
    </View>

    <ScrollView style={styles.content}>
      <View style={styles.notificationsList}>
        {notifications.map((notif) => (
          <View
            key={notif.id}
            style={[
              styles.notificationCard,
              !notif.read && styles.notificationCardUnread
            ]}
          >
            <View style={[
              styles.notificationIcon,
              !notif.read && styles.notificationIconUnread
            ]}>
              <FontAwesome5 name="bell" size={24} color={!notif.read ? '#FFFFFF' : '#9CA3AF'}  />
            </View>
            <View style={styles.notificationContent}>
              <View style={styles.notificationHeader}>
                <Text style={styles.notificationTitle}>{notif.title}</Text>
                <Text style={styles.notificationTime}>{notif.time}</Text>
              </View>
              <Text style={styles.notificationBody}>{notif.body}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  </View>
);

export const BlockReportScreen: React.FC<ScreenProps> = ({ onNavigate }) => (
  <View style={styles.container}>
    <View style={styles.simpleHeader}>
      <TouchableOpacity onPress={() => onNavigate('chat')} style={styles.backButton}>
        <FontAwesome5 name="arrow-left" size={24} color="#1F2937"  />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Safety & Privacy</Text>
    </View>

    <ScrollView style={styles.content}>
      <View style={styles.safetyPrompt}>
        <View style={styles.safetyIcon}>
          <FontAwesome5 name="shield-alt" size={48} color="#EF4444"  />
        </View>
        <Text style={styles.safetyTitle}>Manage User</Text>
        <Text style={styles.safetySubtitle}>
          Block or report behavior to our team
        </Text>
      </View>

      <View style={styles.actionsList}>
        <TouchableOpacity style={styles.actionCard}>
          <View style={styles.actionIconBg}>
            <FontAwesome5 name="ban" size={24} color="#EF4444"  />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Block Sarah Jenkins</Text>
            <Text style={styles.actionDesc}>They won't be able to message you</Text>
          </View>
          <FontAwesome5 name="chevron-right" size={20} color="#D1D5DB"  />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard}>
          <View style={styles.actionIconBg}>
            <FontAwesome5 name="flag" size={24} color="#9CA3AF"  />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Report User</Text>
            <Text style={styles.actionDesc}>Notify our safety team</Text>
          </View>
          <FontAwesome5 name="chevron-right" size={20} color="#D1D5DB"  />
        </TouchableOpacity>
      </View>
    </ScrollView>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1F2937',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 8,
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    backgroundColor: '#EF4444',
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  searchContainer: {
    flex: 1,
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    paddingVertical: 16,
    paddingLeft: 48,
    paddingRight: 16,
    fontSize: 14,
    fontWeight: '500',
  },
  filterButton: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  conversationsList: {
    gap: 8,
    marginTop: 8,
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: 32,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 24,
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 16,
    height: 16,
    backgroundColor: '#10B981',
    borderRadius: 8,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  conversationContent: {
    flex: 1,
    gap: 4,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '700',
  },
  conversationTime: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  conversationProject: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  conversationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  conversationMessage: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
  },
  conversationMessageUnread: {
    color: '#1F2937',
    fontWeight: '700',
  },
  unreadBadge: {
    width: 20,
    height: 20,
    backgroundColor: '#1F2937',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  chatHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backButton: {
    padding: 8,
  },
  chatUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  chatAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatUserName: {
    fontSize: 14,
    fontWeight: '700',
  },
  chatProject: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  chatContent: {
    flex: 1,
    padding: 24,
  },
  messageBubbleLeft: {
    alignSelf: 'flex-start',
    maxWidth: '80%',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 32,
    borderTopLeftRadius: 4,
    marginBottom: 24,
  },
  messageBubbleRight: {
    alignSelf: 'flex-end',
    maxWidth: '80%',
    backgroundColor: '#1F2937',
    padding: 16,
    borderRadius: 32,
    borderTopRightRadius: 4,
    marginBottom: 24,
  },
  messageText: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 22,
  },
  messageTextRight: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 22,
  },
  attachmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  attachmentIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentContent: {
    flex: 1,
  },
  attachmentName: {
    fontSize: 12,
    fontWeight: '700',
  },
  attachmentMeta: {
    fontSize: 8,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  attachmentAction: {
    padding: 8,
  },
  chatFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  attachButton: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
  },
  chatInputContainer: {
    flex: 1,
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    paddingVertical: 16,
    paddingLeft: 16,
    paddingRight: 48,
    fontSize: 14,
    fontWeight: '500',
  },
  sendButton: {
    position: 'absolute',
    right: 8,
    padding: 8,
  },
  micButton: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
  },
  simpleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  formSection: {
    marginTop: 32,
    gap: 16,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    paddingHorizontal: 8,
  },
  attachmentsList: {
    gap: 12,
  },
  attachmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  attachmentIconBg: {
    width: 48,
    height: 48,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentDetails: {
    flex: 1,
  },
  attachmentFileName: {
    fontSize: 14,
    fontWeight: '700',
  },
  attachmentFileMeta: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  voicePrompt: {
    backgroundColor: '#1F2937',
    padding: 40,
    borderRadius: 48,
    marginTop: 32,
    alignItems: 'center',
    gap: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  voicePromptIcon: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voicePromptTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  voicePromptSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
  voiceNotesList: {
    gap: 16,
  },
  voiceNoteCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  voiceNoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  voiceNoteLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playButton: {
    width: 48,
    height: 48,
    backgroundColor: '#1F2937',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  voiceSender: {
    fontSize: 14,
    fontWeight: '700',
  },
  voiceDate: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  voiceDuration: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Courier',
  },
  notificationsList: {
    marginTop: 32,
    gap: 16,
  },
  notificationCard: {
    flexDirection: 'row',
    gap: 16,
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  notificationCardUnread: {
    borderLeftWidth: 4,
    borderLeftColor: '#1F2937',
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationIconUnread: {
    backgroundColor: '#1F2937',
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  notificationTime: {
    fontSize: 8,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  notificationBody: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },
  clearAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  safetyPrompt: {
    alignItems: 'center',
    marginTop: 48,
    gap: 16,
  },
  safetyIcon: {
    width: 96,
    height: 96,
    backgroundColor: '#FEE2E2',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  safetyTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1F2937',
  },
  safetySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  actionsList: {
    marginTop: 48,
    gap: 16,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  actionIconBg: {
    width: 48,
    height: 48,
    backgroundColor: '#FEE2E2',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  actionDesc: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 4,
  },
});
