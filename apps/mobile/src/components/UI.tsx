/**
 * Shared UI Components for PRIBEC Mobile (React Native)
 * 
 * Provides reusable Button, Input, and Card components
 * compatible with React Native and NativeWind.
 */

import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  View, 
  TextInput, 
  StyleSheet,
  TouchableOpacityProps,
  TextInputProps,
  ViewProps
} from 'react-native';

// ── Button ────────────────────────────────────────────────────────────────────

interface ButtonProps extends TouchableOpacityProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  fullWidth = false, 
  children, 
  style,
  ...props 
}) => {
  const variantStyles = {
    primary: styles.buttonPrimary,
    secondary: styles.buttonSecondary,
    ghost: styles.buttonGhost,
    outline: styles.buttonOutline,
  };

  return (
    <TouchableOpacity 
      style={[
        styles.buttonBase, 
        variantStyles[variant],
        fullWidth && styles.buttonFullWidth,
        style
      ]}
      activeOpacity={0.8}
      {...props}
    >
      <Text style={[
        styles.buttonText,
        variant === 'primary' && styles.buttonTextPrimary,
        variant === 'secondary' && styles.buttonTextSecondary,
        variant === 'ghost' && styles.buttonTextGhost,
        variant === 'outline' && styles.buttonTextOutline,
      ]}>
        {children}
      </Text>
    </TouchableOpacity>
  );
};

// ── Input ─────────────────────────────────────────────────────────────────────

interface InputProps extends TextInputProps {
  label?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ 
  label, 
  icon, 
  rightElement, 
  style,
  ...props 
}) => {
  return (
    <View style={styles.inputContainer}>
      {label && <Text style={styles.inputLabel}>{label}</Text>}
      <View style={styles.inputWrapper}>
        {icon && (
          <View style={styles.inputIcon}>
            {icon}
          </View>
        )}
        <TextInput 
          style={[
            styles.input,
            icon && styles.inputWithIcon,
            rightElement && styles.inputWithRight,
            style
          ]}
          placeholderTextColor="#9CA3AF"
          {...props}
        />
        {rightElement && (
          <View style={styles.inputRightElement}>
            {rightElement}
          </View>
        )}
      </View>
    </View>
  );
};

// ── Card ──────────────────────────────────────────────────────────────────────

interface CardProps extends ViewProps {
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, style, ...props }) => {
  return (
    <View style={[styles.card, style]} {...props}>
      {children}
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  buttonBase: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonFullWidth: {
    width: '100%',
  },
  buttonPrimary: {
    backgroundColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  buttonSecondary: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  buttonGhost: {
    backgroundColor: 'transparent',
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
  },
  buttonTextPrimary: {
    color: '#FFFFFF',
  },
  buttonTextSecondary: {
    color: '#6B7280',
  },
  buttonTextGhost: {
    color: '#6B7280',
  },
  buttonTextOutline: {
    color: '#3B82F6',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1F2937',
  },
  inputWithIcon: {
    paddingLeft: 48,
  },
  inputWithRight: {
    paddingRight: 48,
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  inputRightElement: {
    position: 'absolute',
    right: 16,
    zIndex: 1,
  },
  card: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 32,
    elevation: 4,
  },
});
