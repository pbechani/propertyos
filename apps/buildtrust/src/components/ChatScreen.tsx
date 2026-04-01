import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Phone, Video, MoreVertical, Send, Paperclip, Mic, Image as ImageIcon, FileText, X, AlertCircle, RefreshCw, Flag, Ban, Check, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Screen } from '../types';

interface ChatScreenProps {
  onNavigate: (screen: Screen) => void;
}

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'other' | 'system';
  time: string;
  status?: 'sent' | 'delivered' | 'read' | 'failed';
  type?: 'text' | 'image' | 'voice' | 'quote';
  attachment?: string;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ onNavigate }) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: 'Hey Marco, I saw your quote for the kitchen remodel.', sender: 'me', time: '10:20 AM', status: 'read' },
    { id: '2', text: 'Quote Updated: Elite Plumbing Solutions has updated the materials list.', sender: 'system', time: '10:21 AM', type: 'quote' },
    { id: '3', text: 'Hi! Yes, I updated it with the premium fixtures we discussed.', sender: 'other', time: '10:22 AM' },
    { id: '4', text: 'That looks great. Can you send over some photos of the specific sink model?', sender: 'me', time: '10:23 AM', status: 'read' },
    { id: '5', text: '', sender: 'other', time: '10:24 AM', type: 'image', attachment: 'https://picsum.photos/seed/sink/400/300' },
    { id: '6', text: 'This is the one. It has a brushed nickel finish.', sender: 'other', time: '10:24 AM' },
    { id: '7', text: 'Perfect. I will review the contract and get back to you.', sender: 'me', time: '10:25 AM', status: 'failed' },
  ]);

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'me',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent'
    };
    setMessages([...messages, newMessage]);
    setInputText('');
  };

  const retryMessage = (id: string) => {
    setMessages(messages.map(m => m.id === id ? { ...m, status: 'sent' } : m));
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="px-6 pt-12 pb-4 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-30 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onNavigate('conversationsList')}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src="https://picsum.photos/seed/marco/100/100" className="w-10 h-10 rounded-xl object-cover" alt="Marco" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></div>
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight">Marco Rossi</h3>
              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Online</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-black">
            <Phone size={20} />
          </button>
          <button className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-black">
            <Video size={20} />
          </button>
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-black"
            >
              <MoreVertical size={20} />
            </button>
            
            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50"
                >
                  <button className="w-full px-4 py-3 text-left text-sm font-medium flex items-center gap-3 hover:bg-gray-50 transition-colors">
                    <Flag size={16} className="text-gray-400" /> Report User
                  </button>
                  <button className="w-full px-4 py-3 text-left text-sm font-medium flex items-center gap-3 hover:bg-gray-50 transition-colors text-red-500">
                    <Ban size={16} /> Block User
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30">
        {messages.map((msg, i) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`flex ${msg.sender === 'me' ? 'justify-end' : msg.sender === 'system' ? 'justify-center' : 'justify-start'}`}
          >
            {msg.sender === 'system' ? (
              <div className="bg-white/80 backdrop-blur-sm border border-gray-100 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2 shadow-sm">
                <AlertCircle size={12} /> {msg.text}
              </div>
            ) : (
              <div className={`max-w-[80%] space-y-1 ${msg.sender === 'me' ? 'items-end' : 'items-start'}`}>
                <div className={`p-4 rounded-[2rem] text-sm leading-relaxed shadow-sm ${
                  msg.sender === 'me' 
                    ? 'bg-black text-white rounded-tr-none' 
                    : 'bg-white text-black rounded-tl-none border border-gray-100'
                }`}>
                  {msg.type === 'image' ? (
                    <img src={msg.attachment} className="rounded-2xl w-full h-auto" alt="Attachment" />
                  ) : (
                    msg.text
                  )}
                </div>
                <div className={`flex items-center gap-2 px-2 ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                  <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{msg.time}</span>
                  {msg.sender === 'me' && (
                    <div className="flex items-center">
                      {msg.status === 'failed' ? (
                        <button 
                          onClick={() => retryMessage(msg.id)}
                          className="flex items-center gap-1 text-red-500 hover:text-red-600 transition-colors"
                        >
                          <RefreshCw size={10} />
                          <span className="text-[8px] font-bold uppercase tracking-widest">Failed</span>
                        </button>
                      ) : msg.status === 'read' ? (
                        <CheckCheck size={12} className="text-emerald-500" />
                      ) : (
                        <Check size={12} className="text-gray-300" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        ))}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-white border border-gray-100 p-4 rounded-[2rem] rounded-tl-none flex gap-1">
              <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
              <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
              <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 bg-white border-t border-gray-100 space-y-4">
        <AnimatePresence>
          {showAttachments && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="flex gap-4 pb-4"
            >
              <button className="w-14 h-14 rounded-2xl bg-gray-50 flex flex-col items-center justify-center text-gray-400 hover:text-black hover:bg-gray-100 transition-all">
                <ImageIcon size={20} />
                <span className="text-[8px] font-bold uppercase mt-1">Image</span>
              </button>
              <button className="w-14 h-14 rounded-2xl bg-gray-50 flex flex-col items-center justify-center text-gray-400 hover:text-black hover:bg-gray-100 transition-all">
                <FileText size={20} />
                <span className="text-[8px] font-bold uppercase mt-1">File</span>
              </button>
              <button className="w-14 h-14 rounded-2xl bg-gray-50 flex flex-col items-center justify-center text-gray-400 hover:text-black hover:bg-gray-100 transition-all">
                <AlertCircle size={20} />
                <span className="text-[8px] font-bold uppercase mt-1">Quote</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowAttachments(!showAttachments)}
            className={`p-3 rounded-2xl transition-all ${showAttachments ? 'bg-black text-white' : 'bg-gray-100 text-gray-400 hover:text-black'}`}
          >
            <Paperclip size={20} />
          </button>
          
          <div className="flex-1 relative">
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message..."
              className="w-full bg-gray-100 border-none rounded-2xl py-4 pl-4 pr-12 text-sm focus:ring-2 focus:ring-black transition-all"
            />
            <button 
              onClick={handleSendMessage}
              disabled={!inputText.trim()}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all ${
                inputText.trim() ? 'bg-black text-white shadow-lg' : 'text-gray-300'
              }`}
            >
              <Send size={18} />
            </button>
          </div>

          <button 
            onMouseDown={() => setIsRecording(true)}
            onMouseUp={() => setIsRecording(false)}
            className={`p-4 rounded-2xl transition-all ${
              isRecording ? 'bg-red-500 text-white scale-110 shadow-xl shadow-red-200' : 'bg-gray-100 text-gray-400 hover:text-black'
            }`}
          >
            <Mic size={20} />
          </button>
        </div>
      </div>

      {/* Voice Recording Overlay */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <div className="bg-white rounded-[3rem] p-12 text-center space-y-8">
              <div className="relative">
                <motion.div 
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute inset-0 bg-red-500 rounded-full blur-2xl"
                />
                <div className="relative w-24 h-24 bg-red-500 rounded-full flex items-center justify-center text-white shadow-2xl shadow-red-200">
                  <Mic size={40} />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold tracking-tight">Recording...</h3>
                <p className="text-sm text-gray-400">Release to send voice message</p>
              </div>
              <div className="flex justify-center gap-1">
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ height: [10, 30, 10] }}
                    transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                    className="w-1 bg-red-500 rounded-full"
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
