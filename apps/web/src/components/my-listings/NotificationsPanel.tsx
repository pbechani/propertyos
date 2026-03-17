'use client';

import { X, Bell, MessageSquare, DollarSign, Eye, FileText, CheckCircle } from 'lucide-react';
import { useState } from 'react';

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Notification {
  id: string;
  type: 'viewing' | 'message' | 'offer' | 'document' | 'general';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export function NotificationsPanel({ isOpen, onClose }: NotificationsPanelProps) {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'viewing',
      title: 'Upcoming Viewing',
      message: 'Property viewing at 123 Ocean Ave scheduled for 2:00 PM today',
      time: '10 minutes ago',
      read: false,
    },
    {
      id: '2',
      type: 'message',
      title: 'New Enquiry',
      message: 'John Smith sent a message about 456 Market St',
      time: '1 hour ago',
      read: false,
    },
    {
      id: '3',
      type: 'offer',
      title: 'New Offer Received',
      message: '$875,000 offer received for 789 Pine St',
      time: '2 hours ago',
      read: false,
    },
    {
      id: '4',
      type: 'document',
      title: 'Document Uploaded',
      message: 'Inspection report added to 123 Ocean Ave',
      time: '3 hours ago',
      read: true,
    },
    {
      id: '5',
      type: 'general',
      title: 'Open House Reminder',
      message: 'Open house at 456 Market St starts at 1:00 PM tomorrow',
      time: '5 hours ago',
      read: true,
    },
  ]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'viewing':
        return Eye;
      case 'message':
        return MessageSquare;
      case 'offer':
        return DollarSign;
      case 'document':
        return FileText;
      default:
        return Bell;
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'viewing':
        return 'bg-blue-100 text-blue-600';
      case 'message':
        return 'bg-green-100 text-green-600';
      case 'offer':
        return 'bg-purple-100 text-purple-600';
      case 'document':
        return 'bg-orange-100 text-orange-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center sm:justify-end z-50">
      <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:w-[480px] sm:mr-6 max-h-[90vh] sm:max-h-[600px] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Bell className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
                <p className="text-sm text-gray-600">{unreadCount} unread</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === 'unread'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Unread ({unreadCount})
            </button>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="ml-auto text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Mark all read
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium mb-1">You're all caught up!</p>
              <p className="text-sm text-gray-500">No {filter === 'unread' ? 'unread' : ''} notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredNotifications.map((notification) => {
                const Icon = getIcon(notification.type);
                const iconColor = getIconColor(notification.type);
                
                return (
                  <div
                    key={notification.id}
                    onClick={() => markAsRead(notification.id)}
                    className={`px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.read ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${iconColor}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-medium text-gray-900">{notification.title}</h4>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{notification.message}</p>
                        <p className="text-xs text-gray-500">{notification.time}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200">
          <button className="w-full py-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
            View all notifications
          </button>
        </div>
      </div>
    </div>
  );
}
