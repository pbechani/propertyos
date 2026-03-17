'use client';

interface ContactPreferencesProps {
  preferredContactMethod: string;
  bestContactTime: string;
  onContactMethodChange: (value: string) => void;
  onContactTimeChange: (value: string) => void;
  disabled?: boolean;
}

const CONTACT_METHODS = [
  { value: '', label: 'No preference' },
  { value: 'phone', label: 'Phone call' },
  { value: 'email', label: 'Email' },
  { value: 'whatsapp', label: 'WhatsApp' },
];

const CONTACT_TIMES = [
  { value: '', label: 'No preference' },
  { value: 'morning', label: 'Morning (8am–12pm)' },
  { value: 'afternoon', label: 'Afternoon (12pm–5pm)' },
  { value: 'evening', label: 'Evening (5pm–8pm)' },
  { value: 'anytime', label: 'Anytime' },
];

export default function ContactPreferences({
  preferredContactMethod,
  bestContactTime,
  onContactMethodChange,
  onContactTimeChange,
  disabled = false,
}: ContactPreferencesProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Preferred contact</label>
        <select
          value={preferredContactMethod}
          onChange={(e) => onContactMethodChange(e.target.value)}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          {CONTACT_METHODS.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Best time</label>
        <select
          value={bestContactTime}
          onChange={(e) => onContactTimeChange(e.target.value)}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          {CONTACT_TIMES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
