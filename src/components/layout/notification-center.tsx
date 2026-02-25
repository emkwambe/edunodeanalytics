'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Bell,
  X,
  AlertTriangle,
  TrendingDown,
  UserCheck,
  Clock,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'alert' | 'insight' | 'system' | 'action';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  href?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

interface NotificationCenterProps {
  schoolSlug: string;
}

/**
 * Notification Center - Bell icon dropdown with alerts and insights
 */
export function NotificationCenter({ schoolSlug }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<Notification[]>([
    {
      id: 'n1',
      type: 'alert',
      title: '3 students moved to critical risk',
      message: 'Aiden M., Sofia R., and Marcus J. exceeded risk threshold this week.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      read: false,
      href: `/${schoolSlug}/dashboard/students`,
      priority: 'urgent',
    },
    {
      id: 'n2',
      type: 'insight',
      title: 'Attendance dip detected in Grade 7',
      message: 'Chronic absence rate increased 4% this month. 3 classrooms affected.',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      read: false,
      href: `/${schoolSlug}/dashboard/attendance`,
      priority: 'high',
    },
    {
      id: 'n3',
      type: 'action',
      title: 'Weekly data review due',
      message: 'Your scheduled data review for this week hasn\'t been completed.',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      read: false,
      priority: 'medium',
    },
    {
      id: 'n4',
      type: 'insight',
      title: 'Math momentum improving',
      message: '62% of intervention students showing positive trajectory.',
      timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
      read: true,
      href: `/${schoolSlug}/dashboard/momentum`,
      priority: 'low',
    },
    {
      id: 'n5',
      type: 'system',
      title: 'Data sync completed',
      message: 'Clever roster sync finished. 487 students, 42 teachers updated.',
      timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000),
      read: true,
      priority: 'low',
    },
  ]);

  const panelRef = React.useRef<HTMLDivElement>(null);

  // Close on outside click
  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const getTimeAgo = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const typeIcons: Record<string, React.ElementType> = {
    alert: AlertTriangle,
    insight: TrendingDown,
    system: CheckCircle2,
    action: Clock,
  };

  const priorityColors: Record<string, string> = {
    urgent: 'bg-rose-500',
    high: 'bg-amber-500',
    medium: 'bg-indigo-500',
    low: 'bg-slate-500',
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-400 hover:text-slate-300 transition rounded-lg hover:bg-slate-800"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
            <h3 className="font-semibold text-white text-sm">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-indigo-400 hover:text-indigo-300"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-500 hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-[420px] overflow-y-auto">
            {notifications.map((notification) => {
              const Icon = typeIcons[notification.type] || Bell;
              const content = (
                <div
                  className={cn(
                    'flex items-start gap-3 px-4 py-3 border-b border-slate-700/50 transition',
                    notification.read
                      ? 'opacity-60 hover:opacity-80'
                      : 'hover:bg-slate-700/30'
                  )}
                >
                  {/* Priority dot + Icon */}
                  <div className="relative mt-0.5">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center',
                        notification.type === 'alert'
                          ? 'bg-rose-500/20'
                          : notification.type === 'insight'
                          ? 'bg-amber-500/20'
                          : notification.type === 'action'
                          ? 'bg-indigo-500/20'
                          : 'bg-slate-700'
                      )}
                    >
                      <Icon
                        className={cn(
                          'w-4 h-4',
                          notification.type === 'alert'
                            ? 'text-rose-400'
                            : notification.type === 'insight'
                            ? 'text-amber-400'
                            : notification.type === 'action'
                            ? 'text-indigo-400'
                            : 'text-slate-400'
                        )}
                      />
                    </div>
                    {!notification.read && (
                      <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-indigo-500 rounded-full border-2 border-slate-800" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn('text-sm', notification.read ? 'text-slate-400' : 'text-white font-medium')}>
                        {notification.title}
                      </p>
                      <span className="text-[10px] text-slate-500 whitespace-nowrap">
                        {getTimeAgo(notification.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                      {notification.message}
                    </p>
                  </div>

                  {notification.href && (
                    <ChevronRight className="w-4 h-4 text-slate-500 mt-1" />
                  )}
                </div>
              );

              if (notification.href) {
                return (
                  <Link
                    key={notification.id}
                    href={notification.href}
                    onClick={() => {
                      markRead(notification.id);
                      setIsOpen(false);
                    }}
                  >
                    {content}
                  </Link>
                );
              }

              return (
                <div
                  key={notification.id}
                  onClick={() => markRead(notification.id)}
                  className="cursor-pointer"
                >
                  {content}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-slate-700 text-center">
            <Link
              href={`/${schoolSlug}/notifications`}
              onClick={() => setIsOpen(false)}
              className="text-xs text-indigo-400 hover:text-indigo-300"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
