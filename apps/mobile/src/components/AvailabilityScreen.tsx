import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Screen } from '../types';

interface AvailabilityScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const AvailabilityScreen: React.FC<AvailabilityScreenProps> = ({ onNavigate }) => (
  <View style={styles.container}>
    <FontAwesome5 name="calendar" size={64} color="#10B981"  />
    <Text style={styles.title}>Availability Calendar</Text>
    <Text style={styles.subtitle}>Manage your work schedule and availability</Text>
    <TouchableOpacity style={styles.button} onPress={() => onNavigate('contractorHome')}>
      <Text style={styles.buttonText}>Back</Text>
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
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    marginTop: 16,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
