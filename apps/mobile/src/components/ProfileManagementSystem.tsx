import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { Screen } from '../types';

interface ScreenProps {
  onNavigate: (screen: Screen) => void;
}

const services = [
  { id: '1', name: 'Kitchen Remodeling', category: 'Renovation' },
  { id: '2', name: 'Bathroom Tiling', category: 'Flooring' },
  { id: '3', name: 'General Plumbing', category: 'Maintenance' },
];

const certifications = [
  { id: '1', name: 'Licensed General Contractor', issuer: 'State Board', expiry: 'Dec 2026', status: 'Verified' },
  { id: '2', name: 'Master Plumber', issuer: 'Plumbing Association', expiry: 'Jun 2027', status: 'Pending' },
];

export const ContractorProfileHub: React.FC<ScreenProps> = ({ onNavigate }) => {
  const menuItems = [
    { icon: Edit3, label: 'Edit Profile', screen: 'editProfile', desc: 'Name, bio, contact' },
    { icon: Plus, label: 'Add Services', screen: 'addServices', desc: 'Service offerings' },
    { icon: Award, label: 'Certifications', screen: 'certificationsUpload', desc: 'Licenses & credentials' },
    { icon: DollarSign, label: 'Pricing Setup', screen: 'pricingSetup', desc: 'Rates and fees' },
    { icon: ShieldCheck, label: 'Verification', screen: 'verificationStatus', desc: 'Identity checks' },
    { icon: Star, label: 'Reviews', screen: 'reviewsReceived', desc: 'View feedback' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.profileHeader}>
        <View style={styles.profileTopBar}>
          <TouchableOpacity onPress={() => onNavigate('contractorHome')} style={styles.backButton}>
            <FontAwesome5 name="arrow-left" size={24} color="#1F2937"  />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile Management</Text>
          <TouchableOpacity onPress={() => onNavigate('settings')} style={styles.backButton}>
            <FontAwesome5 name="cog" size={24} color="#1F2937"  />
          </TouchableOpacity>
        </View>

        <View style={styles.profileSummary}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarInitials}>AT</Text>
          </View>
          <View>
            <Text style={styles.profileName}>Alex Thompson</Text>
            <Text style={styles.profileCompany}>Thompson Quality Builds</Text>
            <View style={styles.verifiedBadge}>
              <FontAwesome5 name="shield-alt" size={14} color="#10B981"  />
              <Text style={styles.verifiedText}>Verified Pro</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.menuGrid}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <TouchableOpacity
                key={item.screen}
                onPress={() => onNavigate(item.screen as Screen)}
                style={styles.menuCard}
              >
                <View style={styles.menuCardIcon}>
                  <Icon size={20} color="#1F2937" />
                </View>
                <View style={styles.menuCardContent}>
                  <Text style={styles.menuCardLabel}>{item.label}</Text>
                  <Text style={styles.menuCardDesc}>{item.desc}</Text>
                </View>
                <FontAwesome5 name="chevron-right" size={18} color="#D1D5DB"  />
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

export const EditProfileScreen: React.FC<ScreenProps> = ({ onNavigate }) => (
  <View style={styles.container}>
    <View style={styles.header}>
      <TouchableOpacity onPress={() => onNavigate('contractorHome')} style={styles.backButton}>
        <FontAwesome5 name="arrow-left" size={24} color="#1F2937"  />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Edit Profile</Text>
      <TouchableOpacity onPress={() => onNavigate('profile')}>
        <Text style={styles.saveButton}>Save</Text>
      </TouchableOpacity>
    </View>

    <ScrollView style={styles.content}>
      <View style={styles.photoSection}>
        <View style={styles.photoContainer}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarInitials}>AT</Text>
          </View>
          <TouchableOpacity style={styles.cameraButton}>
            <FontAwesome5 name="camera" size={18} color="#FFFFFF"  />
          </TouchableOpacity>
        </View>
        <Text style={styles.photoLabel}>Change Photo</Text>
      </View>

      <View style={styles.formFields}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Full Name</Text>
          <TextInput defaultValue="Alex Thompson" style={styles.textInput} />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Business Name</Text>
          <TextInput defaultValue="Thompson Quality Builds" style={styles.textInput} />
        </View>
      </View>
    </ScrollView>
  </View>
);

