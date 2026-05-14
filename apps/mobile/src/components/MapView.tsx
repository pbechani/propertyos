import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  StyleSheet 
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { Screen } from '../types';

interface MapViewProps {
  onNavigate: (screen: Screen) => void;
}

export const MapView: React.FC<MapViewProps> = ({ onNavigate }) => {
  return (
    <View style={styles.container}>
      <View style={styles.placeholderContent}>
        <FontAwesome5 name="map-marker-alt" size={64} color="#3B82F6"  />
        <Text style={styles.placeholderTitle}>Map View</Text>
        <Text style={styles.placeholderSubtitle}>Interactive contractor map coming soon</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => onNavigate('discover')}
        >
          <Text style={styles.backButtonText}>Back to Discover</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  placeholderContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    gap: 16,
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  placeholderSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    marginTop: 16,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
