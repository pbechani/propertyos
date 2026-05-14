import React from 'react';
import { Search, MoreVertical, Check, CheckCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { Screen } from '../types';

interface ConversationsListScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const ConversationsListScreen: React.FC<ConversationsListScreenProps> = ({ onNavigate }) => {
  const conversations = [
    {
      id: '1',
      name: 'Marco Rossi',
      company: 'Elite Plumbing Solutions',
      lastMessage: 'I can start on Monday if that works for you?',
      time: '10:24 AM',
      unread: 2,
      avatar: 'https://picsum.photos/seed/marco/100/100',
      status: 'online',
      isTyping: false
    },
    {
      id: '2',
      name: 'Sarah Jenkins',
      company: 'ProFix Home Services',
      lastMessage: 'The quote has been updated with the new materials.',
      time: 'Yesterday',
      unread: 0,
      avatar: 'https://picsum.photos/seed/sarah/100/100',
      status: 'offline',
      isTyping: true
    },
    {
      id: '3',
      name: 'David Chen',
      company: 'Modern Craft Builders',
      lastMessage: 'Sent you the contract for review.',
      time: 'Mar 22',
      unread: 0,
      avatar: 'https://picsum.photos/seed/david/100/100',
      status: 'offline',
      isTyping: false
    },
    {
      id: '4',
      name: 'Elena Rodriguez',
      company: 'Elena Design Studio',
      lastMessage: 'Great, see you then!',
      time: 'Mar 20',
      unread: 0,
      avatar: 'https://picsum.photos/seed/elena/100/100',
      status: 'offline',
      isTyping: false
    }
  ];

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 space-y-6 sticky top-0 bg-white/80 backdrop-blur-md z-20">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
          <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <MoreVertical size={24} />
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search conversations..."
            className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-black transition-all"
          />
        </div>
      </header>

      {/* Conversations List */}
      <div className="px-6 space-y-2">
        {conversations.map((chat, i) => (
          <motion.div
            key={chat.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onNavigate('chat')}
            className="flex items-center gap-4 p-4 rounded-[2rem] hover:bg-gray-50 transition-all cursor-pointer group"
          >
            <div className="relative">
              <img 
                src={chat.avatar} 
                className="w-14 h-14 rounded-2xl object-cover" 
                alt={chat.name} 
              />
              {chat.status === 'online' && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white"></div>
              )}
            </div>

            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex justify-between items-baseline">
                <h3 className="font-bold text-base truncate group-hover:text-black transition-colors">{chat.name}</h3>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{chat.time}</span>
              </div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">{chat.company}</p>
              <div className="flex items-center justify-between">
                {chat.isTyping ? (
                  <span className="text-xs font-bold text-emerald-500 italic">Typing...</span>
                ) : (
                  <p className={`text-sm truncate ${chat.unread > 0 ? 'text-black font-bold' : 'text-gray-500'}`}>
                    {chat.lastMessage}
                  </p>
                )}
                {chat.unread > 0 && (
                  <div className="w-5 h-5 bg-black text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                    {chat.unread}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
