'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import {
  PageHeader,
} from '@/components/layout/dashboard-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Building2,
  Users,
  Clock,
  Palette,
  Target,
  ArrowRight,
  CheckCircle2,
  Zap,
  AlertTriangle,
  Calendar,
  Upload,
  Mail,
  Plus,
  Settings,
  Shield,
  Database,
  Bell,
  CreditCard,
  Trash2,
  ExternalLink,
} from 'lucide-react';

/**
 * School Settings Page
 *
 * Comprehensive tenant configuration hub including:
 * - School Identity & White-Labeling
 * - Data Cadence & Clinical Thresholds
 * - Staff Management with RBAC
 * - Subscription & Billing
 * - Integrations (Clever, BigQuery)
 */

import Link from 'next/link';
import { Sliders } from 'lucide-react';

type SettingsTab = 'general' | 'cadence' | 'team' | 'integrations' | 'billing';

const TABS: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { id: 'general', label: 'General', icon: <Building2 size={16} /> },
  { id: 'cadence', label: 'Data Cadence', icon: <Clock size={16} /> },
  { id: 'team', label: 'Team & RBAC', icon: <Users size={16} /> },
  { id: 'integrations', label: 'Integrations', icon: <Database size={16} /> },
  { id: 'billing', label: 'Billing', icon: <CreditCard size={16} /> },
];

