import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Switch,
  StyleSheet
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { Screen } from '../types';

interface ScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const SettingsHub: React.FC<ScreenProps> = ({ onNavigate }) => {
  const menuItems = [
    { id: 'accountSettings', icon: User, label: 'Account Settings', desc: 'Manage your profile' },
    { id: 'notificationSettings', icon: Bell, label: 'Notifications', desc: 'Control updates' },
    { id: 'securitySettings', icon: Shield, label: 'Security', desc: 'Protect your account' },
    { id: 'languageSelection', icon: Globe, label: 'Language', desc: 'Choose language' },
    { id: 'paymentMethod', icon: CreditCard, label: 'Payments', desc: 'Manage payout methods' },
    { id: 'reportIssue', icon: HelpCircle, label: 'Support', desc: 'Get help' },
    { id: 'terms', icon: FileText, label: 'Legal', desc: 'Terms and privacy' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => onNavigate('profile')} style={styles.backButton}>
          <FontAwesome5 name="arrow-left" size={24} color="#1F2937"  />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.menuList}>
          {menuItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <MotiView
                key={item.id}
                from={{ opacity: 0, translateX: -10 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ delay: i * 50 }}
              >
                <TouchableOpacity
                  onPress={() => onNavigate(item.id as Screen)}
                  style={styles.menuItem}
                >
                  <View style={styles.menuIconBg}>
                    <Icon size={24} color="#9CA3AF" />
                  </View>
                  <View style={styles.menuContent}>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                    <Text style={styles.menuDesc}>{item.desc}</Text>
                  </View>
                  <FontAwesome5 name="chevron-right" size={20} color="#D1D5DB"  />
                </TouchableOpacity>
              </MotiView>
            );
          })}

          <MotiView
            from={{ opacity: 0, translateX: -10 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ delay: 400 }}
          >
            <TouchableOpacity onPress={() => onNavigate('logout')} style={styles.logoutItem}>
              <View style={styles.logoutIconBg}>
                <FontAwesome5 name="sign-out-alt" size={24} color="#EF4444"  />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.logoutLabel}>Logout</Text>
                <Text style={styles.logoutDesc}>Sign out of your account</Text>
              </View>
            </TouchableOpacity>
          </MotiView>
        </View>
      </ScrollView>
    </View>
  );
};

export const AccountSettingsScreen: React.FC<ScreenProps> = ({ onNavigate }) => (
  <View style={styles.container}>
    <View style={styles.header}>
      <TouchableOpacity onPress={() => onNavigate('settings')} style={styles.backButton}>
        <FontAwesome5 name="arrow-left" size={24} color="#1F2937"  />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Account Settings</Text>
      <TouchableOpacity onPress={() => onNavigate('settings')}>
        <Text style={styles.saveButton}>Save</Text>
      </TouchableOpacity>
    </View>

    <ScrollView style={styles.content}>
      <View style={styles.formSection}>
        <Text style={styles.sectionHeader}>Personal Information</Text>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Full Name</Text>
          <TextInput defaultValue="Alex Thompson" style={styles.textInput} />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Email Address</Text>
          <View style={styles.inputWithIcon}>
            <FontAwesome5 name="envelope" size={18} color="#D1D5DB" style={styles.inputIcon}  />
            <TextInput defaultValue="alex.t@thompsonbuilds.com" style={styles.textInputWithIcon} />
          </View>
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Phone Number</Text>
          <View style={styles.inputWithIcon}>
            <FontAwesome5 name="phone" size={18} color="#D1D5DB" style={styles.inputIcon}  />
            <TextInput defaultValue="+1 (555) 123-4567" style={styles.textInputWithIcon} />
          </View>
        </View>
      </View>
    </ScrollView>
  </View>
);

