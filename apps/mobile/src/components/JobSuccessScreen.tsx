import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet,
  Dimensions 
} from 'react-native';
import { MotiView } from 'moti';
import { FontAwesome5 } from '@expo/vector-icons';
import { Screen } from '../types';

interface JobSuccessScreenProps {
  onNavigate: (screen: Screen) => void;
}

const { width } = Dimensions.get('window');

export const JobSuccessScreen: React.FC<JobSuccessScreenProps> = ({ onNavigate }) => {
  return (
    <View style={styles.container}>
      {/* Background Glow */}
      <View style={styles.backgroundGlow} />

      <View style={styles.content}>
        <MotiView 
          from={{ scale: 0.5, opacity: 0, rotate: '-20deg' }}
          animate={{ scale: 1, opacity: 1, rotate: '0deg' }}
          transition={{ type: 'spring', damping: 12, stiffness: 100 }}
          style={styles.iconContainer}
        >
          <FontAwesome5 name="check-circle" size={64} color="#FFFFFF"  />
        </MotiView>

        <MotiView
          from={{ translateY: 20, opacity: 0 }}
          animate={{ translateY: 0, opacity: 1 }}
          transition={{ delay: 300 }}
          style={styles.textContainer}
        >
          <Text style={styles.title}>Job Posted Successfully!</Text>
          <Text style={styles.subtitle}>
            Your project is now live. Contractors in your area will be notified and can start sending you quotes.
          </Text>
        </MotiView>

        <MotiView 
          from={{ translateY: 20, opacity: 0 }}
          animate={{ translateY: 0, opacity: 1 }}
          transition={{ delay: 500 }}
          style={styles.actionsContainer}
        >
          <TouchableOpacity 
            onPress={() => onNavigate('projects')}
            style={styles.primaryButton}
            activeOpacity={0.9}
          >
            <FontAwesome5 name="layout" size={20} color="#FFFFFF"  />
            <Text style={styles.primaryButtonText}>View My Projects</Text>
          </TouchableOpacity>
          
          <View style={styles.secondaryButtons}>
            <TouchableOpacity style={styles.secondaryButton}>
              <FontAwesome5 name="share-alt" size={18} color="#6B7280"  />
              <Text style={styles.secondaryButtonText}>Share Job</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton}>
              <FontAwesome5 name="calendar" size={18} color="#6B7280"  />
              <Text style={styles.secondaryButtonText}>Add to Cal</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            onPress={() => onNavigate('home')}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>BACK TO DASHBOARD</Text>
          </TouchableOpacity>
        </MotiView>
      </View>

      {/* Confetti Animation */}
      <View style={styles.confettiContainer}>
        {[...Array(20)].map((_, i) => {
          const colors = ['#3B82F6', '#10B981', '#F59E0B', '#A855F7'];
          const randomColor = colors[Math.floor(Math.random() * colors.length)];
          const randomLeft = Math.random() * width;
          const randomDelay = Math.random() * 5000;
          
          return (
            <MotiView
              key={i}
              from={{ 
                translateY: 800, 
                translateX: randomLeft,
                scale: Math.random() * 0.5 + 0.5,
                rotate: '0deg'
              }}
              animate={{ 
                translateY: -100,
                rotate: '360deg',
                translateX: randomLeft + (Math.random() * 100 - 50)
              }}
              transition={{ 
                duration: Math.random() * 2000 + 2000,
                repeat: Infinity,
                delay: randomDelay,
                type: 'timing'
              }}
              style={[styles.confetti, { backgroundColor: randomColor }]}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  backgroundGlow: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 500,
    height: 500,
    backgroundColor: '#D1FAE5',
    borderRadius: 250,
    marginLeft: -250,
    marginTop: -250,
    opacity: 0.3,
    zIndex: -1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  iconContainer: {
    width: 128,
    height: 128,
    backgroundColor: '#10B981',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  textContainer: {
    alignItems: 'center',
    maxWidth: 320,
    gap: 16,
    marginBottom: 64,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 44,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  actionsContainer: {
    width: '100%',
    gap: 16,
  },
  primaryButton: {
    backgroundColor: '#1F2937',
    paddingVertical: 24,
    borderRadius: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingVertical: 20,
    borderRadius: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  secondaryButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  backButton: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 2,
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    overflow: 'hidden',
  },
  confetti: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 2,
  },
});