interface NavLink {
  href: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const getNavLinks = (schoolSlug: string): NavLink[] => [
  {
    href: `/${schoolSlug}/settings/import`,
    label: 'Import Data',
    icon: <Upload size={16} />,
    description: 'Import CSV files',
  },
  {
    href: `/${schoolSlug}/settings/risk-model`,
    label: 'Risk Model',
    icon: <Sliders size={16} />,
    description: 'Configure risk weights',
  },
];

const COLOR_OPTIONS = [
  { name: 'Indigo', value: '#6366f1', class: 'bg-indigo-500' },
  { name: 'Cyan', value: '#06b6d4', class: 'bg-cyan-500' },
  { name: 'Emerald', value: '#10b981', class: 'bg-emerald-500' },
  { name: 'Violet', value: '#8b5cf6', class: 'bg-violet-500' },
  { name: 'Rose', value: '#f43f5e', class: 'bg-rose-500' },
  { name: 'Amber', value: '#f59e0b', class: 'bg-amber-500' },
];

// Mock team data
const TEAM_MEMBERS = [
  { id: '1', email: 'principal@school.org', name: 'Dr. Sarah Johnson', role: 'School Admin', status: 'Active' },
  { id: '2', email: 'ap@school.org', name: 'Michael Chen', role: 'Data Manager', status: 'Active' },
  { id: '3', email: 'math@school.org', name: 'Lisa Rodriguez', role: 'Teacher', status: 'Active' },
  { id: '4', email: 'ela@school.org', name: 'James Wilson', role: 'Teacher', status: 'Pending' },
];

export default function SettingsPage() {
  const params = useParams();
  const school_slug = params.school_slug as string;

  const [activeTab, setActiveTab] = React.useState<SettingsTab>('general');
  const [isSaving, setIsSaving] = React.useState(false);

  // Settings state
  const [settings, setSettings] = React.useState({
    name: school_slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    slug: school_slug,
    primaryColor: '#6366f1',
    cadence: 'weekly' as 'weekly' | 'biweekly',
    masteryThreshold: 80,
    diagnosticWindow: 21,
    notifications: {
      weeklyDigest: true,
      staleInterventions: true,
      lowAttendanceAlerts: true,
    },
  });

  const [newInviteEmail, setNewInviteEmail] = React.useState('');
  const [newInviteRole, setNewInviteRole] = React.useState('Teacher');

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  return (
    <>
      <PageHeader
        title="School Settings"
        description="Configure your school's data culture and platform settings"
        actions={
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Saving...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
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

          {/* Divider */}
          <div className="py-2">
            <div className="border-t border-slate-700" />
          </div>

          {/* Additional Pages */}
          {getNavLinks(school_slug).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">School Identity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">School Name</label>
                      <input
                        type="text"
                        value={settings.name}
                        onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">Subdomain</label>
                      <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg px-4">
                        <span className="text-slate-500 text-sm">edunode.com/</span>
                        <input
                          type="text"
                          value={settings.slug}
                          readOnly
                          className="bg-transparent py-2 flex-grow focus:outline-none text-sm font-bold text-indigo-400"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl">
                    <div className="w-16 h-16 bg-slate-700 rounded-xl flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">{settings.name.charAt(0)}</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-white">School Logo</div>
                      <div className="text-xs text-slate-500">PNG or SVG, max 2MB</div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Upload className="w-4 h-4 mr-2" />
                      Change Logo
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Brand Color</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {COLOR_OPTIONS.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => setSettings({ ...settings, primaryColor: color.value })}
                        className={cn(
                          'w-12 h-12 rounded-xl transition-all',
                          color.class,
                          settings.primaryColor === color.value
                            ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900'
                            : 'hover:scale-110'
                        )}
                        title={color.name}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Notifications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { key: 'weeklyDigest', label: 'Weekly Dashboard Digest', desc: 'Summary of key metrics every Monday' },
                    { key: 'staleInterventions', label: 'Stale Intervention Alerts', desc: 'Notify when data is over 21 days old' },
                    { key: 'lowAttendanceAlerts', label: 'Low Attendance Warnings', desc: 'Alert for students below 90% attendance' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                      <div>
                        <div className="font-medium text-white text-sm">{item.label}</div>
                        <div className="text-xs text-slate-500">{item.desc}</div>
                      </div>
                      <button
                        onClick={() =>
                          setSettings({
                            ...settings,
                            notifications: {
                              ...settings.notifications,
                              [item.key]: !settings.notifications[item.key as keyof typeof settings.notifications],
                            },
                          })
                        }
                        className={cn(
                          'w-12 h-6 rounded-full transition-all relative',
                          settings.notifications[item.key as keyof typeof settings.notifications]
                            ? 'bg-indigo-600'
                            : 'bg-slate-700'
                        )}
                      >
                        <span
                          className={cn(
                            'absolute top-1 w-4 h-4 rounded-full bg-white transition-all',
                            settings.notifications[item.key as keyof typeof settings.notifications]
                              ? 'left-7'
                              : 'left-1'
                          )}
                        />
                      </button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Data Cadence Settings */}
          {activeTab === 'cadence' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <Card className="bg-indigo-900/20 border-indigo-500/30">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Zap className="w-5 h-5 text-indigo-400" />
                    <span className="font-bold text-white">Clinical Data Standards</span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    These settings define your school&apos;s &quot;data culture&quot; and directly impact the
                    accuracy of EduNode&apos;s predictive models.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Assessment Entry Cadence</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setSettings({ ...settings, cadence: 'weekly' })}
                      className={cn(
                        'p-4 rounded-xl border-2 transition text-left',
                        settings.cadence === 'weekly'
                          ? 'border-cyan-500 bg-cyan-900/10'
                          : 'border-slate-700 hover:border-slate-600'
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Clock className="w-5 h-5 text-cyan-400" />
                        {settings.cadence === 'weekly' && (
                          <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                        )}
                      </div>
                      <h4 className="font-bold text-white">Weekly</h4>
                      <p className="text-xs text-slate-400 mt-1">2+ entries per week</p>
                      <Badge className="mt-2 bg-cyan-500/20 text-cyan-400 text-[10px]">
                        +45% Accuracy
                      </Badge>
                    </button>

                    <button
                      onClick={() => setSettings({ ...settings, cadence: 'biweekly' })}
                      className={cn(
                        'p-4 rounded-xl border-2 transition text-left',
                        settings.cadence === 'biweekly'
                          ? 'border-indigo-500 bg-indigo-900/10'
                          : 'border-slate-700 hover:border-slate-600'
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Calendar className="w-5 h-5 text-indigo-400" />
                        {settings.cadence === 'biweekly' && (
                          <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                        )}
                      </div>
                      <h4 className="font-bold text-white">Bi-Weekly</h4>
                      <p className="text-xs text-slate-400 mt-1">14-day cycles</p>
                    </button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Clinical Thresholds</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <label className="text-slate-400">Mastery Threshold</label>
                      <span className="font-bold text-cyan-400">{settings.masteryThreshold}%</span>
                    </div>
                    <input
                      type="range"
                      min="60"
                      max="90"
                      value={settings.masteryThreshold}
                      onChange={(e) => setSettings({ ...settings, masteryThreshold: parseInt(e.target.value) })}
                      className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer"
                    />
                    <p className="text-xs text-slate-500">
                      Students at or above this threshold exit Tier 2 interventions
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <label className="text-slate-400">Diagnostic Window</label>
                      <span className="font-bold text-amber-400">{settings.diagnosticWindow} days</span>
                    </div>
                    <input
                      type="range"
                      min="14"
                      max="30"
                      value={settings.diagnosticWindow}
                      onChange={(e) => setSettings({ ...settings, diagnosticWindow: parseInt(e.target.value) })}
                      className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer"
                    />
                    <p className="text-xs text-slate-500">
                      Interventions without data after this period are marked &quot;Stale&quot;
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Team & RBAC */}
          {activeTab === 'team' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Invite Team Member</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <div className="relative flex-grow">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                      <input
                        type="email"
                        placeholder="email@school.org"
                        value={newInviteEmail}
                        onChange={(e) => setNewInviteEmail(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white text-sm focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                    <select
                      value={newInviteRole}
                      onChange={(e) => setNewInviteRole(e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="Teacher">Teacher</option>
                      <option value="Data Manager">Data Manager</option>
                      <option value="School Admin">School Admin</option>
                      <option value="Authorizer">Authorizer (Read-Only)</option>
                    </select>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-1" />
                      Invite
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Team Members</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {TEAM_MEMBERS.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
                            {member.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-white text-sm">{member.name}</div>
                            <div className="text-xs text-slate-500">{member.email}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge
                            className={cn(
                              'text-[10px]',
                              member.role === 'School Admin' && 'bg-indigo-500/20 text-indigo-400',
                              member.role === 'Data Manager' && 'bg-cyan-500/20 text-cyan-400',
                              member.role === 'Teacher' && 'bg-slate-700 text-slate-300'
                            )}
                          >
                            {member.role}
                          </Badge>
                          <Badge
                            className={cn(
                              'text-[10px]',
                              member.status === 'Active'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-amber-500/20 text-amber-400'
                            )}
                          >
                            {member.status}
                          </Badge>
                          <Button variant="ghost" size="sm" className="text-slate-500 hover:text-rose-400">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-emerald-900/10 border-emerald-500/30">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Shield className="w-5 h-5 text-emerald-400" />
                    <span className="font-bold text-white">Invite Charter Authorizer</span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed mb-4">
                    Give your charter authorizer read-only access to the Renewal Evidence dashboard
                    to build trust proactively.
                  </p>
                  <Button className="bg-emerald-600 hover:bg-emerald-700">
                    <Users className="w-4 h-4 mr-2" />
                    Open Authorizer Hub
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Integrations */}
          {activeTab === 'integrations' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Connected Services</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 text-xl font-bold">
                        C
                      </div>
                      <div>
                        <div className="font-medium text-white">Clever</div>
                        <div className="text-xs text-slate-500">Roster sync & SSO</div>
                      </div>
                    </div>
                    <Badge className="bg-emerald-500/20 text-emerald-400">Connected</Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-400 text-xl font-bold">
                        BQ
                      </div>
                      <div>
                        <div className="font-medium text-white">BigQuery</div>
                        <div className="text-xs text-slate-500">Data warehouse</div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Configure
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400 text-xl font-bold">
                        dbt
                      </div>
                      <div>
                        <div className="font-medium text-white">dbt Cloud</div>
                        <div className="text-xs text-slate-500">Data transformations</div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Connect
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Billing */}
          {activeTab === 'billing' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <Card className="bg-gradient-to-br from-indigo-900/30 to-cyan-900/30 border-indigo-500/30">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <Badge className="bg-indigo-500/20 text-indigo-400 mb-2">Professional</Badge>
                      <h3 className="text-2xl font-black text-white">$299/month</h3>
                      <p className="text-sm text-slate-400">Billed annually</p>
                    </div>
                    <Button variant="outline">Manage Plan</Button>
                  </div>
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-700">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">500</div>
                      <div className="text-xs text-slate-500">Students</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">25</div>
                      <div className="text-xs text-slate-500">Staff Seats</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-400">Active</div>
                      <div className="text-xs text-slate-500">Status</div>
                    </div>
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
