import React from 'react';
import { ChevronLeft, Mic, MicOff, Check, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Screen } from '../types';

interface VoiceInputScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const VoiceInputScreen: React.FC<VoiceInputScreenProps> = ({ onNavigate }) => {
  const [isRecording, setIsRecording] = React.useState(false);
  const [transcription, setTranscription] = React.useState('');
  const [isProcessing, setIsProcessing] = React.useState(false);

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      setIsProcessing(true);
      // Simulate transcription delay
      setTimeout(() => {
        setTranscription("I'm looking to remodel my master bathroom. It's about 100 square feet. I want to replace the old tile with marble, add a double vanity with a quartz countertop, and install a walk-in shower with a glass enclosure. I'm hoping to start in about two months and my budget is around $15,000.");
        setIsProcessing(false);
      }, 2000);
    } else {
      setIsRecording(true);
      setTranscription('');
    }
  };

  return (
    <div className="min-h-screen bg-white pb-12 flex flex-col">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onNavigate('createProject')}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold tracking-tight">Voice Input</h1>
        </div>
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
          <Mic size={20} />
        </div>
      </header>

      <div className="flex-1 px-6 flex flex-col items-center justify-center space-y-12">
        {/* Recording Animation */}
        <div className="relative">
          <AnimatePresence>
            {isRecording && (
              <>
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 2.5, opacity: 0 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
                  className="absolute inset-0 bg-blue-500 rounded-full blur-xl"
                />
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 2, opacity: 0 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 2, delay: 0.5, ease: "easeOut" }}
                  className="absolute inset-0 bg-blue-400 rounded-full blur-lg"
                />
              </>
            )}
          </AnimatePresence>
          
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleRecording}
            className={`w-32 h-32 rounded-full flex items-center justify-center relative z-10 transition-all duration-500 ${isRecording ? 'bg-red-500 text-white scale-110 shadow-2xl shadow-red-200' : 'bg-blue-600 text-white shadow-2xl shadow-blue-200'}`}
          >
            {isRecording ? <MicOff size={40} /> : <Mic size={40} />}
          </motion.button>
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold">{isRecording ? 'Listening...' : transcription ? 'Transcription Ready' : 'Tap to Start'}</h2>
          <p className="text-sm text-gray-400 max-w-[280px] mx-auto">
            {isRecording ? 'Speak clearly about your project goals, budget, and timeline.' : transcription ? 'Review the transcription below and confirm.' : 'Speak naturally about your project vision.'}
          </p>
        </div>

        {/* Transcription Area */}
        <div className="w-full min-h-[240px] bg-gray-50 rounded-[2.5rem] p-8 border border-gray-100 relative overflow-hidden shadow-inner">
          {isProcessing ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-white/90 backdrop-blur-md z-10">
              <div className="relative">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                  className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles size={16} className="text-blue-600" />
                </div>
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 animate-pulse">Analyzing Audio...</p>
            </div>
          ) : transcription ? (
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-gray-700 leading-relaxed text-lg font-medium italic"
            >
              "{transcription}"
            </motion.p>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-300 gap-4 py-8">
              <div className="w-16 h-16 rounded-3xl bg-white shadow-sm flex items-center justify-center">
                <Sparkles size={32} />
              </div>
              <p className="text-sm font-bold uppercase tracking-widest">Your vision starts here</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {transcription && !isProcessing && (
          <div className="w-full grid grid-cols-2 gap-4">
            <button 
              onClick={() => setTranscription('')}
              className="flex items-center justify-center gap-3 p-5 rounded-3xl bg-gray-50 text-gray-400 font-bold text-sm hover:bg-gray-100 transition-all active:scale-95"
            >
              <X size={20} /> Retake
            </button>
            <button 
              onClick={() => onNavigate('aiBuilder')}
              className="flex items-center justify-center gap-3 p-5 rounded-3xl bg-black text-white font-bold text-sm shadow-xl shadow-black/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              <Check size={20} /> Confirm
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
