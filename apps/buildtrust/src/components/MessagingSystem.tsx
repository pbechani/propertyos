import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Search, 
  MoreVertical, 
  Send, 
  Paperclip, 
  Mic, 
  Image as ImageIcon, 
  FileText, 
  X, 
  AlertCircle, 
  Flag, 
  Ban, 
  Check, 
  CheckCheck, 
  ChevronRight, 
  Play, 
  Pause, 
  Trash2, 
  Bell, 
  Shield, 
  UserX, 
  Download,
  Share2,
  Filter,
  Circle
} from 'lucide-react';
import { Screen } from '../types';

interface ScreenProps {
  onNavigate: (screen: Screen) => void;
}

// --- Mock Data ---

const conversations = [
  {
    id: '1',
    name: 'Sarah Jenkins',
    project: 'Kitchen Remodel',
    lastMessage: 'I sent the updated tile samples for your review.',
    time: '10:24 AM',
    unread: 2,
    avatar: 'https://picsum.photos/seed/sarah/100/100',
    status: 'online',
    isTyping: false
  },
  {
    id: '2',
    name: 'Mike Rossi',
    project: 'Bathroom Tiling',
    lastMessage: 'Can we move the start date to Tuesday?',
    time: 'Yesterday',
    unread: 0,
    avatar: 'https://picsum.photos/seed/mike/100/100',
    status: 'offline',
    isTyping: true
  },
  {
    id: '3',
    name: 'Elena Rodriguez',
    project: 'Deck Repair',
    lastMessage: 'Voice Message (0:15)',
    time: 'Mar 22',
    unread: 0,
    avatar: 'https://picsum.photos/seed/elena/100/100',
    status: 'offline',
    isTyping: false,
    type: 'voice'
  }
];

const attachments = [
  { id: '1', name: 'Kitchen_Plan_V2.pdf', size: '2.4 MB', type: 'pdf', date: 'Mar 24' },
  { id: '2', name: 'Tile_Sample_1.jpg', size: '1.1 MB', type: 'image', date: 'Mar 24' },
  { id: '3', name: 'Contract_Draft.docx', size: '450 KB', type: 'doc', date: 'Mar 23' },
];

const voiceNotes = [
  { id: '1', duration: '0:45', date: 'Today, 10:20 AM', sender: 'Sarah J.' },
  { id: '2', duration: '1:12', date: 'Yesterday, 4:15 PM', sender: 'Mike R.' },
];

const notifications = [
  { id: '1', title: 'New Message', body: 'Sarah Jenkins sent a photo', time: '2m ago', read: false },
  { id: '2', title: 'Voice Message', body: 'Mike Rossi sent a voice note', time: '1h ago', read: true },
  { id: '3', title: 'System Alert', body: 'Your response rate is 98%', time: '3h ago', read: true },
];

// --- Screens ---

