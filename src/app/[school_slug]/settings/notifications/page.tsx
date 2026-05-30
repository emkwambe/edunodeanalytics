'use client';

/**
 * Notification Settings Page
 * ==========================
 *
 * Configure automated email notifications with tier-based feature gating.
 */

import * as React from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Bell,
  Mail,
  AlertTriangle,
  Calendar,
  Users,
  RefreshCw,
  Lock,
  Plus,
  X,
  Check,
  Crown,
} from 'lucide-react';
import { useCurrentSchool } from '@/lib/hooks/use-school-context';
import { useFeatureAccess } from '@/lib/hooks/use-feature-gate';
import { cn } from '@/lib/utils';

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  featureKey: 'risk_escalation_alerts' | 'weekly_digest' | 'sync_failure_alerts' | 'parent_notifications';
  tier: 'pro' | 'enterprise';
  enabled: boolean;
  recipients: string[];
  extraSettings?: React.ReactNode;
}

export default function NotificationSettingsPage() {
  const params = useParams();
  const schoolSlug = params.school_slug as string;
  const { schoolId, isLoading: isLoadingSchool } = useCurrentSchool(schoolSlug);

  // Feature gates
  const riskAlertsGate = useFeatureAccess('risk_escalation_alerts');
  const weeklyDigestGate = useFeatureAccess('weekly_digest');
  const syncAlertsGate = useFeatureAccess('sync_failure_alerts');
  const parentNotificationsGate = useFeatureAccess('parent_notifications');

  // Local state for settings
  const [settings, setSettings] = React.useState({
    risk_escalation: {
      enabled: true,
      recipients: ['principal@school.edu'],
      threshold: 'critical' as 'watch' | 'at_risk' | 'critical',
    },
    weekly_digest: {
      enabled: true,
      recipients: ['principal@school.edu', 'assistant@school.edu'],
      day: 'monday' as 'monday' | 'friday' | 'sunday',
    },
    sync_failure: {
      enabled: true,
      recipients: ['admin@school.edu'],
    },
    parent_notifications: {
      enabled: false,
      types: ['risk_change'] as ('risk_change' | 'intervention_update' | 'attendance_alert')[],
    },
  });

  const [saving, setSaving] = React.useState(false);
  const [newEmail, setNewEmail] = React.useState('');
  const [activeSection, setActiveSection] = React.useState<string | null>(null);

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        enabled: !prev[key].enabled,
      },
    }));
  };

  const handleAddRecipient = (key: 'risk_escalation' | 'weekly_digest' | 'sync_failure') => {
    if (!newEmail || !newEmail.includes('@')) return;

    setSettings(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        recipients: [...prev[key].recipients, newEmail],
      },
    }));
    setNewEmail('');
    setActiveSection(null);
  };

  const handleRemoveRecipient = (key: 'risk_escalation' | 'weekly_digest' | 'sync_failure', email: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        recipients: prev[key].recipients.filter(r => r !== email),
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/schools/${schoolId}/notification-preferences`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          risk_escalation_enabled: settings.risk_escalation.enabled,
          risk_escalation_threshold: settings.risk_escalation.threshold,
          risk_escalation_recipients: settings.risk_escalation.recipients,
          weekly_digest_enabled: settings.weekly_digest.enabled,
          weekly_digest_day: settings.weekly_digest.day,
          weekly_digest_recipients: settings.weekly_digest.recipients,
          sync_failure_alerts_enabled: settings.sync_failure.enabled,
          sync_failure_recipients: settings.sync_failure.recipients,
          parent_notifications_enabled: settings.parent_notifications.enabled,
          parent_notification_types: settings.parent_notifications.types,
        }),
      });

      if (response.ok) {
        // Show success toast
      }
    } catch (error) {
      console.error('Failed to save notification settings:', error);
    } finally {
      setSaving(false);
    }
  };

  if (isLoadingSchool) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const renderLockedOverlay = (tier: 'pro' | 'enterprise') => (
    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center rounded-lg z-10">
      <div className="text-center p-4">
        <Lock className="w-8 h-8 text-slate-500 mx-auto mb-2" />
        <p className="text-sm text-slate-400 mb-3">
          {tier === 'enterprise' ? 'Enterprise' : 'Professional'} feature
        </p>
        <Button size="sm" variant="outline">
          <Crown className="w-4 h-4 mr-2 text-amber-400" />
          Upgrade to unlock
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-500/20 rounded-lg">
              <Bell className="w-6 h-6 text-indigo-400" />
            </div>
            <h1 className="text-2xl font-bold">Notification Settings</h1>
          </div>
          <p className="text-slate-400">
            Configure automated email alerts and digest summaries for your team.
          </p>
        </div>

        <div className="space-y-6">
          {/* Risk Escalation Alerts */}
          <Card className={cn(
            "bg-slate-800/50 border-slate-700 relative overflow-hidden",
            !riskAlertsGate.hasAccess && "opacity-75"
          )}>
            {!riskAlertsGate.hasAccess && renderLockedOverlay('pro')}
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">Risk Escalation Alerts</CardTitle>
                  <CardDescription className="text-slate-400">
                    Get notified when students move to higher risk levels
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="bg-indigo-500/20 text-indigo-400">
                  Pro
                </Badge>
                <button
                  onClick={() => handleToggle('risk_escalation')}
                  className={cn(
                    "relative w-11 h-6 rounded-full transition-colors",
                    settings.risk_escalation.enabled ? "bg-indigo-600" : "bg-slate-600"
                  )}
                  disabled={!riskAlertsGate.hasAccess}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                    settings.risk_escalation.enabled ? "translate-x-6" : "translate-x-1"
                  )} />
                </button>
              </div>
            </CardHeader>
            {settings.risk_escalation.enabled && riskAlertsGate.hasAccess && (
              <CardContent className="pt-4 space-y-4">
                <div>
                  <Label className="text-sm text-slate-400 mb-2 block">Alert Threshold</Label>
                  <div className="flex gap-2">
                    {(['watch', 'at_risk', 'critical'] as const).map(level => (
                      <button
                        key={level}
                        onClick={() => setSettings(prev => ({
                          ...prev,
                          risk_escalation: { ...prev.risk_escalation, threshold: level }
                        }))}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                          settings.risk_escalation.threshold === level
                            ? level === 'critical' ? "bg-red-500/20 text-red-400 ring-1 ring-red-500/50"
                              : level === 'at_risk' ? "bg-orange-500/20 text-orange-400 ring-1 ring-orange-500/50"
                              : "bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/50"
                            : "bg-slate-700 text-slate-400 hover:bg-slate-600"
                        )}
                      >
                        {level.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Alert when students reach this level or higher
                  </p>
                </div>

                <div>
                  <Label className="text-sm text-slate-400 mb-2 block">Recipients</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {settings.risk_escalation.recipients.map(email => (
                      <div key={email} className="flex items-center gap-1 px-2 py-1 bg-slate-700 rounded-lg text-sm">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{email}</span>
                        <button
                          onClick={() => handleRemoveRecipient('risk_escalation', email)}
                          className="ml-1 text-slate-400 hover:text-red-400"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {activeSection === 'risk_escalation' ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="email"
                          placeholder="email@school.edu"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          className="h-8 w-48 bg-slate-700 border-slate-600"
                          onKeyDown={(e) => e.key === 'Enter' && handleAddRecipient('risk_escalation')}
                        />
                        <Button size="sm" variant="ghost" onClick={() => handleAddRecipient('risk_escalation')}>
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setActiveSection(null)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setActiveSection('risk_escalation')}
                        className="flex items-center gap-1 px-2 py-1 bg-slate-700/50 rounded-lg text-sm text-slate-400 hover:bg-slate-600"
                      >
                        <Plus className="w-3 h-3" />
                        Add recipient
                      </button>
                    )}
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Weekly Digest */}
          <Card className={cn(
            "bg-slate-800/50 border-slate-700 relative overflow-hidden",
            !weeklyDigestGate.hasAccess && "opacity-75"
          )}>
            {!weeklyDigestGate.hasAccess && renderLockedOverlay('pro')}
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 rounded-lg">
                  <Calendar className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">Weekly Digest</CardTitle>
                  <CardDescription className="text-slate-400">
                    Summary of school performance sent to principals
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="bg-indigo-500/20 text-indigo-400">
                  Pro
                </Badge>
                <button
                  onClick={() => handleToggle('weekly_digest')}
                  className={cn(
                    "relative w-11 h-6 rounded-full transition-colors",
                    settings.weekly_digest.enabled ? "bg-indigo-600" : "bg-slate-600"
                  )}
                  disabled={!weeklyDigestGate.hasAccess}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                    settings.weekly_digest.enabled ? "translate-x-6" : "translate-x-1"
                  )} />
                </button>
              </div>
            </CardHeader>
            {settings.weekly_digest.enabled && weeklyDigestGate.hasAccess && (
              <CardContent className="pt-4 space-y-4">
                <div>
                  <Label className="text-sm text-slate-400 mb-2 block">Send On</Label>
                  <div className="flex gap-2">
                    {(['monday', 'friday', 'sunday'] as const).map(day => (
                      <button
                        key={day}
                        onClick={() => setSettings(prev => ({
                          ...prev,
                          weekly_digest: { ...prev.weekly_digest, day }
                        }))}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                          settings.weekly_digest.day === day
                            ? "bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500/50"
                            : "bg-slate-700 text-slate-400 hover:bg-slate-600"
                        )}
                      >
                        {day.charAt(0).toUpperCase() + day.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm text-slate-400 mb-2 block">Recipients</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {settings.weekly_digest.recipients.map(email => (
                      <div key={email} className="flex items-center gap-1 px-2 py-1 bg-slate-700 rounded-lg text-sm">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{email}</span>
                        <button
                          onClick={() => handleRemoveRecipient('weekly_digest', email)}
                          className="ml-1 text-slate-400 hover:text-red-400"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {activeSection === 'weekly_digest' ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="email"
                          placeholder="email@school.edu"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          className="h-8 w-48 bg-slate-700 border-slate-600"
                          onKeyDown={(e) => e.key === 'Enter' && handleAddRecipient('weekly_digest')}
                        />
                        <Button size="sm" variant="ghost" onClick={() => handleAddRecipient('weekly_digest')}>
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setActiveSection(null)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setActiveSection('weekly_digest')}
                        className="flex items-center gap-1 px-2 py-1 bg-slate-700/50 rounded-lg text-sm text-slate-400 hover:bg-slate-600"
                      >
                        <Plus className="w-3 h-3" />
                        Add recipient
                      </button>
                    )}
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Sync Failure Alerts */}
          <Card className={cn(
            "bg-slate-800/50 border-slate-700 relative overflow-hidden",
            !syncAlertsGate.hasAccess && "opacity-75"
          )}>
            {!syncAlertsGate.hasAccess && renderLockedOverlay('pro')}
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <RefreshCw className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">Sync Failure Alerts</CardTitle>
                  <CardDescription className="text-slate-400">
                    Immediate notification when data integrations fail
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="bg-indigo-500/20 text-indigo-400">
                  Pro
                </Badge>
                <button
                  onClick={() => handleToggle('sync_failure')}
                  className={cn(
                    "relative w-11 h-6 rounded-full transition-colors",
                    settings.sync_failure.enabled ? "bg-indigo-600" : "bg-slate-600"
                  )}
                  disabled={!syncAlertsGate.hasAccess}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                    settings.sync_failure.enabled ? "translate-x-6" : "translate-x-1"
                  )} />
                </button>
              </div>
            </CardHeader>
            {settings.sync_failure.enabled && syncAlertsGate.hasAccess && (
              <CardContent className="pt-4">
                <div>
                  <Label className="text-sm text-slate-400 mb-2 block">Recipients</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {settings.sync_failure.recipients.map(email => (
                      <div key={email} className="flex items-center gap-1 px-2 py-1 bg-slate-700 rounded-lg text-sm">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{email}</span>
                        <button
                          onClick={() => handleRemoveRecipient('sync_failure', email)}
                          className="ml-1 text-slate-400 hover:text-red-400"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {activeSection === 'sync_failure' ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="email"
                          placeholder="email@school.edu"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          className="h-8 w-48 bg-slate-700 border-slate-600"
                          onKeyDown={(e) => e.key === 'Enter' && handleAddRecipient('sync_failure')}
                        />
                        <Button size="sm" variant="ghost" onClick={() => handleAddRecipient('sync_failure')}>
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setActiveSection(null)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setActiveSection('sync_failure')}
                        className="flex items-center gap-1 px-2 py-1 bg-slate-700/50 rounded-lg text-sm text-slate-400 hover:bg-slate-600"
                      >
                        <Plus className="w-3 h-3" />
                        Add recipient
                      </button>
                    )}
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Parent Notifications */}
          <Card className={cn(
            "bg-slate-800/50 border-slate-700 relative overflow-hidden",
            !parentNotificationsGate.hasAccess && "opacity-75"
          )}>
            {!parentNotificationsGate.hasAccess && renderLockedOverlay('enterprise')}
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-violet-500/20 rounded-lg">
                  <Users className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">Parent Notifications</CardTitle>
                  <CardDescription className="text-slate-400">
                    Automated communications to parents/guardians
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="bg-violet-500/20 text-violet-400">
                  Enterprise
                </Badge>
                <button
                  onClick={() => handleToggle('parent_notifications')}
                  className={cn(
                    "relative w-11 h-6 rounded-full transition-colors",
                    settings.parent_notifications.enabled ? "bg-indigo-600" : "bg-slate-600"
                  )}
                  disabled={!parentNotificationsGate.hasAccess}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                    settings.parent_notifications.enabled ? "translate-x-6" : "translate-x-1"
                  )} />
                </button>
              </div>
            </CardHeader>
            {settings.parent_notifications.enabled && parentNotificationsGate.hasAccess && (
              <CardContent className="pt-4">
                <div>
                  <Label className="text-sm text-slate-400 mb-2 block">Notification Types</Label>
                  <div className="space-y-2">
                    {[
                      { id: 'risk_change', label: 'Risk Level Changes', desc: 'When a student moves to a higher risk tier' },
                      { id: 'intervention_update', label: 'Intervention Updates', desc: 'Progress updates on active interventions' },
                      { id: 'attendance_alert', label: 'Attendance Alerts', desc: 'Chronic absence warnings' },
                    ].map(type => (
                      <label
                        key={type.id}
                        className="flex items-start gap-3 p-3 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-700"
                      >
                        <input
                          type="checkbox"
                          checked={settings.parent_notifications.types.includes(type.id as any)}
                          onChange={(e) => {
                            const types = e.target.checked
                              ? [...settings.parent_notifications.types, type.id as any]
                              : settings.parent_notifications.types.filter(t => t !== type.id);
                            setSettings(prev => ({
                              ...prev,
                              parent_notifications: { ...prev.parent_notifications, types }
                            }));
                          }}
                          className="mt-1 rounded border-slate-500 bg-slate-600 text-indigo-500 focus:ring-indigo-500"
                        />
                        <div>
                          <div className="font-medium text-sm">{type.label}</div>
                          <div className="text-xs text-slate-400">{type.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Save Preferences
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
