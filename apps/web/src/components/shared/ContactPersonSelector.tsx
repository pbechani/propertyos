'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, CheckCircle2, Flame, Zap, Minus, User, UserSearch } from 'lucide-react';
import { leadsApi, usersApi } from '@/lib/api-client';
import type { LeadRow, UserSearchResult } from '@/lib/api-client';

// ── Public types ────────────────────────────────────────────────────────────

export type ContactPersonMode = 'lead' | 'client' | 'adhoc';

export type ContactPerson = {
  mode: ContactPersonMode;
  /** Source record ID (lead ID or user ID) when resolved from DB */
  sourceId?: string;
  name: string;
  email?: string;
  phone?: string;
  /** Whether to save this ad-hoc contact as a new lead after form submission */
  saveAsLead?: boolean;
};

export interface ContactPersonSelectorProps {
  value?: ContactPerson;
  onChange: (person: ContactPerson) => void;
  authToken: string;
  label?: string;
  required?: boolean;
  /** Disable the mode toggle (lock to a specific mode) */
  lockedMode?: ContactPersonMode;
}

// ── Internal helpers ────────────────────────────────────────────────────────

function temperatureIcon(t: string) {
  if (t === 'hot') return <Flame className="w-3 h-3 text-red-500" />;
  if (t === 'warm') return <Zap className="w-3 h-3 text-amber-500" />;
  return <Minus className="w-3 h-3 text-[#6B8F7A]" />;
}

function temperatureLabel(t: string) {
  if (t === 'hot') return 'Hot';
  if (t === 'warm') return 'Warm';
  return 'Cold';
}

function temperatureBadgeClass(t: string) {
  if (t === 'hot') return 'bg-red-50 text-red-600 border border-red-100';
  if (t === 'warm') return 'bg-amber-50 text-amber-600 border border-amber-100';
  return 'bg-[#F2E8D5] text-[#6B8F7A] border border-[#E4DDD0]';
}

