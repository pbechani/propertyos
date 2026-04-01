import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Screen } from '../types';

interface ContractPreviewScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const ContractPreviewScreen: React.FC<ContractPreviewScreenProps> = ({ onNavigate }) => (
  <View style={styles.container}>
    <FontAwesome5 name="file-alt" size={64} color="#1F2937"  />
    <Text style={styles.title}>Contract Preview</Text>
    <Text style={styles.subtitle}>Review contract terms before signing</Text>
    <TouchableOpacity style={styles.button} onPress={() => onNavigate('contractSuccess')}>
      <Text style={styles.buttonText}>Sign Contract</Text>
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
    backgroundColor: '#1F2937',
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
