import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  Image, 
  ScrollView, 
  StyleSheet, 
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { MotiView } from 'moti';
import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { Screen } from './types';
import { useAuth } from './context/AuthContext';
import { ApiError } from './lib/api';

// --- Login ---
export const LoginScreen: React.FC<{ onNext: (s: Screen) => void }> = ({ onNext }) => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const auth = useAuth();

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      const { mobileRole } = await auth.login(email, password);
      onNext(mobileRole === 'contractor' ? 'contractorHome' : 'home');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.authCard}>
          <View style={styles.logoSection}>
            <Text style={styles.logo}>BuildTrust</Text>
          </View>
          
          <View style={styles.formSection}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Log in to manage your active projects and bids.</Text>
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <FontAwesome5 name="envelope" size={20} color="#6B7280" style={styles.inputIcon}  />
                <TextInput
                  style={styles.input}
                  placeholder="name@company.com"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <FontAwesome5 name="lock" size={20} color="#6B7280" style={styles.inputIcon}  />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="••••••••"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? <FontAwesome5 name="eye-slash" size={20} color="#6B7280"  /> : <FontAwesome5 name="eye" size={20} color="#6B7280"  />}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={handleSubmit}
              disabled={loading || !email || !password}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Login</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => onNext('forgotPassword')}>
              <Text style={styles.linkText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialButtons}>
            <TouchableOpacity style={styles.socialButton}>
              <Text style={styles.socialButtonText}>Google</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Text style={styles.socialButtonText}>Apple</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footerText}>
            New to the platform?{' '}
            <Text style={styles.footerLink} onPress={() => onNext('roleSelection')}>
              Sign Up
            </Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// --- Role Selection ---
export const RoleSelectionScreen: React.FC<{ onNext: (s: Screen) => void }> = ({ onNext }) => (
  <ScrollView contentContainerStyle={styles.centerContainer}>
    <View style={styles.roleContainer}>
      <View style={styles.roleHeader}>
        <Text style={styles.roleTitle}>
          How will you use <Text style={styles.brandText}>BuildTrust?</Text>
        </Text>
        <Text style={styles.roleSubtitle}>
          Select your primary role to customize your experience and start building connections.
        </Text>
      </View>

      <View style={styles.roleCards}>
        <TouchableOpacity 
          style={styles.roleCard}
          onPress={() => onNext('signupHomeowner')}
          activeOpacity={0.7}
        >
          <View style={[styles.roleIcon, { backgroundColor: '#DBEAFE' }]}>
            <FontAwesome5 name="home" size={32} color="#3B82F6"  />
          </View>
          <Text style={styles.roleCardTitle}>I am a Homeowner</Text>
          <Text style={styles.roleCardDescription}>
            Find verified contractors, manage projects, and secure payments.
          </Text>
          <View style={styles.roleCardFooter}>
            <Text style={styles.roleCardLink}>Get Started</Text>
            <FontAwesome5 name="arrow-right" size={16} color="#3B82F6"  />
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.roleCard}
          onPress={() => onNext('signupContractor')}
          activeOpacity={0.7}
        >
          <View style={[styles.roleIcon, { backgroundColor: '#FEF3C7' }]}>
            <FontAwesome5 name="hammer" size={32} color="#F59E0B"  />
          </View>
          <Text style={styles.roleCardTitle}>I am a Contractor</Text>
          <Text style={styles.roleCardDescription}>
            Grow your business, find quality leads, and manage billing in one place.
          </Text>
          <View style={styles.roleCardFooter}>
            <Text style={[styles.roleCardLink, { color: '#F59E0B' }]}>Grow Business</Text>
            <FontAwesome5 name="arrow-right" size={16} color="#F59E0B"  />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.roleFooter}>
        <Text style={styles.roleFooterText}>
          Already have an account?{' '}
          <Text style={styles.roleFooterLink} onPress={() => onNext('login')}>
            Log in
          </Text>
        </Text>
      </View>
    </View>
  </ScrollView>
);

