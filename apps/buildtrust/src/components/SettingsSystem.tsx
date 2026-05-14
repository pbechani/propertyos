import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  ChevronRight, 
  User, 
  Bell, 
  Lock, 
  Globe, 
  LogOut, 
  Shield, 
  Mail, 
  Phone, 
  Smartphone, 
  Eye, 
  EyeOff,
  Check,
  AlertCircle,
  CreditCard,
  HelpCircle,
  FileText
} from 'lucide-react';
import { Screen } from '../types';
import { useAuth } from '../context/AuthContext';

interface ScreenProps {
  onNavigate: (screen: Screen) => void;
}

// --- Settings Hub (Main Menu) ---
export const SettingsHub: React.FC<ScreenProps> = ({ onNavigate }) => {
  const menuItems = [
    { id: 'accountSettings', icon: User, label: 'Account Settings', desc: 'Manage your profile and business details' },
    { id: 'notificationSettings', icon: Bell, label: 'Notifications', desc: 'Control how you receive updates' },
    { id: 'securitySettings', icon: Shield, label: 'Security', desc: 'Protect your account and data' },
    { id: 'languageSelection', icon: Globe, label: 'Language', desc: 'Choose your preferred language' },
    { id: 'paymentMethod', icon: CreditCard, label: 'Payments', desc: 'Manage your payout methods' },
    { id: 'reportIssue', icon: HelpCircle, label: 'Support', desc: 'Get help or report an issue' },
    { id: 'terms', icon: FileText, label: 'Legal', desc: 'Terms of service and privacy policy' },
  ];

  return (
    <div className="min-h-screen bg-white pb-24">
      <header className="px-6 pt-12 pb-6 space-y-2 sticky top-0 bg-white/80 backdrop-blur-md z-20">
        <div className="flex items-center gap-4">
          <button onClick={() => onNavigate('profile')} className="p-2 -ml-2 hover:bg-gray-50 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-black tracking-tighter">Settings</h1>
        </div>
      </header>

      <div className="px-6 mt-4 space-y-2">
        {menuItems.map((item, i) => (
          <motion.button
            key={item.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onNavigate(item.id as Screen)}
            className="w-full flex items-center gap-4 p-5 rounded-[2rem] hover:bg-gray-50 transition-all group border border-transparent hover:border-gray-100"
          >
            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-black group-hover:text-white transition-all">
              <item.icon size={24} />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-bold text-sm">{item.label}</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.desc}</p>
            </div>
            <ChevronRight size={20} className="text-gray-300 group-hover:text-black transition-colors" />
          </motion.button>
        ))}

        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          onClick={() => onNavigate('logout')}
          className="w-full flex items-center gap-4 p-5 rounded-[2rem] hover:bg-red-50 transition-all group mt-8"
        >
          <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all">
            <LogOut size={24} />
          </div>
          <div className="flex-1 text-left">
            <h3 className="font-bold text-sm text-red-500">Logout</h3>
            <p className="text-[10px] font-bold text-red-300 uppercase tracking-widest">Sign out of your account</p>
          </div>
        </motion.button>
      </div>
    </div>
  );
};

// --- 1. Account Settings Screen ---
export const AccountSettingsScreen: React.FC<ScreenProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-white pb-24">
      <header className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-white z-10 border-b border-gray-50">
        <button onClick={() => onNavigate('settings')} className="p-2 -ml-2 hover:bg-gray-50 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold tracking-tight">Account Settings</h1>
        <button onClick={() => onNavigate('settings')} className="text-sm font-bold text-black">Save</button>
      </header>

      <div className="px-6 mt-8 space-y-8">
        <div className="space-y-4">
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Personal Information</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Full Name</label>
              <input type="text" defaultValue="Alex Thompson" className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-black transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <input type="email" defaultValue="alex.t@thompsonbuilds.com" className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-black transition-all" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <input type="tel" defaultValue="+1 (555) 000-1234" className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-black transition-all" />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Business Details</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Company Name</label>
              <input type="text" defaultValue="Thompson Quality Builds" className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-black transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Tax ID / EIN</label>
              <input type="text" defaultValue="XX-XXXXXXX" className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-black transition-all" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 2. Notification Settings Screen ---
