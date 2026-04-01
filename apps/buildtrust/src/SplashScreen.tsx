import React from 'react';
import { motion } from 'motion/react';
import { DraftingCompass } from 'lucide-react';
import { Button } from './components/UI';
import { Screen } from './types';

export const SplashScreen: React.FC<{ onNext: (screen: Screen) => void }> = ({ onNext }) => {
  return (
    <main className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img 
          className="w-full h-full object-cover" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuA85tfcuyYeadZuYqoeJNeeOLNJ6kIe_vR5LOmcls_oHbwWHsNeMwoLoOrVYFeeDggOP6uP0wdIyf-DpOyJM2r7scC6XRgzHUtruawUlGP6mmwm_hg1AZ95oX8TyTS2F7aKmRxWKtgnzxke1H03UW29nw6q0we_UfYyy8gafS4CDeevdnvMDo3NkyRCe-6bY_ELAx0tDyFNKszlKYS3QZ4WyuSuZsUd8YrzIS4ZZWplmHpqiUtADZU8X-HNytMCa_NIlfKgMt9WerE" 
          alt="Architectural background"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/60 to-transparent"></div>
        <div className="absolute inset-0 blueprint-grid"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 flex flex-col items-center text-center px-6 max-w-2xl"
      >
        <div className="mb-12">
          <div className="inline-flex items-center justify-center bg-surface-container-lowest/80 backdrop-blur-xl p-6 rounded-xl shadow-lg mb-8">
            <DraftingCompass className="w-12 h-12 text-primary" />
          </div>
          <h1 className="font-headline font-extrabold text-5xl md:text-6xl text-primary tracking-tighter mb-4">
            BuildTrust
          </h1>
          <div className="w-12 h-1 bg-primary-container rounded-full mx-auto mb-8"></div>
          <p className="font-headline font-bold text-xl md:text-2xl text-on-surface leading-tight tracking-tight">
            Building Trust, One Project at a Time
          </p>
        </div>

        <div className="flex flex-col gap-4 w-full max-w-xs">
          <Button fullWidth onClick={() => onNext('onboarding1')}>
            Start Your Project
          </Button>
          <Button variant="secondary" fullWidth onClick={() => onNext('login')}>
            Find a Contractor
          </Button>
        </div>

        <div className="mt-16 flex items-center gap-8 text-on-surface-variant/60">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-widest uppercase">Vetted Pros</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-widest uppercase">Secure Pay</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-widest uppercase">Smart Contracts</span>
          </div>
        </div>
      </motion.div>
    </main>
  );
};