// 1. Chat List Screen
export const ChatListScreen: React.FC<ScreenProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-white pb-24">
      <header className="px-6 pt-12 pb-6 space-y-6 sticky top-0 bg-white/80 backdrop-blur-md z-20">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-black tracking-tighter">Messages</h1>
          <div className="flex gap-2">
            <button onClick={() => onNavigate('messagingNotifications')} className="p-2 rounded-full hover:bg-gray-50 transition-colors relative">
              <Bell size={24} />
              <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
            <button onClick={() => onNavigate('blockReport')} className="p-2 rounded-full hover:bg-gray-50 transition-colors">
              <Shield size={24} />
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search chats..."
              className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-black transition-all"
            />
          </div>
          <button className="p-4 bg-gray-50 rounded-2xl text-gray-400 hover:text-black transition-colors">
            <Filter size={20} />
          </button>
        </div>
      </header>

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
              <img src={chat.avatar} className="w-16 h-16 rounded-[1.5rem] object-cover" alt={chat.name} />
              {chat.status === 'online' && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-4 border-white" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline mb-1">
                <h3 className="font-bold text-base truncate">{chat.name}</h3>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{chat.time}</span>
              </div>
              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">{chat.project}</p>
              <div className="flex items-center justify-between">
                <p className={`text-sm truncate ${chat.unread > 0 ? 'text-black font-bold' : 'text-gray-500'}`}>
                  {chat.lastMessage}
                </p>
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

// 2. Chat Screen (Enhanced)
export const ContractorChatScreen: React.FC<ScreenProps> = ({ onNavigate }) => {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="px-6 pt-12 pb-4 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-30 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <button onClick={() => onNavigate('conversationsList')} className="p-2 -ml-2 hover:bg-gray-50 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div className="flex items-center gap-3">
            <img src="https://picsum.photos/seed/sarah/100/100" className="w-10 h-10 rounded-xl object-cover" alt="Sarah" />
            <div>
              <h3 className="font-bold text-sm leading-tight">Sarah Jenkins</h3>
              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Kitchen Remodel</p>
            </div>
          </div>
        </div>
        <button onClick={() => onNavigate('blockReport')} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
          <MoreVertical size={24} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Mock Messages */}
        <div className="flex justify-start">
          <div className="max-w-[80%] bg-gray-50 p-4 rounded-[2rem] rounded-tl-none text-sm leading-relaxed">
            Hi Alex, I just uploaded the new floor plans. Can you take a look?
          </div>
        </div>
        <div className="flex justify-end">
          <div className="max-w-[80%] bg-black text-white p-4 rounded-[2rem] rounded-tr-none text-sm leading-relaxed">
            Sure thing Sarah. I'll check them right now.
          </div>
        </div>
        <div className="flex justify-start">
          <div className="max-w-[80%] bg-gray-50 p-4 rounded-[2rem] rounded-tl-none space-y-3">
            <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-gray-100">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center">
                <FileText size={20} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold truncate">Floor_Plan_Final.pdf</p>
                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">2.4 MB • PDF</p>
              </div>
              <button onClick={() => onNavigate('chatAttachments')} className="p-2 text-gray-300 hover:text-black">
                <Download size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 bg-white border-t border-gray-100">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => onNavigate('chatAttachments')}
            className="p-4 bg-gray-50 text-gray-400 rounded-2xl hover:text-black transition-colors"
          >
            <Paperclip size={20} />
          </button>
          <div className="flex-1 relative">
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type a message..."
              className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-4 pr-12 text-sm font-medium focus:ring-2 focus:ring-black transition-all"
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-300 hover:text-black">
              <Send size={20} />
            </button>
          </div>
          <button 
            onClick={() => onNavigate('voiceMessages')}
            className="p-4 bg-gray-50 text-gray-400 rounded-2xl hover:text-black transition-colors"
          >
            <Mic size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

// 3. Attachments Screen
export const ChatAttachmentsScreen: React.FC<ScreenProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-white pb-24">
      <header className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-white z-10 border-b border-gray-50">
        <button onClick={() => onNavigate('chat')} className="p-2 -ml-2 hover:bg-gray-50 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold tracking-tight">Attachments</h1>
        <button className="p-2 -mr-2 hover:bg-gray-50 rounded-full transition-colors">
          <Share2 size={24} />
        </button>
      </header>

      <div className="px-6 mt-8 space-y-8">
        <div className="grid grid-cols-2 gap-4">
          <button className="p-6 bg-gray-50 rounded-[2rem] flex flex-col items-center gap-3 hover:bg-black hover:text-white transition-all group">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:bg-white/10">
              <ImageIcon size={24} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest">Photos</span>
          </button>
          <button className="p-6 bg-gray-50 rounded-[2rem] flex flex-col items-center gap-3 hover:bg-black hover:text-white transition-all group">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:bg-white/10">
              <FileText size={24} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest">Documents</span>
          </button>
        </div>

        <section>
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 px-2">Recent Files</h2>
          <div className="space-y-3">
            {attachments.map((file) => (
              <div key={file.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4 group">
                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-black group-hover:text-white transition-colors">
                  {file.type === 'image' ? <ImageIcon size={24} /> : <FileText size={24} />}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm truncate">{file.name}</h4>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{file.size} • {file.date}</p>
                </div>
                <button className="p-2 text-gray-300 hover:text-black">
                  <Download size={20} />
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

// 4. Voice Messages Screen
export const VoiceMessagesScreen: React.FC<ScreenProps> = ({ onNavigate }) => {
  const [isPlaying, setIsPlaying] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-white pb-24">
      <header className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-white z-10 border-b border-gray-50">
        <button onClick={() => onNavigate('chat')} className="p-2 -ml-2 hover:bg-gray-50 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold tracking-tight">Voice Messages</h1>
        <div className="w-10" />
      </header>

      <div className="px-6 mt-8 space-y-8">
        <div className="bg-black text-white p-10 rounded-[3rem] text-center space-y-6 shadow-xl shadow-black/20">
          <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto relative">
            <Mic size={32} />
            <motion.div 
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute inset-0 bg-white/5 rounded-full"
            />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold tracking-tight">Record Voice Note</h3>
            <p className="text-xs text-white/50">Tap and hold the mic to record</p>
          </div>
        </div>

        <section>
          <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 px-2">Saved Voice Notes</h2>
          <div className="space-y-4">
            {voiceNotes.map((note) => (
              <div key={note.id} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setIsPlaying(isPlaying === note.id ? null : note.id)}
                      className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center shadow-lg"
                    >
                      {isPlaying === note.id ? <Pause size={20} /> : <Play size={20} className="ml-1" />}
                    </button>
                    <div>
                      <p className="text-sm font-bold">{note.sender}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{note.date}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold font-mono">{note.duration}</span>
                </div>
                <div className="h-1.5 bg-gray-50 rounded-full overflow-hidden flex gap-1 px-1 items-center">
                  {[...Array(20)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`flex-1 rounded-full ${isPlaying === note.id ? 'bg-black' : 'bg-gray-200'}`}
                      style={{ height: `${Math.random() * 100}%` }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

// 5. Messaging Notifications Screen
export const MessagingNotificationsScreen: React.FC<ScreenProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 z-10 border-b border-gray-50">
        <button onClick={() => onNavigate('conversationsList')} className="p-2 -ml-2 hover:bg-gray-50 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold tracking-tight">Notifications</h1>
        <button className="text-xs font-bold text-black uppercase tracking-widest">Clear All</button>
      </header>

      <div className="px-6 mt-8 space-y-4">
        {notifications.map((notif) => (
          <div key={notif.id} className={`bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex gap-4 items-start ${!notif.read ? 'border-l-4 border-l-black' : ''}`}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${!notif.read ? 'bg-black text-white' : 'bg-gray-50 text-gray-400'}`}>
              <Bell size={24} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start mb-1">
                <h4 className="font-bold text-sm">{notif.title}</h4>
                <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{notif.time}</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{notif.body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="px-6 mt-12">
        <div className="bg-black text-white p-8 rounded-[3rem] space-y-6 shadow-xl shadow-black/20">
          <div className="flex justify-between items-center">
            <h3 className="font-bold">Push Notifications</h3>
            <div className="w-12 h-6 bg-white/20 rounded-full p-1 flex items-center cursor-pointer">
              <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
            </div>
          </div>
          <p className="text-xs text-white/50 leading-relaxed">
            Get real-time alerts for new messages, job updates, and system announcements.
          </p>
        </div>
      </div>
    </div>
  );
};

// 6. Block/Report Screen
export const BlockReportScreen: React.FC<ScreenProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-white pb-24">
      <header className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-white z-10 border-b border-gray-50">
        <button onClick={() => onNavigate('chat')} className="p-2 -ml-2 hover:bg-gray-50 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold tracking-tight">Safety & Privacy</h1>
        <div className="w-10" />
      </header>

      <div className="px-6 mt-12 space-y-12">
        <div className="text-center space-y-4">
          <div className="w-24 h-24 bg-red-50 text-red-500 rounded-[2.5rem] flex items-center justify-center mx-auto">
            <Shield size={48} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black tracking-tighter">Manage User</h2>
            <p className="text-sm text-gray-500 leading-relaxed px-4">
              If you're experiencing issues with a user, you can block them or report their behavior to our team.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <button className="w-full bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-4 hover:border-red-500 transition-all group">
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center shrink-0">
              <Ban size={24} />
            </div>
            <div className="text-left">
              <h4 className="font-bold text-sm group-hover:text-red-500 transition-colors">Block Sarah Jenkins</h4>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">They won't be able to message you</p>
            </div>
            <ChevronRight size={20} className="ml-auto text-gray-300" />
          </button>

          <button className="w-full bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-4 hover:border-black transition-all group">
            <div className="w-12 h-12 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-black group-hover:text-white transition-colors">
              <Flag size={24} />
            </div>
            <div className="text-left">
              <h4 className="font-bold text-sm">Report User</h4>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Notify our safety team</p>
            </div>
            <ChevronRight size={20} className="ml-auto text-gray-300" />
          </button>
        </div>

        <section className="bg-gray-50 p-8 rounded-[3rem] space-y-6">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Blocked Users</h3>
          <div className="space-y-4">
            {[
              { name: 'John Doe', date: 'Blocked on Mar 10' },
              { name: 'Jane Smith', date: 'Blocked on Feb 28' },
            ].map((user) => (
              <div key={user.name} className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-300">
                    <UserX size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{user.name}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{user.date}</p>
                  </div>
                </div>
                <button className="text-[10px] font-bold text-black uppercase tracking-widest underline">Unblock</button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