export const SecuritySettingsScreen: React.FC<ScreenProps> = ({ onNavigate }) => (
  <View style={styles.container}>
    <View style={styles.header}>
      <TouchableOpacity onPress={() => onNavigate('settings')} style={styles.backButton}>
        <FontAwesome5 name="arrow-left" size={24} color="#1F2937"  />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Security</Text>
    </View>

    <ScrollView style={styles.content}>
      <View style={styles.securityBanner}>
        <View style={styles.securityIcon}>
          <FontAwesome5 name="shield-alt" size={28} color="#10B981"  />
        </View>
        <Text style={styles.securityTitle}>Account Protection</Text>
        <Text style={styles.securitySubtitle}>
          Enable 2FA for maximum protection
        </Text>
        <TouchableOpacity style={styles.enable2FAButton}>
          <Text style={styles.enable2FAText}>Enable 2FA</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.formSection}>
        <Text style={styles.sectionHeader}>Login & Recovery</Text>
        <TouchableOpacity onPress={() => onNavigate('passwordChange')} style={styles.settingsCard}>
          <View style={styles.settingsCardLeft}>
            <View style={styles.settingsCardIcon}>
              <FontAwesome5 name="lock" size={20} color="#9CA3AF"  />
            </View>
            <Text style={styles.settingsCardLabel}>Change Password</Text>
          </View>
          <FontAwesome5 name="chevron-right" size={20} color="#D1D5DB"  />
        </TouchableOpacity>
      </View>
    </ScrollView>
  </View>
);

