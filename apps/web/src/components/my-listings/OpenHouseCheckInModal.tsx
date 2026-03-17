'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Tabs from '@radix-ui/react-tabs';
import {
  X,
  Users,
  UserPlus,
  Search,
  QrCode,
  CheckCircle2,
  Clock,
  TrendingUp,
  Mail,
  Phone,
  ChevronRight,
  Star,
  Camera,
  AlertCircle,
  BarChart3,
  Download,
  XCircle,
  Loader2,
  StopCircle,
} from 'lucide-react';
import { viewingActionsApi, type OpenHouseAttendee } from '@/lib/api-client';

interface OpenHouseCheckInModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  authToken: string;
  openHouse: {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
  };
}

export function OpenHouseCheckInModal({ open, onOpenChange, authToken, openHouse }: OpenHouseCheckInModalProps) {
  const [activeTab, setActiveTab] = useState<'quick' | 'manual' | 'scan'>('quick');
  const [registrations, setRegistrations] = useState<OpenHouseAttendee[]>([]);
  const [isLoadingRegs, setIsLoadingRegs] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Manual check-in form state
  const [manualForm, setManualForm] = useState({
    name: '',
    email: '',
    phone: '',
    interestLevel: 'medium' as 'high' | 'medium' | 'low',
    notes: ''
  });

  // QR scanner state
  const [scannerActive, setScannerActive] = useState(false);
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string } | null>(null);
  const scannerDivRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scannerRef = useRef<any>(null);

  const stopScanner = useCallback(() => {
    if (scannerRef.current) {
      try { scannerRef.current.stop().catch(() => {}); } catch { /* ignore */ }
      scannerRef.current = null;
    }
    setScannerActive(false);
  }, []);

  const startScanner = useCallback(async () => {
    if (scannerActive) return;
    setScanResult(null);
    setScannerActive(true);

    try {
      // Dynamic import so the lib is only loaded when needed (avoids SSR issues)
      const { Html5Qrcode } = await import('html5-qrcode');
      if (!scannerDivRef.current) { setScannerActive(false); return; }

      const scanner = new Html5Qrcode('qr-scanner-region');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        async (decodedText) => {
          // decodedText is the qr_token UUID
          stopScanner();
          setSubmitting(true);
          try {
            const updated = await viewingActionsApi.checkInAttendee(authToken, openHouse.id, {
              qrToken: decodedText.trim(),
            });
            setRegistrations(prev => {
              const exists = prev.find(r => r.id === updated.id);
              return exists ? prev.map(r => r.id === updated.id ? updated : r) : [updated, ...prev];
            });
            setScanResult({ success: true, message: 'Checked in successfully!' });
          } catch (err: unknown) {
            setScanResult({ success: false, message: err instanceof Error ? err.message : 'QR code not recognised' });
          } finally {
            setSubmitting(false);
          }
        },
        () => { /* scan error — ignore individual frame failures */ },
      );
    } catch {
      setScannerActive(false);
      setScanResult({ success: false, message: 'Camera access denied or unavailable' });
    }
  }, [scannerActive, authToken, openHouse.id, stopScanner]);

  // Stop scanner when switching away from scan tab or closing modal
  useEffect(() => {
    if (activeTab !== 'scan' || !open) stopScanner();
  }, [activeTab, open, stopScanner]);

  // Cleanup on unmount
  useEffect(() => () => stopScanner(), [stopScanner]);

  const [eventStartTime] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());

  // Load registrations when modal opens
  useEffect(() => {
    if (!open) return;
    setIsLoadingRegs(true);
    viewingActionsApi.getOpenHouseRegistrations(authToken, openHouse.id)
      .then(setRegistrations)
      .catch(() => setRegistrations([]))
      .finally(() => setIsLoadingRegs(false));
  }, [open, openHouse.id, authToken]);

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleQuickCheckIn = async (reg: OpenHouseAttendee) => {
    setSubmitting(true);
    try {
      const updated = await viewingActionsApi.checkInAttendee(authToken, openHouse.id, {
        registrationId: reg.id,
      });
      setRegistrations(prev => prev.map(r => r.id === updated.id ? updated : r));
      setSearchQuery('');
    } catch {
      // optimistic fallback — mark locally
      setRegistrations(prev =>
        prev.map(r => r.id === reg.id ? { ...r, attended: true, checked_in_at: new Date().toISOString() } : r)
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleManualCheckIn = async () => {
    if (!manualForm.name) {
      alert('Please enter the visitor\'s full name');
      return;
    }
    setSubmitting(true);
    try {
      const newReg = await viewingActionsApi.checkInAttendee(authToken, openHouse.id, {
        guestName: manualForm.name,
        guestEmail: manualForm.email,
        guestPhone: manualForm.phone || undefined,
        interestLevel: manualForm.interestLevel,
        notes: manualForm.notes || undefined,
      });
      setRegistrations(prev => [newReg, ...prev]);
      setManualForm({ name: '', email: '', phone: '', interestLevel: 'medium', notes: '' });
      setActiveTab('quick');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Check-in failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Pre-registered = has buyer_id, not yet checked in
  const preRegistered = registrations.filter(r => r.buyer_id && !r.attended);
  // Checked-in visitors (both pre-registered and walk-ins)
  const checkedIn = registrations.filter(r => r.attended);

  const filteredPreRegistered = preRegistered.filter(r => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const name = r.buyer_id ? `${r.first_name ?? ''} ${r.last_name ?? ''}`.toLowerCase() : (r.guest_name ?? '').toLowerCase();
    const email = (r.email ?? r.guest_email ?? '').toLowerCase();
    return name.includes(q) || email.includes(q);
  });

  const highInterestCount = checkedIn.filter(v => v.interest_level === 'high').length;
  const eventDuration = Math.floor((currentTime.getTime() - eventStartTime.getTime()) / 60000);
  const avgVisitorsPerHour = eventDuration > 0 ? Math.round((checkedIn.length / eventDuration) * 60) : 0;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50" />
        <Dialog.Content className="fixed inset-0 md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 bg-white md:rounded-xl shadow-2xl w-full md:max-w-6xl md:max-h-[95vh] overflow-hidden z-50 flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <Dialog.Title className="text-2xl font-semibold mb-1">Active Check-In</Dialog.Title>
                <Dialog.Description className="text-blue-100 text-sm">
                  Open House • {new Date(openHouse.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} • {openHouse.startTime} - {openHouse.endTime}
                </Dialog.Description>
              </div>
              <Dialog.Close className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                <X className="w-6 h-6" />
              </Dialog.Close>
            </div>

            {/* Live Stats */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                <div className="flex items-center gap-2 text-blue-100 text-xs mb-1">
                  <Users className="w-4 h-4" />
                  Total Visitors
                </div>
                <div className="text-3xl font-bold">{checkedIn.length}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                <div className="flex items-center gap-2 text-blue-100 text-xs mb-1">
                  <TrendingUp className="w-4 h-4" />
                  High Interest
                </div>
                <div className="text-3xl font-bold">{highInterestCount}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                <div className="flex items-center gap-2 text-blue-100 text-xs mb-1">
                  <Clock className="w-4 h-4" />
                  Event Time
                </div>
                <div className="text-3xl font-bold">{eventDuration}m</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                <div className="flex items-center gap-2 text-blue-100 text-xs mb-1">
                  <BarChart3 className="w-4 h-4" />
                  Per Hour
                </div>
                <div className="text-3xl font-bold">{avgVisitorsPerHour}</div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-h-0 overflow-hidden grid md:grid-cols-2 gap-0">
            {/* Left Panel - Check-In Interface */}
            <div className="border-r border-gray-200 flex flex-col min-h-0">
              <Tabs.Root value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="flex-1 min-h-0 flex flex-col">
                <Tabs.List className="flex border-b border-gray-200 bg-gray-50 px-4 shrink-0">
                  <Tabs.Trigger
                    value="quick"
                    className="px-4 py-3 text-sm font-medium text-gray-600 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 hover:text-gray-900 transition-colors flex items-center gap-2"
                  >
                    <Search className="w-4 h-4" />
                    Quick Check-In
                  </Tabs.Trigger>
                  <Tabs.Trigger
                    value="manual"
                    className="px-4 py-3 text-sm font-medium text-gray-600 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 hover:text-gray-900 transition-colors flex items-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    Walk-In
                  </Tabs.Trigger>
                  <Tabs.Trigger
                    value="scan"
                    className="px-4 py-3 text-sm font-medium text-gray-600 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 hover:text-gray-900 transition-colors flex items-center gap-2"
                  >
                    <QrCode className="w-4 h-4" />
                    QR Scan
                  </Tabs.Trigger>
                </Tabs.List>

                <div className="flex-1 min-h-0 overflow-y-auto p-6">
                  {/* Quick Check-In Tab */}
                  <Tabs.Content value="quick" className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Search Pre-Registered Visitors
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search by name or email..."
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                          autoFocus
                        />
                      </div>
                    </div>

                    {isLoadingRegs ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                      </div>
                    ) : filteredPreRegistered.length > 0 ? (
                      <div className="space-y-2">
                        <div className="text-sm text-gray-600 mb-2">
                          {filteredPreRegistered.length} pre-registered visitor{filteredPreRegistered.length !== 1 ? 's' : ''}
                        </div>
                        {filteredPreRegistered.map((reg) => {
                          const name = reg.buyer_id
                            ? `${reg.first_name ?? ''} ${reg.last_name ?? ''}`.trim()
                            : (reg.guest_name ?? 'Unknown');
                          const email = reg.email ?? reg.guest_email ?? '';
                          const phone = reg.phone ?? reg.guest_phone ?? '';
                          const registeredAt = new Date(reg.registered_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
                          return (
                            <button
                              key={reg.id}
                              onClick={() => handleQuickCheckIn(reg)}
                              disabled={submitting}
                              className="w-full text-left bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-blue-600 hover:shadow-md transition-all group disabled:opacity-50"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="font-medium text-lg mb-1 group-hover:text-blue-600 transition-colors">
                                    {name}
                                  </div>
                                  <div className="flex items-center gap-3 text-sm text-gray-600">
                                    {email && <div className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{email}</div>}
                                    {phone && <div className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{phone}</div>}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">Registered: {registeredAt}</div>
                                </div>
                                <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-blue-600 transition-colors" />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : searchQuery ? (
                      <div className="text-center py-12">
                        <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No pre-registered visitors found</p>
                        <button
                          onClick={() => setActiveTab('manual')}
                          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
                        >
                          <UserPlus className="w-4 h-4" />
                          Add as Walk-In
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 mb-2">
                          {preRegistered.length} visitor{preRegistered.length !== 1 ? 's' : ''} waiting to check in
                        </p>
                        <p className="text-sm text-gray-400">
                          Search by name or email above
                        </p>
                      </div>
                    )}
                  </Tabs.Content>

                  {/* Manual Check-In Tab */}
                  <Tabs.Content value="manual" className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-blue-900">
                        <div className="font-medium mb-0.5">Walk-In Visitor</div>
                        <div className="text-blue-700">Enter details for visitors who didn't pre-register</div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={manualForm.name}
                        onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
                        placeholder="Enter visitor's name"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mobile Number
                      </label>
                      <input
                        type="tel"
                        value={manualForm.phone}
                        onChange={(e) => setManualForm({ ...manualForm, phone: e.target.value })}
                        placeholder="+1 (555) 123-4567"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={manualForm.email}
                        onChange={(e) => setManualForm({ ...manualForm, email: e.target.value })}
                        placeholder="email@example.com"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Interest Level
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {(['high', 'medium', 'low'] as const).map((level) => (
                          <button
                            key={level}
                            onClick={() => setManualForm({ ...manualForm, interestLevel: level })}
                            className={`p-3 border-2 rounded-lg transition-all ${
                              manualForm.interestLevel === level
                                ? level === 'high'
                                  ? 'border-green-600 bg-green-50'
                                  : level === 'medium'
                                  ? 'border-yellow-600 bg-yellow-50'
                                  : 'border-gray-600 bg-gray-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className={`text-sm font-medium ${
                              manualForm.interestLevel === level
                                ? level === 'high'
                                  ? 'text-green-700'
                                  : level === 'medium'
                                  ? 'text-yellow-700'
                                  : 'text-gray-700'
                                : 'text-gray-600'
                            }`}>
                              {level.charAt(0).toUpperCase() + level.slice(1)}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quick Notes (Optional)
                      </label>
                      <textarea
                        value={manualForm.notes}
                        onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                        rows={3}
                        placeholder="Add any relevant notes about this visitor..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    </div>
                  </Tabs.Content>

                  {/* QR Scan Tab */}
                  <Tabs.Content value="scan" className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                      <QrCode className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                      <div className="text-sm text-blue-900">
                        <div className="font-medium mb-0.5">Scan Visitor QR Code</div>
                        <div className="text-blue-700">
                          Ask the visitor to show their confirmation email QR code. Point the camera at it to check them in instantly.
                        </div>
                      </div>
                    </div>

                    {/* Scanner viewport */}
                    <div className="relative rounded-xl overflow-hidden bg-black aspect-square max-w-xs mx-auto">
                      <div id="qr-scanner-region" ref={scannerDivRef} className="w-full h-full" />
                      {!scannerActive && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80 text-white gap-3">
                          <Camera className="w-16 h-16 opacity-50" />
                          <span className="text-sm text-gray-300">Camera inactive</span>
                        </div>
                      )}
                      {scannerActive && (
                        /* Crosshair overlay */
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                          <div className="w-48 h-48 border-2 border-white/70 rounded-lg" style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)' }} />
                        </div>
                      )}
                    </div>

                    {/* Scan result feedback */}
                    {scanResult && (
                      <div className={`flex items-center gap-2 p-3 rounded-lg text-sm font-medium ${scanResult.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                        {scanResult.success
                          ? <CheckCircle2 className="w-5 h-5 shrink-0" />
                          : <XCircle className="w-5 h-5 shrink-0" />}
                        {scanResult.message}
                      </div>
                    )}

                    {submitting && (
                      <div className="flex items-center justify-center gap-2 text-blue-600 text-sm">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Checking in…
                      </div>
                    )}

                    <div className="flex gap-3">
                      {!scannerActive ? (
                        <button
                          onClick={startScanner}
                          className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                        >
                          <Camera className="w-5 h-5" />
                          Start Camera
                        </button>
                      ) : (
                        <button
                          onClick={stopScanner}
                          className="flex-1 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium flex items-center justify-center gap-2"
                        >
                          <StopCircle className="w-5 h-5" />
                          Stop Camera
                        </button>
                      )}
                      {scanResult && (
                        <button
                          onClick={() => { setScanResult(null); startScanner(); }}
                          className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                        >
                          Scan Again
                        </button>
                      )}
                    </div>
                  </Tabs.Content>
                </div>
                {/* Pinned submit button — only shown on Walk-In tab */}
                {activeTab === 'manual' && (
                  <div className="shrink-0 px-6 py-4 border-t border-gray-200 bg-white">
                    <button
                      onClick={handleManualCheckIn}
                      disabled={submitting}
                      className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-base flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                      Add to Checked-In
                    </button>
                  </div>
                )}
              </Tabs.Root>
            </div>

            {/* Right Panel - Checked-In Visitors */}
            <div className="flex flex-col min-h-0 bg-gray-50">
              <div className="p-6 border-b border-gray-200 bg-white shrink-0">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">Checked In Today</h3>
                    <p className="text-sm text-gray-600">
                      {checkedIn.length} visitor{checkedIn.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                      <Download className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-3">
                {checkedIn.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No visitors checked in yet</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Check-ins will appear here in real-time
                    </p>
                  </div>
                ) : (
                  checkedIn.map((visitor) => {
                    const name = visitor.buyer_id
                      ? `${visitor.first_name ?? ''} ${visitor.last_name ?? ''}`.trim()
                      : (visitor.guest_name ?? 'Guest');
                    const email = visitor.email ?? visitor.guest_email ?? '';
                    const phone = visitor.phone ?? visitor.guest_phone ?? '';
                    const checkInTime = visitor.checked_in_at
                      ? new Date(visitor.checked_in_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                      : '';
                    const initials = name.split(' ').map(n => n[0]).filter(Boolean).join('').slice(0, 2).toUpperCase();
                    return (
                    <div
                      key={visitor.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                              {initials}
                            </div>
                            <div>
                              <div className="font-medium">{name}</div>
                              <div className="text-xs text-gray-500 flex items-center gap-2">
                                {checkInTime && <><Clock className="w-3 h-3" />{checkInTime}</>}
                                {visitor.buyer_id && (
                                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                                    Pre-reg
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="space-y-1 mt-2">
                            {email && <div className="flex items-center gap-1.5 text-xs text-gray-600"><Mail className="w-3 h-3" />{email}</div>}
                            {phone && <div className="flex items-center gap-1.5 text-xs text-gray-600"><Phone className="w-3 h-3" />{phone}</div>}
                          </div>
                        </div>
                      </div>
                      {visitor.interest_level && (
                        <div className="pt-2 border-t border-gray-100">
                          <div className="flex items-center gap-1">
                            {[1, 2, 3].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  (visitor.interest_level === 'high' && star <= 3) ||
                                  (visitor.interest_level === 'medium' && star <= 2) ||
                                  (visitor.interest_level === 'low' && star <= 1)
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                            <span className="text-xs text-gray-600 ml-2">
                              {visitor.interest_level.charAt(0).toUpperCase() + visitor.interest_level.slice(1)} Interest
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-4 bg-white flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-gray-600">Event Active</span>
              </div>
              <span className="text-gray-400">•</span>
              <span className="text-gray-600">
                Started {eventDuration} minutes ago
              </span>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export Data
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to end check-in? This will close the check-in screen.')) {
                    onOpenChange(false);
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                End Check-In
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}