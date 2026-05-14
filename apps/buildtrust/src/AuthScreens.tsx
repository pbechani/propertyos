import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, HelpCircle, Mail, Lock, Eye, EyeOff, Send, Shield, Verified, Home, Hammer, Check, CheckCircle } from 'lucide-react';
import { Button, Input, Card } from './components/UI';
import { Screen } from './types';
import { useAuth } from './context/AuthContext';

// --- Login ---
export const LoginScreen: React.FC<{ onNext: (s: Screen) => void }> = ({ onNext }) => {
  const auth = useAuth();
  const [showPassword, setShowPassword] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const user = await auth.login(email, password);
      onNext(user.roles.includes('contractor') ? 'contractorHome' : 'home');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col md:flex-row">
      <section className="hidden md:flex md:w-1/2 relative flex-col justify-between p-12 lg:p-20 overflow-hidden bg-primary">
        <div className="absolute inset-0 opacity-20">
          <img className="w-full h-full object-cover" src="https://picsum.photos/seed/arch/1000/1000" alt="arch" referrerPolicy="no-referrer" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-12">
            <span className="font-headline font-extrabold text-2xl tracking-tighter text-white">BuildTrust</span>
          </div>
          <div className="max-w-md">
            <h1 className="font-headline text-5xl font-extrabold text-white leading-tight mb-6 tracking-tight">Precision in every connection.</h1>
            <p className="text-white/80 text-lg leading-relaxed font-light">Join the marketplace where architectural integrity meets professional craftsmanship.</p>
          </div>
        </div>
      </section>
      <main className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 lg:p-24 bg-surface">
        <div className="w-full max-w-md space-y-10">
          <div className="md:hidden flex flex-col items-center mb-8">
            <span className="font-headline font-extrabold text-3xl tracking-tighter text-primary mb-2">BuildTrust</span>
          </div>
          <div className="space-y-3">
            <h2 className="font-headline text-3xl font-bold tracking-tight text-on-surface">Welcome Back</h2>
            <p className="text-on-surface-variant font-medium">Log in to manage your active projects and bids.</p>
          </div>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <Input label="Email Address" icon={<Mail className="w-5 h-5" />} placeholder="name@company.com" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            <div className="space-y-1">
              <div className="flex justify-between items-center px-1">
                <label className="font-label text-sm font-semibold text-on-surface-variant">Password</label>
              </div>
              <Input 
                icon={<Lock className="w-5 h-5" />} 
                placeholder="••••••••" 
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                rightElement={
                  <button type="button" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                }
              />
            </div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <div className="space-y-4">
              <Button fullWidth type="submit" disabled={isSubmitting}>{isSubmitting ? 'Logging in…' : 'Login'}</Button>
              <div className="text-center">
                <button type="button" onClick={() => onNext('forgotPassword')} className="text-primary text-sm font-bold hover:underline">Forgot Password?</button>
              </div>
            </div>
          </form>
          <div className="relative flex items-center py-4">
            <div className="flex-grow border-t border-surface-container-high"></div>
            <span className="flex-shrink mx-4 text-outline font-label text-xs font-bold uppercase tracking-widest">or continue with</span>
            <div className="flex-grow border-t border-surface-container-high"></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Button variant="secondary" fullWidth className="py-3">Google</Button>
            <Button variant="secondary" fullWidth className="py-3">Apple</Button>
          </div>
          <p className="text-center text-on-surface-variant font-medium">
            New to the platform? <button onClick={() => onNext('roleSelection')} className="text-primary font-bold hover:underline ml-1">Sign Up</button>
          </p>
        </div>
      </main>
    </main>
  );
};

