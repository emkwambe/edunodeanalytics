'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/dashboard-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Bell,
  AlertTriangle,
  TrendingDown,
  CheckCircle2,
  Clock,
  ChevronRight,
  Filter,
  Check,
  Trash2,
  MailOpen,
  Inbox,
} from 'lucide-react';

/**
 * Notifications Page
 *
 * Full listing of all notifications with filtering and bulk actions
 */

type NotificationType = 'alert' | 'insight' | 'system' | 'action';
type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  href?: string;
}

// Tab configuration
const TABS = [
  { id: 'all', label: 'All', icon: Inbox },
  { id: 'alert', label: 'Alerts', icon: AlertTriangle },
  { id: 'insight', label: 'Insights', icon: TrendingDown },
  { id: 'system', label: 'System', icon: CheckCircle2 },
  { id: 'action', label: 'Actions', icon: Clock },
] as const;

// Priority configuration
const PRIORITY_CONFIG: Record<NotificationPriority, { label: string; color: string; bgColor: string }> = {
  urgent: { label: 'Urgent', color: 'text-rose-400', bgColor: 'bg-rose-500/20' },
  high: { label: 'High', color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
  medium: { label: 'Medium', color: 'text-indigo-400', bgColor: 'bg-indigo-500/20' },
  low: { label: 'Low', color: 'text-slate-400', bgColor: 'bg-slate-500/20' },
};

// Type configuration
const TYPE_CONFIG: Record<NotificationType, { icon: React.ElementType; color: string; bgColor: string }> = {
  alert: { icon: AlertTriangle, color: 'text-rose-400', bgColor: 'bg-rose-500/20' },
  insight: { icon: TrendingDown, color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
  system: { icon: CheckCircle2, color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
  action: { icon: Clock, color: 'text-indigo-400', bgColor: 'bg-indigo-500/20' },
};

export default function NotificationsPage() {
  const params = useParams();
  const schoolSlug = params.school_slug as string;

  const [activeTab, setActiveTab] = React.useState<string>('all');
  const [selectedPriority, setSelectedPriority] = React.useState<NotificationPriority | null>(null);
  const [showUnreadOnly, setShowUnreadOnly] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  // Demo notifications data
  const [notifications, setNotifications] = React.useState<Notification[]>([
    {
      id: 'n1',
      type: 'alert',
      priority: 'urgent',
      title: '3 students moved to critical risk',
      message: 'Aiden M., Sofia R., and Marcus J. exceeded risk threshold this week. Review their profiles and consider intervention adjustments.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      read: false,
      href: `/${schoolSlug}/dashboard/students`,
    },
    {
      id: 'n2',
      type: 'insight',
      priority: 'high',
      title: 'Attendance dip detected in Grade 7',
      message: 'Chronic absence rate increased 4% this month. 3 classrooms affected. Consider targeted outreach.',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      read: false,
      href: `/${schoolSlug}/dashboard/attendance`,
    },
    {
      id: 'n3',
      type: 'action',
      priority: 'medium',
      title: 'Weekly data review due',
      message: "Your scheduled data review for this week hasn't been completed. Complete it to stay on track with your data culture goals.",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      read: false,
    },
    {
      id: 'n4',
      type: 'insight',
      priority: 'low',
      title: 'Math momentum improving',
      message: '62% of intervention students showing positive trajectory. Keep up the great work with Tier 2 interventions.',
      timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
      read: true,
      href: `/${schoolSlug}/dashboard/momentum`,
    },
    {
      id: 'n5',
      type: 'system',
      priority: 'low',
      title: 'Data sync completed',
      message: 'Clever roster sync finished successfully. 487 students and 42 teachers were updated in the system.',
      timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000),
      read: true,
    },
    {
      id: 'n6',
      type: 'alert',
      priority: 'high',
      title: 'Intervention fidelity warning',
      message: '5 interventions have missed their 3-week check-in. Review and update progress notes.',
      timestamp: new Date(Date.now() - 96 * 60 * 60 * 1000),
      read: true,
      href: `/${schoolSlug}/interventions`,
    },
    {
      id: 'n7',
      type: 'system',
      priority: 'medium',
      title: 'New assessment data available',
      message: 'NWEA MAP Winter benchmark results have been imported. 342 assessments processed.',
      timestamp: new Date(Date.now() - 120 * 60 * 60 * 1000),
      read: true,
      href: `/${schoolSlug}/dashboard/assessments`,
    },
    {
      id: 'n8',
      type: 'insight',
      priority: 'medium',
      title: 'ELA growth opportunity identified',
      message: 'AI analysis suggests 12 students in Grade 6 would benefit from targeted phonics intervention.',
      timestamp: new Date(Date.now() - 144 * 60 * 60 * 1000),
      read: true,
      href: `/${schoolSlug}/dashboard/pulse`,
    },
  ]);

  // Filter notifications
  const filteredNotifications = React.useMemo(() => {
    return notifications.filter((n) => {
      if (activeTab !== 'all' && n.type !== activeTab) return false;
      if (selectedPriority && n.priority !== selectedPriority) return false;
      if (showUnreadOnly && n.read) return false;
      return true;
    });
  }, [notifications, activeTab, selectedPriority, showUnreadOnly]);

  // Stats
  const unreadCount = notifications.filter((n) => !n.read).length;
  const alertCount = notifications.filter((n) => n.type === 'alert' && !n.read).length;

  // Time formatting
  const getTimeAgo = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  // Actions
  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setSelectedIds(new Set());
  };

  const dismissSelected = () => {
    setNotifications((prev) => prev.filter((n) => !selectedIds.has(n.id)));
    setSelectedIds(new Set());
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filteredNotifications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredNotifications.map((n) => n.id)));
    }
  };

  return (
    <>
      <PageHeader
        title="Notifications"
        description={`${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}
        actions={
          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={dismissSelected}
                  className="text-rose-400 border-rose-500/30 hover:bg-rose-500/10"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Dismiss ({selectedIds.size})
                </Button>
              </>
            )}
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllAsRead}>
                <MailOpen className="w-4 h-4 mr-2" />
                Mark all read
              </Button>
            )}
          </div>
        }
      />

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        {/* Type Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-800/50 rounded-lg">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const count = tab.id === 'all'
              ? notifications.filter((n) => !n.read).length
              : notifications.filter((n) => n.type === tab.id && !n.read).length;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition',
                  isActive
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {count > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] bg-indigo-500/20 text-indigo-400 rounded-full">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={selectedPriority || ''}
            onChange={(e) => setSelectedPriority((e.target.value as NotificationPriority) || null)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
          >
            <option value="">All priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Unread Toggle */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showUnreadOnly}
            onChange={(e) => setShowUnreadOnly(e.target.checked)}
            className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500/50"
          />
          <span className="text-sm text-slate-400">Unread only</span>
        </label>
      </div>

      {/* Notifications List */}
      <Card>
        <CardContent className="p-0">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-4">
                <Bell className="w-8 h-8 text-slate-600" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">No notifications</h3>
              <p className="text-sm text-slate-400">
                {showUnreadOnly
                  ? "You're all caught up!"
                  : 'No notifications match your filters'}
              </p>
            </div>
          ) : (
            <>
              {/* Select All Header */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700/50 bg-slate-800/30">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filteredNotifications.length && filteredNotifications.length > 0}
                    onChange={selectAll}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500/50"
                  />
                  <span className="text-xs text-slate-500">
                    {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Select all'}
                  </span>
                </label>
                <span className="text-xs text-slate-500">
                  {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Notification Items */}
              {filteredNotifications.map((notification) => {
                const typeConfig = TYPE_CONFIG[notification.type];
                const priorityConfig = PRIORITY_CONFIG[notification.priority];
                const Icon = typeConfig.icon;
                const isSelected = selectedIds.has(notification.id);

                const content = (
                  <div
                    className={cn(
                      'flex items-start gap-4 px-4 py-4 border-b border-slate-700/50 transition',
                      notification.read
                        ? 'opacity-60 hover:opacity-80 bg-slate-900/30'
                        : 'hover:bg-slate-800/30',
                      isSelected && 'bg-indigo-500/5'
                    )}
                  >
                    {/* Checkbox */}
                    <div className="pt-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleSelect(notification.id);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500/50"
                      />
                    </div>

                    {/* Icon */}
                    <div className="relative">
                      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', typeConfig.bgColor)}>
                        <Icon className={cn('w-5 h-5', typeConfig.color)} />
                      </div>
                      {!notification.read && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full border-2 border-slate-900" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className={cn('text-sm', notification.read ? 'text-slate-400' : 'text-white font-medium')}>
                          {notification.title}
                        </p>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge className={cn('text-[10px] px-1.5', priorityConfig.bgColor, priorityConfig.color)}>
                            {priorityConfig.label}
                          </Badge>
                          <span className="text-xs text-slate-500">
                            {getTimeAgo(notification.timestamp)}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-slate-500 line-clamp-2">
                        {notification.message}
                      </p>
                    </div>

                    {notification.href && (
                      <ChevronRight className="w-5 h-5 text-slate-500 mt-2 shrink-0" />
                    )}
                  </div>
                );

                if (notification.href) {
                  return (
                    <Link
                      key={notification.id}
                      href={notification.href}
                      onClick={() => markAsRead(notification.id)}
                    >
                      {content}
                    </Link>
                  );
                }

                return (
                  <div
                    key={notification.id}
                    onClick={() => markAsRead(notification.id)}
                    className="cursor-pointer"
                  >
                    {content}
                  </div>
                );
              })}
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
