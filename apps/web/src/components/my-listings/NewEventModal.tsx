'use client';

import { X, Calendar, Clock, MapPin, Users, FileText, Home, Phone, Bell } from 'lucide-react';
import { useState } from 'react';

// ── Brand tokens (mirrored from calendar page) ────────────────────────────────
const C = {
  forest:    '#1A3C28',
  parchment: '#F2E8D5',
  terra:     '#C4562A',
  egreen:    '#00E87A',
};

const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: 8,
  border: '1px solid rgba(26,60,40,0.18)',
  background: 'rgba(26,60,40,0.04)',
  color: C.forest,
  fontSize: '0.84rem',
  outline: 'none',
  boxSizing: 'border-box',
};

const LABEL_STYLE: React.CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)',
  fontSize: '0.6rem',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'rgba(26,60,40,0.45)',
  marginBottom: 6,
};

interface NewEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: any) => void;
  selectedDate?: Date;
}

export function NewEventModal({ isOpen, onClose, onSave, selectedDate }: NewEventModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    type: 'viewing',
    date: selectedDate ? selectedDate.toISOString().split('T')[0] : '',
    startTime: '09:00',
    endTime: '10:00',
    location: '',
    attendees: '',
    description: '',
    reminder: '30',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
    setFormData({
      title: '',
      type: 'viewing',
      date: '',
      startTime: '09:00',
      endTime: '10:00',
      location: '',
      attendees: '',
      description: '',
      reminder: '30',
    });
  };

  if (!isOpen) return null;

  const eventTypes = [
    { value: 'viewing',   label: 'Viewing',    icon: Home },
    { value: 'meeting',   label: 'Meeting',    icon: Users },
    { value: 'call',      label: 'Call',       icon: Phone },
    { value: 'openhouse', label: 'Open House', icon: Calendar },
    { value: 'other',     label: 'Other',      icon: FileText },
  ];

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(12,13,16,0.45)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.parchment,
          borderRadius: 14,
          width: '100%',
          maxWidth: 560,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 48px rgba(12,13,16,0.22)',
          overflow: 'hidden',
          margin: '0 1rem',
        }}
      >
        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div
          style={{
            background: C.forest,
            padding: '18px 20px 16px',
            position: 'relative',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)',
              fontSize: '0.63rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: C.egreen,
              marginBottom: 4,
            }}
          >
            Agent Cockpit
          </div>
          <div
            style={{
              fontFamily: 'var(--font-fraunces, "Fraunces", Georgia, serif)',
              fontSize: '1.4rem',
              color: '#fff',
              fontWeight: 300,
              lineHeight: 1.2,
              paddingRight: 36,
            }}
          >
            New Event
          </div>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 14,
              right: 14,
              width: 28,
              height: 28,
              borderRadius: 7,
              border: 'none',
              background: 'rgba(255,255,255,0.15)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={14} color="#fff" />
          </button>
        </div>

        {/* ── Form ──────────────────────────────────────────────────────────── */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: '20px 22px',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
          }}
        >
          {/* Title */}
          <div>
            <label style={LABEL_STYLE}>Event Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Property viewing with John Smith"
              style={INPUT_STYLE}
            />
          </div>

          {/* Event type */}
          <div>
            <label style={LABEL_STYLE}>Event Type *</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
              {eventTypes.map((type) => {
                const Icon = type.icon;
                const active = formData.type === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: type.value })}
                    style={{
                      padding: '10px 4px 8px',
                      borderRadius: 9,
                      border: active ? `1.5px solid ${C.forest}` : '1.5px solid rgba(26,60,40,0.14)',
                      background: active ? C.forest : 'rgba(26,60,40,0.03)',
                      color: active ? C.egreen : 'rgba(26,60,40,0.55)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 5,
                      cursor: 'pointer',
                      transition: 'background 0.12s, border-color 0.12s',
                    }}
                  >
                    <Icon size={15} />
                    <span
                      style={{
                        fontFamily: 'var(--font-mono, "IBM Plex Mono", monospace)',
                        fontSize: '0.58rem',
                        letterSpacing: '0.04em',
                        textAlign: 'center',
                        lineHeight: 1.3,
                      }}
                    >
                      {type.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date & time */}
          <div>
            <label style={LABEL_STYLE}>Date &amp; Time *</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <div style={{ position: 'relative' }}>
                <Calendar size={13} color="rgba(26,60,40,0.38)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  style={{ ...INPUT_STYLE, paddingLeft: 30 }}
                />
              </div>
              <div style={{ position: 'relative' }}>
                <Clock size={13} color="rgba(26,60,40,0.38)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  type="time"
                  required
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  style={{ ...INPUT_STYLE, paddingLeft: 30 }}
                />
              </div>
              <div style={{ position: 'relative' }}>
                <Clock size={13} color="rgba(26,60,40,0.38)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  type="time"
                  required
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  style={{ ...INPUT_STYLE, paddingLeft: 30 }}
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <label style={LABEL_STYLE}>Location</label>
            <div style={{ position: 'relative' }}>
              <MapPin size={13} color="rgba(26,60,40,0.38)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="123 Main St, Johannesburg"
                style={{ ...INPUT_STYLE, paddingLeft: 30 }}
              />
            </div>
          </div>

          {/* Attendees */}
          <div>
            <label style={LABEL_STYLE}>Attendees</label>
            <div style={{ position: 'relative' }}>
              <Users size={13} color="rgba(26,60,40,0.38)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                type="text"
                value={formData.attendees}
                onChange={(e) => setFormData({ ...formData, attendees: e.target.value })}
                placeholder="Add attendees (comma separated)"
                style={{ ...INPUT_STYLE, paddingLeft: 30 }}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={LABEL_STYLE}>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Add event details..."
              style={{ ...INPUT_STYLE, resize: 'none', lineHeight: 1.55 }}
            />
          </div>

          {/* Reminder */}
          <div>
            <label style={LABEL_STYLE}>Reminder</label>
            <div style={{ position: 'relative' }}>
              <Bell size={13} color="rgba(26,60,40,0.38)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <select
                value={formData.reminder}
                onChange={(e) => setFormData({ ...formData, reminder: e.target.value })}
                style={{ ...INPUT_STYLE, paddingLeft: 30, appearance: 'none' }}
              >
                <option value="0">No reminder</option>
                <option value="15">15 minutes before</option>
                <option value="30">30 minutes before</option>
                <option value="60">1 hour before</option>
                <option value="1440">1 day before</option>
              </select>
            </div>
          </div>
        </form>

        {/* ── Footer ────────────────────────────────────────────────────────── */}
        <div
          style={{
            padding: '14px 22px 18px',
            borderTop: '1px solid rgba(26,60,40,0.1)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 18px',
              borderRadius: 8,
              border: '1px solid rgba(26,60,40,0.2)',
              background: 'transparent',
              color: 'rgba(26,60,40,0.6)',
              fontSize: '0.82rem',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            style={{
              padding: '8px 22px',
              borderRadius: 8,
              background: C.forest,
              color: C.egreen,
              fontSize: '0.82rem',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Create Event
          </button>
        </div>
      </div>
    </div>
  );
}
