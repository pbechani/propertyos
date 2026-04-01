import React from 'react';
import { ChevronLeft, Star, ThumbsUp, MessageSquare, Filter } from 'lucide-react';
import { motion } from 'motion/react';
import { Screen } from '../types';

interface ReviewsScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const ReviewsScreen: React.FC<ReviewsScreenProps> = ({ onNavigate }) => {
  const reviews = [
    { id: '1', author: 'Alexander Thompson', date: 'Feb 2026', rating: 5, content: 'Jordan is a true master of his craft. The custom library he built for us is the centerpiece of our home. His attention to detail and professionalism are unmatched.', helpful: 24, initials: 'AT', color: 'bg-blue-500' },
    { id: '2', author: 'Sarah Jenkins', date: 'Jan 2026', rating: 5, content: 'Exceptional work on our kitchen remodel. Jordan was communicative throughout the entire process and delivered ahead of schedule. Highly recommend!', helpful: 18, initials: 'SJ', color: 'bg-purple-500' },
    { id: '3', author: 'Michael Chen', date: 'Dec 2025', rating: 4, content: 'Great quality work and very reliable. Jordan is very knowledgeable and helped us make the right decisions for our project.', helpful: 12, initials: 'MC', color: 'bg-emerald-500' },
    { id: '4', author: 'Emily Davis', date: 'Nov 2025', rating: 5, content: 'The best experience we\'ve had with a contractor. Jordan is professional, clean, and incredibly skilled. We will definitely be hiring him again.', helpful: 31, initials: 'ED', color: 'bg-orange-500' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 flex justify-between items-center bg-white border-b border-gray-100 sticky top-0 z-40">
        <button 
          onClick={() => onNavigate('profile')}
          className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-sm font-bold uppercase tracking-widest">Reviews (4)</h1>
        <button className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center">
          <Filter size={20} />
        </button>
      </header>

      <div className="px-6 py-6 space-y-8">
        {/* Rating Summary */}
        <div className="bg-black text-white rounded-3xl p-6 flex items-center gap-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold">4.9</h2>
            <div className="flex items-center gap-0.5 mt-1">
              {[1, 2, 3, 4, 5].map(s => <Star key={s} size={10} className="fill-white text-white" />)}
            </div>
            <p className="text-[10px] text-white/60 font-bold uppercase tracking-wider mt-2">4 Reviews</p>
          </div>
          <div className="flex-1 space-y-2">
            {[5, 4, 3, 2, 1].map((rating, i) => (
              <div key={rating} className="flex items-center gap-3">
                <span className="text-[10px] font-bold w-2">{rating}</span>
                <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white" 
                    style={{ width: `${rating === 5 ? 85 : rating === 4 ? 10 : 5}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-6 pb-32">
          {reviews.map((review, i) => (
            <motion.div 
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="space-y-4 pb-6 border-b border-gray-100 last:border-0"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${review.color} flex items-center justify-center text-white text-xs font-bold`}>
                    {review.initials}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">{review.author}</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{review.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star 
                      key={s} 
                      size={12} 
                      className={s <= review.rating ? "fill-black text-black" : "text-gray-200"} 
                    />
                  ))}
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{review.content}</p>
                <div className="flex items-center gap-6">
                  <button className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:text-black transition-colors">
                    <ThumbsUp size={14} />
                    Helpful ({review.helpful})
                  </button>
                  <button className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:text-black transition-colors">
                    <MessageSquare size={14} />
                    Reply
                  </button>
                  {review.id === '1' && (
                    <button 
                      onClick={() => onNavigate('editReview')}
                      className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-blue-500 hover:text-blue-600 transition-colors ml-auto"
                    >
                      Edit Review
                    </button>
                  )}
                </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent z-40">
        <button 
          onClick={() => onNavigate('leaveReview')}
          className="w-full py-5 bg-black text-white rounded-[2rem] font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-black/10 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Star size={18} /> Leave a Review
        </button>
      </div>
    </div>
  );
};
