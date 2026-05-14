import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet,
  Animated 
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { Screen } from '../types';

interface VoiceInputScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const VoiceInputScreen: React.FC<VoiceInputScreenProps> = ({ onNavigate }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      setIsProcessing(true);
      setTimeout(() => {
        setTranscription("I'm looking to remodel my master bathroom. It's about 100 square feet. I want to replace the old tile with marble, add a double vanity with a quartz countertop, and install a walk-in shower with a glass enclosure. I'm hoping to start in about two months and my budget is around $15,000.");
        setIsProcessing(false);
      }, 2000);
    } else {
      setIsRecording(true);
      setTranscription('');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            onPress={() => onNavigate('createProject')}
            style={styles.backButton}
          >
            <FontAwesome5 name="chevron-left" size={24} color="#1F2937"  />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Voice Input</Text>
        </View>
        <View style={styles.micIcon}>
          <FontAwesome5 name="microphone" size={20} color="#3B82F6"  />
        </View>
      </View>

      <View style={styles.content}>
        {/* Recording Button */}
        <View style={styles.recordingSection}>
          {isRecording && (
            <>
              <MotiView 
                from={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 2.5, opacity: 0 }}
                transition={{ loop: true, duration: 2000, type: 'timing' }}
                style={[styles.pulseOuter, { backgroundColor: '#3B82F6' }]}
              />
              <MotiView 
                from={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 2, opacity: 0 }}
                transition={{ loop: true, duration: 2000, delay: 500, type: 'timing' }}
                style={[styles.pulseInner, { backgroundColor: '#60A5FA' }]}
              />
            </>
          )}
          
          <TouchableOpacity
            onPress={toggleRecording}
            style={[
              styles.recordButton,
              isRecording ? styles.recordButtonActive : styles.recordButtonInactive
            ]}
          >
            {isRecording ? <FontAwesome5 name="microphone-slash" size={40} color="#FFFFFF"  /> : <FontAwesome5 name="microphone" size={40} color="#FFFFFF"  />}
          </TouchableOpacity>
        </View>

        <View style={styles.statusSection}>
          <Text style={styles.statusTitle}>
            {isRecording ? 'Listening...' : transcription ? 'Transcription Ready' : 'Tap to Start'}
          </Text>
          <Text style={styles.statusSubtitle}>
            {isRecording 
              ? 'Speak clearly about your project goals, budget, and timeline.' 
              : transcription 
              ? 'Review the transcription below and confirm.' 
              : 'Speak naturally about your project vision.'}
          </Text>
        </View>

        {/* Transcription Area */}
        <View style={styles.transcriptionCard}>
          {isProcessing ? (
            <View style={styles.processingOverlay}>
              <MotiView 
                from={{ rotate: '0deg' }}
                animate={{ rotate: '360deg' }}
                transition={{ loop: true, duration: 1500, type: 'timing' }}
              >
                <FontAwesome5 name="sparkles" size={24} color="#3B82F6"  />
              </MotiView>
              <Text style={styles.processingText}>Processing speech...</Text>
            </View>
          ) : transcription ? (
            <ScrollView>
              <Text style={styles.transcriptionText}>{transcription}</Text>
            </ScrollView>
          ) : (
            <Text style={styles.placeholderText}>Your transcription will appear here</Text>
          )}
        </View>

        {/* Actions */}
        {transcription && !isProcessing && (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            style={styles.actions}
          >
            <TouchableOpacity 
              onPress={() => setTranscription('')}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>CLEAR</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => onNavigate('aiBuilder')}
              style={styles.confirmButton}
            >
              <FontAwesome5 name="sparkles" size={20} color="#FFFFFF"  />
              <Text style={styles.confirmButtonText}>Generate Project</Text>
            </TouchableOpacity>
          </MotiView>
        )}
      </View>
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
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  micIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    gap: 48,
  },
  recordingSection: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: 150,
  },
  pulseOuter: {
    position: 'absolute',
    width: 128,
    height: 128,
    borderRadius: 64,
  },
  pulseInner: {
    position: 'absolute',
    width: 128,
    height: 128,
    borderRadius: 64,
  },
  recordButton: {
    width: 128,
    height: 128,
    borderRadius: 64,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  recordButtonActive: {
    backgroundColor: '#EF4444',
  },
  recordButtonInactive: {
    backgroundColor: '#3B82F6',
  },
  statusSection: {
    alignItems: 'center',
    gap: 8,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    maxWidth: 280,
  },
  transcriptionCard: {
    minHeight: 240,
    backgroundColor: '#F9FAFB',
    borderRadius: 40,
    padding: 32,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    position: 'relative',
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    borderRadius: 40,
    zIndex: 10,
  },
  processingText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3B82F6',
  },
  transcriptionText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 24,
  },
  placeholderText: {
    fontSize: 14,
    color: '#D1D5DB',
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingVertical: 18,
    borderRadius: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 1.5,
  },
  confirmButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#1F2937',
    paddingVertical: 18,
    borderRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