export const NotificationSettingsScreen: React.FC<ScreenProps> = ({ onNavigate }) => {
  const [settings, setSettings] = useState({
    push: { messages: true, jobs: true, payments: true, system: false },
    email: { newsletters: false, reports: true, marketing: false },
    sms: { urgent: true, reminders: true }
  });

  const Toggle = ({ active, onClick }: { active: boolean, onClick: () => void }) => (
    <button 
      onClick={onClick}
      className={`w-12 h-6 rounded-full p-1 transition-all duration-300 flex items-center ${active ? 'bg-black' : 'bg-gray-200'}`}
    >
      <motion.div 
        animate={{ x: active ? 24 : 0 }}
        className="w-4 h-4 bg-white rounded-full shadow-sm"
      />
    </button>
  );

  return (
    <div className="min-h-screen bg-white pb-24">
      <header className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-white z-10 border-b border-gray-50">
        <button onClick={() => onNavigate('settings')} className="p-2 -ml-2 hover:bg-gray-50 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold tracking-tight">Notifications</h1>
        <div className="w-10" />
      </header>

      <div className="px-6 mt-8 space-y-10">
        <section className="space-y-4">
          <div className="flex items-center gap-3 px-2">
            <Smartphone size={18} className="text-gray-400" />
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Push Notifications</h2>
          </div>
          <div className="bg-gray-50 rounded-[2.5rem] p-2 space-y-1">
            {[
              { key: 'messages', label: 'New Messages', desc: 'Alerts for client messages' },
              { key: 'jobs', label: 'Job Updates', desc: 'Milestones and project changes' },
              { key: 'payments', label: 'Payment Alerts', desc: 'Payouts and escrow updates' },
              { key: 'system', label: 'System Alerts', desc: 'App updates and maintenance' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-5 hover:bg-white rounded-[2rem] transition-all group">
                <div>
                  <h4 className="font-bold text-sm">{item.label}</h4>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.desc}</p>
                </div>
                <Toggle 
                  active={settings.push[item.key as keyof typeof settings.push]} 
                  onClick={() => setSettings({
                    ...settings, 
                    push: { ...settings.push, [item.key]: !settings.push[item.key as keyof typeof settings.push] }
                  })} 
                />
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3 px-2">
            <Mail size={18} className="text-gray-400" />
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email Preferences</h2>
          </div>
          <div className="bg-gray-50 rounded-[2.5rem] p-2 space-y-1">
            {[
              { key: 'reports', label: 'Weekly Reports', desc: 'Performance and earnings summary' },
              { key: 'newsletters', label: 'Newsletters', desc: 'Tips and platform news' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-5 hover:bg-white rounded-[2rem] transition-all">
                <div>
                  <h4 className="font-bold text-sm">{item.label}</h4>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.desc}</p>
                </div>
                <Toggle 
                  active={settings.email[item.key as keyof typeof settings.email]} 
                  onClick={() => setSettings({
                    ...settings, 
                    email: { ...settings.email, [item.key]: !settings.email[item.key as keyof typeof settings.email] }
                  })} 
                />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

// --- 3. Security Settings Screen ---
export const SecuritySettingsScreen: React.FC<ScreenProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-white pb-24">
      <header className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-white z-10 border-b border-gray-50">
        <button onClick={() => onNavigate('settings')} className="p-2 -ml-2 hover:bg-gray-50 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold tracking-tight">Security</h1>
        <div className="w-10" />
      </header>

      <div className="px-6 mt-8 space-y-8">
        <div className="bg-black text-white p-8 rounded-[3rem] space-y-6 shadow-xl shadow-black/20">
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center">
            <Shield size={28} className="text-emerald-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold tracking-tight">Account Protection</h3>
            <p className="text-xs text-white/50 leading-relaxed">
              Your account is currently protected with standard security. Enable 2FA for maximum protection.
            </p>
          </div>
          <button className="w-full bg-white text-black py-4 rounded-2xl font-bold text-xs uppercase tracking-widest">Enable 2FA</button>
        </div>

        <div className="space-y-4">
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Login & Recovery</h2>
          <div className="space-y-2">
            <button 
              onClick={() => onNavigate('passwordChange')}
              className="w-full flex items-center justify-between p-6 bg-gray-50 rounded-[2.5rem] hover:bg-black hover:text-white transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-white/10 group-hover:text-white">
                  <Lock size={20} />
                </div>
                <span className="font-bold text-sm">Change Password</span>
              </div>
              <ChevronRight size={20} className="text-gray-300" />
            </button>

            <button className="w-full flex items-center justify-between p-6 bg-gray-50 rounded-[2.5rem] hover:bg-black hover:text-white transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-white/10 group-hover:text-white">
                  <Smartphone size={20} />
                </div>
                <span className="font-bold text-sm">Biometric Login</span>
              </div>
              <div className="w-12 h-6 bg-gray-200 rounded-full p-1 flex items-center">
                <div className="w-4 h-4 bg-white rounded-full" />
              </div>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Active Sessions</h2>
          <div className="space-y-3">
            {[
              { device: 'iPhone 15 Pro', location: 'London, UK', status: 'Current Session' },
              { device: 'MacBook Pro 16"', location: 'London, UK', status: 'Active 2h ago' },
            ].map((session, i) => (
              <div key={i} className="p-6 bg-white rounded-[2.5rem] border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                    <Smartphone size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">{session.device}</h4>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{session.location} • {session.status}</p>
                  </div>
                </div>
                <button className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Revoke</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 4. Password Change Screen ---
export const PasswordChangeScreen: React.FC<ScreenProps> = ({ onNavigate }) => {
  const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });

  return (
    <div className="min-h-screen bg-white pb-24">
      <header className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-white z-10 border-b border-gray-50">
        <button onClick={() => onNavigate('securitySettings')} className="p-2 -ml-2 hover:bg-gray-50 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold tracking-tight">Change Password</h1>
        <div className="w-10" />
      </header>

      <div className="px-6 mt-12 space-y-8">
        <div className="text-center space-y-4 mb-12">
          <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center mx-auto text-gray-400">
            <Lock size={32} />
          </div>
          <p className="text-sm text-gray-500 leading-relaxed max-w-[240px] mx-auto">
            Choose a strong password with at least 8 characters, including numbers and symbols.
          </p>
        </div>

        <div className="space-y-6">
          {[
            { id: 'current', label: 'Current Password' },
            { id: 'new', label: 'New Password' },
            { id: 'confirm', label: 'Confirm New Password' },
          ].map((field) => (
            <div key={field.id} className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">{field.label}</label>
              <div className="relative">
                <input 
                  type={showPass[field.id as keyof typeof showPass] ? 'text' : 'password'} 
                  placeholder="••••••••"
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 pr-12 text-sm font-medium focus:ring-2 focus:ring-black transition-all" 
                />
                <button 
                  onClick={() => setShowPass({ ...showPass, [field.id]: !showPass[field.id as keyof typeof showPass] })}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-black transition-colors"
                >
                  {showPass[field.id as keyof typeof showPass] ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          ))}
        </div>

        <button 
          onClick={() => onNavigate('securitySettings')}
          className="w-full bg-black text-white py-5 rounded-[2rem] font-bold text-sm shadow-xl shadow-black/20 mt-12 transition-transform active:scale-95"
        >
          Update Password
        </button>
      </div>
    </div>
  );
};

// --- 5. Language Selection Screen ---
export const LanguageSelectionScreen: React.FC<ScreenProps> = ({ onNavigate }) => {
  const [selected, setSelected] = useState('English (UK)');
  const languages = [
    { name: 'English (UK)', flag: '🇬🇧' },
    { name: 'English (US)', flag: '🇺🇸' },
    { name: 'Español', flag: '🇪🇸' },
    { name: 'Français', flag: '🇫🇷' },
    { name: 'Deutsch', flag: '🇩🇪' },
    { name: 'Italiano', flag: '🇮🇹' },
    { name: 'Português', flag: '🇵🇹' },
  ];

  return (
    <div className="min-h-screen bg-white pb-24">
      <header className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-white z-10 border-b border-gray-50">
        <button onClick={() => onNavigate('settings')} className="p-2 -ml-2 hover:bg-gray-50 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold tracking-tight">Language</h1>
        <div className="w-10" />
      </header>

      <div className="px-6 mt-8 space-y-2">
        {languages.map((lang) => (
          <button
            key={lang.name}
            onClick={() => setSelected(lang.name)}
            className={`w-full flex items-center justify-between p-6 rounded-[2.5rem] transition-all ${
              selected === lang.name ? 'bg-black text-white shadow-xl shadow-black/10' : 'bg-gray-50 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center gap-4">
              <span className="text-2xl">{lang.flag}</span>
              <span className="font-bold text-sm">{lang.name}</span>
            </div>
            {selected === lang.name && <Check size={20} />}
          </button>
        ))}
      </div>
    </div>
  );
};

// --- 6. Logout Confirmation Screen ---
export const LogoutConfirmationScreen: React.FC<ScreenProps> = ({ onNavigate }) => {
  const auth = useAuth();

  const handleLogout = async () => {
    await auth.logout();
    onNavigate('roleSelection');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-12 max-w-xs"
      >
        <div className="relative">
          <div className="w-32 h-32 bg-red-50 rounded-[3rem] flex items-center justify-center mx-auto text-red-500">
            <LogOut size={48} />
          </div>
          <motion.div 
            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.2, 0.5] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute inset-0 bg-red-500/5 rounded-[3rem] -z-10"
          />
        </div>

        <div className="space-y-4">
          <h2 className="text-3xl font-black tracking-tighter">Logging Out?</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            Are you sure you want to log out of your account? You'll need to sign in again to access your jobs.
          </p>
        </div>

        <div className="space-y-4">
          <button 
            onClick={handleLogout}
            className="w-full bg-red-500 text-white py-5 rounded-[2rem] font-bold text-sm shadow-xl shadow-red-500/20 transition-transform active:scale-95"
          >
            Yes, Log Me Out
          </button>
          <button 
            onClick={() => onNavigate('settings')}
            className="w-full py-5 rounded-[2rem] font-bold text-sm text-gray-400 hover:text-black transition-colors"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
};