// --- Forgot Password ---
export const ForgotPasswordScreen: React.FC<{ onNext: (s: Screen) => void }> = ({ onNext }) => {
  const [email, setEmail] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const auth = useAuth();

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      await auth.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => onNext('login')} style={styles.backButton}>
          <FontAwesome5 name="arrow-left" size={24} color="#3B82F6"  />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Forgot Password</Text>
        <FontAwesome5 name="question-circle" size={24} color="#6B7280"  />
      </View>

      <ScrollView contentContainerStyle={styles.centerContent}>
        <View style={styles.forgotPasswordCard}>
          <View style={styles.iconCircle}>
            <FontAwesome5 name="lock" size={40} color="#3B82F6"  />
          </View>
          
          <Text style={styles.forgotTitle}>Reset your password</Text>
          <Text style={styles.forgotSubtitle}>
            Enter your email to receive a password reset link.
          </Text>

          {sent ? (
            <View style={styles.successMessage}>
              <View style={[styles.iconCircle, { backgroundColor: '#DBEAFE' }]}>
                <FontAwesome5 name="check" size={32} color="#3B82F6"  />
              </View>
              <Text style={styles.successTitle}>Reset link sent!</Text>
              <Text style={styles.successText}>
                Check your inbox at <Text style={styles.boldText}>{email}</Text> for instructions.
              </Text>
              <TouchableOpacity style={styles.primaryButton} onPress={() => onNext('login')}>
                <Text style={styles.primaryButtonText}>Back to Login</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <View style={styles.inputWrapper}>
                  <FontAwesome5 name="envelope" size={20} color="#6B7280" style={styles.inputIcon}  />
                  <TextInput
                    style={styles.input}
                    placeholder="contractor@buildtrust.com"
                    placeholderTextColor="#9CA3AF"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <TouchableOpacity 
                style={styles.primaryButton}
                onPress={handleSubmit}
                disabled={loading || !email}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>Send Link</Text>
                    <FontAwesome5 name="paper-plane" size={20} color="#FFFFFF"  />
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => onNext('login')} style={styles.backLink}>
                <Text style={styles.linkText}>Back to Login</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

// --- Signup Homeowner ---
export const SignupHomeownerScreen: React.FC<{ onNext: (s: Screen) => void }> = ({ onNext }) => {
  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [agreed, setAgreed] = React.useState(false);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const auth = useAuth();

  const handleSubmit = async () => {
    setError('');
    const [firstName, ...rest] = fullName.trim().split(' ');
    const lastName = rest.join(' ') || '';
    setLoading(true);
    try {
      await auth.register({ firstName, lastName, email, phone, password, mobileRole: 'homeowner' });
      onNext('verification');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.signupCard}>
          <Text style={styles.signupTitle}>Create Account</Text>
          <Text style={styles.signupSubtitle}>Start your home renovation journey today.</Text>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>FULL NAME</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Johnathan Doe"
                placeholderTextColor="#9CA3AF"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>EMAIL ADDRESS</Text>
              <TextInput
                style={styles.textInput}
                placeholder="john@example.com"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>PHONE</Text>
              <TextInput
                style={styles.textInput}
                placeholder="+1 (555) 000"
                placeholderTextColor="#9CA3AF"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>PASSWORD</Text>
              <TextInput
                style={styles.textInput}
                placeholder="••••••••"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity 
              style={styles.checkboxRow}
              onPress={() => setAgreed(!agreed)}
            >
              <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
                {agreed && <FontAwesome5 name="check" size={16} color="#FFFFFF"  />}
              </View>
              <Text style={styles.checkboxLabel}>
                I agree to the <Text style={styles.linkInline}>Terms of Service</Text> and{' '}
                <Text style={styles.linkInline}>Privacy Policy</Text>.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.primaryButton, (!agreed || !email || !fullName || !password) && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={!agreed || !email || !fullName || !password || loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Sign Up</Text>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.footerText}>
            Already have an account?{' '}
            <Text style={styles.footerLink} onPress={() => onNext('login')}>
              Log In
            </Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// --- Signup Contractor ---
export const SignupContractorScreen: React.FC<{ onNext: (s: Screen) => void }> = ({ onNext }) => {
  const [businessName, setBusinessName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [licenseNumber, setLicenseNumber] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [agreed, setAgreed] = React.useState(false);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const auth = useAuth();

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      await auth.register({ 
        firstName: businessName, 
        lastName: '', 
        email, 
        password, 
        mobileRole: 'contractor' 
      });
      onNext('verification');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.signupCard}>
          <Text style={styles.signupTitle}>Contractor Registration</Text>
          <Text style={styles.signupSubtitle}>Join the network of elite professionals.</Text>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>BUSINESS NAME</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Smith & Sons Carpentry"
                placeholderTextColor="#9CA3AF"
                value={businessName}
                onChangeText={setBusinessName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>BUSINESS EMAIL</Text>
              <TextInput
                style={styles.textInput}
                placeholder="contact@smithandsons.com"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>LICENSE #</Text>
              <TextInput
                style={styles.textInput}
                placeholder="LIC-123456"
                placeholderTextColor="#9CA3AF"
                value={licenseNumber}
                onChangeText={setLicenseNumber}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>PASSWORD</Text>
              <TextInput
                style={styles.textInput}
                placeholder="••••••••"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity 
              style={styles.checkboxRow}
              onPress={() => setAgreed(!agreed)}
            >
              <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
                {agreed && <FontAwesome5 name="check" size={16} color="#FFFFFF"  />}
              </View>
              <Text style={styles.checkboxLabel}>
                I agree to the <Text style={styles.linkInline}>Contractor Terms</Text> and{' '}
                <Text style={styles.linkInline}>Privacy Policy</Text>.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.contractorButton, (!agreed || !email || !businessName || !password) && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={!agreed || !email || !businessName || !password || loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Register Business</Text>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.footerText}>
            Already have an account?{' '}
            <Text style={[styles.footerLink, { color: '#F59E0B' }]} onPress={() => onNext('login')}>
              Log In
            </Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// --- Verification ---
export const VerificationScreen: React.FC<{ onNext: (s: Screen) => void }> = ({ onNext }) => {
  const [code, setCode] = React.useState(['', '', '', '', '', '']);
  const inputRefs = React.useRef<Array<TextInput | null>>([]);

  const handleCodeChange = (text: string, index: number) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.centerContainer}>
      <View style={styles.verificationCard}>
        <View style={styles.verificationIcon}>
          <FontAwesome5 name="shield-alt" size={32} color="#3B82F6"  />
        </View>
        
        <Text style={styles.verificationTitle}>Secure Verification</Text>
        <Text style={styles.verificationSubtitle}>
          Enter the 6-digit code sent to your email
        </Text>

        <View style={styles.codeInputContainer}>
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              style={styles.codeInput}
              maxLength={1}
              keyboardType="number-pad"
              value={code[index]}
              onChangeText={(text) => handleCodeChange(text, index)}
              placeholder="·"
              placeholderTextColor="#9CA3AF"
              textAlign="center"
            />
          ))}
        </View>

        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={() => onNext('success')}
        >
          <Text style={styles.primaryButtonText}>Verify Identity</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

// --- Success ---
export const SuccessScreen: React.FC<{ onNext: (s: Screen) => void }> = ({ onNext }) => {
  React.useEffect(() => {
    const timer = setTimeout(() => onNext('home'), 5000);
    return () => clearTimeout(timer);
  }, [onNext]);

  return (
    <ScrollView contentContainerStyle={styles.centerContainer}>
      <View style={styles.successCard}>
        <MotiView
          from={{ scale: 0, rotate: '-10deg' }}
          animate={{ scale: 1, rotate: '3deg' }}
          transition={{ type: 'spring', damping: 10 }}
          style={styles.successIconContainer}
        >
          <View style={styles.successIconOuter}>
            <View style={styles.successIconInner}>
              <FontAwesome5 name="check-circle" size={48} color="#3B82F6"  />
            </View>
          </View>
        </MotiView>

        <Text style={styles.successWelcomeTitle}>Welcome to BuildTrust!</Text>
        <Text style={styles.successWelcomeText}>
          Your account has been successfully created. Ready to start building?
        </Text>

        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={() => onNext('home')}
        >
          <Text style={styles.primaryButtonText}>Go to Dashboard</Text>
          <FontAwesome5 name="arrow-right" size={20} color="#FFFFFF"  />
        </TouchableOpacity>

        <Text style={styles.redirectText}>
          Redirecting to your workspace in 5 seconds...
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  centerContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  centerContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authCard: {
    width: '100%',
    maxWidth: 480,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    fontSize: 32,
    fontWeight: '800',
    color: '#3B82F6',
    letterSpacing: -0.5,
  },
  formSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#991B1B',
    fontSize: 14,
    fontWeight: '500',
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    padding: 0,
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 32,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  contractorButton: {
    backgroundColor: '#F59E0B',
    borderRadius: 32,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: '#E5E7EB',
    opacity: 0.6,
  },
  linkText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 16,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1.5,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  socialButtonText: {
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '600',
  },
  footerText: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 14,
    marginTop: 24,
  },
  footerLink: {
    color: '#3B82F6',
    fontWeight: '700',
  },
  roleContainer: {
    width: '100%',
    maxWidth: 960,
  },
  roleHeader: {
    alignItems: 'center',
    marginBottom: 48,
  },
  roleTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  brandText: {
    color: '#3B82F6',
  },
  roleSubtitle: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: 480,
    lineHeight: 28,
  },
  roleCards: {
    gap: 24,
    marginBottom: 48,
  },
  roleCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 32,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  roleIcon: {
    width: 64,
    height: 64,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  roleCardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  roleCardDescription: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 24,
  },
  roleCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleCardLink: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  roleFooter: {
    alignItems: 'center',
  },
  roleFooterText: {
    fontSize: 14,
    color: '#6B7280',
  },
  roleFooterLink: {
    color: '#3B82F6',
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  forgotPasswordCard: {
    width: '100%',
    maxWidth: 480,
    padding: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  forgotTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  forgotSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  successMessage: {
    alignItems: 'center',
    gap: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  successText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  boldText: {
    fontWeight: '700',
    color: '#1F2937',
  },
  backLink: {
    marginTop: 24,
    alignItems: 'center',
  },
  signupCard: {
    width: '100%',
    maxWidth: 480,
    padding: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  signupTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  signupSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
  },
  linkInline: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  verificationCard: {
    width: '100%',
    maxWidth: 480,
    padding: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  verificationIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  verificationTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 8,
  },
  verificationSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  codeInputContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 32,
  },
  codeInput: {
    width: 48,
    height: 64,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },
  successCard: {
    width: '100%',
    maxWidth: 560,
    padding: 64,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  successIconContainer: {
    marginBottom: 48,
  },
  successIconOuter: {
    width: 112,
    height: 112,
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '3deg' }],
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  successIconInner: {
    width: 80,
    height: 80,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-3deg' }],
  },
  successWelcomeTitle: {
    fontSize: 40,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: -1,
  },
  successWelcomeText: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 48,
    maxWidth: 420,
  },
  redirectText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 16,
  },
});
