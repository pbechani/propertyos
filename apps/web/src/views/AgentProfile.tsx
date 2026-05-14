'use client';

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useParams, Link } from "@/lib/router-compat";
import {
  ChevronLeft, Shield, Star, MapPin, Phone, Mail,
  MessageSquare, Award, TrendingUp, Home, Calendar,
  Clock, Eye, ThumbsUp, X, Loader2, CheckCircle, Quote
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatarContent } from "@/components/UserAvatarContent";
import {
  propertiesApi,
  type AgentProfileResponse,
  type ContactAgentPayload,
  type ScheduleCallPayload,
  type AgentReview,
} from "@/lib/api-client";
import { getAccessToken, getStoredUser } from "@/lib/auth-session";

import { formatMoney } from "@/lib/formatters";

const DEFAULT_LISTING_IMAGE = "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=300&h=200&fit=crop";

// ─── Brand constants ───────────────────────────────────────────────────────────
const FRAUNCES = 'var(--font-fraunces, "Fraunces", Georgia, serif)';
const MONO     = 'var(--font-mono, "IBM Plex Mono", monospace)';
const C = {
  forest:      '#1A3C28',
  forestLight: '#2D5A40',
  parchment:   '#F2E8D5',
  cream:       '#EAD9C4',
  carbon:      '#0C0D10',
  egreen:      '#00E87A',
  amber:       '#B89040',
  muted:       '#6B8A76',
  faint:       '#9AAFA4',
  border:      'rgba(26,60,40,0.12)',
};

function formatDate(value: string | Date): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }
  return parsed.toISOString().slice(0, 10);
}

// ─── Modal base ───────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" style={{ border: `1px solid ${C.border}` }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${C.border}` }}>
          <h2 className="text-lg font-semibold" style={{ fontFamily: FRAUNCES, color: C.forest }}>{title}</h2>
          <button
            onClick={onClose}
            className="transition-colors"
            style={{ color: `${C.forest}60` }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = C.forest; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = `${C.forest}60`; }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ─── Shared form field styles ─────────────────────────────────────────────────
const inputCls = "w-full rounded-lg px-3 py-2 text-sm outline-none transition-shadow"
  + " bg-white border focus:ring-2";
const inputStyle = { borderColor: C.border, color: C.forest };

function FormLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: C.muted }}>{children}</label>;
}