function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function avatarBgColor(name: string) {
  const palette = [
    'bg-[#1A3C28]',
    'bg-[#C4562A]',
    'bg-[#B89040]',
    'bg-[#2D5940]',
    'bg-slate-600',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ── Component ───────────────────────────────────────────────────────────────

export function ContactPersonSelector({
  value,
  onChange,
  authToken,
  label,
  required,
  lockedMode,
}: ContactPersonSelectorProps) {
  const [mode, setMode] = useState<ContactPersonMode>(value?.mode ?? lockedMode ?? 'lead');
  const [searchQuery, setSearchQuery] = useState('');
  const [leadResults, setLeadResults] = useState<LeadRow[]>([]);
  const [clientResults, setClientResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<ContactPerson | undefined>(value);
  const [saveAsLead, setSaveAsLead] = useState(false);

  // Editable overrides for auto-populated fields
  const [emailOverride, setEmailOverride] = useState(value?.email ?? '');
  const [phoneOverride, setPhoneOverride] = useState(value?.phone ?? '');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(searchQuery, 280);

  // Search leads
  const searchLeads = useCallback(
    async (q: string) => {
      if (q.trim().length < 2) { setLeadResults([]); return; }
      setIsSearching(true);
      try {
        const res = await leadsApi.list(authToken, { search: q, limit: 6 });
        setLeadResults(res.data);
      } catch {
        setLeadResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [authToken],
  );

  // Search clients (platform users)
  const searchClients = useCallback(
    async (q: string) => {
      if (q.trim().length < 2) { setClientResults([]); return; }
      setIsSearching(true);
      try {
        const res = await usersApi.search(authToken, q, 'buyer');
        setClientResults(res);
      } catch {
        setClientResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [authToken],
  );

  useEffect(() => {
    if (mode === 'lead') searchLeads(debouncedQuery);
    if (mode === 'client') searchClients(debouncedQuery);
  }, [debouncedQuery, mode, searchLeads, searchClients]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleModeChange = (m: ContactPersonMode) => {
    setMode(m);
    setSelectedPerson(undefined);
    setSearchQuery('');
    setLeadResults([]);
    setClientResults([]);
    setEmailOverride('');
    setPhoneOverride('');
    setShowDropdown(false);
  };

  const handleSelectLead = (lead: LeadRow) => {
    const person: ContactPerson = {
      mode: 'lead',
      sourceId: lead.id,
      name: lead.name,
      email: lead.email ?? undefined,
      phone: lead.phone ?? undefined,
    };
    setSelectedPerson(person);
    setEmailOverride(lead.email ?? '');
    setPhoneOverride(lead.phone ?? '');
    setShowDropdown(false);
    setSearchQuery('');
    onChange(person);
  };

  const handleSelectClient = (client: UserSearchResult) => {
    const name = `${client.firstName} ${client.lastName}`.trim();
    const person: ContactPerson = {
      mode: 'client',
      sourceId: client.id,
      name,
      email: client.email,
      phone: undefined,
    };
    setSelectedPerson(person);
    setEmailOverride(client.email);
    setPhoneOverride('');
    setShowDropdown(false);
    setSearchQuery('');
    onChange(person);
  };

  const handleClear = () => {
    setSelectedPerson(undefined);
    setEmailOverride('');
    setPhoneOverride('');
    setLeadResults([]);
    setClientResults([]);
    setSearchQuery('');
    onChange({ mode, name: '' });
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const emitAdhoc = useCallback(
    (patch: Partial<ContactPerson>) => {
      const current: ContactPerson = {
        mode: 'adhoc',
        name: selectedPerson?.name ?? '',
        email: emailOverride,
        phone: phoneOverride,
        saveAsLead,
        ...patch,
      };
      setSelectedPerson(current);
      onChange(current);
    },
    [selectedPerson, emailOverride, phoneOverride, saveAsLead, onChange],
  );

  const emitOverrides = useCallback(
    (email: string, phone: string) => {
      if (!selectedPerson) return;
      const updated: ContactPerson = { ...selectedPerson, email, phone };
      setSelectedPerson(updated);
      onChange(updated);
    },
    [selectedPerson, onChange],
  );



  return (
    <div className="space-y-3">
      {/* Label */}
      {label && (
        <label className="block text-xs font-bold uppercase tracking-widest text-[#6B8F7A]">
          {label}
          {required && <span className="text-[#C4562A] ml-1">*</span>}
        </label>
      )}

      {/* ── Mode tabs ────────────────────────────────────────────── */}
      {!lockedMode && (
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { id: 'lead', icon: '🔥', label: 'Lead', desc: 'CRM pipeline' },
              { id: 'client', icon: '👤', label: 'Client', desc: 'Registered user' },
              { id: 'adhoc', icon: '✏️', label: 'Ad-hoc', desc: 'Walk-in contact' },
            ] as { id: ContactPersonMode; icon: string; label: string; desc: string }[]
          ).map(({ id, icon, label: tabLabel, desc }) => {
            const active = mode === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => handleModeChange(id)}
                className={`relative flex flex-col items-center gap-1.5 rounded-xl border-[1.5px] p-3 text-center transition-all duration-150 ${
                  active
                    ? 'border-[#1A3C28] bg-white shadow-sm'
                    : 'border-[#E4DDD0] bg-[#F6F2EC] hover:border-[#1A3C28]/40 hover:bg-white'
                }`}
              >
                {active && (
                  <span className="absolute top-2 right-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#00E87A]" />
                  </span>
                )}
                <span className="text-lg leading-none">{icon}</span>
                <span className="text-[10px] font-bold uppercase tracking-wide text-[#1A3C28]">
                  {tabLabel}
                </span>
                <span className="text-[10px] text-[#6B8F7A] leading-tight">{desc}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Lead / Client: search + results ──────────────────────── */}
      {(mode === 'lead' || mode === 'client') && (
        <div className="space-y-2">
          {/* Selected person chip */}
          {selectedPerson ? (
            <div className="flex items-center gap-3 rounded-xl border-[1.5px] border-[#1A3C28]/25 bg-[#1A3C28]/[0.04] px-3 py-2.5">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${avatarBgColor(selectedPerson.name)}`}
              >
                {initials(selectedPerson.name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[#1A3C28]">
                  {selectedPerson.name}
                </p>
                <p className="truncate font-mono text-[10px] text-[#6B8F7A]">
                  {selectedPerson.email || selectedPerson.phone || '—'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleClear}
                className="shrink-0 rounded-md p-1 text-[#6B8F7A] transition-colors hover:bg-[#1A3C28]/10 hover:text-[#C4562A]"
                aria-label="Change person"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            /* Search input + dropdown */
            <div ref={dropdownRef} className="relative">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => searchQuery.length >= 2 && setShowDropdown(true)}
                  placeholder={
                    mode === 'lead'
                      ? 'Search leads by name, email or phone…'
                      : 'Search clients by name or email…'
                  }
                  className="w-full rounded-lg border-[1.5px] border-[#E4DDD0] bg-[#F6F2EC] py-2.5 pl-10 pr-4 text-sm text-[#1A3C28] outline-none transition-all placeholder:text-[#AAB8B0] focus:border-[#1A3C28] focus:bg-white"
                />
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6B8F7A]">
                  {isSearching ? (
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </span>
              </div>

              {/* Dropdown */}
              {showDropdown && (searchQuery.length >= 2) && (
                <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-[#E4DDD0] bg-white shadow-lg">
                  {/* Lead results */}
                  {mode === 'lead' && (
                    <>
                      {leadResults.length === 0 && !isSearching && (
                        <div className="flex items-center gap-2 px-4 py-3 text-sm text-[#6B8F7A]">
                          <UserSearch className="h-4 w-4" />
                          No leads found matching &ldquo;{searchQuery}&rdquo;
                        </div>
                      )}
                      {leadResults.map((lead) => (
                        <button
                          key={lead.id}
                          type="button"
                          onClick={() => handleSelectLead(lead)}
                          className="flex w-full items-center gap-3 border-b border-[#E4DDD0] px-4 py-2.5 text-left last:border-b-0 hover:bg-[#F6F2EC] transition-colors"
                        >
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${avatarBgColor(lead.name)}`}
                          >
                            {initials(lead.name)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-[#1A3C28]">
                              {lead.name}
                            </p>
                            <p className="truncate font-mono text-[10px] text-[#6B8F7A]">
                              {lead.email || lead.phone || '—'}
                            </p>
                          </div>
                          <span
                            className={`inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide ${temperatureBadgeClass(lead.temperature)}`}
                          >
                            {temperatureIcon(lead.temperature)}
                            {temperatureLabel(lead.temperature)}
                          </span>
                        </button>
                      ))}
                    </>
                  )}

                  {/* Client results */}
                  {mode === 'client' && (
                    <>
                      {clientResults.length === 0 && !isSearching && (
                        <div className="flex items-center gap-2 px-4 py-3 text-sm text-[#6B8F7A]">
                          <User className="h-4 w-4" />
                          No clients found matching &ldquo;{searchQuery}&rdquo;
                        </div>
                      )}
                      {clientResults.map((client) => {
                        const name = `${client.firstName} ${client.lastName}`.trim();
                        return (
                          <button
                            key={client.id}
                            type="button"
                            onClick={() => handleSelectClient(client)}
                            className="flex w-full items-center gap-3 border-b border-[#E4DDD0] px-4 py-2.5 text-left last:border-b-0 hover:bg-[#F6F2EC] transition-colors"
                          >
                            <div
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${avatarBgColor(name)}`}
                            >
                              {initials(name)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-[#1A3C28]">
                                {name}
                              </p>
                              <p className="truncate font-mono text-[10px] text-[#6B8F7A]">
                                {client.email}
                              </p>
                            </div>
                            <span className="shrink-0 rounded bg-[#1A3C28]/10 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide text-[#1A3C28]">
                              Client
                            </span>
                          </button>
                        );
                      })}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Auto-populated email + phone (editable) */}
          {selectedPerson && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#6B8F7A]">
                  Email
                </label>
                <input
                  type="email"
                  value={emailOverride}
                  onChange={(e) => {
                    setEmailOverride(e.target.value);
                    emitOverrides(e.target.value, phoneOverride);
                  }}
                  placeholder="—"
                  className={`w-full rounded-lg border-[1.5px] px-3 py-2 text-sm text-[#1A3C28] outline-none transition-all focus:border-[#1A3C28] focus:bg-white ${
                    emailOverride
                      ? 'border-[#00E87A]/50 bg-[#00E87A]/[0.04]'
                      : 'border-[#E4DDD0] bg-[#F6F2EC]'
                  }`}
                />
                {emailOverride && selectedPerson.sourceId && (
                  <span className="flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-wide text-emerald-600">
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    From record
                  </span>
                )}
              </div>
              <div className="space-y-1">
                <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#6B8F7A]">
                  Phone
                </label>
                <input
                  type="tel"
                  value={phoneOverride}
                  onChange={(e) => {
                    setPhoneOverride(e.target.value);
                    emitOverrides(emailOverride, e.target.value);
                  }}
                  placeholder="—"
                  className={`w-full rounded-lg border-[1.5px] px-3 py-2 text-sm text-[#1A3C28] outline-none transition-all focus:border-[#1A3C28] focus:bg-white ${
                    phoneOverride
                      ? 'border-[#00E87A]/50 bg-[#00E87A]/[0.04]'
                      : 'border-[#E4DDD0] bg-[#F6F2EC]'
                  }`}
                />
                {phoneOverride && selectedPerson.sourceId && (
                  <span className="flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-wide text-emerald-600">
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    From record
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Ad-hoc: manual entry ──────────────────────────────────── */}
      {mode === 'adhoc' && (
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#6B8F7A]">
              Full name {required && <span className="text-[#C4562A]">*</span>}
            </label>
            <input
              type="text"
              value={selectedPerson?.name ?? ''}
              onChange={(e) => emitAdhoc({ name: e.target.value })}
              placeholder="e.g. John Dlamini"
              className="w-full rounded-lg border-[1.5px] border-[#E4DDD0] bg-white px-3 py-2.5 text-sm text-[#1A3C28] outline-none transition-all placeholder:text-[#AAB8B0] focus:border-[#1A3C28]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#6B8F7A]">
                Email
              </label>
              <input
                type="email"
                value={emailOverride}
                onChange={(e) => {
                  setEmailOverride(e.target.value);
                  emitAdhoc({ email: e.target.value });
                }}
                placeholder="email@example.com"
                className="w-full rounded-lg border-[1.5px] border-[#E4DDD0] bg-white px-3 py-2.5 text-sm text-[#1A3C28] outline-none transition-all placeholder:text-[#AAB8B0] focus:border-[#1A3C28]"
              />
            </div>
            <div className="space-y-1">
              <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#6B8F7A]">
                Phone
              </label>
              <input
                type="tel"
                value={phoneOverride}
                onChange={(e) => {
                  setPhoneOverride(e.target.value);
                  emitAdhoc({ phone: e.target.value });
                }}
                placeholder="+27 82…"
                className="w-full rounded-lg border-[1.5px] border-[#E4DDD0] bg-white px-3 py-2.5 text-sm text-[#1A3C28] outline-none transition-all placeholder:text-[#AAB8B0] focus:border-[#1A3C28]"
              />
            </div>
          </div>

          {/* CRM nudge */}
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border-[1.5px] border-[#C4562A]/20 bg-[#C4562A]/[0.04] p-3 transition-colors hover:bg-[#C4562A]/[0.06]">
            <input
              type="checkbox"
              checked={saveAsLead}
              onChange={(e) => {
                setSaveAsLead(e.target.checked);
                emitAdhoc({ saveAsLead: e.target.checked });
              }}
              className="mt-0.5 h-4 w-4 rounded accent-[#C4562A]"
            />
            <div>
              <p className="text-xs font-semibold text-[#C4562A]">Save as a lead?</p>
              <p className="text-[11px] text-[#6B8F7A]">
                Add this contact to your CRM pipeline after the viewing is confirmed.
              </p>
            </div>
          </label>
        </div>
      )}
    </div>
  );
}