// --- Role Selection ---
export const RoleSelectionScreen: React.FC<{ onNext: (s: Screen) => void }> = ({ onNext }) => (
  <main className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
    <div className="absolute inset-0 blueprint-pattern pointer-events-none"></div>
    <div className="max-w-4xl w-full z-10">
      <div className="text-center mb-12">
        <h1 className="font-headline font-extrabold text-on-surface text-4xl md:text-5xl tracking-tight mb-4 leading-tight">
          How will you use <span className="text-primary">BuildTrust?</span>
        </h1>
        <p className="text-on-surface-variant text-lg max-w-lg mx-auto leading-relaxed">
          Select your primary role to customize your experience and start building connections.
        </p>
      </div>
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <button onClick={() => onNext('signupHomeowner')} className="group relative flex flex-col items-start p-8 rounded-xl bg-surface-container-lowest border-2 border-transparent hover:border-primary-container transition-all text-left shadow-sm hover:shadow-xl hover:-translate-y-1">
          <div className="w-16 h-16 rounded-lg bg-primary-fixed flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Home className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-headline font-bold text-2xl text-on-surface mb-3">I am a Homeowner</h3>
          <p className="text-on-surface-variant leading-relaxed mb-6">Find verified contractors, manage projects, and secure payments.</p>
          <div className="mt-auto flex items-center text-primary font-semibold gap-2">Get Started <ArrowRight className="w-4 h-4" /></div>
        </button>
        <button onClick={() => onNext('signupContractor')} className="group relative flex flex-col items-start p-8 rounded-xl bg-surface-container-lowest border-2 border-transparent hover:border-primary-container transition-all text-left shadow-sm hover:shadow-xl hover:-translate-y-1">
          <div className="w-16 h-16 rounded-lg bg-secondary-fixed flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Hammer className="w-8 h-8 text-secondary" />
          </div>
          <h3 className="font-headline font-bold text-2xl text-on-surface mb-3">I am a Contractor</h3>
          <p className="text-on-surface-variant leading-relaxed mb-6">Grow your business, find quality leads, and manage billing in one place.</p>
          <div className="mt-auto flex items-center text-secondary font-semibold gap-2">Grow Business <ArrowRight className="w-4 h-4" /></div>
        </button>
      </div>
      <div className="flex flex-col items-center gap-4">
        <p className="text-sm text-on-surface-variant font-medium">
          Already have an account? <button onClick={() => onNext('login')} className="text-primary hover:underline">Log in</button>
        </p>
      </div>
    </div>
  </main>
);

// --- Forgot Password ---
export const ForgotPasswordScreen: React.FC<{ onNext: (s: Screen) => void }> = ({ onNext }) => {
  const auth = useAuth();
  const [email, setEmail] = React.useState('');
  const [error, setError] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await auth.forgotPassword(email);
      onNext('verification');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send reset link. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col">
      <header className="bg-surface flex justify-between items-center px-6 py-4 w-full h-16 sticky top-0 z-50">
        <button onClick={() => onNext('login')} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors"><ArrowLeft className="w-6 h-6 text-primary" /></button>
        <h1 className="font-headline font-bold text-lg tracking-tight text-on-surface">Forgot Password</h1>
        <HelpCircle className="w-6 h-6 text-outline" />
      </header>
      <div className="flex-grow flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-secondary-fixed mb-6">
              <Lock className="w-10 h-10 text-on-secondary-fixed" />
            </div>
            <h2 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface mb-3">Reset your password</h2>
            <p className="text-on-surface-variant font-body leading-relaxed">Enter your email to receive a password reset link.</p>
          </div>
          <Card className="p-8">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <Input label="Email Address" icon={<Mail className="w-5 h-5" />} placeholder="contractor@buildtrust.com" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
              <Button fullWidth type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Sending…' : <><span>Send Link</span> <Send className="w-5 h-5" /></>}
              </Button>
            </form>
            <div className="mt-8 pt-6 border-t border-surface-container flex flex-col items-center gap-4">
              <button onClick={() => onNext('login')} className="text-primary font-semibold hover:underline">Back to Login</button>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
};

