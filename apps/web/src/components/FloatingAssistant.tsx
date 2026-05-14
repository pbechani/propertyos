'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import {
  ArrowRight,
  Loader2,
  Mic,
  MicOff,
  Minus,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import {
  getAccessToken,
} from '@/lib/auth-session';
import {
  aiIntelligenceApi,
  propertiesApi,
  type AssistantListItem,
  type AssistantResponse,
  type PropertyListing,
} from '@/lib/api-client';

// ── Page context helper ──────────────────────────────────────────────────────

type PageCtx = { label: string; ctx: string; propertyId?: string };

function getPageContext(pathname: string): PageCtx {
  let m = pathname.match(/^\/app\/leads\/([0-9a-f-]{36})(?:\/|$)/i);
  if (m) return { label: 'Lead detail', ctx: `Lead detail page. lead-id:${m[1]}` };

  m = pathname.match(/^\/app\/property\/([0-9a-f-]{36})(?:\/|$)/i)
    ?? pathname.match(/^\/app\/properties\/([0-9a-f-]{36})(?:\/|$)/i)
    ?? pathname.match(/^\/properties\/([0-9a-f-]{36})(?:\/|$)/i);
  if (m) return { label: 'Property detail', ctx: `Property detail page. property-id:${m[1]}`, propertyId: m[1] };

  if (pathname === '/app/leads/pipeline') return { label: 'Pipeline', ctx: 'Viewing the lead pipeline kanban board' };
  if (pathname === '/app/leads/dashboard') return { label: 'Lead dashboard', ctx: 'Viewing the lead management dashboard' };
  if (pathname === '/app/leads/analytics') return { label: 'Lead analytics', ctx: 'Viewing lead analytics and conversion charts' };
  if (pathname.startsWith('/app/leads')) return { label: 'Leads', ctx: 'Viewing the leads list' };
  if (pathname.startsWith('/app/properties')) return { label: 'Listings', ctx: 'Viewing property listings' };
  if (pathname.startsWith('/properties')) return { label: 'Listings', ctx: 'Viewing property listings' };
  if (pathname.startsWith('/app/dashboard')) return { label: 'Dashboard', ctx: 'Viewing the main dashboard' };

  return { label: 'App', ctx: `Page: ${pathname}` };
}

// ── Build rich property context string ───────────────────────────────────────

function buildPropertyContext(property: PropertyListing): string {
  const parts: string[] = [
    'The user is currently viewing a property listing page.',
    `Property title: ${property.title}`,
    `Type: ${property.property_type.replace(/_/g, ' ')}`,
    `Price: ${property.price} ${property.currency}`,
  ];
  if (property.bedrooms != null) parts.push(`Bedrooms: ${property.bedrooms}`);
  if (property.bathrooms != null) parts.push(`Bathrooms: ${property.bathrooms}`);
  if (property.parking_spaces != null) parts.push(`Parking spaces: ${property.parking_spaces}`);
  if (property.area_sqm != null) parts.push(`Floor area: ${property.area_sqm} m²`);
  if (property.location) {
    const loc = [
      property.location.address_line1,
      property.location.city,
      property.location.region,
      property.location.country,
    ].filter(Boolean).join(', ');
    if (loc) parts.push(`Location: ${loc}`);
  }
  parts.push(`Verification status: ${property.verification_status}`);
  if (property.listing_type) parts.push(`Listing type: ${property.listing_type.replace(/_/g, ' ')}`);
  if (property.features?.length) parts.push(`Features: ${property.features.join(', ')}`);
  if (property.description) {
    // Cap description length to keep context manageable
    const desc = property.description.replace(/\s+/g, ' ').trim();
    parts.push(`Description: ${desc.slice(0, 400)}`);
  }
  return parts.join('. ');
}

// ── Badge colours shared with the page panel ─────────────────────────────────

const BADGE_COLORS: Record<string, string> = {
  red: 'bg-red-100 text-red-700',
  orange: 'bg-orange-100 text-orange-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  green: 'bg-green-100 text-green-700',
  blue: 'bg-blue-100 text-blue-700',
  purple: 'bg-purple-100 text-purple-700',
  gray: 'bg-gray-100 text-gray-600',
};

// ── Response renderers (self-contained copy adapted for compact layout) ───────

function renderText(text: string) {
  return text.split('\n').map((line, i) => {
    const parts = line.split(/\*\*(.+?)\*\*/g);
    return (
      <span key={i} className="block leading-snug">
        {parts.map((part, j) =>
          j % 2 === 1 ? (
            <strong key={j} className="font-semibold text-gray-900">
              {part}
            </strong>
          ) : (
            part
          ),
        )}
      </span>
    );
  });
}