export const AddServicesScreen: React.FC<ScreenProps> = ({ onNavigate }) => (
  <View style={styles.container}>
    <View style={styles.header}>
      <TouchableOpacity onPress={() => onNavigate('contractorHome')} style={styles.backButton}>
        <FontAwesome5 name="arrow-left" size={24} color="#1F2937"  />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Services</Text>
      <TouchableOpacity style={styles.backButton}>
        <FontAwesome5 name="plus" size={24} color="#1F2937"  />
      </TouchableOpacity>
    </View>

    <ScrollView style={styles.content}>
      <View style={styles.formSection}>
        <Text style={styles.sectionHeader}>My Services</Text>
        <View style={styles.servicesList}>
          {services.map((service) => (
            <View key={service.id} style={styles.serviceCard}>
              <View>
                <Text style={styles.serviceName}>{service.name}</Text>
                <Text style={styles.serviceCategory}>{service.category}</Text>
              </View>
              <TouchableOpacity>
                <FontAwesome5 name="trash-alt" size={18} color="#D1D5DB"  />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  </View>
);

export const CertificationsUploadScreen: React.FC<ScreenProps> = ({ onNavigate }) => (
  <View style={styles.container}>
    <View style={styles.header}>
      <TouchableOpacity onPress={() => onNavigate('contractorHome')} style={styles.backButton}>
        <FontAwesome5 name="arrow-left" size={24} color="#1F2937"  />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Certifications</Text>
    </View>

    <ScrollView style={styles.content}>
      <TouchableOpacity style={styles.addCertButton}>
        <FontAwesome5 name="plus" size={20} color="#FFFFFF"  />
        <Text style={styles.addCertButtonText}>Add Certification</Text>
      </TouchableOpacity>

      <View style={styles.formSection}>
        <Text style={styles.sectionHeader}>Active Credentials</Text>
        <View style={styles.certsList}>
          {certifications.map((cert) => (
            <View key={cert.id} style={styles.certCard}>
              <View style={[
                styles.certIcon,
                cert.status === 'Verified' ? styles.certIconVerified : styles.certIconPending
              ]}>
                <FontAwesome5 name="award" size={28} color={cert.status === 'Verified' ? '#10B981' : '#F59E0B'}  />
              </View>
              <View style={styles.certContent}>
                <Text style={styles.certName}>{cert.name}</Text>
                <Text style={styles.certMeta}>{cert.issuer} • Exp: {cert.expiry}</Text>
              </View>
              <View style={[
                styles.certBadge,
                cert.status === 'Verified' ? styles.certBadgeVerified : styles.certBadgePending
              ]}>
                <Text style={[
                  styles.certBadgeText,
                  cert.status === 'Verified' ? styles.certBadgeTextVerified : styles.certBadgeTextPending
                ]}>
                  {cert.status}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  </View>
);

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  profileHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
    borderBottomLeftRadius: 48,
    borderBottomRightRadius: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  profileTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  profileSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 32,
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1F2937',
  },
  profileCompany: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#10B981',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  menuGrid: {
    marginTop: 32,
    gap: 16,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  menuCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuCardContent: {
    flex: 1,
  },
  menuCardLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  menuCardDesc: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  saveButton: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  photoSection: {
    alignItems: 'center',
    marginTop: 32,
    gap: 16,
  },
  photoContainer: {
    position: 'relative',
  },
  avatarLarge: {
    width: 128,
    height: 128,
    borderRadius: 32,
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    backgroundColor: '#1F2937',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  photoLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  formFields: {
    marginTop: 32,
    gap: 24,
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
  formSection: {
    marginTop: 32,
    gap: 16,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    paddingHorizontal: 8,
  },
  servicesList: {
    gap: 12,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '700',
  },
  serviceCategory: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: 4,
  },
  addCertButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#1F2937',
    padding: 24,
    borderRadius: 32,
    marginTop: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  addCertButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  certsList: {
    gap: 16,
  },
  certCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  certIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  certIconVerified: {
    backgroundColor: '#D1FAE5',
  },
  certIconPending: {
    backgroundColor: '#FEF3C7',
  },
  certContent: {
    flex: 1,
  },
  certName: {
    fontSize: 14,
    fontWeight: '700',
  },
  certMeta: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: 4,
  },
  certBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  certBadgeVerified: {
    backgroundColor: '#D1FAE5',
  },
  certBadgePending: {
    backgroundColor: '#FEF3C7',
  },
  certBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  certBadgeTextVerified: {
    color: '#047857',
  },
  certBadgeTextPending: {
    color: '#D97706',
  },
});