// --- Signup Homeowner ---
export const SignupHomeownerScreen: React.FC<{ onNext: (s: Screen) => void }> = ({ onNext }) => {
  const auth = useAuth();
  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    const parts = fullName.trim().split(/\s+/);
    const firstName = parts[0] ?? fullName;
    const lastName = parts.slice(1).join(' ') || 'User';
    try {
      await auth.register({ email, password, firstName, lastName, phone: phone || undefined, role: 'buyer_seller' });
      onNext('verification');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
  <main className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
    <div className="absolute inset-0 blueprint-grid pointer-events-none"></div>
    <Card className="w-full max-w-[1100px] grid md:grid-cols-2 overflow-hidden relative z-10">
      <div className="hidden md:flex flex-col justify-between p-12 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <img className="w-full h-full object-cover" src="https://picsum.photos/seed/arch2/1000/1000" alt="arch" referrerPolicy="no-referrer" />
        </div>
        <div className="relative z-10">
          <h1 className="font-headline font-extrabold text-white text-4xl leading-tight tracking-tight">
            Build with <br/><span className="text-primary-fixed">Confidence.</span>
          </h1>
          <p className="mt-6 text-on-primary-container font-body text-lg leading-relaxed max-w-sm">
            Join the community of homeowners who prioritize structural integrity and transparent craftsmanship.
          </p>
        </div>
        <div className="relative z-10 space-y-8">
          <div className="flex items-start gap-4">
            <div className="bg-white/10 p-3 rounded-xl backdrop-blur-md">
              <Verified className="text-primary-fixed" />
            </div>
            <div>
              <p className="font-headline font-bold text-white">Vetted Contractors</p>
              <p className="text-on-primary-container text-sm">Every professional is background-checked.</p>
            </div>
          </div>
        </div>
      </div>
      <div className="p-8 md:p-12 flex flex-col justify-center">
        <div className="mb-8">
          <h2 className="font-headline font-bold text-2xl text-on-surface">Create Account</h2>
          <p className="text-on-surface-variant text-sm mt-1">Start your home renovation journey today.</p>
        </div>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <Input label="FULL NAME" placeholder="Johnathan Doe" value={fullName} onChange={e => setFullName(e.target.value)} required />
          <Input label="EMAIL ADDRESS" placeholder="john@example.com" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="PHONE" placeholder="+1 (555) 000" type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
            <Input label="PASSWORD" placeholder="••••••••" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <div className="flex items-center gap-3 py-2">
            <input type="checkbox" className="w-5 h-5 rounded border-outline-variant text-primary" required />
            <label className="text-sm text-on-surface-variant font-body">
              I agree to the <span className="text-primary font-semibold">Terms of Service</span> and <span className="text-primary font-semibold">Privacy Policy</span>.
            </label>
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <Button fullWidth type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating account…' : 'Sign Up'}</Button>
        </form>
        <p className="mt-8 text-center text-on-surface-variant text-sm">
          Already have an account? <button onClick={() => onNext('login')} className="text-primary font-bold hover:underline">Log In</button>
        </p>
      </div>
    </Card>
  </main>
  );
};

