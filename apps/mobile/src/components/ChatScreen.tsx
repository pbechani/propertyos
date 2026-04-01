import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  Image, 
  ScrollView, 
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Modal
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { Screen } from '../types';
import { jobsApi, JobMessage } from '../lib/api';
import { AppStateContext } from '../App';
import { useAuth } from '../context/AuthContext';

interface ChatScreenProps {
  onNavigate: (screen: Screen) => void;
}

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'other' | 'system';
  time: string;
  status?: 'sent' | 'delivered' | 'read' | 'failed';
  type?: 'text' | 'image' | 'voice' | 'quote';
  attachment?: string;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ onNavigate }) => {
  const { selectedJobId } = React.useContext(AppStateContext);
  const { user } = useAuth();

  const mapApiMessage = (m: JobMessage): Message => ({
    id: m.id,
    text: m.content,
    sender: m.senderId === user?.id ? 'me' : 'other',
    time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: 'sent',
  });

  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: 'Hey Marco, I saw your quote for the kitchen remodel.', sender: 'me', time: '10:20 AM', status: 'read' },
    { id: '2', text: 'Quote Updated: Elite Plumbing Solutions has updated the materials list.', sender: 'system', time: '10:21 AM', type: 'quote' },
    { id: '3', text: 'Hi! Yes, I updated it with the premium fixtures we discussed.', sender: 'other', time: '10:22 AM' },
    { id: '4', text: 'That looks great. Can you send over some photos of the specific sink model?', sender: 'me', time: '10:23 AM', status: 'read' },
    { id: '5', text: '', sender: 'other', time: '10:24 AM', type: 'image', attachment: 'https://picsum.photos/seed/sink/400/300' },
    { id: '6', text: 'This is the one. It has a brushed nickel finish.', sender: 'other', time: '10:24 AM' },
  ]);

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!selectedJobId) return;
    jobsApi.getMessages(selectedJobId)
      .then(apiMessages => {
        if (apiMessages.length > 0) setMessages(apiMessages.map(mapApiMessage));
        if (selectedJobId) {
          jobsApi.markRead(selectedJobId, apiMessages.map(m => m.id)).catch(() => {});
        }
      })
      .catch(() => { /* keep mock messages on error */ });
  }, [selectedJobId]);

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    const optimisticMsg: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'me',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
    };
    setMessages(prev => [...prev, optimisticMsg]);
    const content = inputText;
    setInputText('');

    if (selectedJobId) {
      jobsApi.sendMessage(selectedJobId, content)
        .then(sent => {
          setMessages(prev => prev.map(m =>
            m.id === optimisticMsg.id ? mapApiMessage(sent) : m,
          ));
        })
        .catch(() => {
          setMessages(prev => prev.map(m =>
            m.id === optimisticMsg.id ? { ...m, status: 'failed' } : m,
          ));
        });
    }
  };

  const retryMessage = (id: string) => {
    const failed = messages.find(m => m.id === id);
    if (!failed) return;
    setMessages(prev => prev.map(m => m.id === id ? { ...m, status: 'sent' } : m));
    if (selectedJobId && failed.text) {
      jobsApi.sendMessage(selectedJobId, failed.text)
        .then(sent => setMessages(prev => prev.map(m => m.id === id ? mapApiMessage(sent) : m)))
        .catch(() => setMessages(prev => prev.map(m => m.id === id ? { ...m, status: 'failed' } : m)));
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            onPress={() => onNavigate('conversationsList')}
            style={styles.backButton}
          >
            <FontAwesome5 name="chevron-left" size={24} color="#1F2937"  />
          </TouchableOpacity>
          <View style={styles.userInfo}>
            <View style={styles.avatarContainer}>
              <Image 
                source={{ uri: 'https://picsum.photos/seed/marco/100/100' }}
                style={styles.avatar}
              />
              <View style={styles.onlineIndicator} />
            </View>
            <View>
              <Text style={styles.userName}>Marco Rossi</Text>
              <Text style={styles.userStatus}>ONLINE</Text>
            </View>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <FontAwesome5 name="phone" size={20} color="#9CA3AF"  />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <FontAwesome5 name="video" size={20} color="#9CA3AF"  />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setShowMenu(!showMenu)}
            style={styles.headerButton}
          >
            <FontAwesome5 name="ellipsis-v" size={20} color="#9CA3AF"  />
          </TouchableOpacity>
        </View>
      </View>

      {/* Menu Modal */}
      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.menuModal}>
            <TouchableOpacity 
              onPress={() => setShowMenu(false)}
              style={styles.menuItem}
            >
              <FontAwesome5 name="flag" size={16} color="#9CA3AF"  />
              <Text style={styles.menuText}>Report User</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setShowMenu(false)}
              style={styles.menuItem}
            >
              <FontAwesome5 name="ban" size={16} color="#EF4444"  />
              <Text style={[styles.menuText, { color: '#EF4444' }]}>Block User</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Messages Area */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={scrollToBottom}
      >
        {messages.map((msg, i) => (
          <MotiView
            key={msg.id}
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: i * 50, type: 'timing', duration: 300 }}
            style={[
              styles.messageWrapper,
              msg.sender === 'me' ? styles.messageWrapperMe : 
              msg.sender === 'system' ? styles.messageWrapperSystem : 
              styles.messageWrapperOther
            ]}
          >
            {msg.sender === 'system' ? (
              <View style={styles.systemMessage}>
                <FontAwesome5 name="exclamation-circle" size={12} color="#9CA3AF"  />
                <Text style={styles.systemMessageText}>{msg.text}</Text>
              </View>
            ) : (
              <View style={styles.messageContent}>
                <View style={[
                  styles.messageBubble,
                  msg.sender === 'me' ? styles.messageBubbleMe : styles.messageBubbleOther
                ]}>
                  {msg.type === 'image' && msg.attachment ? (
                    <Image 
                      source={{ uri: msg.attachment }}
                      style={styles.messageImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={[
                      styles.messageText,
                      msg.sender === 'me' ? styles.messageTextMe : styles.messageTextOther
                    ]}>
                      {msg.text}
                    </Text>
                  )}
                </View>
                <View style={[
                  styles.messageMetadata,
                  msg.sender === 'me' && styles.messageMetadataMe
                ]}>
                  <Text style={styles.messageTime}>{msg.time}</Text>
                  {msg.sender === 'me' && (
                    <View style={styles.statusIcon}>
                      {msg.status === 'failed' ? (
                        <TouchableOpacity onPress={() => retryMessage(msg.id)}>
                          <FontAwesome5 name="exclamation-circle" size={12} color="#EF4444"  />
                        </TouchableOpacity>
                      ) : msg.status === 'read' ? (
                        <FontAwesome5 name="check-check" size={12} color="#3B82F6"  />
                      ) : msg.status === 'delivered' ? (
                        <FontAwesome5 name="check-check" size={12} color="#9CA3AF"  />
                      ) : (
                        <FontAwesome5 name="check" size={12} color="#9CA3AF"  />
                      )}
                    </View>
                  )}
                </View>
              </View>
            )}
          </MotiView>
        ))}

        {isTyping && (
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            style={styles.typingIndicatorContainer}
          >
            <View style={styles.typingBubble}>
              <View style={styles.typingDots}>
                {[0, 1, 2].map((i) => (
                  <MotiView
                    key={i}
                    from={{ opacity: 0.3 }}
                    animate={{ opacity: 1 }}
                    transition={{ 
                      loop: true, 
                      duration: 600, 
                      delay: i * 200,
                      type: 'timing'
                    }}
                    style={styles.typingDot}
                  />
                ))}
              </View>
            </View>
          </MotiView>
        )}
      </ScrollView>

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.attachButton}>
          <FontAwesome5 name="paperclip" size={20} color="#9CA3AF"  />
        </TouchableOpacity>
        
        <TextInput
          style={styles.textInput}
          placeholder="Type a message..."
          placeholderTextColor="#9CA3AF"
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
        />

        {inputText.trim() ? (
          <TouchableOpacity 
            onPress={handleSendMessage}
            style={styles.sendButton}
          >
            <FontAwesome5 name="paper-plane" size={20} color="#FFFFFF"  />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.micButton}>
            <FontAwesome5 name="microphone" size={20} color="#9CA3AF"  />
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
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
    paddingBottom: 16,
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
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    backgroundColor: '#10B981',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  userStatus: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
    letterSpacing: 1.5,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 100,
    paddingRight: 24,
  },
  menuModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: 192,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  messagesContent: {
    padding: 24,
    gap: 24,
  },
  messageWrapper: {
    width: '100%',
  },
  messageWrapperMe: {
    alignItems: 'flex-end',
  },
  messageWrapperSystem: {
    alignItems: 'center',
  },
  messageWrapperOther: {
    alignItems: 'flex-start',
  },
  systemMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  systemMessageText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  messageContent: {
    maxWidth: '80%',
    gap: 4,
  },
  messageBubble: {
    padding: 16,
    borderRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  messageBubbleMe: {
    backgroundColor: '#1F2937',
    borderTopRightRadius: 4,
  },
  messageBubbleOther: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 22,
  },
  messageTextMe: {
    color: '#FFFFFF',
  },
  messageTextOther: {
    color: '#1F2937',
  },
  messageImage: {
    width: 240,
    height: 180,
    borderRadius: 16,
  },
  messageMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
  },
  messageMetadataMe: {
    justifyContent: 'flex-end',
  },
  messageTime: {
    fontSize: 8,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  statusIcon: {
    width: 12,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typingIndicatorContainer: {
    alignItems: 'flex-start',
  },
  typingBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    borderTopLeftRadius: 4,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  typingDots: {
    flexDirection: 'row',
    gap: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9CA3AF',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  attachButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1F2937',
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    backgroundColor: '#3B82F6',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micButton: {
    width: 40,
    height: 40,
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
