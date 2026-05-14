// @ts-nocheck
"use client"
import { useState } from 'react';
import { viewingActionsApi } from '@/lib/api-client';
import { getAccessToken } from '@/lib/auth-session';
import {
  User,
  Mail,
  Phone,
  Home,
  CheckCircle2,
  X,
  MessageSquare,
  Users,
  DollarSign,
  Calendar,
} from 'lucide-react';

interface SignInData {
  name: string;
  email: string;
  phone: string;
  interest: string;
  priceRange: string;
  timeframe: string;
  workingWithAgent: string;
  consent: boolean;
}

const initialData: SignInData = {
  name: '',
  email: '',
  phone: '',
  interest: '',
  priceRange: '',
  timeframe: '',
  workingWithAgent: '',
  consent: false,
};

export function TabletSignIn({ onClose, openHouseId }: { onClose: () => void; openHouseId: string }) {
  const [formData, setFormData] = useState<SignInData>(initialData);
  const [currentStep, setCurrentStep] = useState<'signin' | 'questions' | 'success'>('signin');
  const [errors, setErrors] = useState<Partial<SignInData>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const updateField = (field: keyof SignInData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateSignIn = () => {
    const newErrors: Partial<SignInData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validateSignIn()) {
      setCurrentStep('questions');
    }
  };

  const handleSubmit = async () => {
    const token = getAccessToken();
    if (!openHouseId) {
      setCurrentStep('success');
      setTimeout(() => { setFormData(initialData); setCurrentStep('signin'); }, 3000);
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await viewingActionsApi.agentRegisterGuest(token, openHouseId, {
        guestName: formData.name,
        guestEmail: formData.email || undefined,
        guestPhone: formData.phone || undefined,
        interestLevel: formData.interest || undefined,
      });
      setCurrentStep('success');
      setTimeout(() => { setFormData(initialData); setCurrentStep('signin'); }, 3000);
    } catch (err: any) {
      setSubmitError(err?.message ?? 'Sign-in failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkipQuestions = () => {
    setCurrentStep('success');

    // Auto-reset after 3 seconds
    setTimeout(() => {
      setFormData(initialData);
      setCurrentStep('signin');
    }, 3000);
  };

  if (currentStep === 'success') {
    return <SuccessScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-8">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Home className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-semibold text-slate-900 mb-3">
            {currentStep === 'signin' ? 'Welcome!' : 'Just a Few Questions'}
          </h1>
          <p className="text-xl text-slate-600">
            {currentStep === 'signin'
              ? 'Please sign in to explore this beautiful property'
              : 'Help us understand your needs (optional)'}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 sm:p-12">
          {submitError && (
            <div className="flex items-center gap-2 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 mb-6">
              <span className="text-sm">{submitError}</span>
            </div>
          )}
          {currentStep === 'signin' ? (
            <SignInForm
              formData={formData}
              errors={errors}
              updateField={updateField}
              onContinue={handleContinue}
            />
          ) : (
            <QuestionsForm
              formData={formData}
              updateField={updateField}
              onSubmit={handleSubmit}
              onSkip={handleSkipQuestions}
              onBack={() => setCurrentStep('signin')}
              submitting={submitting}
            />
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-slate-500">
            By signing in, you agree to receive updates about this property
          </p>
        </div>

        {/* Admin Close Button */}
        <button
          onClick={onClose}
          className="fixed top-4 right-4 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-slate-50 transition-colors"
        >
          <X className="w-6 h-6 text-slate-600" />
        </button>
      </div>
    </div>
  );
}

function SignInForm({
  formData,
  errors,
  updateField,
  onContinue,
}: {
  formData: SignInData;
  errors: Partial<SignInData>;
  updateField: (field: keyof SignInData, value: string) => void;
  onContinue: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Name */}
      <div>
        <label className="flex items-center gap-3 text-lg font-medium text-slate-900 mb-3">
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
            <User className="w-5 h-5 text-slate-700" />
          </div>
          Full Name
        </label>
        <input
          type="text"
          placeholder="Enter your name"
          value={formData.name}
          onChange={(e) => updateField('name', e.target.value)}
          className={`w-full px-6 py-5 text-lg border-2 rounded-2xl focus:outline-none transition-colors ${
            errors.name
              ? 'border-rose-300 focus:border-rose-500'
              : 'border-slate-200 focus:border-slate-900'
          }`}
          autoComplete="name"
        />
        {errors.name && <p className="text-rose-600 mt-2 ml-2">{errors.name}</p>}
      </div>

      {/* Email */}
      <div>
        <label className="flex items-center gap-3 text-lg font-medium text-slate-900 mb-3">
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
            <Mail className="w-5 h-5 text-slate-700" />
          </div>
          Email Address
        </label>
        <input
          type="email"
          placeholder="your.email@example.com"
          value={formData.email}
          onChange={(e) => updateField('email', e.target.value)}
          className={`w-full px-6 py-5 text-lg border-2 rounded-2xl focus:outline-none transition-colors ${
            errors.email
              ? 'border-rose-300 focus:border-rose-500'
              : 'border-slate-200 focus:border-slate-900'
          }`}
          autoComplete="email"
        />
        {errors.email && <p className="text-rose-600 mt-2 ml-2">{errors.email}</p>}
      </div>

      {/* Phone */}
      <div>
        <label className="flex items-center gap-3 text-lg font-medium text-slate-900 mb-3">
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
            <Phone className="w-5 h-5 text-slate-700" />
          </div>
          Phone Number
        </label>
        <input
          type="tel"
          placeholder="(123) 456-7890"
          value={formData.phone}
          onChange={(e) => updateField('phone', e.target.value)}
          className={`w-full px-6 py-5 text-lg border-2 rounded-2xl focus:outline-none transition-colors ${
            errors.phone
              ? 'border-rose-300 focus:border-rose-500'
              : 'border-slate-200 focus:border-slate-900'
          }`}
          autoComplete="tel"
        />
        {errors.phone && <p className="text-rose-600 mt-2 ml-2">{errors.phone}</p>}
      </div>

      {/* Submit Button */}
      <button
        onClick={onContinue}
        className="w-full py-6 bg-slate-900 text-white rounded-2xl text-xl font-semibold hover:bg-slate-800 transition-colors mt-8"
      >
        Continue
      </button>
    </div>
  );
}

function QuestionsForm({
  formData,
  updateField,
  onSubmit,
  onSkip,
  onBack,
  submitting,
}: {
  formData: SignInData;
  updateField: (field: keyof SignInData, value: string) => void;
  onSubmit: () => void;
  onSkip: () => void;
  onBack: () => void;
  submitting?: boolean;
}) {
  return (
    <div className="space-y-6">
      {/* Property Interest */}
      <div>
        <label className="flex items-center gap-3 text-lg font-medium text-slate-900 mb-3">
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
            <Home className="w-5 h-5 text-slate-700" />
          </div>
          What brings you here today?
        </label>
        <div className="grid grid-cols-2 gap-3">
          {['Looking to buy', 'Just browsing', 'Investor', 'Relocating'].map((option) => (
            <button
              key={option}
              onClick={() => updateField('interest', option)}
              className={`px-6 py-4 rounded-xl text-base font-medium transition-all ${
                formData.interest === option
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <label className="flex items-center gap-3 text-lg font-medium text-slate-900 mb-3">
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-slate-700" />
          </div>
          What's your price range?
        </label>
        <div className="grid grid-cols-2 gap-3">
          {['Under $500K', '$500K - $1M', '$1M - $2M', 'Over $2M'].map((option) => (
            <button
              key={option}
              onClick={() => updateField('priceRange', option)}
              className={`px-6 py-4 rounded-xl text-base font-medium transition-all ${
                formData.priceRange === option
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {/* Timeframe */}
      <div>
        <label className="flex items-center gap-3 text-lg font-medium text-slate-900 mb-3">
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
            <Calendar className="w-5 h-5 text-slate-700" />
          </div>
          When are you looking to buy?
        </label>
        <div className="grid grid-cols-2 gap-3">
          {['Immediately', '1-3 months', '3-6 months', '6+ months'].map((option) => (
            <button
              key={option}
              onClick={() => updateField('timeframe', option)}
              className={`px-6 py-4 rounded-xl text-base font-medium transition-all ${
                formData.timeframe === option
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {/* Working with Agent */}
      <div>
        <label className="flex items-center gap-3 text-lg font-medium text-slate-900 mb-3">
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-slate-700" />
          </div>
          Are you working with an agent?
        </label>
        <div className="grid grid-cols-3 gap-3">
          {['Yes', 'No', 'Not sure'].map((option) => (
            <button
              key={option}
              onClick={() => updateField('workingWithAgent', option)}
              className={`px-6 py-4 rounded-xl text-base font-medium transition-all ${
                formData.workingWithAgent === option
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mt-8">
        <button
          onClick={onBack}
          className="flex-1 py-5 bg-slate-100 text-slate-700 rounded-2xl text-lg font-semibold hover:bg-slate-200 transition-colors"
        >
          Back
        </button>
        <button
          onClick={onSkip}
          className="flex-1 py-5 bg-slate-100 text-slate-700 rounded-2xl text-lg font-semibold hover:bg-slate-200 transition-colors"
        >
          Skip
        </button>
        <button
          onClick={onSubmit}
          disabled={submitting}
          className="flex-1 py-5 bg-slate-900 text-white rounded-2xl text-lg font-semibold hover:bg-slate-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? 'Submitting...' : 'Submit'}
        </button>
      </div>
    </div>
  );
}

function SuccessScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-8">
      <div className="text-center">
        <div className="w-32 h-32 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-[bounce_1s_ease-in-out]">
          <CheckCircle2 className="w-16 h-16 text-white" />
        </div>
        <h1 className="text-5xl font-semibold text-slate-900 mb-4">Thank You!</h1>
        <p className="text-2xl text-slate-600 mb-3">Your information has been recorded</p>
        <p className="text-xl text-slate-500">
          Feel free to explore the property and ask any questions
        </p>

        {/* Auto-reset indicator */}
        <div className="mt-12">
          <div className="w-48 h-2 bg-slate-200 rounded-full overflow-hidden mx-auto">
            <div className="h-full bg-emerald-500 rounded-full animate-[shrink_3s_linear]" style={{ width: '100%' }} />
          </div>
          <p className="text-sm text-slate-400 mt-3">Resetting in 3 seconds...</p>
        </div>
      </div>

      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}