// --- Signup Contractor ---
export const SignupContractorScreen: React.FC<{ onNext: (s: Screen) => void }> = ({ onNext }) => {
  const auth = useAuth();
  const [businessName, setBusinessName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    const parts = businessName.trim().split(/\s+/);
    const firstName = parts[0] ?? businessName;
    const lastName = parts.slice(1).join(' ') || 'Contractor';
    try {
      await auth.register({ email, password, firstName, lastName, role: 'contractor' });
      onNext('verification');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
  <main className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
    <div className="absolute inset-0 blueprint-grid pointer-events-none"></div>
    <Card className="w-full max-w-[1100px] grid md:grid-cols-2 overflow-hidden relative z-10">
      <div className="hidden md:flex flex-col justify-between p-12 bg-secondary relative overflow-hidden text-white">
        <div className="absolute inset-0 opacity-10">
          <img className="w-full h-full object-cover" src="https://picsum.photos/seed/hammer/1000/1000" alt="hammer" referrerPolicy="no-referrer" />
        </div>
        <div className="relative z-10">
          <h1 className="font-headline font-extrabold text-4xl leading-tight tracking-tight">
            Grow your <br/><span className="text-secondary-fixed">Business.</span>
          </h1>
          <p className="mt-6 text-on-secondary-container font-body text-lg leading-relaxed max-w-sm">
            Access quality leads, manage your team, and get paid faster with our integrated escrow system.
          </p>
        </div>
        <div className="relative z-10 space-y-8">
          <div className="flex items-start gap-4">
            <div className="bg-white/10 p-3 rounded-xl backdrop-blur-md">
              <Shield className="text-secondary-fixed" />
            </div>
            <div>
              <p className="font-headline font-bold text-white">Verified Leads</p>
              <p className="text-on-secondary-container text-sm">Connect with homeowners ready to start.</p>
            </div>
          </div>
        </div>
      </div>
      <div className="p-8 md:p-12 flex flex-col justify-center">
        <div className="mb-8">
          <h2 className="font-headline font-bold text-2xl text-on-surface">Contractor Registration</h2>
          <p className="text-on-surface-variant text-sm mt-1">Join the network of elite professionals.</p>
        </div>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <Input label="BUSINESS NAME" placeholder="Smith & Sons Carpentry" value={businessName} onChange={e => setBusinessName(e.target.value)} required />
          <Input label="BUSINESS EMAIL" placeholder="contact@smithandsons.com" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="LICENSE #" placeholder="LIC-123456" disabled />
            <Input label="PASSWORD" placeholder="••••••••" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <div className="flex items-center gap-3 py-2">
            <input type="checkbox" className="w-5 h-5 rounded border-outline-variant text-secondary" required />
            <label className="text-sm text-on-surface-variant font-body">
              I agree to the <span className="text-secondary font-semibold">Contractor Terms</span> and <span className="text-secondary font-semibold">Privacy Policy</span>.
            </label>
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <Button fullWidth type="submit" disabled={isSubmitting} className="bg-secondary hover:bg-secondary/90">{isSubmitting ? 'Registering…' : 'Register Business'}</Button>
        </form>
        <p className="mt-8 text-center text-on-surface-variant text-sm">
          Already have an account? <button onClick={() => onNext('login')} className="text-secondary font-bold hover:underline">Log In</button>
        </p>
      </div>
    </Card>
  </main>
  );
};

// --- Verification ---
export const VerificationScreen: React.FC<{ onNext: (s: Screen) => void }> = ({ onNext }) => (
  <main className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
    <div className="absolute inset-0 blueprint-grid pointer-events-none"></div>
    <div className="w-full max-w-lg relative">
      <Card className="p-8 md:p-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 blue-gradient"></div>
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="w-16 h-16 bg-secondary-fixed rounded-2xl flex items-center justify-center mb-2">
            <Shield className="text-primary w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="font-headline font-extrabold text-3xl tracking-tight text-on-surface">Secure Verification</h1>
            <p className="text-on-surface-variant leading-relaxed">Enter the 6-digit code sent to your email</p>
          </div>
          <div className="flex gap-2 md:gap-4 justify-center w-full py-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <input key={i} className="w-12 h-16 md:w-16 md:h-20 text-center text-2xl font-headline font-bold rounded-xl bg-surface-container-highest border-none focus:ring-2 focus:ring-primary/30 outline-none" maxLength={1} placeholder="·" />
            ))}
          </div>
          <Button fullWidth onClick={() => onNext('success')}>Verify Identity</Button>
        </div>
      </Card>
    </div>
  </main>
);

// --- Success ---
export const SuccessScreen: React.FC<{ onNext: (s: Screen) => void }> = ({ onNext }) => (
  <main className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden">
    <div className="absolute inset-0 blueprint-grid pointer-events-none"></div>
    <div className="relative z-10 w-full max-w-[560px]">
      <Card className="p-10 md:p-16 text-center overflow-hidden">
        <div className="relative mb-12 flex justify-center">
          <div className="relative w-28 h-28 bg-primary rounded-xl flex items-center justify-center transform rotate-3 shadow-lg">
            <div className="bg-surface-container-lowest w-20 h-20 rounded-lg flex items-center justify-center transform -rotate-3">
              <CheckCircle className="text-primary w-12 h-12" />
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <h1 className="font-headline font-extrabold text-4xl md:text-5xl text-on-surface tracking-tighter leading-tight">Welcome to BuildTrust!</h1>
          <p className="text-on-surface-variant text-lg leading-relaxed max-w-sm mx-auto">Your account has been successfully created. Ready to start building?</p>
        </div>
        <div className="mt-12 space-y-4">
          <Button fullWidth onClick={() => onNext('home')}>Go to Dashboard <ArrowRight className="w-5 h-5" /></Button>
          <p className="text-on-surface-variant/60 font-label text-sm">Redirecting to your workspace in 5 seconds...</p>
        </div>
      </Card>
    </div>
  </main>
);