// ─── Contact Agent Modal ──────────────────────────────────────────────────────
function ContactAgentModal({
  agentId,
  agentName,
  onClose,
}: {
  agentId: string;
  agentName: string;
  onClose: () => void;
}) {
  const [form, setForm] = useState({ message: "", requesterName: "", requesterEmail: "", requesterPhone: "" });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const storedUser = getStoredUser();
  const token = getAccessToken();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");

    const payload: ContactAgentPayload = {
      message: form.message.trim() || undefined,
      requesterName: storedUser
        ? `${storedUser.firstName ?? ""} ${storedUser.lastName ?? ""}`.trim() || undefined
        : form.requesterName.trim() || undefined,
      requesterEmail: storedUser?.email ?? (form.requesterEmail.trim() || undefined),
      requesterPhone: form.requesterPhone.trim() || undefined,
    };

    try {
      await propertiesApi.contactAgent(agentId, payload, token ?? undefined);
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMsg("Unable to send your message. Please try again.");
    }
  };

  if (status === "success") {
    return (
      <Modal title="Message Sent" onClose={onClose}>
        <div className="text-center py-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
            style={{ background: `${C.egreen}20` }}>
            <CheckCircle className="w-8 h-8" style={{ color: C.forestLight }} />
          </div>
          <p className="font-semibold mb-1" style={{ color: C.forest }}>Message sent to {agentName}</p>
          <p className="text-sm mb-4" style={{ color: C.muted }}>The agent will get back to you shortly.</p>
          <Button onClick={onClose} className="w-full font-bold" style={{ background: C.egreen, color: C.carbon }}>Close</Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title={`Contact ${agentName}`} onClose={onClose}>
      <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-4">
        {!storedUser && (
          <>
            <div>
              <FormLabel>Your Name</FormLabel>
              <input
                className={inputCls}
                style={inputStyle}
                placeholder="Full name"
                value={form.requesterName}
                onChange={(e) => setForm({ ...form, requesterName: e.target.value })}
              />
            </div>
            <div>
              <FormLabel>Email</FormLabel>
              <input
                type="email"
                className={inputCls}
                style={inputStyle}
                placeholder="your@email.com"
                value={form.requesterEmail}
                onChange={(e) => setForm({ ...form, requesterEmail: e.target.value })}
              />
            </div>
          </>
        )}
        <div>
          <FormLabel>Phone (optional)</FormLabel>
          <input
            type="tel"
            className={inputCls}
            style={inputStyle}
            placeholder="+27 xxx xxx xxxx"
            value={form.requesterPhone}
            onChange={(e) => setForm({ ...form, requesterPhone: e.target.value })}
          />
        </div>
        <div>
          <FormLabel>Message</FormLabel>
          <textarea
            rows={4}
            className={`${inputCls} resize-none`}
            style={inputStyle}
            placeholder="I'm interested in your listings. Please get in touch..."
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
          />
        </div>
        {status === "error" && (
          <p className="text-sm rounded-lg p-3" style={{ color: '#B91C1C', background: '#FEF2F2' }}>{errorMsg}</p>
        )}
        <div className="flex gap-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button
            type="submit"
            disabled={status === "submitting"}
            className="flex-1 font-bold"
            style={{ background: C.egreen, color: C.carbon }}
          >
            {status === "submitting" ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending…</>
            ) : (
              <><MessageSquare className="w-4 h-4 mr-2" /> Send Message</>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Schedule Call Modal ──────────────────────────────────────────────────────
function ScheduleCallModal({
  agentId,
  agentName,
  onClose,
}: {
  agentId: string;
  agentName: string;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    preferredDate: "",
    message: "",
    requesterName: "",
    requesterEmail: "",
    requesterPhone: "",
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const storedUser = getStoredUser();
  const token = getAccessToken();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.preferredDate) {
      setErrorMsg("Please choose a preferred date and time.");
      setStatus("error");
      return;
    }
    setStatus("submitting");
    setErrorMsg("");

    const payload: ScheduleCallPayload = {
      preferredDate: new Date(form.preferredDate).toISOString(),
      message: form.message.trim() || undefined,
      requesterName: storedUser
        ? `${storedUser.firstName ?? ""} ${storedUser.lastName ?? ""}`.trim() || undefined
        : form.requesterName.trim() || undefined,
      requesterEmail: storedUser?.email ?? (form.requesterEmail.trim() || undefined),
      requesterPhone: form.requesterPhone.trim() || undefined,
    };

    try {
      await propertiesApi.scheduleCall(agentId, payload, token ?? undefined);
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMsg("Unable to schedule the call. Please try again.");
    }
  };

  if (status === "success") {
    return (
      <Modal title="Call Scheduled" onClose={onClose}>
        <div className="text-center py-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
            style={{ background: `${C.egreen}20` }}>
            <CheckCircle className="w-8 h-8" style={{ color: C.forestLight }} />
          </div>
          <p className="font-semibold mb-1" style={{ color: C.forest }}>Call scheduled with {agentName}</p>
          <p className="text-sm mb-1" style={{ color: C.muted }}>
            Preferred time: <span className="font-medium">{form.preferredDate ? new Date(form.preferredDate).toLocaleString() : "—"}</span>
          </p>
          <p className="text-sm mb-4" style={{ color: C.muted }}>The agent will confirm your appointment shortly.</p>
          <Button onClick={onClose} className="w-full font-bold" style={{ background: C.egreen, color: C.carbon }}>Close</Button>
        </div>
      </Modal>
    );
  }

  const minDateTime = new Date();
  minDateTime.setMinutes(minDateTime.getMinutes() + 30);
  const minDateTimeStr = minDateTime.toISOString().slice(0, 16);

  return (
    <Modal title={`Schedule Call with ${agentName}`} onClose={onClose}>
      <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-4">
        {!storedUser && (
          <>
            <div>
              <FormLabel>Your Name</FormLabel>
              <input
                className={inputCls}
                style={inputStyle}
                placeholder="Full name"
                value={form.requesterName}
                onChange={(e) => setForm({ ...form, requesterName: e.target.value })}
              />
            </div>
            <div>
              <FormLabel>Email</FormLabel>
              <input
                type="email"
                className={inputCls}
                style={inputStyle}
                placeholder="your@email.com"
                value={form.requesterEmail}
                onChange={(e) => setForm({ ...form, requesterEmail: e.target.value })}
              />
            </div>
          </>
        )}
        <div>
          <FormLabel>Preferred Date &amp; Time <span style={{ color: '#B91C1C' }}>*</span></FormLabel>
          <input
            type="datetime-local"
            min={minDateTimeStr}
            className={inputCls}
            style={inputStyle}
            value={form.preferredDate}
            onChange={(e) => setForm({ ...form, preferredDate: e.target.value })}
            required
          />
        </div>
        <div>
          <FormLabel>Phone (optional)</FormLabel>
          <input
            type="tel"
            className={inputCls}
            style={inputStyle}
            placeholder="+27 xxx xxx xxxx"
            value={form.requesterPhone}
            onChange={(e) => setForm({ ...form, requesterPhone: e.target.value })}
          />
        </div>
        <div>
          <FormLabel>Notes (optional)</FormLabel>
          <textarea
            rows={3}
            className={`${inputCls} resize-none`}
            style={inputStyle}
            placeholder="Topics you'd like to discuss..."
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
          />
        </div>
        {status === "error" && (
          <p className="text-sm rounded-lg p-3" style={{ color: '#B91C1C', background: '#FEF2F2' }}>{errorMsg}</p>
        )}
        <div className="flex gap-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button
            type="submit"
            disabled={status === "submitting"}
            className="flex-1 font-bold"
            style={{ background: C.egreen, color: C.carbon }}
          >
            {status === "submitting" ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Scheduling…</>
            ) : (
              <><Calendar className="w-4 h-4 mr-2" /> Confirm Schedule</>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Review Card ──────────────────────────────────────────────────────────────
function ReviewCard({ review }: { review: AgentReview }) {
  const initials = review.reviewerName
    ? review.reviewerName.split(' ').slice(0, 2).map((w) => w[0] ?? '').join('').toUpperCase()
    : '?';
  const displayName = review.reviewerName ?? 'Anonymous';
  return (
    <div className="py-4" style={{ borderBottom: `1px solid ${C.border}` }}>
      <div className="flex items-start gap-3 mb-3">
        <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
          style={{ background: C.cream, color: C.forestLight }}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-sm" style={{ color: C.forest }}>{displayName}</p>
            <span className="text-xs shrink-0" style={{ color: C.faint }}>{formatDate(review.createdAt)}</span>
          </div>
          <div className="flex items-center gap-0.5 mt-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className="w-3.5 h-3.5"
                style={i < review.rating
                  ? { color: C.amber, fill: C.amber }
                  : { color: C.cream, fill: C.cream }}
              />
            ))}
            {review.propertyType && (
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full"
                style={{ background: `${C.forest}0D`, color: C.muted }}>
                {review.propertyType}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="relative pl-4">
        <Quote className="w-3 h-3 absolute left-0 top-0.5" style={{ color: `${C.forest}30` }} />
        <p className="text-sm leading-relaxed" style={{ color: C.muted }}>{review.comment ?? ''}</p>
      </div>
    </div>
  );
}

export default function AgentProfile() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const privateOwnerParam = searchParams.get('privateOwner') === 'true';
  const [agentProfile, setAgentProfile] = useState<AgentProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [showContactModal, setShowContactModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const [reviews, setReviews] = useState<AgentReview[]>([]);
  const [reviewTotal, setReviewTotal] = useState(0);
  const [reviewAvg, setReviewAvg] = useState(0);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const agentId = typeof id === "string" ? id : "";

  useEffect(() => {
    if (!agentId) {
      setError("Invalid agent id.");
      setIsLoading(false);
      return;
    }

    const loadProfile = async () => {
      setIsLoading(true);
      setError("");
      setReviewsLoading(true);

      const [profileResult, reviewsResult] = await Promise.allSettled([
        propertiesApi.getAgentProfile(agentId),
        propertiesApi.getAgentReviews(agentId, 10, 0),
      ]);

      if (profileResult.status === 'fulfilled') {
        setAgentProfile(profileResult.value);
      } else {
        setAgentProfile(null);
        setError("Unable to load agent profile from database.");
      }

      if (reviewsResult.status === 'fulfilled') {
        setReviews(reviewsResult.value.reviews);
        setReviewTotal(reviewsResult.value.total);
        setReviewAvg(reviewsResult.value.averageRating);
      }

      setReviewsLoading(false);
      setIsLoading(false);
    };

    void loadProfile();
  }, [agentId]);

  const trustScore = useMemo(() => {
    if (!agentProfile || agentProfile.totalListings === 0) {
      return 0;
    }

    return Math.min(
      100,
      Math.round((agentProfile.verifiedListings / agentProfile.totalListings) * 100),
    );
  }, [agentProfile]);

  const isPrivateIndividual = privateOwnerParam || !agentProfile?.primaryCompanySlug;

  const recentListings = useMemo(
    () => (agentProfile?.listings ?? []).filter((listing) => listing.status !== 'draft').slice(0, 3),
    [agentProfile],
  );

  const activeListings = useMemo(
    () => (agentProfile?.listings ?? []).filter((listing) => listing.status === 'active'),
    [agentProfile],
  );

  const profileName = agentProfile
    ? `${agentProfile.firstName} ${agentProfile.lastName}`.trim()
    : "";
  const profileInitials = profileName
    .split(' ')
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'A';

  const callHref = agentProfile?.phone ? `tel:${agentProfile.phone.replace(/\s+/g, '')}` : undefined;
  const emailHref = agentProfile?.email ? `mailto:${agentProfile.email}` : undefined;

  return (
    <>
      {showContactModal && agentId && (
        <ContactAgentModal
          agentId={agentId}
          agentName={profileName || "the agent"}
          onClose={() => setShowContactModal(false)}
        />
      )}
      {showScheduleModal && agentId && (
        <ScheduleCallModal
          agentId={agentId}
          agentName={profileName || "the agent"}
          onClose={() => setShowScheduleModal(false)}
        />
      )}

    {/* ── Page shell ─────────────────────────────────────────────────────── */}
    <div className="min-h-screen" style={{ background: C.parchment }}>

      {/* ── Topbar / breadcrumb ─────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-10 py-3.5" style={{ background: C.forest }}>
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-100"
          style={{ color: `${C.parchment}A6` }}
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Listings
        </button>
        {profileName && (
          <>
            <span className="text-xs" style={{ color: `${C.parchment}4D` }}>›</span>
            <span className="text-sm font-semibold" style={{ color: C.parchment }}>{profileName}</span>
          </>
        )}
      </div>

      {/* ── Loading / error states ──────────────────────────────────────── */}
      {isLoading && (
        <div className="max-w-5xl mx-auto px-10 py-12 flex items-center gap-3 text-sm" style={{ color: C.muted }}>
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading agent profile…
        </div>
      )}
      {!isLoading && error && (
        <div className="max-w-5xl mx-auto px-10 py-8 text-sm rounded-xl mt-8"
          style={{ color: '#B91C1C', background: '#FEF2F2', border: '1px solid #FECACA' }}>
          {error}
        </div>
      )}

      {!isLoading && !error && agentProfile && (
        <>
          {/* ── Hero ─────────────────────────────────────────────────────── */}
          <div className="relative overflow-hidden pb-24"
            style={{ background: 'linear-gradient(135deg, #1A3C28 0%, #2D5A40 60%, #3A7050 100%)' }}>
            {/* subtle texture overlay */}
            <div className="absolute inset-0 pointer-events-none"
              style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.025'%3E%3Cpath d='M0 38.59l2.83-2.83 1.41 1.41L1.41 40H0v-1.41zM0 1.4l2.83 2.83 1.41-1.41L1.41 0H0v1.41zM38.59 40l-2.83-2.83 1.41-1.41L40 38.59V40h-1.41zM40 1.41l-2.83 2.83-1.41-1.41L38.59 0H40v1.41z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />

            <div className="max-w-5xl mx-auto px-10 pt-12 relative z-10">
              <div className="flex gap-8 items-start">
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="w-28 h-28 rounded-full overflow-hidden flex items-center justify-center text-3xl font-bold"
                    style={{
                      border: `4px solid ${C.egreen}`,
                      background: C.forestLight,
                      color: C.egreen,
                      fontFamily: FRAUNCES,
                    }}>
                    <UserAvatarContent
                      avatarUrl={agentProfile.avatarUrl}
                      initials={profileInitials}
                      alt={profileName}
                    />
                  </div>
                  {agentProfile.status === 'active' && (
                    <div className="absolute bottom-0.5 right-0.5 w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ background: C.egreen, border: `3px solid ${C.forest}` }}>
                      <CheckCircle className="w-3.5 h-3.5" style={{ color: C.carbon }} />
                    </div>
                  )}
                </div>

                {/* Agent info */}
                <div className="flex-1 min-w-0">
                  {/* Role pill */}
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-3"
                    style={{
                      background: `${C.egreen}26`,
                      border: `1px solid ${C.egreen}4D`,
                      color: C.egreen,
                    }}>
                    <Shield className="w-3 h-3" />
                    {isPrivateIndividual ? 'Private Owner' : 'Verified Agent'}
                  </div>

                  {/* Name */}
                  <h1 className="text-4xl font-bold leading-none tracking-tight mb-1.5"
                    style={{ fontFamily: FRAUNCES, color: C.parchment }}>
                    {profileName}
                  </h1>

                  {/* City */}
                  {agentProfile.primaryCity && (
                    <p className="flex items-center gap-1.5 text-sm mb-5"
                      style={{ color: `${C.parchment}99` }}>
                      <MapPin className="w-3.5 h-3.5" />
                      {agentProfile.primaryCity}
                    </p>
                  )}

                  {/* Trust pill + stars */}
                  <div className="flex items-center gap-5 flex-wrap mb-6">
                    <div className="flex items-center gap-2.5 rounded-lg px-4 py-2"
                      style={{ background: `${C.egreen}1F`, border: `1px solid ${C.egreen}40` }}>
                      <span className="text-xl font-bold leading-none"
                        style={{ fontFamily: MONO, color: C.egreen }}>
                        {trustScore}%
                      </span>
                      <span className="text-xs" style={{ color: `${C.parchment}99` }}>Trust Score</span>
                    </div>
                    {reviewAvg > 0 && (
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className="w-4 h-4"
                            style={i < Math.round(reviewAvg)
                              ? { color: C.amber, fill: C.amber }
                              : { color: `${C.parchment}33`, fill: `${C.parchment}33` }} />
                        ))}
                        <span className="text-sm ml-1.5" style={{ color: `${C.parchment}CC` }}>
                          {reviewAvg.toFixed(1)}
                          <span className="ml-1 text-xs" style={{ color: `${C.parchment}66` }}>
                            ({reviewTotal} review{reviewTotal !== 1 ? 's' : ''})
                          </span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* CTA buttons */}
                  <div className="flex gap-3 flex-wrap">
                    <button
                      onClick={() => setShowContactModal(true)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-opacity hover:opacity-90"
                      style={{ background: C.egreen, color: C.carbon }}>
                      <MessageSquare className="w-4 h-4" />
                      {isPrivateIndividual ? 'Contact Owner' : 'Contact Agent'}
                    </button>
                    <button
                      onClick={() => setShowScheduleModal(true)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-80"
                      style={{
                        background: 'transparent',
                        border: `1.5px solid ${C.parchment}59`,
                        color: C.parchment,
                      }}>
                      <Calendar className="w-4 h-4" />
                      Schedule Call
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── KPI Strip (floats out of hero) ──────────────────────────── */}
          <div className="max-w-5xl mx-auto px-10">
            <div className="-mt-10 relative z-10 grid grid-cols-2 md:grid-cols-4 rounded-2xl overflow-hidden"
              style={{
                boxShadow: '0 4px 32px rgba(26,60,40,0.18)',
                gap: '1px',
                background: C.border,
              }}>
              {[
                { icon: Home,       label: 'Total Listings',  value: agentProfile.totalListings,  iconBg: `${C.forest}1A`, iconColor: C.forest },
                { icon: TrendingUp, label: 'Active Listings', value: agentProfile.activeListings, iconBg: `${C.egreen}20`, iconColor: '#00994D' },
                { icon: Award,      label: 'Member Since',
                  value: agentProfile.createdAt ? new Date(agentProfile.createdAt).getFullYear() : '—',
                  iconBg: `${C.amber}26`, iconColor: C.amber },
                { icon: Shield,     label: 'Verified Rate',
                  value: agentProfile.totalListings > 0
                    ? `${Math.round((agentProfile.verifiedListings / agentProfile.totalListings) * 100)}%`
                    : '—',
                  iconBg: `${C.forest}1A`, iconColor: C.forestLight },
              ].map(({ icon: Icon, label, value, iconBg, iconColor }) => (
                <div key={label} className="bg-white flex items-center gap-4 p-5">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: iconBg }}>
                    <Icon className="w-5 h-5" style={{ color: iconColor }} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold leading-none"
                      style={{ fontFamily: FRAUNCES, color: C.forest }}>
                      {value}
                    </div>
                    <div className="text-xs mt-1" style={{ color: C.muted }}>{label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Body grid ────────────────────────────────────────────────── */}
          <div className="max-w-5xl mx-auto px-10 mt-12 mb-16"
            style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2rem' }}>

            {/* ── Main content column ─────────────────────────────────── */}
            <div>

              {/* Bio */}
              <div className="bg-white rounded-2xl p-7 mb-5"
                style={{ border: `1px solid ${C.border}`, boxShadow: `0 1px 4px ${C.border}` }}>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2.5 pb-3.5"
                  style={{ fontFamily: FRAUNCES, color: C.forest, borderBottom: `1px solid ${C.border}` }}>
                  <Award className="w-5 h-5 shrink-0" style={{ color: C.amber }} />
                  About {profileName.split(' ')[0]}
                </h2>
                <p className="text-sm leading-relaxed" style={{ color: C.muted }}>
                  {profileName} is {isPrivateIndividual ? 'a private property owner' : 'an active property agent'}
                  {agentProfile.primaryCity ? ` based in ${agentProfile.primaryCity}` : ''} on BuildTrust,
                  with {agentProfile.totalListings} total listing{agentProfile.totalListings !== 1 ? 's' : ''} and{' '}
                  {agentProfile.verifiedListings} verified propert{agentProfile.verifiedListings !== 1 ? 'ies' : 'y'}.
                  {!isPrivateIndividual && ' Known for providing transparent, trust-verified property transactions to both local and diaspora buyers.'}
                </p>
              </div>

              {/* Recent Listings */}
              <div className="bg-white rounded-2xl p-7 mb-5"
                style={{ border: `1px solid ${C.border}`, boxShadow: `0 1px 4px ${C.border}` }}>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2.5 pb-3.5"
                  style={{ fontFamily: FRAUNCES, color: C.forest, borderBottom: `1px solid ${C.border}` }}>
                  <TrendingUp className="w-5 h-5 shrink-0" style={{ color: C.forestLight }} />
                  Recent Listings
                </h2>
                <div>
                  {recentListings.map((property) => (
                    <div key={property.id} className="flex gap-4 py-4" style={{ borderBottom: `1px solid ${C.border}` }}>
                      <div className="w-24 h-18 rounded-xl overflow-hidden shrink-0"
                        style={{ background: C.cream, minHeight: 68 }}>
                        <img
                          src={property.media_url || DEFAULT_LISTING_IMAGE}
                          alt={property.title}
                          className="w-24 h-full object-cover"
                          style={{ minHeight: 68 }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm mb-0.5" style={{ color: C.forest }}>{property.title}</h3>
                        <p className="flex items-center gap-1 text-xs mb-2" style={{ color: C.muted }}>
                          <MapPin className="w-3 h-3" />{property.location}
                        </p>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-base" style={{ fontFamily: FRAUNCES, color: C.forest }}>
                            {formatMoney(property.price, property.currency)}
                          </span>
                          <span className="text-xs" style={{ color: C.faint }}>
                            Listed {formatDate(property.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {recentListings.length === 0 && (
                    <p className="text-sm py-4" style={{ color: C.faint }}>No listings yet.</p>
                  )}
                </div>
              </div>

              {/* Active Listings */}
              <div className="bg-white rounded-2xl p-7 mb-5"
                style={{ border: `1px solid ${C.border}`, boxShadow: `0 1px 4px ${C.border}` }}>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2.5 pb-3.5"
                  style={{ fontFamily: FRAUNCES, color: C.forest, borderBottom: `1px solid ${C.border}` }}>
                  <Home className="w-5 h-5 shrink-0" style={{ color: C.forestLight }} />
                  Active Listings
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {activeListings.map((property) => (
                    <Link
                      key={property.id}
                      to={`/app/property/${property.id}`}
                      className="group rounded-xl overflow-hidden transition-shadow hover:shadow-lg"
                      style={{ border: `1px solid ${C.border}` }}
                    >
                      <img
                        src={property.media_url || DEFAULT_LISTING_IMAGE}
                        alt={property.title}
                        className="w-full h-36 object-cover"
                      />
                      <div className="p-4">
                        <h3 className="font-semibold text-sm mb-0.5 transition-colors"
                          style={{ color: C.forest }}>
                          {property.title}
                        </h3>
                        <p className="text-xs flex items-center gap-1 mb-2" style={{ color: C.muted }}>
                          <MapPin className="w-3 h-3" />{property.location}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="font-bold" style={{ fontFamily: FRAUNCES, color: C.forest, fontSize: '1.05rem' }}>
                            {formatMoney(property.price, property.currency)}
                          </span>
                          <span className="text-xs" style={{ color: C.faint }}>
                            {property.bedrooms ?? 0} bed · {property.bathrooms ?? 0} bath
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                  {activeListings.length === 0 && (
                    <p className="text-sm col-span-2" style={{ color: C.faint }}>No active listings.</p>
                  )}
                </div>
              </div>

              {/* Reviews */}
              <div className="bg-white rounded-2xl p-7"
                style={{ border: `1px solid ${C.border}`, boxShadow: `0 1px 4px ${C.border}` }}>
                <div className="flex items-center justify-between pb-3.5 mb-4"
                  style={{ borderBottom: `1px solid ${C.border}` }}>
                  <h2 className="text-xl font-semibold flex items-center gap-2.5"
                    style={{ fontFamily: FRAUNCES, color: C.forest }}>
                    <ThumbsUp className="w-5 h-5 shrink-0" style={{ color: C.forestLight }} />
                    Client Reviews
                  </h2>
                  {reviewAvg > 0 && (
                    <div className="flex items-center gap-1.5">
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5"
                            style={i < Math.round(reviewAvg)
                              ? { color: C.amber, fill: C.amber }
                              : { color: C.cream, fill: C.cream }} />
                        ))}
                      </div>
                      <span className="text-sm font-semibold" style={{ color: C.forest }}>
                        {reviewAvg.toFixed(1)}
                      </span>
                      <span className="text-xs" style={{ color: C.faint }}>
                        ({reviewTotal})
                      </span>
                    </div>
                  )}
                </div>
                {reviewsLoading && (
                  <p className="text-sm flex items-center gap-2 py-4" style={{ color: C.faint }}>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading reviews…
                  </p>
                )}
                {!reviewsLoading && reviews.length === 0 && (
                  <p className="text-sm py-4" style={{ color: C.faint }}>No reviews yet.</p>
                )}
                {!reviewsLoading && reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
                {!reviewsLoading && reviewTotal > reviews.length && (
                  <button
                    className="flex items-center justify-center gap-2 w-full mt-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                    style={{
                      border: `1px solid ${C.border}`,
                      color: C.forest,
                      background: 'transparent',
                    }}>
                    <Eye className="w-4 h-4" />
                    View All {reviewTotal} Reviews
                  </button>
                )}
              </div>
            </div>

            {/* ── Sidebar ─────────────────────────────────────────────── */}
            <div>

              {/* Contact */}
              <div className="bg-white rounded-2xl p-6 mb-4"
                style={{ border: `1px solid ${C.border}`, boxShadow: `0 1px 4px ${C.border}` }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: C.muted }}>
                  Contact
                </p>
                {[
                  { Icon: Phone, label: 'Phone', value: agentProfile.phone || 'Not provided', href: callHref },
                  { Icon: Mail,  label: 'Email', value: agentProfile.email, href: emailHref },
                  { Icon: MessageSquare, label: 'WhatsApp', value: agentProfile.phone || 'Not provided', href: agentProfile.phone ? `https://wa.me/${agentProfile.phone.replace(/\D/g, '')}` : undefined },
                ].map(({ Icon, label, value, href }) => (
                  <div key={label} className="flex items-center gap-3 py-2.5"
                    style={{ borderBottom: `1px solid ${C.border}` }}>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `${C.forest}14` }}>
                      <Icon className="w-4 h-4" style={{ color: C.forest }} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs" style={{ color: C.faint }}>{label}</div>
                      {href ? (
                        <a href={href} className="font-semibold text-sm truncate hover:underline block"
                          style={{ color: C.forest }}>
                          {value}
                        </a>
                      ) : (
                        <div className="font-semibold text-sm truncate" style={{ color: value === 'Not provided' ? C.faint : C.forest }}>
                          {value}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {/* Direct action buttons */}
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {callHref ? (
                    <a href={callHref}>
                      <button className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-bold"
                        style={{ background: C.egreen, color: C.carbon }}>
                        <Phone className="w-3.5 h-3.5" /> Call
                      </button>
                    </a>
                  ) : (
                    <button disabled className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold opacity-40 cursor-not-allowed"
                      style={{ border: `1px solid ${C.border}`, color: C.muted }}>
                      <Phone className="w-3.5 h-3.5" /> Call
                    </button>
                  )}
                  {emailHref ? (
                    <a href={emailHref}>
                      <button className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold"
                        style={{ border: `1.5px solid ${C.forest}`, color: C.forest }}>
                        <Mail className="w-3.5 h-3.5" /> Email
                      </button>
                    </a>
                  ) : (
                    <button disabled className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold opacity-40 cursor-not-allowed"
                      style={{ border: `1px solid ${C.border}`, color: C.muted }}>
                      <Mail className="w-3.5 h-3.5" /> Email
                    </button>
                  )}
                </div>
              </div>

              {/* Trust Breakdown */}
              <div className="bg-white rounded-2xl p-6 mb-4"
                style={{ border: `1px solid ${C.border}`, boxShadow: `0 1px 4px ${C.border}` }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: C.muted }}>
                  Trust Breakdown
                </p>
                {[
                  { label: 'Verified Listings', pct: trustScore },
                  { label: 'Active Listings',   pct: agentProfile.totalListings > 0 ? Math.round((agentProfile.activeListings / agentProfile.totalListings) * 100) : 0 },
                  { label: 'Review Score',       pct: reviewAvg > 0 ? Math.round((reviewAvg / 5) * 100) : 0 },
                ].map(({ label, pct }) => (
                  <div key={label} className="mb-4">
                    <div className="flex justify-between text-xs mb-1.5" style={{ color: C.forest }}>
                      <span>{label}</span>
                      <span className="font-semibold" style={{ fontFamily: MONO }}>{pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: C.cream }}>
                      <div className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          background: `linear-gradient(90deg, ${C.forestLight}, ${C.egreen})`,
                        }} />
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-3 mt-1" style={{ borderTop: `1px solid ${C.border}` }}>
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-4 h-4" style={{ color: C.forestLight }} />
                    <span className="text-xs font-semibold" style={{ color: C.forest }}>
                      {isPrivateIndividual ? 'Verified Owner' : 'Verified Agent'}
                    </span>
                  </div>
                  <span className="text-lg font-bold" style={{ fontFamily: FRAUNCES, color: C.forest }}>
                    {trustScore}%
                  </span>
                </div>
              </div>

              {/* Specializations */}
              {!isPrivateIndividual && (
                <div className="bg-white rounded-2xl p-6 mb-4"
                  style={{ border: `1px solid ${C.border}`, boxShadow: `0 1px 4px ${C.border}` }}>
                  <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: C.muted }}>
                    Specializations
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {['Property Listings', 'Verified Transactions', 'Client Advisory', 'Due Diligence'].map((s) => (
                      <span key={s} className="text-xs font-medium px-3 py-1.5 rounded-full"
                        style={{ background: `${C.forest}0F`, color: C.forestLight }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Member since card */}
              {agentProfile.createdAt && (
                <div className="rounded-2xl p-6"
                  style={{ background: C.forest, border: `1px solid ${C.forestLight}` }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${C.egreen}1F` }}>
                      <Clock className="w-5 h-5" style={{ color: C.egreen }} />
                    </div>
                    <div>
                      <div className="text-xs mb-0.5" style={{ color: `${C.parchment}80` }}>Member since</div>
                      <div className="font-bold text-lg leading-none"
                        style={{ fontFamily: FRAUNCES, color: C.parchment }}>
                        {new Date(agentProfile.createdAt).getFullYear()}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
    </>
  );
}
