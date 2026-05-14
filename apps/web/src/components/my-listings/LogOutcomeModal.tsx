'use client';

import { useState } from 'react';
import { X, Star, Loader2, CheckCircle } from 'lucide-react';
import { viewingsApi, type AgentCaptureFeedbackPayload, type ListingViewingRecord } from '@/lib/api-client';
import type { CapturedState } from './LiveViewingCapture';

// ─── Constants ────────────────────────────────────────────────────────────────

const INTENT_OPTIONS = [
  { key: 'not_interested',  label: 'Not Interested',   emoji: '✗' },
  { key: 'considering',     label: 'Considering',       emoji: '🤔' },
  { key: 'second_viewing',  label: 'Second Viewing',    emoji: '📅' },
  { key: 'ready_to_offer',  label: 'Wants to Offer',    emoji: '🏷' },
] as const;

const TAG_SUGGESTIONS = [
  'Kitchen', 'Living Room', 'Master Bedroom', 'Bathroom', 'Garden',
  'Natural Light', 'Storage', 'Layout', 'Size', 'Finishes',
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  viewing: ListingViewingRecord;
  authToken: string;
  initialCapture?: CapturedState | null;
  onSuccess: () => void;
  onClose: () => void;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function buyerName(v: ListingViewingRecord) {
  return [v.buyer_first_name, v.buyer_last_name].filter(Boolean).join(' ') || 'Buyer';
}

// ─── Component ───────────────────────────────────────────────────────────────

export function LogOutcomeModal({ viewing, authToken, initialCapture, onSuccess, onClose }: Props) {
  // Step 1 state
  const [rating, setRating]   = useState(0);
  const [hovered, setHovered] = useState(0);
  const [intent, setIntent]   = useState<string>('');

  // Step 2 state — pre-fill from live capture if provided
  const [likes, setLikes]   = useState<string[]>(() => {
    if (!initialCapture) return [];
    return Object.entries(initialCapture.roomSentiments)
      .filter(([, s]) => s === 'love')
      .map(([room]) => room);
  });
  const [dislikes, setDislikes] = useState<string[]>(() => {
    if (!initialCapture) return [];
    return Object.entries(initialCapture.roomSentiments)
      .filter(([, s]) => s === 'dislike')
      .map(([room]) => room);
  });
  const [objections, setObjections]     = useState<string[]>(initialCapture?.objections ?? []);
  const [interestLevel, setInterestLevel] = useState<'low'|'medium'|'high'|null>(initialCapture?.interestLevel ?? null);
  const [notes, setNotes]               = useState(initialCapture?.notes ?? '');
  const [duration, setDuration]         = useState<string>(
    initialCapture?.elapsedMinutes ? String(initialCapture.elapsedMinutes) : '',
  );

  const [step, setStep]       = useState<1 | 2>(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [error, setError]     = useState('');

  // Tag toggle helpers
  const toggleLike = (tag: string) =>
    setLikes((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);

  const toggleDislike = (tag: string) =>
    setDislikes((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);

  const toggleObjection = (key: string) =>
    setObjections((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const payload: AgentCaptureFeedbackPayload = {
        likes:               likes.length > 0 ? likes : undefined,
        dislikes:            dislikes.length > 0 ? dislikes : undefined,
        objections:          objections.length > 0 ? objections : undefined,
        intent:              intent as AgentCaptureFeedbackPayload['intent'] ?? undefined,
        interestLevel:       interestLevel ?? undefined,
        agentNotes:          notes || undefined,
        actualDurationMinutes: duration ? Number(duration) : undefined,
      };
      await viewingsApi.submitAgentCapture(authToken, viewing.id, payload);
      setSubmitted(true);
      setTimeout(() => { onSuccess(); }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save outcome');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
          <CheckCircle className="w-12 h-12 text-[#00E87A] mx-auto mb-3" />
          <p
            className="text-xl font-bold text-[#1A3C28]"
            style={{ fontFamily: 'Fraunces, serif' }}
          >
            Outcome logged
          </p>
          <p className="text-sm text-[#1A3C28]/50 mt-1">Buyer insights saved</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className="bg-[#F2E8D5] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 bg-[#1A3C28] shrink-0">
          <div>
            <p
              className="text-base font-bold text-[#F2E8D5]"
              style={{ fontFamily: 'Fraunces, serif' }}
            >
              Log Viewing Outcome
            </p>
            <p className="text-xs text-[#F2E8D5]/50 mt-0.5">{buyerName(viewing)}</p>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="text-[10px] font-bold text-[#F2E8D5]/50 uppercase tracking-[0.1em]"
              style={{ fontFamily: 'IBM Plex Mono, monospace' }}
            >
              Step {step} of 2
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 text-[#F2E8D5]/50 hover:text-[#F2E8D5] transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex h-1 bg-[#1A3C28]/10 shrink-0">
          <div
            className="h-full bg-[#B89040] transition-all duration-300"
            style={{ width: step === 1 ? '50%' : '100%' }}
          />
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-5 py-5">
          {step === 1 ? (
            <div className="space-y-6">
              {/* Star rating */}
              <div>
                <p className="text-xs font-bold text-[#1A3C28]/60 uppercase tracking-[0.1em] mb-3">
                  Overall Rating
                </p>
                <div className="flex gap-2 justify-center">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onMouseEnter={() => setHovered(n)}
                      onMouseLeave={() => setHovered(0)}
                      onClick={() => setRating(n)}
                      className="transition-transform hover:scale-110"
                      aria-label={`${n} star${n > 1 ? 's' : ''}`}
                    >
                      <Star
                        className={`w-9 h-9 transition-colors ${
                          n <= (hovered || rating)
                            ? 'fill-[#B89040] text-[#B89040]'
                            : 'text-[#1A3C28]/20'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p className="text-center text-xs text-[#1A3C28]/50 mt-2">
                    {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
                  </p>
                )}
              </div>

              {/* Intent */}
              <div>
                <p className="text-xs font-bold text-[#1A3C28]/60 uppercase tracking-[0.1em] mb-3">
                  Buyer Intent
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {INTENT_OPTIONS.map(({ key, label, emoji }) => (
                    <button
                      key={key}
                      onClick={() => setIntent(key)}
                      className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-semibold transition-all text-left ${
                        intent === key
                          ? 'bg-[#1A3C28] border-[#1A3C28] text-[#F2E8D5]'
                          : 'bg-white border-[#1A3C28]/15 text-[#1A3C28] hover:border-[#1A3C28]/40'
                      }`}
                    >
                      <span className="text-base">{emoji}</span>
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Liked features */}
              <div>
                <p className="text-xs font-bold text-[#1A3C28]/60 uppercase tracking-[0.1em] mb-2.5">
                  Liked Features
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {TAG_SUGGESTIONS.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleLike(tag)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        likes.includes(tag)
                          ? 'bg-[#00E87A]/20 border-[#00E87A] text-[#0D7039]'
                          : 'bg-white border-[#1A3C28]/15 text-[#1A3C28]/60 hover:border-[#1A3C28]/30'
                      }`}
                    >
                      {likes.includes(tag) ? '✓ ' : ''}{tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Disliked features */}
              <div>
                <p className="text-xs font-bold text-[#1A3C28]/60 uppercase tracking-[0.1em] mb-2.5">
                  Disliked Features
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {TAG_SUGGESTIONS.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleDislike(tag)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        dislikes.includes(tag)
                          ? 'bg-[#C4562A]/15 border-[#C4562A] text-[#C4562A]'
                          : 'bg-white border-[#1A3C28]/15 text-[#1A3C28]/60 hover:border-[#1A3C28]/30'
                      }`}
                    >
                      {dislikes.includes(tag) ? '✗ ' : ''}{tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Objections */}
              <div>
                <p className="text-xs font-bold text-[#1A3C28]/60 uppercase tracking-[0.1em] mb-2.5">
                  Objections Raised
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(['price_too_high', 'layout', 'location', 'size', 'condition', 'other'] as const).map((key) => {
                    const labels: Record<string, string> = {
                      price_too_high: 'Price Too High',
                      layout: 'Layout',
                      location: 'Location',
                      size: 'Size',
                      condition: 'Condition',
                      other: 'Other',
                    };
                    return (
                      <button
                        key={key}
                        onClick={() => toggleObjection(key)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                          objections.includes(key)
                            ? 'bg-[#C4562A] border-[#C4562A] text-white'
                            : 'bg-white border-[#1A3C28]/15 text-[#1A3C28]/60 hover:border-[#1A3C28]/30'
                        }`}
                      >
                        {labels[key]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Interest level */}
              <div>
                <p className="text-xs font-bold text-[#1A3C28]/60 uppercase tracking-[0.1em] mb-2.5">
                  Interest Level
                </p>
                <div className="flex gap-2">
                  {(['low', 'medium', 'high'] as const).map((lvl) => {
                    const activeMap = {
                      low:    'bg-[#C4562A] border-[#C4562A] text-white',
                      medium: 'bg-[#B89040] border-[#B89040] text-white',
                      high:   'bg-[#00E87A]/20 border-[#00E87A] text-[#0D7039]',
                    };
                    return (
                      <button
                        key={lvl}
                        onClick={() => setInterestLevel(lvl)}
                        className={`flex-1 py-2 rounded-xl border text-xs font-bold capitalize transition-all ${
                          interestLevel === lvl
                            ? activeMap[lvl]
                            : 'bg-white border-[#1A3C28]/15 text-[#1A3C28]/60 hover:border-[#1A3C28]/30'
                        }`}
                      >
                        {lvl}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Duration */}
              <div>
                <p className="text-xs font-bold text-[#1A3C28]/60 uppercase tracking-[0.1em] mb-2.5">
                  Actual Duration (minutes)
                </p>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  min={1}
                  max={480}
                  placeholder="e.g. 45"
                  className="w-full bg-white border border-[#1A3C28]/15 rounded-xl px-3 py-2.5 text-sm text-[#1A3C28] placeholder-[#1A3C28]/30 focus:outline-none focus:border-[#1A3C28]/50"
                />
              </div>

              {/* Notes */}
              <div>
                <p className="text-xs font-bold text-[#1A3C28]/60 uppercase tracking-[0.1em] mb-2.5">
                  Agent Notes
                </p>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional observations or follow-up actions…"
                  rows={3}
                  className="w-full bg-white border border-[#1A3C28]/15 rounded-xl px-3 py-2.5 text-sm text-[#1A3C28] placeholder-[#1A3C28]/30 focus:outline-none focus:border-[#1A3C28]/50 resize-none"
                />
              </div>

              {error && (
                <p className="text-xs text-[#C4562A] font-medium">{error}</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#1A3C28]/10 flex gap-3 shrink-0 bg-[#F2E8D5]">
          {step === 2 && (
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2.5 rounded-xl border border-[#1A3C28]/20 text-[#1A3C28]/70 text-sm font-semibold hover:bg-[#1A3C28]/[0.06] transition-colors"
            >
              Back
            </button>
          )}
          {step === 1 ? (
            <button
              onClick={() => setStep(2)}
              disabled={!intent}
              className="flex-1 py-2.5 rounded-xl bg-[#B89040] text-white text-sm font-bold hover:bg-[#A07830] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next: Add Details
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#1A3C28] text-white text-sm font-bold hover:bg-[#2D5A40] disabled:opacity-50 transition-colors"
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
              ) : (
                'Save Outcome'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
