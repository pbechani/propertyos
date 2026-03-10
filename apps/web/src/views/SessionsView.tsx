'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Monitor, Smartphone, Tablet, Globe,
  Trash2, ShieldOff, RefreshCw, AlertTriangle,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { sessionsApi, type UserSession } from '@/lib/api-client';
import { getAccessToken } from '@/lib/auth-session';

function deviceIcon(userAgent?: string) {
  if (!userAgent) return <Globe className="w-5 h-5" />;
  const ua = userAgent.toLowerCase();
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return <Smartphone className="w-5 h-5" />;
  }
  if (ua.includes('tablet') || ua.includes('ipad')) {
    return <Tablet className="w-5 h-5" />;
  }
  return <Monitor className="w-5 h-5" />;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function SessionsView() {
  const router = useRouter();
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [confirmRevokeAll, setConfirmRevokeAll] = useState(false);

  const token = getAccessToken();

  const loadSessions = async () => {
    if (!token) { router.push('/login?next=/app/sessions'); return; }
    setLoading(true);
    setError(null);
    try {
      const data = await sessionsApi.getSessions(token);
      setSessions(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSessions(); }, [token]);

  const handleRevoke = async (sessionId: string) => {
    if (!token) return;
    setRevoking(sessionId);
    try {
      await sessionsApi.revokeSession(token, sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to revoke session');
    } finally {
      setRevoking(null);
    }
  };

  const handleRevokeAll = async () => {
    if (!token) return;
    setRevoking('all');
    try {
      await sessionsApi.revokeAll(token);
      router.push('/login');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to revoke all sessions');
      setRevoking(null);
      setConfirmRevokeAll(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Active Sessions</h1>
            <p className="text-gray-600 mt-1 text-sm">
              Manage all devices and browsers currently signed into your account.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadSessions}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-6 flex items-center gap-2 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Revoke All */}
        {sessions.length > 0 && (
          <div className="mb-6">
            {confirmRevokeAll ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-700 mb-3">
                  This will sign you out of <strong>all</strong> devices including this one.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleRevokeAll}
                    disabled={revoking === 'all'}
                  >
                    {revoking === 'all' ? 'Revoking…' : 'Yes, Sign Out All'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirmRevokeAll(false)}
                    disabled={revoking === 'all'}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => setConfirmRevokeAll(true)}
              >
                <ShieldOff className="w-4 h-4 mr-2" />
                Sign Out All Devices
              </Button>
            )}
          </div>
        )}

        {/* Sessions list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-6 h-6 animate-spin text-gray-400 mr-3" />
            <span className="text-gray-500">Loading sessions…</span>
          </div>
        ) : sessions.length === 0 ? (
          <Card className="p-12 text-center">
            <Monitor className="w-10 h-10 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No active sessions found.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <Card key={session.id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 shrink-0">
                      {deviceIcon(session.userAgent ?? undefined)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">
                          {session.userAgent
                            ? session.userAgent.slice(0, 60) + (session.userAgent.length > 60 ? '…' : '')
                            : 'Unknown device'}
                        </span>
                        {session.current && (
                          <Badge className="bg-green-100 text-green-700 text-xs">
                            Current
                          </Badge>
                        )}
                      </div>
                      {session.ipAddress && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          IP: {session.ipAddress}
                        </div>
                      )}
                      <div className="text-xs text-gray-400 mt-1">
                        {session.lastActiveAt
                          ? `Last active: ${formatDate(session.lastActiveAt)}`
                          : `Started: ${formatDate(session.createdAt)}`}
                      </div>
                    </div>
                  </div>

                  {!session.current && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50 shrink-0"
                      onClick={() => handleRevoke(session.id)}
                      disabled={revoking === session.id}
                    >
                      {revoking === session.id ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
