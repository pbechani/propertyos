'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Clock, Home } from 'lucide-react';
import type { ListingViewingRecord } from '@/lib/api-client';

// ─── Types ────────────────────────────────────────────────────────────────────

export type RoomSentiment = 'love' | 'neutral' | 'dislike';

export type CapturedState = {
  roomSentiments: Record<string, RoomSentiment>;
  objections: string[];
  interestLevel: 'low' | 'medium' | 'high' | null;
  emotionalState: 'positive' | 'neutral' | 'negative' | null;
  notes: string;
  elapsedMinutes: number;
};

interface Props {
  viewing: ListingViewingRecord;
  onEnd: (captured: CapturedState) => void;
  onClose: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ROOMS = [
  'Kitchen',
  'Living Room',
  'Master Bedroom',
  'Bedroom 2',
  'Bathroom',
  'Dining Room',
  'Garden',
  'Garage',
];

const OBJECTION_LABELS: Record<string, string> = {
  price_too_high: 'Price',
  layout:         'Layout',
  location:       'Location',
  size:           'Size',
  condition:      'Condition',
  other:          'Other',
};

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmtElapsed(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function buyerName(v: ListingViewingRecord) {
  return [v.buyer_first_name, v.buyer_last_name].filter(Boolean).join(' ') || 'Buyer';
}

// ─── Component ───────────────────────────────────────────────────────────────

export function LiveViewingCapture({ viewing, onEnd, onClose }: Props) {
  const [roomSentiments, setRoomSentiments] = useState<Record<string, RoomSentiment>>({});
  const [selectedRoom, setSelectedRoom]     = useState<string | null>(null);
  const [objections, setObjections]         = useState<Set<string>>(new Set());
  const [interestLevel, setInterestLevel]   = useState<'low' | 'medium' | 'high' | null>(null);
  const [emotionalState, setEmotionalState] = useState<'positive' | 'neutral' | 'negative' | null>(null);
  const [notes, setNotes]                   = useState('');
  const [elapsed, setElapsed]               = useState(0);

  const startRef = useRef(Date.now());

  // Timer
  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const toggleRoom = (room: string) => {
    setSelectedRoom((prev) => (prev === room ? null : room));
  };

  const setRoomReaction = (sentiment: RoomSentiment) => {
    if (!selectedRoom) return;
    setRoomSentiments((prev) => ({ ...prev, [selectedRoom]: sentiment }));
  };

  const toggleObjection = (key: string) => {
    setObjections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const handleEnd = () => {
    onEnd({
      roomSentiments,
      objections: Array.from(objections),
      interestLevel,
      emotionalState,
      notes,
      elapsedMinutes: Math.max(1, Math.round(elapsed / 60)),
    });
  };

  const dt = new Date(viewing.scheduled_at);
  const timeStr = dt.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div
        className="w-[360px] h-full bg-[#1A3C28] flex flex-col overflow-y-auto shadow-2xl"
        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-white/10 shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#00E87A] animate-pulse shrink-0" />
              <span
                className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#00E87A]/80"
                style={{ fontFamily: 'IBM Plex Mono, monospace' }}
              >
                Live Capture
              </span>
            </div>
            <p
              className="text-lg font-bold text-[#F2E8D5] leading-tight truncate"
              style={{ fontFamily: 'Fraunces, serif' }}
            >
              {buyerName(viewing)}
            </p>
            <p className="text-[#F2E8D5]/50 text-xs mt-0.5">Scheduled {timeStr}</p>
          </div>

          {/* Elapsed timer */}
          <div className="flex flex-col items-end gap-1 ml-3 shrink-0">
            <div className="flex items-center gap-1 bg-white/10 rounded-lg px-2.5 py-1">
              <Clock className="w-3 h-3 text-[#00E87A]" />
              <span
                className="text-[#00E87A] font-bold text-sm tabular-nums"
                style={{ fontFamily: 'IBM Plex Mono, monospace' }}
              >
                {fmtElapsed(elapsed)}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/70 transition-colors"
              aria-label="Close capture panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 px-5 pt-4 pb-4 space-y-5">
          {/* Rooms grid */}
          <div>
            <p
              className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#F2E8D5]/40 mb-2.5"
              style={{ fontFamily: 'IBM Plex Mono, monospace' }}
            >
              Track by Room
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {ROOMS.map((room) => {
                const sentiment = roomSentiments[room];
                const isSelected = selectedRoom === room;
                const bgColor =
                  sentiment === 'love'    ? 'bg-[#00E87A]/20 border-[#00E87A]/60 text-[#00E87A]' :
                  sentiment === 'dislike' ? 'bg-[#C4562A]/20 border-[#C4562A]/60 text-[#C4562A]' :
                  sentiment === 'neutral' ? 'bg-[#B89040]/20 border-[#B89040]/60 text-[#B89040]' :
                  isSelected              ? 'bg-white/15 border-white/60 text-white' :
                                            'bg-white/[0.06] border-white/10 text-[#F2E8D5]/60 hover:bg-white/10 hover:border-white/25';
                return (
                  <button
                    key={room}
                    onClick={() => toggleRoom(room)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${bgColor}`}
                  >
                    <Home className="w-3 h-3 shrink-0" />
                    <span className="truncate">{room}</span>
                  </button>
                );
              })}
            </div>

            {/* Per-room reactions */}
            {selectedRoom && (
              <div className="mt-2 p-3 bg-white/[0.06] rounded-xl border border-white/10">
                <p className="text-[10px] text-[#F2E8D5]/50 mb-2 font-medium">{selectedRoom}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setRoomReaction('love')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      roomSentiments[selectedRoom] === 'love'
                        ? 'bg-[#00E87A] text-[#1A3C28]'
                        : 'bg-[#00E87A]/10 text-[#00E87A] hover:bg-[#00E87A]/25'
                    }`}
                  >
                    ❤ Love
                  </button>
                  <button
                    onClick={() => setRoomReaction('neutral')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      roomSentiments[selectedRoom] === 'neutral'
                        ? 'bg-[#B89040] text-white'
                        : 'bg-[#B89040]/10 text-[#B89040] hover:bg-[#B89040]/25'
                    }`}
                  >
                    ◦ OK
                  </button>
                  <button
                    onClick={() => setRoomReaction('dislike')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      roomSentiments[selectedRoom] === 'dislike'
                        ? 'bg-[#C4562A] text-white'
                        : 'bg-[#C4562A]/10 text-[#C4562A] hover:bg-[#C4562A]/25'
                    }`}
                  >
                    ✗ Nope
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Objections */}
          <div>
            <p
              className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#F2E8D5]/40 mb-2.5"
              style={{ fontFamily: 'IBM Plex Mono, monospace' }}
            >
              Buyer Objections
            </p>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(OBJECTION_LABELS).map(([key, label]) => {
                const active = objections.has(key);
                return (
                  <button
                    key={key}
                    onClick={() => toggleObjection(key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      active
                        ? 'bg-[#C4562A] border-[#C4562A] text-white'
                        : 'bg-white/[0.06] border-white/15 text-[#F2E8D5]/60 hover:border-white/30'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interest level */}
          <div>
            <p
              className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#F2E8D5]/40 mb-2.5"
              style={{ fontFamily: 'IBM Plex Mono, monospace' }}
            >
              Interest Level
            </p>
            <div className="flex gap-2">
              {(['low', 'medium', 'high'] as const).map((lvl) => {
                const colors: Record<string, { active: string; inactive: string }> = {
                  low:    { active: 'bg-[#C4562A] border-[#C4562A] text-white',       inactive: 'bg-white/[0.06] border-white/15 text-[#F2E8D5]/60 hover:border-white/30' },
                  medium: { active: 'bg-[#B89040] border-[#B89040] text-white',       inactive: 'bg-white/[0.06] border-white/15 text-[#F2E8D5]/60 hover:border-white/30' },
                  high:   { active: 'bg-[#00E87A] border-[#00E87A] text-[#1A3C28]',  inactive: 'bg-white/[0.06] border-white/15 text-[#F2E8D5]/60 hover:border-white/30' },
                };
                const { active, inactive } = colors[lvl];
                return (
                  <button
                    key={lvl}
                    onClick={() => setInterestLevel(lvl)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border capitalize transition-all ${
                      interestLevel === lvl ? active : inactive
                    }`}
                  >
                    {lvl}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Emotional state */}
          <div>
            <p
              className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#F2E8D5]/40 mb-2.5"
              style={{ fontFamily: 'IBM Plex Mono, monospace' }}
            >
              Buyer Mood
            </p>
            <div className="flex gap-2">
              {([
                { key: 'positive', emoji: '😊', label: 'Positive' },
                { key: 'neutral',  emoji: '😐', label: 'Neutral'  },
                { key: 'negative', emoji: '😞', label: 'Negative' },
              ] as const).map(({ key, emoji, label }) => (
                <button
                  key={key}
                  onClick={() => setEmotionalState(key)}
                  className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    emotionalState === key
                      ? 'bg-white/20 border-white/50 text-white'
                      : 'bg-white/[0.06] border-white/10 text-[#F2E8D5]/50 hover:bg-white/10'
                  }`}
                >
                  <span className="text-base">{emoji}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <p
              className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#F2E8D5]/40 mb-2.5"
              style={{ fontFamily: 'IBM Plex Mono, monospace' }}
            >
              Quick Notes
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any observations…"
              rows={3}
              className="w-full bg-white/[0.06] border border-white/15 rounded-xl px-3 py-2.5 text-sm text-[#F2E8D5] placeholder-[#F2E8D5]/30 focus:outline-none focus:border-[#00E87A]/50 resize-none"
            />
          </div>
        </div>

        {/* Footer CTA */}
        <div className="px-5 pb-6 pt-3 border-t border-white/10 shrink-0">
          <button
            onClick={handleEnd}
            className="w-full py-3 rounded-xl bg-[#C4562A] hover:bg-[#B34B25] text-white font-bold text-sm transition-colors"
          >
            End Viewing & Log Outcome
          </button>
          <button
            onClick={onClose}
            className="w-full mt-2 py-2 text-[#F2E8D5]/40 hover:text-[#F2E8D5]/70 text-xs transition-colors"
          >
            Minimise
          </button>
        </div>
      </div>
    </div>
  );
}
