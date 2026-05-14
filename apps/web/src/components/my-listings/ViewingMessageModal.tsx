'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Send, Mail, Phone, Check, Loader2, MessageSquare } from 'lucide-react';
import { viewingsApi, type ListingViewingRecord } from '@/lib/api-client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ViewingMessageModalProps {
  viewing: ListingViewingRecord;
  authToken: string;
  onClose: () => void;
}

type Channel = 'email' | 'sms';
type SendState = 'idle' | 'sending' | 'success' | 'error';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function recipientName(v: ListingViewingRecord) {
  return [v.buyer_first_name, v.buyer_last_name].filter(Boolean).join(' ') || 'Client';
}

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-ZA', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Quick-reply templates ────────────────────────────────────────────────────

const TEMPLATES = [
  { label: 'Confirm tomorrow', text: (name: string, dt: string) => `Hi ${name}, just confirming your viewing tomorrow at ${dt}. Looking forward to seeing you!` },
  { label: 'Directions', text: (name: string, dt: string) => `Hi ${name}, here are the directions for your viewing on ${dt}. Please let me know if you need anything before then.` },
  { label: 'Running late', text: (name: string, _dt: string) => `Hi ${name}, I'm running about 10 minutes late. I'll be with you shortly — apologies for the delay!` },
  { label: 'Follow-up', text: (name: string, _dt: string) => `Hi ${name}, thank you for viewing the property. Do you have any questions or feedback I can help you with?` },
  { label: 'Documents ready', text: (name: string, _dt: string) => `Hi ${name}, the property documents you requested are ready. I'll send them over shortly — let me know if there's anything else you need.` },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function ViewingMessageModal({ viewing, authToken, onClose }: ViewingMessageModalProps) {
  const hasEmail = Boolean(viewing.buyer_email);
  const hasSms   = Boolean(viewing.buyer_phone);

  const [channel, setChannel]   = useState<Channel>(hasEmail ? 'email' : 'sms');
  const [message, setMessage]   = useState('');
  const [sendState, setSendState] = useState<SendState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const name = recipientName(viewing);
  const dt   = fmtDateTime(viewing.scheduled_at);

  // Auto-focus textarea on open
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [message]);

  const applyTemplate = (idx: number) => {
    const text = TEMPLATES[idx].text(name, dt);
    setMessage(text);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const handleSend = async () => {
    if (!message.trim() || sendState === 'sending') return;
    setSendState('sending');
    setErrorMsg('');
    try {
      await viewingsApi.sendMessage(authToken, viewing.id, {
        channel,
        message: message.trim(),
      });
      setSendState('success');
      setTimeout(onClose, 1800);
    } catch (err) {
      setSendState('error');
      setErrorMsg(err instanceof Error ? err.message : 'Failed to send message');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSend();
    }
    if (e.key === 'Escape') onClose();
  };

  const canSend = message.trim().length > 0 && sendState !== 'sending' && sendState !== 'success';
  const channelAddress = channel === 'email' ? viewing.buyer_email : viewing.buyer_phone;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Scrim */}
      <div className="absolute inset-0 bg-[#0F2218]/70 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative w-full sm:max-w-md bg-[#0F2218] border border-[#00E87A]/10 rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl"
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-white/[0.06]">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* Avatar ring */}
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-[#1A3C28] border border-[#00E87A]/20 flex items-center justify-center">
                  <span className="text-sm font-serif font-bold text-[#00E87A]">
                    {name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#00E87A] border-2 border-[#0F2218]" />
              </div>
              <div>
                <p className="text-white font-serif font-bold text-base leading-tight">{name}</p>
                <p className="text-white/40 text-xs mt-0.5 font-mono">{dt}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Channel toggle */}
          <div className="mt-4 flex gap-2">
            {hasEmail && (
              <button
                onClick={() => setChannel('email')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  channel === 'email'
                    ? 'bg-[#00E87A] text-[#0F2218]'
                    : 'bg-white/[0.05] text-white/50 hover:bg-white/[0.09] hover:text-white/70'
                }`}
              >
                <Mail className="w-3 h-3" />
                Email
              </button>
            )}
            {hasSms && (
              <button
                onClick={() => setChannel('sms')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  channel === 'sms'
                    ? 'bg-[#00E87A] text-[#0F2218]'
                    : 'bg-white/[0.05] text-white/50 hover:bg-white/[0.09] hover:text-white/70'
                }`}
              >
                <Phone className="w-3 h-3" />
                SMS
              </button>
            )}
            {!hasEmail && !hasSms && (
              <p className="text-xs text-amber-400 flex items-center gap-1.5">
                <MessageSquare className="w-3 h-3" />
                No contact details on record
              </p>
            )}
            {channelAddress && (
              <span className="ml-auto text-[10px] font-mono text-white/25 self-center truncate max-w-[140px]">
                {channelAddress}
              </span>
            )}
          </div>
        </div>

        {/* Quick templates */}
        <div className="px-5 py-3 border-b border-white/[0.06]">
          <p className="text-[10px] font-mono font-bold uppercase tracking-[0.12em] text-white/25 mb-2">
            Quick replies
          </p>
          <div className="flex flex-wrap gap-1.5">
            {TEMPLATES.map((t, i) => (
              <button
                key={t.label}
                onClick={() => applyTemplate(i)}
                className="text-[10px] font-semibold px-2.5 py-1 rounded-full border border-white/10 text-white/50 hover:border-[#00E87A]/40 hover:text-[#00E87A] hover:bg-[#00E87A]/[0.06] transition-all"
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Compose area */}
        <div className="px-5 py-4">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => { setMessage(e.target.value); setSendState('idle'); }}
            placeholder={`Write a message to ${name}…`}
            disabled={sendState === 'sending' || sendState === 'success' || (!hasEmail && !hasSms)}
            rows={3}
            className="w-full bg-transparent text-white text-sm placeholder-white/20 resize-none outline-none leading-relaxed"
            style={{ minHeight: '72px' }}
          />
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.06]">
            <span className="text-[10px] font-mono text-white/20">
              {message.length > 0 ? `${message.length} chars` : '⌘↵ to send'}
            </span>

            {/* Send state */}
            {sendState === 'success' ? (
              <div className="flex items-center gap-1.5 text-[#00E87A] text-xs font-semibold">
                <Check className="w-3.5 h-3.5" />
                Sent!
              </div>
            ) : sendState === 'error' ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-400">{errorMsg}</span>
                <button
                  onClick={handleSend}
                  className="flex items-center gap-1.5 bg-[#00E87A] text-[#0F2218] text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#00E87A]/90 transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : (
              <button
                onClick={handleSend}
                disabled={!canSend || (!hasEmail && !hasSms)}
                className="flex items-center gap-1.5 bg-[#00E87A] text-[#0F2218] text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#00E87A]/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                {sendState === 'sending' ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Send className="w-3 h-3" />
                )}
                Send
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
