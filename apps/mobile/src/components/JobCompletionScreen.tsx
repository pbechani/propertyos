import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { Screen } from '../types';

interface JobCompletionScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const JobCompletionScreen: React.FC<JobCompletionScreenProps> = ({ onNavigate }) => (
  <View style={styles.container}>
    <MotiView 
      from={{ scale: 0, rotate: -45 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      style={styles.icon}
    >
      <FontAwesome5 name="check-circle" size={64} color="#FFFFFF"  />
    </MotiView>
    <Text style={styles.title}>Job Completed!</Text>
    <Text style={styles.subtitle}>
      Mark this job as complete and release the final payment from escrow.
    </Text>
    <TouchableOpacity style={styles.button} onPress={() => onNavigate('leaveReview')}>
      <Text style={styles.buttonText}>Leave Review</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 24,
  },
  icon: {
    width: 120,
    height: 120,
    backgroundColor: '#10B981',
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 320,
  },
  button: {
    backgroundColor: '#1F2937',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 32,
    marginTop: 16,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
