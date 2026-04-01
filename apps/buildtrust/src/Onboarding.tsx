import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Star, Verified, Shield, History, CheckCircle, HelpCircle, Search, Hammer, MessageSquare, User } from 'lucide-react';
import { Button, Input, Card } from './components/UI';
import { Screen, Review, Project, PriceItem } from './types';

// --- Onboarding 1 ---
export const Onboarding1: React.FC<{ onNext: () => void; onSkip: () => void }> = ({ onNext, onSkip }) => (
  <main className="min-h-screen flex flex-col items-center justify-center p-6">
    <Card className="w-full max-w-md overflow-hidden flex flex-col items-center">
      <div className="w-full aspect-square relative bg-surface-container-low overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="relative w-full h-full bg-surface-container-highest rounded-2xl overflow-hidden shadow-sm">
            <img 
              className="w-full h-full object-cover grayscale-[20%] brightness-105" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDRd1o9Yx9LyZ3t_iNlcf64woEyi_dp9ae8cYXkCcbp2HO14GycfXVuDy_2hN7x1gRJ1WSlC80lLcr-Q-3Jl86a6xt36f6jhC-BPq9KXJWMlWUvqJAC5T_2qS_uP-FgvPQ8gfMEJbJT0B7G9FLJrG10uXUKYpc2fZFGdObI4awqPGvECvPXcETJgiTgFQNkrQLvj6xNfmgT8NB_o-4GjBUv9uWSiU6o9LM8vqMH87L6mn_h3y_wJXXeMT_gaXcK_sZGPqoHxHSsGeE" 
              alt="Contractor"
              referrerPolicy="no-referrer"
            />
            <div className="absolute bottom-6 right-6 bg-surface-container-lowest/90 backdrop-blur-xl p-4 rounded-xl shadow-lg flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary">
                <Verified className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[10px] font-label font-bold text-primary uppercase tracking-wider">Verified Pro</div>
                <div className="text-sm font-headline font-bold text-on-surface">Mark Stevenson</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="p-8 md:p-10 w-full text-center flex flex-col items-center">
        <h1 className="font-headline font-extrabold text-3xl text-on-surface tracking-tight mb-4">Find Trusted Pros</h1>
        <p className="font-body text-on-surface-variant leading-relaxed text-lg max-w-xs mb-10">
          Connect with verified contractors and get your home projects done with architectural precision.
        </p>
        <div className="flex gap-2.5 mb-10">
          <div className="w-8 h-2.5 rounded-full bg-primary-container"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-surface-container-highest"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-surface-container-highest"></div>
        </div>
        <Button fullWidth onClick={onNext}>
          Next <ArrowRight className="w-5 h-5" />
        </Button>
        <button onClick={onSkip} className="mt-6 text-on-surface-variant font-label font-semibold hover:text-primary transition-colors py-2 px-4">
          Skip onboarding
        </button>
      </div>
    </Card>
  </main>
);

