'use client';

import { X, Bell, CheckCircle, AlertTriangle, Info, MessageSquare } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

interface NotificationCenterProps {
  onClose: () => void;
}

interface Notification {
  id: string;
  type: "success" | "warning" | "info" | "message";
  title: string;
  message: string;
  time: string;
  read: boolean;
  actionText?: string;
}

export function NotificationCenter({ onClose }: NotificationCenterProps) {
  const notifications: Notification[] = [
    {
      id: "1",
      type: "success",
      title: "Verification Approved",
      message: "Your identity has been verified. You now have a verified badge!",
      time: "5 minutes ago",
      read: false,
      actionText: "View Profile",
    },
    {
      id: "2",
      type: "message",
      title: "New Inquiry on 88 Sunset Boulevard",
      message: "Sarah Johnson is interested in scheduling a viewing.",
      time: "1 hour ago",
      read: false,
      actionText: "Respond",
    },
    {
      id: "3",
      type: "warning",
      title: "Document Expiring Soon",
      message: "Your business license will expire in 30 days. Please update.",
      time: "3 hours ago",
      read: false,
      actionText: "Update Document",
    },
    {
      id: "4",
      type: "info",
      title: "Viewing Scheduled",
      message: "Property viewing confirmed for tomorrow at 2:00 PM",
      time: "5 hours ago",
      read: true,
      actionText: "View Details",
    },
    {
      id: "5",
      type: "success",
      title: "New Lead Generated",
      message: "You have a new lead for 204 Sky View property",
      time: "Yesterday",
      read: true,
      actionText: "Contact Lead",
    },
    {
      id: "6",
      type: "info",
      title: "Price Alert",
      message: "Property in West Hills dropped by $50,000",
      time: "2 days ago",
      read: true,
    },
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return CheckCircle;
      case "warning":
        return AlertTriangle;
      case "message":
        return MessageSquare;
      default:
        return Info;
    }
  };

  const getColorClasses = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-100 text-green-600";
      case "warning":
        return "bg-orange-100 text-orange-600";
      case "message":
        return "bg-blue-100 text-blue-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="bg-white w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-lg">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold">Notifications</h2>
              {unreadCount > 0 && (
                <p className="text-sm text-gray-600">{unreadCount} unread notifications</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              Mark all as read
            </Button>
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

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {notifications.map((notification) => {
              const Icon = getIcon(notification.type);
              const colorClasses = getColorClasses(notification.type);

              return (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    notification.read
                      ? "bg-white border-gray-200"
                      : "bg-blue-50 border-blue-200"
                  } hover:shadow-md`}
                >
                  <div className="flex gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${colorClasses}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                        <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                          {notification.time}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{notification.message}</p>
                      {notification.actionText && (
                        <Button variant="outline" size="sm">
                          {notification.actionText}
                        </Button>
                      )}
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-2"></div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-lg">
          <Button variant="ghost" className="w-full">
            View All Notifications
          </Button>
        </div>
      </Card>
    </div>
  );
}