function AssistantListResponse({
  items,
  title,
  totalCount,
}: {
  items: AssistantListItem[];
  title?: string;
  totalCount?: number;
}) {
  return (
    <div className="space-y-1.5">
      {title && (
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
          {title}
          {totalCount && totalCount > items.length ? ` (showing ${items.length} of ${totalCount})` : ''}
        </p>
      )}
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-2 p-2 rounded-lg border border-gray-100 bg-gray-50 hover:bg-white transition-colors"
        >
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-900 truncate">{item.label}</p>
            {item.sublabel && (
              <p className="text-[10px] text-gray-500 truncate">{item.sublabel}</p>
            )}
          </div>
          {item.badge && (
            <span
              className={`flex-shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                BADGE_COLORS[item.badgeColor ?? 'gray'] ?? BADGE_COLORS.gray
              }`}
            >
              {item.badge}
            </span>
          )}
          {item.href && (
            <Link href={item.href} className="flex-shrink-0 text-gray-400 hover:text-blue-600">
              <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}

function AssistantChartResponse({ response }: { response: AssistantResponse }) {
  if (!response.chart) return null;
  return (
    <div className="space-y-2">
      {response.title && (
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
          {response.title}
        </p>
      )}
      <ResponsiveContainer width="100%" height={140}>
        <BarChart
          data={response.chart.bars}
          margin={{ top: 4, right: 4, bottom: 4, left: -20 }}
        >
          <XAxis dataKey="label" tick={{ fontSize: 9 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 9 }} />
          <Tooltip
            contentStyle={{ fontSize: 11, borderRadius: 8 }}
            formatter={(v: number) => [v, '']}
          />
          <Bar dataKey="value" radius={[3, 3, 0, 0]}>
            {response.chart.bars.map((bar, i) => (
              <Cell key={i} fill={bar.color ?? '#6366f1'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {response.summaryCards && response.summaryCards.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {response.summaryCards.map((card, i) => (
            <div
              key={i}
              className="flex items-center gap-1 bg-gray-50 border rounded px-2 py-1"
            >
              <span className="text-[10px] text-gray-500">{card.label}:</span>
              <span className="text-[10px] font-bold text-gray-900">{card.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const SUMMARY_COLOR: Record<string, string> = {
  red: 'text-red-600',
  orange: 'text-orange-500',
  green: 'text-green-600',
  blue: 'text-blue-600',
  purple: 'text-purple-600',
  gray: 'text-gray-500',
};

function FloatingAssistantResponseRenderer({
  response,
}: {
  response: AssistantResponse;
}) {
  if (response.responseType === 'list' && response.items) {
    return (
      <AssistantListResponse
        items={response.items}
        title={response.title}
        totalCount={response.totalCount}
      />
    );
  }
  if (response.responseType === 'chart') {
    return <AssistantChartResponse response={response} />;
  }
  if (response.responseType === 'summary' && response.summaryCards) {
    return (
      <div className="space-y-2">
        {response.title && (
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
            {response.title}
          </p>
        )}
        <div className="grid grid-cols-2 gap-1.5">
          {response.summaryCards.map((card, i) => (
            <div
              key={i}
              className="bg-gray-50 rounded-lg p-2 border border-gray-100"
            >
              <p
                className={`text-base font-bold leading-none ${
                  SUMMARY_COLOR[card.color ?? ''] ?? 'text-gray-800'
                }`}
              >
                {card.value}
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">{card.label}</p>
            </div>
          ))}
        </div>
        {response.text && (
          <div className="text-xs text-gray-700 leading-relaxed pt-1">
            {renderText(response.text)}
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="space-y-0.5">
      {response.title && (
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
          {response.title}
        </p>
      )}
      {response.text && (
        <div className="text-xs text-gray-700 leading-relaxed">
          {renderText(response.text)}
        </div>
      )}
    </div>
  );
}

// ── Types ────────────────────────────────────────────────────────────────────

type Message = {
  id: string;
  role: 'user' | 'assistant';
  text?: string;
  response?: AssistantResponse;
};

// ── Main component ───────────────────────────────────────────────────────────

export function FloatingAssistant() {
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimised, setIsMinimised] = useState(false);
  // null until client mounts (SSR-safe)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [propertyDetails, setPropertyDetails] = useState<PropertyListing | null>(null);

  const dragRef = useRef({ dragging: false, sx: 0, sy: 0, px: 0, py: 0 });
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef('');

  // ── Init position + detect voice support on mount ─────────────────────────
  useEffect(() => {
    setPos({
      x: Math.max(20, window.innerWidth - 420),
      y: 80,
    });
    // Detect speech recognition support without re-declaring global Window types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    setVoiceSupported(!!(w.SpeechRecognition || w.webkitSpeechRecognition));
  }, []);

  // ── Drag handlers on window ───────────────────────────────────────────────
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragRef.current.dragging) return;
      const { sx, sy, px, py } = dragRef.current;
      setPos({
        x: Math.max(0, Math.min(window.innerWidth - 380, px + e.clientX - sx)),
        y: Math.max(0, Math.min(window.innerHeight - 56, py + e.clientY - sy)),
      });
    };
    const onMouseUp = () => {
      dragRef.current.dragging = false;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!dragRef.current.dragging || !e.touches[0]) return;
      const { sx, sy, px, py } = dragRef.current;
      const t = e.touches[0];
      setPos({
        x: Math.max(0, Math.min(window.innerWidth - 380, px + t.clientX - sx)),
        y: Math.max(0, Math.min(window.innerHeight - 56, py + t.clientY - sy)),
      });
    };
    const onTouchEnd = () => {
      dragRef.current.dragging = false;
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  // ── Auto-scroll to latest message ─────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Fetch property details when on a property page ─────────────────────────
  const { label: pageLabel, ctx: pageContext, propertyId } = getPageContext(pathname);

  useEffect(() => {
    if (!propertyId) {
      setPropertyDetails(null);
      return;
    }
    let cancelled = false;
    propertiesApi.getById(propertyId)
      .then((data) => { if (!cancelled) setPropertyDetails(data); })
      .catch(() => { if (!cancelled) setPropertyDetails(null); });
    return () => { cancelled = true; };
  }, [propertyId]);

  // Enriched context: use full property data when available, fall back to URL-based context
  const enrichedContext = propertyDetails ? buildPropertyContext(propertyDetails) : pageContext;

  // ── Send a message ─────────────────────────────────────────────────────────
  const send = useCallback(
    async (queryText: string) => {
      const trimmed = queryText.trim();
      if (!trimmed || loading) return;
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'user', text: trimmed },
      ]);
      setInput('');
      setLoading(true);
      setIsMinimised(false);
      try {
        const token = await getAccessToken();
        if (!token) throw new Error('Not authenticated');
        const orchestrated = await aiIntelligenceApi.queryOrchestrated(token, trimmed, enrichedContext);
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: 'assistant', response: orchestrated.response },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            response: {
              responseType: 'error',
              text: 'Something went wrong. Please try again.',
            },
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [loading, enrichedContext],
  );

  // ── Voice input ───────────────────────────────────────────────────────────
  const toggleVoice = () => {
    if (isListening) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const SpeechRecognitionAPI = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const recognition = new SpeechRecognitionAPI();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    recognition.continuous = false;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    recognition.interimResults = true;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    recognition.lang = 'en-ZA';
    finalTranscriptRef.current = '';
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    recognition.onresult = (event: Record<string, unknown>) => {
      const results = event.results as Record<number, Record<number, { transcript: string }> & { isFinal: boolean; length: number }> & { length: number };
      let transcript = '';
      for (let i = 0; i < results.length; i++) {
        transcript += results[i][0].transcript;
      }
      setInput(transcript);
      if (results[results.length - 1].isFinal) {
        finalTranscriptRef.current = transcript;
      }
    };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    recognition.onend = () => {
      setIsListening(false);
      const final = finalTranscriptRef.current;
      if (final) {
        finalTranscriptRef.current = '';
        void send(final);
      }
    };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    recognition.onerror = () => {
      setIsListening(false);
    };
    recognitionRef.current = recognition;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    recognition.start();
    setIsListening(true);
  };

  // ── Drag start ────────────────────────────────────────────────────────────
  const onHeaderMouseDown = (e: React.MouseEvent) => {
    if (!pos) return;
    dragRef.current = { dragging: true, sx: e.clientX, sy: e.clientY, px: pos.x, py: pos.y };
  };
  const onHeaderTouchStart = (e: React.TouchEvent) => {
    if (!pos || !e.touches[0]) return;
    const t = e.touches[0];
    dragRef.current = { dragging: true, sx: t.clientX, sy: t.clientY, px: pos.x, py: pos.y };
  };

  // ── Open / don't render until client-side ─────────────────────────────────
  const handleOpen = () => {
    setIsOpen(true);
    setIsMinimised(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleClose = () => {
    setIsOpen(false);
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Floating action button — shown when window is closed */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          aria-label="Open AI Assistant"
          className="fixed bottom-6 right-6 z-[9998] w-14 h-14 rounded-full shadow-xl flex items-center justify-center
                     bg-gradient-to-br from-purple-600 to-blue-600 text-white
                     hover:from-purple-700 hover:to-blue-700 transition-all duration-200
                     focus:outline-none focus:ring-4 focus:ring-purple-300
                     animate-[pulse_4s_ease-in-out_infinite]"
        >
          <Sparkles className="w-6 h-6" />
        </button>
      )}

      {/* Floating window */}
      {isOpen && pos !== null && (
        <div
          role="dialog"
          aria-label="AI Assistant"
          style={{
            position: 'fixed',
            left: pos.x,
            top: pos.y,
            zIndex: 9999,
            width: 372,
          }}
          className="rounded-2xl shadow-2xl border border-white/10 overflow-hidden flex flex-col bg-white select-none
                     ring-1 ring-black/5"
        >
          {/* Header — draggable */}
          <div
            onMouseDown={onHeaderMouseDown}
            onTouchStart={onHeaderTouchStart}
            className="flex items-center gap-2 px-3 py-2.5
                       bg-gradient-to-r from-purple-600 to-blue-600
                       cursor-grab active:cursor-grabbing"
          >
            <Sparkles className="w-4 h-4 text-white/90 flex-shrink-0" />
            <span className="text-sm font-semibold text-white flex-1 truncate">
              AI Assistant
            </span>
            {/* Page context badge */}
            <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full truncate max-w-[96px]">
              {pageLabel}
            </span>
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => setIsMinimised((v) => !v)}
              aria-label={isMinimised ? 'Expand' : 'Minimise'}
              className="p-1 rounded hover:bg-white/20 text-white/80 hover:text-white transition-colors"
            >
              <Minus className="w-3 h-3" />
            </button>
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={handleClose}
              aria-label="Close AI Assistant"
              className="p-1 rounded hover:bg-white/20 text-white/80 hover:text-white transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          {/* Body — hidden when minimised */}
          {!isMinimised && (
            <>
              {/* Message history */}
              <div
                className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50"
                style={{ maxHeight: 420, minHeight: 200 }}
              >
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center mb-2">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-xs font-semibold text-gray-800 mb-1">
                      What can I help with?
                    </p>
                    <p className="text-[10px] text-gray-500 max-w-[260px]">
                      {propertyDetails ? (
                        <>I can see you&apos;re viewing <strong>{propertyDetails.title}</strong>. Ask me anything about this property — price, features, location, or how to proceed.</>  
                      ) : (
                        <>Ask about leads, listings, pipeline, tasks — or anything about your CRM data.
                        {pageLabel !== 'App' && (
                          <> I can see you&apos;re on <strong>{pageLabel}</strong>.</>
                        )}</>
                      )}
                    </p>
                  </div>
                )}

                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'user' ? (
                      <div className="max-w-[240px] bg-blue-600 text-white text-xs px-3 py-2 rounded-2xl rounded-tr-sm shadow-sm">
                        {msg.text}
                      </div>
                    ) : (
                      <div className="max-w-[310px] w-full bg-white border rounded-2xl rounded-tl-sm px-3 py-2.5 shadow-sm">
                        {msg.response && (
                          <FloatingAssistantResponseRenderer response={msg.response} />
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-white border rounded-2xl rounded-tl-sm px-3 py-2.5 shadow-sm flex items-center gap-2 text-gray-400">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span className="text-xs">Thinking…</span>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input row */}
              <div className="flex items-center gap-1.5 px-3 py-2.5 border-t bg-white">
                {voiceSupported && (
                  <button
                    onClick={toggleVoice}
                    aria-label={isListening ? 'Stop listening' : 'Start voice input'}
                    className={`flex-shrink-0 p-1.5 rounded-lg transition-all ${
                      isListening
                        ? 'bg-red-100 text-red-600 animate-pulse ring-2 ring-red-300'
                        : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {isListening ? (
                      <MicOff className="w-4 h-4" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                  </button>
                )}
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void send(input);
                    }
                  }}
                  placeholder={isListening ? 'Listening…' : 'Ask anything…'}
                  disabled={isListening}
                  className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2
                             focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                             placeholder:text-gray-400 disabled:opacity-60"
                />
                <button
                  onClick={() => void send(input)}
                  disabled={loading || !input.trim()}
                  aria-label="Send message"
                  className="flex-shrink-0 p-1.5 bg-blue-600 text-white rounded-lg
                             hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed
                             transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