export const PasswordChangeScreen: React.FC<ScreenProps> = ({ onNavigate }) => {
  const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => onNavigate('securitySettings')} style={styles.backButton}>
          <FontAwesome5 name="arrow-left" size={24} color="#1F2937"  />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Change Password</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.passwordPrompt}>
          <View style={styles.lockIconBg}>
            <FontAwesome5 name="lock" size={32} color="#9CA3AF"  />
          </View>
          <Text style={styles.passwordPromptText}>
            Choose a strong password with at least 8 characters, including numbers and symbols.
          </Text>
        </View>

        <View style={styles.passwordFields}>
          {[
            { id: 'current', label: 'Current Password' },
            { id: 'new', label: 'New Password' },
            { id: 'confirm', label: 'Confirm New Password' },
          ].map((field) => (
            <View key={field.id} style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{field.label}</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  secureTextEntry={!showPass[field.id as keyof typeof showPass]}
                  placeholder="••••••••"
                  style={styles.passwordInput}
                />
                <TouchableOpacity
                  onPress={() => setShowPass({ ...showPass, [field.id]: !showPass[field.id as keyof typeof showPass] })}
                  style={styles.eyeIcon}
                >
                  {showPass[field.id as keyof typeof showPass] ? (
                    <FontAwesome5 name="eye-slash" size={18} color="#D1D5DB"  />
                  ) : (
                    <FontAwesome5 name="eye" size={18} color="#D1D5DB"  />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity onPress={() => onNavigate('securitySettings')} style={styles.updateButton}>
          <Text style={styles.updateButtonText}>Update Password</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export const LanguageSelectionScreen: React.FC<ScreenProps> = ({ onNavigate }) => {
  const [selected, setSelected] = useState('English (UK)');
  const languages = [
    { name: 'English (UK)', flag: '🇬🇧' },
    { name: 'English (US)', flag: '🇺🇸' },
    { name: 'Español', flag: '🇪🇸' },
    { name: 'Français', flag: '🇫🇷' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => onNavigate('settings')} style={styles.backButton}>
          <FontAwesome5 name="arrow-left" size={24} color="#1F2937"  />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Language</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.languageList}>
          {languages.map((lang) => (
            <TouchableOpacity
              key={lang.name}
              onPress={() => setSelected(lang.name)}
              style={[
                styles.languageItem,
                selected === lang.name && styles.languageItemSelected
              ]}
            >
              <View style={styles.languageLeft}>
                <Text style={styles.languageFlag}>{lang.flag}</Text>
                <Text style={[
                  styles.languageName,
                  selected === lang.name && styles.languageNameSelected
                ]}>
                  {lang.name}
                </Text>
              </View>
              {selected === lang.name && <FontAwesome5 name="check" size={20} color="#FFFFFF"  />}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

export const LogoutConfirmationScreen: React.FC<ScreenProps> = ({ onNavigate }) => (
  <View style={styles.centerContainer}>
    <MotiView
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      style={styles.logoutConfirmation}
    >
      <View style={styles.logoutIconContainer}>
        <FontAwesome5 name="sign-out-alt" size={48} color="#EF4444"  />
      </View>

      <View style={styles.logoutTextContainer}>
        <Text style={styles.logoutConfirmTitle}>Logging Out?</Text>
        <Text style={styles.logoutConfirmMessage}>
          Are you sure you want to log out of your account? You'll need to sign in again to access your jobs.
        </Text>
      </View>

      <View style={styles.logoutActions}>
        <TouchableOpacity onPress={() => onNavigate('roleSelection')} style={styles.logoutButton}>
          <Text style={styles.logoutButtonText}>Yes, Log Me Out</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onNavigate('settings')} style={styles.cancelButton}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </MotiView>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 24,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  saveButton: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  menuList: {
    marginTop: 16,
    gap: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 20,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  menuIconBg: {
    width: 48,
    height: 48,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuContent: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  menuDesc: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  logoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 20,
    borderRadius: 32,
    marginTop: 32,
  },
  logoutIconBg: {
    width: 48,
    height: 48,
    backgroundColor: '#FEE2E2',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
  },
  logoutDesc: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FECACA',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  formSection: {
    marginTop: 32,
    gap: 24,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    paddingHorizontal: 8,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    paddingHorizontal: 8,
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    fontSize: 14,
    fontWeight: '500',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  inputWithIcon: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  textInputWithIcon: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    paddingVertical: 16,
    paddingLeft: 48,
    paddingRight: 16,
    fontSize: 14,
    fontWeight: '500',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  securityBanner: {
    backgroundColor: '#1F2937',
    padding: 32,
    borderRadius: 48,
    marginTop: 32,
    gap: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  securityIcon: {
    width: 56,
    height: 56,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  securitySubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
  enable2FAButton: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  enable2FAText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  settingsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    backgroundColor: '#F9FAFB',
    borderRadius: 32,
  },
  settingsCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  settingsCardIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsCardLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  passwordPrompt: {
    alignItems: 'center',
    marginTop: 48,
    marginBottom: 48,
    gap: 16,
  },
  lockIconBg: {
    width: 80,
    height: 80,
    backgroundColor: '#F9FAFB',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passwordPromptText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 240,
  },
  passwordFields: {
    gap: 24,
  },
  passwordInputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    paddingRight: 48,
    fontSize: 14,
    fontWeight: '500',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
  },
  updateButton: {
    backgroundColor: '#1F2937',
    paddingVertical: 20,
    borderRadius: 32,
    alignItems: 'center',
    marginTop: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  updateButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  languageList: {
    marginTop: 32,
    gap: 8,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    backgroundColor: '#F9FAFB',
    borderRadius: 32,
  },
  languageItemSelected: {
    backgroundColor: '#1F2937',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  languageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  languageFlag: {
    fontSize: 24,
  },
  languageName: {
    fontSize: 14,
    fontWeight: '700',
  },
  languageNameSelected: {
    color: '#FFFFFF',
  },
  logoutConfirmation: {
    maxWidth: 320,
    gap: 48,
    alignItems: 'center',
  },
  logoutIconContainer: {
    width: 128,
    height: 128,
    backgroundColor: '#FEE2E2',
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutTextContainer: {
    gap: 16,
    alignItems: 'center',
  },
  logoutConfirmTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1F2937',
  },
  logoutConfirmMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  logoutActions: {
    width: '100%',
    gap: 16,
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 20,
    borderRadius: 32,
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cancelButton: {
    paddingVertical: 20,
    borderRadius: 32,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9CA3AF',
  },
});
