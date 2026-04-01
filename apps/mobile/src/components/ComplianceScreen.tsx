import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Screen } from '../types';

interface ComplianceScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const ComplianceScreen: React.FC<ComplianceScreenProps> = ({ onNavigate }) => (
  <View style={styles.container}>
    <FontAwesome5 name="file-alt" size={64} color="#3B82F6"  />
    <Text style={styles.title}>Compliance Center</Text>
    <Text style={styles.subtitle}>Regulatory requirements and certifications</Text>
    <TouchableOpacity style={styles.button} onPress={() => onNavigate('jobDetail')}>
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
    backgroundColor: '#3B82F6',
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
