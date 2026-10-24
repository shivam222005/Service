import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.js';
import { NotificationItem } from '../types.js';
import { X, Bell, CheckCheck, Clock, Calendar, Star, ShieldAlert } from 'lucide-react';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose, onNavigate }) => {
  const { user, refreshUser } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      loadNotifications();
    }
  }, [isOpen, user]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await api.notifications.getAll();
      setNotifications(data.notifications);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: number, link?: string) => {
    try {
      await api.notifications.markRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n)));
      refreshUser();
      if (link) {
        onClose();
        if (link.includes('dashboard')) {
          onNavigate(user?.role === 'SERVICE_PROVIDER' ? 'pro-dashboard' : user?.role === 'ADMIN' ? 'admin-dashboard' : 'customer-dashboard');
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      refreshUser();
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'BOOKING_REQUEST':
      case 'BOOKING_ACCEPTED':
      case 'BOOKING_COMPLETED':
        return <Calendar className="w-4 h-4 text-blue-600" />;
      case 'REVIEW_RECEIVED':
        return <Star className="w-4 h-4 text-amber-500 fill-amber-500" />;
      case 'BOOKING_CANCELLED':
        return <ShieldAlert className="w-4 h-4 text-red-500" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div 
        className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-sm">Notifications</h3>
          </div>
          <div className="flex items-center gap-2">
            {notifications.some((n) => !n.is_read) && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-4 overflow-y-auto flex-1 divide-y divide-slate-100">
          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">No notifications yet.</div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleMarkAsRead(notif.id, notif.link)}
                className={`py-3 px-2 flex items-start gap-3 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer ${
                  !notif.is_read ? 'bg-blue-50/50' : ''
                }`}
              >
                <div className="p-2 rounded-lg bg-slate-100 shrink-0 mt-0.5">
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className={`text-xs font-semibold ${!notif.is_read ? 'text-blue-900' : 'text-slate-800'}`}>
                      {notif.title}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono tabular-nums">
                      {new Date(notif.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{notif.message}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
