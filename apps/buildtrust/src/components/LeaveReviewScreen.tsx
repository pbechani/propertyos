import React, { useState } from 'react';
import { ChevronLeft, Star, Camera, X, Send, CheckCircle2, ArrowRight, MessageSquare, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Screen } from '../types';

interface LeaveReviewScreenProps {
  onNavigate: (screen: Screen) => void;
  isEditing?: boolean;
}

export const LeaveReviewScreen: React.FC<LeaveReviewScreenProps> = ({ onNavigate, isEditing = false }) => {
  const [rating, setRating] = useState(isEditing ? 4 : 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [review, setReview] = useState(isEditing ? 'Great work on the kitchen remodel. Jordan was communicative throughout the entire process and delivered ahead of schedule. Highly recommend!' : '');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [images, setImages] = useState<string[]>(isEditing ? ['https://picsum.photos/seed/kitchen/400/300'] : []);

  const handleSubmit = () => {
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 flex items-center gap-4 sticky top-0 bg-white/80 backdrop-blur-md z-30 border-b border-gray-100">
        <button 
          onClick={() => onNavigate('profile')}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-bold tracking-tight">{isEditing ? 'Edit Review' : 'Leave Review'}</h1>
      </header>

      <div className="p-6 space-y-8 pb-32">
        {/* Contractor Summary */}
        <div className="bg-gray-50 rounded-[2.5rem] p-6 flex items-center gap-4">
          <img src="https://picsum.photos/seed/marco/100/100" className="w-16 h-16 rounded-2xl object-cover" alt="Marco" />
          <div>
            <h3 className="font-bold text-base">Marco Rossi</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Elite Plumbing Solutions</p>
            <div className="flex items-center gap-1 mt-1">
              <Star className="w-3 h-3 fill-black text-black" />
              <span className="text-[10px] font-bold">4.9</span>
              <span className="text-gray-300 mx-1">•</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Kitchen Remodel</span>
            </div>
          </div>
        </div>

        {/* Star Rating */}
        <div className="text-center space-y-4">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Overall Rating</label>
          <div className="flex justify-center gap-3">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                onMouseEnter={() => setHoveredRating(s)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(s)}
                className="transition-transform active:scale-90"
              >
                <Star 
                  size={40} 
                  className={`transition-colors ${
                    s <= (hoveredRating || rating) ? 'fill-black text-black' : 'text-gray-200'
                  }`} 
                />
              </button>
            ))}
          </div>
          <p className="text-sm font-bold">
            {rating === 5 ? 'Excellent!' : rating === 4 ? 'Very Good' : rating === 3 ? 'Good' : rating === 2 ? 'Fair' : rating === 1 ? 'Poor' : 'Select a rating'}
          </p>
        </div>

        {/* Review Text */}
        <div className="space-y-4">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">Your Experience</label>
          <textarea 
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="What was it like working with Marco? Mention the quality, communication, and timeline..."
            className="w-full bg-gray-50 border-none rounded-[2rem] p-6 text-sm min-h-[160px] focus:ring-2 focus:ring-black transition-all leading-relaxed"
          />
        </div>

        {/* Photo Upload */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Project Photos</label>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{images.length}/5</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            <button className="w-24 h-24 rounded-2xl bg-gray-50 flex flex-col items-center justify-center text-gray-400 hover:text-black hover:bg-gray-100 transition-all border-2 border-dashed border-gray-200 flex-shrink-0">
              <Camera size={24} />
            </button>
            {images.map((img, i) => (
              <div key={i} className="relative w-24 h-24 flex-shrink-0">
                <img src={img} className="w-full h-full rounded-2xl object-cover" alt="Review" />
                <button 
                  onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center text-red-500"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Trust Badge */}
        <div className="bg-emerald-50 rounded-2xl p-4 flex items-center gap-3">
          <ShieldCheck className="text-emerald-500" size={20} />
          <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">
            Verified Review • Your feedback helps the community
          </p>
        </div>
      </div>

      {/* Submit Button */}
      <div className="fixed bottom-[72px] left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent z-40">
        <button 
          onClick={handleSubmit}
          disabled={rating === 0 || review.length < 1}
          className={`w-full py-5 rounded-[2rem] font-bold text-sm flex items-center justify-center gap-2 shadow-xl transition-all ${
            rating > 0 && review.length >= 1 ? 'bg-black text-white shadow-black/10 hover:scale-[1.02] active:scale-[0.98]' : 'bg-gray-100 text-gray-300'
          }`}
        >
          <Send size={18} /> {isEditing ? 'Update Review' : 'Submit Review'}
        </button>
      </div>

      {/* Success Overlay */}
      <AnimatePresence>
        {isSubmitted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-[3rem] p-12 text-center space-y-6 max-w-sm w-full shadow-2xl"
            >
              <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center text-white mx-auto shadow-xl shadow-emerald-200">
                <CheckCircle2 size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold tracking-tight">Review Submitted</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Thank you for sharing your experience! Your review has been published to Marco's profile.
                </p>
              </div>
              <button 
                onClick={() => onNavigate('profile')}
                className="w-full py-4 bg-black text-white rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2"
              >
                Back to Profile <ArrowRight size={16} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
