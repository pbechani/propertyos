'use client';

import { useEffect, useState, useCallback } from "react";
import { X, Bell, CheckCircle, AlertTriangle, Info, MessageSquare, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { notificationsApi, type UserNotification } from "@/lib/api-client";
import { getAccessToken, getActiveCompanyContext } from "@/lib/auth-session";

interface NotificationCenterProps {
  onClose: () => void;
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(dateStr).toLocaleDateString();
}

function getIcon(type: string) {
  if (type.includes("confirmed") || type.includes("approved") || type.includes("success")) return CheckCircle;
  if (type.includes("declined") || type.includes("cancelled") || type.includes("warning")) return AlertTriangle;
  if (type.includes("message") || type.includes("inquiry") || type.includes("request")) return MessageSquare;
  return Info;
}

function getColorClasses(type: string): string {
  if (type.includes("confirmed") || type.includes("approved") || type.includes("success")) return "bg-green-100 text-green-600";
  if (type.includes("declined") || type.includes("cancelled") || type.includes("warning")) return "bg-orange-100 text-orange-600";
  if (type.includes("message") || type.includes("inquiry") || type.includes("request")) return "bg-blue-100 text-blue-600";
  return "bg-gray-100 text-gray-600";
}

export function NotificationCenter({ onClose }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const activeCompany = getActiveCompanyContext();
  const companyName = activeCompany?.name ?? null;

  const load = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const data = await notificationsApi.getAll(token);
      setNotifications(data);
    } catch {
      setError("Unable to load notifications.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleMarkRead = async (id: string) => {
    const token = getAccessToken();
    if (!token || markingId) return;
    setMarkingId(id);
    try {
      await notificationsApi.markRead(token, id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)),
      );
    } finally {
      setMarkingId(null);
    }
  };

  const handleMarkAllRead = async () => {
    const token = getAccessToken();
    if (!token || markingAll) return;
    setMarkingAll(true);
    try {
      await notificationsApi.markAllRead(token);
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })),
      );
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="bg-white w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-lg">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold">Notifications</h2>
              <p className="text-sm text-gray-500">
                {companyName ? `${companyName} · ` : ""}
                {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllRead}
                disabled={markingAll}
              >
                {markingAll ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                Mark all as read
              </Button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close notifications"
              title="Close notifications"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading && (
            <div className="flex items-center justify-center py-12 text-gray-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading notifications…</span>
            </div>
          )}

          {!isLoading && error && (
            <p className="text-center text-sm text-red-500 py-12">{error}</p>
          )}

          {!isLoading && !error && notifications.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Bell className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">No notifications yet</p>
            </div>
          )}

          {!isLoading && !error && notifications.length > 0 && (
            <div className="space-y-2">
              {notifications.map((notification) => {
                const isRead = Boolean(notification.read_at);
                const Icon = getIcon(notification.type);
                const colorClasses = getColorClasses(notification.type);

                return (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border transition-colors cursor-pointer hover:shadow-md ${
                      isRead ? "bg-white border-gray-200" : "bg-blue-50 border-blue-200"
                    }`}
                    onClick={() => { if (!isRead) void handleMarkRead(notification.id); }}
                    role="button"
                    aria-label={isRead ? notification.title : `Mark as read: ${notification.title}`}
                  >
                    <div className="flex gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${colorClasses}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <h3 className="font-semibold text-gray-900 text-sm">{notification.title}</h3>
                          <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                            {formatRelativeTime(notification.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{notification.body}</p>
                      </div>
                      {!isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-2" aria-hidden="true" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

