import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { Screen } from '../types';

interface ContractSystemProps {
  onNavigate: (screen: Screen) => void;
  userRole: 'homeowner' | 'contractor';
  contractId?: string;
}

const MOCK_CONTRACT = {
  id: 'CTR-2026-0421',
  title: 'Kitchen Remodel Agreement',
  contractor: 'Elite Plumbing Solutions',
  homeowner: 'Alexander Wright',
  date: 'March 12, 2026',
  amount: '$12,700.00',
  deposit: '$6,350.00',
  status: 'Pending Signatures',
  homeownerSigned: false,
  contractorSigned: false,
  sections: [
    {
      title: '1. Scope of Work',
      content: 'Contractor agrees to perform the following services: Full kitchen plumbing remodel, including installation of new sink, faucet, dishwasher connection, and garbage disposal.'
    },
    {
      title: '2. Payment Schedule',
      content: 'Total project cost is $12,700.00. A deposit of $6,350.00 (50%) is held in escrow. Milestone payments released upon completion approval.'
    },
    {
      title: '3. Timeline & Completion',
      content: 'Work commenced on March 15, 2026. Estimated completion date is April 10, 2026. Contractor will provide weekly progress updates via the platform.'
    }
  ]
};

export const CreateContractScreen: React.FC<ContractSystemProps> = ({ onNavigate }) => {
  const [title, setTitle] = useState('Service Agreement');
  const [amount, setAmount] = useState('12700');
  const [deposit, setDeposit] = useState('6350');
  const [scope, setScope] = useState('Full kitchen plumbing remodel...');

  const standardClauses = ['Payment Schedule', 'Timeline & Delays', 'Insurance & Liability', 'Dispute Resolution'];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => onNavigate('quoteHistory')} style={styles.backButton}>
          <FontAwesome5 name="chevron-left" size={24} color="#1F2937"  />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Draft Contract</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.infoBanner}>
          <FontAwesome5 name="info-circle" size={20} color="#3B82F6"  />
          <Text style={styles.infoText}>
            This contract is pre-filled based on your accepted quote. Review and adjust the terms before sending.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Agreement Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            style={styles.input}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.section, styles.flex1]}>
            <Text style={styles.label}>Total Amount</Text>
            <View style={styles.inputWithIcon}>
              <FontAwesome5 name="dollar-sign" size={14} color="#9CA3AF" style={styles.icon}  />
              <TextInput
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                style={styles.inputWithIconField}
              />
            </View>
          </View>
          <View style={[styles.section, styles.flex1]}>
            <Text style={styles.label}>Escrow Deposit</Text>
            <View style={styles.inputWithIcon}>
              <FontAwesome5 name="dollar-sign" size={14} color="#9CA3AF" style={styles.icon}  />
              <TextInput
                value={deposit}
                onChangeText={setDeposit}
                keyboardType="numeric"
                style={styles.inputWithIconField}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Scope of Work</Text>
          <TextInput
            value={scope}
            onChangeText={setScope}
            multiline
            numberOfLines={8}
            style={styles.textarea}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Standard Clauses</Text>
          <View style={styles.clausesList}>
            {standardClauses.map((clause) => (
              <View key={clause} style={styles.clauseItem}>
                <View style={styles.clauseLeft}>
                  <FontAwesome5 name="file-alt" size={18} color="#9CA3AF"  />
                  <Text style={styles.clauseText}>{clause}</Text>
                </View>
                <FontAwesome5 name="check-circle" size={18} color="#10B981"  />
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          onPress={() => onNavigate('contractPreview')}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>Review & Send to Client</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const SignContractScreen: React.FC<ContractSystemProps> = ({ onNavigate, userRole }) => {
  const [isSigning, setIsSigning] = useState(false);
  const [signed, setSigned] = useState(false);

  const handleSign = () => {
    setIsSigning(true);
    setTimeout(() => {
      setSigned(true);
      setIsSigning(false);
    }, 2000);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => onNavigate('contractDetail')} style={styles.backButton}>
          <FontAwesome5 name="chevron-left" size={24} color="#1F2937"  />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sign Agreement</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.protectionCard}>
          <View style={styles.protectionHeader}>
            <View style={styles.shieldIcon}>
              <FontAwesome5 name="shield-alt" size={24} color="#FFFFFF"  />
            </View>
            <View>
              <Text style={styles.protectionTitle}>BuildTrust Protection</Text>
              <Text style={styles.protectionSubtitle}>Legally binding digital signature</Text>
            </View>
          </View>
          <Text style={styles.protectionText}>
            By signing this document, you agree to the terms and conditions outlined in the Service Agreement.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Sign Below</Text>
          <View style={styles.signatureBox}>
            {signed ? (
              <MotiView
                from={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                style={styles.signatureComplete}
              >
                <Text style={styles.signatureName}>
                  {userRole === 'homeowner' ? 'Alexander Wright' : 'Marco Rossi'}
                </Text>
                <Text style={styles.verifiedBadge}>Digitally Verified</Text>
              </MotiView>
            ) : (
              <>
                <FontAwesome5 name="pen-tool" size={32} color="#D1D5DB"  />
                <Text style={styles.signaturePlaceholder}>Draw your signature here</Text>
              </>
            )}
          </View>
          {!signed && (
            <TouchableOpacity>
              <Text style={styles.clearButton}>Clear Signature</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.verifiedBanner}>
          <FontAwesome5 name="check-circle" size={20} color="#10B981"  />
          <Text style={styles.verifiedText}>
            Your identity has been verified via your account credentials.
          </Text>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          disabled={!signed || isSigning}
          onPress={() => onNavigate('contractSuccess')}
          style={[styles.primaryButton, (!signed || isSigning) && styles.buttonDisabled]}
        >
          {isSigning ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>Complete Signing</Text>
          )}
        </TouchableOpacity>
      </View>

      {!signed && (
        <View style={styles.quickSignContainer}>
          <MotiView
            from={{ translateY: 20, opacity: 0 }}
            animate={{ translateY: 0, opacity: 1 }}
          >
            <TouchableOpacity onPress={handleSign} style={styles.quickSignButton}>
              <FontAwesome5 name="pen-tool" size={16} color="#FFFFFF"  />
              <Text style={styles.quickSignText}>Quick Sign</Text>
            </TouchableOpacity>
          </MotiView>
        </View>
      )}
    </View>
  );
};

export const ContractDetailScreen: React.FC<ContractSystemProps> = ({ onNavigate, userRole }) => {
  const contract = MOCK_CONTRACT;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => onNavigate(userRole === 'homeowner' ? 'jobDetail' : 'activeJobs')}
            style={styles.backButton}
          >
            <FontAwesome5 name="chevron-left" size={24} color="#1F2937"  />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Service Agreement</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconButton}>
            <FontAwesome5 name="download" size={20} color="#9CA3AF"  />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <FontAwesome5 name="print" size={20} color="#9CA3AF"  />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.statusBanner, styles.statusPending]}>
          <View style={styles.statusIcon}>
            <FontAwesome5 name="shield-alt" size={24} color="#3B82F6"  />
          </View>
          <View>
            <Text style={styles.statusLabel}>Contract Status</Text>
            <Text style={styles.statusValue}>{contract.status}</Text>
          </View>
        </View>

        <View style={styles.contractCard}>
          <View style={styles.contractHeader}>
            <View>
              <Text style={styles.contractTitle}>{contract.title}</Text>
              <Text style={styles.contractId}>ID: {contract.id}</Text>
            </View>
            <View style={styles.contractIconBg}>
              <FontAwesome5 name="file-alt" size={24} color="#1F2937"  />
            </View>
          </View>

          <View style={styles.contractDetails}>
            <View>
              <Text style={styles.detailLabel}>Contractor</Text>
              <Text style={styles.detailValue}>{contract.contractor}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.detailLabel}>Homeowner</Text>
              <Text style={styles.detailValue}>{contract.homeowner}</Text>
            </View>
            <View>
              <Text style={styles.detailLabel}>Amount</Text>
              <Text style={styles.detailValue}>{contract.amount}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.detailLabel}>Deposit</Text>
              <Text style={styles.detailValue}>{contract.deposit}</Text>
            </View>
          </View>
        </View>

        {contract.sections.map((section, idx) => (
          <View key={idx} style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionContent}>{section.content}</Text>
          </View>
        ))}

        <View style={styles.signaturesCard}>
          <Text style={styles.signaturesHeader}>Digital Signatures</Text>
          
          <View style={styles.signatureRow}>
            <View>
              <Text style={styles.signatureName}>{contract.homeowner}</Text>
              <Text style={styles.signatureStatus}>
                {contract.homeownerSigned ? `Signed on ${contract.date}` : 'Awaiting Signature'}
              </Text>
            </View>
            {contract.homeownerSigned ? (
              <View style={styles.verifiedBadgeSmall}>
                <FontAwesome5 name="check-circle" size={12} color="#10B981"  />
                <Text style={styles.verifiedBadgeText}>Verified</Text>
              </View>
            ) : (
              <View style={styles.pendingBadgeSmall}>
                <FontAwesome5 name="clock" size={12} color="#3B82F6"  />
                <Text style={styles.pendingBadgeText}>Pending</Text>
              </View>
            )}
          </View>

          <View style={styles.divider} />

          <View style={styles.signatureRow}>
            <View>
              <Text style={styles.signatureName}>{contract.contractor}</Text>
              <Text style={styles.signatureStatus}>
                {contract.contractorSigned ? `Signed on ${contract.date}` : 'Awaiting Signature'}
              </Text>
            </View>
            {contract.contractorSigned ? (
              <View style={styles.verifiedBadgeSmall}>
                <FontAwesome5 name="check-circle" size={12} color="#10B981"  />
                <Text style={styles.verifiedBadgeText}>Verified</Text>
              </View>
            ) : (
              <View style={styles.pendingBadgeSmall}>
                <FontAwesome5 name="clock" size={12} color="#3B82F6"  />
                <Text style={styles.pendingBadgeText}>Pending</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.disputeCard}>
          <View style={styles.disputeHeader}>
            <View style={styles.disputeIcon}>
              <FontAwesome5 name="exclamation-circle" size={20} color="#F97316"  />
            </View>
            <View>
              <Text style={styles.disputeTitle}>Dispute Resolution</Text>
              <Text style={styles.disputeSubtitle}>Mediation Services</Text>
            </View>
          </View>
          <Text style={styles.disputeText}>
            If you encounter any issues regarding the scope of work, quality, or payments, you can open a formal dispute.
          </Text>
          <TouchableOpacity onPress={() => onNavigate('dispute')} style={styles.disputeButton}>
            <FontAwesome5 name="exclamation-circle" size={14} color="#F97316"  />
            <Text style={styles.disputeButtonText}>Open Formal Dispute</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.footer}>
        {((userRole === 'homeowner' && !contract.homeownerSigned) || 
          (userRole === 'contractor' && !contract.contractorSigned)) ? (
          <TouchableOpacity
            onPress={() => onNavigate('signContract')}
            style={styles.primaryButton}
          >
            <FontAwesome5 name="pen-tool" size={20} color="#FFFFFF"  />
            <Text style={styles.primaryButtonText}>Sign Agreement</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.signedButton}>
            <FontAwesome5 name="check-circle" size={20} color="#9CA3AF"  />
            <Text style={styles.signedButtonText}>Signed & Verified</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  infoBanner: {
    flexDirection: 'row',
    gap: 16,
    padding: 24,
    backgroundColor: '#EFF6FF',
    borderRadius: 24,
    marginTop: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 18,
    fontWeight: '500',
  },
  section: {
    marginTop: 32,
    gap: 16,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    paddingHorizontal: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
    fontSize: 14,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  row: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 32,
  },
  flex1: {
    flex: 1,
    marginTop: 0,
  },
  inputWithIcon: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  inputWithIconField: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    paddingVertical: 20,
    paddingLeft: 40,
    paddingRight: 16,
    fontSize: 14,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  textarea: {
    backgroundColor: '#F9FAFB',
    borderRadius: 32,
    padding: 24,
    fontSize: 14,
    fontWeight: '500',
    height: 192,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  clausesList: {
    gap: 12,
  },
  clauseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  clauseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clauseText: {
    fontSize: 14,
    fontWeight: '700',
  },
  protectionCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 32,
    padding: 32,
    marginTop: 24,
    gap: 24,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  protectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  shieldIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  protectionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  protectionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  protectionText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
  },
  signatureBox: {
    height: 256,
    backgroundColor: '#F9FAFB',
    borderRadius: 32,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  signatureComplete: {
    alignItems: 'center',
    gap: 8,
  },
  signatureName: {
    fontSize: 36,
    fontFamily: 'System',
    fontStyle: 'italic',
    color: '#1F2937',
  },
  verifiedBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  signaturePlaceholder: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  clearButton: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 16,
    marginLeft: 8,
  },
  verifiedBanner: {
    flexDirection: 'row',
    gap: 16,
    padding: 24,
    backgroundColor: '#D1FAE5',
    borderRadius: 24,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  verifiedText: {
    flex: 1,
    fontSize: 12,
    color: '#047857',
    lineHeight: 18,
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#1F2937',
    paddingVertical: 20,
    borderRadius: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonDisabled: {
    backgroundColor: '#F3F4F6',
  },
  primaryButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  quickSignContainer: {
    position: 'absolute',
    bottom: 128,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  quickSignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 9999,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  quickSignText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 24,
    borderRadius: 32,
    marginTop: 24,
    borderWidth: 1,
  },
  statusPending: {
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  contractCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 32,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    gap: 24,
  },
  contractHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  contractTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  contractId: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
    marginTop: 4,
  },
  contractIconBg: {
    width: 48,
    height: 48,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contractDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#F9FAFB',
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 32,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: '#1F2937',
  },
  sectionContent: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
  },
  signaturesCard: {
    backgroundColor: '#1F2937',
    borderRadius: 32,
    padding: 32,
    marginTop: 24,
    gap: 32,
  },
  signaturesHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.4)',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  signatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  signatureName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  signatureStatus: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.4)',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  verifiedBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  pendingBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  pendingBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#3B82F6',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  disputeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 32,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    gap: 16,
  },
  disputeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  disputeIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disputeTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  disputeSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  disputeText: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },
  disputeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFF7ED',
    paddingVertical: 16,
    borderRadius: 16,
  },
  disputeButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EA580C',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  signedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#F9FAFB',
    paddingVertical: 20,
    borderRadius: 9999,
  },
  signedButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9CA3AF',
  },
});
