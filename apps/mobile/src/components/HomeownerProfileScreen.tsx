import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Screen } from '../types';

interface HomeownerProfileScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const HomeownerProfileScreen: React.FC<HomeownerProfileScreenProps> = ({ onNavigate }) => (
  <View style={styles.container}>
    <FontAwesome5 name="user" size={64} color="#3B82F6"  />
    <Text style={styles.title}>Homeowner Profile</Text>
    <Text style={styles.subtitle}>View and edit your profile information</Text>
    <View style={styles.actions}>
      <TouchableOpacity style={styles.button} onPress={() => onNavigate('profileManagement')}>
        <FontAwesome5 name="cog" size={20} color="#FFFFFF"  />
        <Text style={styles.buttonText}>Edit Profile</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondaryButton} onPress={() => onNavigate('homeownerHome')}>
        <Text style={styles.secondaryButtonText}>Back to Dashboard</Text>
      </TouchableOpacity>
    </View>
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
  actions: {
    gap: 12,
    marginTop: 16,
    width: '100%',
    maxWidth: 320,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 32,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryButton: {
    backgroundColor: '#F9FAFB',
    paddingVertical: 14,
    borderRadius: 32,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
});
