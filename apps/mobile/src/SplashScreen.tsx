import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Dimensions } from 'react-native';
import { MotiView } from 'moti';
import { FontAwesome5 } from '@expo/vector-icons';
import { Screen } from './types';

const { width } = Dimensions.get('window');

interface SplashScreenProps {
  onNext: (screen: Screen) => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onNext }) => {
  return (
    <View style={styles.container}>
      {/* Background Image */}
      <Image 
        style={styles.backgroundImage}
        source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA85tfcuyYeadZuYqoeJNeeOLNJ6kIe_vR5LOmcls_oHbwWHsNeMwoLoOrVYFeeDggOP6uP0wdIyf-DpOyJM2r7scC6XRgzHUtruawUlGP6mmwm_hg1AZ95oX8TyTS2F7aKmRxWKtgnzxke1H03UW29nw6q0we_UfYyy8gafS4CDeevdnvMDo3NkyRCe-6bY_ELAx0tDyFNKszlKYS3QZ4WyuSuZsUd8YrzIS4ZZWplmHpqiUtADZU8X-HNytMCa_NIlfKgMt9WerE' }}
        resizeMode="cover"
      />
      
      {/* Gradient Overlay */}
      <View style={styles.overlay} />

      {/* Content */}
      <MotiView 
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 600 }}
        style={styles.content}
      >
        {/* Logo Container */}
        <View style={styles.logoContainer}>
          <View style={styles.iconWrapper}>
            <FontAwesome5 name="drafting-compass" size={48} color="#3B82F6" />
          </View>
          
          <Text style={styles.title}>BuildTrust</Text>
          
          <View style={styles.divider} />
          
          <Text style={styles.subtitle}>
            Building Trust, One Project at a Time
          </Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton]}
            onPress={() => onNext('onboarding1')}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Start Your Project</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton]}
            onPress={() => onNext('login')}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Find a Contractor</Text>
          </TouchableOpacity>
        </View>

        {/* Trust Badges */}
        <View style={styles.badges}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>VETTED PROS</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>SECURE PAY</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>SMART CONTRACTS</Text>
          </View>
        </View>
      </MotiView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 10,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  iconWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 24,
    borderRadius: 16,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 48,
    fontWeight: '800',
    color: '#3B82F6',
    letterSpacing: -1,
    marginBottom: 16,
  },
  divider: {
    width: 48,
    height: 4,
    backgroundColor: '#BFDBFE',
    borderRadius: 2,
    marginBottom: 32,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    lineHeight: 28,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 320,
    gap: 16,
  },
  button: {
    width: '100%',
    paddingVertical: 20,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  secondaryButtonText: {
    color: '#1F2937',
    fontSize: 18,
    fontWeight: '700',
  },
  badges: {
    flexDirection: 'row',
    marginTop: 64,
    gap: 32,
  },
  badge: {
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#9CA3AF',
  },
});