// --- Onboarding 2 ---
export const Onboarding2: React.FC<{ onNext: () => void; onBack: () => void }> = ({ onNext, onBack }) => (
  <main className="min-h-screen flex flex-col items-center justify-between px-6 py-12 md:max-w-4xl md:mx-auto">
    <div className="relative w-full aspect-square md:aspect-[16/9] flex items-center justify-center mt-8">
      <div className="absolute inset-0 bg-surface-container-low rounded-2xl transform -rotate-1 scale-95 opacity-50"></div>
      <Card className="relative z-10 w-full h-full p-4 md:p-8 flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/2 flex flex-col justify-center space-y-6">
          <div className="space-y-2">
            <span className="text-primary font-headline font-extrabold tracking-tighter text-sm uppercase">Active Project</span>
            <h3 className="font-headline font-bold text-2xl text-on-surface">Modern Kitchen Remodel</h3>
          </div>
          <div className="bg-surface-container-low p-6 rounded-lg space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-on-surface-variant">Progress</span>
              <span className="text-sm font-bold text-primary">85%</span>
            </div>
            <div className="h-3 w-full bg-surface-container-highest rounded-full overflow-hidden">
              <div className="h-full blue-gradient rounded-full w-[85%]"></div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <CheckCircle className="w-5 h-5 text-primary" />
              <span className="text-sm text-on-surface-variant font-medium">Cabinetry Installation Complete</span>
            </div>
          </div>
          <div className="flex -space-x-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-10 h-10 rounded-full border-2 border-surface-container-lowest bg-surface-container-highest overflow-hidden">
                <img src={`https://picsum.photos/seed/user${i}/100/100`} alt="user" referrerPolicy="no-referrer" />
              </div>
            ))}
            <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center border-2 border-surface-container-lowest">
              <span className="text-[10px] font-bold text-on-secondary-container">+4</span>
            </div>
          </div>
        </div>
        <div className="hidden md:flex w-1/2 relative">
          <img 
            className="w-full h-full object-cover rounded-lg" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBpd8sZbvis3yAypRJCci_6XFU-xRH4vcCvM0sYYLv_h4drGwVxN9GVp2eRaix3Z9vG8R-S7NTC5Q8TxLSqOxvyQShLecvFaosPVI-QKjEAVBxaba1C1Jw9TVqyoBTmwazaIfsc16TjRAXrvqMCUloOUuufG5mvpLHjaElAtEDuXJef4wER418NDsrC3zkmiXst7qAK72iBTpq3-JhTMc8pLs4zNctIAlSEiDvCsIiyy_c0GAQSHalhJk4fKo61_-yt0hsNLo33nG8" 
            alt="Kitchen"
            referrerPolicy="no-referrer"
          />
        </div>
      </Card>
    </div>
    <div className="w-full max-w-lg text-center mt-12 mb-8">
      <h1 className="font-headline font-extrabold text-4xl text-on-surface tracking-tight mb-6 leading-tight">Track Your Projects</h1>
      <p className="font-body text-lg text-on-surface-variant leading-relaxed px-4">
        Monitor real-time milestones, review high-resolution photo updates, and manage approvals—all from your personalized dashboard.
      </p>
    </div>
    <div className="w-full flex flex-col items-center gap-8 mb-4">
      <div className="flex gap-3">
        <div className="h-1.5 w-6 bg-surface-container-highest rounded-full"></div>
        <div className="h-1.5 w-12 blue-gradient rounded-full"></div>
        <div className="h-1.5 w-6 bg-surface-container-highest rounded-full"></div>
      </div>
      <div className="w-full flex items-center justify-between">
        <button onClick={onBack} className="px-8 py-4 font-headline font-bold text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-2">
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
        <Button onClick={onNext}>
          Next <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  </main>
);

// --- Onboarding 3 ---
export const Onboarding3: React.FC<{ onNext: () => void }> = ({ onNext }) => (
  <main className="min-h-screen flex flex-col items-center justify-center p-6">
    <header className="fixed top-0 left-0 w-full flex justify-between items-center px-6 py-4 h-16 bg-surface">
      <div className="text-primary font-headline font-extrabold tracking-tighter text-lg">BuildTrust</div>
      <HelpCircle className="w-6 h-6 text-outline" />
    </header>
    <div className="w-full max-w-lg flex flex-col items-center text-center">
      <div className="relative w-full aspect-square max-w-[400px] mb-12 flex items-center justify-center">
        <div className="absolute inset-0 bg-secondary-fixed opacity-20 rounded-full blur-3xl scale-90"></div>
        <Card className="relative z-10 w-full h-full p-8">
          <div className="w-full h-full rounded-xl bg-surface-container-low flex flex-col items-center justify-center relative overflow-hidden">
            <img 
              className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-60" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC-J1RJrOIL056F-DvJ0zWCnE68dajYBBwCSV9CCFegnOnHa1dVnjh6dxlqgI_P5zqc-hKv7T1O0kErmlayTiFaqUD_hF2qgx8JgPR0zBZ-9l8KD_iYgeIgQotWgGZhIdXdHZccePRxA_eVQNab7s3NoTtjPetEff-vJ8rXluzDJFSLsg9Zq0OnssKTbA99rc-HeA3b2DStt_eofAppDKF8ekUr5IwXv7F6d6hfo6wMCgE4gqfe-wuq9JzIxX_BQeYlSccVuCok3PY" 
              alt="Handshake"
              referrerPolicy="no-referrer"
            />
            <div className="relative z-20 flex flex-col items-center">
              <div className="w-20 h-20 bg-primary-container text-on-primary-container rounded-2xl flex items-center justify-center shadow-lg mb-6">
                <Shield className="w-10 h-10" />
              </div>
              <div className="flex gap-4">
                <div className="h-2 w-12 bg-primary rounded-full"></div>
                <div className="h-2 w-12 bg-primary rounded-full"></div>
                <div className="h-2 w-12 bg-primary rounded-full"></div>
              </div>
            </div>
          </div>
        </Card>
      </div>
      <div className="space-y-4 mb-12">
        <h1 className="font-headline font-bold text-3xl text-on-surface tracking-tight">Secure Payments</h1>
        <p className="font-body text-on-surface-variant text-lg leading-relaxed max-w-sm mx-auto">
          Funds are held in escrow and only released when you're 100% satisfied with the milestone completion.
        </p>
      </div>
      <div className="w-full flex flex-col items-center gap-8">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-outline-variant"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-outline-variant"></span>
          <div className="relative">
            <span className="absolute inset-0 bg-primary opacity-20 rounded-full animate-ping"></span>
            <span className="relative block w-3.5 h-3.5 rounded-full bg-primary shadow-sm"></span>
          </div>
        </div>
        <Button fullWidth onClick={onNext}>
          Get Started <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  </main>
);

