'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/layout/dashboard-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  User,
  Mail,
  Bell,
  Shield,
  Eye,
  Download,
  Lock,
  Smartphone,
  Monitor,
  Calendar,
  List,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileText,
  KeyRound,
  LogOut,
  Camera,
  Save,
} from 'lucide-react';

/**
 * Account Settings Page
 *
 * User-level profile and preferences including:
 * - Profile & Identity
 * - Notification Preferences
 * - Display Preferences
 * - Security & Sessions
 * - Data & Privacy (FERPA)
 */

type AccountTab = 'profile' | 'notifications' | 'display' | 'security' | 'privacy';

const TABS: { id: AccountTab; label: string; icon: React.ReactNode }[] = [
  { id: 'profile', label: 'Profile', icon: <User size={16} /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
  { id: 'display', label: 'Display', icon: <Eye size={16} /> },
  { id: 'security', label: 'Security', icon: <Shield size={16} /> },
  { id: 'privacy', label: 'Data & Privacy', icon: <Lock size={16} /> },
];

const ACTIVE_SESSIONS = [
  {
    id: '1',
    device: 'Chrome on MacOS',
    icon: Monitor,
    location: 'New York, NY',
    lastActive: 'Now',
    current: true,
  },
  {
    id: '2',
    device: 'Safari on iPhone',
    icon: Smartphone,
    location: 'New York, NY',
    lastActive: '2 hours ago',
    current: false,
  },
  {
    id: '3',
    device: 'Firefox on Windows',
    icon: Monitor,
    location: 'Brooklyn, NY',
    lastActive: '3 days ago',
    current: false,
  },
];

export default function AccountPage() {
  const params = useParams();
  const school_slug = params.school_slug as string;

  const [activeTab, setActiveTab] = React.useState<AccountTab>('profile');
  const [isSaving, setIsSaving] = React.useState(false);

  // Profile state
  const [profile, setProfile] = React.useState({
    displayName: 'Dr. Sarah Johnson',
    email: 'sarah.johnson@school.org',
    role: 'School Admin',
    school: school_slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    avatarInitials: 'SJ',
  });

  // Notification preferences state
  const [notifications, setNotifications] = React.useState({
    weeklyDigest: true,
    riskAlerts: true,
    dataSyncNotifications: false,
    interventionReminders: true,
    teamActivity: false,
  });

  // Display preferences state
  const [display, setDisplay] = React.useState({
    defaultView: 'overview' as 'overview' | 'students' | 'attendance' | 'assessments',
    dateFormat: 'MM/DD/YYYY' as 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD',
    itemsPerPage: 25 as 10 | 25 | 50 | 100,
  });

  // Security state
  const [security, setSecurity] = React.useState({
    twoFactorEnabled: false,
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Privacy state
  const [privacy, setPrivacy] = React.useState({
    ferpaAcknowledged: true,
    ferpaDate: '2025-08-15',
    exportRequested: false,
    lastExportDate: '2025-01-10',
  });

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePasswordChange = () => {
    if (security.newPassword !== security.confirmPassword) return;
    setSecurity((prev) => ({
      ...prev,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    }));
  };

  const handleExportRequest = () => {
    setPrivacy((prev) => ({ ...prev, exportRequested: true }));
  };

  return (
    <>
      <PageHeader
        title="Account Settings"
        description="Manage your profile, preferences, and security settings"
        actions={
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <span className="animate-spin mr-2">
                  <Clock className="w-4 h-4" />
                </span>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        }
      />

      <div className="flex gap-6">
        {/* Sidebar Navigation */}
        <div className="w-48 flex-shrink-0 space-y-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition',
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-6">
          {/* ─── Profile Section ─── */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Profile Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Avatar + Role */}
                  <div className="flex items-center gap-5 p-4 bg-slate-800/50 rounded-xl">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-2xl font-bold text-white">
                        {profile.avatarInitials}
                      </div>
                      <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-slate-700 border-2 border-slate-900 rounded-full flex items-center justify-center text-slate-300 hover:bg-slate-600 transition">
                        <Camera className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white">{profile.displayName}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="bg-indigo-500/20 text-indigo-400 text-[10px]">
                          {profile.role}
                        </Badge>
                        <span className="text-xs text-slate-500">{profile.school}</span>
                      </div>
                    </div>
                  </div>

                  {/* Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={profile.displayName}
                        onChange={(e) =>
                          setProfile({ ...profile, displayName: e.target.value })
                        }
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input
                          type="email"
                          value={profile.email}
                          onChange={(e) =>
                            setProfile({ ...profile, email: e.target.value })
                          }
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white text-sm focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">Role</label>
                      <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2">
                        <Shield className="w-4 h-4 text-indigo-400" />
                        <span className="text-sm text-slate-300">{profile.role}</span>
                        <Badge className="ml-auto bg-slate-700 text-slate-400 text-[10px]">
                          Managed by Admin
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">School</label>
                      <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2">
                        <span className="text-sm text-slate-300">{profile.school}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ─── Notification Preferences ─── */}
          {activeTab === 'notifications' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <Card className="bg-indigo-900/20 border-indigo-500/30">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Bell className="w-5 h-5 text-indigo-400" />
                    <span className="font-bold text-white">Email Notification Preferences</span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Control which email notifications you receive. Critical security
                    alerts cannot be disabled.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Alert Types</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    {
                      key: 'weeklyDigest' as const,
                      label: 'Weekly Digest',
                      desc: 'Receive a summary of key metrics and trends every Monday morning',
                      icon: Calendar,
                    },
                    {
                      key: 'riskAlerts' as const,
                      label: 'Student Risk Alerts',
                      desc: 'Immediate notification when a student moves to critical risk status',
                      icon: AlertTriangle,
                    },
                    {
                      key: 'dataSyncNotifications' as const,
                      label: 'Data Sync Notifications',
                      desc: 'Alerts when SIS data syncs complete or encounter errors',
                      icon: Clock,
                    },
                    {
                      key: 'interventionReminders' as const,
                      label: 'Intervention Reminders',
                      desc: 'Reminders for stale interventions needing updated data points',
                      icon: FileText,
                    },
                    {
                      key: 'teamActivity' as const,
                      label: 'Team Activity',
                      desc: 'Notifications when team members update shared dashboards or reports',
                      icon: User,
                    },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                          <item.icon className="w-4 h-4 text-slate-400" />
                        </div>
                        <div>
                          <div className="font-medium text-white text-sm">{item.label}</div>
                          <div className="text-xs text-slate-500">{item.desc}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleNotification(item.key)}
                        className={cn(
                          'w-12 h-6 rounded-full transition-all relative flex-shrink-0',
                          notifications[item.key] ? 'bg-indigo-600' : 'bg-slate-700'
                        )}
                      >
                        <span
                          className={cn(
                            'absolute top-1 w-4 h-4 rounded-full bg-white transition-all',
                            notifications[item.key] ? 'left-7' : 'left-1'
                          )}
                        />
                      </button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {/* ─── Display Preferences ─── */}
          {activeTab === 'display' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Default Dashboard View</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {(
                      [
                        { value: 'overview', label: 'Overview', desc: 'High-level metrics and trends' },
                        { value: 'students', label: 'Students', desc: 'Student roster and risk statuses' },
                        { value: 'attendance', label: 'Attendance', desc: 'Attendance tracking and patterns' },
                        { value: 'assessments', label: 'Assessments', desc: 'Assessment scores and growth' },
                      ] as const
                    ).map((option) => (
                      <button
                        key={option.value}
                        onClick={() =>
                          setDisplay({ ...display, defaultView: option.value })
                        }
                        className={cn(
                          'p-4 rounded-xl border-2 transition text-left',
                          display.defaultView === option.value
                            ? 'border-cyan-500 bg-cyan-900/10'
                            : 'border-slate-700 hover:border-slate-600'
                        )}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-white text-sm">{option.label}</span>
                          {display.defaultView === option.value && (
                            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                          )}
                        </div>
                        <p className="text-xs text-slate-500">{option.desc}</p>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Formatting</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">
                        Date Format
                      </label>
                      <select
                        value={display.dateFormat}
                        onChange={(e) =>
                          setDisplay({
                            ...display,
                            dateFormat: e.target.value as typeof display.dateFormat,
                          })
                        }
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm focus:border-indigo-500 focus:outline-none"
                      >
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">
                        Items Per Page
                      </label>
                      <select
                        value={display.itemsPerPage}
                        onChange={(e) =>
                          setDisplay({
                            ...display,
                            itemsPerPage: parseInt(e.target.value) as typeof display.itemsPerPage,
                          })
                        }
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm focus:border-indigo-500 focus:outline-none"
                      >
                        <option value={10}>10 items</option>
                        <option value={25}>25 items</option>
                        <option value={50}>50 items</option>
                        <option value={100}>100 items</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-800/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <List className="w-4 h-4 text-slate-500" />
                      <span className="text-xs text-slate-500">
                        Preview: Today is{' '}
                        <span className="text-cyan-400 font-medium">
                          {display.dateFormat === 'MM/DD/YYYY'
                            ? '02/25/2026'
                            : display.dateFormat === 'DD/MM/YYYY'
                              ? '25/02/2026'
                              : '2026-02-25'}
                        </span>{' '}
                        &mdash; Showing{' '}
                        <span className="text-cyan-400 font-medium">
                          {display.itemsPerPage}
                        </span>{' '}
                        rows per table
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ─── Security ─── */}
          {activeTab === 'security' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Change Password</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">
                      Current Password
                    </label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                      <input
                        type="password"
                        value={security.currentPassword}
                        onChange={(e) =>
                          setSecurity({ ...security, currentPassword: e.target.value })
                        }
                        placeholder="Enter current password"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white text-sm focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={security.newPassword}
                        onChange={(e) =>
                          setSecurity({ ...security, newPassword: e.target.value })
                        }
                        placeholder="Enter new password"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={security.confirmPassword}
                        onChange={(e) =>
                          setSecurity({ ...security, confirmPassword: e.target.value })
                        }
                        placeholder="Confirm new password"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  {security.newPassword &&
                    security.confirmPassword &&
                    security.newPassword !== security.confirmPassword && (
                      <p className="text-xs text-red-400">Passwords do not match</p>
                    )}
                  <Button
                    onClick={handlePasswordChange}
                    disabled={
                      !security.currentPassword ||
                      !security.newPassword ||
                      security.newPassword !== security.confirmPassword
                    }
                    size="sm"
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    Update Password
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Two-Factor Authentication</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          'w-12 h-12 rounded-xl flex items-center justify-center',
                          security.twoFactorEnabled
                            ? 'bg-emerald-500/20'
                            : 'bg-slate-700'
                        )}
                      >
                        <Smartphone
                          className={cn(
                            'w-6 h-6',
                            security.twoFactorEnabled
                              ? 'text-emerald-400'
                              : 'text-slate-400'
                          )}
                        />
                      </div>
                      <div>
                        <div className="font-medium text-white">
                          Two-Factor Authentication
                        </div>
                        <div className="text-xs text-slate-500">
                          Add an extra layer of security to your account
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        className={cn(
                          'text-[10px]',
                          security.twoFactorEnabled
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-slate-700 text-slate-400'
                        )}
                      >
                        {security.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                      <Button
                        variant={security.twoFactorEnabled ? 'outline' : 'default'}
                        size="sm"
                        onClick={() =>
                          setSecurity({
                            ...security,
                            twoFactorEnabled: !security.twoFactorEnabled,
                          })
                        }
                      >
                        {security.twoFactorEnabled ? 'Disable' : 'Enable'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Active Sessions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {ACTIVE_SESSIONS.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                          <session.icon className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white text-sm">
                              {session.device}
                            </span>
                            {session.current && (
                              <Badge className="bg-cyan-500/20 text-cyan-400 text-[10px]">
                                Current
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-slate-500">
                            {session.location} &middot; {session.lastActive}
                          </div>
                        </div>
                      </div>
                      {!session.current && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-500 hover:text-rose-400"
                        >
                          <LogOut className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {/* ─── Data & Privacy ─── */}
          {activeTab === 'privacy' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <Card className="bg-emerald-900/10 border-emerald-500/30">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Shield className="w-5 h-5 text-emerald-400" />
                    <span className="font-bold text-white">FERPA Compliance</span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    EduNode Analytics is committed to protecting student data in accordance
                    with the Family Educational Rights and Privacy Act (FERPA). All data
                    handling follows federal guidelines for student record privacy.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">FERPA Acknowledgment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          'w-12 h-12 rounded-xl flex items-center justify-center',
                          privacy.ferpaAcknowledged
                            ? 'bg-emerald-500/20'
                            : 'bg-amber-500/20'
                        )}
                      >
                        <FileText
                          className={cn(
                            'w-6 h-6',
                            privacy.ferpaAcknowledged
                              ? 'text-emerald-400'
                              : 'text-amber-400'
                          )}
                        />
                      </div>
                      <div>
                        <div className="font-medium text-white">
                          FERPA Data Privacy Agreement
                        </div>
                        <div className="text-xs text-slate-500">
                          {privacy.ferpaAcknowledged
                            ? `Acknowledged on ${new Date(privacy.ferpaDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
                            : 'Pending acknowledgment'}
                        </div>
                      </div>
                    </div>
                    <Badge
                      className={cn(
                        'text-[10px]',
                        privacy.ferpaAcknowledged
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-amber-500/20 text-amber-400'
                      )}
                    >
                      {privacy.ferpaAcknowledged ? 'Acknowledged' : 'Pending'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Data Export</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-slate-400">
                    Request a full export of your account data and associated records.
                    Exports are prepared within 48 hours and delivered via secure download link.
                  </p>

                  <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl">
                    <div>
                      <div className="font-medium text-white text-sm">Last Export</div>
                      <div className="text-xs text-slate-500">
                        {new Date(privacy.lastExportDate).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                    </div>
                    <Button
                      variant={privacy.exportRequested ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={handleExportRequest}
                      disabled={privacy.exportRequested}
                    >
                      {privacy.exportRequested ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Request Submitted
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Request Export
                        </>
                      )}
                    </Button>
                  </div>

                  {privacy.exportRequested && (
                    <div className="flex items-center gap-2 p-3 bg-indigo-900/20 border border-indigo-500/30 rounded-lg">
                      <Clock className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                      <span className="text-xs text-indigo-300">
                        Your data export is being prepared. You will receive an email with
                        a secure download link within 48 hours.
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Data Retention</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      {
                        label: 'Student Assessment Records',
                        retention: '7 years',
                        status: 'Active',
                      },
                      {
                        label: 'Attendance Data',
                        retention: '5 years',
                        status: 'Active',
                      },
                      {
                        label: 'Intervention Logs',
                        retention: '5 years',
                        status: 'Active',
                      },
                      {
                        label: 'Audit Trail',
                        retention: '3 years',
                        status: 'Active',
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg"
                      >
                        <div>
                          <div className="font-medium text-white text-sm">{item.label}</div>
                          <div className="text-xs text-slate-500">
                            Retained for {item.retention}
                          </div>
                        </div>
                        <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px]">
                          {item.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
