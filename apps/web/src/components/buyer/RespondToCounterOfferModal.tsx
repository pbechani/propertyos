'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, CheckCircle2, XCircle, ArrowUpDown, Send, Loader2 } from 'lucide-react';
import { buyerOffersApi, BuyerOfferResponse } from '@/lib/api-client';
import { getAccessToken } from '@/lib/auth-session';

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const C = {
  forest:       '#1A3C28',
  forestLight:  '#2D5A40',
  parchment:    '#F2E8D5',
  cream:        '#EAD9C4',
  carbon:       '#0C0D10',
  egreen:       '#00E87A',
  amber:        '#B89040',
  muted:        '#5A7A68',
  border:       'rgba(26,60,40,0.12)',
  borderStrong: 'rgba(26,60,40,0.24)',
} as const;

const FRAUNCES = 'var(--font-fraunces, "Fraunces", Georgia, serif)';

// ─── Types ────────────────────────────────────────────────────────────────────
type Action = 'accept' | 'decline' | 'counter' | null;
type ModalStep = 'choose' | 'counter-form' | 'accept-confirm' | 'success';

interface RespondToCounterOfferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offer: BuyerOfferResponse | null;
  onSuccess: (updatedOffer: BuyerOfferResponse) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(val: string | number | null | undefined): string {
  if (val == null) return '—';
  const n = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(n)) return '—';
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(n);
}

function parseAmt(val: string | null | undefined): number {
  if (!val) return 0;
  return parseFloat(val) || 0;
}

// ─── Quick-pick suggestions ───────────────────────────────────────────────────
function getQuickPicks(buyerAmt: number, sellerAmt: number) {
  return [
    {
      label: 'Split the diff',
      description: 'Meet halfway',
      amount: Math.round((buyerAmt + sellerAmt) / 2 / 1000) * 1000,
    },
    {
      label: 'Small concede',
      description: 'Give a little ground',
      amount: Math.round((buyerAmt + (sellerAmt - buyerAmt) * 0.25) / 1000) * 1000,
    },
    {
      label: 'Accept theirs',
      description: "Take seller's price",
      amount: sellerAmt,
    },
    {
      label: 'Hold firm',
      description: 'Keep your offer',
      amount: buyerAmt,
    },
  ];
}