// --- Terms ---
export const TermsScreen: React.FC<{ onNext: () => void; onDecline: () => void }> = ({ onNext, onDecline }) => (
  <main className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8">
    <header className="w-full max-w-4xl flex justify-between items-center px-6 py-4 h-16 bg-surface fixed top-0 z-50">
      <div className="flex items-center gap-3">
        <ArrowLeft className="text-primary w-6 h-6" />
        <span className="font-headline font-extrabold tracking-tighter text-primary text-lg">BuildTrust</span>
      </div>
      <HelpCircle className="w-6 h-6 text-outline" />
    </header>
    <main className="w-full max-w-4xl mt-20 mb-28">
      <section className="mb-10 px-4 md:px-0">
        <h1 className="font-headline text-4xl md:text-5xl font-extrabold text-on-surface tracking-tight mb-4 leading-tight">
          Terms of Service <br/><span className="text-primary-container">for Professionals</span>
        </h1>
        <p className="font-body text-on-surface-variant text-lg max-w-2xl leading-relaxed">
          Please review our updated agreements.
        </p>
      </section>
      <Card className="relative overflow-hidden">
        <div className="h-[400px] overflow-y-auto px-8 md:px-12 py-10 hide-scrollbar">
          <div className="space-y-8 font-body text-on-surface leading-relaxed">
            <div className="space-y-4">
              <h2 className="font-headline text-xl font-bold text-on-surface">1. Introduction</h2>
              <p>Welcome to BuildTrust. By accessing or using our platform, you agree to be bound by these Terms and Conditions.</p>
            </div>
            <div className="space-y-4">
              <h2 className="font-headline text-xl font-bold text-on-surface">2. Service Provider Standards</h2>
              <p>All service providers on BuildTrust must maintain the highest levels of professional integrity.</p>
            </div>
          </div>
        </div>
      </Card>
      <div className="mt-8 flex items-start gap-4 px-4 md:px-0">
        <input type="checkbox" className="w-5 h-5 rounded-lg border-outline-variant text-primary-container" id="terms-check" />
        <label className="font-body text-sm text-on-surface-variant leading-snug cursor-pointer" htmlFor="terms-check">
          I have read and agree to the BuildTrust Terms and Conditions.
        </label>
      </div>
    </main>
    <footer className="fixed bottom-0 left-0 w-full glass-effect border-t border-outline-variant/10 px-6 py-6 md:py-8 z-50">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex w-full md:w-auto gap-4">
          <button onClick={onDecline} className="flex-1 md:flex-none px-10 py-4 font-headline font-bold text-on-surface-variant hover:bg-surface-container-high rounded-lg">Decline</button>
          <Button onClick={onNext} className="flex-1 md:flex-none px-12">Accept & Continue</Button>
        </div>
      </div>
    </footer>
  </main>
);