// ─── Negotiation timeline strip ───────────────────────────────────────────────
function NegotiationTimeline({ step }: { step: 'counter' | 'your-reply' | 'accepting' }) {
  const stages = [
    { key: 'offer', label: 'Your Offer' },
    { key: 'counter', label: "Seller's Counter" },
    { key: 'your-reply', label: 'Your Reply' },
    { key: 'agreed', label: 'Agreed' },
  ];
  const activeIdx = step === 'counter' ? 1 : step === 'your-reply' ? 2 : step === 'accepting' ? 2 : 1;

  return (
    <div className="flex items-center gap-0 w-full">
      {stages.map((s, i) => {
        const isActive = i === activeIdx;
        const isDone = i < activeIdx;
        return (
          <div key={s.key} className="flex items-center" style={{ flex: i < stages.length - 1 ? '1' : undefined }}>
            <div className="flex flex-col items-center gap-0.5">
              <div
                className="rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  width: 22, height: 22,
                  background: isActive ? C.amber : isDone ? C.egreen : 'rgba(26,60,40,0.1)',
                  color: isActive || isDone ? C.forest : C.muted,
                  fontSize: 10,
                }}
              >
                {isDone ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: 9, fontWeight: isActive ? 700 : 400, color: isActive ? C.amber : isDone ? C.forest : C.muted, whiteSpace: 'nowrap' }}>
                {s.label}
              </span>
            </div>
            {i < stages.length - 1 && (
              <div style={{ flex: 1, height: 2, background: isDone ? C.egreen : 'rgba(26,60,40,0.1)', margin: '0 4px', marginBottom: 14 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────
export function RespondToCounterOfferModal({ open, onOpenChange, offer, onSuccess }: RespondToCounterOfferModalProps) {
  const [step, setStep] = useState<ModalStep>('choose');
  const [selectedAction, setSelectedAction] = useState<Action>(null);
  const [counterAmount, setCounterAmount] = useState('');
  const [counterNotes, setCounterNotes] = useState('');
  const [counterExpiresAt, setCounterExpiresAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buyerAmt = parseAmt(offer?.amount);
  const sellerAmt = parseAmt(offer?.counter_amount);
  const delta = sellerAmt - buyerAmt;
  const quickPicks = getQuickPicks(buyerAmt, sellerAmt);

  function handleOpenChange(v: boolean) {
    if (!v) {
      // reset state on close
      setStep('choose');
      setSelectedAction(null);
      setCounterAmount('');
      setCounterNotes('');
      setCounterExpiresAt('');
      setError(null);
    }
    onOpenChange(v);
  }

  async function handleSubmit() {
    if (!offer) return;
    setLoading(true);
    setError(null);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Session expired — please log in again');

      let payload: Parameters<typeof buyerOffersApi.respond>[2];
      if (selectedAction === 'accept') {
        payload = { action: 'accept' };
      } else if (selectedAction === 'decline') {
        payload = { action: 'decline' };
      } else {
        const amt = parseFloat(counterAmount.replace(/[^0-9.]/g, ''));
        if (!amt || amt <= 0) { setError('Please enter a valid counter amount'); setLoading(false); return; }
        payload = { action: 'counter', counterAmount: amt, counterNotes: counterNotes || undefined, counterExpiresAt: counterExpiresAt || undefined };
      }

      const result = await buyerOffersApi.respond(token, offer.id, payload);
      void result; // response acknowledged; build update from known local state
      const updatedOffer: BuyerOfferResponse = {
        ...offer,
        status:
          selectedAction === 'accept' ? 'accepted' :
          selectedAction === 'decline' ? 'rejected' :
          'countered',
        ...(selectedAction === 'counter' && {
          counter_amount: String(payload.counterAmount ?? offer.counter_amount),
          counter_notes: payload.counterNotes ?? offer.counter_notes,
        }),
      };
      setStep('success');
      onSuccess(updatedOffer);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  function selectAction(action: Action) {
    setSelectedAction(action);
    if (action === 'counter') setStep('counter-form');
    else if (action === 'accept') setStep('accept-confirm');
  }

  if (!offer) return null;

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-50"
          style={{ background: 'rgba(12,13,16,0.55)', backdropFilter: 'blur(4px)' }}
        />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl shadow-2xl overflow-hidden"
          style={{ background: C.parchment, maxHeight: '90vh', overflowY: 'auto' }}
        >
          {/* Header */}
          <div style={{ background: step === 'accept-confirm' || (step === 'success' && selectedAction === 'accept') ? '#1A5C35' : C.forest, padding: '20px 24px 16px' }}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <Dialog.Title style={{ fontFamily: FRAUNCES, fontSize: 20, fontWeight: 700, color: C.parchment, lineHeight: 1.2 }}>
                  {step === 'success'
                    ? selectedAction === 'accept' ? 'Offer Accepted! 🎉' : selectedAction === 'decline' ? 'Counter Declined' : 'Counter-Offer Sent!'
                    : step === 'accept-confirm'
                    ? 'Confirm Acceptance'
                    : 'Respond to Counter-Offer'}
                </Dialog.Title>
                <p style={{ fontSize: 13, color: 'rgba(242,232,213,0.7)', marginTop: 4 }}>
                  {offer.property_title ?? `Property ${offer.property_id.slice(0, 8)}…`}
                </p>
              </div>
              <Dialog.Close
                className="rounded-lg p-1.5 transition-colors"
                style={{ background: 'rgba(242,232,213,0.1)', color: C.parchment }}
              >
                <X size={16} />
              </Dialog.Close>
            </div>
            {step !== 'success' && (
              <div className="mt-4">
                <NegotiationTimeline step={step === 'accept-confirm' ? 'accepting' : 'counter'} />
              </div>
            )}
          </div>

          <div style={{ padding: '20px 24px' }}>
            {/* ── Offer comparison pill ─────────────────────────────── */}
            {step !== 'success' && (
              <div
                className="flex items-center justify-between rounded-xl px-4 py-3 mb-5"
                style={{ background: C.cream, border: `1px solid ${C.borderStrong}` }}
              >
                <div className="text-center">
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.muted }}>Your Offer</div>
                  <div style={{ fontFamily: FRAUNCES, fontSize: 18, fontWeight: 700, color: C.forest }}>{fmt(offer.amount)}</div>
                </div>
                <div className="flex flex-col items-center">
                  <ArrowUpDown size={14} color={C.amber} />
                  <span style={{ fontSize: 10, color: C.amber, fontWeight: 700, marginTop: 2 }}>
                    {delta >= 0 ? `+${fmt(delta)}` : fmt(delta)}
                  </span>
                </div>
                <div className="text-center">
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.muted }}>Seller Wants</div>
                  <div style={{ fontFamily: FRAUNCES, fontSize: 18, fontWeight: 700, color: C.amber }}>{fmt(offer.counter_amount)}</div>
                </div>
              </div>
            )}

            {/* Seller note */}
            {step !== 'success' && offer.counter_notes && (
              <div
                className="rounded-xl px-4 py-3 mb-5 italic"
                style={{ background: 'rgba(184,144,64,0.06)', border: `1px solid rgba(184,144,64,0.2)`, fontSize: 13, color: C.muted }}
              >
                <span style={{ fontWeight: 700, fontStyle: 'normal', color: C.forest }}>Seller: </span>
                {offer.counter_notes}
              </div>
            )}

            {/* ── Step: choose ───────────────────────────────────────── */}
            {step === 'choose' && (
              <div className="flex flex-col gap-3">
                <p style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>How would you like to respond?</p>

                {/* Accept card */}
                <button
                  onClick={() => selectAction('accept')}
                  className="w-full rounded-xl px-4 py-3.5 text-left transition-all"
                  style={{
                    background: selectedAction === 'accept' ? 'rgba(0,232,122,0.1)' : 'white',
                    border: `2px solid ${selectedAction === 'accept' ? C.egreen : C.border}`,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg flex items-center justify-center" style={{ width: 36, height: 36, background: 'rgba(0,232,122,0.12)' }}>
                      <CheckCircle2 size={18} color="#00A855" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: C.forest, fontSize: 14 }}>Accept Counter-Offer</div>
                      <div style={{ fontSize: 12, color: C.muted }}>Agree to {fmt(offer.counter_amount)} and advance to Sale Agreement</div>
                    </div>
                  </div>
                </button>

                {/* Counter back card */}
                <button
                  onClick={() => selectAction('counter')}
                  className="w-full rounded-xl px-4 py-3.5 text-left transition-all"
                  style={{
                    background: selectedAction === 'counter' ? 'rgba(184,144,64,0.08)' : 'white',
                    border: `2px solid ${selectedAction === 'counter' ? C.amber : C.border}`,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg flex items-center justify-center" style={{ width: 36, height: 36, background: 'rgba(184,144,64,0.1)' }}>
                      <ArrowUpDown size={18} color={C.amber} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: C.forest, fontSize: 14 }}>Counter Back</div>
                      <div style={{ fontSize: 12, color: C.muted }}>Propose a different price and keep negotiating</div>
                    </div>
                  </div>
                </button>

                {/* Decline card */}
                <button
                  onClick={() => { setSelectedAction('decline'); setStep('choose'); }}
                  className="w-full rounded-xl px-4 py-3.5 text-left transition-all"
                  style={{
                    background: selectedAction === 'decline' ? 'rgba(200,50,50,0.05)' : 'white',
                    border: `2px solid ${selectedAction === 'decline' ? '#C83232' : C.border}`,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg flex items-center justify-center" style={{ width: 36, height: 36, background: 'rgba(200,50,50,0.08)' }}>
                      <XCircle size={18} color="#C83232" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: C.forest, fontSize: 14 }}>Decline</div>
                      <div style={{ fontSize: 12, color: C.muted }}>Walk away from this negotiation</div>
                    </div>
                  </div>
                </button>

                {/* Decline confirm button */}
                {selectedAction === 'decline' && (
                  <div className="mt-1">
                    <p style={{ fontSize: 12, color: '#C83232', marginBottom: 10 }}>
                      Are you sure? Declining will end this negotiation and the offer will be closed.
                    </p>
                    {error && <p style={{ fontSize: 12, color: '#C83232', marginBottom: 8 }}>{error}</p>}
                    <div className="flex gap-3">
                      <button
                        onClick={() => setSelectedAction(null)}
                        className="flex-1 rounded-xl py-2.5 text-sm font-semibold"
                        style={{ background: 'white', color: C.forest, border: `1.5px solid ${C.borderStrong}` }}
                      >
                        Go Back
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-1 rounded-xl py-2.5 text-sm font-bold flex items-center justify-center gap-2"
                        style={{ background: '#C83232', color: 'white' }}
                      >
                        {loading ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                        Confirm Decline
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Step: counter-form ─────────────────────────────────── */}
            {step === 'counter-form' && (
              <div className="flex flex-col gap-4">
                {/* Quick picks */}
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.muted, marginBottom: 8 }}>Quick picks</p>
                  <div className="grid grid-cols-2 gap-2">
                    {quickPicks.map((qp) => (
                      <button
                        key={qp.label}
                        onClick={() => setCounterAmount(String(qp.amount))}
                        className="rounded-xl px-3 py-2.5 text-left transition-all"
                        style={{
                          background: counterAmount === String(qp.amount) ? 'rgba(26,60,40,0.08)' : 'white',
                          border: `1.5px solid ${counterAmount === String(qp.amount) ? C.forest : C.border}`,
                        }}
                      >
                        <div style={{ fontSize: 10, color: C.muted }}>{qp.label}</div>
                        <div style={{ fontFamily: FRAUNCES, fontSize: 14, fontWeight: 700, color: C.forest }}>{fmt(qp.amount)}</div>
                        <div style={{ fontSize: 10, color: C.muted, fontStyle: 'italic' }}>{qp.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount input */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: C.forest, display: 'block', marginBottom: 6 }}>
                    Your Counter Amount *
                  </label>
                  <div className="flex rounded-xl overflow-hidden" style={{ border: `1.5px solid ${C.borderStrong}` }}>
                    <span className="flex items-center px-3 text-sm font-bold" style={{ background: C.cream, color: C.forest, borderRight: `1px solid ${C.borderStrong}` }}>R</span>
                    <input
                      type="number"
                      min="1"
                      value={counterAmount}
                      onChange={(e) => setCounterAmount(e.target.value)}
                      placeholder="e.g. 1850000"
                      className="flex-1 px-3 py-2.5 text-sm outline-none"
                      style={{ background: 'white', color: C.carbon, fontFamily: FRAUNCES }}
                    />
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: C.forest, display: 'block', marginBottom: 6 }}>
                    Message to Seller <span style={{ fontWeight: 400, color: C.muted }}>(optional)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={counterNotes}
                    onChange={(e) => setCounterNotes(e.target.value)}
                    placeholder="Explain your reasoning…"
                    className="w-full rounded-xl px-3 py-2.5 text-sm outline-none resize-none"
                    style={{ background: 'white', border: `1.5px solid ${C.borderStrong}`, color: C.carbon }}
                  />
                </div>

                {/* Expiry date */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: C.forest, display: 'block', marginBottom: 6 }}>
                    Offer Expiry <span style={{ fontWeight: 400, color: C.muted }}>(optional — defaults to 48 h)</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={counterExpiresAt}
                    onChange={(e) => setCounterExpiresAt(e.target.value)}
                    className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                    style={{ background: 'white', border: `1.5px solid ${C.borderStrong}`, color: C.carbon }}
                  />
                </div>

                {error && <p style={{ fontSize: 12, color: '#C83232' }}>{error}</p>}

                <div className="flex gap-3 mt-1">
                  <button
                    onClick={() => { setStep('choose'); setSelectedAction(null); }}
                    className="flex-1 rounded-xl py-2.5 text-sm font-semibold"
                    style={{ background: 'white', color: C.forest, border: `1.5px solid ${C.borderStrong}` }}
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading || !counterAmount}
                    className="flex-1 rounded-xl py-2.5 text-sm font-bold flex items-center justify-center gap-2"
                    style={{ background: C.forest, color: C.parchment, opacity: !counterAmount ? 0.5 : 1 }}
                  >
                    {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    Send Counter-Offer
                  </button>
                </div>
              </div>
            )}

            {/* ── Step: accept-confirm ───────────────────────────────── */}
            {step === 'accept-confirm' && (
              <div className="flex flex-col gap-4">
                <div
                  className="rounded-xl px-4 py-4"
                  style={{ background: 'rgba(0,232,122,0.06)', border: '1px solid rgba(0,232,122,0.25)' }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.forest, marginBottom: 8 }}>You are agreeing to:</div>
                  <div className="flex flex-col gap-2">
                    {[
                      [`Purchase Price`, fmt(offer.counter_amount)],
                      [`Your Original Offer`, fmt(offer.amount)],
                      [`Financing`, offer.financing],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between items-center">
                        <span style={{ fontSize: 12, color: C.muted }}>{label}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: C.forest, fontFamily: FRAUNCES }}>{value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${C.border}`, fontSize: 11, color: C.muted, fontStyle: 'italic' }}>
                    Accepting this counter-offer moves your purchase to Stage 4: Sale Agreement (OTP). The conveyancer will be notified.
                  </div>
                </div>

                {error && <p style={{ fontSize: 12, color: '#C83232' }}>{error}</p>}

                <div className="flex gap-3">
                  <button
                    onClick={() => { setStep('choose'); setSelectedAction(null); }}
                    className="flex-1 rounded-xl py-2.5 text-sm font-semibold"
                    style={{ background: 'white', color: C.forest, border: `1.5px solid ${C.borderStrong}` }}
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 rounded-xl py-2.5 text-sm font-bold flex items-center justify-center gap-2"
                    style={{ background: '#1A5C35', color: 'white' }}
                  >
                    {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    Confirm Acceptance
                  </button>
                </div>
              </div>
            )}

            {/* ── Step: success ──────────────────────────────────────── */}
            {step === 'success' && (
              <div className="flex flex-col items-center gap-4 py-2">
                <div
                  className="rounded-full flex items-center justify-center"
                  style={{ width: 64, height: 64, background: selectedAction === 'accept' ? 'rgba(0,232,122,0.12)' : selectedAction === 'decline' ? 'rgba(200,50,50,0.08)' : 'rgba(184,144,64,0.1)' }}
                >
                  {selectedAction === 'accept'
                    ? <CheckCircle2 size={32} color="#00A855" />
                    : selectedAction === 'decline'
                    ? <XCircle size={32} color="#C83232" />
                    : <Send size={32} color={C.amber} />}
                </div>
                <div className="text-center">
                  <div style={{ fontFamily: FRAUNCES, fontSize: 18, fontWeight: 700, color: C.forest }}>
                    {selectedAction === 'accept' ? 'Deal Agreed!' : selectedAction === 'decline' ? 'Counter Declined' : 'Counter-Offer Sent!'}
                  </div>
                  <p style={{ fontSize: 13, color: C.muted, marginTop: 6 }}>
                    {selectedAction === 'accept'
                      ? 'Your purchase moves to Stage 4: Sale Agreement. The conveyancer will be in touch.'
                      : selectedAction === 'decline'
                      ? 'The seller has been notified. This offer is now closed.'
                      : 'The seller will be notified and has 48 hours to respond.'}
                  </p>
                </div>

                {selectedAction === 'accept' && (
                  <div className="w-full rounded-xl px-4 py-3" style={{ background: C.cream, border: `1px solid ${C.border}` }}>
                    <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.muted, marginBottom: 8 }}>What happens next</p>
                    {[
                      'Sale Agreement (OTP) is drafted',
                      'Both parties sign the OTP',
                      'Deposit paid into escrow',
                      'Conveyancer begins transfer process',
                    ].map((item, i) => (
                      <div key={item} className="flex items-center gap-2 py-1">
                        <div className="rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ width: 18, height: 18, background: C.forest, color: C.parchment, fontSize: 9 }}>{i + 1}</div>
                        <span style={{ fontSize: 12, color: C.forest }}>{item}</span>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => handleOpenChange(false)}
                  className="w-full rounded-xl py-2.5 text-sm font-bold"
                  style={{ background: C.forest, color: C.parchment }}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
